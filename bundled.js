(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Help/instructions button and info box:
module.exports = function(d3) {
  d3.select("#toolbox").insert("div", ":first-child")
    .attr("id", "btnDiv")
    .append("input")
    .attr("type", "button")
    .attr("id", "helpBtn")
    .attr("value", "?")
    .on("click", function() {
      alert("\u26a1 Drag/scroll to translate/zoom.\n"
        + "\u26a1 Click on a shape in the toolbar to select node shape (or for a node with "
            + "none use \"no border\").\n"
        + "\u26a1 Click on a color in the toolbar to select a color for creating new nodes "
            + "and edges.\n"
        + "\u26a1 Shift-click on empty space to create a node of the selected shape and "
            + "color.\n"
        + "\u26a1 Click on an arrow in the toolbar to select edge style: dashed or solid.\n"
        + "\u26a1 Shift-click on a node, then drag to another node to connect them with an "
        + "edge.\n"
        + "\u26a1 Shift-click on a node's text to edit.\n"
        + "\u26a1 Shift-click on an edge to edit text.\n"
        + "\u26a1 Click on node or edge to select and press backspace/delete to delete."
            + " Note: a node's background turns blue when you're hovering over it, and pink when "
            + "selected.\n"
        + "\u26a1 Control-click on a node with underlined text to open the external url "
            + "associated with that node.\n"
        + "\u26a1 Alt-click on a node to see, attach new (or change existing) url.\n"
        + "\u26a1 Control-shift-click on a node to attach or modify note.\n"
        + "\u26a1 Hover over a node to see its note if there is one attached.\n"
        + "\u26a1 Click on the cloud with the up-arrow to open/upload a file from your machine.\n"
        + "\u26a1 Click on the square with the down-arrow to save the graph to your computer.\n"
        + "\nQuestions? Email stevec@renci.org."
     );
  });
};

},{}],2:[function(require,module,exports){
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * Copyright (C) 2014-2015 The University of North Carolina at Chapel Hill
 * All rights reserved.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS, CONTRIBUTORS, AND THE UNIVERSITY OF NORTH
 * CAROLINA AT CHAPEL HILL "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER, CONTRIBUTORS OR THE UNIVERSITY OF NORTH
 * CAROLINA AT CHAPEL HILL BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY * OF SUCH DAMAGE.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Build a graph with nodes of several shapes and colors, and connect them with directed edges.
// Save a constructed graph locally as a json file, and open and display saved graph files.
// Based on Colorado Reed's https://github.com/cjrd/directed-graph-creator.

document.onload = (function(d3, saveAs, Blob, undefined) {
  "use strict";

  // Define graphcreator object
  var Graphmaker = function(svg, nodes, links) {
    this.initializeMemberVariables();
    this.prepareToolbox();
    this.addLogos();
    this.addCopyright();
    this.addCredits();
    this.setupNotes();
    this.defineArrowMarkers();
    if (this.displayAll) {
      this.createCirclesOfCare();
    }
    this.createSystemSupportMap();
    this.setupMMRGroup();
    this.setupDrag();
    this.setupDragHandle();
    this.setupZoom();
    this.setupSVGNodesAndLinks();
    this.setupEventListeners();
    this.showSystemSupportMap();
    this.setupDownload();
    this.setupUpload();
    this.setupReadMapFromDatabase();
    this.setupWriteMapToDatabase();
    this.setupContextMenu();
  };


  Graphmaker.prototype.consts =  {
    backendBase: 'http://syssci.renci.org:8080',
    selectedClass: "selected",
    connectClass: "connect-node",
    activeEditId: "active-editing",
    BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13,
    minCircleRadius: 20,
    minEllipseRx: 25,
    minEllipseRy: 17,
    unselectedStyleColor: "#666666",
    hoverColor: "rgb(200, 238, 241)",
    selectedColor: "rgb(229, 172, 247)",
    bgColor: "rgb(248, 248, 248)",
    colorChoices: ["ff0000",  // red
                   "ff8800",  // orange
                   "999900",  // gold
                   "00bd00",  // green
                   "00bdbd",  // cyan/aqua
                   "0000ff",  // dark blue
                   "8800ff",  // purple
                   "000000"], // black
    defaultShapeText: {"circle":    "Identity",
                       "rectangle": "Responsibility",
                       "diamond":   "Need",
                       "ellipse":   "Resource",
                       "star":      "Wish",
                       "noBorder":  "text"},
    ssRectangleY: 49, // "ss" -> shape selection
    ssDiamondY: 16,
    ssEllipseCy: 154,
    ssNoBorderXformY: 163,
    esDashedEdgeRectY: 15, // "es" -> edge selection
    cOfChideText: "Hide Circles of Care",
    ssmHideText: "Hide system support rings",
    turnOffGridText: "Turn off grid",
    defaultFontSize: 12, // Also set in css file because image export doesn't see css
    rightMouseBtn: 3
  };


  /* PROTOTYPE FUNCTIONS */


  Graphmaker.prototype.initializeMemberVariables = function() {
    this.displayAll = true; // If false turns off some features
    this.svg = svg;
    this.shapeId = 0;
    this.clr = "#000000";
    this.edgeStyle = "solid";
    this.edgeThickness = 3;
    this.minRectSide =
      Math.sqrt(Math.PI * this.consts.minCircleRadius * this.consts.minCircleRadius);
    this.shapeSelected = "circle";
    this.maxCharsPerLine = 20;
    this.boldFontWeight = 900;
    this.edgeNum = 0;
    this.nodes = nodes || [];
    this.links = links || [];
    // shapeNum values are 1-based because they're used in front-facing text:
    this.shapeNum = {"circle": 1, "rectangle": 1, "diamond": 1, "ellipse": 1, "star": 1,
                          "noBorder": 1};
    this.gridCellW = 10;
    this.gridCellH = 10;
    this.grid = null;
    this.state = {
      selectedNode: null,
      selectedEdge: null,
      mouseDownNode: null,
      mouseDownLink: null,
      justDragged: false,
      justScaleTransGraph: false,
      lastKeyDown: -1,
      shiftNodeDrag: false,
      selectedText: null,
      clickDragHandle: false,
      gridVisible: false,
      circlesOfCareVisible: false,
      ssmVisible: true
    };
    this.zoom = 1;
    this.translate = [0, 0];
    this.contextText = null;
    this.svgG = svg.append("g") // The group that contains the main SVG element
                   .classed("graph", true)
                   .attr("id", "graphG");
  };


  Graphmaker.prototype.createOptionsButton = function() {
    d3.select("#btnDiv").append("input")
      .attr("type", "button")
      .attr("id", "optionsBtn")
      .attr("value", "Options")
      .on("click", function() {
        var position = d3.mouse(d3.select("#topGraphDiv")[0][0]);
        position[1] -= 120;
        d3.select("#optionsMenuDiv")
          .classed("menuHidden", false).classed("menu", true)
          .style("left", position[0] + "px")
          .style("top", position[1] + "px");
      });
  };


  Graphmaker.prototype.createColorPalette = function() {
    var thisGraph = this;
    d3.select("#toolbox").insert("div", ":first-child")
      .attr("id", "colorPalette");
    d3.select("#colorPalette").selectAll(".colorBar")
      .data(thisGraph.consts.colorChoices)
      .enter().append("div")
        .classed("colorBar", true)
        .attr("id", function(d) { return "clr" + d; })
        .style("background-color", function(d) { return "#" + d; })
      .on("mouseover", function() { // Set border to hoverColor if this colorBar is not selected
        var currentColorBar = d3.select(this);
        var currentIdFragment = currentColorBar.attr("id").slice(3);
        if (currentIdFragment !== thisGraph.clr.slice(1)) {
          currentColorBar.style("border-color", thisGraph.consts.hoverColor);
        }
      })
      .on("mouseout", function() { // Set border to black if this colorBar is not selected
        var currentColorBar = d3.select(this);
        var currentIdFragment = currentColorBar.attr("id").slice(3);
        if (currentIdFragment !== thisGraph.clr.slice(1)) {
          currentColorBar.style("border-color", "#000000");
        }
      })
      .on("mouseup", function(d) {
        thisGraph.clr = "#" + d;
        d3.selectAll(".colorBar").each(function() {
          d3.select(this).style("border-color", "#000000");});
        d3.select(this).style("border-color", "#ffffff");
        d3.select("#" + thisGraph.shapeSelected + "Selection")
          .style("stroke", (thisGraph.shapeSelected === "noBorder") ? "none" : thisGraph.clr)
          .style("fill", (thisGraph.shapeSelected === "noBorder") ? thisGraph.clr
                                                                  : thisGraph.consts.bgColor);
        var selectedEdgeStyleId = (thisGraph.edgeStyle === "solid")
                                ? "#solidEdgeSelection" : "#dashedEdgeSelection";
        d3.select(selectedEdgeStyleId).style("stroke", thisGraph.clr)
          .style("marker-end", function() {
            return "url(#end-arrow" + thisGraph.clr.substr(1) + ")";
        });
      });
    d3.select("#clr000000").style("border-color", "#ffffff"); // Initial color selection is black
  };


  Graphmaker.prototype.selectShape = function(selectedElt, shapeSelection) {
    d3.selectAll(".shapeSelection").style("stroke", this.consts.unselectedStyleColor)
      .classed({"sel": false, "unsel": true});
    d3.select("#noBorderSelection")
      .style("fill", this.consts.unselectedStyleColor)
      .style("stroke", "none");
    selectedElt.style("stroke", this.clr).classed({"sel": true, "unsel": false});
    if (shapeSelection === "noBorder") {
      selectedElt.style("fill", this.clr).style("stroke", "none");
    }
    this.shapeSelected = shapeSelection;
  };


  Graphmaker.prototype.addShapeSelectionShapes = function() {
    var thisGraph = this;
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
          return d.shape === "circle" ? thisGraph.clr : thisGraph.consts.unselectedStyleColor;
        })
        .style("stroke-width", 2)
        .classed("sel", function(d) { return (d.id === "circleSelection"); })
        .classed("unsel", function(d) { return (d.id !== "circleSelection"); })
        .on("click", function(d) {
          thisGraph.selectShape(d3.select(this), d.id.substring(0, d.id.length - 9));
        });
  };


  Graphmaker.prototype.setShapeSelectionShapeSizes = function() {
    d3.select("#circleSelection")
      .attr("r", this.consts.minCircleRadius)
      .attr("cx", this.sssw / 2)
      .attr("cy", this.ssCircleCy);
    d3.select("#rectangleSelection")
      .attr("width", this.minRectSide)
      .attr("height", this.minRectSide - 5)
      .attr("x", this.sssw / 2.0  - this.minRectSide + 17)
      .attr("y", this.consts.ssRectangleY);
    d3.select("#diamondSelection")
      .attr("width", this.minRectSide)
      .attr("height", this.minRectSide)
      .attr("transform", "rotate(45," + this.minRectSide * 2 + ","
                                      + this.consts.ssDiamondY + ")")
      .attr("x", this.sssw / 2.0 + 53)
      .attr("y", this.consts.ssDiamondY + 62);
    d3.select("#ellipseSelection")
      .attr("cx", this.sssw / 2)
      .attr("cy", this.consts.ssEllipseCy)
      .attr("rx", this.consts.minEllipseRx)
      .attr("ry", this.consts.minEllipseRy);
    var starCtrX = this.consts.minEllipseRx * 2;
    var starCtrY = this.consts.ssNoBorderXformY + this.minRectSide * 0.7 + 18;
    d3.select("#starSelection")
      .attr("x", starCtrX)
      .attr("y", starCtrY)
      .attr("points", this.calculateStarPoints(starCtrX, starCtrY, 5, 30, 15));
    d3.select("#noBorderSelection")
      .attr("x", this.consts.minEllipseRx * 2)
      .attr("y", this.consts.ssNoBorderXformY + this.minRectSide * 0.7 + 58)
      .style("fill", this.consts.unselectedStyleColor)
      .style("stroke", "none")
      .attr("text-anchor","middle")
      .text("no border");
  };


  Graphmaker.prototype.addShapeSelection = function() {
    d3.select("#toolbox").insert("div", ":first-child")
      .attr("id", "shapeSelectionDiv");
    d3.select("#shapeSelectionDiv").append("svg")
      .attr("id", "shapeSelectionSvg")
      .attr("width", this.sssw)
      .attr("height", this.sssh)
      // Hack: doubling xmlns: so it doesn't disappear once in the DOM
      .attr({"xmlns": "http://www.w3.org/2000/svg",
             "xmlns:xmlns:xlink": "http://www.w3.org/1999/xlink",
             version: "1.1"
      });

    this.addShapeSelectionShapes();
    this.setShapeSelectionShapeSizes();
  };


  // Incorporate rects so you don't have to click right on the edge to select it.
  Graphmaker.prototype.addEdgeStyleSelectionRects = function() {
    d3.select("#edgeStyleSelectionSvg").selectAll(".edgeStyleRect")
      .data([{"id": "solidEdgeRect", "y": 0},
             {"id": "dashedEdgeRect", "y": this.consts.esDashedEdgeRectY}])
      .enter().append("rect")
        .attr("id", function (d) { return d.id; })
        .classed("edgeStyleRect", true)
        .style("opacity", 0.2)
        .attr("x", 0)
        .attr("y", function(d) { return d.y; })
        .attr("width", this.sssw)
        .attr("height", "15px");
  };


  Graphmaker.prototype.setupEdgeStyleSelectionMarkers = function() {
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
        thisGraph.selectEdgeStyle(thisGraph.clr, "#solidEdgeSelection", "#dashedEdgeSelection");
      });
    d3.select("#unselectedEdgeArrowHead")
      .on("click", function() {
        thisGraph.selectEdgeStyle(thisGraph.clr, "#dashedEdgeSelection", "#solidEdgeSelection");
      });
  };


  Graphmaker.prototype.createEdgeStyleSelectionSampleEdges = function() {
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
          thisGraph.selectEdgeStyle(thisGraph.clr, "#" + d.id + "EdgeSelection",
                                                   "#" + d.other + "EdgeSelection");
        });

    // Hack to make sure the edge selection arrowheads show up in Chrome and IE:
    thisGraph.selectEdgeStyle(thisGraph.clr, "#solidEdgeSelection", "#dashedEdgeSelection");

    var onMouseOverEdgeStyle = function(selectionId) {
      d3.select(selectionId)
        .attr("opacity", 1)
        .attr("cursor", "pointer")
        .attr("stroke", "#000000");
    };
    d3.select("#solidEdgeRect")
      .on("mouseover", function() { onMouseOverEdgeStyle("#solidEdgeSelection"); })
      .on("click", function() {
        thisGraph.selectEdgeStyle(thisGraph.clr, "#solidEdgeSelection", "#dashedEdgeSelection");
      });
    d3.select("#dashedEdgeRect")
      .on("mouseover", function() { onMouseOverEdgeStyle("#dashedEdgeSelection"); })
      .on("click", function() {
        thisGraph.selectEdgeStyle(thisGraph.clr, "#dashedEdgeSelection", "#solidEdgeSelection");
      });
  };


  // User selects solid or dashed line and line color.
  Graphmaker.prototype.addEdgeStyleSelection = function() {
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

    this.addEdgeStyleSelectionRects();
    this.setupEdgeStyleSelectionMarkers();
    this.createEdgeStyleSelectionSampleEdges();
  };


  // Edge, shape, and color selection, plus "?" help and Options buttons, load, save, and delete.
  Graphmaker.prototype.prepareToolbox = function() {
    var thisGraph = this;
    thisGraph.sssw = thisGraph.consts.minCircleRadius * 4 + 23; // Shape Selection Svg Width
    thisGraph.sssh = thisGraph.consts.minCircleRadius * 13; // Shape Selection Svg Height
    thisGraph.ssCircleCy = thisGraph.consts.minCircleRadius * 2 - 16; // ShapeSelectionCircleCy
    thisGraph.esEdgeX1 = thisGraph.sssw / 5 - 20;
    thisGraph.CofCCenter = null; // CirclesOfCareCenter
    thisGraph.SSMCenter = null; // System Support Map Center

    // Handle delete graph
    d3.select("#delete-graph").on("click", function() { thisGraph.deleteGraph(false); });

    require('./help.js')(d3);
    thisGraph.createOptionsMenu();
    thisGraph.createOptionsButton();
    thisGraph.createColorPalette();
    thisGraph.addShapeSelection();
    thisGraph.addEdgeStyleSelection();
  };


  Graphmaker.prototype.addLogos = function() {
    d3.select("#mainSVG").append("svg:image")
      .attr("xlink:href", "mch-tracs.png")
      .attr("id", "logos")
      .attr("width", 546)
      .attr("height", 60)
      .attr("x", -52)
      .attr("y", 0);
  };


  Graphmaker.prototype.addCopyright = function() {
    d3.select("#topGraphDiv").append("div")
      .attr("id", "copyrightDiv")
        .append("text")
          .attr("id", "copyright")
          .text("\u00a9 2014-2015 The University of North Carolina at Chapel Hill")
  };


  Graphmaker.prototype.addCredits = function() {
    d3.select("#mainSVG").append("text")
      .attr("id", "credits")
      .attr("display", "none")
      .attr("x", 30);
  };


  // "Notes" == tooltips
  Graphmaker.prototype.setupNotes = function() {
    this.tip = d3.tip()
                 .attr("class", "d3-tip")
                 .offset([-10, 0])
                 .style("font-family", "Arial")
                 .style("font-weight", "bold")
                 .html(function (d) {
                   d3.select(".d3-tip")
                     .style("display", function() { return d.note ? "block" : "none"; });
                   return  d.note || null;
                 });
    d3.select("#mainSVG").call(this.tip);
  };


  Graphmaker.prototype.defineArrowMarkers = function() {
    // Arrow markers for graph links (i.e., edges that persist after mouse up)
    var defs = d3.select("#mainSVG").append("svg:defs");
    defs.selectAll("marker")
    .data(this.consts.colorChoices)
    .enter().append("marker")
      .attr("id", function(d) { return "end-arrow" + d; })
      .attr("viewBox", "0 -5 10 10")
      .attr("markerWidth", 3.5)
      .attr("markerHeight", 3.5)
      .attr("orient", "auto")
      .attr("fill", function(d) { return "#" + d; })
      .attr("stroke", "none")
    .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

    // Special-purpose markers for leading arrow (just while dragging), for selected, and for hover:
    var markerData = [{"id": "mark-end-arrow", "fill": "#000000"},
              {"id": "selected-end-arrow", "fill": this.consts.selectedColor},
              {"id": "hover-end-arrow", "fill": this.consts.hoverColor}];
    defs.selectAll(".specialMarker")
    .data(markerData)
    .enter().append("marker")
      .classed("specialMarker", true)
      .attr("id", function(d) { return d.id; })
      .attr("viewBox", "0 -5 10 10")
      .attr("markerWidth", 3.5)
      .attr("markerHeight", 3.5)
      .attr("orient", "auto")
    .append("svg:path")
      .attr("fill", function(d, i) { return markerData[i].fill; })
      .attr("stroke", "none")
      .attr("d", "M0,-5L10,0L0,5");
  };


  Graphmaker.prototype.setupDrag = function() {
    var thisGraph = this;
    thisGraph.dragLine = thisGraph.svgG.append("svg:path") // Displayed when dragging between nodes
      .attr("class", "link dragline hidden")
      .attr("d", function() { return "M0,0L0,0"; })
      .style("marker-end", "url(#mark-end-arrow)");

    thisGraph.drag = d3.behavior.drag()
      .origin(function(d) {
        return {x: d.x, y: d.y};
      })
      .on("drag", function(args) {
        thisGraph.state.justDragged = true;
        thisGraph.dragmove(args);
      })
      .on("dragend", function(args) {
        thisGraph.snapToGrid(args);
        // Todo check if edge-mode is selected
      });
  };


  Graphmaker.prototype.setupZoom = function() {
    var thisGraph = this;
    thisGraph.zoomSvg = d3.behavior.zoom()
      .on("zoom", function() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.shiftKey) {
          // TODO  the internal d3 state is still changing
          return false;
        } else {
          thisGraph.zoomed();
        }
        return true;
      })
      .on("zoomstart", function() {
        var ael = d3.select("#" + thisGraph.consts.activeEditId).node();
        if (ael) {
          ael.blur();
        }
        if (!d3.event.sourceEvent || !d3.event.sourceEvent.shiftKey) {
          d3.select("body").style("cursor", "move");
        }
      })
      .on("zoomend", function() {
        d3.select("body").style("cursor", "auto");
      });

    svg.call(thisGraph.zoomSvg).on("dblclick.zoom", null);
  };


  // Handle goes in the lower right-hand corner of a rectangle: shift-drag to resize rectangle.
  Graphmaker.prototype.setupDragHandle = function() {
    var thisGraph = this;
    thisGraph.dragHandle = d3.behavior.drag()
      .on("dragstart", function(d) {
        if (!d3.event.sourceEvent.shiftKey) { return; }
        d.manualResize = true;
        d.name = "";
        d3.select(this).style("opacity", 1);
        if (!d.xOffset) {
          d.xOffset = d.width / 2;
          d.yOffset = d.height / 2;
        }
        d3.event.sourceEvent.stopPropagation();
      })
      .on("drag", function(d) {
        var x = d3.event.x;
        var y = d3.event.y;
        d3.select(this)
          .attr("transform", function() {
          return "translate(" + x + "," + y + ")";
        });
        d3.select("#shape" + d.id)
          .attr("width", Math.abs(x + d.xOffset))
          .attr("height", Math.abs(y + d.yOffset));
      })
      .on("dragend", function(d) {
        var rectangle = d3.select("#shape" + d.id);
        d.width = parseFloat(rectangle.attr("width"));
        d.height = parseFloat(rectangle.attr("height"));
        d3.select(this).style("opacity", 0);
        var currG = d3.select("#shapeG" + d.id);
        currG.select("text").text("");

        // Move the resized rect group to higher in the DOM so edges and other shapes are on top:
        var remove = currG.remove();
        d3.select("#manResizeGG").append(function() {
          return remove.node();
        });
      });
  };


  // Manually Resized Rectangles (MMRs) are moved to manResizeGroups so that other shapes and edges
  // appear on top of them because manResizeGroups is earlier in the DOM.
  Graphmaker.prototype.setupMMRGroup = function() {
    this.manResizeGroups = this.svgG.append("g").attr("id", "manResizeGG").selectAll("g");
  };


  Graphmaker.prototype.setupSVGNodesAndLinks = function() {
    this.edgeGroups = this.svgG.append("g").attr("id", "pathGG").selectAll("g");
    this.shapeGroups = this.svgG.append("g").attr("id", "shapeGG").selectAll("g");
  };


  // dillieodigital.wordpress.com/2013/01/16/quick-tip-how-to-draw-a-star-with-svg-and-javascript/
  Graphmaker.prototype.calculateStarPoints = function(ctrX, ctrY, arms, outerRadius, innerRadius) {
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


  Graphmaker.prototype.setShapeId = function(shapeId) {
    this.shapeId = shapeId;
  };


  Graphmaker.prototype.getBiggestShapeId = function() {
    var currMax = 0;
    var i;
    for (i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].id > currMax) {
        currMax = this.nodes[i].id;
      }
    }
    return currMax;
  };


  // Solid or dashed edge?
  Graphmaker.prototype.selectEdgeStyle = function(clr, selectedId, deselectedId) {
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
    this.edgeStyle = (selectedId === "#solidEdgeSelection") ? "solid" : "dashed";
  };


  Graphmaker.prototype.snapToGrid = function(d) {
    if (this.state.gridVisible) {
      var leftGridlineDist = d.x % this.gridCellW;
      var upperGridlineDist = d.y % this.gridCellH;
      d.x += (leftGridlineDist <= this.gridCellW / 2) ? -leftGridlineDist
                                                      : this.gridCellW - leftGridlineDist;
      d.y += (upperGridlineDist <= this.gridCellH / 2) ? -upperGridlineDist
                                                       : this.gridCellH - upperGridlineDist;
    }
  };


  Graphmaker.prototype.dragmove = function(d) {
    if (this.state.shiftNodeDrag) { // Creating a new edge
      this.dragLine.attr("d", "M" + d.x + "," + d.y + "L" + d3.mouse(this.svgG.node())[0]
                                        + "," + d3.mouse(this.svgG.node())[1]);
    } else { // Translating a shape
      this.dragLine.style("stroke-width", 0);
      d.x += d3.event.dx;
      d.y +=  d3.event.dy;
      this.snapToGrid(d);
      this.updateGraph();
    }
  };


  Graphmaker.prototype.deleteGraph = function(skipPrompt) {
    var doDelete = true;
    if (!skipPrompt) {
      doDelete = window.confirm("Press OK to delete this graph");
    }
    if(doDelete) {
      this.nodes = [];
      this.links = [];
      this.hideCirclesOfCare();
      this.showSystemSupportMap();
      this.updateGraph();
      location.hash = "";
    }
  };


  // Select all text in element: taken from http://stackoverflow.com/questions/6139107/
  // programatically-select-text-in-a-contenteditable-html-element
  Graphmaker.prototype.selectText = function(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };


  // Set shape size and position, to stored value[s] if they exist, or else to fit text.
  Graphmaker.prototype.setShapeSizeAndPosition = function(gEl, el, d) {
    var thisGraph = this;
    var textSize = el.node().getBBox();
    var rectWidth = Math.max(textSize.width, thisGraph.minRectSide);
    var rectHeight = Math.max(textSize.height, thisGraph.minRectSide);
    var maxTextDim = Math.max(textSize.width, textSize.height);
    var innerRadius = Math.max(14, maxTextDim * 0.6);
    var minDiamondDim = 45;
    var w, h; // for handle translation

    gEl.select(".circle")
       .attr("r", function(d) {
         return d.r || Math.max(maxTextDim / 2 + 8, thisGraph.consts.minCircleRadius);
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
         return d.rx || Math.max(textSize.width / 2 + 20, thisGraph.consts.minEllipseRx);
       })
       .attr("ry", function(d) {
         return d.ry || Math.max(textSize.height / 2 + 17, thisGraph.consts.minEllipseRy);
       });
    gEl.select("polygon")
       .attr("points", function(d) {
         return d.innerRadius
           ? thisGraph.calculateStarPoints(0, 0, 5, d.innerRadius * 2, d.innerRadius)
           : thisGraph.calculateStarPoints(0, 0, 5, innerRadius * 2, innerRadius);
       })
  };


  // For star shapes.
  Graphmaker.prototype.computeInnerRadius = function(pointArray) {
        var innerPoint = pointArray[1].split(",");
        var x = parseFloat(innerPoint[0]);
        var y = parseFloat(innerPoint[1]);
        return Math.sqrt(x * x + y * y);
  };


  Graphmaker.prototype.storeShapeSize = function(gEl, d) {
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
        var innerRadius = this.computeInnerRadius(gEl.select("polygon").attr("points").split(" "));
        d.innerRadius = innerRadius;
        d.boundary = innerRadius * 2;
        break;
      default: // May be an edge, in which case boundary is not applicable.
        break;
    }
  };


  // Split text into single words, then group them into lines. Arg "element" is a shape or an edge.
  Graphmaker.prototype.splitTextIntoLines = function(element) {
    var words = (element.name) ? element.name.split(/\s+/g) : [""];
    var nwords = words.length;
    var phrases = [];
    var wordIx = 0;
    var currPhrase = "";
    var maxChars = this.maxCharsPerLine;
    if (element.maxCharsPerLine) {
      maxChars = element.maxCharsPerLine;
    } else {
      element.maxCharsPerLine = maxChars;
    }
    while (wordIx < nwords) {
      if (words[wordIx].length >= maxChars) {
        phrases.push(words[wordIx++]);
      } else {
        while ((wordIx < nwords) && ((currPhrase.length + words[wordIx].length) < maxChars)) {
          currPhrase +=  words[wordIx++];
          if ((wordIx < nwords) && ((currPhrase.length + words[wordIx].length) < maxChars)) {
            currPhrase += " ";
          }
        }
        phrases.push(currPhrase);
      }
      currPhrase = "";
    }
    return phrases;
  };


  Graphmaker.prototype.appendEdgeShadowText = function(gEl, phrases, yShift) {
    var thisGraph = this;
    var tLen = [0]; // Initialize array with 0 so we don't try to access element at -1
    var el = gEl.append("text")
                .attr("text-anchor","left")
                .attr("alignment-baseline", "middle")
                .attr("text-decoration", function(d) { return d.url ? "underline" : "none"; })
                .style("font-weight", function(d) {
                  return d.url ? thisGraph.boldFontWeight: "none";
                })
                .style("stroke", thisGraph.consts.bgColor)
                .style("stroke-width", "3px")
                .attr("dy",  function() {
                  return yShift - ((phrases.length - 1) * thisGraph.consts.defaultFontSize / 2);
                });
    el.selectAll("tspan")
      .data(phrases)
      .enter().append("tspan")
        .text(function(d) { return d; })
        .attr("dx", function(d, i) {
          tLen.push(this.getComputedTextLength());
          // TODO: fix edge text position when source or target shape is very large (needs to be
          // centered from shape borders, not just shape centers).
          return -(tLen[i] + tLen[i + 1]) / 2;
        })
        .attr("dy", function(d, i) { return (i > 0) ? thisGraph.consts.defaultFontSize : null; });
    return tLen;
  };


  Graphmaker.prototype.appendText = function(gEl, phrases, yShift) {
    var thisGraph = this;
    var nPhrases = phrases.length;
    var el = gEl.append("text")
            .classed("foregroundText", true)
            .attr("text-anchor","left")
            .attr("alignment-baseline", "middle")
            .attr("text-decoration", function(d) {
              return d.url ? "underline" : "none"; })
            .style("font-weight", function(d) {
              return d.url ? thisGraph.boldFontWeight: "none"; })
            .style("fill", gEl[0][0].__data__.color)
            .attr("dy",  function() {
              return yShift - ((nPhrases - 1) * thisGraph.consts.defaultFontSize / 2);
            });
    el.selectAll("tspan")
      .data(phrases)
      .enter().append("tspan")
        .text(function(d) { return d; })
        .attr("dy", function(d, i) {
          return (i > 0) ? thisGraph.consts.defaultFontSize : null;
        });
    return el;
  };


  // Based on http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts
  // Centers text for shapes and edges in lines whose lengths are determined by maxCharsPerLine.
  // Shrinkwraps shapes to hold all the text if previously determined size not used.
  Graphmaker.prototype.formatText = function (gEl, d) {
    if (d.manualResize) {
      d.name = "";
    }
    var phrases = this.splitTextIntoLines(d);
    var tLen = null; // Array of lengths of the lines of edge text
    var yShift = 3; // Align text to edges
    if (d.shape && (d.shape !== "rectangle") && (d.shape !== "noBorder")) {
      yShift = 6;
    }
    if (d.source) { // ...then it's an edge: add shadow text for legibility:
      tLen = this.appendEdgeShadowText(gEl, phrases, yShift);
    }
    var el = this.appendText(gEl, phrases, yShift);
    if (d.source) { // It's an edge
      el.selectAll("tspan")
        .attr("dx", function(d, i) {
          return -(tLen[i] + tLen[i + 1]) / 2;
        });
    } else { // It's a shape
      el.selectAll("tspan").attr("text-anchor","middle").attr("dx", null).attr("x", 0);
      this.setShapeSizeAndPosition(gEl, el, d);
      this.storeShapeSize(gEl, d);
    }
  };


  // Remove links associated with a node
  Graphmaker.prototype.spliceLinksForNode = function(node) {
    var thisGraph = this,
        toSplice = thisGraph.links.filter(function(l) {
          return (l.source === node || l.target === node);
        });
    toSplice.map(function(l) { thisGraph.links.splice(thisGraph.links.indexOf(l), 1); });
  };


  // Includes setting selected edge to selected edge color.
  Graphmaker.prototype.replaceSelectEdge = function(d3Path, edgeData) {
    if (d3.event.shiftKey) { return; }
    d3Path.classed(this.consts.selectedClass, true);
    d3Path.select("path")
          .style("stroke", this.consts.selectedColor)
          .style("marker-end", "url(#selected-end-arrow)");
    d3Path.select(".foregroundText")
          .style("fill", this.consts.selectedColor);
    if (this.state.selectedEdge) {
      this.removeSelectFromEdge();
    }
    this.state.selectedEdge = edgeData;
  };


  Graphmaker.prototype.replaceSelectNode = function(d3Node, nodeData) {
    d3Node.classed(this.consts.selectedClass, true);
    if (this.state.selectedNode) {
      this.removeSelectFromNode();
    }
    nodeData.domId = d3Node.attr("id");
    this.state.selectedNode = nodeData;
  };


  Graphmaker.prototype.removeSelectFromNode = function() {
    var thisGraph = this;
    thisGraph.shapeGroups.filter(function(cd) {
      return cd.id === thisGraph.state.selectedNode.id;
    }).classed(thisGraph.consts.selectedClass, false);
    thisGraph.state.selectedNode = null;
  };


  // Includes setting edge color back to its unselected value.
  Graphmaker.prototype.removeSelectFromEdge = function() {
    var thisGraph = this;
    var deselectedEdgeGroup = thisGraph.edgeGroups.filter(function(cd) {
      return cd === thisGraph.state.selectedEdge;
    }).classed(thisGraph.consts.selectedClass, false);

    deselectedEdgeGroup.select("path")
      .style("stroke", thisGraph.state.selectedEdge.color)
      .style("marker-end", function(d) {
        var clr = d.color ? d.color.substr(1) : d.target.color.substr(1);
        return "url(#end-arrow" + clr + ")";
      });

    deselectedEdgeGroup.select(".foregroundText")
      .style("fill", thisGraph.state.selectedEdge.color);
    thisGraph.state.selectedEdge = null;
  };


  Graphmaker.prototype.pathMouseDown = function(d3path, d) {
    d3.event.stopPropagation();
    this.state.mouseDownLink = d;

    if (this.state.selectedNode) {
      this.removeSelectFromNode();
    }

    var prevEdge = this.state.selectedEdge;
    if (!prevEdge || prevEdge !== d) {
      this.replaceSelectEdge(d3path, d);
    } else if (d3.event.which !== this.consts.rightMouseBtn) {
      this.removeSelectFromEdge();
    }
  };


  // Mousedown on node
  Graphmaker.prototype.shapeMouseDown = function(d) {
    d3.event.stopPropagation();
    this.state.mouseDownNode = d;
    if (d3.event.shiftKey && !d.manualResize) { // No edges from manually resized rectangles
      this.state.shiftNodeDrag = d3.event.shiftKey;
      this.dragLine.classed("hidden", false) // Reposition dragged directed edge
                        .style("stroke-width", this.edgeThickness)
                        .attr("d", "M" + d.x + "," + d.y + "L" + d.x + "," + d.y);
    }
  };


  // Place editable text on node or edge in place of svg text
  //
  // Note: see bug report https://code.google.com/p/chromium/issues/detail?id=304567 "svg
  // foreignObject with contentEditable=true editing/placement inconsistency" for possible
  // explanation of some editable text positioning difficulties.
  Graphmaker.prototype.changeElementText = function(d3element, d) {
    var thisGraph = this,
        consts = thisGraph.consts,
        htmlEl = d3element.node();
    d3element.selectAll("text").remove();
    var nodeBCR = htmlEl.getBoundingClientRect(),
        curScale = nodeBCR.width / (consts.minCircleRadius * 2),
        useHW = curScale > 1 ? nodeBCR.width * 1.71 : consts.minCircleRadius * 4.84;

    // Replace with editable content text:
    var d3txt = thisGraph.svg.selectAll("foreignObject")
      .data([d])
      .enter().append("foreignObject")
        .attr("x", nodeBCR.left + nodeBCR.width / 2)
        .attr("y", nodeBCR.top + nodeBCR.height / 2)
        .attr("height", 2 * useHW)
        .attr("width", useHW)
      .append("xhtml:p")
        .attr("id", consts.activeEditId)
        .attr("contentEditable", true)
        .text(d.name)
      .on("mousedown", function() {
        d3.event.stopPropagation();
      })
      .on("keydown", function() {
        d3.event.stopPropagation();
        if (d3.event.keyCode === consts.ENTER_KEY && !d3.event.shiftKey) { this.blur(); }
      })
      .on("blur", function(d) {
        d.name = this.textContent.trim(); // Remove whitespace fore and aft
        if (d.manualResize) {
          thisGraph.state.clickDragHandle = false;
          d.name = "";
        } else {
          // Force shape shrinkwrap:
          d.r = d.width = d.height = d.dim = d.rx = d.ry = d.innerRadius = undefined;
          d.maxCharsPerLine = undefined; // User may want different value if editing text
        }
        thisGraph.formatText(d3element, d);
        d3.select(this.parentElement).remove();
        thisGraph.updateGraph();
      });
    return d3txt;
  };


  Graphmaker.prototype.createNewEdge = function(d) {
    var thisGraph = this;
    var newEdge = {source: this.state.mouseDownNode,
                   target: d,
                   style: thisGraph.edgeStyle,
                   color: thisGraph.clr,
                   thickness: thisGraph.edgeThickness,
                   name: ""};
    var filtRes = thisGraph.edgeGroups.filter(function(d) {
      if (d.source === newEdge.target && d.target === newEdge.source) {
        thisGraph.links.splice(thisGraph.links.indexOf(d), 1);
      }
      return d.source === newEdge.source && d.target === newEdge.target;
    });
    if (!filtRes[0].length) {
      thisGraph.links.push(newEdge);
      thisGraph.updateGraph();
      // Todo: finish adapting the following code block for edges for immediate text edit on create.
      /*
      var d3txt = thisGraph.changeElementText(thisGraph.links.filter(function(dval) {
        return dval.name === newEdge.name;
      }), newEdge);
      var txtNode = d3txt.node();
      thisGraph.selectText(txtNode);
      txtNode.focus();
      */
    }
  };


  Graphmaker.prototype.selectNode = function(d3node, d) {
    if (this.state.selectedEdge) {
      this.removeSelectFromEdge();
    }
    var prevNode = this.state.selectedNode;

    if (!prevNode || prevNode.id !== d.id) {
      this.replaceSelectNode(d3node, d);
    } else {
      this.removeSelectFromNode();
    }
  };


  // Mouseup on nodes
  Graphmaker.prototype.shapeMouseUp = function(d3node, d) {
    var state = this.state;
    var consts = this.consts;

    // Reset the states
    state.shiftNodeDrag = false;
    state.justDragged = false;
    d3node.classed(consts.connectClass, false);

    var mouseDownNode = state.mouseDownNode;

    if (!mouseDownNode) { return; }

    this.dragLine.classed("hidden", true).style("stroke-width", 0);

    if (!mouseDownNode.manualResize // We didn't start on a manually resized rectangle...
      && mouseDownNode !== d) { // ...& we're in a different node: create new edge and add to graph
      this.createNewEdge(d);
    } else { // We're in the same node or the dragged edge started on a manually resized rectangle
      if (state.justDragged) { // Dragged, not clicked
        state.justDragged = false;
      } else { // Clicked, not dragged
        if (d3.event.shiftKey // Shift-clicked node: edit text content...
            && !d.manualResize) { // ...that is, if not manually resizing rect
          var d3txt = this.changeElementText(d3node, d);
          var txtNode = d3txt.node();
          this.selectText(txtNode);
          txtNode.focus();
        } else if (d3.event.which !== this.consts.rightMouseBtn) { // left- or mid-clicked
          this.selectNode(d3node, d);
        }
      }
    }
    state.mouseDownNode = null;
  };


  // Mousedown on main svg
  Graphmaker.prototype.svgMouseDown = function() {
    this.state.graphMouseDown = true;
  };


  // Mouseup on main svg
  Graphmaker.prototype.svgMouseUp = function() {
    var state = this.state;

    // Make sure options menu is closed:
    d3.select("#optionsMenuDiv") .classed("menu", false).classed("menuHidden", true);

    if (state.justScaleTransGraph) { // Dragged not clicked
      state.justScaleTransGraph = false;
    } else if (state.graphMouseDown && d3.event.shiftKey) { // Clicked not dragged from svg
      var xycoords = d3.mouse(this.svgG.node());

      var d = {id: this.shapeId,
               name: this.consts.defaultShapeText[this.shapeSelected] + " "
                   + this.shapeNum[this.shapeSelected]++,
               x: xycoords[0],
               y: xycoords[1],
               color: this.clr,
               shape: this.shapeSelected};
      this.nodes.push(d);
      this.shapeId++;
      this.updateGraph();

      // Make text immediately editable
      var d3txt = this.changeElementText(this.shapeGroups.filter(function(dval) {
        return dval.id === d.id;
      }), d),
          txtNode = d3txt.node();
      this.selectText(txtNode);
      txtNode.focus();
    } else if (state.shiftNodeDrag) { // Dragged from node
      state.shiftNodeDrag = false;
      this.dragLine.classed("hidden", true).style("stroke-width", 0);
    } else if (state.graphMouseDown) { // Left-click on background deselects currently selected
      if (this.state.selectedNode) {
        this.removeSelectFromNode();
      } else if (this.state.selectedEdge) {
        this.removeSelectFromEdge();
      }
    }
    state.graphMouseDown = false;
  };


  // Keydown on main svg
  Graphmaker.prototype.svgKeyDown = function() {
    var state = this.state,
        consts = this.consts;

    // Make sure repeated key presses don't register for each keydown
    if (state.lastKeyDown !== -1) { return; }

    state.lastKeyDown = d3.event.keyCode;
    var selectedNode = state.selectedNode,
        selectedEdge = state.selectedEdge;

    switch (d3.event.keyCode) {
    case consts.BACKSPACE_KEY:
    case consts.DELETE_KEY:
      d3.event.preventDefault();
      if (selectedNode) {
        this.nodes.splice(this.nodes.indexOf(selectedNode), 1);
        this.spliceLinksForNode(selectedNode);
        state.selectedNode = null;
        this.updateGraph();
      } else if (selectedEdge) {
        this.links.splice(this.links.indexOf(selectedEdge), 1);
        state.selectedEdge = null;
        this.updateGraph();
      }
      break;
    }
  };


  Graphmaker.prototype.svgKeyUp = function() {
    this.state.lastKeyDown = -1;
  };


  // Returns new end point p2'. Arg "change" is in pixels. Negative "change" shortens the line.
  Graphmaker.prototype.changeLineLength = function(x1, y1, x2, y2, change, edgeThickness) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
      dx /= length;
      dy /= length;
    }
    var multiplier = (length + change - 4 * (edgeThickness - 3)); // Thicker -> longer
    dx *= multiplier;
    dy *= multiplier;
    return {"x": x1 + dx, "y": y1 + dy};
  };


  Graphmaker.prototype.updateExistingPaths = function() {
    var thisGraph = this;
    thisGraph.edgeGroups = thisGraph.edgeGroups.data(thisGraph.links, function(d) {
      return String(d.source.id) + "+" + String(d.target.id);
    });
    thisGraph.edgeGroups.classed(thisGraph.consts.selectedClass, function(d) {
           return d === thisGraph.state.selectedEdge;
         })
         .attr("d",  function(d) {
           return thisGraph.setPath(d);
         });
    return thisGraph.edgeGroups;
  };


  Graphmaker.prototype.updateExistingNodes = function() {
    this.shapeGroups = this.shapeGroups.data(this.nodes, function(d) { // ???
      return d.id;
    });
    this.shapeGroups.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  };


  // Based on http://www.w3schools.com/ajax/tryit.asp?filename=tryajax_first
  // Read a file from the server into contextText.
  Graphmaker.prototype.loadContextTextFromServer = function(fileName) {
    var thisGraph = this;
    var jsonObj = null;
    var xmlhttp;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
      xmlhttp = new XMLHttpRequest();
    }
    else { // code for IE6, IE5
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
        thisGraph.contextText = JSON.parse(xmlhttp.responseText);
      }
    }

    xmlhttp.open("GET",fileName, true);
    xmlhttp.send();
  };


  // User uploads new file from client into contextText.
  Graphmaker.prototype.loadContextTextFromClient = function() {
    var thisGraph = this;
    document.getElementById("hidden-textFile-upload").click();
    d3.select("#hidden-textFile-upload").on("change", function() {
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        var uploadFile = this.files[0];
        var filereader = new window.FileReader();
        var txtRes;

        filereader.onload = function() {
          try {
            txtRes = filereader.result;
          } catch(err) {
            window.alert("Error reading file: " + err.message);
          }
          // TODO better error handling
          try {
            thisGraph.contextText = JSON.parse(txtRes);
          } catch(err) {
            window.alert("Error parsing uploaded file\nerror message: " + err.message);
            return;
          }
        };
        filereader.readAsText(uploadFile);
      } else {
        alert("Your browser won't let you read this file -- try upgrading your browser to IE 10+ "
            + "or Chrome or Firefox.");
      }
    });
  };


  Graphmaker.prototype.createContextMenu = function() {
    d3.select("#topGraphDiv").insert("div", ":first-child")
      .classed("menuHidden", true).classed("menu", false)
      .attr("id", "contextMenuDiv")
      .attr("position", "absolute")
      .on("mouseleave", function() {
        d3.select("#contextMenuDiv")
            .classed("menu", false).classed("menuHidden", true);
            });
    this.loadContextTextFromServer("defaultContextText.json");
  };


  // Returns false if no object (shape or edge) is selected. Otherwise populates the right-click
  // context menu with items appropriate to the object selected, and returns true.
  Graphmaker.prototype.populateContextMenu = function() {
    var thisGraph = this;
    var choices = null;
    var selectedElement = d3.select(".selected");

    if ((!selectedElement) || (!selectedElement.node())) {
      alert("You haven't selected an element. Click on a shape or an edge to select it");
      return false;
    }

    d3.selectAll("li.contextMenuListItem").remove();

    if (selectedElement.node().__data__.source) { // It's an edge
      choices = thisGraph.contextText.verbs;
    } else {
      switch(selectedElement.node().__data__.shape) {
        case "circle":
          choices = thisGraph.contextText.role;
          break;
        case "rectangle":
          choices = thisGraph.contextText.responsibilities;
          break;
        case "diamond":
          choices = thisGraph.contextText.needs;
          break;
        case "ellipse":
          choices = thisGraph.contextText.resources;
          break;
        case "star":
        case "noBorder":
          choices = thisGraph.contextText.wishes;
          break;
        default:
          alert("populateContextMenu(): unknown shape selected.");
          break;
      }
    }

    d3.select("#contextMenuDiv").append("ul").attr("id", "contextMenuList");
    d3.select("#contextMenuList").selectAll("li.contextMenuListItem")
      .data(choices).enter()
      .append("li")
        .classed("contextMenuListItem", true)
        .attr("id", function(d, i) { return "contextMenuListItem" + i; })
        .text(function(d) { return d; })
        .on("mouseover", function() {
        })
        .on("mouseout", function() {
        })
        .on("mouseup", function(d) {
          d3.select("#contextMenuDiv").classed("menu", false).classed("menuHidden", true);
          if (selectedElement.node()) {
            selectedElement.selectAll("text").remove();
            var data = selectedElement.node().__data__;
            data.name = d;
           // Force shape resize in case bold characters overflow shape boundaries:
            data.r = data.width = data.height = data.dim = data.rx = data.ry = data.innerRadius
                   = undefined;
            thisGraph.formatText(selectedElement, data);
            if (data.source) { // It's an edge
              selectedElement.select(".foregroundText")
                             .style("fill", thisGraph.consts.selectedColor);
            }
            thisGraph.updateGraph();
          } else {
            alert("contextMenuListItem.on(\"mouseup\"): no element selected.");
            return false;
          }
        });
    return true;
  };


  Graphmaker.prototype.showContextMenu = function(e) {
    d3.select("#contextMenuDiv")
      .classed("menuHidden", false).classed("menu", true)
      .style("left", e.clientX + "px")
      .style("top", e.clientY + "px");
  };


  // http://stackoverflow.com/questions/4909167/how-to-add-a-custom-right-click-menu-to-a-webpage
  Graphmaker.prototype.setupContextMenu = function() {
    var thisGraph = this;
    thisGraph.createContextMenu();
    if (document.addEventListener) {
      document.addEventListener("contextmenu", function(e) {
        if (e.which === thisGraph.consts.rightMouseBtn) {
          var elt = e.target || e.srcElement; // target for Firefox, srcElement for Chrome
          if (elt && (elt.tagName !== "svg")) { // Did we right-click on an object?
            while (elt && (elt.tagName !== "g")) { // elt is probably a child of the shapeG we want
              elt = elt.parentElement; // Assume there's a group in the hierarchy
            }
            if (elt) {
              var eltData = elt.__data__;
              var shapeGs = d3.selectAll(".shapeG");
              shapeGs.each(function(d) {
                if ((d.id === eltData.id) // Select the right-clicked-on shape group...
                  && (!thisGraph.state.selectedNode // ...if no shapeG is selected, or...
                  || (thisGraph.state.selectedNode.id !== d.id))) { // ...if d not already selected
                  thisGraph.selectNode(d3.select(this), eltData); // Expects shapeG as the first arg
                }
              });
          }
        }
        if (elt && elt.__data__ && !elt.__data__.manualResize && thisGraph.populateContextMenu()) {
          thisGraph.showContextMenu(e);
        }
        e.preventDefault();
      }
    }, false);
    } else {
      document.attachEvent("oncontextmenu", function() {
        alert("setupContextMenu: oncontextmenu");
        window.event.returnValue = false;
      });
    }
  };


  Graphmaker.prototype.addNewNodes = function() {
    var thisGraph = this;
    var newShapeGroups = thisGraph.shapeGroups.enter().append("g");

    newShapeGroups.classed("shapeG", true)
      .attr("id", function(d) { return "shapeG" + d.id; })
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      })
      .on("mouseover", function() {
        if (thisGraph.state.shiftNodeDrag) {
          d3.select(this).classed(thisGraph.consts.connectClass, true);
        }
      })
      .on("mouseenter", thisGraph.tip.show)
      .on("mouseleave", thisGraph.tip.hide)
      .on("mouseout", function() {
        d3.select(this).classed(thisGraph.consts.connectClass, false);
      })
      .on("mousedown", function(d) {
          thisGraph.shapeMouseDown(d);
      })
      .on("mouseup", function(d) {
        if (d3.event.ctrlKey && d.url) {
          window.open(d.url, d.name);
          window.event.preventDefault();
          window.event.stopPropagation();
        } else if (d3.event.altKey) {
          var defaultUrl = d.url || "";
          var newUrl = prompt("Enter url for this node: ", defaultUrl);
          if (newUrl) {
            // TODO: make this errorchecking more robust
            if ((newUrl.substring(0, 4) !== "http")
             && (newUrl.substring(0, 4) !== "ftp:")
             && (newUrl.substring(0, 4) !== "file")) {
              newUrl = "http://" + newUrl;
            }
            d.url = newUrl;
            d3.select(this).select("text")
              .style("font-weight", thisGraph.boldFontWeight)
              .style("text-decoration", "underline");
            if (!d.manualResize) {
              // Force shape resize in case bold characters overflow shape boundaries:
              d.r = d.width = d.height = d.dim = d.rx = d.ry = d.innerRadius = undefined;
            }
            thisGraph.updateGraph();
          }
        } else if (d3.event.ctrlKey && d3.event.shiftKey) {
          var defaultNote = d.note || "";
          d.note = prompt("Enter note for this node: ", defaultNote);
          thisGraph.state.lastKeyDown = -1;
        } else {
          thisGraph.shapeMouseUp(d3.select(this), d);
        }
      })
      .call(thisGraph.drag);
    return newShapeGroups;
  };


  // Create the new shapes, but don't add them yet.
  Graphmaker.prototype.createNewShapes = function()  {
    var shapeElts = [];
    var shape;
    for (var i = 0; i < this.nodes.length; i++) {
      switch (this.nodes[i].shape) {
        case "rectangle":
        case "noBorder":
          shape = "rect";
          break;
        case "diamond":
          shape = "path";
          break;
        case "star":
          shape = "polygon";
          break;
        default: // circle and ellipse
          shape = this.nodes[i].shape;
          break;
      }
      var shapeElement = document.createElementNS("http://www.w3.org/2000/svg", shape);
      shapeElts.push(shapeElement);
    }
    return shapeElts;
  };


  Graphmaker.prototype.addHandle = function(parentG, rectData) {
    var thisGraph = this;
    var tx = rectData.manualResize ? rectData.width - rectData.xOffset : rectData.width / 2;
    var ty = rectData.manualResize ? rectData.height - rectData.yOffset : rectData.height / 2;
    d3.select(parentG).append("circle")
      .attr("id", "handle" + rectData.id)
      .attr("r", "10")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("transform", "translate(" + tx + "," + ty + ")")
      .style("opacity", 0)
      .style("stroke", "#ff5555")
      .style("fill", "#5555ff")
      .on("mouseover", function() {
        if (d3.event.shiftKey) {
          d3.select(this).style("opacity", 1);
        }
      })
      .on("mousedown", function() {
        if (d3.event.shiftKey) {
          thisGraph.state.clickDragHandle = true;
        }
      })
      .on("mouseup", function() {
        d3.select(this).style("opacity", 0);
      })
      .on("mouseout", function() {
        d3.select(this).style("opacity", 0);
      })
      .call(thisGraph.dragHandle);
  };


  // Add the newly created shapes to the graph, assigning attributes common to all.
  Graphmaker.prototype.addNewShapes = function(newShapeGroups, shapeElts) {
    var thisGraph = this;
    newShapeGroups.append(function(d, i) { return shapeElts[i]; })
                  .attr("class", function(d) { return "shape " + d.shape; })
                  .attr("id", function(d) { return "shape" + d.id; })
                  .style("stroke", function(d) { return d.color; })
                  .style("stroke-width", function(d) { return (d.shape === "noBorder") ? 0 : 2; });
    newShapeGroups.each(function(d) {
                     thisGraph.formatText(d3.select(this), d);
                     if (d.shape === "rectangle") {
                       thisGraph.addHandle(this, d);
                     }
                  });
  };


  Graphmaker.prototype.setEdgeColor = function(edgeGroup) {
    d3.select(edgeGroup).selectAll("path")
      .style("stroke", function(d) { return d.color; })
      .style("marker-end", function(d) {
        return "url(#end-arrow" + d.color.substr(1) + ")";
      });
  };


  Graphmaker.prototype.addNewPaths = function(edgeGroups) {
    var thisGraph = this;
    var newPathGroups = edgeGroups.enter().append("g");
    newPathGroups.classed("pathG", true)
      .on("mousedown", function(d) {
        thisGraph.pathMouseDown(d3.select(this), d);
      })
      .on("mouseup", function(d) {
        if (d3.event.shiftKey) {
          thisGraph.setEdgeColor(this);
          d3.select(this).selectAll("path")
            .style("stroke-width", function(d) { return d.thickness; });
          var d3txt = thisGraph.changeElementText(d3.select(this), d);
          var txtNode = d3txt.node();
          thisGraph.selectText(txtNode);
          txtNode.focus();
        }
        thisGraph.state.mouseDownLink = null;
      })
      .on("mouseover", function() { // Hover color iff not (selected, new edge or inside shape):
        if ((d3.select(this).selectAll("path").style("stroke") !== thisGraph.consts.selectedColor)
            && (!thisGraph.state.shiftNodeDrag) && (!thisGraph.state.justDragged)) {
          d3.select(this).selectAll("path").style("stroke", thisGraph.consts.hoverColor)
            .style("marker-end", "url(#hover-end-arrow)");
          d3.select(this).selectAll("text").style("fill", thisGraph.consts.hoverColor);
        }
      })
      .on("mouseout", function(d) { // If selected go back to selectedColor.
      // Note: "mouseleave", was not getting called in Chrome when the shiftKey is down.
        if (thisGraph.state.selectedEdge && (thisGraph.state.selectedEdge.source === d.source)
          && (thisGraph.state.selectedEdge.target === d.target)) {
          d3.select(this).selectAll("path").style("stroke", thisGraph.consts.selectedColor);
          d3.select(this).selectAll("text").style("fill", thisGraph.consts.selectedColor);
        } else { // Not selected: reapply edge color, including edge text:
          thisGraph.setEdgeColor(this);
          d3.select(this).selectAll("text").style("fill", function(d) { return d.color; });
        }
      })
      .append("path")
        .style("marker-end", function(d) {
          var clr = d.color ? d.color.substr(1) : d.target.color.substr(1);
          return "url(#end-arrow" + clr + ")";
        })
        .classed("link", true)
        .style("stroke", function(d) { return d.color || d.target.color; })
        .style("stroke-width", function(d) { return d.thickness || 3; })
        .style("stroke-dasharray", function (d) {
          return (d.style === "dashed") ? "10, 2" : "none";
        });
    newPathGroups.each(function(d) { thisGraph.formatText(d3.select(this), d); });
    var pathGroups = d3.selectAll(".pathG");
    pathGroups.select("path")
      .attr("d", function(edge) { return thisGraph.setPath(edge); });
    return pathGroups;
  };


  // Check to make sure that there aren't already text objects appended (they would be
  // pathGroups[0][i].childNodes[1] and [2], where the 0th element is expected to be the path)
  // before appending text.
  //
  // Note that there are two text elements being appended. The first is background shadow
  // to ensure that the text is visible where it overlays its edge.
  Graphmaker.prototype.appendPathText = function(pathGroups) {
    var data = [{"class": "shadowText", "stroke-width": "4px"},
                {"class": "foregroundText", "stroke-width": "0px"}];
    for (var i = 0; i < pathGroups[0].length; i++) {         // For each pathGroup...
      if (pathGroups[0][i].childNodes.length < 3) {          // ...if there's no text yet...
        d3.select(pathGroups[0][i]).selectAll("text")
          .data(data)
          .enter().append("text")                        // ...then append it.
            .attr("class", function(d) { return d.class; })
            .attr("text-anchor","middle")
            .text( function(d) { return d.name; })
            .attr("x", function(d) { return (d.source.x + d.target.x) / 2; })
            .attr("y", function(d) { return (d.source.y + d.target.y) / 2; })
            .style("stroke", this.consts.bgColor)
            .style("stroke-width", function(d) { return d.stroke-width; })
            .style("fill", function(d) {
              return d.color;
            });
      }
    }
    d3.selectAll(".pathG").selectAll("text")
      .attr("x", function(d) {
        return (d.source.x + d.target.x) / 2;
      })
      .attr("y", function(d) {
        return (d.source.y + d.target.y) / 2;
      });
  };


  // Call to propagate changes to graph
  Graphmaker.prototype.updateGraph = function() {
    this.updateExistingNodes();
    var newShapeGroups = this.addNewNodes();
    var shapeElts = this.createNewShapes();
    this.addNewShapes(newShapeGroups, shapeElts);
    this.shapeGroups.exit().remove(); // Remove old nodes
    if (this.shapeGroups) {
      this.shapeGroups.each(function(d) {
        if (d.manualResize) {
          var remove = d3.select(this).remove();
          d3.select("#manResizeGG").append(function() {
            return remove.node();
          });
        }
      });
    }
    var edgeGroups = this.updateExistingPaths();
    var newPathGroups = this.addNewPaths(edgeGroups);
    this.appendPathText(newPathGroups);
    edgeGroups.exit().remove(); // Remove old links
  };


  Graphmaker.prototype.fitGridToZoom = function() {
    var reverseTranslate = this.translate;
    reverseTranslate[0] /= -this.zoom;
    reverseTranslate[1] /= -this.zoom;
    d3.select("#gridGroup")
      .attr("transform", "translate(" + reverseTranslate + ")");
  };


  Graphmaker.prototype.zoomed = function() {
    this.state.justScaleTransGraph = true;
    this.zoom = d3.event.scale;
    this.translate = d3.event.translate;
    d3.select(".graph")
      .attr("transform", "translate(" + this.translate + ") scale(" + this.zoom + ")");
    this.createGrid();
  };


  Graphmaker.prototype.updateWindow = function(svg) {
    var docEl = document.documentElement,
        bodyEl = document.getElementsByTagName("body")[0];
    var x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
    var y = window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;
    svg.attr("width", x).attr("height", y);
    this.createGrid();
    this.updateGraph();
  };


  // http://warpycode.wordpress.com/2011/01/21/calculating-the-distance-to-the-edge-of-an-ellipse/
  // Angle theta is measured from the -y axis (recalling that +y is down) clockwise.
  Graphmaker.prototype.computeEllipseBoundary = function(edge) {
    var dx = edge.target.x - edge.source.x;
    var dy = edge.target.y - edge.source.y;
    var rx  = edge.target.rx,
        ry  = edge.target.ry;
    var h = Math.sqrt(dx * dx + dy * dy);
    var s = dx / h; // sin theta
    var c = dy / h; // cos theta
    var length = Math.sqrt(1 / ((s / rx) * (s / rx) + (c / ry) * (c / ry)));
    var offset = 18;
    return length + offset;
  };


  // Angle theta is measured from -y axis (up) clockwise.
  Graphmaker.prototype.computeRectangleBoundary = function(edge) {
    var dx = Math.abs(edge.source.x - edge.target.x);
    var dy = Math.abs(edge.target.y - edge.source.y);
    var hyp = Math.sqrt(dx * dx + dy * dy);
    var absCosTheta = dy / hyp; // Absolute value of cosine theta
    var w = edge.target.width / 2;
    var h = edge.target.height / 2;
    var thresholdCos = h / Math.sqrt(w * w + h * h); // cos of angle where intersect switches sides
    var offset = 22; // Give the arrow a little breathing room
    return ((absCosTheta > thresholdCos) ? h * hyp / dy : w * hyp / dx) + offset;
  };


  Graphmaker.prototype.setPath = function(edge) {
    var boundary = 16; // Initialize to default number of pixels padding for circle, diamond.
    switch (edge.target.shape) {
      case "circle":
        if (edge.target.r) {
          boundary += parseFloat(edge.target.r);
        } else {
          boundary = edge.target.boundary;
        }
        break;
      case ("rectangle"):
      case ("noBorder"):
        boundary = this.computeRectangleBoundary(edge);
        break;
      case "diamond":
        if (edge.target.dim) {
          boundary += (parseFloat(edge.target.dim) / 2);
        } else {
          boundary = edge.target.boundary;
        }
        break;
      case "ellipse":
        boundary = this.computeEllipseBoundary(edge);
        break;
      case "star":
        boundary = edge.target.boundary;
        break;
      default:
        alert("setPath(...): unknown shape: \"" + edge.target.shape + "\"");
        break;
    }
    var newP2 = this.changeLineLength(edge.source.x, edge.source.y, edge.target.x, edge.target.y,
                                     -boundary, (edge.thickness || 3));
    return "M" + edge.source.x + "," + edge.source.y + "L" + newP2.x + "," + newP2.y;
  };


  // Create four concentric rings and five labels (one for each rings and one for the outside)
  Graphmaker.prototype.createSystemSupportMap = function() {
    var rings = [{"name": "Role/Identity", "radius": 110,
                  "color": "#" + this.consts.colorChoices[6]},
                 {"name": "Most Important Responsibilities", "radius": 275,
                  "color": "#" + this.consts.colorChoices[5]},
                 {"name": "General Needs for Each Responsibility", "radius": 475,
                  "color": "#" + this.consts.colorChoices[4]},
                 {"name": "Available Resources", "radius": 675,
                  "color": "#" + this.consts.colorChoices[7]} ];
    d3.select("#graphG").append("g")
      .classed({"ssmGroup": true, "ssmHidden": true, "ssmVisible": false});
    this.state.ssmVisible = false;
    d3.select(".ssmGroup").selectAll(".ssmCircle")
      .data(rings)
      .enter().append("circle")
        .classed("ssmCircle", true)
        .style("stroke", function(d) {
          return d.color;
        })
        .style("fill", "none")
        .attr("r", function(d) { return d.radius; });
    rings.push({"name": "Wish List", "radius": 750, "color": "#" + this.consts.colorChoices[2]});
    d3.select(".ssmGroup").selectAll(".ssmLabel")
      .data(rings)
      .enter().append("text")
        .classed("ssmLabel", true)
        .style("fill", function(d) { return d.color; })
        .text(function(d) { return d.name; });
  };


  Graphmaker.prototype.setupEventListeners = function() {
    var thisGraph = this;
    var svg = thisGraph.svg;
    d3.select(window).on("keydown", function() {
      thisGraph.svgKeyDown();
    })
    .on("keyup", function() {
      thisGraph.svgKeyUp();
    });
    svg.on("mousedown", function() {
      thisGraph.svgMouseDown();
    });
    svg.on("mouseup", function(){
      thisGraph.svgMouseUp();
    });
    window.onresize = function() {thisGraph.updateWindow(svg);};
  };


  // Center circles and text in window
  Graphmaker.prototype.showSystemSupportMap = function() {
    if (!this.SSMCenter) {
      this.SSMCenter = {"x": d3.select("#topGraphDiv").node().clientWidth / 2,
                        "y": d3.select("#topGraphDiv").node().clientHeight / 2};
    }
    var ssmCenter = this.SSMCenter;
    d3.select(".ssmGroup")
      .classed({"ssmHidden": false, "ssmVisible": true});
    this.state.ssmVisible = true;
    d3.selectAll(".ssmCircle")
      .attr("cx", ssmCenter.x)
      .attr("cy", ssmCenter.y);
    d3.selectAll(".ssmLabel")
      .style("font-size", "12px")
      .attr("x", function() {
        return ssmCenter.x - this.getComputedTextLength() / 2; // Why this and not thisGraph?
      })
      .attr("y", function(d, i) {
        var offset = [20, 28, 26, 18, 64];
        return ssmCenter.y - d.radius + offset[i];
      });
    d3.select("#sysSptRingsItem").text(this.consts.ssmHideText)
      .datum({"name": this.consts.ssmHideText});
  };


  Graphmaker.prototype.hideSystemSupportMap = function() {
    this.SSMCenter = null;
    d3.select(".ssmGroup")
      .classed({"ssmHidden": true, "ssmVisible": false});
    this.state.ssmVisible = false;
    d3.select("#sysSptRingsItem").text("Show system support rings")
      .datum({"name": "Show system support rings"});
  };


  // Create three concentric circles.
  Graphmaker.prototype.createCirclesOfCare = function() {
    d3.select("#graphG").append("g")
      .attr("id", "circlesOfCareGroup")
      .classed("visible", this.state.circlesOfCareVisible);
    d3.select("#circlesOfCareGroup").selectAll(".cOfC")
      .data([75, 200, 350])
      .enter().append("circle")
        .classed("cOfC", true)
        .style("fill", "none")
        .attr("r", function(d) {
          return d;
        });
  };


  Graphmaker.prototype.showCirclesOfCare = function() {
    if (!this.CofCCenter) {
      this.CofCCenter = {"x": d3.select("#topGraphDiv").node().clientWidth / 2,
                         "y": d3.select("#topGraphDiv").node().clientHeight / 2};
    }
    this.state.circlesOfCareVisible = true;
    d3.select("#circlesOfCareGroup").classed("visible", this.state.circlesOfCareVisible);
    d3.selectAll(".cOfC")
      .attr("cx", this.CofCCenter.x)
      .attr("cy", this.CofCCenter.y);
    d3.select("#cOfCItem").text(this.consts.cOfChideText)
      .datum({"name": this.consts.cOfChideText});
  };


  Graphmaker.prototype.hideCirclesOfCare = function() {
    this.CofCCenter = null;
    this.state.circlesOfCareVisible = false;
    d3.select("#circlesOfCareGroup").classed("visible", this.state.circlesOfCareVisible);
    d3.select("#cOfCItem").text("Show Circles of Care")
      .datum({"name": "Show Circles of Care"});
  };


  // Return the current map as an JS object.
  Graphmaker.prototype.getMapObject = function() {
    var saveEdges = [];
    this.links.forEach(function(val) {
      saveEdges.push({source: val.source.id,
                      target: val.target.id,
                      style: val.style,
                      color: val.color,
                      thickness: val.thickness,
                      maxCharsPerLine: val.maxCharsPerLine,
                      note: val.note,
                      name: val.name,
                      manualResize: val.manualResize || false
                    });
    });
    return {
      "nodes": this.nodes,
      "links": saveEdges,
      "graphGTransform": d3.select("#graphG").attr("transform"),
      "systemSupportMapCenter": this.SSMCenter,
      "circlesOfCareCenter": this.CofCCenter
    };
  };


  // Save as JSON file
  Graphmaker.prototype.setupDownload = function() {
    var thisGraph = this;
    d3.select("#download-input").on("click", function() {
      var blob = new Blob([window.JSON.stringify(thisGraph.getMapObject())],
                          {type: "text/plain;charset=utf-8"});
      saveAs(blob, "SystemSupportMap.json");
    });
  };


  // Import a JSON document into the editing area
  Graphmaker.prototype.importMap = function(jsonObj, id) {
    var thisGraph = this;
    // TODO better error handling
    try {
      thisGraph.deleteGraph(true);
      thisGraph.nodes = jsonObj.nodes;
      thisGraph.setShapeId(thisGraph.getBiggestShapeId() + 1);
      var newEdges = jsonObj.links;
      newEdges.forEach(function(e, i) {
        newEdges[i] = {source: thisGraph.nodes.filter(function(n) {
                        return n.id === e.source; })[0],
                       target: thisGraph.nodes.filter(function(n) {
                        return n.id === e.target; })[0],
                       style: (e.style === "dashed" ? "dashed" : "solid"),
                       color: e.color,
                       thickness: e.thickness,
                       maxCharsPerLine: (e.maxCharsPerLine || 20),
                       note: e.note,
                       name: e.name,
                       manualResize: e.manualResize};
      });
      thisGraph.links = newEdges;

      var graphGTransform = jsonObj.graphGTransform || "translate(0,0) scale(1)";
      // Inform zoomSvg that we're programmatically setting transform (so additional zoom and
      // translate work smoothly from that transform instead of jumping back to default):
      d3.select("#graphG").attr("transform", graphGTransform);
      var xform = d3.transform(d3.select("#graphG").attr("transform"));
      var tx = xform.translate[0], ty = xform.translate[1], scale = xform.scale[0];
      thisGraph.zoomSvg.translate([tx, ty]).scale(scale);
      thisGraph.zoomSvg.event(thisGraph.svg.transition().duration(500));

      thisGraph.SSMCenter = jsonObj.systemSupportMapCenter;
      if (thisGraph.SSMCenter) {
        thisGraph.showSystemSupportMap();
      } else {
        thisGraph.hideSystemSupportMap();
      }
      thisGraph.hideCirclesOfCare();
      thisGraph.CofCCenter = jsonObj.circlesOfCareCenter;
      if (thisGraph.CofCCenter) {
        thisGraph.showCirclesOfCare();
      }
      thisGraph.updateGraph();
      if (typeof id === 'number') {
        window.location.hash = '/map/' + id;
      }
    } catch(err) {
      window.alert("Error parsing uploaded file\nerror message: " + err.message);
      return;
    }
  }


  // Look in the location's 'hash' property (i.e. everything after the '#') for
  // a map ID. If the hash property is of the form '/map/<id>', where '<id>' is
  // an integer, try to load the map from the server.
  Graphmaker.prototype.loadMapFromLocation = function() {
    var m  = location.hash.match(/\/map\/(\d+)/);
    if (m) {
      var id = m[1];
      var thisGraph = this;
      d3.json(this.consts.backendBase + '/map/' + id)
        .on('beforesend', function(request) { request.withCredentials = true })
        .on('error',
            function(error) {
              var resp = JSON.parse(error.response);
              if (resp.message && resp.message == 'not authenticated') {
                thisGraph.afterAuthentication(function() {
                  thisGraph.loadMapFromLocation();
                });
              } else if (resp.message
                  && resp.message == 'map not owned by authenticated user') {
                alert("You don't have access to map # " + id + '. ' +
                      'Redirecting to a blank map.');
                location.hash = '';
              } else {
                console.error(error);
                alert('Error talking to backend server.');
              }
            })
        .on('load', function(data) {
          thisGraph.importMap(data.document, id);
          location.hash = '/map/' + id;
        })
        .send('GET');
    }
  };


  // Fetch a map from the backend given its id
  Graphmaker.prototype.fetchMap = function(id) {
    var thisGraph = this;
    d3.json(thisGraph.consts.backendBase + '/map/' + id)
      .on('beforesend', function(request) { request.withCredentials = true })
      .on('error',
          function() { window.alert('Error talking to backend server.') })
      .on('load', function(data) {
        d3.select('#map-index').style('visibility', 'hidden');
        thisGraph.importMap(data.document, id);
        location.hash = '/map/' + id;
      })
      .send('GET');
  }


  Graphmaker.prototype.renderMapsList = function(data) {
    d3.selectAll('#map-index .content *').remove();
    var graph = this;
    if (!data || data.length === 0) {
      d3.select('#map-index .content').append('p')
        .text("You're logged in, but you don't have any maps yet. " +
              "To get started, create a map and click the 'save' button.");
      return;
    }

    var asAdmin = data && data[0] && data[0].hasOwnProperty('owner_email');
    var columns =
      ['Map ID', 'Created At', 'Modified At', 'Num. Nodes', 'Num. Links'];
    if (asAdmin) {
      columns.push('Owner Email');
    }

    var table = d3.select('#map-index .content').append('table'),
        thead = table.append('thead'),
        tbody = table.append('tbody');

    thead
      .append('tr')
      .selectAll('th')
      .data(columns)
      .enter()
      .append('th')
      .text(String);

    var rows = tbody
      .selectAll('tr')
      .data(data)
      .enter()
      .append('tr');

    rows.append('td')
      .append('a')
      .attr('href', '#')
      .on('click', function(d) { graph.fetchMap(d.id) })
      .text(function(d) { return d.id });
    rows.append('td').text(function(d) { return d.created_at });
    rows.append('td').text(function(d) { return d.modified_at });
    rows.append('td').text(function(d) { return d.num_nodes });
    rows.append('td').text(function(d) { return d.num_links });
    if (asAdmin) {
      rows.append('td').text(function(d) { return d.owner_email });
    }
  };


  Graphmaker.prototype.listMaps = function() {
    d3.select('#map-index .content')
      .append('div')
      .attr('class', 'loading-message')
      .text('Loading...');
    d3.select('#map-index')
      .style('visibility', 'visible')
      .on('click', function() {
        d3.select('#map-index .loading-message').remove();
        d3.select('#map-index').style('visibility', 'hidden');
        d3.select('#map-index table').remove();
      });
    d3.select('#map-index .content')
      .on('click', function() {
        d3.event.stopPropagation();
      });
    var graph = this;
    d3.json(this.consts.backendBase + '/maps')
      .on('beforesend', function(request) { request.withCredentials = true })
      .on('error',
          function(error) { window.alert('Error talking to backend server.') })
      .on('load', function(result) { graph.renderMapsList(result) })
      .send('GET');
  }


  // Check whether we're authenticated at the backend, and call the callback
  // with the boolean result (i.e. true = authenticated, false = not).
  Graphmaker.prototype.checkAuthentication = function(callback) {
    d3.xhr(this.consts.backendBase + '/testauth')
      .on('beforesend', function(request) { request.withCredentials = true })
      .get(function(error, data) {
        if (error) {
          callback(false);
        } else {
          var message = JSON.parse(data.response).message;
          if (message === 'authenticated') {
            callback(true);
          } else {
            callback(false);
          }
        }
      })
  }


  // Render the registration (i.e. "new user") form and call the callback when
  // the user is created.
  Graphmaker.prototype.renderRegistrationForm = function(callback) {
    var content = d3.select('#authentication .content');
    content.selectAll('*').remove();
    var header = content
      .append('h1')
      .text('Create a new account');
    var form = content
      .append('form')
      .html('<label>' +
            '  Email address:' +
            '  <input type="text" name="email" />' +
            '</label>' +
            '<br />' +
            '<label>' +
            '  Password:' +
            '  <input type="password" name="password" />' +
            '</label>' +
            '<br />' +
            '<label>' +
            '  Confirm password:' +
            '  <input type="password" name="password" />' +
            '</label>' +
            '<br />' +
            '<input type="submit" name="Login" />');

    // JST 2015-08-23 - Stop propagation of keydown events, so that the
    // handlers elsewhere in this code don't prevent default. I needed to do
    // this to allow users to hit 'backspace' in these fields.
    form.selectAll('input[type=text]')
      .on('keydown', function(elt) { d3.event.stopPropagation(); })
    form.selectAll('input[type=password]')
      .on('keydown', function(elt) { d3.event.stopPropagation(); })

    var graph = this;
    var link = content
      .append('a')
      .attr('href', '#')
      .text('Already have an account? Login.')
      .on('click', function() {
        content.selectAll('*').remove();
        graph.renderLoginForm(callback);
      });
    var message = content
      .append('p')
      .attr('class', 'message');

    form.on('submit', function() {
      d3.event.preventDefault();
      if (d3.event.target[1].value != d3.event.target[2].value) {
        d3.select('#authentication p.message')
          .text("Passwords don't match. Try again.");
      } else {
        d3.select('#authentication p.message').text('Loading...');
        var requestData = {
          email   : d3.event.target[0].value,
          password: d3.event.target[1].value
        };
        d3.xhr(graph.consts.backendBase + '/register')
          .header('Content-Type', 'application/json')
          .on('beforesend',
              function(request) { request.withCredentials = true })
          .post(JSON.stringify(requestData), function(error, data) {
            if (error) {
              d3.select('#authentication p.message').text('Login failed');
            } else {
              d3.select('#authentication').style('visibility', 'hidden');
              d3.select('#authentication .content *').remove();
              callback();
            }
          });
      }
    });
  };


  // Render the login form and call the callback when the user is auth'd.
  Graphmaker.prototype.renderLoginForm = function(callback) {
    var content = d3.select('#authentication .content');
    content.selectAll('*').remove();
    var header = content
      .append('h1')
      .text('You must log in first:');
    var form = content
      .append('form')
      .attr("id", "login")
      .html('<label>' +
            '  Email address:' +
            '</label>' +
            '  <input type="text" name="email" />' +
            '<br />' +
            '<label>' +
            '  Password:' +
            '</label>' +
            '  <input type="password" name="password" />' +
            '<br />' +
            '<input type="submit" name="Log in" />');

    // JST 2015-08-23 - Stop propagation of keydown events, so that the
    // handlers elsewhere in this code don't prevent default. I needed to do
    // this to allow users to hit 'backspace' in these fields.
    form.selectAll('input[type=text]')
      .on('keydown', function(elt) { d3.event.stopPropagation(); })
    form.selectAll('input[type=password]')
      .on('keydown', function(elt) { d3.event.stopPropagation(); })

    var graph = this;
    var link = content
      .append('a')
      .attr('href', '#')
      .text("Don't have an account? Create one.")
      .on('click', function() {
        content.selectAll('*').remove();
        graph.renderRegistrationForm(callback);
      });
    var message = content
      .append('p')
      .attr('class', 'message');

    form.on('submit', function() {
      d3.event.preventDefault();
      d3.select('#authentication p.message').text('Loading...');
      var requestData = {
        email   : d3.event.target[0].value,
        password: d3.event.target[1].value
      };
      d3.xhr(graph.consts.backendBase + '/login')
        .header('Content-Type', 'application/json')
        .on('beforesend', function(request) { request.withCredentials = true })
        .post(JSON.stringify(requestData), function(error, data) {
          if (error) {
            d3.select('#authentication p.message').text('Login failed');
          } else {
            d3.select('#authentication').style('visibility', 'hidden');
            d3.select('#authentication .content *').remove();
            callback();
          }
        });
    });
  };


  // Prompt user for login/registration, then call the given function (with no
  // arguments).
  Graphmaker.prototype.afterAuthentication = function(callback) {
    graph = this;
    this.checkAuthentication(function(isAuthenticated) {
      if (isAuthenticated) {
        callback();
      } else {
        d3.select('#authentication')
          .style('visibility', 'visible')
          .on('click', function() {
            d3.select('#authentication').style('visibility', 'hidden');
            d3.select('#authentication .content *').remove();
          });
        d3.select('#authentication .content')
          .on('click', function() {
            d3.event.stopPropagation();
          })
        graph.renderLoginForm(callback);
      }
    });
  };


  // Log the current user out.
  Graphmaker.prototype.logoutUser = function() {
    d3.xhr(graph.consts.backendBase + '/logout')
      .on('beforesend', function(request) { request.withCredentials = true })
      .get(function(error, data) {
        if (error) {
          console.log('Logout error:', error);
          alert('Error logging out.');
        } else {
          alert("You have logged out from SSM.");
        }
      });
  }


  // Open/read JSON file
  Graphmaker.prototype.setupUpload = function() {
    var thisGraph = this;
    d3.select("#upload-input").on("click", function() {
      document.getElementById("hidden-file-upload").click();
    });

    d3.select("#hidden-file-upload").on("change", function() {
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        var uploadFile = this.files[0];
        var filereader = new window.FileReader();
        var txtRes;

        filereader.onload = function() {
          try {
            txtRes = filereader.result;
          } catch(err) {
            window.alert("Error reading file: " + err.message);
          }
          return thisGraph.importMap(JSON.parse(txtRes));
        };
        filereader.readAsText(uploadFile);
      } else {
        alert("Your browser won't let you read this file -- try upgrading your browser to IE 10+ "
            + "or Chrome or Firefox.");
      }
    });
  };


  Graphmaker.prototype.setupReadMapFromDatabase = function() {
    var graph = this;
    d3.select("#read-from-db")
      .on("click",
          function() {
            graph.afterAuthentication(function() {
              graph.listMaps(graph)
            });
          });
  };


  Graphmaker.prototype.setupWriteMapToDatabase = function() {
    var graph = this;
    d3.select("#write-to-db").on("click", function() {
      graph.afterAuthentication(function() {
	var m  = location.hash.match(/\/map\/(\d+)/);
	if (m) {
	  // update existing map
	  var id = m[1];
	  d3.xhr(graph.consts.backendBase + '/map/' + id)
	    .header('Content-Type', 'application/json')
	    .on('beforesend', function(request) {
	      request.withCredentials = true
	    })
	    .on('error', function(req) {
	      var resp = req.response && JSON.parse(req.response);
	      if (resp
		  && resp.message == 'map not owned by authenticated user') {
		alert("Can't save: you have read-only access to this map.");
	      } else {
		console.error('Failed to save map. Request was:', req);
		alert('Failed to save map # ' + id);
	      }
	    })
	    .on('load', function(data) {
	      console.log('saved map # ' + id);
	    })
	    .send('PUT', JSON.stringify(graph.getMapObject()));

	} else {
	  // create new map
	  d3.xhr(graph.consts.backendBase + '/map')
	    .header('Content-Type', 'application/json')
	    .on('beforesend', function(request) {
	      request.withCredentials = true;
	    })
	    .on('error', function(req) {
	      console.error('Failed to save new map. Request was:', req);
	      alert('Failed to save new map ');
	    })
	    .on('load', function(request) {
	      var data = JSON.parse(request.response);
	      console.log('saved new map # ' + data.id);
	      location.hash = '/map/' + data.id;
	    })
	    .send('POST', JSON.stringify(graph.getMapObject()));
	}
      });
    });
  };


  Graphmaker.prototype.equalizeSelectedShapeSize = function(shape) {
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
          var thisInnerRadius = thisGraph.computeInnerRadius(thisShapeElt.attr("points")
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
          thisGraph.calculateStarPoints(0, 0, 5, innerRadius * 2, innerRadius));
        break;
      default:
        alert("equalizeSelectedShapeSize(): unknown shape \"" + d.shape + "\"");
        break;
    }

    thisGraph.shapeGroups.each(function(d) {
      thisGraph.storeShapeSize(d3.select(this), d);
    });
    thisGraph.updateExistingPaths();
    thisGraph.updateGraph();
  };


  Graphmaker.prototype.createEqShapeSizeSubmenu = function() {
    var thisGraph = this;
    d3.select("#eqShapeSizeItem").append("div")
      .classed("menuHidden", true).classed("menu", false)
      .attr("id", "eqShapeSizeSubmenuDiv")
      .attr("position", "absolute")
      .style("width", "200px")
      .on("mouseleave", function() {
        d3.select("#eqShapeSizeSubmenuDiv").classed("menu", false).classed("menuHidden", true);
      })
      .on("mouseup", function() {
        d3.select("#eqShapeSizeSubmenuDiv").classed("menu", false).classed("menuHidden", true);
      });
    var choices = [{"name": "Equalize selected shape size"},
                   {"name": "Equalize sizes for all shapes"}];

    d3.select("#eqShapeSizeSubmenuDiv").append("ul").attr("id", "eqShapeSizeSubmenuList");
    d3.select("#eqShapeSizeSubmenuList").selectAll("li.eqShapeSizeSubmenuListItem")
      .data(choices).enter()
      .append("li")
        .classed("eqShapeSizeSubmenuListItem", true)
        .attr("id", function(d, i) { return "eqShapeSizeOption" + i; })
        .text(function(d) { return d.name; })
        .on("mouseup", function() {
          d3.select("#eqShapeSizeSubmenuDiv").classed("menu", false).classed("menuHidden", true);
          d3.select("#optionsMenuDiv")
            .classed("menu", false).classed("menuHidden", true);

          switch (d3.select(this).datum().name) {
            case choices[0].name:
              thisGraph.equalizeSelectedShapeSize(thisGraph.shapeSelected);
              break;
            case choices[1].name:
              var shapes = ["circle", "rectangle", "diamond", "ellipse", "star", "noBorder"];
              for (var i = 0; i < shapes.length; i++) {
                thisGraph.equalizeSelectedShapeSize(shapes[i]);
              }
              break;
            default:
              alert("\"" + d.name + "\" item is not implemented.");
              break;
          }
        });
  };


  Graphmaker.prototype.createTextLineLengthSubmenu = function() {
    var thisGraph = this;
    var maxCharsPerLine = thisGraph.maxCharsPerLine;
    d3.select("#setTextLineLenItem").append("div")
      .classed("menuHidden", true).classed("menu", false)
      .attr("id", "textLineLengthSubmenuDiv")
      .attr("position", "absolute")
      .style("width", "120px")
      .on("mouseleave", function() {
        d3.select("#textLineLengthSubmenuDiv").classed("menu", false).classed("menuHidden", true);
      })
      .on("mouseup", function() {
        d3.select("#textLineLengthSubmenuDiv").classed("menu", false).classed("menuHidden", true);
      });
    var choices = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
    d3.select("#textLineLengthSubmenuDiv").append("ul").attr("id", "textLineLengthSubmenuList");
    d3.select("#textLineLengthSubmenuList").selectAll("li.textLineLengthSubmenuListItem")
      .data(choices).enter()
      .append("li")
        .classed("textLineLengthSubmenuListItem", true)
        .attr("id", function(d, i) { return "edgeThicknessOption" + i; })
        .text(function(d) { return d + " characters"; })
        .style("text-shadow", function() {
          return (parseInt(d3.select(this).datum(), 10) === maxCharsPerLine)
            ? "1px 1px #000000" : "none"; })
        .style("color", function() {
          return (parseInt(d3.select(this).datum(), 10) === maxCharsPerLine)
            ? thisGraph.consts.selectedColor : thisGraph.consts.unselectedStyleColor;
        })
        .on("mouseup", function() {
          thisGraph.maxCharsPerLine = parseInt(d3.select(this).datum(), 10);
          d3.select("#textLineLengthSubmenuDiv").classed("menu", false).classed("menuHidden", true);
          d3.select("#menuDiv")
            .classed("menu", false).classed("menuHidden", true);
          d3.selectAll(".textLineLengthSubmenuListItem")
            .style("color", thisGraph.consts.unselectedStyleColor)
            .style("text-shadow", "none");
          d3.select(this)
            .style("color", thisGraph.consts.selectedColor)
            .style("text-shadow", "1px 1px #000000");
        });
  };


  Graphmaker.prototype.createEdgeThicknessSubmenu = function() {
    var thisGraph = this;
    d3.select("#setLineThicknessItem").append("div")
      .classed("menuHidden", true).classed("menu", false)
      .attr("id", "edgeThicknessSubmenuDiv")
      .attr("position", "absolute")
      .style("width", "90px")
      .on("mouseleave", function() {
        d3.select("#edgeThicknessSubmenuDiv").classed("menu", false).classed("menuHidden", true);
      })
      .on("mouseup", function() {
        d3.select("#edgeThicknessSubmenuDiv").classed("menu", false).classed("menuHidden", true);
      });
    var choices = [1, 2, 3, 4, 5, 6, 7];
    d3.select("#edgeThicknessSubmenuDiv").append("ul").attr("id", "edgeThicknessSubmenuList");
    d3.select("#edgeThicknessSubmenuList").selectAll("li.edgeThicknessSubmenuListItem")
      .data(choices).enter()
      .append("li")
        .classed("edgeThicknessSubmenuListItem", true)
        .attr("id", function(d, i) { return "edgeThicknessOption" + i; })
        .text(function(d) { return d + " pixel" + (d > 1 ? "s" : ""); })
        .style("text-shadow", function() {
          return (parseInt(d3.select(this).datum(), 10) === thisGraph.edgeThickness)
            ? "1px 1px #000000" : "none"; })
        .style("color", function() {
          return (parseInt(d3.select(this).datum(), 10) === thisGraph.edgeThickness)
            ? thisGraph.consts.selectedColor : thisGraph.consts.unselectedStyleColor;
        })
        .on("mouseup", function() {
          d3.select("#edgeThicknessSubmenuDiv").classed("menu", false).classed("menuHidden", true);
          d3.select("#optionsMenuDiv")
            .classed("menu", false).classed("menuHidden", true);
          thisGraph.edgeThickness = parseInt(d3.select(this).datum(), 10);
          d3.selectAll(".edgeThicknessSubmenuListItem")
            .style("color", thisGraph.consts.unselectedStyleColor)
            .style("text-shadow", "none");
          d3.select(this)
            .style("color", thisGraph.consts.selectedColor)
            .style("text-shadow", "1px 1px #000000");
        });
  };


  // Return dimensions of bounding box for all visible objects plus a little extra. Ignore toolbox.
  Graphmaker.prototype.getGraphExtent = function(shapes) {
    var minX = Number.MAX_VALUE;
    var maxX = Number.MIN_VALUE;
    var minY = Number.MAX_VALUE;
    var maxY = Number.MIN_VALUE;
    shapes.each(function(d) {
      if (d3.select(this).style("display") !== "none") { // Don't include hidden objects
        var bbox = this.getBBox();
        var x = d.x || parseFloat(d3.select(this).attr("cx")); // ssmCircles: no x, y
        var y = d.y || parseFloat(d3.select(this).attr("cy"));
        var thisXMin = x - bbox.width / 2;
        var thisXMax = x + bbox.width / 2;
        var thisYMin = y - bbox.height / 2;
        var thisYMax = y + bbox.height / 2;
        minX = (minX < thisXMin) ? minX : thisXMin;
        maxX = (maxX > thisXMax) ? maxX : thisXMax;
        minY = (minY < thisYMin) ? minY : thisYMin;
        maxY = (maxY > thisYMax) ? maxY : thisYMax;
      }
    });
    var width = maxX - minX;
    var height = maxY - minY;
    var xCushion = 40, yCushion = 100;
    return {"w": width + xCushion, "h": height + yCushion};
  };


  // Based on http://techslides.com/save-svg-as-an-image
  Graphmaker.prototype.exportGraphAsImage = function() {
    var shapes = d3.selectAll(".ssmGroup circle, g.shapeG .shape, .cOfC");

    // Set attributes of objects to render correctly without css:
    shapes.style("fill", "#F6FBFF");
    d3.select("#circlesOfCareGroup")
      .attr("display", this.state.circlesOfCareVisible ? "inline-block" : "none");
    d3.selectAll(".cOfC")
      .style("fill", "none")
      .style("stroke-width", "1px")
      .style("stroke", "#000000");
    d3.selectAll(".ssmCircle")
      .style("fill", "none")
      .style("display", (this.state.ssmVisible ? "inline-block" : "none"));
    d3.selectAll(".ssmHidden").attr("display", "none");
    d3.select("#gridGroup").attr("display", "none");
    d3.select("#mainSVG").style("background-color", this.consts.bgColor);
    var edges = d3.selectAll(".link")
                  .style("marker-end", function() {
                    var marker = d3.select(this).style("marker-end");
                    return marker;
                  });

    // Set svg viewport so that all objects are visible in image, even if clipped by window:
    var extent = this.getGraphExtent(shapes);
    var mainSVG = d3.select("#mainSVG");
    var previousW =  mainSVG.attr("width"); // Save for restoring after image is generated
    var previousH = mainSVG.attr("height"); // "                                         "
    mainSVG.attr("width", extent.w)
           .attr("height", extent.h)
           .style("font-size", this.consts.defaultFontSize) // export to image sees no css
           .style("overflow", "visible");

    // Make credits visible:
    d3.select("#credits")
      .attr("display", "block")
      .attr("y", extent.h - 30)
     .text("Generated " + Date() + " by System Support Mapper (Copyright (C) 2014-2015 UNC-CH)");

    // Create canvas:
    d3.select("body").append("canvas")
      .attr("width", extent.w)
      .attr("height", extent.h);
    var canvas = document.querySelector("canvas");
    var context = canvas.getContext("2d");

    // Create event handler to draw svg onto canvas, convert to image, and export .png:
    var image = new Image();
    image.onload = function() {
      context.drawImage(image, 0, 0);
      var canvasData = canvas.toDataURL("image/png");
      var pngImage = '<img src="' + canvasData + '">';
      d3.select("#pngdataurl").html(pngImage);
      var a = document.createElement("a");
      a.download = "SystemSupportMap.png";
      a.href = canvasData;
      a.click();
    };
    image.onerror = function imageErrorHandler(event) {
      alert("Export to image failed");
    };

    var html = mainSVG.attr("version", 1.1)
                      .attr("xmlns", "http://www.w3.org/2000/svg")
                      .node().parentNode.innerHTML;
    var imgsrc = "data:image/svg+xml;base64," + btoa(html);
    var img = '<img src="' + imgsrc + '">';
    d3.select("#svgdataurl").html(img);
    image.src = imgsrc;

    // Reset dimensions and attributes for normal appearance and interactive behavior:
    mainSVG.attr("width", previousW)
           .attr("height", previousH)
           .style("overflow", "hidden");
    shapes.style("fill", undefined);
    d3.selectAll(".ssmCircle, .cOfC").style("fill", "none");
    d3.select("#credits").attr("display", "none");
    this.updateGraph();
    canvas.remove();
  };


  // Set the currently selected shape to the currently selected color. Generate an error message if
  // no shape is selected.
  Graphmaker.prototype.setSelectedObjectColor = function() {
    var selectedObject = this.state.selectedNode || this.state.selectedEdge;
    if (!selectedObject) {
      alert("setSelectedObjectColor: no object selected.");
      return;
    }
    selectedObject.color = this.clr;
    var selectedElement = d3.select("#" + selectedObject.domId);
    selectedElement.select(".shape").style("stroke", this.clr);
    selectedElement.select("text").style("fill", this.clr);
    this.updateGraph();
  };


  Graphmaker.prototype.generateGridLineEndPoints = function() {
    var thisGraph = this;
    var data = [];
    var topDiv = d3.select("#topGraphDiv");
    var bcr = d3.select("#mainSVG").node().getBoundingClientRect();
    var maxX = bcr.width / this.zoom, maxY = bcr.height / this.zoom;
    var x1 = 0, y1 = 0, x2 = 0, y2 = maxY, n = 0;
    // Create fewer gridlines when zooming out:
    var w = thisGraph.zoom > 0.2 ? thisGraph.gridCellW
                                 : (thisGraph.zoom > 0.02 ? thisGraph.gridCellW * 4
                                                          : thisGraph.gridCellW * 40);
    var h = thisGraph.zoom > 0.2 ? thisGraph.gridCellH
                                 : (thisGraph.zoom > 0.02 ? thisGraph.gridCellH * 4
                                                          : thisGraph.gridCellH * 40);
    while(x1 <= maxX) {
      data.push({"x1": x1, "y1": y1, "x2": x2, "y2": y2, "orientation": "Vert", "n": n++});
      x1 += parseFloat(w);
      x2 = x1;
    }
    x1 = 0, y1 = 0, x2 = maxX, y2 = 0, n = 0;
    while(y1 <= maxY) {
      data.push({"x1": x1, "y1": y1, "x2": x2, "y2": y2, "orientation": "Horiz", "n": n++});
      y1 += parseFloat(h);
      y2 = y1;
    }
    return data;
  };


  Graphmaker.prototype.createGrid = function() {
    var thisGraph = this;
    if (thisGraph.grid) {
      thisGraph.grid.remove();
      thisGraph.grid = null;
    }
    thisGraph.grid = d3.select("#graphG").insert("g", ":first-child")
      .attr("id", "gridGroup")
      .classed("visible", thisGraph.state.gridVisible);

    var data = thisGraph.generateGridLineEndPoints();
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
    thisGraph.fitGridToZoom();
  };


  Graphmaker.prototype.enableGrid = function() {
    d3.select("#gridGroup").classed("visible", true);
    this.state.gridVisible = true;
  };


  Graphmaker.prototype.showSnapToGridText = function() {
    d3.select("#snapToGridItem").text("Snap to grid")
      .datum({"name": "Snap to grid"});
  };


  Graphmaker.prototype.showTurnOffGridText = function() {
    d3.select("#snapToGridItem").text(this.consts.turnOffGridText)
      .datum({"name": this.consts.turnOffGridText});
  };


  Graphmaker.prototype.enableSnapToGrid = function() {
    if (!this.grid) {
      this.createGrid();
    }
    this.enableGrid();
    this.showTurnOffGridText();
  };


  Graphmaker.prototype.turnOffGrid = function() {
    d3.select("#gridGroup").classed("visible", false);
    this.state.gridVisible = false;
    this.showSnapToGridText();
  };


  Graphmaker.prototype.optionsMenuListItemMouseUp = function(listItem, d, choices) {
    // Hide the menu unless there's a submenu open:
    if ((d.id !== "eqShapeSizeItem") && (d.id !== "setTextLineLenItem")
                                     && (d.id !== "setLineThicknessItem")) {
      d3.select("#optionsMenuDiv").classed("menu", false).classed("menuHidden", true);
    }

    if (this.displayAll) {
      switch (d3.select(listItem).datum().name) {
      // Beware: d3.select(listItem).text() returns concatenation of all submenu text.
        case choices[0].name:
          this.showSystemSupportMap();
          break;
        case this.consts.ssmHideText:
          this.hideSystemSupportMap();
          break;
        case choices[1].name:
          this.showCirclesOfCare();
          break;
        case this.consts.cOfChideText:
          this.hideCirclesOfCare();
          break;
        case choices[2].name:
        case choices[3].name:
        case choices[4].name:
          break; // These menu items have submenus with their own event handlers
        case choices[5].name:
          this.setSelectedObjectColor();
          break;
        case choices[6].name:
          this.enableSnapToGrid();
          break;
        case this.consts.turnOffGridText:
          this.turnOffGrid();
          break;
        case this.consts.ssmHideText:
          this.hideSystemSupportMap();
          break;
        case choices[7].name:
          this.exportGraphAsImage();
          break;
        case choices[8].name:
          this.loadContextTextFromClient();
          break;
        case choices[9].name:
          this.logoutUser();
          break;
        default:
          alert("\"" + d.name + "\" not implemented.");
      }
    } else {
      if (d3.select(listItem).datum().id === "exportMapAsImageItem") {
        this.exportGraphAsImage();
      } else if (d3.select(listItem).datum().id === "loadContextTextItem") {
        this.loadContextTextFromClient();
      } else if (d3.select(listItem).datum().id === "logoutUser") {
        this.logoutUser();
      }
    }
  };


  Graphmaker.prototype.createOptionsMenu = function() {
    var thisGraph = this;
    var choices = null;
    if (this.displayAll) {
      choices = [{"name": "Show system support rings", "id": "sysSptRingsItem"},
                 {"name": "Show Circles of Care", "id": "cOfCItem"},
                 {"name": "Equalize shape size...", "id": "eqShapeSizeItem"},
                 {"name": "Set text line length...", "id": "setTextLineLenItem"},
                 {"name": "Set line thickness...", "id": "setLineThicknessItem"},
                 {"name": "Set selected object color", "id": "setSelectedObjectColorItem"},
                 {"name": "Snap to grid", "id": "snapToGridItem"},
                 {"name": "Export map as image", "id": "exportMapAsImageItem"},
                 {"name": "Load text for context menu", "id": "loadContextTextItem"},
                 {"name": "Log out", "id": "logoutUser"}];
    } else {
      choices = [{"name": "Equalize shape size...", "id": "eqShapeSizeItem"},
                 {"name": "Set text line length...", "id": "setTextLineLenItem"},
                 {"name": "Set line thickness...", "id": "setLineThicknessItem"},
                 {"name": "Export map as image", "id": "exportMapAsImageItem"},
                 {"name": "Load context text", "id": "loadContextTextItem"},
                 {"name": "Log out", "id": "logoutUser"}];
    }
    d3.select("#topGraphDiv").insert("div", ":first-child")
      .classed("menuHidden", true).classed("menu", false)
      .attr("id", "optionsMenuDiv")
      .attr("position", "absolute")
      .on("mouseleave", function() {
        d3.select("#optionsMenuDiv")
            .classed("menu", false).classed("menuHidden", true);
      });
    d3.select("#optionsMenuDiv").append("ul").attr("id", "optionsMenuList");
    d3.select("#optionsMenuList").selectAll("li.optionsMenuListItem")
      .data(choices).enter()
      .append("li")
        .classed("optionsMenuListItem", true)
        .attr("id", function(d, i) { return d.id; })
        .text(function(d) { return d.name; })
        .on("mouseover", function(d) {
          if (d.id === "eqShapeSizeItem") {
            d3.select("#eqShapeSizeSubmenuDiv")
              .classed("menu", true).classed("menuHidden", false);
          } else if (d.id === "setTextLineLenItem") {
            d3.select("#textLineLengthSubmenuDiv")
              .classed("menu", true).classed("menuHidden", false);
          } else if (d.id === "setLineThicknessItem") {
            d3.select("#edgeThicknessSubmenuDiv")
              .classed("menu", true).classed("menuHidden", false);
          }
        })
        .on("mouseout", function(d) {
          if (d.id === "eqShapeSizeItem") {
            d3.select("#eqShapeSizeSubmenuDiv").classed("menu", false).classed("menuHidden", true);
          } else if (d.id === "setTextLineLenItem") {
            d3.select("#textLineLengthSubmenuDiv")
             .classed("menu", false).classed("menuHidden", true);
          } else if (d.id === "setLineThicknessItem") {
            d3.select("#edgeThicknessSubmenuDiv")
             .classed("menu", false).classed("menuHidden", true);
          }
        })
        .on("mouseup", function(d) {
          thisGraph.optionsMenuListItemMouseUp(this, d, choices);
        });

    thisGraph.createEqShapeSizeSubmenu();
    thisGraph.createTextLineLengthSubmenu();
    thisGraph.createEdgeThicknessSubmenu();
  };


  /**** MAIN ****/

  window.onbeforeunload = function() {
    return "Make sure to save your graph locally before leaving.";
  };

  var docEl = document.documentElement,
      bodyEl = document.getElementsByTagName("body")[0];

  var width = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
      height =  window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;

  // Initial node data
  var nodes = [];
  var links = [];

  /** MAIN SVG **/
  d3.select("#topGraphDiv").append("div")
    .attr("id", "mainSVGDiv");

  var svg = d3.select("#mainSVGDiv").append("svg")
        .attr("id", "mainSVG")
        .style("font-family", "arial")
        .attr("width", width)
        .attr("height", height);
  var graph = new Graphmaker(svg, nodes, links);
  graph.setShapeId(0);
  graph.updateGraph();
  graph.loadMapFromLocation();
})(window.d3, window.saveAs, window.Blob);

},{"./help.js":1}]},{},[2]);
