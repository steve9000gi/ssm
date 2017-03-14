exports.showLargeText = 'Show large rings';

exports.showSmall = function(d3) {
  var data = [{"radius": 73, "offset": 20},
              {"radius": 183, "offset": 32},
              {"radius": 317, "offset": 30},
              {"radius": 450, "offset": 18},
              {"radius": 500, "offset": 40}];
  d3.selectAll(".ssmCircle")
    .data(data)
    .attr("r", function(d) {
      return d.radius;
  });
  var centerY = d3.select(".ssmCircle").attr("cy");
  d3.selectAll(".ssmLabel")
    .data(data)
    .attr("y", function(d) {
      return centerY - d.radius + d.offset;
    });
  d3.select("#ringsizeItem").text(exports.showLargeText)
    .datum({"name": exports.showLargeText});
};

exports.showLarge = function(d3) {
  var data = [{"radius": 110, "offset": 20},
              {"radius": 275, "offset": 28},
              {"radius": 475, "offset": 26},
              {"radius": 675, "offset": 18},
              {"radius": 700, "offset": 10}];
  d3.selectAll(".ssmCircle")
    .data(data)
    .attr("r", function(d) {
      return d.radius;
  });
  var centerY = d3.select(".ssmCircle").attr("cy");
  d3.selectAll(".ssmLabel")
    .data(data)
    .attr("y", function(d) {
      return centerY - d.radius + d.offset;
    });
  d3.select("#ringsizeItem").text("Show small rings")
    .datum({"name": "Show small rings"});
};
