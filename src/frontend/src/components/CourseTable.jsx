import { useState } from 'react';
import { updateCourse, resetTranscript } from '../services/api';

const GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
const DIEM4_MAP = {
  'A+': 4.0, 'A': 4.0, 'B+': 3.5, 'B': 3.0,
  'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0,
};

function GradeBadge({ grade }) {
  if (!grade) return <span style={{ color: 'var(--text-dim)' }}>—</span>;
  return (
    <span style={{
      background: getBadgeBg(grade),
      color: getBadgeColor(grade),
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 36, height: 24, borderRadius: 6,
      fontSize: 12, fontWeight: 700, padding: '0 4px',
    }}>
      {grade}
    </span>
  );
}

function getBadgeBg(g) {
  if (g === 'A+' || g === 'A') return 'rgba(16,185,129,0.2)';
  if (g === 'B+' || g === 'B') return 'rgba(245,158,11,0.2)';
  if (g === 'C+' || g === 'C') return 'rgba(249,115,22,0.2)';
  if (g === 'D+' || g === 'D') return 'rgba(239,68,68,0.18)';
  return 'rgba(239,68,68,0.35)';
}
function getBadgeColor(g) {
  if (g === 'A+' || g === 'A') return '#34d399';
  if (g === 'B+' || g === 'B') return '#fbbf24';
  if (g === 'C+' || g === 'C') return '#fb923c';
  if (g === 'D+' || g === 'D') return '#f87171';
  return '#ef4444';
}

function extractModuleNumber(loaiHP) {
  if (!loaiHP) return null;
  const m = loaiHP.match(/Mô đun\s+(\d+)/);
  return m ? parseInt(m[1]) : null;
}

function groupCourses(courses) {
  const groups = {};
  for (const c of courses) {
    const key = c.nhomHocPhan || 'Khác';
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  return groups;
}

export default function CourseTable({
  courses, baseName, selectedModules,
  onDataUpdate, hasBackup,
}) {
  const [editRow, setEditRow] = useState(null);
  const [editGrade, setEditGrade] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleEditStart = (course) => {
    setEditRow(course.maHP);
    setEditGrade(course.diemChu || '');
  };
  const handleEditCancel = () => { setEditRow(null); setEditGrade(''); };

  const handleSave = async (maHp) => {
    setSaving(true);
    try {
      const diem4 = editGrade ? DIEM4_MAP[editGrade] : null;
      const res = await updateCourse(baseName, maHp, editGrade || null, diem4, selectedModules);
      onDataUpdate(res.data);
      setEditRow(null);
    } catch (e) {
      alert('Lỗi cập nhật: ' + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset về bảng điểm gốc? Các thay đổi sẽ bị xóa.')) return;
    setResetting(true);
    try {
      const res = await resetTranscript(baseName, selectedModules);
      onDataUpdate(res.data);
    } catch (e) {
      alert('Lỗi reset: ' + (e.response?.data?.detail || e.message));
    } finally {
      setResetting(false);
    }
  };

  const groups = groupCourses(courses);

  return (
    <div>
      {/* Table actions */}
      <div className="table-actions">
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {courses.length} môn học
          {' '}
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            (môn Mô đun chưa chọn hiển thị mờ, không tính CPA)
          </span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {hasBackup && (
            <button
              className="btn btn-danger"
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? <span className="spinner" /> : '↩'} Reset về gốc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Mã HP</th>
              <th>Tên học phần</th>
              <th style={{ textAlign: 'center' }}>Kỳ</th>
              <th style={{ textAlign: 'center' }}>TC</th>
              <th style={{ textAlign: 'center' }}>Điểm chữ</th>
              <th style={{ textAlign: 'center' }}>Điểm 4</th>
              <th>Viện</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groups).map(([groupName, groupCourses]) => (
              <>
                <tr className="group-row" key={`g-${groupName}`}>
                  <td colSpan={7}>{groupName}</td>
                </tr>
                {groupCourses.map((course) => {
                  const isEditing = editRow === course.maHP;
                  const moduleNum = extractModuleNumber(course.loaiHP);
                  // Môn Mô đun chưa được chọn → dim row
                  const isUnselectedModule = moduleNum !== null && !selectedModules.includes(moduleNum);

                  return (
                    <tr
                      key={`${course.maHP}-${course.kyHoc}`}
                      style={isUnselectedModule ? { opacity: 0.35 } : undefined}
                    >
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {course.maHP}
                        {isUnselectedModule && (
                          <span style={{
                            marginLeft: 6, fontSize: 10, color: 'var(--text-dim)',
                            background: 'rgba(255,255,255,0.06)',
                            padding: '1px 5px', borderRadius: 4,
                          }}>
                            Mô đun {moduleNum}
                          </span>
                        )}
                      </td>
                      <td style={{ color: isUnselectedModule ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                        {course.tenHP}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-dim)' }}>{course.kyHoc}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{course.tinChi}</td>

                      {/* Điểm chữ — editable */}
                      <td style={{ textAlign: 'center' }}>
                        {isEditing ? (
                          <div className="edit-cell" style={{ justifyContent: 'center' }}>
                            <select
                              className="edit-select"
                              value={editGrade}
                              onChange={(e) => setEditGrade(e.target.value)}
                              autoFocus
                            >
                              <option value="">—</option>
                              {GRADES.map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                            <button
                              className="save-btn"
                              onClick={() => handleSave(course.maHP)}
                              disabled={saving}
                            >
                              {saving ? '...' : 'Lưu'}
                            </button>
                            <button className="cancel-btn" onClick={handleEditCancel}>✕</button>
                          </div>
                        ) : (
                          <div
                            className="edit-trigger"
                            onClick={() => handleEditStart(course)}
                            title="Click để chỉnh sửa"
                          >
                            <GradeBadge grade={course.diemChu} />
                          </div>
                        )}
                      </td>

                      {/* Điểm 4 */}
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {course.diem4 !== null ? course.diem4 : '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{course.vien}</td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
