var rects = [];
var pageNumber = 0;
var offsetPageNumber = 0;
var locations = {}
var pageHeight = 100;

function resetPosition() {
  pageNumber = 0;
}

function setOffsetPageNumber(msg) {
  var location = getCacheLocation(msg);
  if (location) {
    offsetPageNumber = location.pageNumber;
  }
}

function setupMsgPosition(page, msg) {
  msg.height = msg.fontSize + 2;
  msg.width = msg.fontSize * msg.text.length * page.data.windowRatio + 2;
  if (msg.width > 90) {
    msg.height = ((msg.width - 0.1) / 90) * msg.height;
  }


  var location = getCacheLocation(msg);
  if (location) {
    msg.x = msg.left = location.left;
    msg.y = msg.top = location.top - (offsetPageNumber * pageHeight);
    msg.pageNumber = location.pageNumber - offsetPageNumber;
    if (pageNumber < msg.pageNumber) {
      pageNumber = msg.pageNumber;
      page.setData({ msgListHeight: pageNumber * 100 + 100 })
    }
  } else {

    var top;
    var times = 0;
    var offset = pageNumber * pageHeight;

    do {
      if (times++ > 100) {
        msg.x = msg.left = 0;
        msg.y = msg.top = 0;
        times = 0;
        pageNumber = pageNumber + 1;
        offset = pageNumber * pageHeight;
        page.setData({msgListHeight: offset + 100})
      }
      msg.y = msg.top = random(0 + offset, pageHeight + offset - msg.height);
      msg.x = msg.left = random(0, 90 - msg.width);
      msg.pageNumber = pageNumber;
    } while (!hasPosition(page.data.msgList, msg))
  }

  saveLocation(msg);
  page.setData({msgList: [...page.data.msgList, msg]})
  return true;
}

function hasPosition(list, msg) {
  for(var i=0; i<list.length; i++) {
    if (isOverlap(list[i], msg)) {
      return false;
    }
  }
  return true;
}

function saveLocation(msg) {
  var location = {"pageNumber": msg.pageNumber, "top": msg.top, "left": msg.left}
  locations[getKey(msg)] = location;
}

function getKey(msg) {
  return msg.form + msg.time + (msg.text > 10 ? msg.text.substring(0,10) : msg.text)
}

function getCacheLocation(msg) {
  var location = locations[getKey(msg)];
  return location;
}


function isOverlap(r1, r2) {
  return r1.x + r1.width > r2.x && r2.x + r2.width > r1.x && r1.y + r1.height > r2.y && r2.y + r2.height > r1.y;
}

function random(min, max) {
  if (max < min) {
    return -1;
  }
  if (max === min) {
    return max;
  }
  return Math.random() * (max - min) + min;
}

module.exports = {
  resetPosition,
  setOffsetPageNumber,
  setupMsgPosition 
}