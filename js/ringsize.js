exports.visible = false;
exports.center = null;
exports.showLargeText = 'Show large rings';

// Create three concentric circles.
exports.create = function(d3) {
  d3.select("#graphG").append("g")
    .attr("id", "circlesOfCareGroup")
    .classed("visible", exports.visible);
  d3.select("#circlesOfCareGroup").selectAll(".cOfC")
    .data([75, 200, 350])
    .enter().append("circle")
      .classed("cOfC", true)
      .style("fill", "none")
      .attr("r", function(d) {
        return d;
      });
};

exports.showSmall = function(d3) {
  /*
  if (!exports.center) {
    exports.center = {
      "x": d3.select("#topGraphDiv").node().clientWidth / 2,
      "y": d3.select("#topGraphDiv").node().clientHeight / 2};
  }
  exports.visible = true;
  d3.select("#circlesOfCareGroup").classed("visible", exports.visible);
  d3.selectAll(".cOfC")
    .attr("cx", exports.center.x)
    .attr("cy", exports.center.y);
    */
  d3.select("#ring0").attr("r", 73);
  d3.select("#ring1").attr("r", 183);
  d3.select("#ring2").attr("r", 317);
  d3.select("#ring3").attr("r", 450);
  d3.select("#ringsizeItem").text(exports.showLargeText)
    .datum({"name": exports.showLargeText});
};

exports.showLarge = function(d3) {
  /*
  exports.center = null;
  exports.visible = false;
  d3.select("#circlesOfCareGroup").classed("visible", exports.visible);
  */
  d3.select("#ring0").attr("r", 110);
  d3.select("#ring1").attr("r", 275);
  d3.select("#ring2").attr("r", 475);
  d3.select("#ring3").attr("r", 675);
  d3.select("#ringsizeItem").text("Show small rings")
    .datum({"name": "Show small rings"});
};
