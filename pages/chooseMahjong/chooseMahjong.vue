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

    <!-- 地图区域 -->
    <view class="map-container">
      <map
        id="mahjongMap"
        class="map"
        :latitude="location.lat"
        :longitude="location.lng"
        :markers="markers"
        :circles="circles"
        :scale="14"
        show-location
        @markertap="onMarkerTap"
        @tap="onMapTap"
      ></map>
      <!-- 定位按钮 -->
      <view class="location-btn" @click="getCurrentLocation">
        <text class="location-btn-icon">📍</text>
      </view>
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
        :class="{ 'selected': selectedIndex === index }"
        v-for="(item, index) in poiList" 
        :key="index"
        @click="selectPoi(item, index)"
      >
        <view class="poi-header">
          <view class="poi-name" :class="{ 'nearest': index === 0 }">{{ item.name }}</view>
          <view class="poi-distance" :class="{ 'nearest-distance': index === 0 }">{{ item.distance }}米</view>
        </view>
        <view class="poi-address">{{ item.address }}</view>
        <view class="poi-tag" v-if="index === 0">最近</view>
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
      maxDistance: 3000,   // 3公里 = 3000米
      markers: [],         // 地图标记
      circles: [],         // 地图圆圈（3公里范围）
      selectedIndex: -1    // 当前选中的索引，默认为-1表示未选中
    };
  },
  onLoad() {
    // 初始化高德插件
    this.amapPlugin = new amap.AMapWX({
      key: 'a24917453af0a37f58ca8943fb565bce'
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
          // 设置3公里范围圆圈
          this.setCircles();
          this.searchMahjong();
        },
        fail: (err) => {
          uni.hideLoading();
          console.log('定位失败', err);
          uni.showToast({ title: '定位失败，使用默认位置', icon: 'none' });
          // 使用默认坐标（长沙市中心）
          this.location = { lat: 28.2282, lng: 112.9389 };
          this.setCircles();
          this.searchMahjong();
        }
      });
    },

    // 设置地图圆圈（3公里范围）
    setCircles() {
      this.circles = [{
        latitude: this.location.lat,
        longitude: this.location.lng,
        radius: this.maxDistance,
        strokeWidth: 2,
        strokeColor: '#DD031D33',
        fillColor: '#DD031D10'
      }];
    },

    // 搜索周边麻将馆（限定3公里内）
    searchMahjong() {
      if (!this.amapPlugin) return;
      this.loading = true;
      
      const keywords = this.keyword ? this.keyword : '麻将馆';
      
      this.amapPlugin.getPoiAround({
        querykeywords: keywords,
        location: `${this.location.lng},${this.location.lat}`,
        radius: this.maxDistance,
        success: (data) => {
          this.loading = false;
          if (data && data.poisData && data.poisData.length > 0) {
            // 处理返回的POI数据
            this.poiList = data.poisData
              .map(poi => {
                let telStr = poi.tel || '';
                if (Array.isArray(telStr)) {
                  telStr = telStr.join(',');
                } else {
                  telStr = String(telStr).replace(/[;；\s]+/g, ',');
                }	
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
                  photos: photoStr
                };
              })
              .filter(item => item.distance <= this.maxDistance)
              .sort((a, b) => a.distance - b.distance);
            
            // 更新地图标记
            this.updateMarkers();
            // 重置选中状态，不默认选中任何项
            this.selectedIndex = -1;
            console.log('搜索到麻将馆数量:', this.poiList.length);
          } else {
            this.poiList = [];
            this.markers = [];
            this.selectedIndex = -1;
          }
        },
        fail: (err) => {
          this.loading = false;
          console.error('搜索失败', err);
          uni.showToast({ title: '搜索失败', icon: 'none' });
        }
      });
    },

    // 更新地图标记
    updateMarkers() {
      const markers = this.poiList.map((poi, index) => {
        // 3公里内的麻将馆标记为红色
        const isInRange = poi.distance <= this.maxDistance;
        return {
          id: index,
          latitude: poi.latitude,
          longitude: poi.longitude,
          title: poi.name,
          iconPath: isInRange ? '/static/marker-red.png' : '/static/marker-gray.png',
          width: 32,
          height: 32,
          callout: {
            content: poi.name,
            color: '#333',
            fontSize: 12,
            borderRadius: 4,
            bgColor: '#fff',
            padding: 8,
            display: 'BYCLICK'
          }
        };
      });
      
      // 添加当前位置标记
      markers.unshift({
        id: -1,
        latitude: this.location.lat,
        longitude: this.location.lng,
        title: '当前位置',
        iconPath: '/static/location.png',
        width: 32,
        height: 32,
        anchor: { x: 0.5, y: 1 }
      });
      
      this.markers = markers;
    },

    // 点击地图标记
    onMarkerTap(e) {
      const markerId = e.detail.markerId;
      if (markerId >= 0 && markerId < this.poiList.length) {
        this.selectedIndex = markerId;
      }
    },

    // 点击地图空白处
    onMapTap() {
      this.selectedIndex = -1;
    },

    // 选择POI并返回
    selectPoi(poi, index) {
      this.selectedIndex = index;
      console.log('选择麻将馆:', JSON.stringify(poi));
      uni.$emit('mahjongSelected', {
        name: poi.name,
        latitude: poi.latitude,
        longitude: poi.longitude,
        address: poi.address,
        distance: poi.distance,
        province: poi.province || '',
        city: poi.city || '',
        district: poi.district || '',
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
  /* 防止横向滚动 */
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  height: 44px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
}
.nav-left {
  width: 60px;
  padding-left: 16px;
  cursor: pointer;
  flex-shrink: 0;
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
  flex-shrink: 0;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  margin: 8px 16px;
  padding: 0 12px;
  border-radius: 30px;
  border: 1px solid #e0e0e0;
  position: relative;
  flex-shrink: 0;
  width: calc(100% - 32px);
  box-sizing: border-box;
}
.search-icon {
  font-size: 18px;
  color: #999;
  margin-right: 8px;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  height: 40px;
  font-size: 16px;
  background: transparent;
  border: none;
  outline: none;
  min-width: 0; /* 防止输入框溢出 */
}
.clear-btn {
  font-size: 18px;
  color: #999;
  padding: 0 8px;
  cursor: pointer;
  flex-shrink: 0;
}
.clear-btn:hover {
  color: #DD031D;
}

/* 位置提示 */
.location-tip {
  display: flex;
  align-items: center;
  margin: 0 16px 8px;
  padding: 6px 12px;
  background-color: #fff9e6;
  border-left: 4px solid #DD031D;
  border-radius: 8px;
  flex-shrink: 0;
  width: calc(100% - 32px);
  box-sizing: border-box;
}
.location-icon {
  font-size: 16px;
  margin-right: 8px;
  color: #DD031D;
  flex-shrink: 0;
}
.location-text {
  font-size: 14px;
  color: #666;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 地图容器 */
.map-container {
  position: relative;
  margin: 0 16px 8px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  height: 250px;
  width: calc(100% - 32px);
  box-sizing: border-box;
}
.map {
  width: 100%;
  height: 100%;
}
.location-btn {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 40px;
  height: 40px;
  background-color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  cursor: pointer;
}
.location-btn-icon {
  font-size: 20px;
}

/* 列表区域 */
.list-scroll {
  flex: 1;
  padding: 0 16px;
  overflow-y: auto;
  overflow-x: hidden; /* 防止横向滚动 */
  width: 100%;
  box-sizing: border-box;
}
.loading-text,
.empty-text {
  padding: 30px;
  text-align: center;
  color: #999;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
}
.poi-item {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  /* 防止内容溢出 */
  overflow: hidden;
}
.poi-item.selected {
  border: 2px solid #DD031D;
  box-shadow: 0 4px 12px rgba(221,3,29,0.2);
}
.poi-item:active {
  transform: scale(0.98);
}
.poi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  width: 100%;
  box-sizing: border-box;
}
.poi-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0; /* 关键：允许flex子项收缩 */
  padding-right: 8px; /* 与距离保持间距 */
}
.poi-name.nearest {
  color: #DD031D;
  font-weight: 700;
}
.poi-address {
  font-size: 13px;
  color: #999;
  word-break: break-all;
  line-height: 1.4;
  width: 100%;
  box-sizing: border-box;
  /* 限制地址显示行数 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.poi-distance {
  font-size: 12px;
  color: #666;
  flex-shrink: 0; /* 距离不收缩 */
  white-space: nowrap;
}
.poi-distance.nearest-distance {
  color: #DD031D;
  font-weight: 500;
}
.poi-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #DD031D;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>