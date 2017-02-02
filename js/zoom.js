var modText = require('./text.js');

exports.translate = [0, 0];
exports.zoom = 1;
exports.zoomSvg = null;
exports.justScaleTransGraph = false;

exports.setZoom = function(d3, translate, zoom) {
  exports.justScaleTransGraph = true;
  exports.translate = translate;
  exports.zoom = zoom;
  d3.select(".graph")
    .attr("transform", "translate(" + translate[0] + "," + translate[1] + ") scale(" + zoom + ")");
};

exports.setup = function(d3, svg) {
  exports.zoomSvg = d3.zoom();
  exports.zoomSvg
    .translateBy(svg, exports.translate[0], exports.translate[1])
  exports.zoomSvg
    .scaleBy(svg, function(d, i) {
      return 1;
    })
  exports.zoomSvg
    .on("zoom", function() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.shiftKey) {
        // TODO  the internal d3 state is still changing
        return false;
      } else {
        //exports.setZoom(d3, d3.event.translate, d3.event.scale);
        exports.setZoom(d3, [d3.event.transform.x, d3.event.transform.y], d3.event.transform.k);
      }
      return true;
    })
    .on("start", function() {
      var ael = d3.select("#" + modText.activeEditId).node();
      if (ael) {
        ael.blur();
      }
      if (!d3.event.sourceEvent || !d3.event.sourceEvent.shiftKey) {
        d3.select("body").style("cursor", "move");
      }
    })
    .on("end", function() {
      d3.select("body").style("cursor", "auto");
    });
  svg.call(exports.zoomSvg).on("dblclick.zoom", null);
};
