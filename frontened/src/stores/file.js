// src/stores/file.js
import { defineStore } from 'pinia'

export const useFileStore = defineStore('file', {
  state: () => ({
    currentPath: '/', 
    fileList: [] 
  }),
  actions: {
    // 更新当前目录
    setCurrentPath(path) {
      this.currentPath = path
    },
  }
});