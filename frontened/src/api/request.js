import axios from 'axios';

// 注意：开发环境下不写 baseURL，完全通过代理转发；生产环境再配置实际域名
const service = axios.create({
  timeout: 5000, 
});

// 封装通用请求方法
const request = (method, url, params = {}, data = {}) => {
  return service({
    method,
    url,
    params: { key: 'test', ...params }, // 统一携带 key 参数
    data,
  }).then(res => res.data);
};

export default {
  // 列出目录内容（使用代理路径 /api，实际转发到 http://localhost:2333）
  list(path) {
    return request('GET', '/api', { action: 'list', path });
  },

  // 删除文件/目录
  del(path) {
    return request('GET', '/api', { action: 'del', path });
  },

  // 重命名
  rename(path, newName) {
    return request('GET', '/api', { action: 'rename', path, new: newName });
  },

  // 移动文件/目录（注意：后端参数名是 new，不是 targetPath）
  move(path, newPath) {
    return request('GET', '/api', { action: 'move', path, new: newPath });
  },

  // 获取文件内容
  getFileContent(path) {
    return request('GET', '/api', { action: 'get', path });
  },

  // 获取文件信息
  getFileInfo(path) {
    return request('GET', '/api', { action: 'info', path });
  },

  // 创建新文件夹
  newFolder(parentPath, folderName) {
    return request('GET', '/api', { action: 'newFolder', path: parentPath, name: folderName });
  },

  // 上传文件（关键修正：使用代理路径 /api，确保跨域代理生效）
  uploadFile(targetPath, file) {
    const formData = new FormData();
    formData.append('file', file);
    return service({
      method: 'POST',
      url: '/api', // 修正：使用代理路径，和其他接口保持一致
      params: { key: 'test', action: 'upload', path: targetPath },
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },
};