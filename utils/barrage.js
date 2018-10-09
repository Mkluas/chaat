class Queue {
  constructor() {
    this.list = [];
  }
  putHead(data) {
    splice(0,0,data)
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

class Bullet {
  constructor(id, text, top, duration, style) {
    this.id = id;
    this.text = text;
    this.line = 0;
    this.top = top;
    this.duration = duration;
    this.style = style;
    this.show = true;
    this.toggle = false;
  }
}

class Barrage {

  constructor(dataChangeCb, query, width) {
    this.queue = new Queue()
    this.newq = new Queue()
    this.dataChangeCb = dataChangeCb
    this.bulletList = []
    this.lock = false;
    this.lines = [false, false, false, false, false]
    this.autoId = 0;
    this.query = query;
    this.clearRun = false;
    this.screenWidth = width;
    this.load = false;
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
    this.load = false;
    this.bulletList = []
    var i = (messageArr.length > 50) ? messageArr.length - 50 : 0
    for (; i < messageArr.length; i++) {
      this.pushBullet(messageArr[i]);
    }
    this.load = true;
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
            if (r.left + r.width < (self.screenWidth / 2)) {

              var index = self.bulletList.findIndex(d => d.id == r.id);
              if (index < 0) return;
              var bullet = self.bulletList[index];
              if (!bullet.show) return;

              if (!bullet.toggle) {
                bullet.toggle = true;
                self.lines[bullet.line] = false;
              }
              if (r.left + r.width < 0) {
                bullet.show = false;
              }
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
    var top = 0;
    var bullet = new Bullet(id, msg.text, top, msg.duration, msg.style);
    console.log(bullet)

    if (this.load) {
      this.newq.enqueue(bullet);
    } else {
      this.queue.enqueue(bullet);
    }
    
    this.controlBulletDisplay();
  }

  controlBulletDisplay() {
    if ((this.queue.isEmpty() && this.newq.isEmpty()) || this.lock) {
      return;
    }
    this.lock = true;

    var change = false;
    for (let i = 0; i < this.lines.length && !(this.queue.isEmpty() && this.newq.isEmpty()); i++) {
      if (!this.lines[i]) {
        change = true;
        this.lines[i] = true;
        var bullet;
        if (this.newq.isEmpty()) {
          bullet = this.queue.dequeue();
          bullet.style = bullet.style + "opacity:0.8";
          // bullet.duration += Math.random();
        } else {
          bullet = this.newq.dequeue();
        }
        bullet.line = i;
        bullet.top = i * 18 + 5;
        console.log('push ', i)
        this.bulletList.push(bullet);
      }
    }

    if (change) {
      this.notifyChange(6);
    }
    this.lock = false;
  }

  notifyChange(from) {
    console.log('change', from)
    this.dataChangeCb(this.bulletList);
  }
}

module.exports = {
  Barrage
}


