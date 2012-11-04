var audioPlayer = function(entry) {
  this.info = entry;
  this.song_blob_url = window.webkitURL.createObjectURL(entry.file);
  this.player = new Audio(this.song_blob_url);
  this.timer = null;
};
audioPlayer.prototype = {
  play: function() {
    this.player.play();
  },
  pause: function() {
    this.player.pause();
  }
};

app.controller('MediaControlCtrl', function($scope, control) {
  $scope.player_index = -1;
  $scope.control = control;
  $scope.player = null;
  $scope.play_stop_label = 'Play';
  $scope.stop = function() {
    if ($scope.player) $scope.player.pause();
    $scope.play_stop_label = 'Play';
  }
  $scope.play_stop = function() {
    if ($scope.play_stop_label === 'Stop') {
      $scope.stop();
    } else {
      if ($scope.player_index !== $scope.control.cursor) {
        delete $scope.player;
        $scope.player = new audioPlayer($scope.list[$scope.control.cursor]);
  console.log($scope.player);
        $scope.play_stop_label = 'Stop';
        $scope.player_index = $scope.control.cursor;
        $scope.player.play();
      } else if ($scope.player) {
        $scope.play_stop_label = 'Stop';
        $scope.player.play();
      }
    }
  };
  $scope.backward = function() {

  };
  $scope.forward = function() {

  };
  $scope.volume_change = function() {
    $scope.player.volume_change();
  };
  $scope.list = [];
  $scope.reload = function() {
    $scope.list = [];
    ChromeMusicPlayer.init(function() {
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
    $scope.play_stop();
  };
});