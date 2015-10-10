var modSelectedColor = require('./selected-color.js');

exports.minCircleRadius = 20;
var ssCircleCy = exports.minCircleRadius * 2 - 16; // ShapeSelectionCircleCy
exports.minRectSide =
  Math.sqrt(Math.PI * exports.minCircleRadius * exports.minCircleRadius);
exports.sssw = exports.minCircleRadius * 4 + 23; // Shape Selection Svg Width
var sssh = exports.minCircleRadius * 13; // Shape Selection Svg Height
exports.minEllipseRx = 25;
exports.minEllipseRy = 17;
exports.esEdgeX1 = exports.sssw / 5 - 20;
exports.shape = 'circle';

var ssRectangleY = 49; // "ss" -> shape selection
var ssDiamondY = 16;
var ssEllipseCy = 154;
var ssNoBorderXformY = 163;

var selectShape = function(d3, selectedElt, shapeSelection) {
  d3.selectAll(".shapeSelection").style("stroke", modSelectedColor.unselected)
    .classed({"sel": false, "unsel": true});
  d3.select("#noBorderSelection")
    .style("fill", modSelectedColor.unselected)
    .style("stroke", "none");
  selectedElt.style("stroke", modSelectedColor.clr).classed({"sel": true, "unsel": false});
  if (shapeSelection === "noBorder") {
    selectedElt.style("fill", modSelectedColor.clr).style("stroke", "none");
  }
  exports.shape = shapeSelection;
};

var addShapeSelectionShapes = function(d3) {
  var data = [{"shape": "circle", "id": "circleSelection"},
              {"shape": "rect", "id": "rectangleSelection"},
              {"shape": "rect", "id": "diamondSelection"},
              {"shape": "ellipse", "id": "ellipseSelection"},
              {"shape": "polygon", "id": "starSelection"},
              {"shape": "text", "id": "noBorderSelection"}];
  d3.select("#shapeSelectionSvg").selectAll(".shapeSelection")
    .data(data)
    .enter().append(function(d) {
      return document.createElementNS("http://www.w3.org/2000/svg", d.shape);
    })
      .attr("id", function(d) { return d.id; })
      .classed("shapeSelection", true)
      .style("stroke", function(d) {
        return d.shape === "circle" ? modSelectedColor.clr : modSelectedColor.unselected;
      })
      .style("stroke-width", 2)
      .classed("sel", function(d) { return (d.id === "circleSelection"); })
      .classed("unsel", function(d) { return (d.id !== "circleSelection"); })
      .on("click", function(d) {
        selectShape(d3, d3.select(this), d.id.substring(0, d.id.length - 9));
      });
};

// dillieodigital.wordpress.com/2013/01/16/quick-tip-how-to-draw-a-star-with-svg-and-javascript/
var calculateStarPoints = function(ctrX, ctrY, arms, outerRadius, innerRadius) {
  var results = "";
  var angle = Math.PI / arms;
  var rotation = Math.PI / (10 / 3.0); // 1st point up (-y) rather than on the +x axis
  var r, currX, currY;
  var i;
  for (i = 0; i < 2 * arms; i++) {
    r = (i % 2) ? innerRadius : outerRadius; // Alternate outer and inner radii
    currX = ctrX + Math.cos(i * angle + rotation) * r;
    currY = ctrY + Math.sin(i * angle + rotation) * r;
    results += (i > 0) ? ", " + currX + "," + currY : currX + "," + currY;
  }
  return results;
};

var setShapeSelectionShapeSizes = function(d3) {
  d3.select("#circleSelection")
    .attr("r", exports.minCircleRadius)
    .attr("cx", exports.sssw / 2)
    .attr("cy", ssCircleCy);
  d3.select("#rectangleSelection")
    .attr("width", exports.minRectSide)
    .attr("height", exports.minRectSide - 5)
    .attr("x", exports.sssw / 2.0  - exports.minRectSide + 17)
    .attr("y", ssRectangleY);
  d3.select("#diamondSelection")
    .attr("width", exports.minRectSide)
    .attr("height", exports.minRectSide)
    .attr("transform", "rotate(45," + exports.minRectSide * 2 + ","
                                    + ssDiamondY + ")")
    .attr("x", exports.sssw / 2.0 + 53)
    .attr("y", ssDiamondY + 62);
  d3.select("#ellipseSelection")
    .attr("cx", exports.sssw / 2)
    .attr("cy", ssEllipseCy)
    .attr("rx", exports.minEllipseRx)
    .attr("ry", exports.minEllipseRy);
  var starCtrX = exports.minEllipseRx * 2;
  var starCtrY = ssNoBorderXformY + exports.minRectSide * 0.7 + 18;
  d3.select("#starSelection")
    .attr("x", starCtrX)
    .attr("y", starCtrY)
    .attr("points", calculateStarPoints(starCtrX, starCtrY, 5, 30, 15));
  d3.select("#noBorderSelection")
    .attr("x", exports.minEllipseRx * 2)
    .attr("y", ssNoBorderXformY + exports.minRectSide * 0.7 + 58)
    .style("fill", modSelectedColor.unselected)
    .style("stroke", "none")
    .attr("text-anchor","middle")
    .text("no border");
};

