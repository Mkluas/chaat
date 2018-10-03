// pages/create/create.js
const request = require('../../utils/request.js')
import { requestCover, removeThemePrefix } from '../../utils/lang.js'

//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    focus: false,
    hidden: true,
    inputValue: '$话题$开始爆料本群的秘密',
    theme: "SGNL",
    cover: "/images/theme.png"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showShareMenu({
      withShareTicket: true,
      success: function (res) {
        console.log('share', res)
      }
    })
  },

  send: function (e) {
    var text = e.detail.value;
    var theme = removeThemePrefix(text)
    if (theme.length > 10) {
      wx.showToast({
        title: '话题大于10字',
        image: '/images/cancel.png'
      })
      return;
    }
    this.setData({ theme: theme});
    var self = this;
    wx.showLoading({ title: '创建话题' });
    requestCover(theme, function(path){
      self.setData({cover: path})
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
  * 用户点击右上角分享
  */
  onShareAppMessage: function () {
    return {
      title: 'sgnl',
      path: '/pages/chat/chat?userId=' + app.globalData.tokenInfo.userId + '&theme=' + this.data.theme,
      imageUrl: this.data.cover,
      success: function () {
      }
    }
  }
})