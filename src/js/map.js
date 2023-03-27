var d3 = require("d3");
var enterView = require("enter-view");
var topojson = require("topojson");
require("./map_helpers")


let mapdata;

let width = 800, height = 600;
let mapX=40; // 0 / 360 = Greenwhich England, values increase to the west
let mapY=-45; // -90 = N. Pole; 90 = S. Pole, 0 = equator
let mapscale = 200; // Initial scale, might be better to fit to screen

let transition_milliseconds = 1000;
let svg;
let linebox;

var outline;
var grid;
var feature ;
var land;
var lines;
var lines_drawn = false;
let segments_visible = [1,];

var sphere = ({type: "Sphere"});

// parameter for simplification, slider at https://observablehq.com/d/bb265e5f8575d2b6 
var minArea = 1;

let projection = d3.geoOrthographic().precision(0.1);

let geoGenerator = d3.geoPath()
.projection(projection);

let graticule = d3.geoGraticule10()

var oldOnload = window.onload;
window.onload = (typeof window.onload != 'function') ? addDiscreteListeners : function() { oldOnload(); addDiscreteListeners(); };

function addDiscreteListeners() {
	console.log("addDiscreteListeners");
	initialize_map();

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


// zoomto expects scale,lat,lng where n is lat<0
var updateMap = {
	mapStepOne: function () {
		zoomto(300, -45, 40)
	},
	mapStepOneBackwards: function () {
		zoomto(200, -45, 40, -1)

	},
	mapStepTwo: function () {
		segments_visible = [1];
		drawlines();
		zoomto(400, -45, 40, 1)

	},
	mapStepTwoBackwards: function () {
		hidelines();
		zoomto(300, -45, 40, -1)
	},
	mapStepThree: function () {
		segments_visible = [1,2];
		zoomto(500, -60, 20, 2)
	},
	mapStepThreeBackwards: function () {
		segments_visible = [1];
		zoomto(400, -45, 40, -1)
	},
	mapStepFour: function () {
		segments_visible = [1,2,3];
		zoomto(500, -65, 25, 3)
	},
	mapStepFourBackwards: function () {
		segments_visible = [1,2];
		zoomto(500, -60, 20, -1)
	},
	mapStepFive: function () {
		segments_visible = [1,2,3,4];
		zoomto(500, -40, 30, 4)
	},
	mapStepFiveBackwards: function () {
		segments_visible = [1,2,3];
		zoomto(500, -65, 25, -1)
	},
	mapStepSix: function () {
		segments_visible = [1,2,3,4,5];
		zoomto(500, -40, 30, 5)
	},
	mapStepSixBackwards: function () {
		segments_visible = [1,2,3,4];
		zoomto(500, -60, 20, -1)

	}
}




function initialize_map() {

	d3.json('./assets/land-110m.json').then(function(mapdata) {
		svg = d3.select("#innerSVG")
		    .attr("viewBox", [0, 0, width , height])
		    .attr("fill", "none")
		    .attr("stroke", "currentColor")
		    .attr("width", "100%")
		    .attr("height", "100%");


		svg.append("rect")
    		.style("fill", "white")
    		.attr('x', -400) 
            .attr('y', -400) 
    		.attr("width", 5000)
    		.attr("height", 5000);
		

	applyPencilFilterTextures(svg);  

	  outline = svg.append("path")  
	    .attr("fill","white")
	  
	  grid = svg.append("path")
	    .attr("stroke-width","0.5px")
	    .attr("stroke","#ddd")
	    //.attr("filter", "url(#pencilTexture4");
	  
	  feature = svg.append("path")
	  	.attr("stroke","#000")
	    .attr("stroke-width", "3px")
	    .attr("fill","#eeeeee")
	    //.attr("filter", "url(#pencilTexture3");


	  let topology = mapdata;

	  topology = topojson.presimplify(topology);
	  topology = topojson.simplify(topology, minArea);

	  land = topojson.feature(topology, topology.objects.land);

	  d3.json('./assets/lines_s_p.geojson').then(function(linesRaw) {
	    linebox = svg.append("g").attr("id","lineBox");
	    lines = linebox.selectAll(".lines")
	      .data(linesRaw.features.reverse())
	        .join("path")
	        .attr("class",d => `lines ${d.properties.class}`)
	    setmap(mapscale, mapX, mapY);
	  }); 


	});
}

function geoCurvePath(curve, projection, context) {
	  return object => {
	    const pathContext = context === undefined ? d3.path() : context;
	    d3.geoPath(projection, curveContext(curve(pathContext)))(object);
	    return context === undefined ? pathContext + "" : undefined;
	  };
}

function curveContext(curve) {
	  return {
	    moveTo(x, y) {
	      curve.lineStart();
	      curve.point(x, y);
	    },
	    lineTo(x, y) {
	      curve.point(x, y);
	    },
	    closePath() {
	      curve.lineEnd();
	    }
	  };
}

var path = geoCurvePath(d3.curveBasisClosed, projection);
var path2 = geoCurvePath(d3.curveLinear, projection);

function linepath(arg, segments_visible, segment_tweened_in_id, tween_arg) {

	if (segments_visible.includes(arg.properties.id)) {

		if ( arg.properties.id == segment_tweened_in_id) {
			var num_coords = arg.geometry.coordinates.length;
			var desired_coordinate_count = Math.floor(num_coords * tween_arg);
			// can we afford this? 
			var arg_copy = JSON.parse(JSON.stringify(arg));
			arg_copy.geometry.coordinates = arg_copy.geometry.coordinates.slice(0, desired_coordinate_count);

			return path2(arg_copy);
		} else {
			return path2(arg);	
		}
	} 
}

function drawlines() {
	lines.attr("d", d => d);
	lines_drawn = true;
}

function hidelines() {
	  lines_drawn = false;
	  lines.attr("d", d => 0);
}


function setmap(map_scale, map_lat, map_lng, segment_tweened_in_id=-1, tween_arg=1) {

	projection.scale(map_scale);
 	projection.rotate([map_lat, map_lng])
  projection.translate([width / 2, height / 2]) 

  	mapX = map_lng;
 	 mapY = map_lat;
  	mapscale = map_scale;

  	grid.attr("d", path(graticule));
  	outline.attr("d", path(sphere));
  	feature.attr("d", path(land));
  	if (lines_drawn) {
  		lines.attr("d", d => linepath(d, segments_visible, segment_tweened_in_id, tween_arg))
  		}
}

function interpolate(x0, x1, t) {
  return (x0 + t*(x1-x0));
}

async function zoomto(mapScale, newmaplat, newmapY, segment_tweened_in_id) {
  currentMapX = mapX;
  currentMapY = mapY;
  console.log("-zoomfrom-  currentMapX " + currentMapX + " currentMapY " + currentMapY); 
  console.log("-zoomto-  newmaplat" + newmaplat + " newmaplng " + newmapY); 
  await d3.transition()
        .duration(transition_milliseconds)
        .tween("render", () => t => {
          setmap(interpolate(mapscale, mapScale, t), interpolate(currentMapY, newmapY, t), interpolate(currentMapX, newmaplat, t), segment_tweened_in_id, t);
        })
      .end();
}

function rundemo() {
  console.log("\nRun transition");

  var newmapY = 10+100*Math.random();
  var newmaplat = -20-50*Math.random();

  zoomto(mapscale, newmaplat, newmapY);

}


// MUCH OF THIS CAN BE REMOVED 
function applyPencilFilterTextures(svg) {
  
  const defs = svg.append("defs");

  // Add back if there are arrowheads
  //defs.html(arrowHead)

  var roughPaper = defs.append("filter");

  roughPaper
    .attr("x", "0%")
    .attr("y", "0%")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("filterUnits", "objectBoundingBox")
    .attr("id", "roughPaper");
  roughPaper.append("feTurbulence")
    .attr("type", "fractalNoise")
    .attr("baseFrequency", "128")
    .attr("numOctaves", "1")
    .attr("result", "noise");
  var diffLight = roughPaper.append("feDiffuseLighting");
  diffLight
    .attr("in", "noise")
    .attr("lighting-color", "white")
    .attr("surfaceScale", "1")
    .attr("result", "diffLight");
  diffLight.append("feDistantLight")
    .attr("azimuth", "45")
    .attr("elevation", "55");
  roughPaper.append("feGaussianBlur")
    .attr("in", "diffLight")
    .attr("stdDeviation", "0.75")
    .attr("result", "dlblur");
  roughPaper.append("feComposite")
    .attr("operator", "arithmetic")
    .attr("k1", "1.2")
    .attr("k2", "0")
    .attr("k3", "0")
    .attr("k4", "0")
    .attr("in", "dlblur")
    .attr("in2", "SourceGraphic")
    .attr("result", "out");

  var pencilTexture = defs.append("filter")
  .attr("x", "-2%")
  .attr("y", "-2%")
  .attr("width", "104%")
  .attr("height", "104%")
  .attr("filterUnits", "objectBoundingBox")
  .attr("id", "pencilTexture")
  pencilTexture.append("feTurbulence")
    .attr("type", "fractalNoise")
    .attr("baseFrequency", "1.2")
    .attr("numOctaves", "3")
    .attr("result", "noise")
  pencilTexture.append("feDisplacementMap")
    .attr("xChannelSelector", "R")
    .attr("yChannelSelector", "G")
    .attr("scale", "3")
    .attr("in", "SourceGraphic")
    .attr("result", "newSource");

  var pencilTexture2 = defs.append("filter")
  .attr("x", "0%")
  .attr("y", "0%")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("filterUnits", "objectBoundingBox")
  .attr("id", "pencilTexture2");
  pencilTexture2.append("feTurbulence")
    .attr("type", "fractalNoise")
    .attr("baseFrequency", 2)
    .attr("numOctaves", 5)
    .attr("stitchTiles", "stitch")
    .attr("result", "f1");
  pencilTexture2.append("feColorMatrix")
    .attr("type", "matrix")
    .attr("values", "0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 -1.5 1.5")
    .attr("result", "f2");
  pencilTexture2.append("feComposite")
    .attr("operator", "in")
    .attr("in2", "f2")
    .attr("in", "SourceGraphic")
    .attr("result", "f3");
  var pencilTexture3 = defs.append("filter")
  .attr("x", "-40%")
  .attr("y", "-40%")
  .attr("width", "140%")
  .attr("height", "140%")
  .attr("filterUnits", "objectBoundingBox")
  .attr("id", "pencilTexture3");
  pencilTexture3.append("feTurbulence")
    .attr("type", "fractalNoise")
    .attr("baseFrequency", 0.5)
    .attr("numOctaves", 5)
    .attr("stitchTiles", "stitch")
    .attr("result", "f1");
  pencilTexture3.append("feColorMatrix")
    .attr("type", "matrix")
    .attr("values", "0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 -1.5 1.5")
    .attr("result", "f2");
  pencilTexture3.append("feComposite")
    .attr("operator", "in")
    .attr("in2", "f2")
    .attr("in", "SourceGraphic")
    .attr("result", "f3");
  pencilTexture3.append("feTurbulence")
    .attr("type", "fractalNoise")
    .attr("baseFrequency", 1.2)
    .attr("numOctaves", 3)
    .attr("result", "noise");
  pencilTexture3.append("feDisplacementMap")
    .attr("xChannelSelector", "R")
    .attr("yChannelSelector", "G")
    .attr("scale", 2.5)
    .attr("in", "f3")
    .attr("result", "f4");
  var pencilTexture4 = defs.append("filter")
  .attr("x", "-20%")
  .attr("y", "-20%")
  .attr("width", "140%")
  .attr("height", "140%")
  .attr("filterUnits", "objectBoundingBox")
  .attr("id", "pencilTexture4");
  pencilTexture4.append("feTurbulence")
    .attr("type", "fractalNoise")
    .attr("baseFrequency", 0.03)
    .attr("numOctaves", 3)
    .attr("seed", 1)
    .attr("result", "f1");
  pencilTexture4.append("feDisplacementMap")
    .attr("xChannelSelector", "R")
    .attr("yChannelSelector", "G")
    .attr("scale", 5)
    .attr("in", "SourceGraphic")
    .attr("in2", "f1")
    .attr("result", "f4");
  pencilTexture4.append("feTurbulence")
    .attr("type", "fractalNoise")
    .attr("baseFrequency", 0.03)
    .attr("numOctaves", 3)
    .attr("seed", 10)
    .attr("result", "f2");
  pencilTexture4.append("feDisplacementMap")
    .attr("xChannelSelector", "R")
    .attr("yChannelSelector", "G")
    .attr("scale", 5)
    .attr("in", "SourceGraphic")
    .attr("in2", "f2")
    .attr("result", "f5");
  pencilTexture4.append("feTurbulence")
    .attr("type", "fractalNoise")
    .attr("baseFrequency", 1.2)
    .attr("numOctaves", 2)
    .attr("seed", 100)
    .attr("result", "f3");
  pencilTexture4.append("feDisplacementMap")
    .attr("xChannelSelector", "R")
    .attr("yChannelSelector", "G")
    .attr("scale", 3)
    .attr("in", "SourceGraphic")
    .attr("in2", "f3")
    .attr("result", "f6");
  pencilTexture4.append("feBlend")
    .attr("mode", "multiply")
    .attr("in2", "f4")
    .attr("in", "f5")
    .attr("result", "out1");
  pencilTexture4.append("feBlend")
    .attr("mode", "multiply")
    .attr("in", "out1")
    .attr("in2", "f6")
    .attr("result", "out2");
}
