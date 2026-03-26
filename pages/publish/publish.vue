<template>
  <view class="publish">
    <!-- 标题 -->
    <view class="title">发布任务</view>
    
    <!-- 任务标题 -->
    <view class="form-item">
      <text class="label">任务标题</text>
      <input 
        type="text" 
        class="input" 
        placeholder="例如：XXX打红中飞" 
        v-model="form.title"
        placeholder-class="placeholder"
      />
    </view>
    
    <!-- 类型选择（从接口获取） -->
    <view class="form-item">
      <text class="label">类型</text>
      <picker 
        mode="selector" 
        :range="types" 
        @change="onTypeChange"
        :disabled="loadingTypes"
      >
        <view class="picker-value">
          <text v-if="loadingTypes">加载中...</text>
          <text v-else>{{ form.taskType || '请选择类型' }}</text>
          <text class="arrow">▼</text>
        </view>
      </picker>
    </view>
    
    <!-- 开始时间（限制今天及以后，且不超过后天） -->
    <view class="form-item">
      <text class="label">开始时间</text>
      <view class="datetime-wrapper">
        <uni-datetime-picker 
          v-model="form.startTime" 
          type="datetime"
          :hideSecond="true"
          :border="false"
          placeholder="请选择开始时间"
          @change="onStartTimeChange"
          :start="today"
          :end="maxDate"
        />
      </view>
    </view>
    
    <!-- 结束时间（限制今天及以后，且不能早于开始时间，且不超过后天） -->
    <view class="form-item">
      <text class="label">结束时间</text>
      <view class="datetime-wrapper">
        <uni-datetime-picker 
          v-model="form.endTime" 
          type="datetime"
          :hideSecond="true"
          :border="false"
          placeholder="请选择结束时间"
          @change="onEndTimeChange"
          :start="startTimeMin"
          :end="maxDate"
        />
      </view>
    </view>
    
    <!-- 报酬金额 -->
    <view class="form-item">
      <text class="label">钻石</text>
      <input 
        type="digit" 
        class="input" 
        placeholder="请输入金额" 
        v-model.number="form.rewardAmount"
        placeholder-class="placeholder"
      />
    </view>
    
    <!-- 合并后的地址/麻将馆选择 -->
    <view class="form-item">
      <text class="label">选择麻将馆</text>
      <view class="address-area" @click="chooseMahjong">
        <view class="address-display">
          <text v-if="form.shopName" class="shop-name">{{ form.shopName }}</text>
          <text v-else class="placeholder-text">点击选择附近麻将馆</text>
          <text v-if="form.shopName && form.distance" class="distance-tag">{{ form.distance }}米</text>
        </view>
        <view class="address-detail" v-if="form.address">
          <text class="detail-text">{{ form.address }}</text>
        </view>
        <text class="map-link">{{ form.shopName ? '重新选择' : '去选择' }}</text>
      </view>
    </view>
    
    <!-- 备注 -->
    <view class="form-item">
      <text class="label">备注</text>
      <textarea 
        class="remark-textarea" 
        placeholder="" 
        v-model="form.remark"
        placeholder-class="placeholder"
        :maxlength="200"
        auto-height
      />
    </view>
    
    <!-- 确认按钮 -->
    <button class="confirm-btn" @click="publishTask">确认</button>
  </view>
</template>

<script>
import api from '@/utils/api.js'
import { uniDatetimePicker } from '@dcloudio/uni-ui'

