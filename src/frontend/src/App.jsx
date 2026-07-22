import { useState } from 'react';
import './index.css';
import GuideModal from './components/GuideModal';
import UploadSection from './components/UploadSection';
import StatsCards from './components/StatsCards';
import Charts from './components/Charts';
import TargetCPA from './components/TargetCPA';
import CourseTable from './components/CourseTable';
import { reprocess } from './services/api';

export default function App() {
  const [data, setData] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);
  const [reprocessing, setReprocessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLoaded = (responseData) => {
    setData(responseData);
    setSelectedModules([]);
    showToast('✓ Tải dữ liệu thành công!');
  };

  const handleDataUpdate = (responseData) => {
    setData(prev => ({ ...prev, ...responseData }));
    showToast('✓ Cập nhật thành công!');
  };

  const handleModuleChange = async (newMods) => {
    setSelectedModules(newMods);
    if (!data) return;
    setReprocessing(true);
    try {
      const res = await reprocess(data.base_name, newMods);
      setData(prev => ({ ...prev, ...res.data }));
    } catch (e) {
      showToast('Lỗi reprocess', 'error');
    } finally {
      setReprocessing(false);
    }
  };

  const toggleModule = (mod) => {
    const next = selectedModules.includes(mod)
      ? selectedModules.filter(m => m !== mod)
      : [...selectedModules, mod].sort((a, b) => a - b);
    handleModuleChange(next);
  };

  const availableModules = data?.available_modules || [];

  return (
    <div className="app-wrapper">
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="header-inner">
            <div className="header-logo">🎓</div>
            <div style={{ flex: 1 }}>
              <div className="header-title">CPA Analyzer</div>
              <div className="header-sub">Phân tích bảng điểm HUST · ĐHBK Hà Nội</div>
            </div>
            <button className="guide-btn" onClick={() => setShowGuide(true)}>
              <span>📖</span> Hướng dẫn lấy data
            </button>
          </div>
        </header>

        {/* Upload */}
        <UploadSection onLoaded={handleLoaded} />

        {/* Dashboard */}
        {data && (
          <>
            <div className="divider" />

            {/* ── Module Selector ── Đầu tiên, ảnh hưởng toàn bộ thống kê */}
            {availableModules.length > 0 && (
              <div className="module-section">
                <div className="module-section-header">
                  <p className="section-title" style={{ marginBottom: 0 }}>
                    Chọn Mô đun tự chọn
                  </p>
                  {reprocessing && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="spinner" style={{ width: 13, height: 13 }} />
                      Đang tính lại...
                    </span>
                  )}
                </div>
                <div className="module-bar">
                  <span className="module-bar-label">Mô đun của bạn:</span>
                  <div className="module-chips">
                    {availableModules.map(mod => (
                      <div
                        key={mod}
                        className={`chip${selectedModules.includes(mod) ? ' active' : ''}`}
                        onClick={() => toggleModule(mod)}
                      >
                        <span className="chip-check">{selectedModules.includes(mod) ? '✓' : ''}</span>
                        Mô đun {mod}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                    Ảnh hưởng CPA · tổng tín chỉ · biểu đồ
                  </span>
                </div>
              </div>
            )}

            {/* ── Stats ── */}
            <p className="section-title">Thống kê tổng quan</p>
            <StatsCards stats={data.stats} />

            {/* ── Charts ── */}
            <p className="section-title">Phân phối điểm</p>
            <Charts gradeDistribution={data.stats.grade_distribution} />

            <div className="divider" />

            {/* ── Course Table ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p className="section-title" style={{ marginBottom: 0 }}>Bảng điểm chi tiết</p>
            </div>

            <CourseTable
              courses={data.courses}
              baseName={data.base_name}
              selectedModules={selectedModules}
              onDataUpdate={handleDataUpdate}
              hasBackup={data.has_backup || false}
            />

            {/* ── Target CPA ── cuối trang */}
            <div className="divider" />
            <p className="section-title">Tính CPA mục tiêu</p>
            <TargetCPA stats={data.stats} />

            <div style={{ height: 48 }} />
          </>
        )}

        {/* Empty state */}
        {!data && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">
              Tải lên file bảng điểm để xem phân tích
            </div>
          </div>
        )}
      </div>

      {/* Guide Modal */}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
