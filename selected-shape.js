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
    .attr("points", this.calculateStarPoints(starCtrX, starCtrY, 5, 30, 15));
  d3.select("#noBorderSelection")
    .attr("x", exports.minEllipseRx * 2)
    .attr("y", ssNoBorderXformY + exports.minRectSide * 0.7 + 58)
    .style("fill", modSelectedColor.unselected)
    .style("stroke", "none")
    .attr("text-anchor","middle")
    .text("no border");
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

// dillieodigital.wordpress.com/2013/01/16/quick-tip-how-to-draw-a-star-with-svg-and-javascript/
exports.calculateStarPoints = function(ctrX, ctrY, arms, outerRadius, innerRadius) {
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
