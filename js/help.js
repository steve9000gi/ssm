// Help/instructions button and info box:
module.exports = function(d3) {
  d3.select("#toolbox").insert("div", ":first-child")
    .attr("id", "btnDiv")
    .append("input")
    .attr("type", "button")
    .attr("id", "helpBtn")
    .attr("value", "?")
    .on("click", function() {
      alert("\u26a1 Drag/scroll to translate/zoom.\n"
        + "\u26a1 Click on a shape in the toolbar to select node shape (or for a node with "
            + "none use \"no border\").\n"
        + "\u26a1 Click on a color in the toolbar to select a color for creating new nodes "
            + "and edges.\n"
        + "\u26a1 Shift-click on empty space to create a node of the selected shape and "
            + "color.\n"
        + "\u26a1 Click on an arrow in the toolbar to select edge style: dashed or solid.\n"
        + "\u26a1 Shift-click on a node, then drag to another node to connect them with an "
        + "edge.\n"
        + "\u26a1 Shift-click on a node's text to edit.\n"
        + "\u26a1 Shift-click on an edge to edit text.\n"
        + "\u26a1 Click on node or edge to select and press backspace/delete to delete."
            + " Note: a node's background turns blue when you're hovering over it, and pink when "
            + "selected.\n"
        + "\u26a1 Control-click on a node with underlined text to open the external url "
            + "associated with that node.\n"
        + "\u26a1 Alt-click on a node to see, attach new (or change existing) url.\n"
        + "\u26a1 Control-shift-click on a node to attach or modify note.\n"
        + "\u26a1 Hover over a node to see its note if there is one attached.\n"
        + "\u26a1 Click on the cloud with the up-arrow to open/upload a file from your machine.\n"
        + "\u26a1 Click on the square with the down-arrow to save the graph to your computer.\n"
        + "\nQuestions? Email stevec@renci.org."
     );
  });
};
