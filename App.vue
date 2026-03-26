<script>
export default {
  onLaunch() {
    console.log('App Launch');
    // 引导页判断：首次启动进入引导，否则根据登录状态和手机号情况跳转
    const hasLaunched = uni.getStorageSync('hasLaunched');
    const token = uni.getStorageSync('token');
    const registeredPhone = uni.getStorageSync('registeredPhone');
    
    if (!hasLaunched) {
      // 首次启动，跳转引导页
      uni.reLaunch({ url: '/pages/guidance/guidance' });
    } else {
      if (token) {
        // 已登录，直接进入首页
        uni.switchTab({ url: '/pages/index/index' });
      } else {
        if (registeredPhone) {
          // 有注册记录但未登录，跳转登录页
          uni.reLaunch({ url: '/pages/login/login' });
        } else {
          // 无注册记录，跳转注册页
          uni.reLaunch({ url: '/pages/register/register' });
		  // uni.reLaunch({ url: '/pages/guidance/guidance' });
        }
      }
    }
  },
  onShow() {}
};
</script>

<style>
page { background-color: #f8f8f8; }
</style>