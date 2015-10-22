var modGridZoom = require('./grid-zoom.js');

var gridVisible = false,
    grid = null,
    gridCellW = 10,
    gridCellH = 10;

var generateGridLineEndPoints = function(d3) {
  var thisGraph = this;
  var data = [];
  var topDiv = d3.select("#topGraphDiv");
  var bcr = d3.select("#mainSVG").node().getBoundingClientRect();
  var maxX = bcr.width / modGridZoom.zoom, maxY = bcr.height / modGridZoom.zoom;
  var x1 = 0, y1 = 0, x2 = 0, y2 = maxY, n = 0;
  // Create fewer gridlines when zooming out:
  var w = modGridZoom.zoom > 0.2 ? gridCellW
                                 : (thisGraph.zoom > 0.02 ? gridCellW * 4
                                                          : gridCellW * 40);
  var h = modGridZoom.zoom > 0.2 ? gridCellH
                                 : (thisGraph.zoom > 0.02 ? gridCellH * 4
                                                          : gridCellH * 40);
  while(x1 <= maxX) {
    data.push({
      "x1": x1,
      "y1": y1,
      "x2": x2,
      "y2": y2,
      "orientation": "Vert",
      "n": n++
    });
    x1 += parseFloat(w);
    x2 = x1;
  }
  x1 = 0, y1 = 0, x2 = maxX, y2 = 0, n = 0;
  while(y1 <= maxY) {
    data.push({
      "x1": x1,
      "y1": y1,
      "x2": x2,
      "y2": y2,
      "orientation": "Horiz",
      "n": n++
    });
    y1 += parseFloat(h);
    y2 = y1;
  }
  return data;
};

var showSnapToGridText = function(d3) {
  d3.select("#snapToGridItem").text("Snap to grid")
    .datum({"name": "Snap to grid"});
};

var show = function(d3) {
  d3.select("#gridGroup").classed("visible", true);
  gridVisible = true;
};

exports.hide = function(d3) {
  d3.select("#gridGroup").classed("visible", false);
  gridVisible = false;
  showSnapToGridText(d3);
};

exports.hideText = 'Turn off grid';

var showTurnOffGridText = function(d3) {
  d3.select("#snapToGridItem").text(exports.hideText)
    .datum({"name": exports.hideText});
};

exports.snap = function(d) {
  if (this.state.gridVisible) {
    var leftGridlineDist = d.x % gridCellW;
    var upperGridlineDist = d.y % gridCellH;
    d.x += (leftGridlineDist <= gridCellW / 2) ? -leftGridlineDist
      : gridCellW - leftGridlineDist;
    d.y += (upperGridlineDist <= gridCellH / 2) ? -upperGridlineDist
      : gridCellH - upperGridlineDist;
  }
};

exports.create = function(d3) {
  var thisGraph = this;
  if (grid) {
    grid.remove();
    grid = null;
  }
  grid = d3.select("#graphG").insert("g", ":first-child")
    .attr("id", "gridGroup")
    .classed("visible", gridVisible);
  var data = generateGridLineEndPoints(d3);
  d3.select("#gridGroup").selectAll("line")
    .data(data)
    .enter().append("svg:line")
    .attr("x1", function(d) { return d.x1; })
    .attr("x2", function(d) { return d.x2; })
    .attr("y1", function(d) { return d.y1; })
    .attr("y2", function(d) { return d.y2; })
    .attr("id", function(d, i) {
      return "gridline" + d.orientation + d.n;
    })
    .style("stroke", "#000000")
    .style("stroke-width", function(d) { return (d.n % 4) ? "0.1px" : "0.5px"; })
    .style("stroke-dasharray", ("1, 1"))
    .style("fill", "none");
  modGridZoom.fitGridToZoom(d3);
};

exports.enableSnap = function(d3) {
  if (!grid) {
    exports.create(d3);
  }
  show(d3);
  showTurnOffGridText(d3);
};
