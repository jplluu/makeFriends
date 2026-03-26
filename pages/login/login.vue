<template>
  <view class="login">
    <!-- 标题 -->
    <view class="title">登录</view>
    
    <!-- 登录方式切换 -->
    <view class="mode-switch">
      <view 
        class="mode-item" 
        :class="{ active: loginMode === 'code' }"
        @click="switchMode('code')"
      >
        验证码登录
      </view>
      <view 
        class="mode-item" 
        :class="{ active: loginMode === 'password' }"
        @click="switchMode('password')"
      >
        密码登录
      </view>
    </view>
    
    <!-- 手机号 -->
    <view class="form-item">
      <text class="label">手机号</text>
      <input 
        maxlength="11"
        type="number" 
        class="input" 
        placeholder="请输入手机号码" 
        v-model="form.phone"
        placeholder-class="placeholder"
      />
    </view>
    
    <!-- 验证码/密码 -->
    <view class="form-item">
      <text class="label">{{ loginMode === 'code' ? '验证码' : '密码' }}</text>
      <!-- 验证码模式 -->
      <view v-if="loginMode === 'code'" class="captcha-wrap">
        <input 
          type="number" 
          class="input captcha-input" 
          placeholder="4位验证码" 
          maxlength="4"
          v-model="form.captcha"
          placeholder-class="placeholder"
        />
        <button 
          class="captcha-btn captcha-btn-code" 
          @click="sendCaptcha" 
          :disabled="sending"
          :class="{ 'captcha-btn-disabled': sending }"
        >
          {{ captchaText }}
        </button>
      </view>
      <!-- 密码模式 -->
      <input 
        v-else
        type="password" 
        class="input" 
        placeholder="请输入密码" 
        v-model="form.password"
        placeholder-class="placeholder"
      />
    </view>
    
    <!-- 协议勾选 -->
    <view class="form-item agreement-item">
      <label class="agreement">
        <checkbox 
          value="agree" 
          :checked="agreed" 
          @click="toggleAgree"
          color="#DD031D"
        />
        <text class="agreement-text">
          我已阅读并同意
          <text class="link" @click.stop="openUserAgreement">《用户协议》</text>
          和
          <text class="link" @click.stop="openPrivacyPolicy">《隐私政策》</text>
        </text>
      </label>
    </view>
    
    <!-- 登录按钮 -->
    <button class="submit-btn" @click="handleLogin">登录</button>
    
    <!-- 注册链接 -->
    <view class="register-link">
      <text>还没有账号？</text>
      <text class="link" @click="goToRegister">立即注册</text>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js';

export default {
  data() {
    return {
      loginMode: 'code', // 'code' 或 'password'
      form: {
        phone: '',
        captcha: '',
        password: ''
      },
      sending: false,
      captchaText: '获取验证码',
      agreed: true // 默认勾选
    };
  },
  onLoad() {
    // 预填已存储的手机号
    const savedPhone = uni.getStorageSync('registeredPhone');
    if (savedPhone) {
      this.form.phone = savedPhone;
    }
  },
  methods: {
    // 切换登录方式
    switchMode(mode) {
      this.loginMode = mode;
      // 切换时清空对应的输入
      if (mode === 'code') {
        this.form.password = '';
      } else {
        this.form.captcha = '';
      }
    },

    // 发送验证码（登录类型）
    async sendCaptcha() {
      // 校验手机号
      if (!this.form.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' });
        return;
      }
      if (this.form.phone.length !== 11) {
        uni.showToast({ title: '手机号应为11位', icon: 'none' });
        return;
      }
      
      // 开始发送，禁用按钮
      this.sending = true;
      this.captchaText = '发送中...';
      
      try {
        // 调用发送验证码API，type=2 表示登录
        const result = await api.sendSmsCode({
          phone: this.form.phone,
          type: 2  // 2-登录
        });
        
        // 发送成功
        uni.showToast({ title: '验证码已发送', icon: 'success' });
        
        // 60秒倒计时
        let countdown = 60;
        const timer = setInterval(() => {
          countdown--;
          this.captchaText = `${countdown}秒后重试`;
          if (countdown <= 0) {
            clearInterval(timer);
            this.sending = false;
            this.captchaText = '重新获取';
          }
        }, 1000);
        
      } catch (error) {
        // 发送失败
        console.error('发送验证码失败', error);
        uni.showToast({ 
          title: error.message || '发送失败', 
          icon: 'none' 
        });
        this.sending = false;
        this.captchaText = '重新获取';
      }
    },

    // 切换同意状态
    toggleAgree() {
      this.agreed = !this.agreed;
    },

    // 打开用户协议
    openUserAgreement() {
      uni.showToast({ title: '用户协议', icon: 'none' });
    },

    // 打开隐私政策
    openPrivacyPolicy() {
      uni.showToast({ title: '隐私政策', icon: 'none' });
    },

    // 处理登录
    async handleLogin() {
      // 协议检查
      if (!this.agreed) {
        uni.showToast({ title: '请先同意用户协议', icon: 'none' });
        return;
      }
      
      // 手机号验证
      if (!this.form.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' });
        return;
      }
      if (this.form.phone.length !== 11) {
        uni.showToast({ title: '手机号应为11位', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '登录中...' });
      
      try {
        let result;
        
        if (this.loginMode === 'code') {
          // 验证码登录
          if (!this.form.captcha) {
            uni.hideLoading();
            uni.showToast({ title: '请输入验证码', icon: 'none' });
            return;
          }
          if (this.form.captcha.length !== 4) {
            uni.hideLoading();
            uni.showToast({ title: '验证码应为4位', icon: 'none' });
            return;
          }
          
          // 调用验证码登录接口（如果后端有专门的接口，可能需要调整）
          // 这里假设后端支持使用手机号+验证码登录（与密码登录共用接口或另有接口）
          // 根据实际后端接口调整，可能需要调用不同的 API
          result = await api.login({
            phone: this.form.phone,
            smsCode: this.form.captcha  // 如果后端要求这样传，需调整
          });
          
        } else {
          // 密码登录
          if (!this.form.password) {
            uni.hideLoading();
            uni.showToast({ title: '请输入密码', icon: 'none' });
            return;
          }
          if (this.form.password.length < 8) {
            uni.hideLoading();
            uni.showToast({ title: '密码至少8位', icon: 'none' });
            return;
          }
          
          result = await api.login({
            phone: this.form.phone,
            password: this.form.password
          });
        }
        
        console.log('登录结果', result);
        uni.hideLoading();
        
        // 保存 token
        let token = '';
        if (result && result.data && result.data.token) {
          token = result.data.token;
        } else if (result && result.token) {
          token = result.token;
        } else {
          token = 'mock_token';
        }
        uni.setStorageSync('token', token);
        console.log('token', token);
        
        // 保存用户信息
        let userInfo = {
          avatar: '🐶',
          nickname: '',
          phone: this.form.phone 
        };
        
        if (result && result.data && result.data.nickname) {
          userInfo.nickname = result.data.nickname || '';
          userInfo.phone = result.data.phone || this.form.phone;
          userInfo.avatar = result.data.avatar || '🐶';
        } else {
          userInfo.nickname = `用户${this.form.phone.slice(-4)}`;
        }
        
        uni.setStorageSync('userInfo', userInfo);
        uni.setStorageSync('registeredPhone', this.form.phone);
        
        // 跳转到首页
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/index/index' });
        }, 1500);
        
      } catch (error) {
        uni.hideLoading();
        console.error('登录失败', error);
        uni.showToast({ 
          title: error.message || '登录失败', 
          icon: 'none' 
        });
      }
    },

    // 跳转到注册页
    goToRegister() {
      uni.navigateTo({ url: '/pages/register/register' });
    }
  }
};
</script>

