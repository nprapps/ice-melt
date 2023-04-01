let ii = 0;

var d3 = require("d3");
var enterView = require("enter-view");
var topojson = require("topojson");

let mapdata;

let width = 800, height = 600;
let mapX=40; // 0 / 360 = Greenwich England, values increase to the west
let mapY=-45; // -90 = N. Pole; 90 = S. Pole, 0 = equator
let mapscale = 200; // Initial scale, might be better to fit to screen

let transition_milliseconds = 1000;
let svg;
let linebox;
let activeSlide;
let prevSlide;

var outline;
var grid;
var feature ;
var land;
var lines;
var lines_drawn = false;
let segments_visible = [1,];

let showTools = false;

var sphere = ({type: "Sphere"});

// parameter for simplification, slider at https://observablehq.com/d/bb265e5f8575d2b6 
var minArea = 1;

let projection = d3.geoOrthographic().precision(0.1);

let geoGenerator = d3.geoPath().projection(projection);

let graticule = d3.geoGraticule10();

var oldOnload = window.onload;
window.onload = (typeof window.onload != 'function') ? addDiscreteListeners : function() { oldOnload(); addDiscreteListeners(); };

function addDiscreteListeners() {
	initialize_map();
	var stepSel = d3.selectAll(".discrete");
	enterView({
		selector: stepSel.nodes(),
		offset: 0,
		enter: el => {
			const index = d3.select(el).attr('forward');

      prevSlide = activeSlide;
      activeSlide = d3.select(el).attr("slide");

      console.log("----------enter-----------")
      console.log("leaving " + prevSlide )
      console.log("entering " + activeSlide)
      
      updateMap("forward",activeSlide);

      changeLabels(prevSlide,activeSlide)
		},
		exit: el => {       
			let index = d3.select(el).attr('backward');

      activeSlide = el.parentNode.previousElementSibling.id;
      prevSlide = d3.select(el).attr("slide");
      
      console.log("----------exit-----------")
      console.log("leaving " + prevSlide )
      console.log("entering " + activeSlide)      

			//check for multiple
			if (!index.includes(" ")) {
        if (activeSlide) {
				  updateMap("backward",activeSlide);
        }
			} else {
				var indexes = index.split(" ");
        console.log("you somehow have multiple indexes?????????/")
        console.log(indexes)
				// for (var i of indexes) {
				// 	updateMap[i]();
				// }
			}

      // don't run changeLabels on non-map
      if (activeSlide) {
        changeLabels(prevSlide,activeSlide)
      }      
		}
	});
}


// zoomto expects scale,lat,lng where n is lat<0
function updateMap(direction,config){
  var activeMapData = MAP_DATA.find(e => e.sceneID == config);
  
  var {zoom,lon,lat,linesPresent, linesActive} = activeMapData;
  
  // get zoom
  // get lat long
  // has Segments? 
  // call zoomto  
  segments_visible = Number.isInteger(linesPresent) ? [linesPresent] : linesPresent.split(",").map( Number );

  linesActive = Number.isInteger(linesActive) ? [linesActive] : linesActive.split(",").map(Number);

  if (ii == 0) {
    drawlines();  
    ii++;
  }
  if (direction == "backward") {
   linesActive = [-1] 
  }
  zoomto(zoom,lat,lon,linesActive)
}

