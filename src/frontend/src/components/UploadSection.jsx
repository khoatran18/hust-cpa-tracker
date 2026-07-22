import { useState, useRef } from 'react';
import { uploadTranscript } from '../services/api';

export default function UploadSection({ onLoaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && f.name.endsWith('.json')) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleLoad = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await uploadTranscript(file);
      onLoaded(res.data);
    } catch (err) {
      alert('Lỗi upload: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <p className="section-title">Tải lên bảng điểm</p>

      <div
        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <div className="upload-icon">📂</div>
        <div className="upload-text">
          <strong>Click để chọn</strong> hoặc kéo thả file vào đây
        </div>
        <div className="upload-hint">Chỉ chấp nhận file .json từ HUST SIS</div>
        {file && <div className="upload-file-name">✓ {file.name}</div>}
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          onClick={handleLoad}
          disabled={!file || loading}
        >
          {loading ? <><span className="spinner" /> Đang xử lý...</> : '⚡ Load dữ liệu'}
        </button>
      </div>
    </div>
  );
}
