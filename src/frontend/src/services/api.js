import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL });

export const uploadTranscript = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/upload', form);
};

export const reprocess = (baseName, selectedModules) =>
  api.post(`/api/reprocess/${baseName}`, { selected_modules: selectedModules ?? [] });

// selectedModules phải truyền để backend tính stats đúng
export const updateCourse = (baseName, maHp, diemChu, diem4, selectedModules) =>
  api.put(`/api/transcript/${baseName}/course`, {
    ma_hp: maHp,
    diem_chu: diemChu,
    diem4: diem4,
    selected_modules: selectedModules ?? [],
  });

export const resetTranscript = (baseName, selectedModules) =>
  api.post(`/api/transcript/${baseName}/reset`, { selected_modules: selectedModules ?? [] });

export default api;