function runManualTransition() {
	var newlat = document.getElementById('control_lat').value;
	if (newlat < -90 || newlat > 90) {
		alert("Latitude must be between -90 (north) and 90 (south)");
		return false;
	}
	var newlng = document.getElementById('control_lng').value;
	var newzoom = document.getElementById('control_zoom').value;
	zoomto(newzoom, newlat, newlng, [-1])

	var showlines = document.getElementById('control_overlays').value == 'lines';

	if (showlines && !lines_drawn) {
		drawlines();
	}
	if (!showlines && lines_drawn) {
		hidelines();
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

	  outline = svg.append("path")  
	    .attr("fill","white")
	  
	  grid = svg.append("path")
	    .attr("stroke-width","0.5px")
	    .attr("stroke","#ddd")


	  feature = svg.append("path")
	  	.attr("stroke","#000")
	    .attr("stroke-width", "3px")
	    .attr("fill","#eeeeee")

    linebox = svg.append("g").attr("id","lineBox");

    labelBox = svg.append("g")
      .attr("id","labelBox");

    labels = labelBox.selectAll(".label")
      .data(MAP_LABELS).join("text")
        .attr("class",d => `label ${d.classes.split(",").join(" ")}`)
        .attr("id",d => d.id)
        .text(d => d.label)        

	  let topology = mapdata;
	  topology = topojson.presimplify(topology);
	  topology = topojson.simplify(topology, minArea);
	  land = topojson.feature(topology, topology.objects.land);

	  d3.json('./assets/lines_s_p.geojson').then(function(linesRaw) {
      
	    lines = linebox.selectAll(".lines")
	      .data(linesRaw.features.reverse())
	        .join("path")
	        .attr("class",d => `lines ${d.properties.class}`)

	    setmap(mapscale, mapX, mapY);
	  }); 
	});

	// Setup tooling if the controls are present only
	var controldiv = document.getElementById("controls");
	if(controldiv) {
	    controlbutton = document.getElementById("controlsubmit");
	    controlbutton.onclick = runManualTransition;
	    showTools = true;
	}
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
    if (segment_tweened_in_id.includes(arg.properties.id)) {
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
	lines.attr("d", d => d)

	lines_drawn = true;
	if (showTools) {
	  document.getElementById('control_overlays').value = 'lines';
	 }
}

function hidelines() {
	  lines_drawn = false;
	  lines.attr("d", d => 0);
	  if (showTools) {
	  	document.getElementById('control_overlays').value = 'none';
	  }
}


function setmap(map_scale, map_lat, map_lng, segment_tweened_in_id=[-1], tween_arg=1) {

	projection.scale(map_scale);
 	projection.rotate([map_lat, map_lng])
	projection.translate([width / 2, height / 2]) 

	mapX = map_lng;
	  mapY = map_lat;

	mapscale = map_scale;

	grid.attr("d", path(graticule));
	outline.attr("d", path(sphere));
	feature.attr("d", path(land));

  labels.attr("transform", d => `translate(${projection([d.lon,d.lat])})`)
    .attr("dy", ".35em")

	if (lines_drawn) {
		lines.attr("d", d => linepath(d, segments_visible, segment_tweened_in_id, tween_arg))
	}
}

function interpolate(x0, x1, t) {
  return (x0 + t*(x1-x0));
}

async function zoomto(newmapScale, newmaplat, newmapY, segment_tweened_in_id) {
  currentMapX = mapX;
  currentMapY = mapY;

  console.log("-zoomfrom-  currentMapX " + currentMapX + " currentMapY " + currentMapY); 
  console.log("-zoomto-  newmaplat" + newmaplat + " newmaplng " + newmapY); 

  await d3.transition()
        .duration(transition_milliseconds)
        .tween("render", () => t => {
          setmap(interpolate(mapscale, newmapScale, t), interpolate(currentMapY, newmapY, t), interpolate(currentMapX, newmaplat, t), segment_tweened_in_id, t);
        })
      .end();
  if (showTools) {
   	document.getElementById('control_lat').value = newmaplat;
		document.getElementById('control_lng').value = newmapY;
		document.getElementById('control_zoom').value = newmapScale;

  }
}

function changeLabels(prevSlide,activeSlide) {
  var activeMapData = MAP_DATA.find(e => e.sceneID == activeSlide);

  // get labels you need
  var activeLabels = activeMapData.labels.replace(/\s/g, '').split(",");
  
  d3.selectAll("#labelBox text").classed("active",false)

  // show and hide labels and highlights based on if active
  for (var i = 0; i < activeLabels.length; i++) {

    let item = d3.select(`#labelBox text#${activeLabels[i]}`);

    item.classed("active",true)

  }
}