// For star shapes.
var computeInnerRadius = function(pointArray) {
  var innerPoint = pointArray[1].split(",");
  var x = parseFloat(innerPoint[0]);
  var y = parseFloat(innerPoint[1]);
  return Math.sqrt(x * x + y * y);
};

exports.addShapeSelection = function(d3) {
  d3.select("#toolbox").insert("div", ":first-child")
    .attr("id", "shapeSelectionDiv");
  d3.select("#shapeSelectionDiv").append("svg")
    .attr("id", "shapeSelectionSvg")
    .attr("width", exports.sssw)
    .attr("height", sssh)
  // Hack: doubling xmlns: so it doesn't disappear once in the DOM
    .attr({"xmlns": "http://www.w3.org/2000/svg",
           "xmlns:xmlns:xlink": "http://www.w3.org/1999/xlink",
           version: "1.1"
          });
  addShapeSelectionShapes(d3);
  setShapeSelectionShapeSizes(d3);
};

// Set shape size and position, to stored value[s] if they exist, or else to
// fit text.
exports.setShapeSizeAndPosition = function(d3, gEl, el, d) {
  var textSize = el.node().getBBox();
  var rectWidth = Math.max(textSize.width, exports.minRectSide);
  var rectHeight = Math.max(textSize.height, exports.minRectSide);
  var maxTextDim = Math.max(textSize.width, textSize.height);
  var innerRadius = Math.max(14, maxTextDim * 0.6);
  var minDiamondDim = 45;
  var w, h; // for handle translation

  gEl.select(".circle")
     .attr("r", function(d) {
       return d.r || Math.max(maxTextDim / 2 + 8, exports.minCircleRadius);
     });
  gEl.select(".rectangle, .noBorder")
     .attr("width", function(d) {
       w = d.width || rectWidth + 6;
       return w;
     })
     .attr("height", function(d) { // Assume d.width is undefined when we want shrinkwrap
       h = d.height || rectHeight + 4;
       return h;
     })
     .attr("x", function(d) { // Don't check for d.x: that's always there anyway
        var newX = d.manualResize
                 ? -d.xOffset
                 : (d.width ? -d.width / 2 : -rectWidth / 2 - 3);
       return newX;
     })
     .attr("y", function(d) {
       var textAdjust = 1;
        var newY = d.manualResize
                 ? -d.yOffset
                 : (d.width ? -d.height / 2 - textAdjust : -rectHeight / 2 - textAdjust);
       return newY;
     });

  var handle = d3.select("#handle" + d.id);
  if (handle.node()) {
    handle.attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")");
  }

  gEl.select(".diamond")
     .attr("d", function(d) {
       var dim = d.dim || Math.max(maxTextDim * 1.6, minDiamondDim);
       return "M " + dim / 2 + " 0 L " + dim + " " + dim / 2 + " L " + dim / 2 + " " + dim
         + " L 0 " + dim / 2 + " Z";
     })
     .attr("transform", function (d) {
       var dim = d.dim || Math.max(maxTextDim * 1.6, minDiamondDim);
       return "translate(-" + dim / 2 + ",-" + dim /2 + ")";
     });
  gEl.select("ellipse")
     .attr("rx", function(d) {
       return d.rx || Math.max(textSize.width / 2 + 20, exports.minEllipseRx);
     })
     .attr("ry", function(d) {
       return d.ry || Math.max(textSize.height / 2 + 17, exports.minEllipseRy);
     });
  gEl.select("polygon")
     .attr("points", function(d) {
       return d.innerRadius
         ? calculateStarPoints(0, 0, 5, d.innerRadius * 2, d.innerRadius)
         : calculateStarPoints(0, 0, 5, innerRadius * 2, innerRadius);
     })
};

