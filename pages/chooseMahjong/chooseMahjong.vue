<template>
  <view class="choose-mahjong">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="nav-title">选择附近麻将馆</view>
      <view class="nav-right"></view>
    </view>

    <!-- 搜索框 -->
    <view class="search-box">
      <text class="search-icon">🔍</text>
      <input 
        type="text" 
        class="search-input" 
        placeholder="搜索3公里内麻将馆" 
        v-model="keyword"
        @confirm="searchMahjong"
        confirm-type="search"
      />
      <text v-if="keyword" class="clear-btn" @click="clearSearch">✕</text>
    </view>

    <!-- 当前位置提示 -->
    <view class="location-tip">
      <text class="location-icon">📍</text>
      <text class="location-text">当前位置周边3公里内</text>
    </view>

    <!-- 麻将馆列表 -->
    <scroll-view class="list-scroll" scroll-y>
      <view v-if="loading" class="loading-text">加载中...</view>
      <view v-else-if="poiList.length === 0" class="empty-text">
        未找到3公里内的麻将馆
      </view>
      <view 
        v-else
        class="poi-item" 
        v-for="(item, index) in poiList" 
        :key="index"
        @click="selectPoi(item)"
      >
        <view class="poi-name" :class="{ 'nearest': index === 0 }">{{ item.name }}</view>
        <view class="poi-address">{{ item.address }}</view>
        <view class="poi-distance" :class="{ 'nearest-distance': index === 0 }">{{ item.distance }}米</view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
// 引入高德地图SDK
import amap from '@/utils/amap-wx.js';

export default {
  data() {
    return {
      keyword: '',        // 搜索关键词
      poiList: [],
      loading: false,
      location: { lat: 0, lng: 0 }, // 当前定位坐标
      amapPlugin: null,
      maxDistance: 3000   // 3公里 = 3000米
    };
  },
  onLoad() {
    // 初始化高德插件
    this.amapPlugin = new amap.AMapWX({
      key: 'a24917453af0a37f58ca8943fb565bce' // 您的小程序Key
    });
    this.getCurrentLocation();
  },
  methods: {
    // 获取当前位置
    getCurrentLocation() {
      uni.showLoading({ title: '定位中...' });
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.location.lat = res.latitude;
          this.location.lng = res.longitude;
          uni.hideLoading();
          this.searchMahjong(); // 获取位置后自动搜索
        },
        fail: (err) => {
          uni.hideLoading();
          console.log('定位失败', err);
          uni.showToast({ title: '定位失败，使用默认位置', icon: 'none' });
          // 使用默认坐标（长沙市中心）
          this.location = { lat: 28.2282, lng: 112.9389 };
          this.searchMahjong();
        }
      });
    },

    // 搜索周边麻将馆（限定3公里内）
    searchMahjong() {
      if (!this.amapPlugin) return;
      this.loading = true;
      
      // 构建搜索关键词：如果用户输入了关键词，则搜索该关键词，否则搜索"麻将馆"
      const keywords = this.keyword ? this.keyword : '麻将馆';
      
      this.amapPlugin.getPoiAround({
        querykeywords: keywords,
        location: `${this.location.lng},${this.location.lat}`,
        radius: this.maxDistance, // 严格限制搜索半径3000米
        success: (data) => {
          this.loading = false;
          if (data && data.poisData && data.poisData.length > 0) {
            // 处理返回的POI数据
            this.poiList = data.poisData
              .map(poi => {
				  // 处理手机号：将常见分隔符（;、空格等）替换为逗号
				  let telStr = poi.tel || '';
				  if (Array.isArray(telStr)) {
					telStr = telStr.join(',');
				  } else {
					telStr = String(telStr).replace(/[;；\s]+/g, ',');
				  }	
                // 处理图片数组 -> 字符串（多个 url 用逗号分隔）
                let photoStr = '';
                if (poi.photos && poi.photos.length > 0) {
                  photoStr = poi.photos.map(p => p.url).join(',');
                }
                return {
                  name: poi.name,
                  address: poi.address || '暂无地址',
                  province: poi.pname,
                  city: poi.cityname,
                  district: poi.adname,
                  distance: parseInt(poi.distance) || 9999,
                  latitude: parseFloat(poi.location.split(',')[1]),
                  longitude: parseFloat(poi.location.split(',')[0]),
                  tel: telStr,
                  photos: photoStr  // 现在是一个字符串
                };
              })
              .filter(item => item.distance <= this.maxDistance) // 二次过滤，确保不超过3公里
              .sort((a, b) => a.distance - b.distance); // 按距离排序
            
            console.log('搜索到麻将馆数量:', this.poiList.length);
          } else {
            this.poiList = [];
          }
        },
        fail: (err) => {
          this.loading = false;
          console.error('搜索失败', err);
          uni.showToast({ title: '搜索失败', icon: 'none' });
        }
      });
    },

    // 选择POI并返回
    selectPoi(poi) {
		console.log('poipoipoipoipoi'+JSON.stringify(poi))
      uni.$emit('mahjongSelected', {
        name: poi.name,
        latitude: poi.latitude,
        longitude: poi.longitude,
        address: poi.address,
        distance: poi.distance,
        province: poi.province || '',      // 省份
        city: poi.city || '',        // 城市
        district: poi.district || ''       ,// 区县
		tel: poi.tel || '',
		photos: poi.photos || ''
      });
      uni.navigateBack();
    },

    // 清空搜索
    clearSearch() {
      this.keyword = '';
      this.searchMahjong();
    },

    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
.choose-mahjong {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f8f8;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  height: 44px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
}
.nav-left {
  width: 60px;
  padding-left: 16px;
  cursor: pointer;
}
.back-icon {
  font-size: 24px;
  color: #333;
}
.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.nav-right {
  width: 60px;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  margin: 12px 16px;
  padding: 0 12px;
  border-radius: 30px;
  border: 1px solid #e0e0e0;
  position: relative;
}
.search-icon {
  font-size: 18px;
  color: #999;
  margin-right: 8px;
}
.search-input {
  flex: 1;
  height: 44px;
  font-size: 16px;
  background: transparent;
  border: none;
  outline: none;
}
.clear-btn {
  font-size: 18px;
  color: #999;
  padding: 0 8px;
  cursor: pointer;
}
.clear-btn:hover {
  color: #DD031D;
}

/* 位置提示 */
.location-tip {
  display: flex;
  align-items: center;
  margin: 0 16px 12px;
  padding: 8px 12px;
  background-color: #fff9e6;
  border-left: 4px solid #DD031D;
  border-radius: 8px;
}
.location-icon {
  font-size: 16px;
  margin-right: 8px;
  color: #DD031D;
}
.location-text {
  font-size: 14px;
  color: #666;
}

/* 列表区域 */
.list-scroll {
  flex: 1;
  padding: 0 16px;
}
.loading-text,
.empty-text {
  padding: 30px;
  text-align: center;
  color: #999;
  font-size: 16px;
}
.poi-item {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  cursor: pointer;
  transition: all 0.2s ease;
}
.poi-item:hover {
  box-shadow: 0 4px 12px rgba(221,3,29,0.15);
  transform: translateY(-2px);
}
.poi-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}
.poi-name.nearest {
  color: #DD031D;  /* 最近的麻将馆标红 */
  font-weight: 700;
}
.poi-address {
  font-size: 14px;
  color: #999;
  margin-bottom: 4px;
  word-break: break-all;
}
.poi-distance {
  font-size: 12px;
  color: #666;
}
.poi-distance.nearest-distance {
  color: #DD031D;
  font-weight: 500;
}
</style>