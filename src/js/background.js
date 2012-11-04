chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    width: 840,
    height: 500,
    frame: 'none'
  }, function(win) {
    win.contentWindow.ChromeMusicPlayer = ChromeMusicPlayer;
  });
});