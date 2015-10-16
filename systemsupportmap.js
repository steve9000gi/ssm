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
      modEvents = require('./events.js'),
      modFile = require('./file.js'),
      modCirclesOfCare = require('./circles-of-care.js'),
      modEdgeStyle = require('./edge-style.js'),
      modEdgeThickness = require('./edge-thickness.js'),
      modDrag = require('./drag.js'),
      modGrid = require('./grid.js'),
      modZoom = require('./zoom.js'),
      modText = require('./text.js'),
      modFrontMatter = require('./front-matter.js'),
      modSelectedColor = require('./selected-color.js'),
      modSelectedShape = require('./selected-shape.js'),
      modSelection = require('./selection.js'),
      modSystemSupportMap = require('./system-support-map.js'),
      modExport = require('./export.js');

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
    modDrag.setupDrag(d3);
    modDrag.setupDragHandle(d3);
    modZoom.setup(d3, svg);
    this.setupSVGNodesAndLinks();
    modEvents.setupEventListeners(d3);
    modSystemSupportMap.show(d3);
    modFile.setupDownload(d3, saveAs, Blob);
    modFile.setupUpload(d3);
    modDatabase.setupReadMapFromDatabase(d3);
    modDatabase.setupWriteMapToDatabase(d3);
    modContextMenu.setup(d3);
  };


  Graphmaker.prototype.consts =  {
    backendBase: 'http://syssci.renci.org:8080',
    connectClass: "connect-node",
    activeEditId: "active-editing",
    ENTER_KEY: 13
  };


  /* PROTOTYPE FUNCTIONS */


  Graphmaker.prototype.initializeMemberVariables = function() {
    this.displayAll = true; // If false turns off some features
    this.svg = svg;
    this.shapeId = 0;
    this.edgeNum = 0;
    this.nodes = nodes || [];
    this.links = links || [];
    this.state = {
      selectedText: null
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
          modDrag.clickDragHandle = false;
          d.name = "";
        } else {
          // Force shape shrinkwrap:
          d.r = d.width = d.height = d.dim = d.rx = d.ry = d.innerRadius = undefined;
          d.maxCharsPerLine = undefined; // User may want different value if editing text
        }
        modText.formatText(d3, d3element, d);
        d3.select(this.parentElement).remove();
        thisGraph.updateGraph();
      });
    return d3txt;
  };


  Graphmaker.prototype.createNewEdge = function(d) {
    var thisGraph = this;
    var newEdge = {source: modEvents.mouseDownNode,
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
      modText.selectText(txtNode);
      txtNode.focus();
      */
    }
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
    thisGraph.edgeGroups.classed(modSelection.selectedClass, function(d) {
           return d === modSelection.selectedEdge;
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
        if (modDrag.shiftNodeDrag) {
          d3.select(this).classed(thisGraph.consts.connectClass, true);
        }
      })
      .on("mouseenter", thisGraph.tip.show)
      .on("mouseleave", thisGraph.tip.hide)
      .on("mouseout", function() {
        d3.select(this).classed(thisGraph.consts.connectClass, false);
      })
      .on("mousedown", function(d) {
        modEvents.shapeMouseDown(d3, d);
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
              .style("font-weight", modText.boldFontWeight)
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
          modEvents.lastKeyDown = -1;
        } else {
          modEvents.shapeMouseUp(d3, d3.select(this), d);
        }
      })
      .call(modDrag.drag);
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
          modDrag.clickDragHandle = true;
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
      modText.formatText(d3, d3.select(this), d);
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
        modEvents.pathMouseDown(d3, d3.select(this), d);
      })
      .on("mouseup", function(d) {
        if (d3.event.shiftKey) {
          thisGraph.setEdgeColor(this);
          d3.select(this).selectAll("path")
            .style("stroke-width", function(d) { return d.thickness; });
          var d3txt = thisGraph.changeElementText(d3.select(this), d);
          var txtNode = d3txt.node();
          modText.selectText(txtNode);
          txtNode.focus();
        }
        modEvents.mouseDownLink = null;
      })
      .on("mouseover", function() { // Hover color iff not (selected, new edge or inside shape):
        if ((d3.select(this).selectAll("path").style("stroke") !== modSelectedColor.color)
            && (!modDrag.shiftNodeDrag) && (!modDrag.justDragged)) {
          d3.select(this).selectAll("path").style("stroke", modSelectedColor.hoverColor)
            .style("marker-end", "url(#hover-end-arrow)");
          d3.select(this).selectAll("text").style("fill", modSelectedColor.hoverColor);
        }
      })
      .on("mouseout", function(d) { // If selected go back to selectedColor.
      // Note: "mouseleave", was not getting called in Chrome when the shiftKey is down.
        if (modSelection.selectedEdge && (modSelection.selectedEdge.source === d.source)
          && (modSelection.selectedEdge.target === d.target)) {
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
    newPathGroups.each(function(d) {
      modText.formatText(d3, d3.select(this), d);
    });
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
    var maxCharsPerLine = modText.maxCharsPerLine;
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
          modText.maxCharsPerLine = parseInt(d3.select(this).datum(), 10);
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


  // Set the currently selected shape to the currently selected color. Generate an error message if
  // no shape is selected.
  Graphmaker.prototype.setSelectedObjectColor = function() {
    var selectedObject = modSelection.selectedNode || modSelection.selectedEdge;
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
          modExport.exportGraphAsImage(d3);
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
        modExport.exportGraphAsImage(d3);
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
