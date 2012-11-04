var ChromeMusicPlayer = (function() {
  var mediaRoot = null;
  var mediaList = [];
  var pathList = []; // used to count number of songs so that callback function can be invoked after id3 load
  var filer = new Filer();
  filer.init();
  var ChromeMusicPlayer = function() {
    chrome.mediaGalleries.getMediaFileSystems({
      interactive: 'if_needed'
    }, function(localfilesystem) {
      localfilesystem.forEach(function(media) {
        if (media.name.match(/Music/)) {
          mediaRoot = media.root;
        }
      });
    });
  };
  ChromeMusicPlayer.prototype = {
    init: function(callback) {
      pathList = [];
      mediaList = [];
      this.traverse(mediaRoot, callback);
    },
    traverse: function(root, callback) {
      filer.ls(root, (function(entries) {
console.log(entries);
        entries.forEach((function(entry) {
console.log(entry);
          if (entry.isDirectory) {
            this.traverse(entry, callback);
          } else {
            pathList.push(entry.name);
            this.parseID3(entry, callback);
          }
        }).bind(this));
      }).bind(this));
    },
    parseID3: function(entry, callback) {
      entry.file(function(file) {
        var url = entry.fullPath;
        if (file.type !== 'audio/mp3') {
          var info = {
            path:     url,
            artist:   '',
            title:    file.name,
            album:    '',
            year:     '',
            comment:  '',
            genre:    '',
            track:    '',
            lyrics:   '',
            artwork:  '',
            file:     file
          };
          console.log(info);
          mediaList.push(info);
          return;
        }
        ID3.loadTags(url, function() {
          var tags = ID3.getAllTags(url);
          var image = '';
          if (tags.picture) {
console.log(tags.picture);
            image = 'data:'+tags.picture.format+';base64,'+Base64.encodeBytes(tags.picture.data);
          }
          var info = {
            path:     url,
            artist:   tags.artist || '',
            title:    tags.title || '',
            album:    tags.album || '',
            year:     tags.year || '',
            comment:  tags.comment || '',
            genre:    tags.genre || '',
            track:    tags.track || '',
            lyrics:   tags.lyrics || '',
            artwork:  image,
            file:     file
          };
          console.log(info);
          mediaList.push(info);
          if (pathList.length == mediaList.length) callback();
        }, {
          tags: ["artist", "title", "album", "year", "comment", "track", "genre", "lyrics", "picture"],
          dataReader: FileAPIReader(file)
        });
      });
    },
    getMediaList: function() {
      var list = [];
      mediaList.forEach(function(item) {
        // intensionally omit wav files
        if (!item.path.match(/.wav$/)) {
          list.push(item);
        }
      });
      return list;
    }
  };
  return new ChromeMusicPlayer();
})();