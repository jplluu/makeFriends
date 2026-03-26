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
        placeholder="例如：帮忙搬运行李" 
        v-model="form.title"
        placeholder-class="placeholder"
      />
    </view>
    
    <!-- 类型选择 -->
    <view class="form-item">
      <text class="label">类型</text>
      <picker mode="selector" :range="types" @change="onTypeChange">
        <view class="picker-value">
          {{ form.type || '其他' }}
          <text class="arrow">▼</text>
        </view>
      </picker>
    </view>
    
    <!-- 开始时间 -->
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
        />
      </view>
    </view>
    
    <!-- 结束时间 -->
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
    
    <!-- 地址选择 -->
    <view class="form-item">
      <text class="label">地址</text>
      <view class="address-area">
        <view class="address-display" @click="chooseLocation">
          {{ form.address || '点击选择地图位置' }}
        </view>
        <text class="map-link" @click="chooseLocation">重新选择</text>
      </view>
    </view>
    
    <!-- 备注 -->
    <view class="form-item">
      <text class="label">备注</text>
      <textarea 
        class="remark-textarea" 
        placeholder="需要协助搬运行李" 
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
    return {
      types: ['其他', '搬运', '协助', '跑腿'],
      form: {
        title: '',
        type: '其他',
        startTime: '',
        endTime: '',
        rewardAmount: null,
        address: '', // 地址，初始为空
        remark: ''
      }
    }
  },
  onLoad() {
    // 页面加载时获取当前定位作为默认地址
    this.init();
  },
  methods: {
    onTypeChange(e) {
      this.form.type = this.types[e.detail.value]
    },
    
    // 获取当前位置并更新地址
    async init() {
      try {
        const res = await this.$api.getlocation();
        console.log('定位结果', res);
        if (res && res.address) {
          this.form.address = res.address;
        } else if (res && res.name) {
          this.form.address = res.name;
        } else if (res && res.formatted_address) {
          this.form.address = res.formatted_address;
        } else {
          this.form.address = ''; // 若无法解析，留空
        }
      } catch (err) {
        console.log('定位错误', err);
        // 定位失败，不设置地址，让用户手动选择
        this.form.address = '';
      }
    },
    
    // 开始时间变化事件
    onStartTimeChange(e) {
      if (this.form.endTime && this.compareTime(this.form.endTime, e) < 0) {
        uni.showToast({ title: '结束时间不能小于开始时间', icon: 'none' })
        this.form.endTime = ''
      }
    },
    
    // 结束时间变化事件
    onEndTimeChange(e) {
      if (this.form.startTime && this.compareTime(e, this.form.startTime) < 0) {
        uni.showToast({ title: '结束时间不能小于开始时间', icon: 'none' })
        this.form.endTime = ''
      }
    },
    
    // 比较两个时间字符串（格式 YYYY-MM-DD HH:mm）
    compareTime(a, b) {
      return new Date(a.replace(' ', 'T')).getTime() - new Date(b.replace(' ', 'T')).getTime()
    },
    
    // 打开地图选择位置（手动选择）
    chooseLocation() {
      uni.chooseLocation({
          success: (res) => {
              this.form.address = res.name || res.address;
              this.locationName = this.form.address;
          },
          fail: (err) => {
              // 检查是否是权限相关的错误
              if (err.errMsg && (err.errMsg.includes('deny') || err.errMsg.includes('not authorized'))) {
                  uni.showModal({
                      title: '提示',
                      content: '需要您授权地理位置权限，是否前往设置？',
                      success: (res) => {
                          if (res.confirm) {
                              uni.openSetting(); // 打开权限设置页
                          }
                      }
                  });
              } else if (err.errMsg.indexOf('cancel') === -1) {
                  // 非用户取消操作的其他错误
                  uni.showToast({ title: '选择位置失败', icon: 'none' });
              }
          }
      });
    },
    
    // 发布任务
    async publishTask() {
      // 表单验证
      if (!this.form.title) {
        uni.showToast({ title: '请输入任务标题', icon: 'none' })
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
      // if (!this.form.address) {
      //   uni.showToast({ title: '请选择地址', icon: 'none' })
      //   return
      // }

      const taskData = {
        "address": this.form.address,
        "startTime": this.form.startTime,
        "endTime": this.form.endTime,
        "description": this.form.remark,
        "rewardAmount": this.form.rewardAmount,
        "title": this.form.title,
		"shopName": "",
		"latitude": 0,
		"longitude": 0,
		
      }

      uni.showLoading({ title: '发布中...' })
	  console.log('发布数据：'+JSON.stringify(taskData))
	  
      try {
        const result = await api.taskCreate(taskData)
        uni.hideLoading()
        uni.showToast({ title: '发布成功', icon: 'success' })
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
}
.address-display {
  font-size: 16px;
  color: #333;
  margin-bottom: 6px;
  word-break: break-word;
  cursor: pointer;
  width: 100%;
}
.map-link {
  font-size: 14px;
  color: #DD031D;
  text-decoration: underline;
  cursor: pointer;
  display: inline-block;
}
.map-link:hover {
  color: #B00217;
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