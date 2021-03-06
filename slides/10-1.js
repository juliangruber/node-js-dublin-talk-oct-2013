
// ### Structure of a lib

// lib/input/index.js

var Emitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var fs = require('fs');
var tmpl = fs.readFileSync(__dirname + '/template.html');
var style = fs.readFileSync(__dirname + '/style.css');
var insertCSS = require('insert-css');
var glue = require('hyperglue');

module.exports = Input;

function Input() {
  this.el = glue({
    'selector': 'content'
  });

  this.el.querySelector('input')
    .addEventListener('keydown', this.keydown.bind(this));

  insertCSS(style);
}

inherits(Input, EventEmitter);

Input.prototype.keydown = function(ev) {
  if (ev.keyCode != 13) return;
  
  var msg = input.value;
  input.value = '';
  this.emit('message', msg);
}

// For fs support bundle with [brfs](https://github.com/substack/brfs):
//
// ```bash
// browserify --debug -t brfs lib/boot/boot.js > static/bundle.js
// ```

