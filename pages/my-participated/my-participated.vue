<template>
  <view class="my-participated">
    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'all' }" 
        @click="switchTab('all')"
      >
        全部
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'publish' }" 
        @click="switchTab('publish')"
      >
        我发布的
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'join' }" 
        @click="switchTab('join')"
      >
        我加入的
      </view>
    </view>

    <!-- 任务列表 -->
    <view class="task-list">
      <view v-if="loading && tasks.length === 0" class="loading-text">加载中...</view>
      <view v-else-if="tasks.length === 0" class="empty-text">暂无任务</view>
      <view 
        class="task-item" 
        v-for="(task, idx) in tasks" 
        :key="idx"
        @click="goToTaskDetail(task)"
      >
        <!-- 第一行：标题 + 类型（并排） -->
        <view class="task-row title-row">
          <text class="task-title">{{ task.title }}</text>
          <text class="task-type">{{ task.typeName || task.type }}</text>
        </view>
        
        <!-- 第二行：地址 -->
        <view class="task-row address-row">
          <text class="icon-small">📍</text>
          <text class="task-addr">{{ task.address }}</text>
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
        
        <!-- 第五行：钻石 + 备注 -->
        <view class="task-row reward-row">
          <text class="reward-label">钻石：</text>
          <text class="reward-amount">{{ task.rewardAmount }}</text>
        </view>
        <view class="task-row remark-row" v-if="task.description">
          <text class="remark-label">备注：</text>
          <text class="remark-text">{{ task.description }}</text>
        </view>
      </view>
    </view>

    <!-- 加载更多提示 -->
    <view v-if="loadingMore" class="loading-more">加载中...</view>
    <view v-if="!hasMore && tasks.length > 0" class="no-more">没有更多了</view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      currentTab: 'all', // 'all', 'publish', 'join'
      tasks: [],
      loading: true,
      loadingMore: false,
      pageNum: 1,
      pageSize: 10,
      hasMore: true,
      total: 0
    }
  },
  onLoad() {
    this.loadTasks(true)
  },
  onPullDownRefresh() {
    this.pageNum = 1
    this.tasks = []
    this.loadTasks(true, () => {
      uni.stopPullDownRefresh()
    })
  },
  onReachBottom() {
    if (this.hasMore && !this.loadingMore) {
      this.loadMoreTasks()
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '未知时间'
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return dateString
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}`
      } catch (e) {
        return dateString
      }
    },

    // 切换 Tab
    switchTab(tab) {
      if (this.currentTab === tab) return
      this.currentTab = tab
      this.pageNum = 1
      this.tasks = []
      this.loadTasks(true)
    },

    // 根据当前 tab 构建请求参数
    getRequestParams() {
      const params = {
        pageNum: this.pageNum,
        pageSize: this.pageSize
      }
      if (this.currentTab !== 'all') {
        params.participateType = this.currentTab // 'publish' 或 'join'
      }
      return params
    },

    async loadTasks(isReset = false, callback) {
      if (isReset) {
        this.loading = true
      }
      try {
        const params = this.getRequestParams()
        const result = await api.getMyParticipatedTasks(params)
        console.log('我的参与', result)

        let list = []
        if (result && result.data) {
          list = result.data.records || result.data.list || result.data
        } else if (Array.isArray(result)) {
          list = result
        }

        if (list && list.length > 0) {
          const formattedTasks = this.formatTasks(list)
          if (isReset) {
            this.tasks = formattedTasks
          } else {
            this.tasks = [...this.tasks, ...formattedTasks]
          }

          if (result.data && result.data.total) {
            this.total = result.data.total
            this.hasMore = this.tasks.length < result.data.total
          } else {
            this.hasMore = list.length >= this.pageSize
          }
        } else {
          if (isReset) this.tasks = []
          this.hasMore = false
        }
      } catch (error) {
        console.error('加载失败', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
        if (isReset) this.tasks = []
      } finally {
        if (isReset) {
          this.loading = false
        }
        if (callback) callback()
      }
    },

    formatTasks(tasks) {
      if (!Array.isArray(tasks)) return []
      return tasks.map(task => ({
        ...task,
        title: task.title || '无标题',
        startTime: this.formatDate(task.startTime),
        endTime: this.formatDate(task.endTime),
        rewardAmount: task.rewardAmount || 0,
        description: task.description || '',
        typeName: task.typeName || task.type || '其他'
      }))
    },

    async loadMoreTasks() {
      if (this.loadingMore || !this.hasMore) return
      this.loadingMore = true
      this.pageNum++
      await this.loadTasks(false)
      this.loadingMore = false
    },
    // 跳转到任务详情页
    goToTaskDetail(task) {
      uni.navigateTo({
        url: `/pages/publishDetails/publishDetails?id=${task.id}&from=my`
      });
    }
  }
}
</script>

<style scoped>
/* 样式保持不变，与之前一致 */
.my-participated {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 16px;
}

.tab-bar {
  display: flex;
  background-color: #ffffff;
  border-radius: 30px;
  padding: 4px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  border-radius: 30px;
  transition: all 0.2s;
  cursor: pointer;
}
.tab-item.active {
  background-color: #DD031D;
  color: #ffffff;
}
.tab-item:hover:not(.active) {
  background-color: #f5f5f5;
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
  cursor: pointer; /* 增加手指指针 */
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
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.task-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-right: 8px;
}
.task-type {
  font-size: 14px;
  color: #DD031D;
  font-weight: 500;
  background-color: #fff6e6;
  padding: 4px 10px;
  border-radius: 30px;
  white-space: nowrap;
}

.icon-small {
  font-size: 16px;
  margin-right: 8px;
  color: #999;
}
.task-addr,
.task-time {
  font-size: 15px;
  color: #444;
}

.reward-row {
  margin-top: 8px;
}
.reward-label {
  font-size: 15px;
  color: #666;
  margin-right: 8px;
}
.reward-amount {
  font-size: 18px;
  font-weight: 600;
  color: #DD031D;
}

.remark-row {
  margin-top: 8px;
  align-items: flex-start;
}
.remark-label {
  font-size: 15px;
  color: #666;
  margin-right: 8px;
  white-space: nowrap;
}
.remark-text {
  font-size: 15px;
  color: #444;
  flex: 1;
  word-break: break-word;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 16px 0;
  color: #999;
  font-size: 14px;
}
</style>