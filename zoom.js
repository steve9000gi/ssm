var modGrid = require('./grid.js'),
    modGridZoom = require('./grid-zoom.js'),
    modText = require('./text.js');

exports.zoomSvg = null;
exports.justScaleTransGraph = false;

var zoomed = function(d3) {
  exports.justScaleTransGraph = true;
  modGridZoom.zoom = d3.event.scale;
  modGridZoom.translate = d3.event.translate;
  d3.select(".graph")
    .attr("transform", "translate(" + modGridZoom.translate + ") scale(" + modGridZoom.zoom + ")");
  modGrid.create(d3);
};

exports.setup = function(d3, svg) {
  exports.zoomSvg = d3.behavior.zoom()
    .on("zoom", function() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.shiftKey) {
        // TODO  the internal d3 state is still changing
        return false;
      } else {
        zoomed(d3);
      }
      return true;
    })
    .on("zoomstart", function() {
      var ael = d3.select("#" + modText.activeEditId).node();
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
  svg.call(exports.zoomSvg).on("dblclick.zoom", null);
};
