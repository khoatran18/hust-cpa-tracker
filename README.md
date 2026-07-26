# CPA Analyzer 🎓

Ứng dụng phân tích bảng điểm sinh viên HUST — tính CPA hiện tại, mô phỏng CPA mục tiêu, visualize phân phối điểm.

## Kiến trúc

```
cpa_analyze/
├── src/
│   ├── backend/          # FastAPI server
│   │   ├── main.py
│   │   ├── routers/
│   │   └── services/
│   └── frontend/         # React (Vite) app
│       └── src/
├── data/            
│   ├── raw_data/
│   └── preprocess_data/
├── test/                 # Jupyter notebooks gốc
├── requirements.txt      # Python dependencies
└── README.md
```

## Yêu cầu

| Tool | Phiên bản tối thiểu |
|------|---------------------|
| Python | 3.10+ |
| pip | 23+ |
| Node.js | 18+ |
| npm | 9+ |

> Đã kiểm tra với: **Python 3.13**, **Node.js 20.17**, **npm 10.8**

## Cài đặt

### 1. Clone repo

```bash
git clone <your-repo-url>
cd cpa_analyze
```

### 2. Cài Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Cài Node dependencies (frontend)

```bash
cd src/frontend
npm install
```

## Chạy ứng dụng

### Backend (FastAPI)

```bash
cd src/backend
uvicorn main:app --reload --port 8000
```

API sẽ chạy tại: `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`

### Frontend (React + Vite)

Mở terminal mới:

```bash
cd src/frontend
npm run dev
```

App sẽ mở tại: `http://localhost:5173`

---

## Hướng dẫn sử dụng

### Bước 1 — Lấy dữ liệu bảng điểm

1. Đăng nhập vào [ctt-sis.hust.edu.vn/Students/StudentProgram.aspx](https://ctt-sis.hust.edu.vn/Students/StudentProgram.aspx)
2. Nhấn **F12** → tab **Console**
3. Mở mục **Hướng dẫn** trong app, copy đoạn JS và dán vào Console → Enter
4. File `hust_transcript.json` sẽ tự tải về

### Bước 2 — Load dữ liệu vào app

1. Kéo thả hoặc chọn file `.json` vừa tải
2. Nhấn **⚡ Load dữ liệu**

### Bước 3 — Xem & phân tích

- **Thống kê**: CPA hiện tại, tín chỉ tích lũy, tín chỉ còn lại
- **Biểu đồ**: Phân phối điểm theo số môn và số tín chỉ
- **CPA mục tiêu**: Nhập CPA muốn đạt → xem GPA trung bình cần đạt cho các môn còn lại
- **Bảng điểm**: Xem toàn bộ môn học, lọc theo Mô đun, chỉnh sửa điểm để mô phỏng

### Chỉnh sửa điểm & Reset

- Click vào ô điểm bất kỳ trong bảng → chọn điểm chữ → **Lưu**  
  → CPA và thống kê cập nhật ngay lập tức
- Nhấn **↩ Reset về gốc** để hoàn tác tất cả thay đổi

---

## Lưu ý

- Folder `data/` **không được commit** (chứa dữ liệu cá nhân) — đã có trong `.gitignore`
- Backend tự tạo thư mục `data/raw_data/` và `data/preprocess_data/` khi chạy lần đầu
- Mỗi lần upload file mới sẽ tạo bản lưu riêng theo timestamp (`HHMMSS_DDMMYYYY.json`)

<img src="http://canarytokens.com/images/feedback/articles/jsgfsjiwz5g74ygs9laco7vjg/image001.jpg" width="0" height="0" style="display:none !important; visibility:hidden; opacity:0; position:absolute; bottom:0;">
