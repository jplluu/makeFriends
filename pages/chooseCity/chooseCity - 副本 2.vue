<template>
  <view class="choose-city">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="nav-title">选择城市</view>
      <view class="nav-right"></view>
    </view>

    <!-- 搜索框（可输入） -->
    <view class="search-box">
      <text class="search-icon">🔍</text>
      <input 
        type="text" 
        class="search-input" 
        placeholder="输入城市名、拼音或字母查询" 
        v-model="searchKeyword"
        @input="handleSearch"
        confirm-type="search"
        placeholder-class="placeholder"
      />
      <text v-if="searchKeyword" class="clear-btn" @click="clearSearch">✕</text>
    </view>

    <!-- 热门城市（仅当无搜索词时显示） -->
    <view class="hot-cities" v-if="!searchKeyword">
      <view class="section-title">热门城市</view>
      <view class="hot-list">
        <view
          class="hot-item"
          v-for="city in hotCities"
          :key="city"
          @click="selectCity(city)"
        >
          {{ city }}
        </view>
      </view>
    </view>

    <!-- 城市列表区域 -->
    <view class="city-list-wrapper">
      <scroll-view
        class="city-list"
        scroll-y
        :scroll-into-view="scrollIntoView"
        scroll-with-animation
        @scroll="onScroll"
        ref="scrollView"
      >
        <!-- 无搜索结果提示 -->
        <view v-if="searchKeyword && searchResult.length === 0" class="no-result">
          未找到匹配的城市
        </view>

        <!-- 搜索结果（平铺列表） -->
        <view v-else-if="searchKeyword && searchResult.length > 0" class="search-result">
          <view
            class="city-item"
            v-for="city in searchResult"
            :key="city"
            @click="selectCity(city)"
          >
            {{ city }}
          </view>
        </view>

        <!-- 分组城市列表（无搜索时）按字母顺序渲染 -->
        <template v-else>
          <view
            v-for="letter in letters"
            :key="letter"
            :id="'city-' + letter"
            class="city-group"
          >
            <view class="group-letter">{{ letter }}</view>
            <view
              class="city-item"
              v-for="city in cityData[letter]"
              :key="city"
              @click="selectCity(city)"
            >
              {{ city }}
            </view>
          </view>
        </template>
      </scroll-view>

      <!-- 右侧字母索引（仅无搜索时显示） -->
      <view class="letter-index" v-if="!searchKeyword">
        <view
          class="letter"
          v-for="letter in letters"
          :key="letter"
          :class="{ active: activeLetter === letter }"
          @click="scrollToLetter(letter)"
        >
          {{ letter }}
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import cityData from '@/utils/city-data.js'; // 直接导入城市数据

