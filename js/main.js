/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * Copyright (C) 2014-2015 The University of North Carolina at Chapel Hill
 * All rights reserved.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS, CONTRIBUTORS, AND THE
 * UNIVERSITY OF NORTH CAROLINA AT CHAPEL HILL "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED * TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
 * EVENT SHALL THE COPYRIGHT OWNER, CONTRIBUTORS OR THE UNIVERSITY OF NORTH
 * CAROLINA AT CHAPEL HILL BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY * OF SUCH DAMAGE.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Build a graph with nodes of several shapes and colors, and connect them with
// directed edges. Save a constructed graph locally as a json file, and open and
// display saved graph files.
// Based on Colorado Reed's https://github.com/cjrd/directed-graph-creator.

document.onload = (function(d3) {
  "use strict";

  var modAuth = require('./auth.js'),
      modDatabase = require('./database.js'),
      modEvents = require('./events.js'),
      modGraph = require('./graph.js'),
      modSvg = require('./svg.js'),
      modUpdate = require('./update.js'),
      modWizard = require('./wizard.js');

  window.onbeforeunload = function() {
    return "Make sure to save your graph locally before leaving.";
  };

  modAuth.afterAuthentication(d3, function() {
    modSvg.setup(d3);
    modGraph.create(d3);
    modEvents.shapeId = 0;
    modUpdate.updateGraph(d3);
    if (!modDatabase.loadMapFromLocation(d3)) {
      // blank slate; open wizard
      modWizard.currentStep = 1;
      modWizard.showWizard(d3);
    }
  });
})(window.d3);
