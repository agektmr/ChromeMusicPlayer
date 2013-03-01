var PlayListManager = (function() {
  var audioPlayer = function(entry, volume, end_callback) {
    if (typeof end_callback !== 'function') {
      throw 'callback not specified';
    }
    this.duration = 0;
    this.info = entry;
    this.player = new Audio(entry.uri);
    this.player.volume = volume;
    this.player.addEventListener('durationchange', (function() {
      this.duration = this.player.duration * 1000;
      InfoManager.title     = this.info.title;
      InfoManager.artist    = this.info.artist;
      InfoManager.album     = this.info.album;
      InfoManager.artwork   = this.info.artwork;
      InfoManager.duration  = this.duration;
      InfoManager.current   = 0;
    }).bind(this));
    this.player.addEventListener('ended', end_callback);
    this.timer = null;
  };
  audioPlayer.prototype = {
    play: function() {
      var that = this;
      var interval = function() {
        InfoManager.current   = that.player.currentTime * 1000;
        InfoManager.progress  = ~~(InfoManager.current / InfoManager.duration * 100);
      };
      this.player.play();
      this.timer = setInterval(interval, 200);
    },
    pause: function() {
      this.player.pause();
      clearInterval(this.timer);
    }
  };

  var PlayListManager = function() {
    this.list = [];
    this.volume = 1.0;
    this.playing = false;
    this.cursor = 0;
    this.player = undefined;
  };
  PlayListManager.prototype = {
    setPlayList: function(list) {
      this.list = list;
    },
    stop: function() {
      if (this.player !== undefined) {
        this.player.pause();
        this.playing = false;
      }
    },
    playStop: function(cursor) {
      var that = this;
      // Play
      if (this.playing === false) {
        if (cursor !== undefined) {
          delete this.player;
          var entry = this.list[cursor];
          if (entry) {
            this.player = new audioPlayer(entry, this.volume, this.playNext.bind(this));
            this.cursor = cursor;
            this.playing = true;
            this.player.play();
          }
        } else if (this.player !== undefined) {
          this.player.play();
          this.playing = true;
        }
      // Pause
      } else if (this.player !== undefined) {
        this.player.pause();
        this.playing = false;
      }
    },
    playPrev: function() {
      var cursor = this.cursor >= 0 ? (this.cursor-1) : 0;
      this.stop();
      this.playStop(cursor);
    },
    playNext: function() {
      var cursor = this.list.length > (this.cursor+1) ? this.cursor+1 : 0;
      this.stop();
      this.playStop(cursor);
    },
    setVolume: function(volume) {
      this.volume = volume;
      if (this.player) {
        this.player.player.volume = this.volume;
      }
    }
  };
  return new PlayListManager();
})();

