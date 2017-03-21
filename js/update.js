var modRingsize = require('./ringsize.js'),
    modCirclesOfCare = require('./circles-of-care.js'),
    modDrag = require('./drag.js'),
    modEvents = require('./events.js'),
    modGrid = require('./grid.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelection = require('./selection.js'),
    modSvg = require('./svg.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modText = require('./text.js'),
    modTooltips = require('./tooltips.js'),
    modUtil = require('./util.js');

var addHandle = function(d3, parentG, rectData) {
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
    .call(modDrag.dragHandle);
};

var addNewNodes = function(d3) {
  var newShapeGroups = modSvg.shapeGroups.enter().append("g");

  newShapeGroups.classed("shapeG", true)
    .attr("id", function(d) { return "shapeG" + d.id; })
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    })
    .on("mouseover", function() {
      if (modDrag.shiftNodeDrag) {
        d3.select(this).classed(modEvents.connectClass, true);
      }
    })
    .on("mouseenter", modTooltips.tip.show)
    .on("mouseleave", modTooltips.tip.hide)
    .on("mouseout", function() {
      d3.select(this).classed(modEvents.connectClass, false);
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
          exports.updateGraph(d3);
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

var addNewPaths = function(d3, edgeGroups) {
  var newPathGroups = edgeGroups.enter().append("g");
  newPathGroups.classed("pathG", true)
    .on("mousedown", function(d) {
      modEvents.pathMouseDown(d3, d3.select(this), d);
    })
    .on("mouseup", function(d) {
      if (d3.event.shiftKey) {
        setEdgeColor(d3, this);
        d3.select(this).selectAll("path")
          .style("stroke-width", function(d) { return d.thickness; });
        var d3txt = modText.changeElementText(d3, d3.select(this), d);
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
        setEdgeColor(d3, this);
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
    .attr("d", function(edge) { return setPath(edge); });
  return pathGroups;
};

// Add the newly created shapes to the graph, assigning attributes common to
// all.
var addNewShapes = function(d3, newShapeGroups, shapeElts) {
  newShapeGroups.append(function(d, i) { return shapeElts[i]; })
    .attr("class", function(d) { return "shape " + d.shape; })
    .attr("id", function(d) { return "shape" + d.id; })
    .style("stroke", function(d) { return d.color; })
    .style("stroke-width", function(d) { return (d.shape === "noBorder") ? 0 : 2; });
  newShapeGroups.each(function(d) {
    modText.formatText(d3, d3.select(this), d);
    if (d.shape === "rectangle") {
      addHandle(d3, this, d);
    }
  });
};

// Check to make sure that there aren't already text objects appended (they
// would be pathGroups[0][i].childNodes[1] and [2], where the 0th element is
// expected to be the path) before appending text.
//
// Note that there are two text elements being appended. The first is
// background shadow to ensure that the text is visible where it overlays its
// edge.
var appendPathText = function(d3, pathGroups) {
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

// Returns new end point p2'. Arg "change" is in pixels. Negative "change"
// shortens the line.
var changeLineLength = function(x1, y1, x2, y2, change, edgeThickness) {
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

// Create the new shapes, but don't add them yet.
var createNewShapes = function()  {
  var shapeElts = [];
  var shape;
  for (var i = 0; i < modSvg.nodes.length; i++) {
    switch (modSvg.nodes[i].shape) {
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
      shape = modSvg.nodes[i].shape;
      break;
    }
    var shapeElement = document.createElementNS("http://www.w3.org/2000/svg", shape);
    shapeElts.push(shapeElement);
  }
  return shapeElts;
};

var setEdgeColor = function(d3, edgeGroup) {
  d3.select(edgeGroup).selectAll("path")
    .style("stroke", function(d) { return d.color; })
    .style("marker-end", function(d) {
      return "url(#end-arrow" + d.color.substr(1) + ")";
    });
};

var setPath = function(edge) {
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
      boundary = modUtil.computeRectangleBoundary(edge);
      break;
    case "diamond":
      if (edge.target.dim) {
        boundary += (parseFloat(edge.target.dim) / 2);
      } else {
        boundary = edge.target.boundary;
      }
      break;
    case "ellipse":
      boundary = modUtil.computeEllipseBoundary(edge);
      break;
    case "star":
      boundary = edge.target.boundary;
      break;
    default:
      alert("setPath(...): unknown shape: \"" + edge.target.shape + "\"");
      break;
  }
  var newP2 = changeLineLength(edge.source.x, edge.source.y, edge.target.x, edge.target.y,
                                   -boundary, (edge.thickness || 3));
  return "M" + edge.source.x + "," + edge.source.y + "L" + newP2.x + "," + newP2.y;
};

var updateExistingNodes = function() {
  modSvg.shapeGroups = modSvg.shapeGroups.data(modSvg.nodes, function(d) {
    return d.id;
  });
  modSvg.shapeGroups.attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
};

exports.deleteGraph = function(d3, skipPrompt) {
  var doDelete = true;
  if (!skipPrompt) {
    doDelete = window.confirm("Press OK to delete this graph from the canvas. (It will still be saved on the server.)");
  }
  if(doDelete) {
    // Allow reload of same file after delete in on("change"...) function:
    d3.select("#hidden-file-upload").node().value = "";
    modSvg.nodes = [];
    modSvg.links = [];
    modCirclesOfCare.hide(d3);
    // Set center to null to force show(...) to recalculate:
    modSystemSupportMap.center = null;
    modSystemSupportMap.show(d3);
    if (modRingsize.ringsize == "small") {
      modRingsize.showSmall(d3);
    } else {
      modRingsize.showLarge(d3);
    }
    exports.updateGraph(d3);
    window.location.hash = "";
  }
};

exports.updateExistingPaths = function() {
  modSvg.edgeGroups = modSvg.edgeGroups.data(modSvg.links, function(d) {
    return String(d.source.id) + "+" + String(d.target.id);
  });
  modSvg.edgeGroups.classed(modSelection.selectedClass, function(d) {
    return d === modSelection.selectedEdge;
  })
    .attr("d",  function(d) {
      return setPath(d);
    });
  return modSvg.edgeGroups;
};

// Call to propagate changes to graph
exports.updateGraph = function(d3) {
  updateExistingNodes();
  var newShapeGroups = addNewNodes(d3);
  var shapeElts = createNewShapes();
  addNewShapes(d3, newShapeGroups, shapeElts);
  modSvg.shapeGroups.exit().remove(); // Remove old nodes
  if (modSvg.shapeGroups) {
    modSvg.shapeGroups.each(function(d) {
      if (d.manualResize) {
        var remove = d3.select(this).remove();
        d3.select("#manResizeGG").append(function() {
          return remove.node();
        });
      }
    });
  }
  var edgeGroups = exports.updateExistingPaths();
  var newPathGroups = addNewPaths(d3, edgeGroups);
  appendPathText(d3, newPathGroups);
  edgeGroups.exit().remove(); // Remove old links
};

exports.updateWindow = function(d3) {
  var docEl = document.documentElement,
      bodyEl = document.getElementsByTagName("body")[0];
  var x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
  var y = window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;
  modSvg.svg.attr("width", x).attr("height", y);
  modGrid.create(d3);
  exports.updateGraph(d3);
};
