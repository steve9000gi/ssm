exports.showLargeText = 'Show large system support rings';
exports.ringsize = "large";

// Text offsets for ring labels differ depending on ring sizes. This seemingly
// tortuous approach permits that these offsets are set in one place -- here --
// and have these same values anywhere in the source code.
var offsetFull = [20, 28, 26, 18, 10];
var offset2_3rds = [20, 32, 30, 18, 40];
var offset5_8ths = [20, 32, 30, 14, 50]
exports.offset = offsetFull;


exports.showSmall = function(d3) {
  exports.ringsize = "small";
  exports.offset = offset5_8ths;
  var twoThirds = [{"radius": 73, "offset": offset2_3rds[0]},
                   {"radius": 183, "offset": offset2_3rds[1]},
                   {"radius": 317, "offset": offset2_3rds[2]},
                   {"radius": 450, "offset": offset2_3rds[3]},
                   {"radius": 500, "offset": offset2_3rds[4]}];
  var fiveEighths = [{"radius": 69, "offset": offset5_8ths[0]},
                     {"radius": 172, "offset": offset5_8ths[1]},
                     {"radius": 297, "offset": offset5_8ths[2]},
                     {"radius": 422, "offset": offset5_8ths[3]},
                     {"radius": 477, "offset": offset5_8ths[4]}];
  var data = fiveEighths; // Change exports.offset if you change this.
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
  var data = [{"radius": 110, "offset": offsetFull[0]},
              {"radius": 275, "offset": offsetFull[1]},
              {"radius": 475, "offset": offsetFull[2]},
              {"radius": 675, "offset": offsetFull[3]},
              {"radius": 700, "offset": offsetFull[4]}];
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
  d3.select("#ringsizeItem").text("Show small system support rings")
    .datum({"name": "Show small system support rings"});
};
