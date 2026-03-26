<template>
  <view class="my">
    <!-- 个人信息卡片 -->
   <view class="profile-card" @click="goToLoginIfNotLogin">
	 <view class="avatar">
	   <image
		 class="avatar-image"
		 :src="avatarSrc"
		 mode="aspectFill"
		 @error="handleAvatarError"
	   ></image>
	 </view>
	 <view class="info">
	   <text class="name">{{ userInfo.phone || '未登录' }}</text>
	   <text class="phone" v-if="!userInfo.phone">点击登录/注册</text>
	 </view>
   </view>

    <!-- 资产卡片：钻石余额 + 充值/提现 -->
    <view class="asset-card">
      <view class="diamond-info">
        <text class="diamond-label">可用钻石</text>
        <text class="diamond-amount">{{ diamondBalance }}</text>
      </view>
      <view class="asset-actions">
        <button class="recharge-btn" @click="goToRecharge">充值</button>
        <button class="withdraw-btn" @click="goToWithdraw">提现</button>
      </view>
    </view>

    <!-- 功能菜单列表 -->
    <view class="menu-list">
      <view class="menu-item" @click="goToMyParticipated">
        <text class="menu-label">我的参与</text>
        <text class="menu-arrow">▶</text>
      </view>
      <view class="menu-item" @click="goToFeedback">
        <text class="menu-label">问题反馈</text>
        <text class="menu-arrow">▶</text>
      </view>
      <view class="menu-item" @click="goToAboutUs">
        <text class="menu-label">关于我们</text>
        <text class="menu-arrow">▶</text>
      </view>
      <view class="menu-item" @click="goToContactUs">
        <text class="menu-label">联系我们</text>
        <text class="menu-arrow">▶</text>
      </view>
      <view class="menu-item" @click="logout">
        <text class="menu-label">退出登录</text>
        <text class="menu-arrow">⏻</text>
      </view>
    </view>

    <!-- 版本信息 -->
    <view class="version">v1.0.0</view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      userInfo: {
        avatar: '',
        nickname: '',
        phone: '',
        gender: '' // 假设登录后会存储 gender 字段，值为 '男' 或 '女'
      },
      diamondBalance: 0,
      defaultAvatarMale: '/static/avatar/male.png',   // 请替换为实际路径
      defaultAvatarFemale: '/static/avatar/female.png', // 请替换为实际路径
      avatarError: false // 用户头像加载失败标志
    }
  },
  computed: {
    // 根据用户头像、加载状态和性别返回最终显示的头像 URL
    avatarSrc() {
      // 如果用户有头像且未加载失败，则显示用户头像
      if (this.userInfo.avatar && !this.avatarError) {
        return this.userInfo.avatar
      }
      // 否则根据性别显示默认头像
      if (this.userInfo.gender === '男') {
        return this.defaultAvatarMale
      } else if (this.userInfo.gender === '女') {
        return this.defaultAvatarFemale
      } else {
        // 性别未知时，默认使用女性头像（或男性，根据需求调整）
        return this.defaultAvatarFemale
      }
    }
  },
  onShow() {
    const storedUserInfo = uni.getStorageSync('userInfo');
    if (storedUserInfo) {
      this.userInfo = storedUserInfo;
    } else {
      this.userInfo = { avatar: '', nickname: '', phone: '', gender: '' };
    }
    this.avatarError = false;
  
    if (this.userInfo.phone) {
      this.fetchBalance(); // 登录后调用
    } else {
      this.diamondBalance = 0;
    }
  
    // 监听充值成功事件
    uni.$off('rechargeSuccess');
    uni.$on('rechargeSuccess', () => {
      this.fetchBalance();
    });
  },
  methods: {
	  // recharge.vue - methods
	  async fetchBalance() {
	    try {
	      const res = await api.getPointsAccount();
	      this.diamondBalance = res.data.balance || 0;
	    } catch (error) {
	      console.error('获取余额失败:', error);
	      if (error.message && error.message.includes('未登录')) {
	        this.handleNotLogin();
	      }
	    }
	  },
	  // 跳转到充值页面
	  goToRecharge() {
		if (!this.userInfo.phone) {
		  uni.showToast({ title: '请先登录', icon: 'none' })
		  return
		}
		uni.navigateTo({ url: '/pages/recharge/recharge' })
	  },
    // 头像加载失败时触发
    handleAvatarError() {
      this.avatarError = true
    },
    // 未登录时点击卡片跳转登录页
    goToLoginIfNotLogin() {
      if (!this.userInfo.phone) {
        uni.navigateTo({ url: '/pages/login/login' })
      }
    },
    goToWithdraw() {
      uni.showToast({ title: '提现功能开发中', icon: 'none' })
    },
    goToMyParticipated() {
      uni.navigateTo({ url: '/pages/my-participated/my-participated' })
    },
    goToFeedback() {
      uni.showToast({ title: '问题反馈', icon: 'none' })
    },
    goToAboutUs() {
      uni.showToast({ title: '关于我们', icon: 'none' })
    },
    goToContactUs() {
      uni.showToast({ title: '联系我们', icon: 'none' })
    },
    async logout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '退出中...' })
            try {
              await api.logout()
              uni.hideLoading()
              uni.removeStorageSync('token')
              uni.removeStorageSync('userInfo')
              uni.showToast({ title: '已退出', icon: 'success' })
              setTimeout(() => {
                uni.reLaunch({ url: '/pages/login/login' })
              }, 1500)
            } catch (error) {
              uni.hideLoading()
              uni.showToast({ title: error.message || '退出失败', icon: 'none' })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.my {
  padding: 20px 16px;
  background-color: #f8f8f8;
  min-height: 100vh;
  box-sizing: border-box;
}

.profile-card {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  transition: box-shadow 0.2s ease;
  cursor: pointer;
}
.profile-card:hover {
  box-shadow: 0 8px 20px rgba(221, 3, 29, 0.08);
}

/* 头像容器 */
.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;          /* 保证图片按圆角裁剪 */
  background-color: #f0f0f0; /* 占位背景色 */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  box-shadow: 0 4px 8px rgba(221, 3, 29, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}
.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(221, 3, 29, 0.3);
}

