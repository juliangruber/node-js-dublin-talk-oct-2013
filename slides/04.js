
// ## Bundle on every request

if (req.url == '/bundle.js') {
  res.writeHead(200, { 'Content-Type': 'application/javascript' });
  browserify(__dirname + '/lib/boot/boot.js')
    .bundle({ debug: true })
    .pipe(res);
}

// * can be slow!

// * no need to check into source control -> less potential merge conflicts

