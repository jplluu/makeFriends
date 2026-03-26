<template>
  <view class="index">
    <!-- 定位头部 - 点击可打开地图选择位置 -->
    <view class="location-header" @click="goToChooseCity">
      <text class="icon-location">📍</text>
      <text class="location-text">{{ locationName }}</text>
      <text class="icon-arrow">▼</text>
    </view>
    
    <!-- 任务列表 -->
    <view class="task-list">
      <view v-if="loading" class="loading-text">加载中...</view>
      <view v-else-if="tasks.length === 0" class="empty-text">暂无任务</view>
      <view class="task-item" v-for="(task, idx) in tasks" :key="idx">
        <!-- 第一行：标题 + 距离（使用 distanceDisplay） -->
        <view class="task-row title-row">
          <text class="task-title">{{ task.title }}</text>
          <text class="task-distance">{{ task.distanceDisplay || '未知距离' }}</text>
        </view>
        
        <!-- 第二行：地点 -->
        <view class="task-row address-row">
          <text class="icon-small">📍</text>
          <text class="task-addr">{{ task.address || '未知地址' }}</text>
        </view>
        
        <!-- 第三行：开始时间 -->
        <view class="task-row time-row">
          <text class="icon-small"></text>
          <text class="task-time">开始：{{ task.startTime }}</text>
        </view>
        
        <!-- 第四行：结束时间 -->
        <view class="task-row time-row">
          <text class="icon-small"></text>
          <text class="task-time">结束：{{ task.endTime }}</text>
        </view>
		
		<!-- 任务列表中的招募区域 -->
		<view class="task-row action-row">
		  <view :class="['recruit', task.needParticipants === 0 ? 'recruit-full' : 'recruit-normal']">
		    <template v-if="task.needParticipants > 0">
		      <text>招募</text>
		      <text class="num">{{ task.needParticipants }}</text>
		      <text>人</text>
		    </template>
		    <template v-else>
		      <text>已满员</text>
		    </template>
		  </view>
		  <button class="join-btn" @click="goToDetail(task)">查看详情</button>
		</view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      locationName: '正在获取定位...',
      latitude: null,
      longitude: null,
      tasks: [],
      loading: true,
      pageNum: 1,
      pageSize: 10,
      hasMore: true,
      loadingMore: false
    }
  },
  onLoad() {
    uni.$on('citySelected', (city) => {
      this.locationName = city;
    });
    this.initLocation();
    this.loadTasks(true);
  },
  onUnload() {
    uni.$off('citySelected');
  },
  onShow() {
    // 每次显示页面时，重置分页并重新加载任务列表
    this.pageNum = 1;
    this.tasks = [];
    this.loadTasks(true);
  },
  onReachBottom() {
    if (this.hasMore && !this.loadingMore) {
      this.loadMoreTasks();
    }
  },
  methods: {
    // 定位方法 - 只更新位置显示，不影响列表
    async initLocation() {
      try {
        const res = await this.$api.getlocation();
        console.log('定位结果', res);
        
        if (res && res.latitude && res.longitude) {
          this.latitude = res.latitude;
          this.longitude = res.longitude;
        }
        
        let displayName = '未知位置';
        
        if (res && res.regeocodeData) {
          const data = res.regeocodeData;
          // 优先取城市名，若城市为空则取省份（适用于直辖市），再为空则取区县
          const city = data.addressComponent?.city || '';
          const province = data.addressComponent?.province || '';
          const district = data.addressComponent?.district || '';
          
          if (city) {
            displayName = city;
          } else if (province) {
            displayName = province;
          } else if (district) {
            displayName = district;
          }
        } else if (res && res.address) {
          // 备选方案：从完整地址中提取城市名（按常见分隔符分割）
          const parts = res.address.split(/[,，、\s]+/);
          displayName = parts[1] || parts[0] || '未知位置';
        } else if (res && res.name) {
          displayName = res.name;
        } else if (res && res.formatted_address) {
          displayName = res.formatted_address;
        }
        
        this.locationName = displayName;
        // 定位成功后，重新加载任务列表（带经纬度）
        this.loadTasks(true);
        
      } catch (err) {
        console.log('定位错误', err);
        this.locationName = '定位失败，点击重试';
      }
    },

    formatDate(dateString) {
      if (!dateString) return '未知时间';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      } catch (e) {
        return dateString;
      }
    },

    async loadTasks(isReset = false) {
      if (isReset) {
        this.loading = true;
      }
      
      try {
        const params = {
          pageNum: this.pageNum,
          pageSize: this.pageSize
        };
        
        // 如果有经纬度就传，没有就不传，不影响接口调用
        if (this.latitude && this.longitude) {
          params.latitude = this.latitude;
          params.longitude = this.longitude;
        }
        
        console.log('请求任务列表参数', params);
        const result = await api.getTaskList(params);
        console.log('任务列表返回', result);
        
        // 处理不同的返回格式
        let list = [];
        if (result && result.data) {
          list = result.data.records || result.data.list || result.data;
        } else if (result && Array.isArray(result)) {
          list = result;
        }
        
        if (list && Array.isArray(list) && list.length > 0) {
          const formattedTasks = this.formatTasks(list);
          if (isReset) {
            this.tasks = formattedTasks;
          } else {
            this.tasks = [...this.tasks, ...formattedTasks];
          }
          
          if (result.data && result.data.total) {
            this.hasMore = this.tasks.length < result.data.total;
          } else {
            this.hasMore = list.length >= this.pageSize;
          }
        } else {
          if (isReset) {
            this.tasks = [];
          }
          this.hasMore = false;
        }
      } catch (error) {
        console.error('加载任务列表失败', error);
        uni.showToast({ title: '加载任务失败', icon: 'none' });
        if (isReset) {
          this.tasks = [];
        }
      } finally {
        if (isReset) {
          this.loading = false;
        }
      }
    },

    async loadMoreTasks() {
      if (this.loadingMore || !this.hasMore) return;
      this.loadingMore = true;
      this.pageNum++;
      
      try {
        const params = {
          pageNum: this.pageNum,
          pageSize: this.pageSize
        };
        if (this.latitude && this.longitude) {
          params.latitude = this.latitude;
          params.longitude = this.longitude;
        }
        
        const result = await api.getTaskList(params);
        
        let list = [];
        if (result && result.data) {
          list = result.data.records || result.data.list || result.data;
        } else if (result && Array.isArray(result)) {
          list = result;
        }
        
        if (list && Array.isArray(list) && list.length > 0) {
          const newTasks = this.formatTasks(list);
          this.tasks = [...this.tasks, ...newTasks];
          
          if (result.data && result.data.total) {
            this.hasMore = this.tasks.length < result.data.total;
          } else {
            this.hasMore = list.length >= this.pageSize;
          }
        } else {
          this.hasMore = false;
          this.pageNum--;
        }
      } catch (error) {
        console.error('加载更多任务失败', error);
        uni.showToast({ title: '加载更多失败', icon: 'none' });
        this.pageNum--;
      } finally {
        this.loadingMore = false;
      }
    },

    // 格式化任务数据，适配前端显示
    formatTasks(tasks) {
      if (!tasks || !Array.isArray(tasks)) return [];
      return tasks.map(task => {
        // 格式化距离
        let distanceDisplay = '';
        if (task.distanceDisplay) {
          distanceDisplay = task.distanceDisplay;
        } else if (task.distance !== undefined) {
          const distance = parseFloat(task.distance);
          if (!isNaN(distance)) {
            distanceDisplay = distance >= 1000 
              ? (distance / 1000).toFixed(1) + 'km' 
              : distance + 'm';
          }
        }
    
        return {
          ...task,
          title: task.title || '未知任务',
          distanceDisplay: distanceDisplay || '',
          address: task.address || task.addr || '',
          startTime: this.formatDate(task.startTime),
          endTime: this.formatDate(task.endTime),
          needParticipants: task.needParticipants 
        };
      });
    },

    goToChooseCity() {
      uni.navigateTo({
        url: '/pages/chooseCity/chooseCity'
      });
    },
	// 跳转到详情页
	goToDetail(task) {
	  uni.navigateTo({
		url: `/pages/publishDetails/publishDetails?id=${task.id}&from=home`
	  });
	},
    requestPayment() {
      uni.requestPayment({
        provider: 'wxpay',
        orderInfo: '订单信息',
        timeStamp: '',
        nonceStr: '',
        package: '',
        signType: 'MD5',
        paySign: '',
        success: () => {
          uni.showToast({ title: '支付成功', icon: 'success' });
        },
        fail: () => {
          uni.showToast({ title: '支付失败', icon: 'none' });
        }
      });
    }
  }
}
</script>

