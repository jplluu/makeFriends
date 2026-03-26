import App from './App'
import api from '@/common/fun.js'      // 修正路径
Vue.prototype.$api = api

// #ifndef VUE3
import Vue from 'vue'
import uni from '@dcloudio/uni-ui'    // 引入 uni-ui
Vue.use(uni)                           // 全局注册

Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
    ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import uni from '@dcloudio/uni-ui'    // VUE3 中注册方式略有不同
export function createApp() {
  const app = createSSRApp(App)
  app.use(uni)                          // VUE3 使用 app.use
  app.config.globalProperties.$api = api
  return { app }
}
// #endif