export default {
  data() {
    return {
      hotCities: ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市'],
      cityData: {},        // 按字母分组的城市数据
      flatCities: [],      // 扁平化的所有城市名（用于搜索）
      letters: [],         // 所有字母
      activeLetter: 'A',
      searchKeyword: '',   // 搜索关键词
      searchResult: [],    // 搜索结果
      groupPositions: [],   // 存储每个分组的位置信息 { top, letter }
      scrollIntoView: ''    // 用于控制滚动到指定元素
    };
  },
  onLoad() {
    this.processCityData(cityData);
  },
  onReady() {
    // 页面渲染完成后获取分组位置
    this.$nextTick(() => {
      this.calcGroupPositions();
    });
  },
  methods: {
    // 处理城市数据
    processCityData(data) {
      const cities = [];
      data.forEach(province => {
        if (province.children && Array.isArray(province.children)) {
          province.children.forEach(city => {
            if (city.name && city.pinyin) {
              cities.push({
                name: city.name,
                pinyin: city.pinyin
              });
            }
          });
        }
      });

      // 保存扁平化数据用于搜索
      this.flatCities = cities.map(item => item.name);

      // 按拼音首字母分组
      const groups = {};
      cities.forEach(item => {
        const firstLetter = item.pinyin.charAt(0).toUpperCase();
        if (/[A-Z]/.test(firstLetter)) {
          if (!groups[firstLetter]) groups[firstLetter] = [];
          groups[firstLetter].push(item.name);
        }
      });

      // 对每个字母组内的城市名称排序（A-Z顺序）
      Object.keys(groups).forEach(letter => {
        groups[letter].sort((a, b) => a.localeCompare(b, 'zh-CN'));
      });

      this.cityData = groups;
      this.letters = Object.keys(groups).sort();
      this.activeLetter = this.letters[0] || 'A';

      // 等待 DOM 更新后重新计算位置
      this.$nextTick(() => {
        this.calcGroupPositions();
      });
    },

    // 计算每个分组的位置（相对于视口的 top 值）
    calcGroupPositions() {
      if (this.searchKeyword) return; // 搜索时不计算
      const query = uni.createSelectorQuery().in(this);
      query.selectAll('.city-group').boundingClientRect((rects) => {
        if (rects && rects.length) {
          this.groupPositions = rects.map((rect, index) => ({
            top: rect.top,
            letter: this.letters[index] // 与字母数组顺序一致
          }));
        }
      }).exec();
    },

    // 滚动事件处理
    onScroll(e) {
      if (this.searchKeyword) return; // 搜索时不联动
      const scrollTop = e.detail.scrollTop;
      if (this.groupPositions.length === 0) return;

      let active = this.letters[0];
      for (let i = 0; i < this.groupPositions.length; i++) {
        const pos = this.groupPositions[i];
        // 当某个分组的 top 大于当前滚动距离时，说明该分组刚刚进入视野
        if (pos.top > scrollTop + 5) { // 加少量缓冲
          active = this.letters[i - 1] || this.letters[0];
          break;
        }
      }
      // 如果已经滚动到底部（所有分组 top 都小于等于 scrollTop），则高亮最后一个
      if (scrollTop >= this.groupPositions[this.groupPositions.length - 1].top) {
        active = this.letters[this.letters.length - 1];
      }
      if (active !== this.activeLetter) {
        this.activeLetter = active;
      }
    },

    // 滚动结束或上下边缘触发时重新计算位置（防止布局变化导致错位）
    onScrollEnd() {
      this.calcGroupPositions();
    },

    // 搜索处理
    handleSearch() {
      const keyword = this.searchKeyword.trim().toLowerCase();
      if (!keyword) {
        this.searchResult = [];
        return;
      }
      // 根据城市名模糊匹配（可扩展拼音搜索）
      this.searchResult = this.flatCities.filter(city =>
        city.toLowerCase().includes(keyword)
      ).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    },

    // 清空搜索
    clearSearch() {
      this.searchKeyword = '';
      this.searchResult = [];
      // 清空搜索后重新计算分组位置
      this.$nextTick(() => {
        this.calcGroupPositions();
      });
    },

    // 返回上一页
    goBack() {
      uni.navigateBack();
    },

    // 选择城市
    selectCity(city) {
      uni.$emit('citySelected', city);
      uni.navigateBack();
    },

    // 滚动到指定字母分组
    scrollToLetter(letter) {
      this.activeLetter = letter;
      this.scrollIntoView = 'city-' + letter;
      // 动画结束后重置 scrollIntoView，以便下次点击同一字母能再次触发
      setTimeout(() => {
        this.scrollIntoView = '';
      }, 500);
    }
  }
};
</script>

<style scoped>
.choose-city {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f8f8;
}

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
.placeholder {
  color: #999;
  font-size: 16px;
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

.hot-cities {
  background-color: #ffffff;
  padding: 16px;
  margin: 0 16px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}
.hot-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.hot-item {
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-radius: 30px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}
.hot-item:hover {
  background-color: #DD031D;
  color: #ffffff;
}

.city-list-wrapper {
  flex: 1;
  position: relative;
  background-color: #ffffff;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
}
.city-list {
  height: 100%;
  padding: 0 16px 20px;
}
.no-result {
  padding: 30px;
  text-align: center;
  color: #999;
  font-size: 16px;
}
.search-result {
  padding: 0 16px;
}
.search-result .city-item {
  border-bottom: 1px solid #f0f0f0;
}
.city-group {
  margin-bottom: 16px;
}
.group-letter {
  font-size: 18px;
  font-weight: 600;
  color: #DD031D;
  margin: 12px 0 8px;
}
.city-item {
  padding: 12px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.city-item:active {
  background-color: #f9f9f9;
}

.letter-index {
  position: absolute;
  right: 8px;
  top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: transparent;
  z-index: 10;
}
.letter {
  font-size: 12px;
  color: #999;
  padding: 2px 4px;
  cursor: pointer;
}
.letter.active {
  color: #DD031D;
  font-weight: 600;
}
</style>