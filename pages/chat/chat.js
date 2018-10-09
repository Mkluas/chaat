// pages/chat/chat.js
const request = require('../../utils/request.js')
import { generateFingerGuessImageFile, generateBigEmojiImageFile, generateRichTextNode, generateImageNode, calcTimeHeader } from '../../utils/util.js'
import { deepClone, clickLogoJumpToCard } from '../../utils/util.js'
import * as iconBase64Map from '../../utils/imageBase64.js'
import { Barrage } from '../../utils/barrage.js'
import { checkSendText } from '../../utils/lang.js'
import { handleMagic, removeMagicSuffix, recoverMagicStyle, recoverMagicDuration } from '../../utils/magic.js'


//获取应用实例
const app = getApp()

Page({
  data: {
    openid: app.globalData.tokenInfo.openid,
    hasTeamId: false,
    teamId: 0,
    groupId: 0,
    syncFinish: false,
    scrollTop: 0,
    isBarrage: false,
    barrage: {},
    barrageData: [],
    msgList: [],
    firstBarrage: true,
    load: false,
    modepath: '/images/mode.png',
    coverpath: '/images/cover.png',
    theme: 'SGNL',
    back: 'redirect',
    hasFormid: false,

    focus: false,
    hidden: true,
    chatTo: '', //聊天对象
    chatToLogo: '', // 聊天对象头像
    loginAccountLogo: '',  // 登录账户对象头像
    focusFlag: false,//控制输入框失去焦点与否
    emojiFlag: false,//emoji键盘标志位
    moreFlag: false, // 更多功能标志
    tipFlag: false, // tip消息标志
    tipInputValue: '', // tip消息文本框内容
    sendType: 0, //发送消息类型，0 文本 1 语音
    messageArr: [], //[{text, time, sendOrReceive: 'send', displayTimeHeader, nodes: []},{type: 'geo',geo: {lat,lng,title}}]
    inputValue: '',//文本框输入内容
  },

  changeMode() {
    if (this.data.isBarrage) {
      this.setData({ isBarrage: false, modepath: '/images/mode.png' })
      this.scrollToBottom();
      this.barrage.close();
    } else {
      this.setData({ isBarrage: true, modepath: '/images/barrage.png' })
      this.barrage.reload(this.data.messageArr)
    }
  },

  send: function (e) {
    var text = e.detail.value;
    if (checkSendText(text, this, app, this.data.teamId)) {
      this.sendRequest(text)
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
      this.setData({ focus: false, hidden: true, inputValue: '' })
    }
  },

  formSubmit: function (e) {
    this.chatInput();
    if (!this.data.hasFormid && e.detail.formId) {
      var self = this;
      request.post({
        app: app,
        url: '/ma/group/formid',
        data: { teamId:  self.data.teamId, formId: e.detail.formId },
        success: function() {self.setData({hasFormid: true})},
        fail: function () { }
      })
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('onload', options);
    
    wx.showShareMenu({ withShareTicket: true})
    var self = this;
    self.setData({ back: (options.back ? "navigateBack" : "redirect") });

    wx.getSystemInfo({
      success: function (res) {
        var width = res.windowWidth;
        self.barrage = new Barrage((bulletList) => {
          self.setData({ barrageData: bulletList })
        }, wx.createSelectorQuery(), width)
      },
      fail: function (res) {
        console.log(res);
      }
    })

    app.globalData.subscriber.on('SYNC_DONE', () => {
      self.setData({ syncFinish: true, openid: app.globalData.tokenInfo.openid })
      // self.doLoad({ 'chatTo': '1380348919' })
      console.log('sync finish!');
      console.log('hasTeamId', self.data.hasTeamId);
      if (self.data.hasTeamId) {
        self.doLoad({ 'chatTo': self.data.teamId });
      }
    })

    app.globalData.subscriber.on('TEAM_ID', (group) => {
      self.setData({ hasTeamId: true, teamId: group.teamId, chatTo: group.teamId, 
                      theme: group.theme, groupId: group.group_id })
      console.log('teamId', self.data.teamId);
      if (self.data.syncFinish) {
        self.doLoad({ 'chatTo': self.data.teamId });
      }
    })

    app.globalData.subscriber.on('TEAM_ID_NOT_FOUND', () => {
      if (!this.data.hasTeamId) {
        wx.redirectTo({ url: '/pages/index/index' });
      }
    });

    if (app.globalData.isLogin && options.chatTo) {
      app.getTeams(false, function(teams) {
        var array = teams.filter((g) => g.team_id == options.chatTo);
        if (array.length > 0) {
          var group = array[0];
          console.log(group)
          self.setData({
            hasTeamId: true, teamId: group.team_id, chatTo: group.team_id,
            theme: group.theme, groupId: group.group_id
          })
          self.doLoad({ 'chatTo': self.data.teamId });
        }
      });

    }

  },

  insertMsg: function (msg, time) {
    var insertNewMsg = {
      type: 'text',
      from: msg.from,
      text: msg.text,
      custom: msg.custom || {},
      style: recoverMagicStyle(msg.custom || {}),
      duration: recoverMagicDuration(msg.custom || {}),
      time,
      sendOrReceive: msg.sendOrReceive,
      nodes: generateRichTextNode(msg.text)
    }

    this.setData({
      messageArr: [...this.data.messageArr, insertNewMsg]
    })
    if (this.data.isBarrage) {
      this.barrage.pushBullet(insertNewMsg);
    }
  },

  /**
 * 生命周期函数--监听页面加载
 */
  doLoad: function (options) {
    if (this.data.load) { return; }
    this.setData({ load: true });
    console.log('聊天界面', options)
    let chatWrapperMaxHeight = wx.getSystemInfoSync().windowHeight - 52 - 35

    // 初始化聊天对象
    let self = this,
      tempArr = [],
      chatTo = options.chatTo
    // 更新当前会话对象账户
    app.globalData.currentChatTo = chatTo

    // 渲染应用期间历史消息
    let loginUserAccount = app.globalData['loginUser']['account']
    let loginMessageList = app.globalData.messageList[loginUserAccount]
    if (Object.keys(loginMessageList).length != 0) {
      let chatToMessageList = loginMessageList[chatTo]
      for (let time in chatToMessageList) {
        // console.log(chatToMessageList[time])
        let msgType = chatToMessageList[time].type
        if (msgType === 'text') {
          self.insertMsg(chatToMessageList[time], time)
        }
      }
    }
    this.setData({
      chatTo,
      chatWrapperMaxHeight,
      iconBase64Map: iconBase64Map
    })
    // 滚动到底部
    self.scrollToBottom()

    // 监听p2p消息
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

      let displayTimeHeader = ''
      if (newMessage.type === 'text') {
        this.insertMsg(newMessage, time);
      } else if (newMessage.type === 'custom') {
        console.log('custom', newMessage)
        app.getTeams(true, function (teams) {
          var array = teams.filter((value) => value.team_id == self.data.chatTo);
          if (array.length > 0) {
            var group = array[0];
            self.setData({theme: group.theme})
          }
        });
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
      chatToAccount[time]['displayTimeHeader'] = displayTimeHeader
      app.globalData.recentChatList[self.data.chatTo][time]['displayTimeHeader'] = displayTimeHeader

      // 滚动到页面底部
      self.scrollToBottom()
    })
  },

  sendRequest(text) {
    console.log('text', text);
    
    let self = this
    var custom = handleMagic(text);
    text = removeMagicSuffix(text);
    console.log(text, custom);
    // return;
    app.globalData.nim.sendText({
      scene: 'team',
      to: this.data.chatTo,
      custom: JSON.stringify(custom),
      text,
      done: (err, msg) => {
        if (err) {
          console.log(err)
          return
        }
        self.insertMsg(msg, msg.time);

        request.post({
          app: app,
          url: '/ma/group/notice',
          data: { teamId: self.data.teamId},
          fail: function () {}
        })

        // 存储到全局 并 存储到最近会话列表中
        self.saveMsgToGlobalAndRecent(msg, {
          from: msg.from,
          to: msg.to,
          type: msg.type,
          scene: msg.scene,
          text: msg.text,
          sendOrReceive: 'send'
        })

        // 最后一个参数表示，不更新未读数
        app.globalData.subscriber.emit('UPDATE_RECENT_CHAT', { account: msg.to, time: msg.time, text: msg.text, type: msg.type }, true)
        // 滚动到底部
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
      wx.showLoading({
        title: '加载中',
      });
    }
  },

  /**
  * 用户点击右上角分享
  */
  onShareAppMessage: function () {
    return {
      title: 'sgnl',
      path: '/pages/chat/chat?userId=' + app.globalData.tokenInfo.userId,
      imageUrl: this.data.coverpath,
      success: function () {
        console.log('info', app.globalData.tokenInfo)
      }
    }
  }
})