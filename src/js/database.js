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
var musicDb = (function() {
  var db,
      fs,
      version = 6,
      filer = new Filer();

  filer.init();
  chrome.syncFileSystem.requestFileSystem(function(_fs) {
    fs = _fs;
    filer.ls(fs.root, function(entries) {
      console.log(entries);
    });
  });

  var persistFile = function(dir, name, file) {
    // filer.mkdir(dir, true, function(dirEntry) {
    filer.cd(fs.root, function(dir) {
      filer.write(name, {data:file, type:file.type},
      function(fileEntry, fileWriter) {
console.log(name, 'added to FS');
        console.log(fileEntry, fileWriter);
      });
    });
  };

  var musicDb = function(callback) {
    var req = indexedDB.open('ChromeMusicApp', version);
    req.onsuccess = (function(e) {
      db = e.target.result;
      console.info('opened the database:', req.result);
      if (typeof callback === 'function') callback();
    }).bind(this);
    req.onfailure = (function(e) {
      console.error('error opening database:', req.errorCode);
    }).bind(this);
    req.onupgradeneeded = (function(e) {
      db = e.target.result;
      console.info('database upgrade needed');
      this.initiate();
    }).bind(this);
  };

  musicDb.prototype = {
    initiate: function() {
      // {
      //   path:     url in file schema or filesystem schema
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
    },
    getAll: function(callback, error) {
      var result = [];
      var transaction = db.transaction(['music'], 'readonly');
      transaction.oncomplete = function() {
        console.log('complete');
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
    add: function(entries, callback, error) {
      var add = function(entry) {
        var dir = '/'+(entry.artist || 'Unknown')+'/'+(entry.album || 'Unknown');
        var file = entry.file || null;
        if (file) {
          delete entry.file;
        }
        var req = objectStore.put(entry);
        req.onsuccess = function(e) {
console.log(entry, 'added to iDB');
          persistFile(dir, entry.name, file);
        };
      };

      var transaction = db.transaction(['music'], 'readwrite');
      transaction.oncomplete = function() {
        console.log('complete');
        if (typeof callback === 'function') callback();
      };
      transaction.onerror = function(e) {
        console.error(e);
        if (typeof error === 'function') {
          error();
        } else {
          throw 'database addition error';
        }
      };
      var objectStore = transaction.objectStore('music');
      if (entries.constructor.name === 'Array') {
        entries.forEach(add);
      } else {
        add(entries);
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
          filer.cd('/', function(dir) {
            filer.rm(entry.name, function() {
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
    }
  };

  return musicDb;
})();
