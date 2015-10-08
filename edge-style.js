exports.style = 'solid';

var esDashedEdgeRectY = 15;  // "es" -> edge selection

// Incorporate rects so you don't have to click right on the edge to select it.
var addSelectionRects = function() {
  d3.select("#edgeStyleSelectionSvg").selectAll(".edgeStyleRect")
    .data([{"id": "solidEdgeRect", "y": 0},
           {"id": "dashedEdgeRect", "y": esDashedEdgeRectY}])
    .enter().append("rect")
    .attr("id", function (d) { return d.id; })
    .classed("edgeStyleRect", true)
    .style("opacity", 0.2)
    .attr("x", 0)
    .attr("y", function(d) { return d.y; })
    .attr("width", this.sssw)
    .attr("height", "15px");
};

var setupSelectionMarkers = function() {
  var thisGraph = this;
  d3.select("#edgeStyleSelectionSvg").selectAll("marker")
    .data([{"id": "selectedEdgeArrowHead", "color": thisGraph.clr},
           {"id": "unselectedEdgeArrowHead", "color": thisGraph.consts.unselectedStyleColor}])
    .enter().append("marker")
      .attr("id", function(d) { return d.id; })
      .attr("viewBox", "0 -5 10 10")
      .attr("markerWidth", 3.75)
      .attr("markerHeight", 3.75)
      .attr("orient", "auto")
      .attr("fill", function(d) { return d.color; })
      .attr("stroke", function(d) { return d.color; })
      .append("svg:path")
        .style("stroke-linejoin", "miter")
        .attr("d", "M0,-5L10,0L0,5");
  d3.select("#selectedEdgeArrowHead")
    .on("click", function() {
      selectEdgeStyle(thisGraph.clr, "#solidEdgeSelection", "#dashedEdgeSelection");
    });
  d3.select("#unselectedEdgeArrowHead")
    .on("click", function() {
      selectEdgeStyle(thisGraph.clr, "#dashedEdgeSelection", "#solidEdgeSelection");
    });
};

var createEdgeStyleSelectionSampleEdges = function() {
  var thisGraph = this;
  d3.select("#edgeStyleSelectionSvg").selectAll(".styleSelectionLine")
    .data([{"id": "solid", "marker": "#", "stroke": "#000000", "y": "7.5", "other": "dashed",
            "dasharray": "none"},
           {"id": "dashed", "marker": "#un", "stroke": thisGraph.unselectedStyleColor,
            "y": "23.5", "other": "solid", "dasharray": "10, 2"}])
    .enter().append("line")
      .classed("styleSelectionLine", true)
      .attr("id", function(d) { return d.id + "EdgeSelection"; })
      .style("marker-end", function(d) { return "url(" + d.marker + "#selectedEdgeArrowHead"; })
      .style("stroke", function(d) { return d.stroke; })
      .style("stroke-width", thisGraph.edgeThickness)
      .style("stroke-dasharray", function(d) { return d.dasharray; })
      .attr("x1", thisGraph.esEdgeX1)
      .attr("y1", function(d) { return d.y; })
      .attr("x2", 4 * thisGraph.sssw / 5)
      .attr("y2", function(d) { return d.y; })
      .on("click", function(d) {
        selectEdgeStyle(thisGraph.clr, "#" + d.id + "EdgeSelection",
                                                 "#" + d.other + "EdgeSelection");
      });

  // Hack to make sure the edge selection arrowheads show up in Chrome and IE:
  selectEdgeStyle(thisGraph.clr, "#solidEdgeSelection", "#dashedEdgeSelection");

  var onMouseOverEdgeStyle = function(selectionId) {
    d3.select(selectionId)
      .attr("opacity", 1)
      .attr("cursor", "pointer")
      .attr("stroke", "#000000");
  };
  d3.select("#solidEdgeRect")
    .on("mouseover", function() { onMouseOverEdgeStyle("#solidEdgeSelection"); })
    .on("click", function() {
      selectEdgeStyle(thisGraph.clr, "#solidEdgeSelection", "#dashedEdgeSelection");
    });
  d3.select("#dashedEdgeRect")
    .on("mouseover", function() { onMouseOverEdgeStyle("#dashedEdgeSelection"); })
    .on("click", function() {
      selectEdgeStyle(thisGraph.clr, "#dashedEdgeSelection", "#solidEdgeSelection");
    });
};

// Solid or dashed edge?
var selectEdgeStyle = function(clr, selectedId, deselectedId) {
  d3.select(selectedId)
    .style("marker-end", function() {
      return "url(#end-arrow" + clr.substr(1) + ")";
    })
    .style("stroke", this.clr)
    .classed("sel", true)
    .classed("unsel", false);
  d3.select(deselectedId)
    .style("marker-end", "url(#unselectedEdgeArrowHead)")
    .style("stroke", this.consts.unselectedStyleColor)
    .classed("unsel", true)
    .classed("sel", false);
  modEdgeStyle.style = (selectedId === "#solidEdgeSelection") ? "solid" : "dashed";
};

// User selects solid or dashed line and line color.
exports.addControls = function() {
  d3.select("#toolbox").insert("div", ":first-child")
    .attr("id", "edgeStyleSelectionDiv");
  d3.select("#edgeStyleSelectionDiv").append("svg")
    .attr("id", "edgeStyleSelectionSvg")
    .attr("width", "93px")
    .attr("height", "30px")
  // Hack: double xmlns namespace so it stays in Chrome inspector's source;
    .attr({"xmlns": "http://www.w3.org/2000/svg",
           "xmlns:xmlns:xlink": "http://www.w3.org/1999/xlink",
           version: "1.1"
          });
  addSelectionRects();
  setupSelectionMarkers();
  createEdgeStyleSelectionSampleEdges();
};
