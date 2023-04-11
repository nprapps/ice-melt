var track = require("./lib/tracking");

var onQuizButtonClicked = function(evt) {
  // flag that this question has been answered
  var qParent = this.parentNode.parentNode.parentNode.parentNode;
  qParent.dataset.answered = true;
  qParent.dataset.correct = this.dataset.status;

  // deactivate the buttons
  var qBtns = qParent.querySelectorAll("button");
  qBtns.forEach(function(btn) {
    btn.removeEventListener("click", onQuizButtonClicked);
    btn.disabled = true;
  });

  // flag if you got this right or wrong
  switch(this.dataset.status) {
    case "true":
      this.innerHTML += ` <i>Right!</i>`;
      break;
    case "false":
      this.innerHTML += ` <i>Wrong!</i>`;
      break;
  }

  // track clicks
  track("ice melt quiz clicked", qParent.id, this.dataset.status)

  // smoothscroll to the next slide?
  var nextSlide = document.getElementById(qParent.nextElementSibling.id);
  setTimeout(() => {
    nextSlide.scrollIntoView({ behavior: "smooth" })
  }, 800);
}

var quizSlides = document.querySelectorAll(".quiz");
if (quizSlides.length > 0) {
  var qButtons = document.querySelectorAll(".quiz button");
  qButtons.forEach(function(qb) {
    qb.addEventListener("click", onQuizButtonClicked);
  });
}
