var modEvents = require('./events.js'),
    modSelectedColor = require('./selected-color.js'),
    modSelection = require('./selection.js'),
    modText = require('./text.js');

var contextText = null;

// Based on http://www.w3schools.com/ajax/tryit.asp?filename=tryajax_first
// Read a file from the server into contextText.
var loadContextTextFromServer = function(fileName) {
  var thisGraph = this;
  var jsonObj = null;
  var xmlhttp;
  if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  }
  else { // code for IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      contextText = JSON.parse(xmlhttp.responseText);
    }
  };

  xmlhttp.open("GET",fileName, true);
  xmlhttp.send();
};

var createContextMenu = function(d3) {
  d3.select("#topGraphDiv").insert("div", ":first-child")
    .classed("menuHidden", true).classed("menu", false)
    .attr("id", "contextMenuDiv")
    .attr("position", "absolute")
    .on("mouseleave", function() {
      d3.select("#contextMenuDiv")
        .classed("menu", false).classed("menuHidden", true);
    });
  loadContextTextFromServer("defaultContextText.json");
};

// Returns false if no object (shape or edge) is selected. Otherwise populates
// the right-click context menu with items appropriate to the object selected,
// and returns true.
var populateContextMenu = function(d3) {
  var thisGraph = this;
  var choices = null;
  var selectedElement = d3.select(".selected");

  if ((!selectedElement) || (!selectedElement.node())) {
    alert("You haven't selected an element. Click on a shape or an edge to select it");
    return false;
  }

  d3.selectAll("li.contextMenuListItem").remove();

  if (selectedElement.node().__data__.source) { // It's an edge
    choices = contextText.verbs;
  } else {
    switch(selectedElement.node().__data__.shape) {
      case "circle":
        choices = contextText.role;
        break;
      case "rectangle":
        choices = contextText.responsibilities;
        break;
      case "diamond":
        choices = contextText.needs;
        break;
      case "ellipse":
        choices = contextText.resources;
        break;
      case "star":
      case "noBorder":
        choices = contextText.wishes;
        break;
      default:
        alert("populateContextMenu(): unknown shape selected.");
        break;
    }
  }

  d3.select("#contextMenuDiv").append("ul").attr("id", "contextMenuList");
  d3.select("#contextMenuList").selectAll("li.contextMenuListItem")
    .data(choices).enter()
    .append("li")
      .classed("contextMenuListItem", true)
      .attr("id", function(d, i) { return "contextMenuListItem" + i; })
      .text(function(d) { return d; })
      .on("mouseover", function() {
      })
      .on("mouseout", function() {
      })
      .on("mouseup", function(d) {
        d3.select("#contextMenuDiv").classed("menu", false).classed("menuHidden", true);
        if (selectedElement.node()) {
          selectedElement.selectAll("text").remove();
          var data = selectedElement.node().__data__;
          data.name = d;
         // Force shape resize in case bold characters overflow shape boundaries:
          data.r = data.width = data.height = data.dim = data.rx = data.ry = data.innerRadius
                 = undefined;
          modText.formatText(d3, selectedElement, data);
          if (data.source) { // It's an edge
            selectedElement.select(".foregroundText")
                           .style("fill", modSelectedColor.color);
          }
          thisGraph.updateGraph();
        } else {
          alert("contextMenuListItem.on(\"mouseup\"): no element selected.");
          return false;
        }
      });
  return true;
};

var showContextMenu = function(d3, e) {
  d3.select("#contextMenuDiv")
    .classed("menuHidden", false).classed("menu", true)
    .style("left", e.clientX + "px")
    .style("top", e.clientY + "px");
};

// User uploads new file from client into contextText.
exports.loadFromClient = function(d3) {
  var thisGraph = this;
  document.getElementById("hidden-textFile-upload").click();
  d3.select("#hidden-textFile-upload").on("change", function() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      var uploadFile = this.files[0];
      var filereader = new window.FileReader();
      var txtRes;

      filereader.onload = function() {
        try {
          txtRes = filereader.result;
        } catch(err) {
          window.alert("Error reading file: " + err.message);
        }
        // TODO better error handling
        try {
          contextText = JSON.parse(txtRes);
        } catch(err) {
          window.alert("Error parsing uploaded file\nerror message: " + err.message);
          return;
        }
      };
      filereader.readAsText(uploadFile);
    } else {
      alert("Your browser won't let you read this file -- try upgrading your browser to IE 10+ "
          + "or Chrome or Firefox.");
    }
  });
};

// http://stackoverflow.com/questions/4909167/how-to-add-a-custom-right-click-menu-to-a-webpage
exports.setup = function(d3) {
  var thisGraph = this;
  createContextMenu(d3);
  if (document.addEventListener) {
    document.addEventListener("contextmenu", function(e) {
      if (e.which === modEvents.rightMouseBtn) {
        var elt = e.target || e.srcElement; // target for Firefox, srcElement for Chrome
        if (elt && (elt.tagName !== "svg")) { // Did we right-click on an object?
          while (elt && (elt.tagName !== "g")) { // elt is probably a child of the shapeG we want
            elt = elt.parentElement; // Assume there's a group in the hierarchy
          }
          if (elt) {
            var eltData = elt.__data__;
            var shapeGs = d3.selectAll(".shapeG");
            shapeGs.each(function(d) {
              if ((d.id === eltData.id) // Select the right-clicked-on shape group...
                && (!modSelection.selectedNode // ...if no shapeG is selected, or...
                || (modSelection.selectedNode.id !== d.id))) { // ...if d not already selected
                thisGraph.selectNode(d3.select(this), eltData); // Expects shapeG as the first arg
              }
            });
        }
      }
      if (elt && elt.__data__ && !elt.__data__.manualResize && populateContextMenu(d3)) {
        showContextMenu(d3, e);
      }
      e.preventDefault();
    }
  }, false);
  } else {
    document.attachEvent("oncontextmenu", function() {
      alert("modContextMenu.setup(): oncontextmenu");
      window.event.returnValue = false;
    });
  }
};
