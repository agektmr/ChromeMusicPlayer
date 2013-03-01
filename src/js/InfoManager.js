var InfoManager = (function() {
  var title_ =    '';
  var artist_ =   '';
  var album_ =    '';
  var artwork_ =  '';
  var current_ =  0;
  var duration_ = 0;
  var progress_ = 0;

  var update = function() {
    if (typeof this.onupdate === 'function') {
      this.onupdate();
    }
  };

  return {
    set title (str) {
      title_ = str;
    },
    set artist (str) {
      artist_ = str;
    },
    set album (str) {
      album_ = str;
    },
    set artwork (str) {
      artwork_ = str;
    },
    set current (num) {
      current_ = num;
    },
    set duration (num) {
      duration_ = num;
    },
    set progress (num) {
      progress_ = num;
      update.bind(this)();
    },
    get title () {
      return title_;
    },
    get artist () {
      return artist_;
    },
    get album () {
      return album_;
    },
    get artwork () {
      return artwork_;
    },
    get current () {
      return current_;
    },
    get duration () {
      return duration_;
    },
    get progress () {
      return progress_;
    },
    onupdate: null
  };
})();

var QuotaManager = (function() {
  var quota_ = 0;
  var usage_ = 0;

  var update = function() {
    if (typeof this.onupdate === 'function') {
      this.onupdate();
    }
  };

  return {
    set quota (num) {
      quota_ = num;
    },
    set usage (num) {
      usage_ = num;
      update.bind(this)();
    },
    get quota () {
      return quota_;
    },
    get usage () {
      return usage_;
    },
    onupdate: null
  };
})();