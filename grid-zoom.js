// This file is necessary to break a circular dependency between the grid and
// zoom modules. JST 2015-10-21
exports.translate = [0, 0];
exports.zoom = 1;

exports.fitGridToZoom = function(d3) {
  var reverseTranslate = exports.translate;
  reverseTranslate[0] /= -exports.zoom;
  reverseTranslate[1] /= -exports.zoom;
  d3.select("#gridGroup")
    .attr("transform", "translate(" + reverseTranslate + ")");
};
