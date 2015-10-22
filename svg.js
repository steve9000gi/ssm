exports.svg = null;
exports.svgG = null;
exports.nodes = [];
exports.links = [];
exports.shapeGroups = null;
exports.edgeGroups = null;

exports.setup = function(d3) {
  var docEl = document.documentElement,
      bodyEl = document.getElementsByTagName("body")[0],
      width = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
      height =  window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;
  exports.svg = d3.select("#mainSVGDiv").append("svg")
    .attr("id", "mainSVG")
    .style("font-family", "arial")
    .attr("width", width)
    .attr("height", height);
  // The group that contains the main SVG element:
  exports.svgG = exports.svg.append("g")
    .classed("graph", true)
    .attr("id", "graphG");
  // MAIN SVG:
  d3.select("#topGraphDiv").append("div")
    .attr("id", "mainSVGDiv");
  exports.edgeGroups = exports.svgG.append("g").attr("id", "pathGG").selectAll("g");
  exports.shapeGroups = exports.svgG.append("g").attr("id", "shapeGG").selectAll("g");
}
