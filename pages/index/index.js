//获取应用实例
const request = require('../../utils/request.js')
import { removeThemePrefix } from '../../utils/lang.js'
const app = getApp()

Page({
  data: {
    teams: [],
    focus: false,
    hidden: true,
    inputValue: '',
    theme: "SGNL"
  },

  bindViewTap: function() {
   
  },

  send: function (e) {
    var text = e.detail.value;
    console.log('text', removeThemePrefix(text));
    this.setData({ theme: removeThemePrefix(text)});
    this.chatBlur();
    this.onShareAppMessage();
  },

  chatInput: function () {
    this.setData({ focus: true, hidden: false, inputValue: '$话题$开始爆料本群的秘密' })
  },

  chatBlur: function (e) {
    if (this.data.focus) {
      this.setData({ focus: false, hidden: true, inputValue: '' })
    }
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
