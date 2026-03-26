<template>
  <view class="register">
    <!-- 标题 -->
    <view class="title">注册</view>
    
    <!-- 手机号 -->
    <view class="form-item">
      <text class="label">手机号</text>
      <input 
        focus 
        maxlength="11"
        type="number" 
        class="input" 
        placeholder="请输入手机号码" 
        v-model="form.phone"
        placeholder-class="placeholder"
      />
    </view>
    
    <!-- 验证码（带获取按钮） -->
    <view class="form-item">
      <text class="label">验证码</text>
      <view class="captcha-wrap">
        <input 
          type="number" 
          class="input captcha-input" 
          placeholder="4位验证码" 
          maxlength="4"
          v-model="form.captcha"
          placeholder-class="placeholder"
        />
        <button 
          class="captcha-btn" 
          @click="sendCaptcha" 
          :disabled="sending"
          :class="{ 'captcha-btn-disabled': sending }"
        >
          {{ captchaText }}
        </button>
      </view>
    </view>
    
    <!-- 密码 -->
    <view class="form-item">
      <text class="label">密码</text>
      <input 
        type="password" 
        class="input" 
        placeholder="至少8位字符" 
        v-model="form.password"
        placeholder-class="placeholder"
      />
    </view>
    
    <!-- 确认密码 -->
    <view class="form-item">
      <text class="label">确认密码</text>
      <input 
        type="password" 
        class="input" 
        placeholder="请再次输入密码" 
        v-model="form.confirmPwd"
        placeholder-class="placeholder"
      />
    </view>
    
    <!-- 性别（字典：1-男，2-女） -->
    <view class="form-item">
      <text class="label">性别</text>
      <radio-group class="radio-group" @change="onGenderChange">
        <label class="radio-label">
          <radio value="1" :checked="form.gender === 1" color="#DD031D" /> 男
        </label>
        <label class="radio-label">
          <radio value="2" :checked="form.gender === 2" color="#DD031D" /> 女
        </label>
      </radio-group>
    </view>
    
    <!-- 年龄（可输入，可步进） -->
    <view class="form-item">
      <text class="label">年龄</text>
      <view class="age-input-wrap">
        <input 
          type="number" 
          class="input age-input" 
          v-model="form.age" 
          @input="validateAge"
          placeholder="18-80"
          placeholder-class="placeholder"
        />
        <view class="age-stepper">
          <view class="step-up" @click="increaseAge">+</view>
          <view class="step-down" @click="decreaseAge">−</view>
        </view>
      </view>
    </view>
    
    <!-- 确定按钮 -->
    <button class="submit-btn" @click="handleRegister">确定</button>
    
    <!-- 跳转到登录页面的链接 -->
    <view class="login-link">
      <text>已有账号？</text>
      <text class="link" @click="goToLogin">立即登录</text>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js';
export default {
  data() {
    return {
      form: {
        phone: '',
        captcha: '',
        password: '',
        confirmPwd: '',
        gender: 1,        // 默认男
        age: 18,
        avatar: '',
        nickname: ''
      },
      sending: false,
      captchaText: '获取验证码'
    };
  },
  methods: {
    // 发送验证码
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
        // 调用封装的发送验证码API，传入对象参数
        const result = await api.sendSmsCode({
          phone: this.form.phone,
          type: 1,  // 1-注册
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
    // 性别变更处理（将字符串value转为数字）
    onGenderChange(e) {
      this.form.gender = parseInt(e.detail.value, 10);
    },
    // 年龄增加
    increaseAge() {
      let newAge = this.form.age + 1;
      if (newAge > 80) newAge = 80;
      this.form.age = newAge;
    },
    // 年龄减少
    decreaseAge() {
      let newAge = this.form.age - 1;
      if (newAge < 18) newAge = 18;
      this.form.age = newAge;
    },
    // 输入时验证范围（自动修正）
    // 年龄增加
    increaseAge() {
      let current = this.form.age;
      // 如果当前为空，视为18
      if (current === '' || isNaN(current)) {
        current = 18;
      }
      let newAge = current + 1;
      if (newAge > 80) newAge = 80;
      this.form.age = newAge;
    },
    decreaseAge() {
      let current = this.form.age;
      if (current === '' || isNaN(current)) {
        current = 18;
      }
      let newAge = current - 1;
      if (newAge < 18) newAge = 18;
      this.form.age = newAge;
    },
    
    // 处理注册
    async handleRegister() {
      // 表单验证
      if (!this.form.phone || !this.form.captcha || !this.form.password || !this.form.confirmPwd) {
        uni.showToast({ title: '请填写完整', icon: 'none' });
        return;
      }
      if (this.form.phone.length !== 11) {
        uni.showToast({ title: '手机号应为11位', icon: 'none' });
        return;
      }
      if (this.form.password.length < 8) {
        uni.showToast({ title: '密码至少8位', icon: 'none' });
        return;
      }
      if (this.form.password !== this.form.confirmPwd) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' });
        return;
      }
      // 年龄范围校验（虽然输入时会自动修正，但这里再次检查并给出明确提示）
      if (this.form.age < 18 || this.form.age > 80) {
        uni.showToast({ title: '年龄必须在18-80之间', icon: 'none' });
        return;
      }
      
      // 显示加载中
      uni.showLoading({ title: '注册中...' });
      
      try {
        // 生成昵称（使用手机号后4位）
        const nickname = `用户${this.form.phone.slice(-4)}`;
        // 根据性别选择头像图片路径（字典：1-男，2-女；0-未知使用默认头像）
        let avatarPath = '';
        if (this.form.gender === 1) {
          avatarPath = '/static/avatar/male_60x60.png';
        } else if (this.form.gender === 2) {
          avatarPath = '/static/avatar/female_60x60.png';
        } else {
          avatarPath = '/static/avatar/default_60x60.png'; // 未知性别使用默认头像
        }
        this.form.avatar = avatarPath;
        
        // 异步调用注册API
        const result = await api.register({
          phone: this.form.phone,
          smsCode: this.form.captcha,
          password: this.form.password,
          nickname: nickname,
          gender: this.form.gender, // 直接传递数字（0、1、2）
          avatar: this.form.avatar,
		  age: this.form.age
        });
        
        console.log('注册结果', result);
        
        uni.hideLoading();
        
        // 注册成功
        uni.showToast({ title: '注册成功', icon: 'success' });
        
        // 保存 token
        if (result && result.data && result.data.token) {
          uni.setStorageSync('token', result.data.token);
        } else if (result && result.token) {
          uni.setStorageSync('token', result.token);
        } else {
          uni.setStorageSync('token', 'mock_token');
        }
        let userInfo = {
          userId: result.data?result.data.userId:'',
          avatar: this.form.avatar,
          nickname: this.form.nickname,
          phone: this.form.phone,
        };
        if (result && result.data && result.data.nickname) {
          userInfo.nickname = result.data.nickname || '';
          userInfo.phone = result.data.phone || this.form.phone;
          userInfo.avatar = result.data.avatar || this.form.avatar;
        } else {
          // 如果后端没有返回用户信息，至少保存手机号
          userInfo.nickname = `用户${this.form.phone.slice(-4)}`;
        }
        // 保存用户信息（可选）
        uni.setStorageSync('userInfo', userInfo);
        uni.setStorageSync('registeredPhone', this.form.phone);
        
        // 跳转到首页
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/index/index' });
        }, 1500);
        
      } catch (error) {
        uni.hideLoading();
        console.error('注册失败', error);
        uni.showToast({ 
          title: error.message || '注册失败', 
          icon: 'none' 
        });
      }
    },
    
    // 跳转到登录页面
    goToLogin() {
      uni.navigateTo({ url: '/pages/login/login' });
    }
  }
};
</script>

