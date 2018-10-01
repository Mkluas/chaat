function requestCover(text, cb) {
    wx.getImageInfo({
      src: encodeURI("https://molibao.cc/api/cover?text=" + text),
      success: function (res) {
        console.log("Request cover success:", text)
        cb(res.path);
        wx.hideLoading();
      },
      fail: function (err) {
        wx.showToast({
            title: '网络异常',
            image: '/images/cancel.png'
        })
      }
    })
}

function checkSendText(text, page) {
    if (text.length > 30) {
      wx.showToast({
        title: '长度不能大于30',
        image: '/images/cancel.png'
      })
      return false;
    }

    if (endWith(text, '#主题')) {
      var covertext = removeEnd(text, '#主题')
      if (covertext.length > 0) {
        requestCover(covertext, function(path) {
          page.setData({coverpath: path});
        });
        return false;
      }
    } 
    return true;
}

function endWith(text, suffix) {
  if (text.length <= suffix.length) {
    return false;
  } else {
    return suffix === text.substring(text.length - suffix.length)
  }
}

function removeEnd(text, suffix) {
  return text.substring(0, text.length - suffix.length)
}

module.exports = {
    requestCover,
    checkSendText
}