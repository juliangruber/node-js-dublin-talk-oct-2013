
// ### Server

var ecstatic = require('ecstatic');
var serve = ecstatic(__dirname + '/static');

module.exports = function(req, res) {
  if (!/^\/(images|uploads)\//.test(req.url)) {
    req.url = '/';
  }
  serve(req, res);
};

