// informed by: https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery/Cross-browser_audio_basics

var track = require("./lib/tracking");

var playAudio = function(evt) {
  var p = this.closest("figure.audio");
  var player = p.querySelector("audio");
  player.load();
  player.play();
  p.dataset.status = "play";

  track("audio-play", p.parentNode.parentNode.id);
}

var pauseAudio = function() {
  var p = this.closest("figure.audio");
  var player = p.querySelector("audio");
  player.pause();
  p.dataset.status = "pause";
}

var resetPlayer = function() {
  var p = this.closest("figure.audio");
  var player = p.querySelector("audio");
}

var audioSlides = document.querySelectorAll("figure.audio");
if (audioSlides.length > 0)  {
  audioSlides.forEach(function(s) {
    // assumption: a single slide can have no more than one audio player

    // set up play buttons
    var btnPlay = s.querySelector("button.play");
    var btnPause = s.querySelector("button.pause");

    btnPlay.addEventListener("click", playAudio);
    btnPause.addEventListener("click", pauseAudio);

    // init audio
    var a = s.querySelector("audio");

    // display audio duration onload
    // a.addEventListener("loadedmetadata", (evt) => {
    //   var p = evt.target.closest("figure.audio");
    //   var counter = p.querySelector("div.counter");
    //   counter.innerHTML = Math.round(evt.target.duration) + " sec.";
    // });

    // when playing, show time remaining
    a.addEventListener("timeupdate", (evt) => {
      var durationPreset = parseInt(evt.target.dataset.duration);

      var p = evt.target.closest("figure.audio");
      var currentTime = evt.target.currentTime;
      var duration = evt.target.duration;
      if (duration == Infinity || isNaN(duration)) {
        duration = durationPreset;
      }
      var remainingTime = Math.round(duration - currentTime);
      var counter = p.querySelector("div.counter");
      counter.innerHTML = `${ remainingTime } sec. remaining`;
    });

    // when audio is over, reset
    a.addEventListener("ended", (evt) => {
      var p = evt.target.closest("figure.audio");

      var counter = p.querySelector("div.counter");
      counter.innerHTML = evt.target.dataset.duration;

      var caption = p.querySelector(".caption");
      caption.innerHTML = "";

      p.dataset.status = "pause";

      track("audio-complete", p.parentNode.parentNode.id);
    });

    // set up captions
    var aTrack = a.querySelector("track");
    aTrack.mode = "showing";
    aTrack.addEventListener("cuechange", (evt) => {
      var track = evt.target.track;
      var [ cue ] = track.activeCues;

      // console.log(cue);
      if (cue) {
        var p = evt.target.closest("figure.audio");
        var caption = p.querySelector(".caption");
        caption.innerHTML = cue.text;
      }
    })
    // a.audioTrackList.addEventListener("addtrack", (evt) => {
    //   console.log("addtrack", evt);
    // });
    // a.audioTrackList.addEventListener("removetrack", (evt) => {
    //   console.log("removetrack", evt);
    // });

  });
}
