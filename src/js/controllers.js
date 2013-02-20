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
app.controller('MediaControlCtrl', function($scope, control) {
  $scope.player_index = -1;
  $scope.control = control;
  $scope.status = PlayListManager.status ? 'Pause' : 'Play';
  $scope.query = '';
  $scope.volume = PlayListManager.volume;
  $scope.list = [];
  $scope.quota = 0;
  $scope.usage = 0;

  $scope.info = {
    title:    '',
    artist:   '',
    album:    '',
    artwork:  '',
    current:  0,
    duration: 0,
    progress: 0
  };

  var reload = function($scope) {
    MusicLoader.getAllMusics(function(list) {
      PlayListManager.setPlayList(list);
      $scope.list = PlayListManager.list;
      $scope.$apply();
    });
  };

  $scope.play = function(index) {
    PlayListManager.playStop(index);
    $scope.player_index = PlayListManager.index;
    $scope.status = PlayListManager.status ? 'Pause' : 'Play';
  };
  $scope.backward = function() {
    $scope.control.cursor = $scope.player_index >= 0 ? ($scope.player_index-1) : 0;
    if (PlayListManager.status === PlayListManager.PLAYING) {
      PlayListManager.stop();
      $scope.play($scope.control.cursor);
    }
  };
  $scope.forward = function() {
    $scope.control.cursor = $scope.player_index < $scope.list.length ? ($scope.player_index+1) : $scope.list.length;
    if (PlayListManager.status === PlayListManager.PLAYING) {
      PlayListManager.stop();
      $scope.play($scope.control.cursor);
    }
  };
  $scope.volume_change = function() {
    PlayListManager.setVolume($scope.volume);
  };
  $scope.reload = function() {
    reload($scope);
  };
  $scope.load_local_music = function() {
    $scope.list = [];
    MusicLoader.oncomplete = function() {
      reload($scope);
    };
    MusicLoader.loadLocalMusics();
  };
  $scope.load_music = function(e) {
    var item = e.dataTransfer.items[0];
    if (item) {
      var fileEntry = item.webkitGetAsEntry();
      MusicLoader.addMusics(fileEntry);
    }
    e.preventDefault();
  };
  $scope.dismiss_music = MusicLoader.dismissAllMusics;
  $scope.update = function(info) {
    $scope.info = info;
    delete info; // TODO: I don't like this
    $scope.quota = MusicLoader.quota;
    $scope.usage = MusicLoader.usage;
    $scope.reload($scope);
  };
  MusicLoader.onprogress = $scope.update;
  MusicLoader.oncomplete = function() {
    $scope.quota = MusicLoader.quota;
    $scope.usage = MusicLoader.usage;
    $scope.reload($scope);
  };
  PlayListManager.onprogress = function(info) {
    $scope.info = info;
    delete info;
  };
  MusicLoader.onerror = function() {
    $scope.title = 'Error loading: "'+info.title+'"';
    $scope.reload($scope);
  };
  reload($scope);

  var list = document.querySelector('.app-musiclist');
  list.ondragenter = function(e) {};
  list.ondragleave = function(e) {};
  list.ondragover = function(e) {
    e.preventDefault();
  };
  list.ondrop = $scope.load_music;
});

app.controller('MediaCtrl', function($scope, control) {
  $scope.control = control;
  $scope.index = function() {
    control.cursor = $scope.$index;
  };
  $scope.index_and_play = function() {
    control.cursor = $scope.$index;
    PlayListManager.stop();
    $scope.play($scope.control.cursor);
  };
});