// Tính target GPA trên frontend để tránh phải gọi API mỗi lần
export function compute_target_gpa_local(stats, targetCpa) {
  const { total_required_credits, earned_credits, weighted_score, remaining_credits } = stats;

  if (remaining_credits <= 0) {
    return {
      feasible: false,
      message: 'Không còn tín chỉ nào để học.',
      required_gpa: null,
      status: 'error',
      target_cpa: targetCpa,
      remaining_credits,
    };
  }

  const requiredTotal = targetCpa * total_required_credits;
  const requiredRemaining = requiredTotal - weighted_score;
  const requiredAvg = requiredRemaining / remaining_credits;

  let status, message;
  if (requiredAvg > 4.0) {
    status = 'impossible'; message = '❌ Mục tiêu không khả thi (cần GPA > 4.0).';
  } else if (requiredAvg >= 3.8) {
    status = 'very_hard'; message = '⚠️ Rất khó, gần như phải đạt toàn A/A+.';
  } else if (requiredAvg >= 3.5) {
    status = 'hard'; message = '⚠️ Khó, cần phần lớn A và A+.';
  } else if (requiredAvg >= 3.0) {
    status = 'feasible'; message = '✅ Khả thi nếu giữ mức B+/A.';
  } else if (requiredAvg >= 2.5) {
    status = 'easy'; message = '✅ Khá dễ đạt.';
  } else {
    status = 'very_easy'; message = '✅ Hoàn toàn an toàn.';
  }

  return {
    target_cpa: targetCpa,
    required_gpa: Math.round(requiredAvg * 10000) / 10000,
    remaining_credits,
    status,
    message,
  };
}
