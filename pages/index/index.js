//获取应用实例
const app = getApp()

Page({
  data: {
    
  },
  bindViewTap: function() {
   
  },
  onLoad: function () {
    wx.showShareMenu({
      withShareTicket: true,
      success: function (res) {
        console.log('share', res)
      }
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'hello',
      path: '/pages/chat/chat?userId=' + app.globalData.tokenInfo.userId,
      imageUrl: '/images/chat.png',
      success: function() {
        console.log('info', app.globalData.tokenInfo)
      }
    }
  }
})
