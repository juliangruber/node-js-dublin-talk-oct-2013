# Modular frontends and big app structure using browserify


Hi, I'm Julian Gruber!

https://{github,twitter}.com/juliangruber

Node.js Dublin Oct 2013

## Quote

From [backbonejs.org](http://backbonejs.org/):

> It's all too easy to create JavaScript applications that end up as tangled piles
> of jQuery selectors and callbacks

# Bundling strategies

In *development* bundle on every request or use watchify.

In *production* you'll want to server bundles from disk to use existing
caching logic. (static file servers, varnish, etc.)

## Bundle on every request

```js
if (req.url == '/bundle.js') {
  res.writeHead(200, { 'Content-Type': 'application/javascript' });
  browserify(__dirname + '/lib/boot/boot.js')
    .bundle({ debug: true })
    .pipe(res);
}
```

can be slow!
but: no need to check into source control -> less potential merge conflicts.

## Serve from disk

```bash
$ browserify --debug ./lib/boot/boot.js > static/bundle.js
```

```js
"scripts": {
  "build": "browserify --debug ./lib/boot/boot.js > static/bundle.js",
  "start": "npm run build && node index.js"  
}
```

```bash
$ npm run build
$ # or
$ npm start
```

## Watchify cli

* watches fs
* recompiles only what changed -> faster

```bash
$ watchify --debug ./lib/boot/boot.js -o static/bundle.js
```

```js
"scripts": {
  "watchify": "watchify --debug ./lib/boot/boot.js -o static/bundle.js"  
}
```

```bash
$ npm run watchify &
$ npm start
```

# Modularity

* server side code
* client side code
* server side templates?
* client side templates
* stylesheets

## Client side heavy

```
index.js                         - server
lib/*                            - server libs
static/*                         - static files
bin/*                            - start server
browser/<feature>/index.js       - browser code
browser/<feature>/template.html  - template
browser/<feature>/style.css      - stylesheet
```

Special `<feature>`s:

* boot: browser entry point
* layout

### Server

```js
var ecstatic = require('ecstatic');
var serve = ecstatic(__dirname + '/static');

module.exports = function(req, res) {
  if (!/^\/(images|uploads)\//.test(req.url)) {
    req.url = '/';
  }
  serve(req, res);
};
```

### Structure of a lib

```js
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
```

For fs support bundle with [brfs](https://github.com/substack/brfs):

```bash
browserify --debug -t brfs lib/boot/boot.js > static/bundle.js
```

### Usage of that lib

[EventEmitter](http://nodejs.org/api/events.html) style:

```js
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
```
### Usage of that lib

[Streams](nodejs.org/api/stream.html) style:

```js
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
```

## and that...

...is how you avoid jQuery spaghetti
without buying into frameworks.

## Equally client and server side

```
index.js                         - server
bin/*                            - start server
static/*                         - static files
lib/<feature>/index.js           - server code
lib/<feature>/<feature>.js       - client code
lib/<feature>/style.css          - stylesheet
lib/<feature>/template.html      - template
```

### Server

```js
// ./index.js

var stack = require('stack');

module.exports = stack(
  require('./lib/feature-a'),
  require('./lib/feature-b'),
  require('./lib/feature-c')
);
```

```js
// ./lib/feature-a/index.js

module.exports = function(req, res, next) {
  if (!/^\/posts\/?/.test(req.url)) return next();

  // ...
};
```

### Client part

just as above.

# Big bundles

Bundles can become _huge_, especially if you need big monolothic libraries
like [d3](https://github.com/mbostock/d3/).

200k is nothing special...

## Analyse size

```bash
$ sudo npm install -g disc
$ discify lib/boot/boot.js | bcat
```

* [disc](https://github.com/hughsk/disc)
* [bcat](http://rtomayko.github.io/bcat/)

## Split up bundles

Graphing libraries can be quite huge, so we could move them to another bundle
like so:

```bash
$ browserify -x lib/graph/graph.js lib/boot/boot.js > static/bundle.js
$ browserify -r lib/graph/graph.js > static/graph.js
```

or

```bash
$ browserify -x d3 -x fabric lib/boot/boot.js > static/bundle.js
$ browserify -r d3 node_modules/d3 -r fabric node_modules/fabric > static/graph.js
```

## Load based on page

```html
<!-- index.html -->
<script src="/bundle.js">
```

```html
<!-- graph.html -->
<script src="/graph.js">
<script src="/bundle.js">
```

## Lazy load

Need this for single page apps.

```js
// lib/boot/boot.js
load = require('any-javascript-loader');

load('/graph.js', function() {
  var Graph = require('graph');
});
```

## Dead code removal

@substack is working on [undead](https://github.com/substack/undead)
which does dead code removal.

So e.g.

```js
require('util').inherits
```

will only include the inherits function and not all the other junk in
the utils module.

And more!

# Use non-browserify libs

Not everyone publishes to npm :'(

## Standalone libs

### Don't bundle at all

```html
<script src="/lib.js">
<script src="/bundle.js">
```

```js
var a = require('lib-a');
var b = require('lib-b');
var lib = window.lib;
```

or lazy load...

### Wrap the library

1) find where it does

```js
window.lib = lib;
```

2) turn that into

```js
module.exports = lib;
```

3) add a package.json

```bash
$ npm init
```

4) push to your fork on github

```bash
$ git push -u origin npm
```

5) make a pull request

* use an exports shim
* point them to browserify standalone bundles

```bash
$ browserify -s lib index.js > dist/release.js
```

This exports it on the window object as `window.lib` if necessary.

5) npm publish

OR

6) source your fork

