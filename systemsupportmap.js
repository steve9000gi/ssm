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
      modGridZoom = require('./grid-zoom.js'),
      modUtil = require('./util.js'),
      modText = require('./text.js'),
      modFrontMatter = require('./front-matter.js'),
      modOptionsMenu = require('./options-menu.js'),
      modSelectedColor = require('./selected-color.js'),
      modSelectedShape = require('./selected-shape.js'),
      modSelection = require('./selection.js'),
      modSystemSupportMap = require('./system-support-map.js'),
      modToolbox = require('./toolbox.js'),
      modTooltips = require('./tooltips.js'),
      modExport = require('./export.js'),
      modSvg = require('./svg.js'),
      modUpdate = require('./update.js');

  // Define graphcreator object
  var Graphmaker = function() {
    modToolbox.prepareToolbox(d3);
    modFrontMatter.addLogos(d3);
    modFrontMatter.addCopyright(d3);
    modFrontMatter.addCredits(d3);
    modTooltips.setupNotes(d3);
    this.defineArrowMarkers();
    if (modOptionsMenu.displayAll) {
      modCirclesOfCare.create(d3);
    }
    modSystemSupportMap.create(d3);
    this.setupMMRGroup();
    modDrag.setupDrag(d3);
    modDrag.setupDragHandle(d3);
    modZoom.setup(d3, modSvg.svg);
    modEvents.setupEventListeners(d3);
    modSystemSupportMap.show(d3);
    modFile.setupDownload(d3, saveAs, Blob);
    modFile.setupUpload(d3);
    modDatabase.setupReadMapFromDatabase(d3);
    modDatabase.setupWriteMapToDatabase(d3);
    modContextMenu.setup(d3);
  };


  /* PROTOTYPE FUNCTIONS */


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
    this.manResizeGroups = modSvg.svgG.append("g").attr("id", "manResizeGG").selectAll("g");
  };


  /**** MAIN ****/

  window.onbeforeunload = function() {
    return "Make sure to save your graph locally before leaving.";
  };

  modSvg.setup(d3);
  var graph = new Graphmaker();
  modEvents.shapeId = 0;
  modUpdate.updateGraph();
  modDatabase.loadMapFromLocation(d3);
})(window.d3, window.saveAs, window.Blob);
