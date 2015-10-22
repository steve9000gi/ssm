var modGrid = require('./grid.js'),
    modText = require('./text.js');

exports.zoom = 1;
exports.zoomSvg = null;
exports.justScaleTransGraph = false;
exports.translate = [0, 0];

var zoomed = function(d3) {
  exports.justScaleTransGraph = true;
  exports.zoom = d3.event.scale;
  exports.translate = d3.event.translate;
  d3.select(".graph")
    .attr("transform", "translate(" + exports.translate + ") scale(" + exports.zoom + ")");
  modGrid.create(d3);
};

exports.setup = function(d3, svg) {
  exports.zoomSvg = d3.behavior.zoom()
    .on("zoom", function() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.shiftKey) {
        // TODO  the internal d3 state is still changing
        return false;
      } else {
        zoomed();
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
