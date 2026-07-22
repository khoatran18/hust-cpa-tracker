import { useState } from 'react';
import { compute_target_gpa_local } from '../utils/computeTargetGpa';

export default function TargetCPA({ stats }) {
  const [targetCpa, setTargetCpa] = useState('');
  const [result, setResult] = useState(null);

  const handleCalc = () => {
    const val = parseFloat(targetCpa);
    if (isNaN(val) || val < 0 || val > 4) return;
    const r = compute_target_gpa_local(stats, val);
    setResult(r);
  };

  const getGpaColor = (status) => {
    if (!status) return 'var(--text-primary)';
    if (status === 'impossible') return 'var(--red)';
    if (status === 'very_hard' || status === 'hard') return 'var(--yellow)';
    return 'var(--green)';
  };

  return (
    <div className="target-card" style={{ marginBottom: 32 }}>
      <p className="section-title">CPA Mục tiêu</p>

      <div className="target-row">
        <div className="input-group">
          <label className="input-label">Nhập CPA mục tiêu (0 – 4.0)</label>
          <input
            type="number"
            className="input-field"
            placeholder="3.60"
            min="0" max="4" step="0.01"
            value={targetCpa}
            onChange={(e) => setTargetCpa(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
          />
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleCalc}>
            Tính
          </button>
        </div>
      </div>

      {result && (
        <div className={`target-result ${result.status}`}>
          <div>
            <div
              className="target-gpa-val"
              style={{ color: getGpaColor(result.status) }}
            >
              {result.required_gpa !== null ? result.required_gpa.toFixed(3) : '—'}
            </div>
            <div className="target-gpa-label">GPA trung bình cần đạt / môn còn lại</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16 }}>
            <div className="target-message">{result.message}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Còn {result.remaining_credits} tín chỉ • CPA mục tiêu: {result.target_cpa}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
