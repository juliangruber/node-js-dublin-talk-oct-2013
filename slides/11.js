
// ### Usage of that lib

// [EventEmitter](http://nodejs.org/api/events.html) style
// lib/boot/boot.js

var Input = require('../input');
var List = require('../list');
var api = require('../api');

var input = new Input();
var list = new List();

document.body.appendChild(input.el);
document.body.appendChild(list.el);

input.on('message', function(msg) {
  api.send(msg);
});

api.on('message', function(msg) {
  list.push(msg);
});

