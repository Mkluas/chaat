// 配置
var envir = 'online',
  CONFIG = {},
  configMap = {
    test: {
      appkey: 'ae19fb22b0da00f0cd0a14f722f78ab2',
      url: 'https://apptest.netease.im'
    },

    pre: {
      appkey: 'ae19fb22b0da00f0cd0a14f722f78ab2',
      url: 'http://preapp.netease.im:8184'
    },
    online: {
      appkey: 'ae19fb22b0da00f0cd0a14f722f78ab2',
      url: 'https://app.netease.im'
    }
  };
CONFIG = configMap[envir];
// 是否开启订阅服务
CONFIG.openSubscription = true

module.exports = CONFIG