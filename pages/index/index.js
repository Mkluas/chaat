//获取应用实例
const request = require('../../utils/request.js')
const app = getApp()

Page({
  data: {
    teams: [],
  },

  onLoad: function () {
    wx.showShareMenu({withShareTicket: true})
  },

  switchChat: function(e) {
    var url = e.currentTarget.dataset.url;
    wx.navigateTo({url: url,})
  },

  onShow: function() {
    var self = this;
    if (app.globalData.login) {
      self.loadTeams();
    } else {
      app.globalData.subscriber.on('APP_LOGIN', () => {
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

  handleDeleteItem: function(e) {
    let teamId = e.currentTarget.dataset.id;
    // let teams = this.data.teams;
    // let teamIndex = teams.findIndex(t => t.id == teamId);

    // teams.splice(teamIndex, 1);
    // this.setData({teams})
    // if (teams[teamIndex]) {
    //   this.setXmove(teamIndex, 0);
    // }

    var self = this;
    request.post({
      app: app,
      url: "/ma/group/remove",
      data: {"teamId": teamId},
      success: function() {
        app.getTeams(true, function (teams) {
          self.setData({ teams: teams })
        })
      }
    })
  },

  /**
   * 显示删除按钮
   */
  showDeleteButton: function (e) {
    let productIndex = e.currentTarget.dataset.productindex
    this.setXmove(productIndex, -180)
  },

  /**
   * 隐藏删除按钮
   */
  hideDeleteButton: function (e) {
    let productIndex = e.currentTarget.dataset.productindex

    this.setXmove(productIndex, 0)
  },

  /**
   * 设置movable-view位移
   */
  setXmove: function (productIndex, xmove) {
    let teams = this.data.teams
    teams[productIndex].xmove = xmove
    console.log(teams[productIndex])
    this.setData({
      teams: teams
    })
  },

  /**
   * 处理movable-view移动事件
   */
  handleMovableChange: function (e) {
    if (e.detail.source === 'friction') {
      if (e.detail.x < -30) {
        this.showDeleteButton(e)
      } else {
        this.hideDeleteButton(e)
      }
    } else if (e.detail.source === 'out-of-bounds' && e.detail.x === 0) {
      this.hideDeleteButton(e)
    }
  },

  /**
   * 处理touchstart事件
   */
  handleTouchStart(e) {
    this.startX = e.touches[0].pageX
  },

  /**
   * 处理touchend事件
   */
  handleTouchEnd(e) {
    console.log(e)
    if (e.changedTouches[0].pageX < this.startX && e.changedTouches[0].pageX - this.startX <= -30) {
      this.showDeleteButton(e)
    } else if (e.changedTouches[0].pageX > this.startX && e.changedTouches[0].pageX - this.startX < 30) {
      this.showDeleteButton(e)
    } else {
      this.hideDeleteButton(e)
    }
  },


  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'sgnl',
      path: '/pages/index/index',
      imageUrl: '/images/cover.png',
      success: function() {}
    }
  }
})
