
// ### Usage of that lib

// [Streams](nodejs.org/api/stream.html) style
// lib/boot/boot.js

var Input = require('../input');
var List = require('../list');
var api = require('../api');

var input = new Input();
var list = new List();

document.body.appendChild(input.el);
document.body.appendChild(list.el);

input
.pipe(api)
.pipe(list);

