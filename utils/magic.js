var speed_suffix_array = [
	{key: '$加速', value: '1'},
	{key: '$加加速', value: '2'},
	{key: '$加加加速', value: '3'},
	{key: '$加加加加速', value: '4'},
	{key: '$加加加加加速', value: '5'},
	{key: '$加加加加加加速', value: '6'},
	{key: '$减速', value: '-1'},
	{key: '$减减速', value: '-2'},
	{key: '$减减减速', value: '-3'},
	{key: '$减减减减速', value: '-4'},
	{key: '$减减减减减速', value: '-5'},
	{key: '$减减减减减减速', value: '-6'},
]
var size_suffix_array = [
	{key: '$加大', value: '1'},
	{key: '$加加大', value: '2'},
	{key: '$加加加大', value: '3'},
	{key: '$加加加加大', value: '4'},
	{key: '$加加加加加大', value: '5'},
	{key: '$加加加加加加大', value: '6'},
	{key: '$减小', value: '-1'},
	{key: '$减减小', value: '-2'},
	{key: '$减减减小', value: '-3'},
	{key: '$减减减减小', value: '-4'},
	{key: '$减减减减减小', value: '-5'},
	{key: '$减减减减减减小', value: '-6'},
]
var color_suffix_array = [
	{key: '$黄色', value: 'yellow'},
	{key: '$红色', value: 'red'},
	{key: '$绿色', value: 'green'}
]


function extrcCustomInfo(text, array, custom, label) {
	for (var i=0; i < array.length; i++) {
		var suffix = array[i];
		if (endWith(text, suffix.key)) {
			custom[label] = suffix.value;
			return;
		}
	}
}


function handleMagic(text) {
	var custom = {};
	if (text.indexOf('$') > 0) {
		extrcCustomInfo(text, speed_suffix_array, custom, 'speed')
		extrcCustomInfo(text, color_suffix_array, custom, 'color')
		extrcCustomInfo(text, size_suffix_array, custom, 'size')
	}
	if (!custom.color) {
		custom.color = randomColor();
	}
	return custom;
}

function removeMagicSuffix(text) {
	if (text.indexOf('$') > 0) {
		var arrays = [speed_suffix_array, size_suffix_array, color_suffix_array];
		for (var a=0; a < arrays.length; a++) {
			var array = arrays[a];
			for (var i=0; i < array.length; i++) {
				var suffix = array[i];
				if (endWith(text, suffix.key)) {
					return removeEnd(text, suffix.key);
				}
			}
		}
	}
	return text;
}

function recoverMagicStyle(custom) {
	if (typeof custom=='string') {
		if (custom.indexOf('{') < 0) {
			custom = {}
		} else {
			custom = JSON.parse(custom)
		}
	}
	
	var size = custom.size || 0;
	var color = custom.color || '#6036AA';

	var fontsize = 4 + (size * 0.5);
	return "color:"+color+";font-size:" + fontsize + "vh;" + "line-height:" + fontsize + "vh;" + "height:" + fontsize + "vh;"; 
}

function recoverMagicDuration(custom) {
	if (typeof custom=='string') {
		if (custom.indexOf('{') < 0) {
			custom = {}
		} else {
			custom = JSON.parse(custom)
		}
	}

	var speed = custom.speed || 0;
  return 20 - (speed * 2);
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


module.exports = {
	handleMagic,
	removeMagicSuffix,
	recoverMagicStyle,
	recoverMagicDuration
}