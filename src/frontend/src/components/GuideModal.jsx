import { useState } from 'react';

const JS_CODE = `(() => {
    const data = [];
    let currentCategory = null;
    let currentSubCategory = null;
    const rows = document.querySelectorAll("tr");
    rows.forEach(row => {
        if (row.classList.contains("dxgvGroupRow")) {
            const txt = row.innerText.replace(/\\s+/g," ").trim();
            if (txt.startsWith("Mã loại HP:")) { currentCategory = txt; }
            else if (txt.startsWith("Loại HP:")) { currentSubCategory = txt; }
            return;
        }
        if (!row.classList.contains("dxgvDataRow")) return;
        const td = [...row.querySelectorAll("td")];
        if (td.length !== 13) return;
        data.push({
            maLoaiHP: currentCategory, loaiHP: currentSubCategory,
            maHP: td[2].innerText.trim(), tenHP: td[3].innerText.trim(),
            kyHoc: td[4].innerText.trim(),
            batBuoc: td[5].querySelector("input")?.checked ?? false,
            tinChi: Number(td[6].innerText.trim() || 0),
            tinChiDat: td[7].innerText.trim()==="" ? null : Number(td[7].innerText),
            maHocPhanHoc: td[8].innerText.trim() || null,
            nhomHocPhan: td[9].innerText.trim(),
            diemChu: td[10].innerText.trim() || null,
            diem4: td[11].innerText.trim()==="" ? null : Number(td[11].innerText),
            vien: td[12].innerText.trim()
        });
    });
    console.log(data);
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "hust_transcript.json";
    a.click();
})();`;

export default function GuideModal({ onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JS_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Click ngoài để đóng
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📖</span>
            <span className="modal-title">Hướng dẫn lấy dữ liệu bảng điểm</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="guide-step">
            <div className="guide-step-num">1</div>
            <div className="guide-step-text">
              Đăng nhập và truy cập trang chương trình học tại{' '}
              <a href="https://ctt-sis.hust.edu.vn/Students/StudentProgram.aspx"
                target="_blank" rel="noreferrer">
                ctt-sis.hust.edu.vn → StudentProgram
              </a>
            </div>
          </div>

          <div className="guide-step">
            <div className="guide-step-num">2</div>
            <div className="guide-step-text">
              Nhấn <strong>F12</strong> để mở DevTools → chọn tab <strong>Console</strong>
            </div>
          </div>

          <div className="guide-step">
            <div className="guide-step-num">3</div>
            <div className="guide-step-text">
              Copy đoạn code bên dưới, dán vào Console và nhấn <strong>Enter</strong>.
              File <code style={{ background: 'rgba(99,102,241,0.2)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>hust_transcript.json</code> sẽ tự tải về.
            </div>
          </div>

          <div className="code-block" style={{ marginTop: 16 }}>
            <button
              className={`copy-btn${copied ? ' copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✓ Đã copy' : 'Copy'}
            </button>
            {JS_CODE}
          </div>

          <div className="guide-step" style={{ marginTop: 20 }}>
            <div className="guide-step-num">4</div>
            <div className="guide-step-text">
              Tải file JSON vừa download lên ô bên dưới và nhấn <strong>⚡ Load dữ liệu</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
