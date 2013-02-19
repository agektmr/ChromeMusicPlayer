/*
Copyright 2013 Eiji Kitamura

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
var MusicDB = (function() {
  var MEDIA_ROOT = 'filesystem:chrome-extension://'+chrome.runtime.id+'/external/drive',
      db,
      fs,
      ready = false,
      adding = false,
      removing = false,
      version = 6,
      filer = null,
      add_queue = [],
      update_queue = [],
      remove_queue = [];

  chrome.syncFileSystem.requestFileSystem(function(_fs) {
    console.log('fs initialized');
    ready = true;
    fs = _fs;
    filer = new Filer(_fs);
    filer.init();
    filer.ls(fs.root, function(entries) {
      console.log(entries);
    });
  });

  var parseMusicFile = function(entry, callback) {
    entry.file(function(file) {
      var originalPath = entry.fullPath;
      if (file.type == 'audio/mp3') {
        ID3.loadTags(originalPath, function() {
          var tags = ID3.getAllTags(originalPath);
          var image = '';
          if (tags.picture) {
            image = 'data:'+tags.picture.format+';base64,'+Base64.encodeBytes(tags.picture.data);
          }
          var dir  = '/'+(tags.artist || 'Unknown')+'/'+(tags.album || 'Unknown');
          // var path = dir+'/'+file.name;
          var path = file.name;
          var uri = [MEDIA_ROOT,
                     // encodeURIComponent(tags.artist || 'Unknown'),
                     // encodeURIComponent(tags.album || 'Unknown'),
                     encodeURIComponent(file.name)].join('/');
          var info = {
            name:     file.name,
            uri:      uri,
            dir:      dir,
            path:     path,
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
      // } else if (file.type.indexOf('audio') === 0) {
      } else {
        var dir  = '/Unknown/Unknown';
        // var path = dir+'/'+file.name;
        var path = file.name;
        var uri = [MEDIA_ROOT,
                   // 'Unknown',
                   // 'Unknown',
                  encodeURIComponent(file.name)].join('/');
        var info = {
          name:     file.name,
          uri:      uri,
          dir:      '/Unknown/Unknown',
          path:     path,
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
  };

  var req = indexedDB.open('ChromeMusicApp', version);
  req.onsuccess = function(e) {
    db = e.target.result;
  };
  req.onfailure = function(e) {
    console.error('error opening database:', req.errorCode);
  };
  req.onupgradeneeded = function(e) {
    db = e.target.result;
    console.info('database upgrade needed');

    // {
    //   dir:      directory of the file
    //   path:     full path to the file
    //   artist:   artist name
    //   title:    title of the song
    //   album:    title of the album
    //   year:     release year
    //   comment:  comment
    //   genre:    genre
    //   track:    track number
    //   lyrics:   lyrics
    //   artwork:  artwork image in DataURI format
    // };
    if (db.objectStoreNames.contains('music')) {
      db.deleteObjectStore('music');
    }
    var music = db.createObjectStore('music', {keyPath: 'path'});
    music.createIndex('name',   'name',   {unique: false});
    music.createIndex('path',   'path',   {unique: false});
    music.createIndex('artist', 'artist', {unique: false});
    music.createIndex('title',  'title',  {unique: false});
    music.createIndex('album',  'album',  {unique: false});
    music.createIndex('year',   'year',   {unique: false});
    music.createIndex('genre',  'genre',  {unique: false});
  };

  var addMusic = function(callback, error) {
    if (typeof callback !== 'function' || typeof error !== 'function') return;
    var entry = add_queue.shift();
    if (entry) {
      parseMusicFile(entry, function(info) {
        var transaction = db.transaction(['music'], 'readwrite');
        transaction.oncomplete = function() {
          callback(info);
        };
        transaction.onerror = function() {
          error(info);
        };

        var objectStore = transaction.objectStore('music');
        var file = info.file || null;
        if (file) {
          delete info.file;
        }
        var req = objectStore.put(info);
        req.onsuccess = function(e) {
          addMusic(callback, error);
        };
        filer.cd(fs.root, function() {
          // filer.mkdir(info.dir, false, function(dirEntry) {
            filer.write(info.name, {data:file, type:file.type}, function(fileEntry, fileWriter) {
console.log(info.name, 'added to FS');
            });
          }, function(e) {
            console.error(e);
          // });
        });
      });
    }
  };

  var removeMusic = function(callback, error) {
    if (typeof callback !== 'function' || typeof error !== 'function') return;
    var entry = remove_queue.shift();
    if (entry) {
      parseMusicFile(entry, function(info) {
        var transaction = db.transaction(['music'], 'readwrite');
        transaction.oncomplete = function() {
          callback(info);
        };
        transaction.onerror = function() {
          error(info);
        };

        var objectStore = transaction.objectStore('music');
        var file = info.file || null;
        if (file) {
          delete info.file;
        }
        var req = objectStore.delete(info.path);
        req.onsuccess = function(e) {
console.log(info.name, 'added to iDB');
          removeMusic(callback, error);
        };
      });
    }
  };

  var MusicDB = function() {
  };

  MusicDB.prototype = {
    onprogress: null,
    oncomplete: null,
    onerror: null,
    getAll: function(callback, error) {
      var result = [];
      var transaction = db.transaction(['music'], 'readonly');
      transaction.oncomplete = function() {
        if (typeof callback === 'function') callback(result);
      };
      transaction.onerror = error;
      var req = transaction.objectStore('music').openCursor();
      req.onsuccess = function(e) {
        var cursor = e.target.result;
        if (cursor) {
          result.push(cursor.value);
          cursor.continue();
        }
        // exit if cursor is null
      };
      // cursor.onerror = error;
    },
    query: function(callback, opt_query_obj) {
      var result = {};
      var transaction = db.transaction(['music'], 'readonly');
      transaction.oncomplete = callback;
      transaction.onerror = error;
      var objectStore = transaction.objectStore('music');
      if (opt_query_obj) {
        for (var key in opt_query_obj) {
          var index = objectStore.index(key);
          // TODO
          index.openCursor(opt_query_obj[key]);
        }
      }

    },
    add: function(entry) {
      add_queue.push(entry);
      if (!adding) {
        adding = true;
        var that = this;
        addMusic(function(info) {
          if (typeof that.onprogress === 'function') that.onprogress(info);
          if (add_queue.length === 0) {
            add_queue = [];
            adding = false;
            if (typeof that.oncomplete === 'function') that.oncomplete();
          }
        }, function(error) {
          if (typeof that.onerror === 'function') that.onerror(info);
        });
      }
    },
    update: function(entry) {

    },
    remove: function(id) {
      remove_queue.push(id);
      if (!removing) {
        removing = true;
        var that = this;
        removeMusic(function(info) {
          if (typeof this.onprogress === 'function') this.onprogress(info);
          if (remove_queue.length === 0) {
            remove_queue = [];
            removing = false;
            if (typeof this.oncomplete === 'function') this.oncomplete();
          }
        }, function(error) {
          if (typeof that.onerror === 'function') that.onerror(info);
        });
      }
    },
    removeAll: function(callback) {
      var transaction = db.transaction(['music'], 'readwrite');
      transaction.oncomplete = function() {
        console.info('deleted all music!');
        if (typeof callback === 'function') callback();
      };
      var music = transaction.objectStore('music');
      var req = music.openCursor();
      req.onsuccess = function(e) {
        var cursor = e.target.result;
        if (cursor) {
          var entry = cursor.value;
          filer.cd(fs.root, function(dir) {
            filer.rm(entry.path, function() {
              console.log(entry.title, 'file deleted');
            });
          });
          var req2 = music.delete(cursor.key);
          req2.onsuccess = function() {
            console.log(entry.title, 'index deleted');
          };
          cursor.continue();
        }
      };
    },
    getQueueLength: function() {
      return add_queue.length + update_queue.length + remove_queue.length;
    },
    abort: function() {
      
    }
  };

  return MusicDB;
})();
