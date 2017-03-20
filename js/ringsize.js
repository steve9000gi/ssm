exports.showLargeText = 'Show large rings';
exports.ringsize = "large";

exports.showSmall = function(d3) {
  exports.ringsize = "small";
  var twoThirds = [{"radius": 73, "offset": 20},
                   {"radius": 183, "offset": 32},
                   {"radius": 317, "offset": 30},
                   {"radius": 450, "offset": 18},
                   {"radius": 500, "offset": 40}];
  var fiveEighths = [{"radius": 69, "offset": 20},
                     {"radius": 172, "offset": 32},
                     {"radius": 297, "offset": 30},
                     {"radius": 422, "offset": 14},
                     {"radius": 477, "offset": 50}];
  var data = fiveEighths;
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
  exports.ringsize = "large";
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