<style scoped>
/* 样式保持不变 */
.login {
  padding: 30px;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #DD031D;
  margin-bottom: 30px;
}

.mode-switch {
  display: flex;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
  border: 1px solid #e0e0e0;
}
.mode-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  border-radius: 10px;
  transition: all 0.2s;
  cursor: pointer;
}
.mode-item.active {
  background-color: #FF5A5A;
  color: #ffffff;
}
.mode-item:hover:not(.active) {
  background-color: #f5f5f5;
}

.form-item {
  margin-bottom: 24px;
}

.label {
  display: block;
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.input {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 16px;
  color: #333;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
  line-height: 1.5;
  min-height: 48px;
}

.input:hover {
  border-color: #DD031D;
  box-shadow: 0 0 0 2px rgba(221, 3, 29, 0.1);
}

.placeholder {
  color: #999;
  font-size: 16px;
}

.captcha-wrap {
  display: flex;
  gap: 10px;
}
.captcha-input {
  flex: 1;
}

.captcha-btn {
  background-color: transparent;
  border: 1px solid #DD031D;
  color: #DD031D;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  min-width: 100px;
  box-sizing: border-box;
  height: 48px;
  line-height: 1;
}
.captcha-btn:hover {
  background-color: #DD031D;
  color: #ffffff;
  border-color: #DD031D;
  box-shadow: 0 0 0 2px rgba(221, 3, 29, 0.1);
}
.captcha-btn-disabled {
  opacity: 0.6;
  pointer-events: none;
  border-color: #ccc;
  color: #999;
}

.agreement-item {
  background: none;
  border: none;
  padding: 0;
}
.agreement {
  display: flex;
  align-items: center;
  font-size: 15px;
  color: #333;
}
checkbox {
  margin-right: 8px;
  transform: scale(0.9);
}
.agreement-text {
  line-height: 1.5;
}
.link {
  color: #DD031D;
  text-decoration: underline;
  cursor: pointer;
}
.link:hover {
  color: #B00217;
}

.submit-btn {
  background-color: #DD031D;
  color: white;
  border: none;
  border-radius: 40px;
  padding: 12px 24px;
  font-size: 18px;
  font-weight: 500;
  margin: 40px auto 0;
  width: 50%;
  display: block;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(221, 3, 29, 0.3);
  line-height: 1.2;
}
.submit-btn:hover {
  background-color: #B00217;
  box-shadow: 0 6px 16px rgba(221, 3, 29, 0.4);
  transform: scale(1.02);
}

.register-link {
  text-align: center;
  font-size: 16px;
  color: #666;
  margin-top: 20px;
}
.register-link .link {
  margin-left: 4px;
  font-weight: 500;
}
</style>