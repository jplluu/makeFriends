<template>
  <view class="recharge-container">
    <!-- 余额卡片 -->
    <view class="balance-card">
      <text class="balance-label">当前钻石余额</text>
      <text class="balance-amount">{{ diamondBalance }}</text>
    </view>

    <!-- 金额选择区域 -->
    <view class="amount-section">
      <text class="section-title">选择充值金额</text>
      <view class="amount-grid">
        <view
          v-for="item in amountOptions"
          :key="item.value"
          class="amount-item"
          :class="{ active: selectedAmount === item.value }"
          @click="selectAmount(item.value)"
        >
          <text class="amount-value">{{ item.label }}</text>
        </view>
        <view class="amount-item custom-item" :class="{ active: isCustomAmount }" @click="openCustomInput">
          <text class="amount-value">自定义</text>
        </view>
      </view>
      <!-- 自定义金额输入框 -->
      <view v-if="isCustomAmount" class="custom-input-wrapper">
        <input
          type="digit"
          v-model="customAmount"
          placeholder="请输入金额（元）"
          placeholder-class="input-placeholder"
          class="custom-input"
          @blur="onCustomBlur"
        />
        <text class="custom-unit">元</text>
      </view>
      <text class="amount-tip">最低充值金额：{{ minAmount }}元</text>
    </view>

    <!-- 支付方式选择 -->
    <view class="pay-section">
      <text class="section-title">选择支付方式</text>
      <view class="pay-options">
        <view
          class="pay-option"
          :class="{ active: payType === 'wechat' }"
          @click="selectPayType('wechat')"
        >
          <image class="pay-icon" src="/static/icons/wechat.png" mode="aspectFit"></image>
          <text class="pay-name">微信支付</text>
          <view class="check-icon" v-if="payType === 'wechat'">✓</view>
        </view>
        <view
          class="pay-option"
          :class="{ active: payType === 'alipay' }"
          @click="selectPayType('alipay')"
        >
          <image class="pay-icon" src="/static/icons/alipay.png" mode="aspectFit"></image>
          <text class="pay-name">支付宝支付</text>
          <view class="check-icon" v-if="payType === 'alipay'">✓</view>
        </view>
      </view>
    </view>

    <!-- 充值按钮 -->
    <button class="recharge-button" :class="{ disabled: !canRecharge }" @click="handleRecharge">
      {{ rechargeButtonText }}
    </button>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      diamondBalance: 0,        // 当前钻石余额
      amountOptions: [
        { label: '10元', value: 10 },
        { label: '50元', value: 50 },
        { label: '100元', value: 100 },
        { label: '200元', value: 200 },
        { label: '500元', value: 500 }
      ],
      selectedAmount: null,      // 选中的预设金额
      customAmount: '',          // 自定义金额
      isCustomAmount: false,     // 是否显示自定义金额输入框
      payType: 'wechat',         // 支付方式: wechat / alipay
      minAmount: 1,              // 最低充值金额（元）
      loading: false             // 充值按钮加载状态
    }
  },
  computed: {
    // 最终充值金额（优先使用预设金额，否则使用自定义金额）
    finalAmount() {
      if (this.selectedAmount !== null) {
        return this.selectedAmount
      }
      if (this.isCustomAmount && this.customAmount) {
        return parseFloat(this.customAmount)
      }
      return null
    },
    // 充值按钮文案
    rechargeButtonText() {
      if (this.loading) return '处理中...'
      return '立即充值'
    },
    // 是否可以充值：金额有效且未加载中
    canRecharge() {
      if (this.loading) return false
      const amount = this.finalAmount
      return amount && !isNaN(amount) && amount >= this.minAmount
    }
  },
  onShow() {
    // 每次显示页面时，获取最新余额
    this.fetchBalance()
    // 重置金额选择状态，避免残留数据
    this.resetAmountState()
  },
  methods: {
    // 获取当前余额
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
    // 选择预设金额
    selectAmount(value) {
      this.selectedAmount = value
      this.isCustomAmount = false
      this.customAmount = ''
    },
    // 打开自定义金额输入框
    openCustomInput() {
      this.selectedAmount = null
      this.isCustomAmount = true
      // 如果已经有自定义金额，保持原值，否则清空
      if (!this.customAmount) {
        this.customAmount = ''
      }
    },
    // 自定义输入框失去焦点时，校验金额
    onCustomBlur() {
      if (this.customAmount) {
        let amount = parseFloat(this.customAmount)
        if (isNaN(amount)) {
          this.customAmount = ''
          uni.showToast({ title: '请输入有效金额', icon: 'none' })
        } else if (amount < this.minAmount) {
          this.customAmount = ''
          uni.showToast({ title: `最低充值金额为${this.minAmount}元`, icon: 'none' })
        } else {
          // 保留两位小数
          this.customAmount = amount.toFixed(2)
        }
      }
    },
    // 选择支付方式
    selectPayType(type) {
      this.payType = type
    },
    // 重置金额选择状态
    resetAmountState() {
      this.selectedAmount = null
      this.isCustomAmount = false
      this.customAmount = ''
    },
    // 处理未登录情况
    handleNotLogin() {
      uni.showModal({
        title: '提示',
        content: '您尚未登录，请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            uni.reLaunch({ url: '/pages/login/login' })
          }
        }
      })
    },
    // 核心充值方法
    async handleRecharge() {
      // 1. 校验是否可以充值
      if (!this.canRecharge) {
        if (!this.finalAmount) {
          uni.showToast({ title: '请选择或输入充值金额', icon: 'none' });
        } else if (this.finalAmount < this.minAmount) {
          uni.showToast({ title: `最低充值金额为${this.minAmount}元`, icon: 'none' });
        }
        return;
      }
    
      // 2. 防止重复点击
      if (this.loading) return;
      this.loading = true;
    
      try {
        // 3. 调用充值接口（假设 api 已导入）
        const amount = this.finalAmount;
        const payType = this.payType; // 'wechat' 或 'alipay'
        const res = await api.recharge({
          amount: amount,
          paymentType: payType
        });
    
        // 4. 处理接口返回
        if (res.code !== 200) {
          uni.showToast({ title: res.message || '充值订单创建失败', icon: 'none' });
          return;
        }
    
        const paymentData = res.data;
    
        // 5. 根据支付方式构建支付参数
        let provider = '';
        let orderInfo = {};
        if (payType === 'wechat') {
          provider = 'wxpay';
          orderInfo = {
            appId: paymentData.appId,
            timeStamp: paymentData.timeStamp,
            nonceStr: paymentData.nonceStr,
            package: paymentData.package,
            signType: paymentData.signType || 'MD5',
            paySign: paymentData.paySign
          };
        } else {
          provider = 'alipay';
          // 支付宝支付参数可能是一个字符串或对象，请根据后端返回调整
          orderInfo = paymentData.orderInfo || paymentData;
        }
    
        // 6. 调起客户端支付
        uni.requestPayment({
          provider: provider,
          orderInfo: orderInfo,
          success: (payRes) => {
            uni.showToast({ title: '充值成功', icon: 'success' });
            // 通知其他页面（如“我的”页面）刷新余额
            uni.$emit('rechargeSuccess');
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          },
          fail: (err) => {
            console.error('支付失败:', err);
            if (err.errMsg && err.errMsg.includes('cancel')) {
              uni.showToast({ title: '已取消支付', icon: 'none' });
            } else {
              uni.showToast({ title: '支付失败，请重试', icon: 'none' });
            }
          }
        });
      } catch (error) {
        console.error('充值异常:', error);
        // 处理未登录等错误（已在 request 中统一处理 401，但这里仍可做额外处理）
        if (error.message && error.message.includes('未登录')) {
          this.handleNotLogin();
        } else {
          uni.showToast({ title: error.message || '充值失败，请稍后重试', icon: 'none' });
        }
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.recharge-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20px 16px;
  box-sizing: border-box;
}

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #DD031D, #b00217);
  border-radius: 24px;
  padding: 24px 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(221, 3, 29, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.balance-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 1px;
}
.balance-amount {
  font-size: 36px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 通用区域样式 */
.amount-section,
.pay-section {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: block;
}

/* 金额网格布局 */
.amount-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.amount-item {
  background-color: #f5f5f5;
  border-radius: 40px;
  padding: 10px 0;
  text-align: center;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}
.amount-item.active {
  background-color: #DD031D;
  border-color: #DD031D;
  box-shadow: 0 4px 10px rgba(221, 3, 29, 0.2);
}
.amount-item.active .amount-value {
  color: white;
}
.amount-value {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}
.custom-item {
  background-color: #fff;
  border: 1px dashed #ddd;
}
.custom-input-wrapper {
  position: relative;
  margin-top: 12px;
  display: flex;
  align-items: center;
  background-color: #f9f9f9;
  border-radius: 40px;
  padding: 0 16px;
  border: 1px solid #eee;
}
.custom-input {
  flex: 1;
  height: 44px;
  font-size: 16px;
  color: #333;
}
.custom-unit {
  font-size: 14px;
  color: #999;
  margin-left: 8px;
}
.input-placeholder {
  color: #ccc;
}
.amount-tip {
  font-size: 12px;
  color: #999;
  margin-top: 12px;
  display: block;
}

/* 支付方式选项 */
.pay-options {
  display: flex;
  gap: 16px;
}
.pay-option {
  flex: 1;
  background-color: #f9f9f9;
  border-radius: 16px;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.pay-option.active {
  background-color: #fff5f5;
  border-color: #DD031D;
  box-shadow: 0 2px 8px rgba(221, 3, 29, 0.1);
}
.pay-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 8px;
}
.pay-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.check-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  background-color: #DD031D;
  color: white;
  border-radius: 50%;
  text-align: center;
  line-height: 20px;
  font-size: 12px;
  font-weight: bold;
}

/* 充值按钮 */
.recharge-button {
  background: linear-gradient(145deg, #DD031D, #b00217);
  color: white;
  border: none;
  border-radius: 48px;
  padding: 14px 0;
  font-size: 18px;
  font-weight: 600;
  margin-top: 30px;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(221, 3, 29, 0.3);
  transition: all 0.2s;
}
.recharge-button.disabled {
  background: #ccc;
  box-shadow: none;
  opacity: 0.6;
}
.recharge-button:active {
  transform: scale(0.98);
}
</style>