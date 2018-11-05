// pages/chat/chat.js
const request = require('../../utils/request.js')
import { generateRichTextNode, deepClone } from '../../utils/util.js'
import * as iconBase64Map from '../../utils/imageBase64.js'
import { checkSendText, requestCover, updateThemeCoverPath } from '../../utils/lang.js'
import { handleMagic, removeMagicSuffix, recoverFontSize, recoverMagicStyle, recoverMagicDuration } from '../../utils/magic.js'
import { resetPosition, setupMsgPosition, setOffsetPageNumber} from '../../utils/position.js'


//获取应用实例
const app = getApp()

Page({
  data: {
    openid: app.globalData.tokenInfo.openid,
    hasTeamId: false,
    teamId: 0,
    syncFinish: false,
    scrollTop: 0,
    msgList: [],
    load: false,
    coverpath: '/images/cover.png',
    theme: 'SGNL',
    back: 'redirect',
    hasFormid: false,
    windowRatio: 1,

    focus: false,
    hidden: true,
    chatTo: '', //聊天对象
    sendType: 0, //发送消息类型，0 文本 1 语音
    messageArr: [], //[{text, time, sendOrReceive: 'send', displayTimeHeader, nodes: []},{type: 'geo',geo: {lat,lng,title}}]
    inputValue: '',//文本框输入内容
  },

  send: function (e) {
    var text = e.detail.value;
    if (checkSendText(text, this, app, this.data.teamId)) {
      this.sendRequest(text)
      this.setData({inputValue: '' })
    }
    this.chatBlur();
  },

  chatInput: function () {
    this.setData({ focus: true, hidden: false, scrollTop: 10000 })
  },

  scrollToBottom: function () {
    this.setData({ scrollTop: 10000 })
  },

  chatBlur: function (e) {
    if (this.data.focus) {
      this.setData({ focus: false, hidden: true})
    }
  },

  formSubmit: function (e) {
    this.chatInput();
    if (!this.data.hasFormid && e.detail.formId) {
      var self = this;
      request.post({
        app: app,
        url: '/ma/group/formid',
        data: {teamId: self.data.teamId, formId: e.detail.formId },
        success: function() {self.setData({hasFormid: true})},
        fail: function () { }
      })
    }
  },

  init: function (options) {
    var self = this;
    self.setData({ back: (options.back ? "navigateBack" : "redirect") });
    wx.showShareMenu({ withShareTicket: true })
    wx.getSystemInfo({
      success: function (res) {
        var windowRatio = res.windowHeight / res.windowWidth;
        self.setData({windowRatio: windowRatio })
      }
    })
    resetPosition();
    wx.loadFontFace({
      family: 'fangzheng',
      source: 'url("https://molibao.cc/static/font/fangzheng.ttf")',
      success: console.log,
      fail: console.log
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('onload', options);
    this.init(options);
    
    var self = this;
    if (options.chatTo) {
      self.handleFoundChatTo(options.chatTo);
    } else if (!app.globalData.hasShareTicket) {
      console.log('has share ticket = ', app.globalData.hasShareTicket)
      self.handleNotFoundChatTo();
    } else {
      app.globalData.subscriber.on('TEAM_ID', (group) => {
        self.handleFoundChatTo(group.teamId);
      });
      app.globalData.subscriber.on('TEAM_ID_NOT_FOUND', () => {
        console.log('receive team id not found')
        self.handleNotFoundChatTo();
      });
    }

    if (app.globalData.isLogin) {
      self.handleSyncDone();
    } else {
      app.globalData.subscriber.on('SYNC_DONE', ()=> {self.handleSyncDone();})
    }
  },

  handleFoundChatTo: function(chatTo) {
    console.log('handleFoundChatTo');
    var self = this;
    self.setData({ hasTeamId: true, teamId: chatTo, chatTo: chatTo });
    if (self.data.syncFinish) {
      updateThemeCoverPath(app, self)
      self.doLoad({ 'chatTo': chatTo });
    }
  },

  handleSyncDone: function() {
    console.log('handleSyncDone');
    var self = this;
    self.setData({ syncFinish: true, openid: app.globalData.tokenInfo.openid })
    if (self.data.hasTeamId) {
      updateThemeCoverPath(app, self)
      self.doLoad({'chatTo': self.data.chatTo})
    }
  },

  handleNotFoundChatTo: function () {
    console.log('handleNotFoundChatTo')
    if (!this.data.hasTeamId) {
      wx.redirectTo({ url: '/pages/index/index' });
    }
  },

  insertMsg: function (msg, time, init) {
    var insertNewMsg = {
      type: 'text',
      from: msg.from,
      text: msg.text,
      fontSize: recoverFontSize(msg.custom || {}),
      custom: msg.custom || {},
      style: recoverMagicStyle(msg.custom || {}),
      duration: recoverMagicDuration(msg.custom || {}),
      time,
      sendOrReceive: msg.sendOrReceive,
      nodes: generateRichTextNode(msg.text)
    }
    if (init == undefined) {
      setupMsgPosition(this, insertNewMsg);
    }
    this.setData({messageArr: [...this.data.messageArr, insertNewMsg]})
  },

  pasteWall: function() {
    if (this.data.messageArr.length > 0) {
      var loadSize = 100;
      var i = (this.data.messageArr.length > loadSize) ? this.data.messageArr.length - loadSize : 0
      setOffsetPageNumber(this.data.messageArr[i]);
      for (; i < this.data.messageArr.length; i++) {
        setupMsgPosition(this, this.data.messageArr[i]);
      }
    }
  },

  /**
 * 生命周期函数--监听页面加载
 */
  doLoad: function (options) {
    if (this.data.load) { return; }
    this.setData({ load: true });
    wx.hideLoading();
    console.log('聊天界面', options)

    // 初始化聊天对象
    let self = this,tempArr = [],chatTo = options.chatTo
    app.globalData.currentChatTo = chatTo

    // 渲染应用期间历史消息
    let loginUserAccount = app.globalData['loginUser']['account']
    let loginMessageList = app.globalData.messageList[loginUserAccount]

    if (Object.keys(loginMessageList).length != 0) {
      let chatToMessageList = loginMessageList[chatTo]
      for (let time in chatToMessageList) {
        let msg = chatToMessageList[time];
        if (msg.type === 'text') {
          self.insertMsg(msg, time, true)
        }
      }
    }

    this.pasteWall();
    this.setData({iconBase64Map: iconBase64Map})
    self.scrollToBottom()

    self.subscribeNewMsgEvent();
  },

  // 监听p2p消息
  subscribeNewMsgEvent() {
    var self = this;
    app.globalData.subscriber.on('RECEIVE_P2P_MESSAGE', ({ account, time }) => {
      if (self.data.chatTo !== account) {// 非当前聊天人消息
        return
      }
      let loginUserAccount = app.globalData['loginUser']['account']
      let newMessage = app.globalData.messageList[loginUserAccount][account][time]
      let lastMessage = self.data.messageArr[self.data.messageArr.length - 1]

      if (lastMessage && time == lastMessage.time && newMessage.text == lastMessage.text) {
        return;
      }

      if (newMessage.type === 'text') {
        self.insertMsg(newMessage, time);
      } else if (newMessage.type === 'custom') {
        updateThemeCoverPath(app, self);
      }

      // 添加全局数据中 消息时间头，同时存储到最近会话列表中
      let loginMessageList = app.globalData.messageList[loginUserAccount]
      let recentChatList = app.globalData.recentChatList
      let chatToAccount = null
      if (!loginMessageList[self.data.chatTo]) {
        loginMessageList[self.data.chatTo] = {} //开始未收到任何消息
        recentChatList[self.data.chatTo] = {} //存储到最近会话列表中
      }
      chatToAccount = loginMessageList[self.data.chatTo]
      self.scrollToBottom()
    })
  },

  sendRequest(text) {
    let self = this
    var custom = handleMagic(text);
    var customJson = JSON.stringify(custom);
    text = removeMagicSuffix(text);
    app.globalData.nim.sendText({
      scene: 'team',
      to: this.data.chatTo,
      custom: customJson,
      text,
      done: (err, msg) => {
        if (err) {
          console.log(err)
          return
        }
        self.insertMsg(msg, msg.time);

        // 存储到全局 并 存储到最近会话列表中
        self.saveMsgToGlobalAndRecent(msg, {
          from: msg.from,
          to: msg.to,
          type: msg.type,
          scene: msg.scene,
          text: msg.text,
          custom: customJson,
          sendOrReceive: 'send'
        })

        // 最后一个参数表示，不更新未读数
        app.globalData.subscriber.emit('UPDATE_RECENT_CHAT', { account: msg.to, time: msg.time, text: msg.text, type: msg.type }, true)
        self.scrollToBottom()
      }
    })
  },

  saveMsgToGlobalAndRecent(msg, data) {
    let self = this
    // 存储到全局 并 存储到最近会话列表中
    let loginUserAccount = app.globalData['loginUser']['account']
    let loginMessageList = app.globalData.messageList[loginUserAccount]
    if (!loginMessageList[self.data.chatTo]) {
      loginMessageList[self.data.chatTo] = {} //开始未收到任何消息
      app.globalData.recentChatList[self.data.chatTo] = {}
    }
    loginMessageList[self.data.chatTo][msg.time] = data
    app.globalData.recentChatList[self.data.chatTo][msg.time] = data
    app.globalData.rawMessageList[self.data.chatTo] = app.globalData.rawMessageList[self.data.chatTo] || {}
    app.globalData.rawMessageList[self.data.chatTo][msg.time] = deepClone(msg)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (!this.data.load) {
      wx.showLoading({title: '加载中'});
    }
    if (app.globalData.login && this.data.hasTeamId) {
      updateThemeCoverPath(app, this);
    }
  },

  /**
  * 用户点击右上角分享
  */
  onShareAppMessage: function () {
    return {
      title: 'sgnl',
      path: '/pages/chat/chat?userId=' + app.globalData.tokenInfo.userId,
      imageUrl: this.data.coverpath
    }
  }
})