exports.equalizeSelectedShapeSize = function(d3, shape) {
  var thisGraph = this;
  var selectedClassName = "." + shape;
  var selectedShapes = d3.selectAll(selectedClassName);
  var rMax = 0;             // circle
  var wMax = 0, hMax = 0;   // rectangle, noBorder
  var dMax = 0;             // diamond
  var rxMax = 0, ryMax = 0; // ellipse
  var innerRadius = 0;      // star

  selectedShapes.each(function(d) { // Get max dimensions for "shape" in the current graph
    var thisShapeElt = d3.select(this);
    switch (d.shape) {
      case "circle":
        rMax = Math.max(rMax, thisShapeElt.attr("r"));
        break;
      case "rectangle":
      case "noBorder":
        if (!d.manualResize) { // Ignore Manually Resized Rectangles
          wMax = Math.max(wMax, thisShapeElt.attr("width"));
          hMax = Math.max(hMax, thisShapeElt.attr("height"));
        }
        break;
      case "diamond":
        var pathArray = thisShapeElt.attr("d").split(" ");
        var dim = parseFloat(pathArray[4], 10);
        dMax = Math.max(dMax, dim);
        break;
      case "ellipse":
        rxMax = Math.max(rxMax, thisShapeElt.attr("rx"));
        ryMax = Math.max(ryMax, thisShapeElt.attr("ry"));
        break;
      case "star":
        var thisInnerRadius = computeInnerRadius(thisShapeElt.attr("points")
      .split(" "));
        innerRadius = Math.max(thisInnerRadius, innerRadius);
        break;
      default:
        alert("selectedShapes.each(): unknown shape \"" + d.shape + "\"");
    }
  });

  switch (shape) { // Apply max dimensions previously acquired to all instances of "shape"
    case "circle":
      selectedShapes.attr("r", rMax);
      break;
    case "rectangle":
    case "noBorder":
      // Don't include Manually Resized Rectangles in the shape size equalization process:
      var nonMRRs = selectedShapes.filter(function(element, index, array) {
        return !element.manualResize;
      });
      nonMRRs.attr("width", wMax)
                    .attr("height", hMax)
                    .attr("x", -wMax / 2)
                    .attr("y", -hMax / 2 - 4);
      break;
    case "diamond":
      selectedShapes.attr("d", function() {
        return "M " + dMax / 2 + " 0 L " + dMax + " " + dMax / 2 + " L " + dMax / 2 + " " + dMax
                    + " L 0 " + dMax / 2 + " Z";
      })
      .attr("transform", function () { return "translate(-" + dMax / 2 + ",-" + dMax /2 + ")"; });
      break;
    case "ellipse":
      selectedShapes.attr("rx", rxMax).attr("ry", ryMax);
      break;
    case "star":
      selectedShapes.attr("points",
        modSelectedShape.calculateStarPoints(0, 0, 5, innerRadius * 2, innerRadius));
      break;
    default:
      alert("equalizeSelectedShapeSize(): unknown shape \"" + d.shape + "\"");
      break;
  }

  thisGraph.shapeGroups.each(function(d) {
    exports.storeShapeSize(d3.select(this), d);
  });
  thisGraph.updateExistingPaths();
  thisGraph.updateGraph();
};

exports.storeShapeSize = function(gEl, d) {
  var pad = 12;
  switch (gEl[0][0].__data__.shape) {
    case "rectangle":
    case "noBorder":
      d.width = gEl.select("rect").attr("width"); // Store for computeRectangleBoundary(...)
      d.height = gEl.select("rect").attr("height");
      break;
    case "diamond":
      var pathArray = gEl.select("path").attr("d").split(" ");
      d.dim = parseFloat(pathArray[4], 10);
      d.boundary = d.dim / 2 + pad;
      break;
    case "ellipse":
      d.rx = gEl.select("ellipse").attr("rx"); // Store for computeEllipseBoundary(...)
      d.ry = gEl.select("ellipse").attr("ry");
      break;
    case "circle":
      d.r = gEl.select("circle").attr("r");
      d.boundary = parseFloat(d.r) + pad;
      break;
    case "star":
      var innerRadius = computeInnerRadius(gEl.select("polygon").attr("points").split(" "));
      d.innerRadius = innerRadius;
      d.boundary = innerRadius * 2;
      break;
    default: // May be an edge, in which case boundary is not applicable.
      break;
  }
};
