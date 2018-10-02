const host = "https://molibao.cc"
// const host = "http://localhost:9000";

const request = options => {

  options = initDefaultOptions(options);
  options = initCallback(options);
  
  if (options.loading || options.loadingText) {
    wx.showLoading({
      title: options.loadingText || '加载中',
    });
  }

  console.log((options.method || 'GET') + ' ' + options.url);
  wx.request(options);
}

const initDefaultOptions = options => {
  if (options.url.indexOf("http") < 0) {
    options.url = host + options.url;
  }

  if (!options.header) {
    options.header = {
      'content-type': 'application/x-www-form-urlencoded'
    }
  }

  if (options.loadingText) {
    options.loading = true;
  }

  if (options.app.globalData.tokenInfo) {
    if (!options.data) {
      options.data = {}
    }
    options.data.token = options.app.globalData.tokenInfo.token;
  }

  return options;
}

const initCallback = options => {

  var app = options.app;

  if (!options.fail) {
    options.fail = function (err) {
      wx.showToast({
        title: '网络异常',
        image: '/images/cancel.png'
      })
    }
  } 
  
  if (options.loading) {
    const failCallback = options.fail;
    options.fail = function (err) {
      wx.hideLoading();
      failCallback(err);
    }
  }

  const successCallback = options.success;
  options.success = function (res) {
    if (options.loading) {
      wx.hideLoading();
    }

    if (res.data && res.data.errCode === 0) {
      successCallback && successCallback(res.data);
    } else {

      console.log("ErrCode = " + res.data.errCode + " ErrMsg = " + res.data.errMsg);
      if (res.data && res.data.errCode === 40025) {
      
        app.doLogin(function(token) {
          console.log('try login success')
          if (options.data) {
            options.data.token = token;
          } else {
            options.data = {"token": token}
          }
          wx.request(options);
        });

      } else {
        if (options.logicError) {
          options.logicError(res);
        } else {
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: res.data.errMsg || '服务器繁忙, 请稍候重试',
          })
        }
      }
    }
  }

  return options;
}

const get = options => {
  options.method = 'GET',
    request(options);
}

const post = options => {
  options.method = 'POST',
    request(options);
}

module.exports = {
  get: get,
  post: post
}
