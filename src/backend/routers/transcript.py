from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import json

from services.file_service import (
    generate_filename,
    save_raw,
    save_preprocessed,
    load_raw,
    load_original,
    backup_original,
    restore_original,
    has_backup,
)
from services.preprocess import (
    detect_available_modules,
    preprocess_for_display,
    preprocess_for_stats,
    compute_stats,
    compute_target_gpa,
)

router = APIRouter(prefix="/api", tags=["transcript"])


# ─── Models ───────────────────────────────────────────────────────────────────

class UpdateCourseRequest(BaseModel):
    ma_hp: str
    diem_chu: str | None
    diem4: float | None
    selected_modules: list[int] = []  # modules đang được chọn lúc edit


class ReprocessRequest(BaseModel):
    selected_modules: list[int] = []  # [] = không chọn module nào


class TargetCPARequest(BaseModel):
    target_cpa: float


# ─── Helper ───────────────────────────────────────────────────────────────────

def build_response(transcript: list, base_name: str, selected_modules: list[int]) -> dict:
    """
    Tạo response chuẩn:
    - courses: tất cả môn (dùng cho bảng điểm — không filter module)
    - stats: chỉ tính từ module được chọn
    - original_courses: bảng điểm gốc (từ backup) để so sánh thay đổi
    """
    available_modules = detect_available_modules(transcript)
    display_courses = preprocess_for_display(transcript)
    stat_courses = preprocess_for_stats(transcript, selected_modules)
    stats = compute_stats(stat_courses)
    save_preprocessed(stat_courses, base_name)

    # Load bản gốc để so sánh (nếu có backup)
    original_raw = load_original(base_name)
    original_courses = preprocess_for_display(original_raw) if original_raw is not None else None

    return {
        "base_name": base_name,
        "available_modules": available_modules,
        "selected_modules": selected_modules,
        "courses": display_courses,        # Toàn bộ môn → bảng điểm
        "stats": stats,                    # Chỉ từ module được chọn → CPA/stats
        "has_backup": has_backup(base_name),
        "original_courses": original_courses,  # Bản gốc để highlight thay đổi
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_transcript(file: UploadFile = File(...)):
    """
    Upload file JSON transcript.
    Lưu raw, trả về data + stats (không chọn module nào mặc định).
    """
    if not file.filename.endswith(".json"):
        raise HTTPException(400, "Chỉ chấp nhận file .json")

    content = await file.read()
    try:
        transcript = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(400, "File JSON không hợp lệ")

    base_name = generate_filename()
    save_raw(transcript, base_name)

    # Mặc định không chọn module nào → user tự chọn
    return build_response(transcript, base_name, selected_modules=[])


@router.post("/reprocess/{base_name}")
async def reprocess(base_name: str, body: ReprocessRequest):
    """
    Reprocess khi user thay đổi module selection.
    selected_modules=[] → không đưa module nào vào tính toán.
    """
    try:
        transcript = load_raw(base_name)
    except FileNotFoundError:
        raise HTTPException(404, f"Không tìm thấy file: {base_name}")

    return build_response(transcript, base_name, body.selected_modules)


@router.put("/transcript/{base_name}/course")
async def update_course(base_name: str, body: UpdateCourseRequest):
    """
    Cập nhật điểm 1 môn, giữ nguyên module selection.
    """
    try:
        transcript = load_raw(base_name)
    except FileNotFoundError:
        raise HTTPException(404, f"Không tìm thấy file: {base_name}")

    backup_original(base_name)

    found = False
    for course in transcript:
        if course["maHP"] == body.ma_hp:
            course["diemChu"] = body.diem_chu
            course["diem4"] = body.diem4
            found = True
            break

    if not found:
        raise HTTPException(404, f"Không tìm thấy môn: {body.ma_hp}")

    save_raw(transcript, base_name)
    return build_response(transcript, base_name, body.selected_modules)


@router.post("/transcript/{base_name}/reset")
async def reset_transcript(base_name: str, body: ReprocessRequest):
    """
    Reset về bản gốc trước khi edit.
    """
    restored = restore_original(base_name)
    if not restored:
        raise HTTPException(404, "Không có bản backup để reset.")

    transcript = load_raw(base_name)
    return build_response(transcript, base_name, body.selected_modules)