<style scoped>
/* 样式保持不变 */
.index {
  padding: 20px;
  background-color: #f8f8f8;
}

.location-header {
  display: inline-flex;
  align-items: center;
  margin-bottom: 20px;
  background: transparent;
  padding: 8px 12px 8px 0;
  border-radius: 30px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.location-header:active {
  background-color: rgba(0, 0, 0, 0.05);
}
.icon-location {
  font-size: 22px;
  margin-right: 6px;
  color: #DD031D;
}
.location-text {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-right: 6px;
}
.icon-arrow {
  font-size: 14px;
  color: #999;
}

.loading-text,
.empty-text {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 16px;
}

.task-item {
  background-color: #ffffff;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}
.task-item:hover {
  box-shadow: 0 8px 20px rgba(221, 3, 29, 0.15);
  transform: translateY(-2px);
}

.task-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.task-row:last-child {
  margin-bottom: 0;
}

.title-row {
  justify-content: space-between;
}
.task-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}
.task-distance {
  font-size: 14px;
  color: #DD031D;
  font-weight: 500;
}

.icon-small {
  font-size: 16px;
  margin-right: 8px;
  color: #999;
}
.task-addr, .task-time {
  font-size: 15px;
  color: #444;
}

.action-row {
  justify-content: space-between;
  margin-top: 16px;
}
/* 满员状态样式 */
.recruit-full {
  background-color: #f5f5f5;
  border-color: #ccc;
  color: #999;
}
.recruit {
  background-color: #ffffff;
  border: 1px solid #DD031D;
  color: #DD031D;
  padding: 4px 14px;
  border-radius: 40px;
  font-size: 14px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(221, 3, 29, 0.08);
  display: inline-flex;
  align-items: center;
}

.num {
  font-weight: 700;
  font-size: 16px;
  margin: 0 2px;
}

.join-btn {
  background-color: #DD031D;
  color: white;
  border: none;
  border-radius: 40px;
  padding: 6px 22px;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(221, 3, 29, 0.2);
}
.join-btn:hover {
  background-color: #B00217;
  box-shadow: 0 6px 12px rgba(221, 3, 29, 0.3);
  transform: scale(1.02);
}
</style>