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
  var data = [{"r": 73, "textOffset": 40},
              {"r": 183, "textOffset": 28},
              {"r": 317, "textOffset": 28},
              {"r": 450, "textOffset": 28},
              {"r": 500, "textOffset": 68}];
  d3.select("#ring0").attr("r", 73);
  d3.select("#ring1").attr("r", 183);
  d3.select("#ring2").attr("r", 317);
  d3.select("#ring3").attr("r", 450);
  var centerY = d3.select("#ring0").attr("cy");
  d3.selectAll(".ssmLabel")
    .attr("y", function(d, i) {
      var offset = [20, 32, 30, 18, 40];
      return centerY - data[i].r + offset[i];
    });
  d3.select("#ringsizeItem").text(exports.showLargeText)
    .datum({"name": exports.showLargeText});
};

exports.showLarge = function(d3) {
  d3.select("#ring0").attr("r", 110);
  d3.select("#ring1").attr("r", 275);
  d3.select("#ring2").attr("r", 475);
  d3.select("#ring3").attr("r", 675);
  var data = [{"r": 110, "textOffset": 20},
              {"r": 275, "textOffset": 28},
              {"r": 475, "textOffset": 26},
              {"r": 675, "textOffset": 18},
              {"r": 700, "textOffset": 40}];
  var centerY = d3.select("#ring0").attr("cy");
  d3.selectAll(".ssmLabel")
    .attr("y", function(d, i) {
      var offset = [20, 28, 26, 18, 10];
      return centerY - data[i].r + offset[i];
    });
  d3.select("#ringsizeItem").text("Show small rings")
    .datum({"name": "Show small rings"});
};
