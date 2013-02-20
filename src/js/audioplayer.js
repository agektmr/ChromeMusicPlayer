var PlayListManager = (function() {
  var audioPlayer = function(entry, progress_callback, end_callback) {
    if (typeof end_callback !== 'function' || typeof progress_callback !== 'function') {
      throw 'callback not specified';
    }
    this.duration = 0;
    this.info = entry;
    this.player = new Audio(entry.uri);
    this.player.addEventListener('durationchange', (function() {
      this.duration = this.player.duration * 1000;
    }).bind(this));
    this.player.addEventListener('ended', end_callback);
    this.progress = progress_callback;
    this.timer = null;
  };
  audioPlayer.prototype = {
    play: function() {
      var that = this;
      var interval = function() {
        var current = that.player.currentTime * 1000;
        var info = {
          title:    that.info.title,
          artist:   that.info.artist,
          album:    that.info.album,
          artwork:  that.info.artwork,
          current:  current,
          duration: that.duration,
          progress: ~~(current / that.duration * 100)
        };
        if (typeof that.progress === 'function') {
          that.progress(info);
        }
      };
      this.player.play();
      interval();
      this.timer = setInterval(interval, 1000);
    },
    pause: function() {
      this.player.pause();
      clearInterval(this.timer);
    }
  };

  var PlayListManager = function() {
    this.list = [];
    this.volume = 1.0;
    this.status = PlayListManager.prototype.PAUSED;
    this.index = 0;
    this.player = undefined;
  };
  PlayListManager.prototype = {
    PAUSED: 0,
    PLAYING: 1,
    onprogress: null,
    setPlayList: function(list) {
      this.list = list;
    },
    stop: function() {
      if (this.player !== undefined) {
        this.player.pause();
        this.status = PlayListManager.prototype.PAUSED;
      }
    },
    playStop: function(index) {
      // Play
      if (this.status === PlayListManager.prototype.PAUSED) {
        if (index !== undefined) {
          delete this.player;
          var entry = this.list[index];
          if (entry) {
            this.player = new audioPlayer(entry, this.onprogress, this.playNext.bind(this));
            this.index = index;
            this.status = PlayListManager.prototype.PLAYING;
            this.player.play();
          }
        } else if (this.player !== undefined) {
          this.player.play();
          this.status = PlayListManager.prototype.PLAYING;
        }
      // Pause
      } else if (this.player !== undefined) {
        this.player.pause();
        this.status = PlayListManager.prototype.PAUSED;
      }
    },
    playPrev: function() {
      var index = this.index >= 0 ? (this.index-1) : 0;
      this.stop();
      this.playStop(index);
    },
    playNext: function() {
      var index = this.list.length > (this.index+1) ? this.index+1 : 0;
      this.stop();
      this.playStop(index);
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