export default {
  components: { uniDatetimePicker },
  data() {
    const now = new Date();
	  const year = now.getFullYear();
	  const month = (now.getMonth() + 1).toString().padStart(2, '0');
	  const day = now.getDate().toString().padStart(2, '0');
	  const today = `${year}-${month}-${day}`;

	  // 计算后天日期
	  const nextTwoDays = new Date(now);
	  nextTwoDays.setDate(now.getDate() + 2);
	  const maxYear = nextTwoDays.getFullYear();
	  const maxMonth = (nextTwoDays.getMonth() + 1).toString().padStart(2, '0');
	  const maxDay = nextTwoDays.getDate().toString().padStart(2, '0');
	  const maxDate = `${maxYear}-${maxMonth}-${maxDay}`;
	  
    return {
      types: [],                // 从接口获取的类型列表
      typesMap: {},             // 类型映射（value -> label）
      loadingTypes: true,       // 类型加载状态
      today: today,             // 今天的日期，用于开始时间限制
	  maxDate: maxDate,
      form: {
        title: '',
        type: '',               // 存储类型的值（例如 1,2,3 或具体字符串）
        startTime: '',
        endTime: '',
        rewardAmount: null,
        address: '',            // 详细地址
        shopName: '',           // 麻将馆名称
        latitude: 0,            // 经度
        longitude: 0,           // 纬度
        distance: 0,            // 距离（米）
		province: '',   // 新增
	    city: '',       // 新增
	    district: '',   // 新增
        remark: '',
		tel: '',
		photos: '',
		taskType:''
      }
    }
  },
  computed: {
    // 结束时间的最小可选日期：如果已选开始时间，则为开始时间当天；否则为今天
    startTimeMin() {
      if (this.form.startTime) {
        // 取开始日期的年月日部分
        return this.form.startTime.split(' ')[0];
      }
      return this.today;
    }
  },
  onLoad() {
    // 加载类型数据
    this.loadTypes();
    // 页面加载时获取当前定位
    this.init();
    // 监听麻将馆选择事件
    uni.$on('mahjongSelected', (data) => {
      this.form.shopName = data.name;
      this.form.address = data.address || '';
      this.form.latitude = data.latitude;
      this.form.longitude = data.longitude;
      this.form.distance = data.distance;
	  this.form.province = data.province || '';  
	  this.form.city = data.city || '';           
      this.form.district = data.district || '';   
	  this.form.tel = data.tel || '';      // 新增
	  this.form.photos = data.photos || '';   
    });
  },
  onUnload() {
    uni.$off('mahjongSelected');
  },
  methods: {
    // 加载类型数据
    async loadTypes() {
      this.loadingTypes = true;
      try {
        // 调用接口获取类型数据
        const result = await api.getDictData('task_type');
        console.log('类型数据', result);
        
        if (result && result.data && Array.isArray(result.data)) {
          // 假设返回的数据格式为 [{ dictValue: '1', dictLabel: '其他' }, ...]
          // 根据实际接口返回结构调整
          this.types = result.data.map(item => item.dictLabel || item.label || item.name);
          
          // 构建映射，方便后续根据选中的值获取对应的字典值
          result.data.forEach(item => {
            const value = item.dictValue || item.value;
            const label = item.dictLabel || item.label || item.name;
            if (value && label) {
              this.typesMap[label] = value;
            }
          });
          
          // 如果没有默认选中，可以设置一个默认值
          if (this.types.length > 0 && !this.form.taskType) {
            // 默认选中第一个
            this.form.taskType = this.types[0];
          }
        } else {
          // 如果接口返回格式不是期望的数组，尝试直接使用 result.data
          console.warn('接口返回格式异常，使用空数组');
          this.types = [];
        }
      } catch (error) {
        console.error('加载类型数据失败', error);
        uni.showToast({ title: '加载类型失败', icon: 'none' });
        this.types = []; // 失败时设置为空数组
      } finally {
        this.loadingTypes = false;
      }
    },

    onTypeChange(e) {
      const selectedLabel = this.types[e.detail.value];
      this.form.taskType = selectedLabel;
      console.log('选中类型:', selectedLabel, '对应值:', this.typesMap[selectedLabel]);
      // 如果需要存储字典值而不是显示值，可以这样：
      // this.form.typeValue = this.typesMap[selectedLabel];
    },
    
    // 获取当前位置（仅用于默认显示，不覆盖已选地址）
    async init() {
      try {
        const res = await this.$api.getlocation();
        console.log('定位结果', res);
        // 如果尚未选择麻将馆，可以暂存经纬度用于搜索
        if (!this.form.shopName && res && res.latitude && res.longitude) {
          this.currentLat = res.latitude;
          this.currentLng = res.longitude;
		  
		  // 如果定位返回了省市区，可以填充默认值
		if (res.regeocodeData && res.regeocodeData.addressComponent) {
		  const ac = res.regeocodeData.addressComponent;
		  this.form.province = ac.province || '';
		  this.form.city = ac.city || '';
		  this.form.district = ac.district || '';
		}
        }
      } catch (err) {
        console.log('定位错误', err);
      }
    },
    
    // 开始时间变化事件
    onStartTimeChange(e) {
      // 如果已有结束时间且结束时间小于新的开始时间，则清空结束时间
      if (this.form.endTime && this.compareTime(this.form.endTime, e) < 0) {
        uni.showToast({ title: '结束时间不能小于开始时间', icon: 'none' })
        this.form.endTime = ''
      }
    },
    
    // 结束时间变化事件
    onEndTimeChange(e) {
      // 如果结束时间小于开始时间，清空并提示
      if (this.form.startTime && this.compareTime(e, this.form.startTime) < 0) {
        uni.showToast({ title: '结束时间不能小于开始时间', icon: 'none' })
        this.form.endTime = ''
      }
    },
    
    // 比较两个时间字符串（格式 YYYY-MM-DD HH:mm）
    compareTime(a, b) {
      return new Date(a.replace(' ', 'T')).getTime() - new Date(b.replace(' ', 'T')).getTime()
    },
    
    // 跳转到麻将馆选择页面
    chooseMahjong() {
      uni.navigateTo({
        url: '/pages/chooseMahjong/chooseMahjong'
      });
    },
    
    // 重置表单数据
    resetForm() {
      this.form = {
        title: '',
        type: this.types.length > 0 ? this.types[0] : '其他',
        startTime: '',
        endTime: '',
        rewardAmount: null,
        address: '',
        shopName: '',
        latitude: 0,
        longitude: 0,
        distance: 0,
        province: '',
        city: '',
        district: '',
        remark: ''
      };
    },
    
    // 发布任务
    async publishTask() {
      // 表单验证
      if (!this.form.title) {
        uni.showToast({ title: '请输入任务标题', icon: 'none' })
        return
      }
      if (!this.form.taskType) {
        uni.showToast({ title: '请选择类型', icon: 'none' })
        return
      }
      if (!this.form.startTime) {
        uni.showToast({ title: '请选择开始时间', icon: 'none' })
        return
      }
      if (!this.form.endTime) {
        uni.showToast({ title: '请选择结束时间', icon: 'none' })
        return
      }
      if (this.compareTime(this.form.endTime, this.form.startTime) < 0) {
        uni.showToast({ title: '结束时间不能小于开始时间', icon: 'none' })
        return
      }
      if (this.form.rewardAmount <= 0) {
        uni.showToast({ title: '请输入正确的钻石金额', icon: 'none' })
        return
      }
      if (!this.form.shopName) {
        uni.showToast({ title: '请选择麻将馆', icon: 'none' })
        return
      }

      // 构建提交数据
      const taskData = {
        "address": this.form.address,
        "startTime": this.form.startTime,
        "endTime": this.form.endTime,
        "description": this.form.remark,
        "rewardAmount": this.form.rewardAmount,
        "title": this.form.title,
        "shopName": this.form.shopName || "",
        "latitude": this.form.latitude || 0,
        "longitude": this.form.longitude || 0,
		"province": this.form.province,   
	    "city": this.form.city,           
	    "district": this.form.district,
		"tel": this.form.tel || "",
	    "photos": this.form.photos || "",
		"taskType":this.form.taskType
      };

      // 如果需要提交类型的字典值而不是显示值，可以添加：
      // taskData.type = this.typesMap[this.form.type] || this.form.type;

      uni.showLoading({ title: '发布中...' })
      console.log('发布数据：'+JSON.stringify(taskData))
      
      try {
        const result = await api.taskCreate(taskData)
        uni.hideLoading()
        
        // 发布成功
        uni.showToast({ title: '发布成功', icon: 'success' })
        
        // 清空表单数据，以便下次发布新任务
        this.resetForm()
        
        // 跳转到首页
        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' })
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: error.message || '发布失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
/* 样式保持不变 */
.publish {
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

/* 统一输入框样式 */
.input,
.picker-value,
.address-area,
.remark-textarea,
.datetime-wrapper {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 16px;
  color: #333;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-height: 48px;
  display: flex;
  align-items: center;
}

.input:hover,
.picker-value:hover,
.address-area:hover,
.remark-textarea:hover,
.datetime-wrapper:hover {
  border-color: #DD031D;
  box-shadow: 0 0 0 2px rgba(221, 3, 29, 0.1);
}

.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.arrow {
  color: #999;
  font-size: 14px;
}

.address-area {
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
}
.address-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 6px;
}
.shop-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.distance-tag {
  font-size: 14px;
  color: #4caf50;
  background-color: #e8f5e9;
  padding: 2px 8px;
  border-radius: 30px;
}
.placeholder-text {
  font-size: 16px;
  color: #999;
}
.address-detail {
  width: 100%;
  margin-bottom: 8px;
}
.detail-text {
  font-size: 14px;
  color: #666;
}
.map-link {
  font-size: 14px;
  color: #DD031D;
  text-decoration: underline;
  align-self: flex-end;
}

.remark-textarea {
  min-height: 80px;
  padding: 12px 16px;
  resize: vertical;
}

.placeholder {
  color: #999;
  font-size: 16px;
}

.datetime-wrapper {
  padding-left: 8px;
}

.confirm-btn {
  background-color: #DD031D;
  color: white;
  border: none;
  border-radius: 40px;
  padding: 12px 24px;
  font-size: 18px;
  font-weight: 500;
  margin: 40px auto 0;
  width: 60%;
  display: block;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(221, 3, 29, 0.3);
  line-height: 1.2;
}
.confirm-btn:hover {
  background-color: #B00217;
  box-shadow: 0 6px 16px rgba(221, 3, 29, 0.4);
  transform: scale(1.02);
}
</style>