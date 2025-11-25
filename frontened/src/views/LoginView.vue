<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 左侧图片区域 -->
      <div class="login-img">
        <!-- @是Vue项目中配置的别名，代表src目录 -->
        <img src="@/assets/File.jpg" alt="系统登录左侧图" />
      </div>
      <!-- 右侧操作区 -->
      <div class="login-form">
        <div class="logo">
          <img src="@/assets/FilioLogo.png" class="logo1" alt="项目logo"/>
        </div>
        
        <!-- 保留输入框但无需验证 -->
        <el-form>
          <el-form-item label="用户名">
            <el-input v-model="username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="password" type="password" placeholder="请输入密码" />
          </el-form-item>
          <el-form-item>
            <!-- 点击直接跳转 -->
            <el-button type="primary" @click="handleLogin" class="login-btn">进入系统</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

//获取路由实例
const router = useRouter()

//表单
const username = ref('')
const password  = ref('')


const handleLogin = () => {
    const mockUser = {
        username:'admin',
        password:'123456'
    }
    if (!username.value){
        ElMessage.warning('用户名不能为空！')
        return
    }
    if (!password.value){
        ElMessage.warning('密码不能为空！')
        return
    }
    if (username.value === mockUser.username && password.value ===mockUser.password){
        //模拟后端返回的登录凭证
        localStorage.setItem('token', 'true');
        //保存用户信息
        localStorage.setItem('userInfo', JSON.stringify({ username:username.value}))  
        ElMessage.success('登录成功！')
        router.push('/')
    } else {
        ElMessage('用户名或密码错误！')
    }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.login-card {
  display: flex;
  width: 800px;
  height: 500px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.login-img {
  flex: 1;
  height: 100%;
}

.login-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-form {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.logo {
  text-align: center;
  margin-bottom: 30px;
}

.logo1 {
  width: 100px;
  height: 40px;
  margin: 0 auto;
}

.el-form {
  margin-top: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}

.login-btn {
  background-color: #ff7f00;
  border-color: #ff7f00;
  width: 100%;
}

.login-btn:hover {
  background-color: #e67100;
  border-color: #e67100;
}
</style>