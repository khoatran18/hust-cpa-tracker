import { useState, useMemo, useRef, useEffect } from 'react';
import { updateCourse, resetTranscript } from '../services/api';

const GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
const DIEM4_MAP = {
  'A+': 4.0, 'A': 4.0, 'B+': 3.5, 'B': 3.0,
  'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0,
};

/* ─── Helpers ───────────────────────────────────────────────────── */
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
function GradeBadge({ grade }) {
  if (!grade) return <span style={{ color: '#94a3b8' }}>—</span>;
  return (
    <span style={{
      background: getBadgeBg(grade), color: getBadgeColor(grade),
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 36, height: 24, borderRadius: 6, fontSize: 12, fontWeight: 700, padding: '0 4px',
    }}>{grade}</span>
  );
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

/* ─── CheckboxDropdown: dùng cho Kỳ, TC, Điểm chữ, Điểm 4 ────── */
function CheckboxDropdown({ options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  // Đóng khi click ngoài
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => String(o).toLowerCase().includes(search.toLowerCase()));
  const allSelected = selected.length === 0; // 0 = không filter = tất cả
  const label = selected.length === 0
    ? placeholder
    : selected.length === options.length
      ? 'Tất cả'
      : selected.join(', ').length > 14
        ? `${selected.length} chọn`
        : selected.join(', ');

  const toggle = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };
  const toggleAll = () => onChange([]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="filter-dropdown-btn"
        onClick={() => setOpen(o => !o)}
        style={{ borderColor: selected.length > 0 ? 'rgba(99,102,241,0.6)' : undefined }}
      >
        <span style={{ color: selected.length > 0 ? '#c7d2fe' : '#64748b', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <span style={{ color: '#475569', fontSize: 8, marginLeft: 2 }}>▼</span>
      </button>
      {open && (
        <div className="filter-dropdown-menu">
          {options.length > 5 && (
            <input
              className="filter-dropdown-search"
              placeholder="Tìm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          )}
          <label className="filter-dropdown-item">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
            />
            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tất cả</span>
          </label>
          {filtered.map(opt => (
            <label key={opt} className="filter-dropdown-item">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
              />
              <span>{opt === null || opt === '' ? '—' : opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── TextFilter: Mã HP, Tên HP, Viện ──────────────────────────── */
function TextFilter({ value, onChange, placeholder }) {
  return (
    <input
      className="filter-text-input"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

/* ─── Modal cập nhật điểm ───────────────────────────────────────── */
const TH_MODAL = {
  textAlign: 'center', padding: '8px 10px',
  color: '#cbd5e1', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.8px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};

function UpdatesModal({ changes, onRevert, reverting, onClose }) {
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };
  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-box" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📝</span>
            <span className="modal-title">Các điểm đã cập nhật</span>
            <span style={{ background: 'rgba(99,102,241,0.25)', color: '#c7d2fe', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, marginLeft: 4 }}>
              {changes.length} môn
            </span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <div className="modal-body" style={{ padding: '8px 16px 16px' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...TH_MODAL, textAlign: 'left', padding: '10px 12px' }}>Tên học phần</th>
                <th style={{ ...TH_MODAL, width: 60 }}>Từ</th>
                <th style={{ ...TH_MODAL, width: 28, padding: '8px 4px' }}></th>
                <th style={{ ...TH_MODAL, width: 60 }}>Thành</th>
                <th style={{ ...TH_MODAL, width: 44, padding: '8px 8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c, i) => {
                const isReverting = reverting === c.maHP;
                return (
                  <tr key={c.maHP} style={{ borderBottom: i < changes.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <td style={{ padding: '11px 12px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9' }}>{c.tenHP}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>{c.maHP}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '11px 8px' }}><GradeBadge grade={c.oldGrade} /></td>
                    <td style={{ textAlign: 'center', padding: '11px 4px', color: '#64748b', fontSize: 14 }}>→</td>
                    <td style={{ textAlign: 'center', padding: '11px 8px' }}><GradeBadge grade={c.newGrade} /></td>
                    <td style={{ textAlign: 'center', padding: '11px 8px' }}>
                      <button
                        onClick={() => onRevert(c.maHP, c.oldGrade)}
                        disabled={isReverting}
                        title="Hoàn tác, trả về điểm cũ"
                        style={{
                          width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 6, color: '#94a3b8', fontSize: 13, cursor: isReverting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s', flexShrink: 0, opacity: isReverting ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { if (!isReverting) { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#f87171'; }}}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#94a3b8'; }}
                      >
                        {isReverting ? '…' : '✕'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */
export default function CourseTable({
  courses, baseName, selectedModules,
  onDataUpdate, hasBackup, originalCourses,
}) {
  const [editRow, setEditRow] = useState(null);
  const [editGrade, setEditGrade] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [reverting, setReverting] = useState(null);

  // ── Filter state ──────────────────────────────────────────────
  const [fMaHP, setFMaHP] = useState('');
  const [fTenHP, setFTenHP] = useState('');
  const [fKy, setFKy] = useState([]);
  const [fTC, setFTC] = useState([]);
  const [fDiemChu, setFDiemChu] = useState([]);
  const [fDiem4, setFDiem4] = useState([]);
  const [fVien, setFVien] = useState('');

  // Unique values cho dropdown
  const uniqKy = useMemo(() => [...new Set(courses.map(c => c.kyHoc).filter(Boolean))].sort(), [courses]);
  const uniqTC = useMemo(() => [...new Set(courses.map(c => c.tinChi))].sort((a, b) => a - b), [courses]);
  const uniqDiemChu = useMemo(() => {
    const gs = [...new Set(courses.map(c => c.diemChu).filter(Boolean))];
    return GRADES.filter(g => gs.includes(g));
  }, [courses]);
  const uniqDiem4 = useMemo(() => [...new Set(courses.map(c => c.diem4).filter(v => v !== null))].sort((a, b) => b - a), [courses]);

  const hasFilter = fMaHP || fTenHP || fKy.length || fTC.length || fDiemChu.length || fDiem4.length || fVien;

  const clearFilters = () => {
    setFMaHP(''); setFTenHP(''); setFKy([]); setFTC([]);
    setFDiemChu([]); setFDiem4([]); setFVien('');
  };

  // ── Original grade map ────────────────────────────────────────
  const originalGradeMap = useMemo(() => {
    if (!originalCourses) return {};
    const map = {};
    for (const c of originalCourses) map[c.maHP] = c.diemChu;
    return map;
  }, [originalCourses]);

  const changedCourses = useMemo(() => {
    if (!originalCourses) return [];
    return courses.map(c => {
      const oldGrade = originalGradeMap[c.maHP] ?? null;
      if (oldGrade === c.diemChu) return null;
      return { maHP: c.maHP, tenHP: c.tenHP, oldGrade, newGrade: c.diemChu };
    }).filter(Boolean);
  }, [courses, originalGradeMap, originalCourses]);

  const hasChanges = changedCourses.length > 0;

  // ── Filtered courses ──────────────────────────────────────────
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (fMaHP && !c.maHP.toLowerCase().includes(fMaHP.toLowerCase())) return false;
      if (fTenHP && !c.tenHP.toLowerCase().includes(fTenHP.toLowerCase())) return false;
      if (fKy.length && !fKy.includes(c.kyHoc)) return false;
      if (fTC.length && !fTC.includes(c.tinChi)) return false;
      if (fDiemChu.length && !fDiemChu.includes(c.diemChu)) return false;
      if (fDiem4.length && !fDiem4.includes(c.diem4)) return false;
      if (fVien && !c.vien?.toLowerCase().includes(fVien.toLowerCase())) return false;
      return true;
    });
  }, [courses, fMaHP, fTenHP, fKy, fTC, fDiemChu, fDiem4, fVien]);

  const groups = groupCourses(filteredCourses);

  // ── Handlers ──────────────────────────────────────────────────
  const handleEditStart = (course) => { setEditRow(course.maHP); setEditGrade(course.diemChu || ''); };
  const handleEditCancel = () => { setEditRow(null); setEditGrade(''); };

  const handleSave = async (maHp) => {
    setSaving(true);
    try {
      const diem4 = editGrade ? DIEM4_MAP[editGrade] : null;
      const res = await updateCourse(baseName, maHp, editGrade || null, diem4, selectedModules);
      onDataUpdate(res.data); setEditRow(null);
    } catch (e) {
      alert('Lỗi cập nhật: ' + (e.response?.data?.detail || e.message));
    } finally { setSaving(false); }
  };

  const handleRevert = async (maHp, oldGrade) => {
    setReverting(maHp);
    try {
      const diem4 = oldGrade ? DIEM4_MAP[oldGrade] : null;
      const res = await updateCourse(baseName, maHp, oldGrade || null, diem4, selectedModules);
      onDataUpdate(res.data);
    } catch (e) {
      alert('Lỗi hoàn tác: ' + (e.response?.data?.detail || e.message));
    } finally { setReverting(null); }
  };

  const handleReset = async () => {
    if (!confirm('Reset về bảng điểm gốc? Các thay đổi sẽ bị xóa.')) return;
    setResetting(true);
    try {
      const res = await resetTranscript(baseName, selectedModules);
      onDataUpdate(res.data);
    } catch (e) {
      alert('Lỗi reset: ' + (e.response?.data?.detail || e.message));
    } finally { setResetting(false); }
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div>
      {/* Table actions */}
      <div className="table-actions">
        <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>
          {hasFilter
            ? <><strong style={{ color: '#a5b4fc' }}>{filteredCourses.length}</strong> / {courses.length} môn học</>
            : <>{courses.length} môn học</>
          }
          {' '}
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            (môn Mô đun chưa chọn hiển thị mờ, không tính CPA)
          </span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {hasFilter && (
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }} onClick={clearFilters}>
              ✕ Xóa filter
            </button>
          )}
          {hasChanges && (
            <button className="btn-updates" onClick={() => setShowUpdates(true)}>
              <span style={{ fontSize: 13 }}>📋</span>
              Các điểm đã cập nhật
              <span className="updates-badge">{changedCourses.length}</span>
            </button>
          )}
          {hasBackup && (
            <button className="btn btn-ghost" onClick={handleReset} disabled={resetting}>
              {resetting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '↩'} Reset về gốc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            {/* Header row */}
            <tr>
              <th>Mã HP</th>
              <th>Tên học phần</th>
              <th style={{ textAlign: 'center' }}>Kỳ</th>
              <th style={{ textAlign: 'center' }}>TC</th>
              <th style={{ textAlign: 'center' }}>Điểm chữ</th>
              <th style={{ textAlign: 'center' }}>Điểm 4</th>
              <th>Viện</th>
            </tr>
            {/* Filter row */}
            <tr className="filter-row">
              <th>
                <TextFilter value={fMaHP} onChange={setFMaHP} placeholder="Mã..." />
              </th>
              <th>
                <TextFilter value={fTenHP} onChange={setFTenHP} placeholder="Tên môn..." />
              </th>
              <th style={{ textAlign: 'center' }}>
                <CheckboxDropdown options={uniqKy} selected={fKy} onChange={setFKy} placeholder="Kỳ" />
              </th>
              <th style={{ textAlign: 'center' }}>
                <CheckboxDropdown options={uniqTC} selected={fTC} onChange={setFTC} placeholder="TC" />
              </th>
              <th style={{ textAlign: 'center' }}>
                <CheckboxDropdown options={uniqDiemChu} selected={fDiemChu} onChange={setFDiemChu} placeholder="Điểm" />
              </th>
              <th style={{ textAlign: 'center' }}>
                <CheckboxDropdown options={uniqDiem4} selected={fDiem4} onChange={setFDiem4} placeholder="Đ4" />
              </th>
              <th>
                <TextFilter value={fVien} onChange={setFVien} placeholder="Viện..." />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  Không có môn nào khớp với filter
                </td>
              </tr>
            ) : (
              Object.entries(groups).map(([groupName, groupCourses]) => (
                <>
                  <tr className="group-row" key={`g-${groupName}`}>
                    <td colSpan={7}>{groupName}</td>
                  </tr>
                  {groupCourses.map((course) => {
                    const isEditing = editRow === course.maHP;
                    const moduleNum = extractModuleNumber(course.loaiHP);
                    const isUnselectedModule = moduleNum !== null && !selectedModules.includes(moduleNum);
                    const origGrade = originalCourses ? (originalGradeMap[course.maHP] ?? null) : null;
                    const isChanged = originalCourses !== null && origGrade !== course.diemChu;
                    const displayDiem4 = isChanged && course.diemChu ? DIEM4_MAP[course.diemChu] : course.diem4;

                    return (
                      <tr
                        key={`${course.maHP}-${course.kyHoc}`}
                        style={{
                          opacity: isUnselectedModule ? 0.35 : undefined,
                          background: isChanged ? 'rgba(99,102,241,0.04)' : undefined,
                        }}
                      >
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {course.maHP}
                          {isUnselectedModule && (
                            <span style={{ marginLeft: 6, fontSize: 10, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>
                              Mô đun {moduleNum}
                            </span>
                          )}
                        </td>
                        <td style={{ color: isUnselectedModule ? '#94a3b8' : '#e2e8f0' }}>{course.tenHP}</td>
                        <td style={{ textAlign: 'center', color: '#94a3b8' }}>{course.kyHoc}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#e2e8f0' }}>{course.tinChi}</td>

                        {/* Điểm chữ */}
                        <td style={{ textAlign: 'center' }}>
                          {isEditing ? (
                            <div className="edit-cell" style={{ justifyContent: 'center' }}>
                              <select className="edit-select" value={editGrade} onChange={(e) => setEditGrade(e.target.value)} autoFocus>
                                <option value="">—</option>
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                              </select>
                              <button className="save-btn" onClick={() => handleSave(course.maHP)} disabled={saving}>
                                {saving ? '...' : 'Lưu'}
                              </button>
                              <button className="cancel-btn" onClick={handleEditCancel}>✕</button>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <div
                                className="edit-trigger"
                                onClick={() => handleEditStart(course)}
                                title="Click để chỉnh sửa"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                              >
                                {isChanged ? (
                                  <>
                                    <span style={{ opacity: 0.45, textDecoration: 'line-through', fontSize: 11 }}>
                                      <GradeBadge grade={origGrade} />
                                    </span>
                                    <span style={{ color: '#64748b', fontSize: 11 }}>→</span>
                                    <span style={{ filter: 'brightness(1.15)' }}>
                                      <GradeBadge grade={course.diemChu} />
                                    </span>
                                  </>
                                ) : (
                                  <GradeBadge grade={course.diemChu} />
                                )}
                              </div>
                              {isChanged && (
                                <button
                                  className="revert-inline-btn"
                                  onClick={(e) => { e.stopPropagation(); handleRevert(course.maHP, origGrade); }}
                                  disabled={reverting === course.maHP}
                                  title="Hoàn tác về điểm gốc"
                                >
                                  {reverting === course.maHP ? '…' : '✕'}
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Điểm 4 */}
                        <td style={{ textAlign: 'center', fontWeight: 600, color: isChanged ? '#a5b4fc' : '#e2e8f0' }}>
                          {displayDiem4 !== null ? displayDiem4 : '—'}
                        </td>
                        <td style={{ fontSize: 12, color: '#94a3b8' }}>{course.vien}</td>
                      </tr>
                    );
                  })}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showUpdates && (
        <UpdatesModal
          changes={changedCourses}
          onRevert={handleRevert}
          reverting={reverting}
          onClose={() => setShowUpdates(false)}
        />
      )}
    </div>
  );
}
