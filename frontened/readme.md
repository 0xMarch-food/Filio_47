# 项目目标
做一个网页版的文件管理系统，就像电脑里的文件资源管理器一样，可以在网页上：
- 登录系统
- 浏览文件和文件夹
- 新建文件夹
- 上传文件
- 重命名、删除、移动文件
- 查看文件内容

# 搭建开发环境
1. node.js安装
2. 创建Vue3 +Vite项目
```bash
npm create vite@latest 文件管理系统 --template vue
```
3. 其他工具安装
```bash
# Element Plus - 美观的UI组件（按钮、表格等） 
npm install element-plus 
# Axios - 发送网络请求的工具 
npm install axios 
# Pinia - 管理数据状态的工具 
npm install pinia
```
# 设计项目结构
```
src/                  # 源代码文件夹
├── api/             # 1.网络请求相关
│   ├── request.js   # 配置网络请求
│   └── file.js      # 文件操作接口
├── views/           # 2.页面文件
│   ├── LoginView.vue    # 登录页面
│   └── FileManagerView.vue # 文件管理页面
├── stores/          # 3.数据存储
│   └── file.js      # 文件相关数据
├── router/          # 4.页面路由
│   └── index.js     # 页面跳转配置
└── components/      # 5.可复用的小部件
```
# 配置路由
路由怎么写？[https://www.doubao.com/thread/w828a4f8e4363627e]
1. 导入依赖
2. 导入需要跳转的页面组件
3. 定义路由规则routes数组
4. 创建路由实例
5. 全局导航守卫（拦截处理）

在main.js里的体现：
```js
import router from './router' //导入路由实例
app.use(router) //挂载路由
```

连接后端端口：在vite.config.js里面配置
```js
server: {
    proxy: {
      '/api': {
        target: 'http://localhost:2333', // 后端接口地址
        changeOrigin: true, // 开启跨域
        rewrite: (path) => path.replace(/^\/api/, '') // 去掉请求路径中的 /api
      }
    }
  },
```
## 其他
### **样式里的`scoped`属性是啥？**
Vue 特有的样式作用域，确保当前样式只对当前组件生效，不会影响其他组件

### **为什么要用UI组件？**
假设你需要一个 “登录按钮”，用普通 HTML 和用 `el-button` 的区别：
 1. 普通 HTML 按钮（需要自己写一切）
```html
<!-- 普通按钮 -->
<button class="my-button">登录</button>

<style>
.my-button {
  /* 基础样式：尺寸、边距、字体 */
  padding: 10px 20px;
  font-size: 14px;
  /* 背景和文字颜色 */
  background: #409eff;
  color: white;
  /* 边框和圆角 */
  border: none;
  border-radius: 4px;
  /* 鼠标悬停效果 */
  cursor: pointer;
}
.my-button:hover {
  background: #66b1ff; /* hover 时加深颜色 */
}
.my-button:active {
  background: #3a8ee6; /* 点击时再加深 */
}
/* 还需要处理禁用状态、加载状态... */
</style>
```
- 你需要手动写样式（颜色、尺寸、圆角）、交互（hover/click 效果）、状态（禁用、加载中）。
- 如果要改风格（比如从蓝色换成橙色），需要逐个修改 CSS，非常繁琐。
 2. Element Plus 的 `el-button`（直接用现成的）
```html
<!-- UI 组件按钮 -->
<el-button type="primary">登录</el-button>
<el-button type="success" disabled>注册（禁用）</el-button>
<el-button type="warning" loading>提交中...</el-button>
```
- 无需写 CSS，`type="primary"` 直接自带蓝色主题、悬停效果、圆角。
- 只需加 `disabled` 属性就禁用按钮，加 `loading` 属性就显示加载动画。
- 想换风格？改 `type` 为 `success`（绿色）、`warning`（橙色）即可，无需改样式。
### **没有后端接口如何模拟数据和本地存储？**
以登录为例子，登录功能的完整流程是：`用户输入账号密码 → 前端发送请求到后端 → 后端验证通过 → 返回Token → 前端存储Token → 跳转到文件管理页`

1. 纯前端模拟（固定账号密码），适合场景：只需演示登录流程，不需要真实验证（比如练手项目）。
```js
// 模拟登录逻辑
const handleLogin = () => {
  // 预设“正确”的账号密码（纯前端模拟）
  const mockUser = {
    username: 'admin',
    password: '123456'
  }

  // 验证输入
  if (!username.value) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!password.value) {
    ElMessage.warning('请输入密码')
    return
  }

  // 对比预设值
  if (username.value === mockUser.username && password.value === mockUser.password) {
    // 登录成功：保存状态到本地存储
    localStorage.setItem('isLogin', 'true') // 标记已登录
    localStorage.setItem('userInfo', JSON.stringify({ username: username.value })) // 保存用户信息
    ElMessage.success('登录成功')
    router.push('/') // 跳转到首页
  } else {
    ElMessage.error('用户名或密码错误')
  }
}
```
1. 用Mock服务器模拟接口请求，适合场景：想模拟 “前后端分离” 的真实开发流程（像调用真实接口一样写代码）。
- 用前端工具（如 `Mock.js`）创建一个 “假的后端接口”。
-  登录时，像调用真实接口一样发送请求到这个 “假接口”。
- 假接口会返回 “成功” 或 “失败” 的模拟数据，前端根据返回结果处理。
安装
```bash
npm install mockjs --save-dev
```
创建 Mock 服务（新建 `src/mock/login.js`）
再main.js中引入Mock
在登录组件中调用“假接口”

