
// ### example

var test = require('tape');

test('javascript works', function(t) {
  t.plan(2);

  t.equal(2 + 2, 4);

  setTimeout(function() {
    t.equal(2 + 2, 4);
  }, 100);
});

