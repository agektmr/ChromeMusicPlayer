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

// Should be Factory?
var MusicLoader = (function() {
  var db    = new MusicDB();
  var filer = new Filer();
  filer.init();

  chrome.syncFileSystem.onFileStatusChanged.addListener(function(fileInfo) {
    if (fileInfo.status === 'synced') {
      if (fileInfo.direction === 'remote_to_local') {
        if (fileInfo.action === 'added') {
console.log('adding music from remote:', fileInfo.fileEntry);
          db.add(fileInfo.fileEntry);
        } else if (fileInfo.action === 'deleted') {
console.log('removing music from remote:', fileInfo.fileEntry);
          db.remove(fileInfo.fileEntry);
        }
      }
    }
  });

  // db.onprogress = function(info) {
  //   MusicLoader.status = MusicLoader.SAVE_COMPLETE;
  //   webkitNotifications.createNotification(info.artwork || '', '"'+info.title+'" Loaded', info.artist+'-'+info.album).show();
  //   var progress = MusicLoader.handling_files - db.getQueueLength();
  //   InfoManager.title = 'Loading...';
  //   InfoManager.artist = info.title;
  //   InfoManager.album = progress + '/' + MusicLoader.handling_files;
  //   InfoManager.progress = ~~(progress / MusicLoader.handling_files * 100);
  //   db.updateQuotaAndUsage(function() {
  //     QuotaManager.quota = db.quota;
  //     QuotaManager.usage = db.usage;
  //   });
  // };
  // db.onerror = function() {
  //   InfoManager.title = 'Error!';
  //   InfoManager.artist = '';
  //   InfoManager.album = '';
  //   InfoManager.current = 0;
  //   InfoManager.duration = 0;
  //   InfoManager.progress = 100;
  // };

  var createListFromFS = function(root) {
    filer.ls(root, function(entries) {
      if (entries.length === 0) return;
      entries.forEach(function(entry) {
        if (entry.isDirectory) {
          createListFromFS(entry);
        } else {
          MusicLoader.handling_files++;
          db.add(entry);
        }
      });
    });
  };

  return {
    RETRIEVE_COMPLETE: 1,
    SAVE_COMPLETE: 2,
    status: 0,
    handling_files: 0,
    loadLocalMusics: function(progress_callback, complete_callback, error_callback) {
      db.onprogress = function(info) {
        db.updateQuotaAndUsage();
        if (typeof progress_callback === 'function') {
          var progress = MusicLoader.handling_files - db.getQueueLength();
          info.album = progress + '/' + MusicLoader.handling_files;
          info.progress = ~~(progress / MusicLoader.handling_files * 100);
          progress_callback(info);
        }
      };
      db.oncomplete = function() {
        MusicLoader.status = 0;
        MusicLoader.handling_files = 0;
        db.updateQuotaAndUsage();
        if (typeof complete_callback === 'function') {
          complete_callback();
        }
      };
      db.onerror    = function() {
        if (typeof error_callback === 'function') {
          error_callback();
        }
      };

      chrome.mediaGalleries.getMediaFileSystems({
        interactive: 'if_needed'
      }, function(localfilesystem) {
        localfilesystem.forEach(function(fs) {
          var metadata = chrome.mediaGalleries.getMediaFileSystemMetadata(fs);
          if (metadata.name === 'Music') {
            MusicLoader.status = MusicLoader.RETRIEVE_COMPLETE;
            createListFromFS(fs.root);
          }
        });
      });
    },
    addMusics: function(fileEntry, progress_callback, complete_callback, error_callback) {
      db.onprogress = function() {
        db.updateQuotaAndUsage();
        if (typeof progress_callback === 'function') {
          progress_callback();
        }
      };
      db.oncomplete = function() {
        MusicLoader.status = 0;
        MusicLoader.handling_files = 0;
        db.updateQuotaAndUsage();
        if (typeof complete_callback === 'function') {
          complete_callback();
        }
      };
      db.onerror    = function() {
        if (typeof error_callback === 'function') {
          error_callback();
        }
      };
      if (fileEntry.isFile) {
        // directory add to queue if file
        db.add(fileEntry);
      } else {
        // parse and create list of fileEntries if directory
        createListFromFS(fileEntry);
      }
    },
    getAllMusics: function(callback) {
      db.getAll(function(result) {
        db.updateQuotaAndUsage();
        callback(result);
      });
    },
    dismissAllMusics: function(callback) {
      db.oncomplete = callback;
      db.removeAll();
    }
  };
})();
