var $ = require("./lib/qsa")
var track = require("./lib/tracking");
require("./video");
require("./quiz");
require("./audio");
require("./analytics");

// setup map
require("./map");

var magicMap =  $("div.magic-map")[0];

// setup ice illo animation
var lakeAnimSlide = $.one(".ice-diagram-lake.slide");
var lakeAnimFrames = $(".ice-diagram-lake.slide .frame");
// console.log(lakeAnimFrames)

// setup galveston chart
require("./chart-galveston.js");

var slides = $(".sequence .slide").reverse();
var autoplayWrapper = $.one(".a11y-controls");

var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

var completion = 0;

if (false) "play canplay canplaythrough ended stalled waiting suspend".split(" ").forEach(e => {
  $("video").forEach(v => v.addEventListener(e, console.log));
});

// handle NPR One
var here = new URL(window.location.href);
var renderPlatform = here.searchParams.get("renderPlatform");
var isOne = renderPlatform && renderPlatform.match(/nprone/i);
if (isOne) {
  document.body.classList.add("nprone");
}

var active = null;

var activateSlide = function(slide) {  
  // skip if already in the slide
  if (active == slide) return;
  
  if (active) {

    var exiting = active;
    active.classList.remove("active");
    active.classList.add("exiting");
    setTimeout(() => exiting.classList.remove("exiting"), 1000);
    //also remove magic map depending on slide type
    if(exiting.classList.contains("map-block") && !slide.classList.contains("map-block")) {
      magicMap.classList.remove("active");
      magicMap.classList.add("exiting");      
      setTimeout(() => magicMap.classList.remove("exiting"), 1000);
    }

  } 

  // force video playback
  if (!isOne) $("video[autoplay]", slide).forEach(v => {
    v.currentTime = 1;
    v.play();
  });
  // lazy-load neighboring slides
  var neighbors = [-1, 0, 1, 2];
  var all = $(".sequence .slide");
  var index = all.indexOf(slide);
  neighbors.forEach(function(offset) {
    var neighbor = all[index + offset];
    if (!neighbor) return;
    var images = $("[data-src]", neighbor);
    images.forEach(function(img) {
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
      if (img.dataset.poster) {
        img.poster = img.dataset.poster;
        img.removeAttribute("data-poster");
      }
    })
  });

  slide.classList.add("active");
  slide.classList.remove("exiting");
  //also activate magic map depending on slide type
  if(slide.classList.contains("map-block")) {
    magicMap.classList.add("active");
    magicMap.dataset.name = slide.id;
    magicMap.classList.remove("exiting");
  }

  active = slide;

  // Assuming first (intro) slide is not video
  // if (slide.dataset.type === "video") {
  //   autoplayWrapper.classList.remove("hidden");
  // } else {
  //   autoplayWrapper.classList.add("hidden");
  // }
}

var onScroll = function() {
  for (var i = 0; i < slides.length; i++) {
    var slide = slides[i];    
    var postTitle = i <= 1 ? null : slides[i + 1];
    var isAfterTitleCard = (postTitle && postTitle.classList.contains("titlecard")) ? true : false;
    var bounds = slide.getBoundingClientRect();

    // tweaking slide toggle tolerances if this is the first card after a titlecard
    if (
      (isAfterTitleCard && (bounds.top < window.innerHeight && bounds.bottom > 0)) ||
      (!isAfterTitleCard && (bounds.top < window.innerHeight * .9 && bounds.bottom > 0))
      ) {
      // trigger nepal ice illo animation
      if (slide == lakeAnimSlide && !reducedMotion.matches) {
        lakeAnimFrames = lakeAnimFrames.filter(function(frame, n) {
          var bounds = frame.getBoundingClientRect();
          if (bounds.top < window.innerHeight  * .8) {
            setTimeout(function(){ 
                frame.classList.add('show'); 
              }, n == 0 ? 100 : n * 600);

            if (n < 2) {
              setTimeout(function(){ 
                  frame.classList.remove('show'); 
                }, n == 0 ? 600 : n * 1200);
            }
            return false;
          }
          return true; 
        })
      }

      // galveston sea level estimate charts
      if (slide.id == "chart-estimate") {
        var textBlocks = $("#chart-estimate .text");
        var chartWrapper = $.one("#chart-estimate #line-chart");
        var line2 = document.getElementsByClassName("line2");
        var annot = document.getElementsByClassName("annotations");
        textBlocks.forEach(function(frame, n) {
          var bounds = frame.getBoundingClientRect();
          if (bounds.top < window.innerHeight * .9 && bounds.bottom > 0) {
            frame.classList.add("active");
            chartWrapper.dataset.frame = frame.id;
            
            // if (frame.id == "galveston-chart-1") {
            //   //hide second line part
            //   //hide annotations
            // }
            // //show second line part and continue showing 
            // else if (frame.id == "galveston-chart-2") {
            // }
            // //show annotations
            // else if (frame.id == "galveston-chart-3") {
            // }
          }
        else {
            frame.classList.remove("active");
        }
        });
      }

      var complete = ((slides.length - i) / slides.length * 100) | 0;
      if (complete > completion) {
        completion = complete;
        track("completion", completion + "%");
      }
      return activateSlide(slide);
    }
  }
}

document.body.classList.add("boot-complete");
window.addEventListener("scroll", onScroll);
onScroll();

// link tracking
var trackLink = function() {
  var action = this.dataset.track;
  var label = this.dataset.label;
  track(action, label);
};
$("[data-track]").forEach(el => el.addEventListener("click", trackLink));
