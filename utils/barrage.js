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


class Bullet {
	constructor(id, text, top, duration, fontsize, color) {
		this.id = id;
		this.text = text;
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
	}

  close() {
    this.queue.clear();
    this.bulletList = [];
    this.notifyChange();
    clearInterval(this.interval);
  }

	initInterval() {
		var self = this;
		this.interval = setInterval(function () {
      if (self.bulletList.length > 0) {

        var msgViews = self.query.selectAll('.barrage .text').boundingClientRect()
        self.query.selectViewport().scrollOffset()
      
        self.query.exec(function (res) {
          var allClear = true;
          res[0].forEach(r => {
            allClear = false;
            if (r.left + r.width < 0 && r.left != 200) {
              var index = self.bulletList.findIndex(d => d.id == r.id);
              if (index < 0) return;
              var bullet = self.bulletList[index];
              self.lines[bullet.line] = false;
              bullet.show = false;
              self.notifyChange();
              self.controlBulletDisplay(bullet.line);
            }
          })
          
          if (allClear) {
            console.log('all Clear', allClear)
            self.bulletList = [];
            self.notifyChange();
          }

          if (self.bulletList.length > 200) {
            self.bulletList = self.bulletList.filter(b => b.show);
            self.notifyChange();
          }

        })

      }
    }, 500)
  }

	randomTop() {
	  var top;
	  var valid;
	  do {
	    valid = true;
	    top = Math.ceil(Math.random() * 80)
	    for (let i = 0; i < this.bulletList.length; i++) {
	      if (Math.abs(this.bulletList[i].top - top) < 4.5) {
	        valid = false;
	        break;
	      }
	    }
	  } while(!valid);
	  return top;
	}

	reload(messageArr) {
    this.initInterval();
		this.bulletList = []
		var i = (messageArr.length > 10) ? messageArr.length - 10 : 0
		for (; i < messageArr.length; i++) {
		    this.pushBullet(messageArr[i]);
		}
    // this.controlBulletDisplay();
	}

	pushBullet(msg) {
		var id = this.autoId++;
		var text = msg.text + id;
		var top = this.randomTop();
		var color = randomColor();
		var duration = 7 + Math.ceil(Math.random() * 10);
    if (this.queue.size() > 20) {
      duration = 3 + Math.ceil(Math.random() * 5);
    }
    if (this.queue.size() > 50) {
      duration = 2 + Math.ceil(Math.random() * 3);
    }
		var fontsize = 3.5 + Math.ceil(Math.random() * 5);
		var bullet = new Bullet(id, text, top, duration, fontsize, color);
    this.queue.enqueue(bullet);
    this.controlBulletDisplay();
	}

  controlBulletDisplay(index) {
    if (this.queue.isEmpty() || this.lock) {
      return;
    }
    this.lock = true;

    if (index) {
      this.lines[index] = true;
      var bullet = this.queue.dequeue();
      bullet.line = index;
      bullet.top = index * 20;
      console.log('push index ', index)
      this.bulletList.push(bullet);
      this.notifyChange();
      this.lock = false;
      return;
    }

    for (let i = 0; i < this.lines.length && !this.queue.isEmpty(); i++) {
      if (!this.lines[i]) {
        // console.log(i, ' is empty')
        this.lines[i] = true;
        var bullet = this.queue.dequeue();
        bullet.line = i;
        bullet.top = i * 20;
        console.log('push ', i)
        this.bulletList.push(bullet);
        this.notifyChange();
      }
    }
    this.lock=false;
  }

	notifyChange() {
		this.dataChangeCb(this.bulletList);
	}
}

module.exports = {
	Barrage
}


