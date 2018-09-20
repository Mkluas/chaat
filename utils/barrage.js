class Queue {
  constructor() {
    this.list = [];
  }
  enqueue(data) {
    if (data) {
      this.list.push(data);
    }
  }
  dequeue() {
    return this.list.shift()
  }
  size() {
    return this.list.length;
  }
  isEmpty() {
    return this.list.length == 0;
  }
  clear() {
    this.list = []
  }
}

function randomColor() {
  let rgb = []
  for (let i = 0; i < 3; ++i) {
    let color = Math.floor(Math.random() * 256).toString(16)
    color = color.length == 1 ? '0' + color : color
    rgb.push(color)
  }
  return '#' + rgb.join('')
}

function endWith(text, suffix) {
  if (text.length <= suffix.length) {
    return false;
  } else {
    return suffix === text.substring(text.length - suffix.length)
  }
}

function removeEnd(text, suffix) {
  return text.substring(0, text.length - suffix.length)
}

function removeIfEndWith(text, suffix) {
  return endWith(text, suffix) ? removeEnd(text, suffix) : text;
}

function startWith(text, preffix) {
  if (text.length <= suffix.length) {
    return false;
  } else {
    return preffix === text.substring(0, suffix.length)
  }
}

function removeStart(text, preffix) {
  return text.substring(preffix.length);
}

function removeIfStartWith(text, preffix) {
  return startWith(text, preffix) ? removeStart(text, preffix) : text;
}


class Bullet {
	constructor(id, text, showText, top, duration, fontsize, color) {
		this.id = id;
		this.text = text;
    this.showText = showText,
    this.line = 0;
		this.top = top;
		this.duration = duration;
		this.fontsize = fontsize;
		this.color = color;
    this.show = true;
	}
}

class Barrage {

	constructor(dataChangeCb, query) {
    this.queue = new Queue()
		this.dataChangeCb = dataChangeCb
		this.bulletList = []
    this.lock = false;
    this.lines = [false, false, false, false, false]
		this.autoId = 0;
		this.query = query;
    this.clearRun = false;
    this.lastInvokeTime = 0;
	}

  close() {
    this.queue.clear();
    this.bulletList = [];
    this.lines = [false, false, false, false, false]
    this.notifyChange(1);
    clearInterval(this.interval);
    this.clearRun = false;
  }

  reload(messageArr) {
    this.initInterval();
    this.bulletList = []
    var i = (messageArr.length > 10) ? messageArr.length - 10 : 0
    for (; i < messageArr.length; i++) {
      this.pushBullet(messageArr[i]);
    }
  }

	initInterval() {
    if (this.clearRun) {
      return;
    }
    this.clearRun = true;
		var self = this;
		this.interval = setInterval(function () {
      if (self.bulletList.length > 0) {

        var msgViews = self.query.selectAll('.barrage .text').boundingClientRect()
        self.query.selectViewport().scrollOffset()
      
        self.query.exec(function (res) {
          var allClear = true;
          res[0].forEach(r => {
            if (r.left + r.width < 0) {
              var index = self.bulletList.findIndex(d => d.id == r.id);
              if (index < 0) return;
              var bullet = self.bulletList[index];
              if (!bullet.show) return;
              self.lines[bullet.line] = false;
              bullet.show = false;
              self.controlBulletDisplay(bullet.line, (new Date()).getTime());
            } else {
              allClear = false;
            }
          })
          
          if (allClear && self.bulletList.length > 0 && self.bulletList.filter(b => b.show).length == 0) {
            console.log('all Clear')
            self.close();
          }

          if (self.bulletList.length > 500) {
            self.bulletList = self.bulletList.filter(b => b.show);
            self.notifyChange(4);
          }

        })

      }
    }, 1000)
  }

	pushBullet(msg) {
    this.initInterval();
		var id = this.autoId++;
		var text = msg.text;
    var showText = msg.showText;
		var top = 0;
		var duration = 7 + Math.ceil(Math.random() * 10);
    if (this.queue.size() > 20) {
      duration = 3 + Math.ceil(Math.random() * 5);
    }
    if (this.queue.size() > 50) {
      duration = 2 + Math.ceil(Math.random() * 3);
    }
		var fontsize = 3 + Math.ceil(Math.random() * 4);
    var bullet = new Bullet(id, text, showText, top, duration, fontsize, randomColor());
    bullet = this.handleSpecial(bullet);
    this.queue.enqueue(bullet);
    this.controlBulletDisplay();
	}

  handleSpecial(bullet) {
    var text = bullet.text;
    if (endWith(text, '！')) {
      bullet.fontsize = 10;
    }
    return bullet;
  }

  removeSpecial(text) {
    text = removeIfEndWith(text, '！')
    return text;
  }

  controlBulletDisplay() {
    if (this.queue.isEmpty() || this.lock) {
      return;
    }
    this.lock = true;

    var change = false;
    for (let i = 0; i < this.lines.length && !this.queue.isEmpty(); i++) {
      if (!this.lines[i]) {
        change = true;
        this.lines[i] = true;
        var bullet = this.queue.dequeue();
        bullet.line = i;
        bullet.top = i * 18 + 5;
        console.log('push ', i)
        this.bulletList.push(bullet);
      }
    }

    if (change) {
      this.notifyChange(6);
    }
    this.lock=false;
  }

	notifyChange(from) {
    console.log('change', from)
		this.dataChangeCb(this.bulletList);
	}
}

module.exports = {
	Barrage
}


