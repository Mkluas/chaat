// pages/chat/chat.js
import { generateFingerGuessImageFile, generateBigEmojiImageFile, generateRichTextNode, generateImageNode, calcTimeHeader } from '../../utils/util.js'
import { deepClone, clickLogoJumpToCard } from '../../utils/util.js'
import * as iconBase64Map from '../../utils/imageBase64.js'
import {Barrage} from '../../utils/barrage.js'


//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    openid: app.globalData.tokenInfo.openid,
    hasTeamId: false,
    teamId: 0,
    syncFinish: false,
    scrollTop: 0,
    isBarrage: false,
    barrage: {},
    barrageData: [],
    msgList: [],
    stop: false,
    firstBarrage: true,

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
      this.setData({ isBarrage: false, doommData: [] })
      this.scrollToBottom();
      this.barrage.close();
    } else {
      this.setData({ isBarrage: true })
      if (this.data.firstBarrage) {
        this.setData({ firstBarrage: false})
        this.barrage.reload(this.data.messageArr)
      }
    }
  },

  send: function(e) {
    var text = e.detail.value;
    this.sendRequest(text)
    this.chatBlur();
  },

  chatInput: function() {
    this.setData({ focus: true, hidden: false, scrollTop: 10000})
  },

  scrollToBottom: function() {
    this.setData({ scrollTop: 10000 })
  },

  chatBlur: function(e) {
    if (this.data.focus) {
      this.setData({ focus: false, hidden: true, inputValue: '' })
    }
  },

  touchstart: function (e) {
    this.setData({ stop: true });
  },

  touchend: function() {
    this.setData({ stop: false });
  },

  handleNewMessage: function(msg) {
    this.barrage.pushBullet(msg);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this;
    self.barrage = new Barrage((bulletList) => {
      self.setData({ barrageData: bulletList})
    }, wx.createSelectorQuery())

    app.globalData.subscriber.on('SYNC_DONE', () => {
      self.setData({syncFinish: true, openid: app.globalData.tokenInfo.openid})
      // self.doLoad({ 'chatTo': '1380348919' })
      console.log('sync finish!');
      if (self.data.hasTeamId) {
        self.doLoad({ 'chatTo': self.data.teamId })
      }
    })
    app.globalData.subscriber.on('TEAM_ID', (tid) => {
      self.setData({ hasTeamId: true, teamId: tid, chatTo: tid })
      console.log('teamId', tid);
      if (self.data.syncFinish) {
        self.doLoad({ 'chatTo': tid })
      }
    })
    app.globalData.subscriber.on('TEAM_ID_NOT_FOUND',() => {
      wx.redirectTo({url: '/pages/index/index'})
    });
    if (app.globalData.isLogin && options.chatTo) {
      self.doLoad(options)
    }
  },

  /**
 * 生命周期函数--监听页面加载
 */
  doLoad: function (options) {
    console.log('聊天界面', options)
    // console.log(app.globalData.messageList[app.globalData['loginUser']['account']])
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
        let msgType = chatToMessageList[time].type
        if (msgType === 'text') {
          tempArr.push({
            type: 'text',
            text: chatToMessageList[time].text,
            showText: self.barrage.removeSpecial(chatToMessageList[time].text),
            from: chatToMessageList[time].from,
            time,
            sendOrReceive: chatToMessageList[time].sendOrReceive,
            displayTimeHeader: chatToMessageList[time].displayTimeHeader || '',
            nodes: generateRichTextNode(chatToMessageList[time].text)
          })
        } else if (msgType === 'image') {
          tempArr.push({
            type: 'image',
            text: chatToMessageList[time].text,
            time,
            sendOrReceive: chatToMessageList[time].sendOrReceive,
            displayTimeHeader:ifdsatToMessageList[time].displayTimeHeader || '',
            nodes: generateImageNode(chatToMessageList[time].file)
          })
        } else if (msgType === 'geo') {
          tempArr.push({
            type: 'geo',
            text: chatToMessageList[time].text,
            time,
            sendOrReceive: chatToMessageList[time].sendOrReceive,
            displayTimeHeader: chatToMessageList[time].displayTimeHeader || '',
            geo: chatToMessageList[time].geo
          })
        } else if (msgType === 'audio') {
          tempArr.push({
            type: 'audio',
            text: chatToMessageList[time].text,
            time,
            sendOrReceive: chatToMessageList[time].sendOrReceive,
            displayTimeHeader: chatToMessageList[time].displayTimeHeader || '',
            audio: chatToMessageList[time].file
          })
        } else if (msgType === 'video') {
          tempArr.push({
            type: 'video',
            text: chatToMessageList[time].text,
            time,
            sendOrReceive: chatToMessageList[time].sendOrReceive,
            displayTimeHeader: chatToMessageList[time].displayTimeHeader || '',
            video: chatToMessageList[time].file
          })
        } else if (msgType === '猜拳') {
          let value = JSON.parse(chatToMessageList[time]['content']).data.value
          tempArr.push({
            type: '猜拳',
            text: chatToMessageList[time].text,
            time,
            sendOrReceive: chatToMessageList[time].sendOrReceive,
            displayTimeHeader: chatToMessageList[time].displayTimeHeader || '',
            nodes: generateImageNode(generateFingerGuessImageFile(value))
          })
        } else if (msgType === '贴图表情') {
          let content = JSON.parse(chatToMessageList[time]['content'])
          tempArr.push({
            type: '贴图表情',
            text: chatToMessageList[time].text,
            time,
            sendOrReceive: chatToMessageList[time].sendOrReceive,
            displayTimeHeader: chatToMessageList[time].displayTimeHeader || '',
            nodes: generateImageNode(generateBigEmojiImageFile(content))
          })
        } else if (msgType === 'tip') {
          tempArr.push({
            type: 'tip',
            text: chatToMessageList[time].tip,
            time,
            sendOrReceive: chatToMessageList[time].sendOrReceive,
            displayTimeHeader: chatToMessageList[time].displayTimeHeader || '',
            nodes: [{
              type: 'text',
              text: chatToMessageList[time].tip
            }]
          })
        } else if (msgType === 'file' || msgType === 'robot') {
          let text = msgType === 'file' ? '文件消息' : '机器人消息'
          tempArr.push({
            type: msgType,
            text: chatToMessageList[time].text,
            time,
            sendOrReceive: chatToMessageList[time].sendOrReceive,
            displayTimeHeader: chatToMessageList[time].displayTimeHeader || '',
            nodes: [{
              type: 'text',
              text: `[${text}],请到手机或电脑客户端查看`
            }]
          })
        } else if (msgType === '白板消息' || msgType === '阅后即焚') {
          tempArr.push({
            type: msgType,
            text: chatToMessageList[time].text,
            time,
            sendOrReceive: chatToMessageList[time].sendOrReceive,
            displayTimeHeader: chatToMessageList[time].displayTimeHeader || '',
            nodes: [{
              type: 'text',
              text: `[${msgType}],请到手机或电脑客户端查看`
            }]
          })
        }
      }
    }
    this.setData({
      chatTo,
      messageArr: tempArr,
      chatWrapperMaxHeight,
      iconBase64Map: iconBase64Map
    })
    // 重新计算所有时间
    self.reCalcAllMessageTime()
    // 滚动到底部
    self.scrollToBottom()
  
    // 监听p2p消息
    app.globalData.subscriber.on('RECEIVE_P2P_MESSAGE', ({ account, time }) => {
      // console.log('receive p2p message', account, time);
      if (self.data.chatTo !== account) {// 非当前聊天人消息
        return
      }
      // console.log('handle p2p message', account, time);
      // 收起可能展开的聊天框
      // this.foldInputArea()
      let loginUserAccount = app.globalData['loginUser']['account']
      let newMessage = app.globalData.messageList[loginUserAccount][account][time]
      let lastMessage = self.data.messageArr[self.data.messageArr.length - 1]

      if (time == lastMessage.time && newMessage.text == lastMessage.text) {
        // console.log('same message');
        return;
      } else{
        // console.log('lastMsg', lastMessage);
        // console.log('new message', time);
      }

      let displayTimeHeader = ''
      // if (lastMessage) {//拥有上一条消息
      //   let delta = time - lastMessage.time
      //   if (delta > 2 * 60 * 1000) {//超过两分钟
      //     displayTimeHeader = calcTimeHeader(time)
      //   }
      // } else {//没有上一条消息
      //   displayTimeHeader = calcTimeHeader(time)
      // }
      // 刷新视图
      if (newMessage.type === 'text') {
        var insertNewMsg = {
          type: 'text',
          from: newMessage.from,
          text: newMessage.text,
          showText: self.barrage.removeSpecial(newMessage.text),
          time,
          sendOrReceive: newMessage.sendOrReceive,
          displayTimeHeader,
          nodes: generateRichTextNode(newMessage.text)
        }
        this.setData({
          messageArr: [...this.data.messageArr, insertNewMsg]
        })
        this.handleNewMessage(insertNewMsg);

      } else if (newMessage.type === 'image') {
        this.setData({
          messageArr: [...this.data.messageArr, {
            type: 'image',
            text: newMessage.text,
            time,
            sendOrReceive: newMessage.sendOrReceive,
            displayTimeHeader,
            nodes: generateImageNode(newMessage.file)
          }]
        })
      } else if (newMessage.type === 'geo') {
        this.setData({
          messageArr: [...this.data.messageArr, {
            type: 'geo',
            text: newMessage.text,
            time,
            sendOrReceive: newMessage.sendOrReceive,
            displayTimeHeader,
            geo: newMessage.geo
          }]
        })
      } else if (newMessage.type === 'audio') {
        // file: {dur,ext,md5,mp3Url,size,url}
        this.setData({
          messageArr: [...this.data.messageArr, {
            type: 'audio',
            text: newMessage.text,
            time,
            sendOrReceive: newMessage.sendOrReceive,
            displayTimeHeader,
            audio: newMessage.file
          }]
        })
      } else if (newMessage.type === 'video') {
        this.setData({
          messageArr: [...this.data.messageArr, {
            type: 'video',
            text: newMessage.text,
            time,
            sendOrReceive: newMessage.sendOrReceive,
            displayTimeHeader,
            video: newMessage.file
          }]
        })
      } else if (newMessage.type === '猜拳') {
        let value = JSON.parse(newMessage.content).data.value
        this.setData({
          messageArr: [...this.data.messageArr, {
            type: '猜拳',
            text: newMessage.text,
            time,
            sendOrReceive: newMessage.sendOrReceive,
            displayTimeHeader,
            nodes: generateImageNode(generateFingerGuessImageFile(value))
          }]
        })
      } else if (newMessage.type === '贴图表情') {
        let content = JSON.parse(newMessage.content)
        this.setData({
          messageArr: [...this.data.messageArr, {
            type: '贴图表情',
            text: newMessage.text,
            time,
            sendOrReceive: newMessage.sendOrReceive,
            displayTimeHeader,
            nodes: generateImageNode(generateBigEmojiImageFile(content))
          }]
        })
      } else if (newMessage.type === 'tip') {
        this.setData({
          messageArr: [...this.data.messageArr, {
            type: 'tip',
            text: newMessage.text,
            time,
            sendOrReceive: newMessage.sendOrReceive,
            displayTimeHeader,
            nodes: [{
              type: 'text',
              text: newMessage.tip
            }]
          }]
        })
      } else if (newMessage.type === 'file' || newMessage.type === 'robot') {
        let text = newMessage.type === 'file' ? '文件消息' : '机器人消息'
        this.setData({
          messageArr: [...this.data.messageArr, {
            type: newMessage.type,
            text: newMessage.text,
            time,
            sendOrReceive: newMessage.sendOrReceive,
            displayTimeHeader,
            nodes: [{
              type: 'text',
              text: `[${text}],请到手机或电脑客户端查看`
            }]
          }]
        })
      } else if (newMessage.type === '白板消息' || newMessage.type === '阅后即焚') {
        this.setData({
          messageArr: [...this.data.messageArr, {
            type: newMessage.type,
            text: newMessage.text,
            time,
            sendOrReceive: newMessage.sendOrReceive,
            displayTimeHeader,
            nodes: [{
              type: 'text',
              text: `[${newMessage.type}],请到手机或电脑客户端查看`
            }]
          }]
        })
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
    let self = this
    app.globalData.nim.sendText({
      scene: 'team',
      to: this.data.chatTo,
      text,
      done: (err, msg) => {
        // 判断错误类型，并做相应处理
        if (self.handleErrorAfterSend(err)) {
          return
        }
        // 刷新界面
        // let displayTimeHeader = self.judgeOverTwoMinute(msg.time)
        var newMsg = {
          text,
          type: 'text',
          showText: self.barrage.removeSpecial(text),
          time: msg.time,
          sendOrReceive: 'send',
          // displayTimeHeader,
          nodes: generateRichTextNode(text)
        }
        self.setData({
          inputValue: '',
          messageArr: [...self.data.messageArr, newMsg]
        })

        self.handleNewMessage(newMsg);

        // 存储到全局 并 存储到最近会话列表中
        self.saveMsgToGlobalAndRecent(msg, {
          from: msg.from,
          to: msg.to,
          type: msg.type,
          scene: msg.scene,
          text: msg.text,
          sendOrReceive: 'send'
          // ,
          // displayTimeHeader
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
   * 重新计算时间头
   */
  reCalcAllMessageTime() {
    let tempArr = [...this.data.messageArr]
    if (tempArr.length == 0) return
    // 计算时差
    tempArr.map((msg, index) => {
      if (index === 0) {
        msg['displayTimeHeader'] = calcTimeHeader(msg.time)
      } else {
        let delta = (msg.time - tempArr[index - 1].time) / (120 * 1000)
        if (delta > 1) { // 距离上一条，超过两分钟重新计算头部
          msg['displayTimeHeader'] = calcTimeHeader(msg.time)
        }
      }
    })
    this.setData({
      messageArr: tempArr
    })
  },

  handleErrorAfterSend(err) {
    if (err) {
      if (err.code == 7101) {
        wx.showToast({
          title: '你已被对方拉黑',
          icon: 'none',
          duration: 1500
        })
      }
      console.log(err)
      return true
    }
    return false
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

  }
})