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

    <!-- 搜索框 -->
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

    <!-- 热门城市（仅无搜索时） -->
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
        :scroll-top="scrollTop"
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

        <!-- 分组城市列表（无搜索时） -->
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
import cityData from '@/utils/city-data.js';

export default {
  data() {
    return {
      hotCities: ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市'],
      cityData: {},
      flatCities: [],
      letters: [],
      activeLetter: 'A',
      searchKeyword: '',
      searchResult: [],
      scrollTop: 0,          // 控制滚动位置
      groupTops: []           // 存储每个分组的 top 值
    };
  },
  onLoad() {
    this.processCityData(cityData);
  },
  onReady() {
    this.calcGroupTops();
  },
  methods: {
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

      // 对每个字母组内的城市名称进行排序（A-Z 顺序）
      Object.keys(groups).forEach(letter => {
        groups[letter].sort((a, b) => a.localeCompare(b, 'zh-CN'));
      });

      this.cityData = groups;
      this.letters = Object.keys(groups).sort();
      this.activeLetter = this.letters[0] || 'A';

      this.$nextTick(() => {
        this.calcGroupTops();
      });
    },

    calcGroupTops() {
      if (this.searchKeyword) return;
      const query = uni.createSelectorQuery().in(this);
      query.selectAll('.city-group').boundingClientRect((rects) => {
        if (rects && rects.length) {
          this.groupTops = rects.map((rect, index) => ({
            top: rect.top,
            letter: this.letters[index]
          }));
        }
      }).exec();
    },

    onScroll(e) {
      if (this.searchKeyword) return;
      const scrollTop = e.detail.scrollTop;
      if (this.groupTops.length === 0) return;

      let active = this.letters[0];
      for (let i = 0; i < this.groupTops.length; i++) {
        const pos = this.groupTops[i];
        if (pos.top > scrollTop + 5) {
          active = this.letters[i - 1] || this.letters[0];
          break;
        }
      }
      if (scrollTop >= this.groupTops[this.groupTops.length - 1].top) {
        active = this.letters[this.letters.length - 1];
      }
      if (active !== this.activeLetter) {
        this.activeLetter = active;
      }
    },

    scrollToLetter(letter) {
      const index = this.letters.indexOf(letter);
      if (index !== -1 && this.groupTops[index]) {
        this.scrollTop = this.groupTops[index].top;
      }
    },

    handleSearch() {
      const keyword = this.searchKeyword.trim().toLowerCase();
      if (!keyword) {
        this.searchResult = [];
        return;
      }
      // 搜索结果也可按拼音排序
      this.searchResult = this.flatCities
        .filter(city => city.toLowerCase().includes(keyword))
        .sort((a, b) => a.localeCompare(b, 'zh-CN'));
    },

    clearSearch() {
      this.searchKeyword = '';
      this.searchResult = [];
      this.$nextTick(() => {
        this.calcGroupTops();
      });
    },

    goBack() {
      uni.navigateBack();
    },

    selectCity(city) {
      uni.$emit('citySelected', city);
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
/* 样式保持不变，与之前一致 */
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