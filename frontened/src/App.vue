<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <!-- 根容器，包裹所有页面 -->
  <div class="app-root">
    <router-view />
  </div>
</template>

<style>
/* 全局样式（注意：这里不要加 scoped，确保能作用到所有子组件） */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box; /* 统一盒模型，避免宽度计算问题 */
}

html, body, .app-root {
  height: 100%; /* 让根容器、html、body 都撑满屏幕高度 */
  min-height: 100vh; /* 兼容不同设备的全屏高度 */
  
}

body {
  background-color: #f5f5f5;
}
</style>