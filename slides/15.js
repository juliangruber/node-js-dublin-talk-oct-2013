
// ### Server

// ./index.js

var stack = require('stack');

module.exports = stack(
  require('./lib/feature-a'),
  require('./lib/feature-b'),
  require('./lib/feature-c')
);
```

// ./lib/feature-a/index.js

module.exports = function(req, res, next) {
  if (!/^\/posts\/?/.test(req.url)) return next();

  // ...
};