<style scoped>
.register {
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

/* 统一输入框、选择器、单选框组样式 */
.input,
.picker-value,
.radio-group {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 16px;  /* 统一内边距，保证正常输入 */
  font-size: 16px;
  color: #333;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
  line-height: 1.5;     /* 适当的行高 */
  min-height: 48px;     /* 确保最小高度一致 */
}

.input:hover,
.picker-value:hover,
.radio-group:hover {
  border-color: #DD031D;
  box-shadow: 0 0 0 2px rgba(221, 3, 29, 0.1);
}

.placeholder {
  color: #999;
  font-size: 16px;
}

/* 验证码行布局 */
.captcha-wrap {
  display: flex;
  gap: 10px;
}
.captcha-input {
  flex: 1;
}

/* 验证码按钮 - 高度与输入框匹配 */
.captcha-btn {
  background-color: transparent;
  border: 1px solid #DD031D;
  color: #DD031D;
  border-radius: 12px;  /* 改为12px与输入框一致 */
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
  height: 48px;         /* 固定高度与输入框匹配 */
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

/* 性别单选框组 - 内部布局垂直居中 */
.radio-group {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 12px 16px;   /* 与输入框内边距一致 */
  line-height: 1.5;
  min-height: 48px;
}
.radio-label {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #333;
  line-height: 1.5;
}
radio {
  margin-right: 6px;
  transform: scale(0.9);
}

/* 年龄输入区域布局 */
.age-input-wrap {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.age-input {
  flex: 1;
  min-width: 0; /* 防止flex溢出 */
}
.age-stepper {
  display: flex;
  flex-direction: column;
  width: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  background-color: #ffffff;
}
.age-stepper .step-up,
.age-stepper .step-down {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
  user-select: none;
  height: 24px; /* 总高度48px，每个按钮一半 */
  line-height: 1;
}
.age-stepper .step-up:hover,
.age-stepper .step-down:hover {
  background-color: #f0f0f0;
}
.age-stepper .step-up:active,
.age-stepper .step-down:active {
  background-color: #e0e0e0;
}
/* 中间加一条分隔线 */
.age-stepper .step-up {
  border-bottom: 1px solid #e0e0e0;
}

/* 确定按钮 */
.submit-btn {
  background-color: #DD031D;
  color: white;
  border: none;
  border-radius: 40px;
  padding: 12px 24px;   /* 调整内边距，使按钮更合理 */
  font-size: 18px;
  font-weight: 500;
  margin: 40px auto 0;
  width: 60%;
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

/* 跳转到登录页面的链接样式 */
.login-link {
  text-align: center;
  font-size: 16px;
  color: #666;
  margin-top: 20px;
}
.login-link .link {
  color: #DD031D;
  text-decoration: underline;
  cursor: pointer;
}
.login-link .link:hover {
  color: #B00217;
}
</style>