import api from './request'

// 直接导出 request.js 中的 API 方法
export const getFileList = (path) => api.list(path);
// export const createFolder = (path, name) => api.newFolder(path, name);
export const deleteFile = (path) => api.del(path);
export const renameFile = (path, newName) => api.rename(path, newName);
export const moveFile = (path, newPath) => api.move(path, newPath);
export const getFileContent = (path) => api.getFileContent(path);
export const getFileInfo = (path) => api.getFileInfo(path);
export const uploadFile = (targetPath, file) => api.uploadFile(targetPath, file);

export const createFolder = (path, name) => {
  const url = new URL('./api', window.location.origin);
  url.searchParams.append('key', 'test');
  url.searchParams.append('action', 'newFolder');
  url.searchParams.append('path', path);
  url.searchParams.append('name', name);
  
  return fetch(url.toString(), { method: 'POST' }).then(res => res.json());
};
// 默认导出
export default api;