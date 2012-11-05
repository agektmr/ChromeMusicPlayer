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
var audioPlayer = function(entry, endCallback) {
  this.duration = 0;
  this.info = entry;
  this.song_blob_url = window.webkitURL.createObjectURL(entry.file);
  this.player = new Audio(this.song_blob_url);
  this.player.addEventListener('durationchange', (function() {
    this.duration = this.player.duration * 1000;
  }).bind(this));
  if (typeof endCallback === 'function') {
    this.player.addEventListener('ended', endCallback);
  }
  this.timer = null;
};
audioPlayer.prototype = {
  play: function() {
    this.player.play();
  },
  pause: function() {
    this.player.pause();
    clearInterval(this.player.timer);
  }
};

app.controller('MediaControlCtrl', function($scope, control) {
  $scope.player_index = -1;
  $scope.currentTime = 0;
  $scope.progress = 0;
  $scope.control = control;
  $scope.player = null;
  $scope.play_stop_label = 'Play';
  $scope.query = '';
  $scope.stop = function() {
    if ($scope.player) $scope.player.pause();
    $scope.play_stop_label = 'Play';
  };
  $scope.play = function() {
    if ($scope.play_stop_label === 'Stop') {
      $scope.stop();
    } else {
      if ($scope.player_index !== $scope.control.cursor) {
        delete $scope.player;
        $scope.player = new audioPlayer($scope.list[$scope.control.cursor], $scope.stop);
  console.log($scope.player);
        $scope.play_stop_label = 'Stop';
        $scope.player_index = $scope.control.cursor;
        $scope.player.play();
        $scope.player.timer = setInterval(function() {
          $scope.currentTime = $scope.player.player.currentTime * 1000;
          $scope.progress = ~~($scope.currentTime / $scope.player.duration * 100);
          $scope.$apply();
        }, 1000);
      } else if ($scope.player) {
        $scope.play_stop_label = 'Stop';
        $scope.player.play();
      }
    }
  };
  $scope.backward = function() {
    $scope.control.cursor = $scope.player_index >= 0 ? ($scope.player_index-1) : 0;
    $scope.stop();
    $scope.play();
  };
  $scope.forward = function() {
    $scope.control.cursor = $scope.player_index < $scope.list.length ? ($scope.player_index+1) : $scope.list.length;
    $scope.stop();
    $scope.play();
  };
  $scope.volume_change = function() {
    $scope.player.volume_change();
  };
  $scope.list = ChromeMusicPlayer.getMediaList();
  $scope.reload = function() {
    $scope.list = [];
    $scope.loading = true;
    ChromeMusicPlayer.init(function() {
      $scope.loading = false;
      $scope.list = ChromeMusicPlayer.getMediaList();
      $scope.$apply();
    });
  };
});

app.controller('MediaCtrl', function($scope, control) {
  $scope.index = function() {
    control.cursor = $scope.$index;
  };
  $scope.index_and_play = function() {
    control.cursor = $scope.$index;
    $scope.stop();
    $scope.play();
  };
});