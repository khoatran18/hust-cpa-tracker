export default function StatsCards({ stats }) {
  const { current_cpa, earned_credits, total_required_credits, remaining_credits } = stats;

  const cards = [
    {
      label: 'CPA Hiện tại',
      value: current_cpa.toFixed(3),
      sub: 'Tích lũy tính đến hiện tại',
      icon: '🎯',
      color: current_cpa >= 3.5 ? '#10b981' : current_cpa >= 3.0 ? '#f59e0b' : '#ef4444',
    },
    {
      label: 'Tín chỉ đã tích lũy',
      value: earned_credits,
      sub: `/ ${total_required_credits} tín chỉ yêu cầu`,
      icon: '📚',
      color: '#6366f1',
    },
    {
      label: 'Tín chỉ còn lại',
      value: remaining_credits,
      sub: 'Cần hoàn thành',
      icon: '⏳',
      color: '#f59e0b',
    },
    {
      label: 'Tiến độ',
      value: total_required_credits > 0
        ? `${Math.round((earned_credits / total_required_credits) * 100)}%`
        : '—',
      sub: 'Hoàn thành chương trình',
      icon: '📊',
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((c) => (
        <div className="stat-card" key={c.label}>
          <div className="stat-icon">{c.icon}</div>
          <div className="stat-label">{c.label}</div>
          <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
          <div className="stat-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
