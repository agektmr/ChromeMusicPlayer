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
app.value('loader', MusicLoader);
app.value('player', PlayListManager);
app.value('info',   InfoManager);
app.value('quota',  QuotaManager);

app.controller('MediaControlCtrl', function($scope, loader, player) {
  $scope.playing = player.playing;
  $scope.query = '';
  $scope.cursor = player.cursor;
  $scope.volume = player.volume;
  $scope.$watch('volume', function() {
    if (player.player) {
      player.player.player.volume = $scope.volume;
    }
    player.volume = $scope.volume;
  });

  $scope.play = function(cursor) {
    $scope.cursor = cursor;
    player.playStop(cursor);
    $scope.playing = player.playing;
  };
  $scope.backward = function() {
    $scope.cursor = $scope.cursor >= 0 ? ($scope.cursor-1) : 0;
    if ($scope.playing) {
      player.stop();
      $scope.play($scope.cursor);
    }
  };
  $scope.forward = function() {
    $scope.cursor = $scope.cursor < $scope.list.length ? ($scope.cursor+1) : $scope.list.length;
    if ($scope.playing) {
      player.stop();
      $scope.play($scope.cursor);
    }
  };

  $scope.reload = function() {
    loader.getAllMusics(function(list) {
      player.setPlayList(list);
      $scope.list = player.list;
      $scope.$apply();
    });
  };
  $scope.load_local_music = function() {
    $scope.list = [];
    loader.loadLocalMusics(function(info) {
      webkitNotifications.createNotification(info.artwork || '', '"'+info.title+'" Loaded', info.artist+'-'+info.album).show();
      InfoManager.title = 'Loading...';
      InfoManager.artist = info.title;
      InfoManager.album = info.album;
      InfoManager.progress = info.progress;
      $scope.$apply();
    }, function(list) {
      InfoManager.title = 'All your local musics are imported.';
      InfoManager.artist = '';
      InfoManager.album = '';
      InfoManager.current = 0;
      InfoManager.duration = 0;
      InfoManager.progress = 100;
      $scope.reload();
    });
  };
  $scope.load_music = function(e) {
    e.preventDefault();
    Array.prototype.forEach.call(e.dataTransfer.items, function(item) {
      if (item) {
        loader.addMusics(item.webkitGetAsEntry(), function() {
          webkitNotifications.createNotification(info.artwork || '', '"'+info.title+'" Loaded', info.artist+'-'+info.album).show();
          InfoManager.title = 'Loading...';
          InfoManager.artist = info.title;
          InfoManager.album = info.album;
          InfoManager.progress = info.progress;
          $scope.$apply();
        }, function() {
          InfoManager.title = 'Dropped music is imported.';
          InfoManager.artist = '';
          InfoManager.album = '';
          InfoManager.current = 0;
          InfoManager.duration = 0;
          InfoManager.progress = 100;
          $scope.$apply();
        });
      }
    });
  };
  $scope.dismiss_music = function() {
    loader.dismissAllMusics(function(list) {
      InfoManager.title = 'All your local musics are dismissed.';
      InfoManager.artist = '';
      InfoManager.album = '';
      InfoManager.current = 0;
      InfoManager.duration = 0;
      InfoManager.progress = 100;
      player.setPlayList([]);
      $scope.list = player.list;
      $scope.$apply();
    });
  };

  $scope.select = function(selected) {
    $scope.selected = selected;
  };
  $scope.reload();

  var list = document.querySelector('.app-musiclist');
  list.ondragenter = function(e) {};
  list.ondragleave = function(e) {};
  list.ondragover = function(e) {
    e.preventDefault();
  };
  list.ondrop = $scope.load_music;
});

app.controller('InfoManagerCtrl', function($scope, info) {
  $scope.info = info;
  info.onupdate = function() {
    $scope.info = info;
    $scope.$apply();
  };
});

app.controller('QuotaManagerCtrl', function($scope, quota) {
  $scope.quota = quota;
  quota.onupdate = function() {
    $scope.quota = quota;
    $scope.$apply();
  };
});

app.controller('MediaCtrl', function($scope, player) {
  $scope.index_and_play = function() {
    player.stop();
    $scope.play($scope.$index);
  };
});