<template>
  <view class="guidance">
    <swiper 
      class="swiper" 
      circular 
      :indicator-dots="true" 
      indicator-color="#DDDDDD" 
      indicator-active-color="#DD031D"
      autoplay 
      interval="3000"
      duration="500"
    >
      <swiper-item v-for="(item, index) in guides" :key="index">
        <view class="slide">
          <view class="icon-wrapper">
            <text class="icon">{{ item.icon }}</text>
          </view>
          <text class="title">{{ item.title }}</text>
          <text class="desc">{{ item.desc }}</text>
        </view>
      </swiper-item>
    </swiper>
    
    <button class="action-btn" @click="goToNext">立即体验</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      guides: [
        { 
          icon: '🔍', 
          title: '发现身边零工', 
          desc: '附近兼职任务，随时查看' 
        },
        { 
          icon: '🤝', 
          title: '即时协作', 
          desc: '快速匹配，高效沟通' 
        },
        { 
          icon: '💰', 
          title: '安全支付', 
          desc: '平台保障，实时到账' 
        }
      ]
    };
  },
  methods: {
    goToNext() {
      uni.setStorageSync('hasLaunched', true);
      const token = uni.getStorageSync('token');
      const registeredPhone = uni.getStorageSync('registeredPhone');
      
      if (token) {
        uni.reLaunch({ url: '/pages/index/index' });
      } else if (registeredPhone) {
        uni.reLaunch({ url: '/pages/login/login' });
      } else {
        uni.reLaunch({ url: '/pages/register/register' });
      }
    }
  }
};
</script>

<style scoped>
.guidance {
  height: 100vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.swiper {
  flex: 1;
  width: 100%;
}

.slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 40px;
  box-sizing: border-box;
}

.icon-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: #f8f8f8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}
.icon-wrapper:hover {
  transform: scale(1.05);
}
.icon {
  font-size: 64px;
  line-height: 1;
}

.title {
  font-size: 32px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16px;
  text-align: center;
}

.desc {
  font-size: 16px;
  color: #666666;
  text-align: center;
  line-height: 1.6;
}

/* 自定义指示点样式（通过属性已设置） */
.action-btn {
  background-color: #DD031D;
  color: white;
  border: none;
  border-radius: 40px;
  padding: 14px 24px;
  font-size: 18px;
  font-weight: 500;
  width: 260px;
  margin: 0 auto 50px auto;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(221, 3, 29, 0.3);
}
.action-btn:hover {
  background-color: #B00217;
  box-shadow: 0 6px 16px rgba(221, 3, 29, 0.4);
  transform: scale(1.02);
}
</style>