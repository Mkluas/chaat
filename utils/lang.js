const request = require('./request.js')

function requestCover(text, cb, mute = false) {
    wx.getImageInfo({
      src: encodeURI("https://molibao.cc/api/cover?text=" + text),
      success: function (res) {
        wx.hideLoading();
        console.log("Request cover success:", text)
        cb(res.path);
        if (!mute) {
          wx.showModal({
            title: "提示",
            content: "话题更新成功",
            showCancel: false,
            confirmText: "确定"
          })
        }
      },
      fail: function (err) {
        wx.hideLoading();
        wx.showToast({
            title: '网络异常',
            image: '/images/cancel.png'
        })
      }
    })
}

function checkSendText(text, page, app, teamId) {
    if (text.length > 30) {
      wx.showToast({
        title: '长度不能大于30',
        image: '/images/cancel.png'
      })
      return false;
    }

    if (startWith(text, '$话题$')) {
      var covertext = removeStart(text, '$话题$')
      if (covertext.length > 0) {
        wx.showLoading({title: '更新话题'});
        requestCover(covertext, function(path) {
          page.setData({coverpath: path, theme: covertext});

          request.post({
            app: app,
            url: "/ma/group/theme",
            data: {teamId: teamId, theme: covertext},
            success: function() {
              app.globalData.teams
              .filter((g) => g.team_id == teamId)
              .forEach(g => g.theme = covertext)
              console.log(app.globalData.teams);
            }
          })
          
          updateTheme(app, page.data.chatTo, covertext);
        });
        return false;
      }
    } 
    return true;
}

function updateTheme(app, chatTo, theme) {
    app.globalData.nim.sendCustomMsg({
      scene: 'team',
      to: chatTo,
      content: JSON.stringify({"theme": theme}),
      done: function (err, msg) {
        if (err) {
            console.log('updateTheme err: ', err);
            return;
        } else {
            console.log('updateTheme success')
        }
      }
    })
}

function updateThemeCoverPath(app, page) {
  var chatTo = page.data.chatTo;
  var self = page;
  app.getTeams(false, function (teams) {
    var array = teams.filter((g) => g.team_id == chatTo);
    if (array.length > 0) {
      self.setData({ theme: array[0].theme })
      if (array[0].theme === self.data.theme || array[0].theme.length < 1) { return; }
      requestCover(array[0].theme, function (path) {
        self.setData({ coverpath: path });
      }, true);
    }
  });
}

function startWith(text, prffix) {
  if (text.length < prffix.length) {
    return false;
  } else {
    return prffix === text.substring(0, prffix.length)
  }
}

function removeStart(text, prffix) {
  return text.substring(prffix.length)
}

function removeThemePrefix(text) {
    if (startWith(text, "$话题$")) {
        return removeStart(text, "$话题$")
    }
    return text;
}

module.exports = {
    requestCover,
    updateThemeCoverPath,
    checkSendText,
    removeThemePrefix
}