In package.json:

```json
  "lib": "git://github.com/juliangruber/lib#npm"
```

### Convert from another package manager

A common case are [components](http://github.com/component/component).

There's a lot of really good frontend code published only as components.

#### Browser field to the resque!

With browserify's `browser` field all it takes is to modify the `package.json`
of the component and potentially each dependency.

#### Naming discrepancies

Components often have:

```js
var get = require('get');
```

But the package is published on npm as `get-component`.

With the `browser` field you can rewrite those require statements:

```json
  "browser": {
    "get": "get-component"
  }
```

Then, pull request etc. etc.

# Testing

## tape

tape is a browser friendly version of tap, which both output
test results in the Test Anything Protocol.

* [tape](https://github.com/substack/tape)
* [tap](https://github.com/isaacs/node-tap)
* [Test Anything Protocol](http://testanything.org/wiki/index.php/Main_Page)

### example

```js
var test = require('tape');

test('javascript works', function(t) {
  t.plan(2);

  t.equal(2 + 2, 4);

  setTimeout(function() {
    t.equal(2 + 2, 4);
  }, 100);
});
```

## testling cli

Put all your tests into `./test/` and then:

```bash
$ sudo npm install -g testling

$ browserify test/*.js | testling

TAP version 13
# javascript works
ok 1 should be equal
ok 2 should be equal

1..2
# tests 2
# pass  2

# ok
$ echo $?
0
```

## testling api

[testling](http://ci.testling.com/)

```bash
$ sudo npm install -g testlingify

$ testlingify
info testlingify Adding testling config to your package and creating testling hook on your github repository
info testlingify Loaded testlingify config from /Users/juliangruber/.config/testlingify.js
info testlingify Successfully set testling property in package.json.
info testlingify Successfully created testling hook for juliangruber/lib as juliangruber

$ testlingify badge
[![testling badge](https://ci.testling.com/juliangruber/lib.png)](https://ci.testling.com/juliangruber/lib)
```

## testling server

WIP by @substack

Run tests and testling ci locally, optionally using testling's servers for
virtual browsers.

* [testling-server](https://github.com/substack/testling-server)

# Find modules

```bash
$ npm search foo
$ component search foo
```

# FIN

[github](https://github.com/juliangruber)
[twitter](https://twitter.com/juliangruber)

```
#stackvm
#browserling
```

