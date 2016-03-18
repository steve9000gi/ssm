exports.svg = null;
exports.svgG = null;
exports.nodes = [];
exports.links = [];
exports.shapeGroups = null;
exports.edgeGroups = null;
exports.width = null;
exports.height = null;

exports.setup = function(d3) {
  var wizardEl = document.getElementById('wizard');
  exports.width = window.innerWidth;
  exports.height = window.innerHeight - wizardEl.clientHeight;
  // MAIN SVG:
  d3.select("#topGraphDiv").append("div")
    .attr("id", "mainSVGDiv");
  exports.svg = d3.select("#mainSVGDiv").append("svg")
    .attr("id", "mainSVG")
    .style("font-family", "arial")
    .attr("width", exports.width)
    .attr("height", exports.height);
  // The group that contains the main SVG element:
  exports.svgG = exports.svg.append("g")
    .classed("graph", true)
    .attr("id", "graphG");
};
