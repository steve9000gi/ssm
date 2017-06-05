var modAuth = require('./auth.js'),
    modCirclesOfCare = require('./circles-of-care.js'),
    modRingsize = require('./ringsize.js'),
    modContextMenu = require('./context-menu.js'),
    modEdgeThickness = require('./edge-thickness.js'),
    modExport = require('./export.js'),
    modGrid = require('./grid.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelectedShape = require('./selected-shape.js'),
    modSelection = require('./selection.js'),
    modSystemSupportMap = require('./system-support-map.js'),
    modText = require('./text.js'),
    modUpdate = require('./update.js');

exports.displayAll = true; // If false turns off some features

var createEqShapeSizeSubmenu = function(d3) {
  d3.select("#eqShapeSizeItem").append("div")
    .classed("menuHidden", true).classed("menu", false)
    .attr("id", "eqShapeSizeSubmenuDiv")
    .attr("position", "absolute")
    .style("width", "200px")
    .on("mouseleave", function() {
      d3.select("#eqShapeSizeSubmenuDiv")
        .classed("menu", false)
        .classed("menuHidden", true);
    })
    .on("mouseup", function() {
      d3.select("#eqShapeSizeSubmenuDiv")
        .classed("menu", false)
        .classed("menuHidden", true);
    });
  var choices = [{"name": "Equalize selected shape size"},
                 {"name": "Equalize sizes for all shapes"}];

  d3.select("#eqShapeSizeSubmenuDiv")
    .append("ul")
    .attr("id", "eqShapeSizeSubmenuList");
  d3.select("#eqShapeSizeSubmenuList")
    .selectAll("li.eqShapeSizeSubmenuListItem")
    .data(choices).enter()
    .append("li")
      .classed("eqShapeSizeSubmenuListItem", true)
      .attr("id", function(d, i) { return "eqShapeSizeOption" + i; })
      .text(function(d) { return d.name; })
      .on("mouseup", function() {
        d3.select("#eqShapeSizeSubmenuDiv")
          .classed("menu", false)
          .classed("menuHidden", true);
        d3.select("#optionsMenuDiv")
          .classed("menu", false)
          .classed("menuHidden", true);

        switch (d3.select(this).datum().name) {
          case choices[0].name:
            modSelectedShape.equalizeSelectedShapeSize(d3,
                                                       modSelectedShape.shape);
            break;
          case choices[1].name:
            var shapes = ["circle", "rectangle", "diamond", "ellipse", "star",
                          "noBorder"];
            for (var i = 0; i < shapes.length; i++) {
              modSelectedShape.equalizeSelectedShapeSize(d3, shapes[i]);
            }
            break;
          default:
            alert("\"" + d.name + "\" item is not implemented.");
            break;
        }
      });
};

var createTextLineLengthSubmenu = function(d3) {
  var maxCharsPerLine = modText.maxCharsPerLine;
  d3.select("#setTextLineLenItem").append("div")
    .classed("menuHidden", true).classed("menu", false)
    .attr("id", "textLineLengthSubmenuDiv")
    .attr("position", "absolute")
    .style("width", "120px")
    .on("mouseleave", function() {
      d3.select("#textLineLengthSubmenuDiv")
        .classed("menu", false)
        .classed("menuHidden", true);
    })
    .on("mouseup", function() {
      d3.select("#textLineLengthSubmenuDiv")
        .classed("menu", false)
        .classed("menuHidden", true);
    });
  var choices = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
  d3.select("#textLineLengthSubmenuDiv")
    .append("ul")
    .attr("id", "textLineLengthSubmenuList");
  d3.select("#textLineLengthSubmenuList")
    .selectAll("li.textLineLengthSubmenuListItem")
    .data(choices).enter()
    .append("li")
      .classed("textLineLengthSubmenuListItem", true)
      .attr("id", function(d, i) { return "edgeThicknessOption" + i; })
      .text(function(d) { return d + " characters"; })
      .style("text-shadow", function() {
        return (parseInt(d3.select(this).datum(), 10) === maxCharsPerLine)
          ? "1px 1px #000000" : "none"; })
      .style("color", function() {
        return (parseInt(d3.select(this).datum(), 10) === maxCharsPerLine)
          ? modSelectedColor.color : modSelectedColor.unselected;
      })
      .on("mouseup", function() {
        modText.maxCharsPerLine = parseInt(d3.select(this).datum(), 10);
        d3.select("#textLineLengthSubmenuDiv")
          .classed("menu", false)
          .classed("menuHidden", true);
        d3.select("#menuDiv")
          .classed("menu", false).classed("menuHidden", true);
        d3.selectAll(".textLineLengthSubmenuListItem")
          .style("color", modSelectedColor.unselected)
          .style("text-shadow", "none");
        d3.select(this)
          .style("color", modSelectedColor.color)
          .style("text-shadow", "1px 1px #000000");
      });
};

// Set the currently selected shape to the currently selected color. Generate
// an error message if no shape is selected.
var setSelectedObjectColor = function(d3) {
  var selectedObject = modSelection.selectedNode || modSelection.selectedEdge;
  if (!selectedObject) {
    alert("setSelectedObjectColor: no object selected.");
    return;
  }
  selectedObject.color = modSelectedColor.clr;
  var selectedElement = d3.select("#" + selectedObject.domId);
  selectedElement.select(".shape").style("stroke", modSelectedColor.clr);
  selectedElement.select("text").style("fill", modSelectedColor.clr);
  modUpdate.updateGraph(d3);
};

exports.createOptionsMenu = function(d3) {
  var choices = null;
  if (exports.displayAll) {
    choices = [{"name": "Show system support rings", "id": "sysSptRingsItem"},
               {"name": "Show small system support rings",
                "id": "ringsizeItem"},
               {"name": "Show Circles of Care", "id": "cOfCItem"},
               {"name": "Equalize shape size...", "id": "eqShapeSizeItem"},
               {"name": "Set text line length...", "id": "setTextLineLenItem"},
               {"name": "Set line thickness...", "id": "setLineThicknessItem"},
               {"name": "Set selected object color",
                "id": "setSelectedObjectColorItem"},
               {"name": "Snap to grid", "id": "snapToGridItem"},
               {"name": "Export map as image", "id": "exportMapAsImageItem"},
               {"name": "Load text for context menu",
                "id": "loadContextTextItem"},
               {"name": "Log out", "id": "logoutUser"}];
  } else {
    choices = [{"name": "Equalize shape size...", "id": "eqShapeSizeItem"},
               {"name": "Set text line length...", "id": "setTextLineLenItem"},
               {"name": "Set line thickness...", "id": "setLineThicknessItem"},
               {"name": "Export map as image", "id": "exportMapAsImageItem"},
               {"name": "Load context text", "id": "loadContextTextItem"},
               {"name": "Log out", "id": "logoutUser"}];
  }
  d3.select("#topGraphDiv").insert("div", ":first-child")
    .classed("menuHidden", true).classed("menu", false)
    .attr("id", "optionsMenuDiv")
    .attr("position", "absolute")
    .on("mouseleave", function() {
      d3.select("#optionsMenuDiv")
          .classed("menu", false).classed("menuHidden", true);
    });
  d3.select("#optionsMenuDiv").append("ul").attr("id", "optionsMenuList");
  d3.select("#optionsMenuList").selectAll("li.optionsMenuListItem")
    .data(choices).enter()
    .append("li")
      .classed("optionsMenuListItem", true)
      .attr("id", function(d, i) { return d.id; })
      .text(function(d) { return d.name; })
      .on("mouseover", function(d) {
        if (d.id === "eqShapeSizeItem") {
          d3.select("#eqShapeSizeSubmenuDiv")
            .classed("menu", true).classed("menuHidden", false);
        } else if (d.id === "setTextLineLenItem") {
          d3.select("#textLineLengthSubmenuDiv")
            .classed("menu", true).classed("menuHidden", false);
        } else if (d.id === "setLineThicknessItem") {
          d3.select("#edgeThicknessSubmenuDiv")
            .classed("menu", true).classed("menuHidden", false);
        }
      })
      .on("mouseout", function(d) {
        if (d.id === "eqShapeSizeItem") {
          d3.select("#eqShapeSizeSubmenuDiv")
            .classed("menu", false)
            .classed("menuHidden", true);
        } else if (d.id === "setTextLineLenItem") {
          d3.select("#textLineLengthSubmenuDiv")
            .classed("menu", false).classed("menuHidden", true);
        } else if (d.id === "setLineThicknessItem") {
          d3.select("#edgeThicknessSubmenuDiv")
            .classed("menu", false).classed("menuHidden", true);
        }
      })
      .on("mouseup", function(d) {
         exports.optionsMenuListItemMouseUp(d3, this, d, choices);
      });

  createEqShapeSizeSubmenu(d3);
  createTextLineLengthSubmenu(d3);
  modEdgeThickness.createSubmenu(d3);
};

exports.optionsMenuListItemMouseUp = function(d3, listItem, d, choices) {
  // Hide the menu unless there's a submenu open:
  if ((d.id !== "eqShapeSizeItem") && (d.id !== "setTextLineLenItem")
                                   && (d.id !== "setLineThicknessItem")) {
    d3.select("#optionsMenuDiv")
      .classed("menu", false)
      .classed("menuHidden", true);
  }

  if (exports.displayAll) {
    switch (d3.select(listItem).datum().name) {
    // Beware: d3.select(listItem).text() returns concatenation of all submenu
    // text.
      case choices[0].name:
        modCirclesOfCare.hide(d3);
        modSystemSupportMap.show(d3);
        break;
      case modSystemSupportMap.hideText:
        modSystemSupportMap.hide(d3);
        break;
      case choices[1].name:
        modCirclesOfCare.hide(d3);
        modRingsize.showSmall(d3);
        modSystemSupportMap.show(d3);
        break;
      case modRingsize.showLargeText:
        modCirclesOfCare.hide(d3);
        modRingsize.showLarge(d3);
        modSystemSupportMap.show(d3);
        break;
      case choices[2].name:
        modSystemSupportMap.hide(d3);
        modCirclesOfCare.show(d3);
        break;
      case modCirclesOfCare.hideText:
        modCirclesOfCare.hide(d3);
        break;
      case choices[3].name:
      case choices[4].name:
      case choices[5].name:
        break; // These menu items have submenus with their own event handlers
      case choices[6].name:
        setSelectedObjectColor(d3);
        break;
      case choices[7].name:
        modGrid.enableSnap(d3);
        break;
      case modGrid.hideText:
        modGrid.hide(d3);
        break;
      case modSystemSupportMap.hideText:
        modSystemSupportMap.hide(d3);
        break;
      case choices[8].name:
        modExport.exportGraphAsImage(d3);
        break;
      case choices[9].name:
        modContextMenu.loadFromClient(d3);
        break;
      case choices[10].name:
        modAuth.logoutUser(d3);
        break;
      default:
        alert("\"" + d.name + "\" not implemented.");
    }
  } else {
    if (d3.select(listItem).datum().id === "exportMapAsImageItem") {
      modExport.exportGraphAsImage(d3);
    } else if (d3.select(listItem).datum().id === "loadContextTextItem") {
      modContextMenu.loadFromClient(d3);
    } else if (d3.select(listItem).datum().id === "logoutUser") {
      modAuth.logoutUser(d3);
    }
  }
};

exports.createOptionsButton = function(d3) {
  d3.select("#btnDiv").append("input")
    .attr("type", "button")
    .attr("id", "optionsBtn")
    .attr("value", "Options")
    .on("click", function() {
      var position = d3.mouse(d3.select("#topGraphDiv")[0][0]);
      position[1] -= 120;
      d3.select("#optionsMenuDiv")
        .classed("menuHidden", false).classed("menu", true)
        .style("left", position[0] + "px")
        .style("top", position[1] + "px");
    });
};
