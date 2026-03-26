<template>
  <view class="message-page">
    <!-- 顶部标题与搜索 -->
    <view class="header">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input 
          type="text" 
          placeholder="搜索好友等" 
          placeholder-class="placeholder"
          confirm-type="search"
        />
      </view>
    </view>

    <!-- 分段标题 -->
    <view class="section-title">全部会话</view>

    <!-- 会话列表 -->
    <scroll-view class="list-scroll" scroll-y show-scrollbar="false">
      <view 
        class="list-item" 
        v-for="(item, index) in sessions" 
        :key="index"
        @click="openSession(item)"
      >
        <!-- 左侧头像 -->
        <view class="item-left">
          <view class="avatar" :style="{ backgroundColor: item.avatarColor }">
            <text>{{ item.avatar }}</text>
          </view>
        </view>

        <!-- 中间内容 -->
        <view class="item-middle">
          <view class="name-row">
            <text class="name">{{ item.name }}</text>
            <text v-if="item.special" class="special-tag">{{ item.special }}</text>
          </view>
          <view class="last-message" v-if="item.lastMsg">
            <text>{{ item.lastMsg }}</text>
          </view>
        </view>

        <!-- 右侧时间及未读 -->
        <view class="item-right">
          <text class="time">{{ item.time }}</text>
          <view v-if="item.unreadCount" class="unread-badge">
            {{ item.unreadCount }}
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      sessions: [
        {
          avatar: '📦',
          avatarColor: '#DD031D', // 红色
          name: '消息盒子',
          special: '',
          lastMsg: '蚂蚁森林|你的5g能量成熟了，今天有森..',
          time: '11:01',
          unreadCount: 0,
        },
        {
          avatar: '📱',
          avatarColor: '#2A82DA', // 蓝色
          name: '手机通讯生活',
          special: 'iPhone18Pro深红色',
          lastMsg: '',
          time: '11:27',
          unreadCount: 0,
        },
        {
          avatar: '🐸',
          avatarColor: '#4CAF50', // 绿色
          name: '张三',
          special: '做鬼脸',
          lastMsg: '[蚂蚁庄园]我帮你喂了饲料哦',
          time: '11:27',
          unreadCount: 2,
        },
        {
          avatar: '💰',
          avatarColor: '#FF9800', // 橙色
          name: '天弘基金财富号',
          special: '',
          lastMsg: '周期迎开门红！当下什么值..',
          time: '星期二',
          unreadCount: 0,
        },
        {
          avatar: '🎂',
          avatarColor: '#9C27B0', // 紫色
          name: '生日提醒',
          special: '',
          lastMsg: '今天有1个好友过生日，送上祝福吧',
          time: '26/2/16',
          unreadCount: 1,
        },
        {
          avatar: '✨',
          avatarColor: '#607D8B', // 蓝灰
          name: '青',
          special: '',
          lastMsg: '我使用沾福气复制了你的友善福',
          time: '26/2/3',
          unreadCount: 0,
        },
        {
          avatar: '🐥',
          avatarColor: '#FF5722', // 深橙
          name: '乐俊',
          special: '',
          lastMsg: '[蚂蚁庄园]我帮你喂了饲料哦',
          time: '25/11/29',
          unreadCount: 0,
        },
        {
          avatar: '🥬',
          avatarColor: '#8BC34A', // 浅绿
          name: '钱大妈长沙福利群17群',
          special: '',
          lastMsg: '[有人@我]小榕树：送你碰一下支付红包～',
          time: '25/9/13',
          unreadCount: 5,
        },
      ],
    };
  },
  methods: {
    openSession(item) {
      uni.showToast({
        title: `打开${item.name}会话`,
        icon: 'none',
      });
      // 实际跳转：uni.navigateTo({ url: '/pages/chat/chat?name=' + encodeURIComponent(item.name) });
    },
  },
};
</script>

<style scoped>
.message-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f8f8;
  padding: 16px 16px 0 16px;
  box-sizing: border-box;
  overflow: hidden;
}

/* 顶部标题行 */
.header {
  margin-bottom: 20px;
}
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.title {
  font-size: 28px;
  font-weight: bold;
  color: #DD031D;
}
.total-badge {
  background-color: #DD031D;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 30px;
  line-height: 1.4;
}

/* 搜索框 */
.search-box {
  background-color: #ffffff;
  border-radius: 30px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: box-shadow 0.2s;
}
.search-box:hover {
  box-shadow: 0 4px 12px rgba(221, 3, 29, 0.1);
}
.search-icon {
  font-size: 18px;
  color: #999;
  margin-right: 8px;
}
.search-box input {
  flex: 1;
  font-size: 16px;
  color: #333;
}
.placeholder {
  color: #aaa;
  font-size: 16px;
}

/* 分段标题 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #666;
  margin-bottom: 12px;
  padding-left: 4px;
}

/* 会话列表滚动区 */
.list-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
}

/* 列表项卡片 */
.list-item {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  transition: box-shadow 0.2s, transform 0.2s;
  cursor: pointer;
}
.list-item:hover {
  box-shadow: 0 8px 20px rgba(221, 3, 29, 0.12);
  transform: translateY(-2px);
}

/* 左侧头像 */
.item-left {
  margin-right: 14px;
}
.avatar {
  width: 52px;
  height: 52px;
  border-radius: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 28px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}
.avatar:hover {
  transform: scale(1.05);
}

/* 中间内容 */
.item-middle {
  flex: 1;
  min-width: 0; /* 防止溢出 */
}
.name-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
.name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.special-tag {
  font-size: 13px;
  color: #999;
  background-color: #f5f5f5;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.last-message {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

/* 右侧时间和未读 */
.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: 10px;
}
.time {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
  margin-bottom: 6px;
}
.unread-badge {
  background-color: #DD031D;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  min-width: 20px;
  height: 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  box-sizing: border-box;
  box-shadow: 0 2px 6px rgba(221, 3, 29, 0.3);
}

/* 适配底部 tabBar */
.message-page {
  padding-bottom: 0; /* tabBar 由全局控制，页面内无需额外内边距 */
}
</style>