/* 头像图片 */
.avatar-image {
  width: 100%;
  height: 100%;
}

.info {
  flex: 1;
}
.name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}
.phone {
  font-size: 15px;
  color: #666;
}

/* 资产卡片 */
.asset-card {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.diamond-info {
  display: flex;
  flex-direction: column;
}
.diamond-label {
  font-size: 14px;
  color: #999;
  margin-bottom: 4px;
}
.diamond-amount {
  font-size: 28px;
  font-weight: 700;
  color: #DD031D;
}
.asset-actions {
  display: flex;
  gap: 12px;
}
.recharge-btn {
  background-color: transparent;
  border: 1px solid #DD031D;
  color: #DD031D;
  border-radius: 40px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  transition: all 0.2s ease;
}
.recharge-btn:hover {
  background-color: #DD031D;
  color: #ffffff;
}
.withdraw-btn {
  background: linear-gradient(145deg, #DD031D, #B00217);
  color: white;
  border: none;
  border-radius: 40px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(221, 3, 29, 0.3);
}
.withdraw-btn:hover {
  background: linear-gradient(145deg, #B00217, #8F0213);
  transform: scale(1.02);
}

/* 菜单列表 */
.menu-list {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-item:hover {
  background-color: #fff9f9;
  box-shadow: inset 0 0 0 1px rgba(221, 3, 29, 0.1);
}
.menu-label {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}
.menu-arrow {
  font-size: 12px;
  color: #999;
  transition: transform 0.2s, color 0.2s;
}
.menu-item:hover .menu-arrow {
  color: #DD031D;
  transform: translateX(4px);
}

/* 版本信息 */
.version {
  text-align: center;
  font-size: 14px;
  color: #999;
  margin-top: 30px;
}
</style>