var d3 = require("d3");
var enterView = require("enter-view");


function addDiscreteListeners() {
	var stepSel = d3.selectAll(".discrete");

	enterView({
		selector: stepSel.nodes(),
		offset: 0,
		enter: el => {
			const index = d3.select(el).attr('forward');
			updateMap[index]();
		},
		exit: el => {
			let index = d3.select(el).attr('backward');
			//check for multiple
			if (!index.includes(" ")) {
				console.log("updateMap[index]() with index  " + index);
				updateMap[index]();
			} else {
				var indexes = index.split(" ");
				for (var i of indexes) {
					updateMap[i]();
				}
			}
		}
	});
}

var updateMap = {
	beforeMap: function () {
		console.log("updateMap: beforeMap");
	},
	firstView: function () {
		console.log("updateMap: firstView");
	},
	zoomStepOne: function () {
		console.log("updateMap: zoomStepOne");
	},
	zoomStepOneBackwards: function () {
		console.log("updateMap: zoomStepOneBackwards");
	}
}


var oldOnload = window.onload;
window.onload = (typeof window.onload != 'function') ? addDiscreteListeners : function() { oldOnload(); addDiscreteListeners(); };