<template>
  <view class="message">
    <!-- 可滚动内容区域 -->
    <scroll-view class="content-scroll" scroll-y>
	  <view class="title">四方小桌·一起聊天</view>
      <!-- 麻将桌区域 -->
      <view class="mahjong-table">
        <view class="table-bg">
          <view class="seat seat-north seat-occupied">
            <view class="seat-avatar">{{ seats[0].avatar }}</view>
          </view>
          <view class="seat seat-east seat-occupied">
            <view class="seat-avatar">{{ seats[1].avatar }}</view>
          </view>
          <view class="seat seat-south seat-occupied">
            <view class="seat-avatar">{{ seats[2].avatar }}</view>
          </view>
          <view class="seat seat-west seat-occupied">
            <view class="seat-avatar">{{ seats[3].avatar }}</view>
          </view>
          <view class="table-center">🀄️</view>
        </view>
      </view>
      
      <!-- 当前桌游信息卡片 -->
      <view class="game-card">
        <view class="game-header">当前桌游信息</view>
        <view class="info-row">
          <text class="info-label">类型名称</text>
          <text class="info-value">川麻血战·换三张</text>
        </view>
        <view class="info-row">
          <text class="info-label">地址</text>
          <text class="info-value">xxx自助麻将馆2208室</text>
        </view>
        <view class="info-row">
          <text class="info-label">房间密码</text>
          <text class="info-value password">258369</text>
        </view>
      </view>
      
      <!-- 温馨提示卡片 -->
      <view class="tips-card">
        <text class="tips-title">温馨提示：</text>
        <text class="tips-content">请勿在桌面上放置饮料，保持安静、22:00后请轻流。祝玩得开心！</text>
      </view>
    </scroll-view>
    
    <!-- 底部固定聊天区域 -->
    <view class="chat-fixed">
      <view class="chat-header">大家一起聊</view>
      <!-- 消息列表 -->
      <scroll-view class="message-list" scroll-y :scroll-top="scrollTop" @scrolltoupper="loadMore">
        <view class="message-item" v-for="(msg, index) in messages" :key="index">
          <text class="message-avatar">{{ msg.avatar }}</text>
          <view class="message-content">
            <text class="message-name">{{ msg.name }}</text>
            <text class="message-text">{{ msg.text }}</text>
          </view>
        </view>
      </scroll-view>
      <!-- 输入框区域（固定） -->
      <view class="input-area">
        <input 
          class="chat-input" 
          type="text" 
          placeholder="说点什么..." 
          v-model="newMessage"
          placeholder-class="placeholder"
          @confirm="sendMessage"
        />
        <button class="send-btn" @click="sendMessage">发送</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      seats: [
        { avatar: '🐶' },
        { avatar: '🐱' },
        { avatar: '🐼' },
        { avatar: '🐧' }
      ],
      messages: [
        { avatar: '🐶', name: '小优', text: '大家准备好了吗？' },
        { avatar: '🐱', name: '麻将桌', text: '我准备好了！' },
        { avatar: '🐼', name: '呱呱', text: '什么时候开始？' },
        { avatar: '🐧', name: '胖达', text: '等阿狸来了就开' },
      ],
      newMessage: '',
      scrollTop: 0,
    };
  },
  methods: {
    sendMessage() {
      if (!this.newMessage.trim()) return;
      const currentUser = this.seats[0];
      this.messages.push({
        avatar: currentUser.avatar,
        name: '我',
        text: this.newMessage.trim()
      });
      this.newMessage = '';
      this.$nextTick(() => {
        this.scrollTop = 9999;
      });
    },
    loadMore() {}
  }
};
</script>

<style scoped>
/* 标题 */
.title {
  font-size: 24px;
  font-weight: bold;
  color: #DD031D;
  margin-bottom: 24px;
  padding-left: 4px;
}
.message {
  display: flex;
  flex-direction: column;
  /* height: 100vh; */
  background-color: #f8f8f8;
  overflow: hidden;
}

.content-scroll {
  flex: 1;
  padding: 20px 16px 0 16px;
  background-color: #f8f8f8;
  box-sizing: border-box;
}

.mahjong-table {
  margin-bottom: 24px;
  background-color: #ffffff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.2s ease;
}
.mahjong-table:hover {
  box-shadow: 0 8px 20px rgba(221, 3, 29, 0.08);
}

.table-bg {
  margin: auto;
  position: relative;
  width: 62%;
  aspect-ratio: 1 / 1;
  background-color: #2d5a27;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
}

.seat {
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #f0e6d2; /* 浅米色 */
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}
.seat:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(221, 3, 29, 0.3);
}

.seat-north {
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
}
.seat-east {
  right: 0;
  top: 50%;
  transform: translate(50%, -50%);
}
.seat-south {
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
}
.seat-west {
  left: 0;
  top: 50%;
  transform: translate(-50%, -50%);
}

.seat-avatar {
  font-size: 30px;
  line-height: 1;
  color: #333; /* 深色文字 */
}

.table-center {
  width: 60px;
  height: 60px;
  background-color: #d4af37;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: #333;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.game-card,
.tips-card {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.2s ease;
}
.game-card:hover,
.tips-card:hover {
  box-shadow: 0 8px 20px rgba(221, 3, 29, 0.08);
}

.game-header {
  font-size: 18px;
  font-weight: 600;
  color: #DD031D;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.info-row {
  display: flex;
  margin-bottom: 14px;
  line-height: 1.5;
}
.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 80px;
  font-size: 15px;
  color: #666;
  font-weight: 500;
}

.info-value {
  flex: 1;
  font-size: 16px;
  color: #333;
  font-weight: 500;
}
.info-value.password {
  font-family: monospace;
  letter-spacing: 1px;
  background-color: #f5f5f5;
  padding: 2px 8px;
  border-radius: 6px;
  display: inline-block;
}

.tips-card {
  background-color: #fff9e6;
  border-left: 5px solid #DD031D;
  margin-bottom: 20px;
}

.tips-title {
  font-size: 16px;
  font-weight: 600;
  color: #DD031D;
  margin-bottom: 8px;
  display: block;
}

.tips-content {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  word-break: break-word;
}

.chat-fixed {
  background-color: #ffffff;
  border-radius: 20px 20px 0 0;
  padding: 16px 16px 12px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.03);
  max-height: 40vh;
  display: flex;
  flex-direction: column;
}

.chat-header {
  font-size: 18px;
  font-weight: 600;
  color: #DD031D;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;
  max-height: 200px;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
}

.message-avatar {
  width: 40px;
  height: 40px;
  background-color: #f0e6d2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-right: 12px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  display: block;
}

.message-text {
  font-size: 15px;
  color: #666;
  line-height: 1.4;
  word-break: break-word;
  background-color: #f5f5f5;
  padding: 8px 12px;
  border-radius: 18px;
  display: inline-block;
  max-width: 80%;
}

.input-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-input {
  flex: 1;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 40px;
  padding: 10px 16px;
  font-size: 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.chat-input:hover {
  border-color: #DD031D;
  box-shadow: 0 0 0 2px rgba(221, 3, 29, 0.05);
}
.placeholder {
  color: #aaa;
  font-size: 16px;
}

.send-btn {
  background-color: #DD031D;
  color: white;
  border: none;
  border-radius: 40px;
  padding: 8px 20px;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(221, 3, 29, 0.2);
}
.send-btn:hover {
  background-color: #B00217;
  box-shadow: 0 6px 12px rgba(221, 3, 29, 0.3);
  transform: scale(1.02);
}
</style>