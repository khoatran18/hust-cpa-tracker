import re
from collections import defaultdict

GRADE_ORDER = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F"]

DIEM_CHU_TO_4 = {
    "A+": 4.0, "A": 4.0,
    "B+": 3.5, "B": 3.0,
    "C+": 2.5, "C": 2.0,
    "D+": 1.5, "D": 1.0,
    "F": 0.0,
}


def extract_module_number(loai_hp: str):
    """
    Loại HP: Mô đun 3 (Count=4, ...)
    -> 3
    """
    if loai_hp is None:
        return None
    m = re.search(r"Mô đun\s+(\d+)", loai_hp)
    if m:
        return int(m.group(1))
    return None


def detect_available_modules(transcript: list) -> list[int]:
    """
    Scan raw transcript để tìm tất cả số module unique
    từ các môn có loaiHP dạng 'Loại HP: Mô đun x ...'
    """
    modules = set()
    for course in transcript:
        num = extract_module_number(course.get("loaiHP", ""))
        if num is not None:
            modules.add(num)
    return sorted(modules)


def preprocess_for_display(transcript: list) -> list:
    """
    Tiền xử lý để HIỂN THỊ bảng điểm — giữ lại tất cả môn (kể cả module chưa chọn):
    1. Bỏ môn 0 tín
    2. Bỏ môn điểm R
    Không lọc module — course table sẽ show tất cả.
    """
    return [
        course for course in transcript
        if course["tinChi"] != 0 and course.get("diemChu") != "R"
    ]


def preprocess_for_stats(transcript: list, selected_modules: list[int]) -> list:
    """
    Tiền xử lý để TÍNH TOÁN THỐNG KÊ — lọc theo module được chọn:
    1. Bỏ môn 0 tín
    2. Bỏ môn điểm R
    3. Loại bỏ môn thuộc Mô đun không được chọn
    """
    result = []
    for course in transcript:
        if course["tinChi"] == 0:
            continue
        if course.get("diemChu") == "R":
            continue
        module = extract_module_number(course.get("loaiHP", ""))
        # Nếu là môn Mô đun và không được chọn → bỏ qua
        if module is not None and module not in selected_modules:
            continue
        result.append(course)
    return result


def compute_stats(processed: list) -> dict:
    """
    Tính toán thống kê từ danh sách môn đã lọc (cho stats).
    """
    # ---- Tổng tín chỉ yêu cầu ----
    credit_by_category = {}
    for course in processed:
        ma_loai = course["maLoaiHP"]
        if ma_loai in credit_by_category:
            continue
        # Trường hợp đặc biệt mã loại HP 320
        if "Mã loại HP: 320" in ma_loai:
            credit_by_category[ma_loai] = 9
            continue
        m = re.search(r"Tổng TC:\s*(\d+)", ma_loai)
        if m:
            credit_by_category[ma_loai] = int(m.group(1))

    total_required_credits = sum(credit_by_category.values())

    # ---- CPA hiện tại ----
    weighted_score = 0.0
    earned_credits = 0
    module320_credits = 0

    for course in processed:
        diem4 = course.get("diem4")
        if diem4 is None:
            continue
        tc = course["tinChi"]

        if "Mã loại HP: 320" in course["maLoaiHP"]:
            remaining = max(0, 9 - module320_credits)
            if remaining == 0:
                continue
            tc = min(tc, remaining)
            module320_credits += tc

        weighted_score += diem4 * tc
        earned_credits += tc

    current_cpa = (weighted_score / earned_credits) if earned_credits > 0 else 0.0
    remaining_credits = total_required_credits - earned_credits

    # ---- Phân phối điểm ----
    course_counter = defaultdict(int)
    credit_counter = defaultdict(int)
    module320_credits_dist = 0

    for course in processed:
        grade = course.get("diemChu")
        if grade is None:
            continue

        course_counter[grade] += 1

        tc = course["tinChi"]
        if "Mã loại HP: 320" in course["maLoaiHP"]:
            remain = max(0, 9 - module320_credits_dist)
            if remain == 0:
                continue
            tc = min(tc, remain)
            module320_credits_dist += tc

        credit_counter[grade] += tc

    grade_distribution = [
        {
            "grade": g,
            "courses": course_counter.get(g, 0),
            "credits": credit_counter.get(g, 0),
        }
        for g in GRADE_ORDER
    ]

    return {
        "total_required_credits": total_required_credits,
        "earned_credits": earned_credits,
        "remaining_credits": remaining_credits,
        "weighted_score": round(weighted_score, 4),
        "current_cpa": round(current_cpa, 4),
        "grade_distribution": grade_distribution,
    }


def compute_target_gpa(stats: dict, target_cpa: float) -> dict:
    """
    Tính GPA trung bình còn lại cần đạt để đạt target_cpa.
    """
    total_required = stats["total_required_credits"]
    weighted_score = stats["weighted_score"]
    remaining = stats["remaining_credits"]

    if remaining <= 0:
        return {
            "feasible": False,
            "message": "Không còn tín chỉ nào để học.",
            "required_gpa": None,
            "status": "error",
        }

    required_total = target_cpa * total_required
    required_remaining = required_total - weighted_score
    required_avg = required_remaining / remaining

    if required_avg > 4.0:
        status = "impossible"
        message = "❌ Mục tiêu không khả thi (cần GPA > 4.0)."
    elif required_avg >= 3.8:
        status = "very_hard"
        message = "⚠️ Rất khó, gần như phải đạt toàn A/A+."
    elif required_avg >= 3.5:
        status = "hard"
        message = "⚠️ Khó, cần phần lớn A và A+."
    elif required_avg >= 3.0:
        status = "feasible"
        message = "✅ Khả thi nếu giữ mức B+/A."
    elif required_avg >= 2.5:
        status = "easy"
        message = "✅ Khá dễ đạt."
    else:
        status = "very_easy"
        message = "✅ Hoàn toàn an toàn."

    return {
        "target_cpa": target_cpa,
        "required_gpa": round(required_avg, 4),
        "remaining_credits": remaining,
        "status": status,
        "message": message,
    }
