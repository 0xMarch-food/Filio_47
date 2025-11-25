// 模拟登录（前端验证）
export function login(username, password) {
  return new Promise((resolve, reject) => {
    // 模拟简单的登录验证
    if (username === 'admin' && password === '123456') {
      resolve({
        msg: 'ok',
        payload: {
          username,
          token: 'mock_token_' + Date.now()
        }
      });
    } else {
      reject({
        msg: '用户名或密码错误',
        err: 'LOGIN_FAILED'
      });
    }
  });
}