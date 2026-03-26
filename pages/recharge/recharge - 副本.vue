<template>
  <view class="my">
    <!-- 个人信息卡片 - 点击跳转登录（仅未登录时） -->
    <view class="profile-card" @click="goToLoginIfNotLogin">
      <view class="avatar">
        <text class="avatar-text">{{ userInfo.avatar || '👤' }}</text>
      </view>
      <view class="info">
        <text class="name">{{ userInfo.nickname || '未登录' }}</text>
        <text class="phone">{{ userInfo.phone || '点击登录/注册' }}</text>
      </view>
    </view>
    
    <!-- 菜单列表（保持不变） -->
    <view class="menu-list">
      <view class="menu-item" @click="goToMyTasks">
        <text class="menu-label">我的任务</text>
        <text class="menu-arrow">▶</text>
      </view>
      <view class="menu-item" @click="goToWallet">
        <text class="menu-label">押金</text>
        <text class="menu-arrow">▶</text>
      </view>
      <view class="menu-item" @click="goToShare">
        <text class="menu-label">立即分享</text>
        <text class="menu-arrow">▶</text>
      </view>
      <view class="menu-item" @click="goToSettings">
        <text class="menu-label">设置</text>
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
import api from '@/utils/api.js'  // 导入封装的API模块

export default {
  data() {
    return {
      userInfo: {
        avatar: '🐶',        // 默认头像
        nickname: '',
        phone: ''
      }
    }
  },
  onShow() {
    // 每次进入页面从本地存储获取最新的用户信息
    const storedUserInfo = uni.getStorageSync('userInfo')
    if (storedUserInfo) {
      this.userInfo = storedUserInfo
    } else {
      // 未登录状态清空信息
      this.userInfo = { avatar: '🐶', nickname: '', phone: '' }
    }
  },
  methods: {
    goToMyTasks() {
      uni.showToast({ title: '我的任务', icon: 'none' })
      // 实际跳转：uni.navigateTo({ url: '/pages/my-tasks/my-tasks' })
    },
    goToWallet() {
      uni.showToast({ title: '押金', icon: 'none' })
    },
    goToShare() {
      uni.showToast({ title: '分享', icon: 'none' })
    },
    goToSettings() {
      uni.showToast({ title: '设置', icon: 'none' })
    },
    // 未登录时点击卡片跳转到登录页
    goToLoginIfNotLogin() {
      if (!this.userInfo.phone) {
        uni.navigateTo({ url: '/pages/login/login' })
      }
    },
    // 退出登录
    async logout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '退出中...' })
            try {
              await api.logout()                     // 调用退出接口
              uni.hideLoading()
              // 清除本地存储的相关信息
              uni.removeStorageSync('token')
              uni.removeStorageSync('userInfo')
              // uni.removeStorageSync('registeredPhone') // 可选，清除手机号记录
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
/* 与原有样式完全相同，仅补充卡片点击光标提示 */
.profile-card {
  cursor: pointer;        /* 增加点击提示（仅H5生效，App无影响） */
  transition: box-shadow 0.2s ease;
}
.profile-card:hover {
  box-shadow: 0 8px 20px rgba(221, 3, 29, 0.08);
}
.my {
  padding: 20px 16px;
  background-color: #f8f8f8;
  min-height: 100vh;
  box-sizing: border-box;
}

/* 个人信息卡片 - 与麻将桌卡片风格一致 */
.profile-card {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  transition: box-shadow 0.2s ease;
}
.profile-card:hover {
  box-shadow: 0 8px 20px rgba(221, 3, 29, 0.08);
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #DD031D;
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

.avatar-text {
  font-size: 32px;
  color: white;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
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