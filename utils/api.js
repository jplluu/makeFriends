// utils/api.js

// 基础配置
const BASE_URL = 'http://192.168.2.16:8080/api';

// 请求封装
const request = (url, method, data) => {
  return new Promise((resolve, reject) => {
	// 获取本地存储的 token
	const token = uni.getStorageSync('token');
	console.log('token22222222222222222222222:'+token)
	// 构建请求头
	const header = {
	  'Content-Type': 'application/json'
	};
	// 如果 token 存在，添加到请求头
	if (token) {
	  header['Authorization'] = 'Bearer ' + token;
	}
    uni.request({
      url: BASE_URL + url,
      method: method,
      header: header,
      data: data,
      success: (res) => {
        if (res.statusCode === 200) {
          // 假设接口返回格式为 { code: 200, message: '成功', data: {} }
          if (res.data && res.data.code === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data?.message || '请求失败'));
          }
        } else {
          // 处理未授权或禁止访问
			if (res.statusCode === 401 || res.statusCode === 403) {
			  uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
			  setTimeout(() => {
				uni.navigateTo({ url: '/pages/login/login' });
			  }, 1500);
			}
			reject(new Error('网络错误：' + res.statusCode));
        }
      },
      fail: (err) => {
        reject(new Error('网络请求失败'));
      }
    });
  });
};

// API 模块
export default {
  /**
   * 发送验证码
   * @param {object} params 参数对象
   * @param {string} params.phone 手机号
   * @param {number} params.type 验证码类型：1-注册，2-登录，3-找回密码等
   */
  sendSmsCode(params) {
    return request('/auth/send-sms', 'POST', params);
  },
  
  /**
   * 用户注册
   * @param {object} data 注册信息
   */
  register(data) {
    return request('/auth/register', 'POST', data);
  },
  
  /**
   * 用户登录
   * @param {object} data 登录信息
   */
  login(data) {
    return request('/auth/login', 'POST', data);
  },
  
  /**
   * 用户登录
   * @param {object} data 退出信息
   */
  logout(data) {
    return request('/auth/logout', 'POST', data);
  },
  /**
   * 发布任务
   * @param {object} data 发布任务信息
   */
  taskCreate(data) {
    return request('/task/create', 'POST', data);
  },
	  /**
	 * 获取字典数据
	 * @param {string} dictType 字典类型，如 'mahjong_type'
	 * @returns {Promise}
	 */
	getDictData(dictType) {
	  return request(`/dict/data/type/${dictType}`, 'GET');
	},
	/**
   * 获取任务列表
   * @param {object} params 查询参数（分页、筛选等）
   * @returns {Promise}
   */
  getTaskList(params) {
	return request('/task/list', 'GET', params);
  },
  /**
   * 加入任务
   * @param {string} id 任务编号
   */
  applyTask(params) {
    return request(`/task/applyTask`, 'POST',params);
  },
  // 发布者取消任务
  cancelTask(id) {
    return request(`/task/cancel/${id}`, 'POST');
  },
  /**
   * 退出任务
   * @param {string} id 任务编号
   */
  quitTask(id) {
    return request(`/task/quit/${id}`, 'POST');
  },
  /**
   * 获取我参与的任务（发布/加入）
   * @param {object} params 查询参数 { pageNum, pageSize, participateType }
   * @returns {Promise}
   */
  getMyParticipatedTasks(params) {
    return request('/task/my-participated', 'GET', params);
  },
  /**
   * 获取任务详情
   * @param {number|string} taskId 任务ID
   * @returns {Promise}
   */
  getTaskDetail(taskId) {
    return request(`/task/${taskId}`, 'GET');
  },
  // 获取聊天消息列表（新接口）
  getChatMessages(taskId, params) {
    return request(`/chat/list/${taskId}`, 'GET', params);
  },
  
  // 发送聊天消息
  sendChatMessage(taskId, content) {
    return request(`/chat/send`, 'POST', { taskId, content });
  },
  
  /**
   * 获取积分账户信息（钻石余额）
   * @returns {Promise} 返回 { code:200, data: { balance: xxx } }
   */
  getPointsAccount() {
    return request('/points/account', 'GET');
  },
  
  /**
   * 充值接口
   * @param {object} data 充值参数 
   * @returns {Promise} 返回支付参数（根据平台不同结构不同）
   */
  recharge(data) {
    return request('/points/recharge', 'POST', data);
  }
};