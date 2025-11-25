<template>
  <div class="file-manager">
    <!-- 顶部导航栏（含退出登录） -->
    <div class="header">
      <img src="@/assets/FilioLogo.png" class="logo1" alt="项目logo" />
      <el-button type="primary" @click="handleLogout" class="logout-btn">
        <el-icon><SwitchButton /></el-icon>退出登录
      </el-button>
    </div>

    <!-- 操作栏：新建文件夹、上传文件 -->
    <div class="operation-bar">
      <el-button 
        type="info" 
        @click="handleGoBack" 
        :disabled="fileStore.currentPath === '/'">
        <el-icon><Back /></el-icon> 返回上级
      </el-button>
      <el-button 
        type="primary" 
        @click="handleCreateFolder"
        class="fileAdd">
        <el-icon><FolderAdd /></el-icon> 新建文件夹
      </el-button>
      <el-upload
        :action="`/api?key=test&action=upload&path=${encodeURIComponent(fileStore.currentPath)}`"
        method="post"
        :on-success="handleUploadSuccess"
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
      >
        <el-button type="success" class="fileGive">
          <el-icon><Upload /></el-icon> 上传文件
        </el-button>
      </el-upload>
    </div>

    <!-- 面包屑导航 -->
    <el-breadcrumb class="breadcrumb" separator="/">
      <el-breadcrumb-item @click="handleBreadcrumbClick(-1)">根目录</el-breadcrumb-item>
      <template v-for="(item, index) in pathSegments" :key="index">
        <el-breadcrumb-item @click="handleBreadcrumbClick(index)">
          {{ formatBreadcrumbItem(item, index) }}
        </el-breadcrumb-item>
      </template>
    </el-breadcrumb>

    <!-- 文件列表 -->
    <el-table 
      :data="fileList" 
      border 
      class="file-table"
      v-loading="loading"
      element-loading-text="加载中..."
      :row-class-name="TableRowClassName"
    >
      <el-table-column label="名称" prop="name" width="300">
        <template #default="scope">
          <div class="file-name">
            <el-icon v-if="scope.row.type === 'folder'"><Folder /></el-icon>
            <el-icon v-else><Document /></el-icon>
            <span @click="handleOpenItem(scope.row)">{{ scope.row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="类型" prop="type" width="120" sortable />
      <el-table-column label="大小" prop="size" width="150" sortable>
        <template #default="scope">
          {{ scope.row.type === 'folder' ? '-' : formatSize(scope.row.size) }}
        </template>
      </el-table-column>
      <el-table-column label="修改时间" prop="updateTime" sortable />
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button type="text" @click="handleDownloadFile(scope.row)"v-if="scope.row.type !== 'folder'">下载</el-button>
          <el-button type="text" @click="handleRename(scope.row)">重命名</el-button>
          <el-button type="text" @click="showMoveDialog(scope.row)">移动</el-button>
          <el-button type="text" danger @click="handleDelete(scope.row)">删除</el-button>
          <el-button type="text" @click="handleGetFileContent(scope.row)"v-if="!scope.row.isFolder">查看内容</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog 
      v-model="moveDialogVisible" 
      title="选择目标目录" 
      width="500px"
    >
      <div class="folder-selector">
        <el-tree 
          :data="folderList"
          :props="{ label: 'name', children: 'children' }"
          node-key="path"
          @node-click="selectTargetFolder"
          default-expand-all
        />
      </div>
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMove">确认移动</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, h, createVNode, render } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useFileStore } from '../stores/file';
import { 
  ElMessage, 
  ElDialog, 
  ElInput, 
  ElButton, 
  ElImage, 
  ElLoading,
  ElMessageBox
} from 'element-plus';
import { FolderAdd, Upload, Folder, Document, Back, SwitchButton, FolderOpened } from '@element-plus/icons-vue';


// 基础配置
const baseUrl = './api';//vite.config.js获取
const router = useRouter();
const fileStore = useFileStore();
const route = useRoute();

// 状态管理
const fileList = ref([]);
const pathSegments = ref([]);
const loading = ref(false);
const currentEditItem = ref(null);

// 文件刷新
const fetchFileList = async () => {
  loading.value = true;
  try {
    // 1. 处理当前路径（去掉开头的 /，避免 URL 重复）
    const pathSegment = fileStore.currentPath.startsWith('/') 
      ? fileStore.currentPath.slice(1) 
      : fileStore.currentPath;
    //2.构造 URL：将 path 作为路径参数，而非查询参数
    // 正确格式：/test01?key=test&action=list
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.append('key', 'test');
    url.searchParams.append('action', 'list');
    // url.searchParams.append('path', fileStore.currentPath);
    // console.log('请求路径：',fileStore.currentPath);// 打印当前路径
    console.log('请求URL:', url.toString()); // 打印完整请求URL

    const res = await fetch(url.toString());
    // console.log('文件列表列表请求地址：', url.toString());
    // console.log('接口响应状态：', res.status);

    // 打印完整响应数据
    const data = await res.json();
    console.log('后端返回的文件项：', data.payload);

    if (data.msg === 'ok' || (data.msg === '' && data.err === '')) { 
      fileList.value = data.payload || [];
      console.log('文件列表更新成功，共', fileList.value.length, '项');
    } else {
      throw new Error(`业务处理失败：${data.err || '未知错误'}`);
    }

  } catch (error) {
    console.error('获取文件列表失败：', error.message);
    ElMessage.error(`获取失败：${error.message}`);
  } finally {
    loading.value = false;
  }
};

//从路由参数初始化当前路径
const initCurrentPath = () => {
  // 路由参数中的path是数组（如/test01/docs → ['test01', 'docs']）
  const pathSegmentsFromRoute = route.params.path || [];
  const currentPath = pathSegmentsFromRoute.length 
    ? `/${pathSegmentsFromRoute.join('/')}` 
    : '/'; // 根目录
  
  fileStore.setCurrentPath(currentPath);
};

// 监听路径变化
watch(
  () => fileStore.currentPath,
  (newPath) => {
    // 验证路径长度（不超过512字符）
    if (newPath.length > 512) {
      ElMessage.error('路径长度不能超过512字符');
      return;
    }
    pathSegments.value = newPath.split('/').filter(Boolean);
    console.log('当前路径更新：', fileStore.currentPath);
  },
  { immediate: true }
)

//监听路由变化，同步路径并刷新列表
watch(
  () => route.params.path,
  () => {
    initCurrentPath();
    fetchFileList();
  },
  { immediate: true } // 初始化时立即执行
)

// 面包屑过长处理
const formatBreadcrumbItem = (item, index) => {
  const totalLength = pathSegments.value.join('/').length;
  if (totalLength > 30 && index !== pathSegments.value.length - 1) {
    return item.length > 5 ? item.slice(0, 5) + '...' : item;
  }
  return item;
};

// 表格行样式区分
const TableRowClassName = ({ row }) => {
  return row.type === 'folder' ? 'folder-row' : 'file-row';
};

// 初始化加载文件列表
onMounted(async () => {
  await fetchFileList();
});

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  ElMessage.success('已退出登录');
  router.push('/login');
};


// 格式化文件大小
const formatSize = (size) => {
  if (typeof size !== 'number') return '未知';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// 打开文件夹（进入子目录）
const handleOpenItem = (item) => {
  if (item.isFolder) {
    const currentSegments = route.params.path || []; // 当前路由片段
    const newSegments = [...currentSegments, item.name]; // 拼接新片段
    
    // 跳转路由（会触发watch回调，同步path并刷新列表）
    router.push({
      path: `/${newSegments.join('/')}`
    });
  }
  };

// 读取文件内容（兼容文本和非文本文件）
const handleGetFileContent = async (item) => {
  if (item.isFolder) {
    ElMessage.warning('文件夹无法读取内容');
    return;
  }

  // 1. 过滤不支持的文件类型（可选，提前拦截二进制文件）
  const binaryExts = ['png', 'jpg', 'jpeg', 'gif', 'zip', 'rar', 'exe', 'mp4', 'mp3'];
  const ext = item.name.split('.').pop()?.toLowerCase();
  if (binaryExts.includes(ext)) {
    ElMessage.warning('不支持查看二进制文件内容');
    return;
  }

  try {
    // 2. 构造请求 URL（同之前）
    const filePath = fileStore.currentPath === '/'
      ? `/${item.name}`
      : `${fileStore.currentPath}/${item.name}`;
    const urlPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const url = new URL(`${import.meta.env.BASE_URL}api/${urlPath}`, window.location.origin);
    url.searchParams.append('key', 'test');
    url.searchParams.append('action', 'get');

    // 3. 发送请求（明确接收文本格式）
    const response = await fetch(url.toString(), { 
      method: 'GET',
      headers: { 'Accept': 'text/plain' } // 告诉后端期望文本响应
    });

    // 4. 先判断响应是否成功
    if (!response.ok) {
      ElMessage.error(`请求失败: 状态码 ${response.status}`);
      return;
    }

    // 5. 尝试按文本解析（而非 JSON）
    try {
      // 直接读取文本内容（适用于 TXT、JSON、HTML 等文本文件）
      const content = await response.text(); 
      
      // 显示内容（保留格式）
      ElMessageBox.alert(
        `<pre style="white-space: pre-wrap; max-height: 400px; overflow-y: auto;">${content}</pre>`,
        `文件内容：${item.name}`,
        { dangerouslyUseHTMLString: true, width: '600px' }
      );
    } catch (textError) {
      // 文本解析也失败（极少见，可能是编码问题）
      console.error('文本解析失败:', textError);
      ElMessage.error('文件内容无法解析（可能是编码错误）');
    }

  } catch (error) {
    console.error('获取文件内容请求失败:', error);
    ElMessage.error('读取文件失败，请检查服务器连接');
  }
};

// 新建文件夹
const handleCreateFolder = async () => {
  const folderName = prompt('请输入文件夹名称（不超过64字符，不含特殊符号）');
  if (!folderName) return; // 用户取消输入

  // 校验文件名长度（UTF-8编码）
  if (new TextEncoder().encode(folderName).length > 64) {
    ElMessage.error('文件夹名称不能超过64字符（UTF-8编码）');
    return;
  }

  // 校验特殊字符（避免影响路径）
  if (folderName.includes('/') || folderName.includes('\\')) {
    ElMessage.error('文件夹名称不能包含 / 或 \\');
    return;
  }

  // 检查当前目录是否已存在同名文件夹
  const isExist = fileList.value.some(item => 
    item.name === folderName && item.type === 'folder'
  );
  if (isExist) {
    ElMessage.error(`文件夹 "${folderName}" 已存在`);
    return;
  }

  try {
    // 直接构造请求 URL（基于 Vite 代理的 /api）
    const url = new URL('/api', window.location.origin);
    // 拼接后端要求的参数
    url.searchParams.append('key', 'test'); // 固定验证参数
    url.searchParams.append('action', 'newFolder'); // 后端识别的“新建文件夹”操作
    url.searchParams.append('path', fileStore.currentPath); // 父目录路径（如 / 或 /docs）
    url.searchParams.append('name', folderName); // 新文件夹名称

    // 发送 GET 请求到后端
    const response = await fetch(url.toString(), { method: 'GET' });
    // 解析后端返回的 JSON 数据
    const res = await response.json();

    // 兼容后端响应格式（msg为空且err为空即视为成功）
    if (res.msg === 'ok' || (res.msg === '' && res.err === '')) {
      ElMessage.success('文件夹创建成功');
      fetchFileList(); // 刷新文件列表
    } else {
      ElMessage.error(`创建失败: ${res.err || '未知错误'}`);
    }
  } catch (error) {
    console.error('创建文件夹请求失败:', error);
    ElMessage.error('创建文件夹失败，请检查服务器是否运行');
  }
};

// 上传文件前验证
const handleBeforeUpload = (file) => {
  // 验证文件名
  if (new TextEncoder().encode(file.name).length > 64) {
    ElMessage.error('文件名不能超过64字符（UTF-8编码）');
    return false;
  }
  return true;
};

// 上传成功回调
const handleUploadSuccess = (response) => {
  if (response.msg === 'ok') {
    ElMessage.success('上传成功');
    fetchFileList();
  } else {
    ElMessage.error(`上传失败: ${response.err || '未知错误'}`);
  }
};

// 重命名文件/目录
const handleRename = async (item) => {
  const newName = prompt(`请输入新名称（当前名称：${item.name}）`, item.name);
  if (!newName || newName === item.name) return; // 用户取消输入或名称未变

  // 校验新名称（同新建文件夹的校验逻辑）
  if (new TextEncoder().encode(newName).length > 64) {
    ElMessage.error('名称不能超过64字符（UTF-8编码）');
    return;
  }
  if (newName.includes('/') || newName.includes('\\')) {
    ElMessage.error('名称不能包含 / 或 \\');
    return;
  }

  // 检查当前目录是否已存在同名文件/文件夹
  const isExist = fileList.value.some(
    (file) => file.name === newName && file.type === item.type
  );
  if (isExist) {
    ElMessage.error(`当前目录已存在名为 "${newName}" 的${item.type === 'folder' ? '文件夹' : '文件'}`);
    return;
  }

  try {
    // 1. 构造原路径（path 作为 URL 路径的一部分）
    const oldPath = fileStore.currentPath === '/'
      ? `/${item.name}`
      : `${fileStore.currentPath}/${item.name}`;
    // 去掉路径开头的 /，避免 URL 出现双斜杠（如 /api//docs/old.txt）
    const urlPath = oldPath.startsWith('/') ? oldPath.slice(1) : oldPath;

    // 2. 构造请求 URL（符合文档示例格式）
    const url = new URL(`${baseUrl}/${urlPath}`, window.location.origin);

    // 3. 拼接查询参数（key、action、new）
    url.searchParams.append('key', 'test');
    url.searchParams.append('action', 'rename'); // 接口要求的 action
    url.searchParams.append('new', newName); // 新名称参数

    // 4. 发送请求
    const response = await fetch(url.toString(), { method: 'GET' });
    const res = await response.json();

    // 5. 处理响应（兼容后端格式）
    if (response.ok && (res.msg === 'ok' || (res.msg === '' && res.err === ''))) {
      ElMessage.success('重命名成功');
      fetchFileList(); // 刷新文件列表
    } else {
      ElMessage.error(`重命名失败: ${res.err || '未知错误'}`);
    }
  } catch (error) {
    console.error('重命名请求失败:', error);
    ElMessage.error('重命名失败，请检查服务器连接');
  }
};

// 删除文件/目录（符合后端文档要求）
const handleDelete = async (item) => {
  if (!confirm(`确定删除 ${item.name} 吗？此操作不可恢复`)) return;

  try {
    // 1. 构造完整的删除路径（基于 data 目录的相对路径）
    // 例如：当前路径是 /docs，要删除 file.txt → 完整路径为 /docs/file.txt
    const fullPath = fileStore.currentPath === '/' 
      ? `/${item.name}` 
      : `${fileStore.currentPath}/${item.name}`;

    // 2. 构造请求 URL（path 作为 URL 路径的一部分，而非查询参数）
    // 后端示例：POST http://localhost:2333/docs/temp.txt?key=test&action=del
    // 对应前端 URL：/api + fullPath（注意去掉 fullPath 开头的 /，避免重复）
    const urlPath = fullPath.startsWith('/') ? fullPath.slice(1) : fullPath; // 去掉开头的 /
    const url = new URL(`${baseUrl}/${urlPath}`, window.location.origin);

    // 3. 拼接查询参数（key 和 action）
    url.searchParams.append('key', 'test');
    url.searchParams.append('action', 'del');

    // 4. 发送请求
    const response = await fetch(url.toString(), { method: 'GET' });
    const res = await response.json();

    // 5. 处理响应（兼容后端格式）
    if (response.ok && (res.msg === 'ok' || (res.msg === '' && res.err === ''))) {
      ElMessage.success(`${item.name} 删除成功`);
      fetchFileList(); // 刷新列表
    } else {
      ElMessage.error(`删除失败: ${res.err || '未知错误'}`);
    }
  } catch (error) {
    console.error('删除请求失败:', error);
    ElMessage.error('删除失败，请检查服务器连接');
  }
};

// 移动
// 状态定义
const moveDialogVisible = ref(false); // 弹窗显示状态
const currentMoveItem = ref(null); // 当前要移动的文件/目录
const targetFolderPath = ref(''); // 选中的目标目录路径
const folderList = ref([]); // 所有文件夹列表（用于弹窗选择）

// 1. 打开移动弹窗，初始化数据
const showMoveDialog = async (item) => {
  currentMoveItem.value = item; // 记录当前要移动的项
  moveDialogVisible.value = true; // 显示弹窗
  
  // 获取所有文件夹列表（用于弹窗选择，实际可递归获取所有目录）
  folderList.value = await getAllFolders(); 
};

// 2. 选择目标文件夹（记录路径）
const selectTargetFolder = (node) => {
  targetFolderPath.value = node.path; // 假设文件夹数据中有 path 字段
};

// 3. 确认移动（调用 handleMove 函数）
const confirmMove = async () => {
  if (!targetFolderPath.value) {
    ElMessage.warning('请选择目标目录');
    return;
  }
  
  // 调用移动逻辑（传入当前项和目标路径）
  await handleMove(currentMoveItem.value, targetFolderPath.value);
  
  // 关闭弹窗，重置状态
  moveDialogVisible.value = false;
  targetFolderPath.value = '';
  currentMoveItem.value = null;
};

// 辅助函数：获取所有文件夹（用于弹窗选择）
const getAllFolders = async () => {
  // 实际逻辑：递归获取所有目录（这里简化为获取根目录下的文件夹）
  try {
    const url = new URL('/api', window.location.origin);
    url.searchParams.append('key', 'test');
    url.searchParams.append('action', 'list');
    url.searchParams.append('path', '/'); // 从根目录开始
    const response = await fetch(url.toString(), { method: 'GET' });
    const res = await response.json();
    // 过滤出所有文件夹
    return res.payload?.filter(item => item.isFolder) || [];
  } catch (error) {
    console.error('获取文件夹列表失败:', error);
    return [];
  }
};

// 4. 移动核心逻辑（之前定义的 handleMove 函数）
const handleMove = async (item, targetParentPath) => {
    try {
    // 1. 构建源文件/目录的完整路径（作为 URL 路径部分）
    const sourcePath = fileStore.currentPath === '/'
      ? `/${item.name}`
      : `${fileStore.currentPath}/${item.name}`;
    // 处理路径开头的斜杠，避免 URL 出现双斜杠（如 /api//docs/file.txt）
    const urlPath = sourcePath.startsWith('/') ? sourcePath.slice(1) : sourcePath;

    // 2. 构造请求 URL（符合后端接口规范）
    // 示例：POST http://localhost:2333/old/test.txt?key=test&action=move&new=newp
    const url = new URL(`${import.meta.env.BASE_URL}api/${urlPath}`, window.location.origin);

    // 3. 拼接查询参数（key、action=move、targetPath=目标父目录）
    url.searchParams.append('key', 'test');
    url.searchParams.append('action', 'move');
    url.searchParams.append('new', targetParentPath); // 后端用 new 接收目标路径

    // 4. 发送请求（按后端示例使用 POST 方法）
    const response = await fetch(url.toString(), { method: 'GET' });
    const res = await response.json();

    // 5. 处理响应（兼容后端成功判断条件）
    if (response.ok && (res.msg === 'ok' || (res.msg === '' && res.err === ''))) {
      ElMessage.success(`${item.name} 移动成功`);
      fetchFileList(); // 刷新当前目录列表
    } else {
      ElMessage.error(`移动失败: ${res.err || '未知错误'}`);
    }
  } catch (error) {
    console.error('移动请求失败:', error);
    ElMessage.error('移动失败，请检查服务器连接');
  }
};

// 辅助函数：获取目标目录的文件列表（用于检查同名）
const getTargetFileList = async (targetPath) => {
  try {
    const url = new URL('/api', window.location.origin);
    url.searchParams.append('key', 'test');
    url.searchParams.append('action', 'list');
    url.searchParams.append('path', targetPath);
    const response = await fetch(url.toString(), { method: 'GET' });
    const res = await response.json();
    return res.payload || [];
  } catch (error) {
    console.error('获取目标目录列表失败:', error);
    return [];
  }
};

// 查看文件内容
const handleViewFile = async (item) => {
  try {
    const itemPath = fileStore.currentPath === '/' 
      ? `/${item.name}` 
      : `${fileStore.currentPath}/${item.name}`;

    const url = new URL('/api', window.location.origin);
    url.searchParams.append('key', 'test');
    url.searchParams.append('action', 'get');
    url.searchParams.append('path', itemPath);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (res.ok && data.msg === 'ok') {
      // 图片预览
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => 
        item.name.toLowerCase().endsWith(`.${ext}`)
      );

      if (isImage) {
        ElDialog({
          title: item.name,
          width: '80%',
          content: h(ElImage, {
            src: url.toString(), // 直接使用get接口作为图片源
            fit: 'contain',
            style: { maxHeight: '70vh' }
          }),
          draggable: true
        });
      } else {
        // 文本预览
        ElDialog({
          title: item.name,
          width: '80%',
          content: h(ElInput, {
            type: 'textarea',
            value: data.payload || '文件内容为空',
            rows: 15,
            readonly: true,
            style: { width: '100%', minHeight: '400px' }
          }),
          draggable: true
        });
      }
    } else {
      ElMessage.error(`查看失败: ${data.err || '未知错误'}`);
    }
  } catch (error) {
    ElMessage.error('查看文件失败');
  }
};

// 下载文件
// 适配“下载文件”的逻辑（如果接口实际触发下载）
const handleDownloadFile = async (item) => {
  if (item.isFolder) {
    ElMessage.warning('文件夹无法下载');
    return;
  }

  try {
    // 构造文件路径（同之前）
    const filePath = fileStore.currentPath === '/'
      ? `/${item.name}`
      : `${fileStore.currentPath}/${item.name}`;
    const urlPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const url = new URL(`${import.meta.env.BASE_URL}api/${urlPath}`, window.location.origin);
    url.searchParams.append('key', 'test');
    url.searchParams.append('action', 'get');

    // 创建隐藏的 a 标签触发下载
    const link = document.createElement('a');
    link.href = url.toString();
    link.download = item.name; // 指定下载文件名
    document.body.appendChild(link);
    link.click(); // 触发下载
    document.body.removeChild(link); // 清理

    ElMessage.success(`开始下载 ${item.name}`);
  } catch (error) {
    console.error('下载文件失败:', error);
    ElMessage.error('下载失败，请检查服务器连接');
  }
};

// 面包屑点击
const handleBreadcrumbClick = (index) => {
  let newPath = '/';
  if (index !== -1) {
    const segments = pathSegments.value.slice(0, index + 1);
    newPath = `/${segments.join('/')}`;
  }
  fileStore.setCurrentPath(newPath);
  fetchFileList();
};


// 返回上级 - 确保路由同步变化
const handleGoBack = () => {
  // 从路由参数获取当前路径片段（如 ['test01', 'docs']）
  const currentSegments = route.params.path || [];
  
  // 如果已在根目录，不执行操作
  if (currentSegments.length === 0) {
    ElMessage.info('已在根目录');
    return;
  }
  
  // 移除最后一个片段（返回上级）
  const newSegments = currentSegments.slice(0, -1);
  
  // 根据新片段生成路由路径（根目录为 '/'，子目录为 '/a/b'）
  const newRoutePath = newSegments.length > 0 
    ? `/${newSegments.join('/')}` 
    : '/';
  
  // 跳转路由（触发路由变化，进而同步 currentPath 并刷新列表）
  router.push(newRoutePath);
};
</script>

<style scoped>
.file-manager {
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 20px 20px;
  background-color: #f5f7fa;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.logo1 {
  width: 100px;
  height: 30px;
}
.logout-btn {
  background-color: #ff7f00;
  border-color: #ff7f00;
}
.logout-btn:hover {
  background-color: #e67100;
  border-color: #e67100;
}
.fileAdd{
  background-color: #f3ab63;
  border-color: #f3ab63;
}
.fileAdd:hover {
  background-color: #e67100;
  border-color: #e67100;
}
.fileGive{
  background-color: #f3ab63;
  border-color: #f3ab63; 
}
.fileGive:hover {
  background-color: #e67100;
  border-color: #e67100;
}

.operation-bar {
  display: flex;
  gap: 12px;
  padding: 12px 15px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.breadcrumb {
  padding: 10px 15px;
  background-color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

::v-deep .el-breadcrumb__item:not(:last-child) .el-breadcrumb__inner:hover {
  color: #409eff;
  transition: color 0.2s;
}

.file-table {
  flex: 1;
  min-height: 400px;
  background-color: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

::v-deep .folder-row {
  background-color: #fff9e6 !important;
}

::v-deep .file-row {
  background-color: #f0f7ff !important;
}

::v-deep .el-table__row:hover > td {
  background-color: #e6f7ff !important;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.file-name span:hover {
  color: #409eff;
  text-decoration: underline;
}

::v-deep .file-name .el-icon-folder {
  color: #e6a23c;
}

::v-deep .file-name .el-icon-document {
  color: #409eff;
}

::v-deep .el-button--text.danger {
  color: #f56c6c;
}

::v-deep .el-table__empty-block {
  padding: 60px 0 !important;
}

::v-deep .el-table__empty-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
}

::v-deep .el-table__empty-text .el-icon-folder-opened {
  font-size: 40px;
  margin-bottom: 15px;
  color: #ccc;
}
</style>