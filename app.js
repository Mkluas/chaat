//app.js
var util = require('./utils/util.js')
var config = require('./utils/config.js')
var subscriber = require('./utils/event.js')
const request = require('./utils/request.js')
import IMEventHandler from './utils/imeventhandler.js'

App({
  
  onLaunch: function () {
    var app = this;
    app.globalData.shareTicket = wx.getStorageSync('shareTicket');
    app.globalData.tokenInfo = wx.getStorageSync('tokenInfo');
    app.globalData.group = wx.getStorageSync('group');
  },

  onShow(options) {
    var app = this;
    app.globalData.options = options;

    if (!app.globalData.login) {
      wx.checkSession({
        success: function () {
          if (app.globalData.tokenInfo) {
            request.get({
              app: app,
              url: "/ma/user/token/check",
              success: function () {
                app.initEnvAfterEnsureLogin();
              }
            });
          } else {
            app.doLogin(app.connectNIM);
          }
        },
        fail: function () {
          app.doLogin(app.connectNIM);
        }
      })
    } else {
      app.initEnvAfterEnsureLogin();
    }
  },

  doLogin: function(cb) {
    var app = this;
    wx.login({
      success: res => {
        request.post({
          app: app,
          url: "/ma/user/login",
          loadingText: "正在登录",
          data: { "code": res.code },
          success: function (data) {
            app.globalData.tokenInfo = data;
            wx.setStorage({key: 'tokenInfo',data: data})
            app.initEnvAfterEnsureLogin();
            cb && cb(app.globalData.tokenInfo.token);
          }
        })
      }
    })
  },

  initEnvAfterEnsureLogin() {
    var app = this;
    app.globalData.login = true;
    app.globalData.subscriber.emit('APP_LOGIN')
    app.fetchTeamId(app.globalData.options);
    if (app.globalData.isLogin) {
      console.log('already login, send sync_done')
      app.globalData.subscriber.emit('SYNC_DONE', {})
    } else {
      console.log('already login app, do login NIM')
      app.connectNIM();
    }
    app.getTeams(true);
  },

  connectNIM: function (cb) {
    var app = this;
    console.log("connect nim", app.globalData.tokenInfo)
    new IMEventHandler(app, {
      token: app.globalData.tokenInfo.nimToken,
      account: app.globalData.tokenInfo.openid
    })
  },

  fetchTeamId(options) {
    var app = this;
    if (options['shareTicket']) {
      wx.getShareInfo({
        shareTicket: options['shareTicket'],
        success: function (res) {
          res['userId'] = options.query['userId'];
          res['theme'] = options.theme;
          request.post({
            app: app,
            url: "/ma/group/decrypt",
            data: res,
            success: function (d) {
              app.globalData.group = d.group;
              app.globalData.subscriber.emit('TEAM_ID', app.globalData.group)
            }
          })
        }
      })
    } else {
      console.log('shareTicket is null')
      app.globalData.subscriber.emit('TEAM_ID_NOT_FOUND')
    }
  },

  getTeams: function(refresh, cb) {
    var app = this;
    if (refresh || app.globalData.teams.length < 1) {
      request.get({
        app: app,
        url: '/ma/group/list',
        success: function (d) {
          app.globalData.teams = d.teams
          cb && cb(d.teams);
        }
      })
    } else {
      console.log(app.globalData.teams)
      cb && cb(app.globalData.teams);
    }
  },

  onHide() {
    
  },

  onError(err) {
    console.log('小程序出错了', err)
  },
  globalData:{
    login: false,
    tokenInfo: {},
    teams: [],
    options: {},

    isLogin: false, // 当前是否是登录状态
    currentChatTo: '', // 记录当前聊天对象account，用于标记聊天时禁止更新最近会话unread
    loginUser: {},//当前登录用户信息
    friends: [],//好友列表，
    friendsWithCard: {}, // 带有名片信息的好友列表（转发时使用）
    friendsCard: {},//带有名片信息的好友列表
    onlineList: {},//在线人员名单 account: status
    blackList: {},//黑名单列表
    config,//存储appkey信息
    nim: {},//nim连接实例
    subscriber, //消息订阅器
    notificationList: [], // 通知列表
    recentChatList: {},//最近会话列表
    rawMessageList: {}, //原生的所有消息列表(包含的字段特别多)
    messageList: {}//处理过的所有的消息列表
  }
})
/** Demo数据
 * onlineList: {hzfangtiankui: "Android[Wifi]在线", kuguaying: "iOS[Wifi]在线"}
 * loginUser: {account:'', nick:'',avatar:'',birth:'',email:'',gender:'',sign:'',tel:'',createTime:'',updateTime:''}
 * friends: [{account:'',createTime:'',updateTime:'',valid:true}]
 * friendsWithCard: {account: {account:'', nick:'',avatar:'',birth:'',email:'',gender:'',sign:'',tel:'',createTime:'',updateTime:''}} 字段可能不全，需要检测
 * friendsCard: {account: {account:'', nick:'',avatar:'',birth:'',email:'',gender:'',sign:'',tel:'',createTime:'',updateTime:''}} 字段可能不全，需要检测
 * blacklist: {account: {account:'',createTime:'',updateTime:''}} account做key方便查找
 * rawMessageList:{
 *  account: {time1:{},time2:{}}
 * }
 * messageList: {
 *   loginUser: {
 *      account: {time1:{from,to,type,scene,text,sendOrReceive,displayTimeHeader}, time2:{from,to,type,scene,text,sendOrReceive,displayTimeHeader}}
 *   }
 * }
 * recentChatList: {
 *  to: {time1:{from,to,type,scene,text,sendOrReceive,displayTimeHeader}, time2:{from,to,type,scene,text,sendOrReceive,displayTimeHeader}}
 * }
 * notificationList: [{category,from,time,to,type}]
 */