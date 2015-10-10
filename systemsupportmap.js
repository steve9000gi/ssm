/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * Copyright (C) 2014-2015 The University of North Carolina at Chapel Hill
 * All rights reserved.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS, CONTRIBUTORS, AND THE
 * UNIVERSITY OF NORTH CAROLINA AT CHAPEL HILL "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED * TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
 * EVENT SHALL THE COPYRIGHT OWNER, CONTRIBUTORS OR THE UNIVERSITY OF NORTH
 * CAROLINA AT CHAPEL HILL BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY * OF SUCH DAMAGE.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Build a graph with nodes of several shapes and colors, and connect them with
// directed edges. Save a constructed graph locally as a json file, and open and
// display saved graph files.
// Based on Colorado Reed's https://github.com/cjrd/directed-graph-creator.

document.onload = (function(d3, saveAs, Blob, undefined) {
  "use strict";

  var modHelp = require('./help.js'),
      modContextMenu = require('./context-menu.js'),
      modAuth = require('./auth.js'),
      modDatabase = require('./database.js'),
      modFile = require('./file.js'),
      modCirclesOfCare = require('./circles-of-care.js'),
      modEdgeStyle = require('./edge-style.js'),
      modEdgeThickness = require('./edge-thickness.js'),
      modGrid = require('./grid.js'),
      modZoom = require('./zoom.js'),
      modFrontMatter = require('./front-matter.js'),
      modSelectedColor = require('./selected-color.js'),
      modSelectedShape = require('./selected-shape.js'),
      modSystemSupportMap = require('./system-support-map.js');

  // Define graphcreator object
  var Graphmaker = function(svg, nodes, links) {
    this.initializeMemberVariables();
    this.prepareToolbox();
    modFrontMatter.addLogos(d3);
    modFrontMatter.addCopyright(d3);
    modFrontMatter.addCredits(d3);
    this.setupNotes();
    this.defineArrowMarkers();
    if (this.displayAll) {
      modCirclesOfCare.create(d3);
    }
    modSystemSupportMap.create(d3);
    this.setupMMRGroup();
    this.setupDrag();
    this.setupDragHandle();
    modZoom.setup(d3, svg);
    this.setupSVGNodesAndLinks();
    this.setupEventListeners();
    modSystemSupportMap.show(d3);
    modFile.setupDownload(d3, saveAs, Blob);
    modFile.setupUpload(d3);
    modDatabase.setupReadMapFromDatabase(d3);
    modDatabase.setupWriteMapToDatabase(d3);
    modContextMenu.setup(d3);
  };


  Graphmaker.prototype.consts =  {
    backendBase: 'http://syssci.renci.org:8080',
    selectedClass: "selected",
    connectClass: "connect-node",
    activeEditId: "active-editing",
    BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13,
    defaultShapeText: {"circle":    "Identity",
                       "rectangle": "Responsibility",
                       "diamond":   "Need",
                       "ellipse":   "Resource",
                       "star":      "Wish",
                       "noBorder":  "text"},
    defaultFontSize: 12, // Also set in css file because image export doesn't see css
    rightMouseBtn: 3
  };


  /* PROTOTYPE FUNCTIONS */


  Graphmaker.prototype.initializeMemberVariables = function() {
    this.displayAll = true; // If false turns off some features
    this.svg = svg;
    this.shapeId = 0;
    this.maxCharsPerLine = 20;
    this.boldFontWeight = 900;
    this.edgeNum = 0;
    this.nodes = nodes || [];
    this.links = links || [];
    // shapeNum values are 1-based because they're used in front-facing text:
    this.shapeNum = {"circle": 1, "rectangle": 1, "diamond": 1, "ellipse": 1, "star": 1,
                          "noBorder": 1};
    this.state = {
      selectedNode: null,
      selectedEdge: null,
      mouseDownNode: null,
      mouseDownLink: null,
      justDragged: false,
      lastKeyDown: -1,
      shiftNodeDrag: false,
      selectedText: null,
      clickDragHandle: false
    };
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


  // Edge, shape, and color selection, plus "?" help and Options buttons, load, save, and delete.
  Graphmaker.prototype.prepareToolbox = function() {
    var thisGraph = this;
    modCirclesOfCare.center = null; // CirclesOfCareCenter
    modSystemSupportMap.center = null; // System Support Map Center

    // Handle delete graph
    d3.select("#delete-graph").on("click", function() { thisGraph.deleteGraph(false); });

    modHelp(d3);
    thisGraph.createOptionsMenu();
    thisGraph.createOptionsButton();
    modSelectedColor.createColorPalette(d3);
    modSelectedShape.addShapeSelection(d3);
    modEdgeStyle.addControls(d3);
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
    .data(modSelectedColor.colorChoices)
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
    var markerData = [
      {"id": "mark-end-arrow", "fill": "#000000"},
      {"id": "selected-end-arrow", "fill": modSelectedColor.color},
      {"id": "hover-end-arrow", "fill": modSelectedColor.hoverColor}];
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
        modGrid.snap(args);
        // Todo check if edge-mode is selected
      });
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


  Graphmaker.prototype.dragmove = function(d) {
    if (this.state.shiftNodeDrag) { // Creating a new edge
      this.dragLine.attr("d", "M" + d.x + "," + d.y + "L" + d3.mouse(this.svgG.node())[0]
                                        + "," + d3.mouse(this.svgG.node())[1]);
    } else { // Translating a shape
      this.dragLine.style("stroke-width", 0);
      d.x += d3.event.dx;
      d.y +=  d3.event.dy;
      modGrid.snap(d);
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
      modCirclesOfCare.hide(d3);
      modSystemSupportMap.show(d3);
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
                .style("stroke", modSelectedColor.bgColor)
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
      modSelectedShape.setShapeSizeAndPosition(d3, gEl, el, d);
      modSelectedShape.storeShapeSize(gEl, d);
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
          .style("stroke", modSelectedColor.color)
          .style("marker-end", "url(#selected-end-arrow)");
    d3Path.select(".foregroundText")
          .style("fill", modSelectedColor.color);
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
        .style("stroke-width", modEdgeThickness.thickness)
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
        curScale = nodeBCR.width / (modSelectedShape.minCircleRadius * 2),
        useHW = curScale > 1 ? nodeBCR.width * 1.71 : modSelectedShape.minCircleRadius * 4.84;

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
                   style: modEdgeStyle.style,
                   color: modSelectedColor.clr,
                   thickness: modEdgeThickness.thickness,
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

    if (modZoom.justScaleTransGraph) { // Dragged not clicked
      modZoom.justScaleTransGraph = false;
    } else if (state.graphMouseDown && d3.event.shiftKey) { // Clicked not dragged from svg
      var xycoords = d3.mouse(this.svgG.node());

      var d = {id: this.shapeId,
               name: this.consts.defaultShapeText[modSelectedShape.shape] + " "
                   + this.shapeNum[modSelectedShape.shape]++,
               x: xycoords[0],
               y: xycoords[1],
               color: modSelectedColor.clr,
               shape: modSelectedColor.shape};
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
        if ((d3.select(this).selectAll("path").style("stroke") !== modSelectedColor.color)
            && (!thisGraph.state.shiftNodeDrag) && (!thisGraph.state.justDragged)) {
          d3.select(this).selectAll("path").style("stroke", modSelectedColor.hoverColor)
            .style("marker-end", "url(#hover-end-arrow)");
          d3.select(this).selectAll("text").style("fill", modSelectedColor.hoverColor);
        }
      })
      .on("mouseout", function(d) { // If selected go back to selectedColor.
      // Note: "mouseleave", was not getting called in Chrome when the shiftKey is down.
        if (thisGraph.state.selectedEdge && (thisGraph.state.selectedEdge.source === d.source)
          && (thisGraph.state.selectedEdge.target === d.target)) {
          d3.select(this).selectAll("path").style("stroke", modSelectedColor.color);
          d3.select(this).selectAll("text").style("fill", modSelectedColor.color);
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
            .style("stroke", modSelectedColor.bgColor)
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
    var reverseTranslate = modZoom.translate;
    reverseTranslate[0] /= -modZoom.zoom;
    reverseTranslate[1] /= -modZoom.zoom;
    d3.select("#gridGroup")
      .attr("transform", "translate(" + reverseTranslate + ")");
  };


  Graphmaker.prototype.updateWindow = function(svg) {
    var docEl = document.documentElement,
        bodyEl = document.getElementsByTagName("body")[0];
    var x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
    var y = window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;
    svg.attr("width", x).attr("height", y);
    modGrid.create(d3);
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
      modZoom.zoomSvg.translate([tx, ty]).scale(scale);
      modZoom.zoomSvg.event(thisGraph.svg.transition().duration(500));

      modSystemSupportMap.center = jsonObj.systemSupportMapCenter;
      if (modSystemSupportMap.center) {
        modSystemSupportMap.show(d3);
      } else {
        modSystemSupportMap.hide(d3);
      }
      modCirclesOfCare.hide(d3);
      modCirclesOfCare.center = jsonObj.circlesOfCareCenter;
      if (modCirclesOfCare.center) {
        modCirclesOfCare.show(d3);
      }
      thisGraph.updateGraph();
      if (typeof id === 'number') {
        window.location.hash = '/map/' + id;
      }
    } catch(err) {
      window.alert("Error parsing uploaded file\nerror message: " + err.message);
      return;
    }
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
              modSelectedShape.equalizeSelectedShapeSize(d3, modSelectedShape.shape);
              break;
            case choices[1].name:
              var shapes = ["circle", "rectangle", "diamond", "ellipse", "star", "noBorder"];
              for (var i = 0; i < shapes.length; i++) {
                modSelectedShape.equalizeSelectedShapeSize(d3, shapes[i]);
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
            ? modSelectedColor.color : modSelectedColor.unselected;
        })
        .on("mouseup", function() {
          thisGraph.maxCharsPerLine = parseInt(d3.select(this).datum(), 10);
          d3.select("#textLineLengthSubmenuDiv").classed("menu", false).classed("menuHidden", true);
          d3.select("#menuDiv")
            .classed("menu", false).classed("menuHidden", true);
          d3.selectAll(".textLineLengthSubmenuListItem")
            .style("color", modSelectedColor.unselected)
            .style("text-shadow", "none");
          d3.select(this)
            .style("color", modSelectedColor.color)
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
      .attr("display", modCirclesOfCare.visible ? "inline-block" : "none");
    d3.selectAll(".cOfC")
      .style("fill", "none")
      .style("stroke-width", "1px")
      .style("stroke", "#000000");
    d3.selectAll(".ssmCircle")
      .style("fill", "none")
      .style("display", (modSystemSupportMap.visible ? "inline-block" : "none"));
    d3.selectAll(".ssmHidden").attr("display", "none");
    d3.select("#gridGroup").attr("display", "none");
    d3.select("#mainSVG").style("background-color", modSelectedColor.bgColor);
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
    selectedObject.color = modSelectedColor.clr;
    var selectedElement = d3.select("#" + selectedObject.domId);
    selectedElement.select(".shape").style("stroke", modSelectedColor.clr);
    selectedElement.select("text").style("fill", modSelectedColor.clr);
    this.updateGraph();
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
          modSystemSupportMap.show(d3);
          break;
        case modSystemSupportMap.hideText:
          modSystemSupportMap.hide(d3);
          break;
        case choices[1].name:
          modCirclesOfCare.show(d3);
          break;
        case modCirclesOfCare.hideText:
          modCirclesOfCare.hide(d3);
          break;
        case choices[2].name:
        case choices[3].name:
        case choices[4].name:
          break; // These menu items have submenus with their own event handlers
        case choices[5].name:
          this.setSelectedObjectColor();
          break;
        case choices[6].name:
          modGrid.enableSnap(d3);
          break;
        case modGrid.hideText:
          modGrid.hide(d3);
          break;
        case modSystemSupportMap.hideText:
          modSystemSupportMap.hide(d3);
          break;
        case choices[7].name:
          this.exportGraphAsImage();
          break;
        case choices[8].name:
          modContextMenu.loadFromClient(d3);
          break;
        case choices[9].name:
          modAuth.logoutUser(d3);
          break;
        default:
          alert("\"" + d.name + "\" not implemented.");
      }
    } else {
      if (d3.select(listItem).datum().id === "exportMapAsImageItem") {
        this.exportGraphAsImage();
      } else if (d3.select(listItem).datum().id === "loadContextTextItem") {
        modContextMenu.loadFromClient(d3);
      } else if (d3.select(listItem).datum().id === "logoutUser") {
        modAuth.logoutUser(d3);
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
    modEdgeThickness.createSubmenu(d3);
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
  modDatabase.loadMapFromLocation(d3);
})(window.d3, window.saveAs, window.Blob);
