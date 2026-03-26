<template>
  <view class="message">
    <!-- 可滚动内容区域 -->
    <scroll-view class="content-scroll" scroll-y>
      <view class="title">{{ taskDetail && taskDetail.title || '任务详情' }}</view>
      <!-- 麻将桌区域（动态参与者） -->
      <view class="mahjong-table">
        <view class="table-bg">
          <view v-for="(pos, index) in seatPositions" :key="pos"
                :class="['seat', `seat-${pos}`,
                         { 'seat-occupied': seatMap[pos],
                           'seat-selected': selectedSeat === pos && !seatMap[pos] }]"
                @click="onSeatClick(pos)">
            <!-- 参与者头像或姓名首字母（有参与者时显示） -->
            <view v-if="seatMap[pos]" class="participant-info">
              <image v-if="seatMap[pos].avatar" :src="seatMap[pos].avatar" mode="aspectFill" class="participant-avatar"></image>
              <text v-else class="participant-initial">{{ seatMap[pos].nickname ? seatMap[pos].nickname.charAt(0) : '?' }}</text>
            </view>
            <!-- 如果是发布者座位，显示小红花 -->
            <view v-if="publisherSeat === pos" class="red-flower">🌺</view>
          </view>
          <view class="table-center">🀄️</view>
        </view>
      </view>

      <!-- 立即加入/换座位 + 取消按钮区域（来源为 home 且任务未取消时显示） -->
      <view class="join-section" v-if="from === 'home' && !isTaskCancelled && !isTaskFull">
        <view class="button-group">
          <!-- 未加入时显示立即加入按钮 -->
          <button
            v-if="!isCurrentUserJoined"
            class="join-big-btn"
            @click="handleJoinOrChange"
            :disabled="applying || !canJoinOrChange"
          >
            立即加入
          </button>
          <!-- 已加入时显示取消报名按钮 -->
          <button
            v-else
            class="cancel-join-btn"
            @click="confirmCancelJoin"
            :disabled="cancelling || isTaskFull"
          >
            {{ cancelling ? '取消中...' : '取消报名' }}
          </button>
        </view>
      </view>

      <!-- 任务信息卡片 -->
      <view class="game-card">
        <view class="game-header">任务信息</view>
        <view class="info-row">
          <text class="info-label">类型</text>
          <text class="info-value">{{ taskDetail && (taskDetail.taskTypeName || taskDetail.taskType) || '--' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">钻石</text>
          <text class="info-value password">{{ (taskDetail && taskDetail.rewardAmount) || 0 }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">开始时间</text>
          <text class="info-value">{{ formatDate(taskDetail && taskDetail.startTime) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">结束时间</text>
          <text class="info-value">{{ formatDate(taskDetail && taskDetail.endTime) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">地址</text>
          <text class="info-value">{{ taskDetail && taskDetail.address || '--' }}</text>
        </view>
        <view class="info-row" v-if="taskDetail && taskDetail.shopName">
          <text class="info-label">麻将馆</text>
          <text class="info-value">{{ taskDetail.shopName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">发布者</text>
          <text class="info-value">{{ taskDetail && taskDetail.publisherName || '--' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">招募人数</text>
          <text class="info-value">{{ (taskDetail && taskDetail.needParticipants) || 0 }} 人</text>
        </view>
        <view class="info-row">
          <text class="info-label">已报名</text>
          <text class="info-value">{{ (taskDetail && taskDetail.currentParticipants) || 0 }} 人</text>
        </view>
        <view class="info-row" v-if="taskDetail && taskDetail.description">
          <text class="info-label">备注</text>
          <text class="info-value">{{ taskDetail.description }}</text>
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
      <scroll-view class="message-list" scroll-y :scroll-top="scrollTop" @scrolltoupper="loadMoreMessages">
        <view v-if="loadingMessages" class="loading-text">加载中...</view>
        <view v-else-if="messages.length === 0" class="empty-text">暂无消息</view>
        <view class="message-item" v-for="(msg, index) in messages" :key="index">
          <view class="message-avatar">
            <!-- 有头像则显示图片，否则显示昵称首字母或默认图标 -->
            <image v-if="msg.userAvatar" :src="msg.userAvatar" mode="aspectFill"></image>
            <text v-else>{{ msg.userNickname ? msg.userNickname.charAt(0) : '👤' }}</text>
          </view>
          <view class="message-content">
            <text class="message-name">{{ msg.userNickname || '用户' }}</text>
            <text class="message-text">{{ msg.content }}</text>
            <text class="message-time">{{ formatTime(msg.createTime) }}</text>
          </view>
        </view>
      </scroll-view>
      <view class="input-area">
        <input
          class="chat-input"
          type="text"
          placeholder="说点什么..."
          v-model="newMessage"
          placeholder-class="placeholder"
          @confirm="sendMessage"
          :disabled="isTaskCancelled"
        />
        <button
          class="send-btn"
          @click="sendMessage"
          :disabled="sending || isTaskCancelled"
        >发送</button>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      cancelling: false,
      taskId: null,
      from: '', // 来源标识：'home' 或 'my'
      taskDetail: null,
      participants: [],            // 存储参与者数据
      messages: [],
      newMessage: '',
      scrollTop: 0,
      loadingMessages: false,
      sending: false,
      pageNum: 1,
      pageSize: 20,
      hasMore: true,
      applying: false,
      selectedSeat: null,          // 当前选中的座位（如 'north'）
      seatMap: {                    // 座位映射
        north: null,
        east: null,
        south: null,
        west: null
      },
      publisherSeat: null,          // 发布者占用的座位
      hasShownLastJoinerTip: false
    };
  },
  computed: {
    isTaskCancelled() {
      // 假设已取消状态为 3，根据实际后端定义调整
      return this.taskDetail && this.taskDetail.status === 3;
    },
    isTaskFull() {
      return this.taskDetail && this.taskDetail.status === 4;
    },
    isLastJoiner() {
      if (!this.taskDetail || this.taskDetail.status !== 4) return false;
      const userInfo = uni.getStorageSync('userInfo');
      if (!userInfo || !userInfo.userId) return false;
      if (!this.participants || this.participants.length === 0) return false;
      // 假设 participants 已按加入时间升序排序，最后一位为最后加入者
      const lastParticipant = this.participants[this.participants.length - 1];
      return lastParticipant && lastParticipant.userId === userInfo.userId;
    },
    seatPositions() {
      return ['north', 'east', 'south', 'west'];
    },
    isCurrentUserJoined() {
      const userInfo = uni.getStorageSync('userInfo');
      if (!userInfo || !userInfo.userId) return false;
      return this.participants.some(p => p.userId === userInfo.userId);
    },
    canJoinOrChange() {
      // 如果已加入，不允许任何操作
      if (this.isCurrentUserJoined) return false;
      // 未加入：检查是否存在非发布者的空座位
      const emptySeats = this.seatPositions.filter(pos => !this.seatMap[pos] && pos !== this.publisherSeat);
      return emptySeats.length > 0;
    }
  },
  onLoad(options) {
    this.taskId = options.id;
    this.from = options.from || '';
    if (!this.taskId) {
      uni.showToast({ title: '任务ID不存在', icon: 'none' });
      return;
    }
    this.loadTaskDetail();
    this.loadMessages(true);
  },
  methods: {
    // 判断当前登录用户是否为发布者
    isCurrentUserPublisher() {
      const userInfo = uni.getStorageSync('userInfo');
      if (!userInfo || !userInfo.userId) return false;
      // 从参与者列表中查找 isPublisher 为 true 且 userId 匹配的项
      return this.participants.some(p => p.isPublisher && p.userId === userInfo.userId);
    },

    formatDate(dateString) {
      if (!dateString) return '--';
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
    formatTime(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      } catch (e) {
        return '';
      }
    },

    // 处理加入或换座
    async handleJoinOrChange() {
      if (this.applying) return;

      // 检查登录
      const userInfo = uni.getStorageSync('userInfo');
      // if (!userInfo || !userInfo.userId) {
      //   uni.showToast({ title: '请先登录', icon: 'none' });
      //   return;
      // }

      // 检查是否为发布者
      const publisher = this.seatMap[this.publisherSeat];
      if (publisher && publisher.userId === userInfo.userId) {
        uni.showToast({ title: '不能加入自己的任务', icon: 'none' });
        return;
      }

      // 检查是否已加入
      if (this.isCurrentUserJoined) {
        uni.showToast({ title: '您已加入该任务', icon: 'none' });
        return;
      }

      // 检查是否有空位
      if (!this.canJoinOrChange) {
        uni.showToast({ title: '暂无空位可加入', icon: 'none' });
        return;
      }

      // 判断是否为最后一名加入者（加入后任务满员）
      const isLastJoiner = (this.taskDetail.currentParticipants + 1 === this.taskDetail.needParticipants);
	  console.log('isLastJoinerisLastJoiner'+isLastJoiner)

      if (isLastJoiner) {
        // 弹出确认框
        this.applying = true; // 防止重复点击
        uni.showModal({
          title: '提示',
          content: '您是最后一名加入者，加入后就组队成功，确定加入吗？',
          success: (res) => {
            if (res.confirm) {
              // 用户确认，执行加入逻辑
              this.applyTask();
            } else {
              // 用户取消，重置 applying 状态
              this.applying = false;
            }
          },
          fail: () => {
            this.applying = false;
          }
        });
      } else {
        // 不是最后一名，直接申请
        await this.applyTask();
      }
    },

    // 申请加入（未加入时调用）
    async applyTask() {
      if (this.applying) return;
      if (this.isCurrentUserJoined) {
        uni.showToast({ title: '您已加入，不能重复申请', icon: 'none' });
        return;
      }

      // 确定要申请的座位：优先使用选中的，否则随机从空位中选一个（排除发布者座位）
      let targetSeat = this.selectedSeat;
      if (!targetSeat) {
        const emptySeats = this.seatPositions.filter(pos => !this.seatMap[pos] && pos !== this.publisherSeat);
        if (emptySeats.length === 0) {
          uni.showToast({ title: '暂无空位可加入', icon: 'none' });
          return;
        }
        const randomIndex = Math.floor(Math.random() * emptySeats.length);
        targetSeat = emptySeats[randomIndex];
      }

      // 二次检查：确保目标座位是空且不是发布者座位
      if (this.seatMap[targetSeat]) {
        uni.showToast({ title: '该座位已被占用', icon: 'none' });
        this.selectedSeat = null;
        return;
      }
      if (targetSeat === this.publisherSeat) {
        uni.showToast({ title: '不能选择发布者的座位', icon: 'none' });
        this.selectedSeat = null;
        return;
      }

      this.applying = true;
      try {
        const res = await api.applyTask({ taskId: this.taskId, seatPosition: targetSeat });
        if (res && res.code === 200) {
          uni.showToast({ title: '申请成功', icon: 'success' });
          await this.loadTaskDetail();
          this.selectedSeat = null;
        } else {
          uni.showToast({ title: res.message || '申请失败', icon: 'none' });
        }
      } catch (err) {
        console.error('申请加入失败', err);
        uni.showToast({ title: '申请失败', icon: 'none' });
      } finally {
        this.applying = false;
      }
    },

    showPublisherInfo() {
      const publisher = this.seatMap[this.publisherSeat];
      if (!publisher) {
        uni.showToast({ title: '未找到发布者信息', icon: 'none' });
        return;
      }
      uni.showModal({
        title: '发布者信息',
        content: `昵称：${publisher.nickname || '未知'}`,
        showCancel: false,
        confirmText: '知道了'
      });
    },

    async loadTaskDetail() {
      try {
        const res = await api.getTaskDetail(this.taskId);
        if (res && res.data) {
          this.taskDetail = res.data;
          let participants = res.data.participants || [];

          // 按加入时间排序（升序，最早加入在前）
          if (participants.length > 0 && participants[0].createTime) {
            participants = participants.sort((a, b) => new Date(a.createTime) - new Date(b.createTime));
          }

          // 始终使用后端返回的 seatPosition 构建座位
          this.seatMap = { north: null, east: null, south: null, west: null };
          this.publisherSeat = null;
          participants.forEach(p => {
            if (p.seatPosition && this.seatMap.hasOwnProperty(p.seatPosition)) {
              this.seatMap[p.seatPosition] = p;
              if (p.isPublisher) {
                this.publisherSeat = p.seatPosition;
              }
            }
          });

          this.participants = participants;

          // 最后一名加入者提示
          if (this.isLastJoiner && !this.hasShownLastJoinerTip) {
            uni.showModal({
              title: '提示',
              content: '您是最后一名加入者，加入后就组队成功，不能取消，请知晓！',
              showCancel: false,
              confirmText: '知道了'
            });
            this.hasShownLastJoinerTip = true;
          }
        } else {
          uni.showToast({ title: '任务详情加载失败', icon: 'none' });
        }
      } catch (err) {
        console.error('加载任务详情失败', err);
        uni.showToast({ title: '加载任务详情失败', icon: 'none' });
      }
    },

    // 点击座位
    onSeatClick(pos) {
      // 总是先选中当前座位（触发放大效果）
      this.selectedSeat = pos;

      // 如果是发布者座位，显示发布者信息（不提示“已有人”）
      if (this.publisherSeat === pos) {
        this.showPublisherInfo();
        return;
      }

      // 如果座位已被其他人占用，提示用户
      if (this.seatMap[pos]) {
        uni.showToast({ title: '该座位已有人', icon: 'none' });
        // 不返回，保留选中状态
        return;
      }

      // 空座位不做额外处理，等待用户操作
    },

    confirmCancelJoin() {
      uni.showModal({
        title: '确认取消',
        content: '确定要取消报名该任务吗？',
        success: (res) => {
          if (res.confirm) {
            this.cancelJoin();
          }
        }
      });
    },

    // 统一取消/退出逻辑
    async cancelJoin() {
      if (this.cancelling) return;
      this.cancelling = true;
      try {
        let res;
        if (this.isCurrentUserPublisher()) {
          // 发布者取消任务
          res = await api.cancelTask(this.taskId); // 请确保 api.js 中定义了 cancelTask
        } else {
          // 参与者退出任务
          res = await api.quitTask(this.taskId);
        }
        if (res && res.code === 200) {
          uni.showToast({ title: '已取消', icon: 'success' });
          await this.loadTaskDetail(); // 刷新数据，任务状态可能变为已取消
        } else {
          uni.showToast({ title: res.message || '取消失败', icon: 'none' });
        }
      } catch (err) {
        console.error('取消报名失败', err);
        uni.showToast({ title: '取消失败', icon: 'none' });
      } finally {
        this.cancelling = false;
      }
    },

    // 加载聊天消息
    async loadMessages(isReset = false) {
      if (this.loadingMessages) return;
      if (isReset) {
        this.pageNum = 1;
        this.hasMore = true;
        this.messages = [];
      }
      if (!this.hasMore) return;

      this.loadingMessages = true;
      try {
        const res = await api.getChatMessages(this.taskId, {
          pageNum: this.pageNum,
          pageSize: this.pageSize
        });
        if (res && res.data) {
          let list = res.data?.messages || [];
          if (!Array.isArray(list)) {
            list = [];
          }
          if (list.length > 0) {
            if (isReset) {
              this.messages = list;
            } else {
              this.messages = [...list, ...this.messages];
            }
            this.hasMore = list.length >= this.pageSize;
          } else {
            if (isReset) this.messages = [];
            this.hasMore = false;
          }
        } else {
          this.hasMore = false;
        }
      } catch (err) {
        console.error('加载消息失败', err);
        uni.showToast({ title: '加载消息失败', icon: 'none' });
        if (isReset) this.messages = [];
      } finally {
        this.loadingMessages = false;
      }
    },

    loadMoreMessages() {
      if (this.hasMore && !this.loadingMessages) {
        this.pageNum++;
        this.loadMessages(false);
      }
    },

    async sendMessage() {
      if (this.isTaskCancelled) {
        uni.showToast({ title: '任务已取消，不能发送消息', icon: 'none' });
        return;
      }
      if (!this.newMessage.trim()) return;
      this.sending = true;
      try {
        const res = await api.sendChatMessage(this.taskId, this.newMessage.trim());
        if (res && res.data) {
          const newMsg = res.data;
          this.messages.push(newMsg);
          this.newMessage = '';
          this.scrollTop = 0;
          this.$nextTick(() => {
            this.scrollTop = 9999;
          });
        } else {
          uni.showToast({ title: '发送失败', icon: 'none' });
        }
      } catch (err) {
        console.error('发送消息失败', err);
        uni.showToast({ title: '发送失败', icon: 'none' });
      } finally {
        this.sending = false;
      }
    }
  }
};
</script>

<style scoped>
/* 原有样式保留，仅添加/修改与座位头像相关的部分 */
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
  display: flex;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #f0e6d2;
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
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: #333;
}
.seat-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.seat-avatar-text {
  font-size: 30px;
  line-height: 1;
  color: #333;
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
  height: 60vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 20px 20px 0 0;
  padding: 16px 16px 12px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
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
  min-height: 0;
  overflow-y: auto;
  margin-bottom: 12px;
}
.loading-text,
.empty-text {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
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
  color: #333;
  margin-right: 12px;
  flex-shrink: 0;
  overflow: hidden; /* 确保图片圆角裁剪 */
    border-radius: 50%;
}

.message-avatar image {
  width: 100%;
height: 100%;
display: block;      /* 避免图片底部出现间隙 */
object-fit: cover;   /* 保持比例并填满 */
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
.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  display: block;
}
.input-area {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.chat-input {
  flex: 1;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 40px;
  padding: 10px 16px;
  font-size: 16px;
  /* transition: border-color 0.2s, box-shadow 0.2s; */
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
  /* transition: all 0.2s ease; */
  box-shadow: 0 4px 8px rgba(221, 3, 29, 0.2);
}
.send-btn:hover {
  background-color: #B00217;
  box-shadow: 0 6px 12px rgba(221, 3, 29, 0.3);
  transform: scale(1.02);
}
.send-btn:disabled {
  opacity: 0.6;
  pointer-events: none;
}
.join-section {
  margin: 20px 0;
  text-align: center;
}

.button-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;  /* 按钮之间的间距 */
}

.join-big-btn {
  background: linear-gradient(145deg, #DD031D, #b01030); /* 渐变红色，更大气 */
  color: white;
  border: none;
  border-radius: 30px;      /* 圆润的胶囊形状 */
  padding: 8px 24px;        /* 适中内边距，比原来小 */
  font-size: 16px;
  font-weight: 500;
  min-width: 120px;         /* 固定最小宽度，适应不同文字 */
  box-shadow: 0 6px 12px rgba(221, 3, 29, 0.3);
  transition: all 0.3s ease;
  margin: 0;                /* 清除默认外边距 */
}

.join-big-btn:hover {
  background: linear-gradient(145deg, #b01030, #8c0a26);
  box-shadow: 0 8px 16px rgba(221, 3, 29, 0.4);
  transform: translateY(-2px);
}

.join-big-btn:disabled {
  opacity: 0.5;
  pointer-events: none;
  box-shadow: none;
}

.cancel-btn {
  background-color: transparent;
  border: 2px solid #999;
  color: #666;
  border-radius: 30px;
  padding: 8px 24px;
  font-size: 16px;
  font-weight: 500;
  min-width: 120px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  margin: 0;
}

.cancel-btn:hover {
  background-color: #f5f5f5;
  border-color: #666;
  color: #333;
  transform: translateY(-2px);
}

.cancel-btn:disabled {
  opacity: 0.5;
  pointer-events: none;
}
/* 选中座位高亮 */
.seat-selected {
  border: 3px solid #DD031D;
  box-shadow: 0 0 0 3px rgba(221, 3, 29, 0.3);
  z-index: 2;
  transition: all 0.2s ease;
  /* transform: scale(1.1); */
}

.seat-north.seat-selected {
  transform: translate(-50%, -50%) scale(1.1);
}
.seat-east.seat-selected {
  transform: translate(50%, -50%) scale(1.1);
}
.seat-south.seat-selected {
  transform: translate(-50%, 50%) scale(1.1);
}
.seat-west.seat-selected {
  transform: translate(-50%, -50%) scale(1.1);
}
/* 已占座位样式（可选） */
.seat-occupied {
  opacity: 0.9;
  cursor: not-allowed;
}
.participant-info {
  position: absolute;        /* 让参与者信息浮在椅子上方 */
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;                /* 确保高于椅子 */
}

.participant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;         /* 保持图片比例，填充区域 */
}

.participant-initial {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  background-color: #f0e6d2; /* 可选，与座位背景协调 */
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cancel-join-btn {
  background: linear-gradient(145deg, #999, #777);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 8px 24px;
  font-size: 16px;
  font-weight: 500;
  min-width: 120px;
  box-shadow: 0 6px 12px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
  margin: 0;
}
.cancel-join-btn:hover {
  background: linear-gradient(145deg, #777, #555);
  box-shadow: 0 8px 16px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}
.cancel-join-btn:disabled {
  opacity: 0.5;
  pointer-events: none;
}
.red-flower {
  position: absolute;
  top: -10px;      /* 向上偏移，浮在座位上方 */
  right: -5px;     /* 向右偏移，避免遮挡头像 */
  font-size: 20px; /* 调整大小 */
  z-index: 3;      /* 确保在座位和头像之上 */
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  pointer-events: none; /* 使小红花不干扰点击事件 */
}
</style>