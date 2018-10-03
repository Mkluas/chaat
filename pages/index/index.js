//获取应用实例
const app = getApp()

Page({
  data: {
    teams: [],
  },

  bindViewTap: function() {
   
  },

  onLoad: function () {
    var self = this;
    wx.showShareMenu({
      withShareTicket: true,
      success: function (res) {
        console.log('share', res)
      }
    })

    if (app.globalData.login) {
      self.loadTeams();
    } else {
      console.log('subscribe APP_LOGIN')
      app.globalData.subscriber.on('APP_LOGIN', () => {
        console.log('APP login')
        self.loadTeams();
      });
    }

  },

  loadTeams: function() {
    var self = this;
    app.getTeams(false, function(teams) {
      self.setData({ teams: teams })
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'sgnl',
      path: '/pages/chat/chat?userId=' + app.globalData.tokenInfo.userId,
      // imageUrl: '/images/chat.png',
      success: function() {
        console.log('info', app.globalData.tokenInfo)
      }
    }
  }
})
