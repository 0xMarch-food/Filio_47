//1.导入依赖
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
//2.导入需要的路由组件
import LoginView from '../views/LoginView.vue'
import FileManagerView from '../views/FileManagerView.vue'
//3.定义路由规则routes数组
const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { 
      title: '登录'
    } 
  },
  {
    //用通配符 * 匹配子路径（如 /test01、/test01/docs 等）
    path: '/:path*',
    name: 'fileManager',
    component: FileManagerView,
    meta: { 
      title: '文件管理', //页面标题
      requireAuth: true  //是否需要登录才能访问
    } 
  }
]
//4.创建路由实例
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: routes
})

// const router = createRouter({
//   history: createWebHistory(),
//   routes
// })

//5.全局导航守卫（用于路由跳转时的拦截处理）
router.beforeEach((to, from, next) => {
  if(to.meta.requireAuth){
    const isLogin = localStorage.getItem('token')
    if(isLogin){
      next();
    }else{
      next('/login');
    }
  }else{
    next()
  }
})


// router.beforeEach((to, from, next) => {
//   if (to.meta.requireAuth && !localStorage.getItem('token')) {
//     next('/login')
//   } else {
//     next()
//   }
// })

//6.导出路由实例
export default router