/*
Copyright 2012 Eiji Kitamura

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eiji Kitamura (agektmr@gmail.com)
*/
var ChromeMusicPlayer = (function() {
  var mediaRoot = null;
  var mediaList = [];
  var filer = new Filer();
  filer.init();
  var ChromeMusicPlayer = function() {
    this.db = new musicDb();
    this.fileList = [];
  };
  ChromeMusicPlayer.prototype = {
    loadLocalMusic: function(callback) {
      var that = this;
      chrome.mediaGalleries.getMediaFileSystems({
        interactive: 'if_needed'
      }, function(localfilesystem) {
        localfilesystem.forEach(function(fs) {
          var metadata = chrome.mediaGalleries.getMediaFileSystemMetadata(fs);
          if (metadata.name === 'Music') {
            that.fileList = [];
            that.createListFromFS(fs.root, function() {
              that.addMusics(that.fileList, function() {
console.log('music addition complete');
              });
            });
          }
        });
      });
    },
    addMusics: function(entries, callback) {
      var entry = entries.shift();
      if (entry) {
console.log('adding music');
        this.parseMusicFile(entry, (function(info) {
console.log('parsed: ', info);
          this.db.add(info);
console.log('entries left: ', entries.length);
          this.addMusics(entries, callback);
        }).bind(this));
      } else {
        callback();
      }
    },
    dismissAllMusic: function(callback) {
      mediaList = [];
      this.db.removeAll(callback);
    },
    createListFromFS: function(root, callback) {
      filer.ls(root, (function(entries) {
        if (entries.length === 0) callback();
        entries.forEach((function(entry) {
          if (entry.isDirectory) {
            this.createListFromFS(entry, callback);
          } else {
            this.fileList.push(entry);
          }
        }).bind(this));
        callback();
      }).bind(this));
    },
    parseMusicFile: function(entry, callback) {
      entry.file(function(file) {
        var originalPath = entry.fullPath;
        if (file.type == 'audio/mp3') {
          ID3.loadTags(originalPath, function() {
            var tags = ID3.getAllTags(originalPath);
            var image = '';
            if (tags.picture) {
              image = 'data:'+tags.picture.format+';base64,'+Base64.encodeBytes(tags.picture.data);
            }
            // TODO: consider ESCAPE
            var path = '/'+[tags.artist || 'Unkown', tags.album || 'Unknown', file.name].join('/');
            var info = {
              name:     file.name,
              // path:     path,
              path:     originalPath,
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
            callback(info);
          }, {
            tags: ["artist", "title", "album", "year", "comment", "track", "genre", "lyrics", "picture"],
            dataReader: FileAPIReader(file)
          });
        } else {
          var info = {
            path:     originalPath,
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
          callback(info);
        }
      });
    },
    getMediaPath: function(entry) {
      // TODO: Trying to see if mediaFiles can be reachable from fs, running out of time
      // filer.open(entry.path, function(e) {
      //   console.log(e);
      // }, function(e) {
      //   console.error(e);
      // });
      return 'filesystem:chrome-extension://'+chrome.runtime.id+'/temporary/'+encodeURIComponent(entry.name);
    },
    getMediaList: function(callback) {
      this.db.getAll(callback);
    }
  };
  return new ChromeMusicPlayer();
})();