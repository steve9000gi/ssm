exports.addLogos = function(d3) {
  d3.select("#mainSVG").append("svg:image")
    .attr("xlink:href", "mch-tracs.png")
    .attr("id", "logos")
    .attr("width", 546)
    .attr("height", 60)
    .attr("x", -52)
    .attr("y", 0);
};

exports.addCopyright = function(d3) {
  d3.select("#topGraphDiv").append("div")
    .attr("id", "copyrightDiv")
    .append("text")
    .attr("id", "copyright")
    .text("\u00a9 2014-2018 The University of North Carolina at Chapel Hill");
};

exports.addCredits = function(d3) {
  d3.select("#mainSVG").append("text")
    .attr("id", "credits")
    .attr("display", "none")
    .attr("x", 30);
};
