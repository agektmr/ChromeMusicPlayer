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

  db.onprogress = function(info) {
    MusicLoader.status = MusicLoader.SAVE_COMPLETE;
    webkitNotifications.createNotification(info.artwork || '', '"'+info.title+'" Loaded', info.artist+'-'+info.album).show();
    if (typeof MusicLoader.onprogress == 'function') {
      var progress = MusicLoader.handling_files - db.getQueueLength();
      info.title = 'Loading "'+info.title+'" ('+progress+'/'+MusicLoader.handling_files+')';
      info.progress = ~~(progress / MusicLoader.handling_files * 100);
      db.updateQuotaAndUsage(function() {
        MusicLoader.usage = db.usage;
        MusicLoader.quota = db.quota;
        MusicLoader.onprogress(info);
      });
    }
  };
  db.oncomplete = function() {
    MusicLoader.status = 0;
    MusicLoader.handling_files = 0;
    if (typeof MusicLoader.oncomplete == 'function') {
      MusicLoader.oncomplete();
    }
  };
  db.onerror = function() {
    if (typeof MusicLoader.onerror == 'function') {
      MusicLoader.onerror();
    }
  };

  var createListFromFS = function(root) {
    filer.ls(root, function(entries) {
      if (entries.length === 0) return;
      entries.forEach(function(entry) {
        if (entry.isDirectory) {
          createListFromFS(entry);
        } else {
          MusicLoader.handling_files++;
          if (typeof MusicLoader.onprogress == 'function') {
            MusicLoader.onprogress();
          }
          db.add(entry);
        }
      });
    });
  };

  return {
    RETRIEVE_COMPLETE: 1,
    SAVE_COMPLETE: 2,
    quota: 0,
    usage: 0,
    status: 0,
    handling_files: 0,
    onprogress: null,
    oncomplete: null,
    loadLocalMusics: function() {
      chrome.mediaGalleries.getMediaFileSystems({
        interactive: 'if_needed'
      }, function(localfilesystem) {
        localfilesystem.forEach(function(fs) {
          var metadata = chrome.mediaGalleries.getMediaFileSystemMetadata(fs);
          if (metadata.name === 'Music') {
            MusicLoader.status = MusicLoader.RETRIEVE_COMPLETE;
            if (typeof MusicLoader.onprogress == 'function') {
              MusicLoader.onprogress(null);
            }
            createListFromFS(fs.root);
          }
        });
      });
    },
    getAllMusics: function(callback) {
      db.getAll(callback);
    },
    dismissAllMusics: function(callback) {
      db.removeAll(callback);
    }
  };
})();