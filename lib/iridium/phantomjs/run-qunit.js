var args = phantom.args;

if (args.length < 1 || args.length > 2) {
  console.log("Usage: " + phantom.scriptName + " <URL> <timeout>");
  phantom.exit(1);
}

var page = require('webpage').create();

page.onConsoleMessage = function(msg) {
  if (msg.slice(0,8) === 'WARNING:') { return; }
  console.log(msg);
};

page.open(args[0], function(status) {
  if (status !== 'success') {
    console.error("Unable to access network");
    phantom.exit(1);
  } else {
    page.evaluate(logQUnit);

    var timeout = parseInt(args[1] || 60000, 10);
    var start = Date.now();
    var interval = setInterval(function() {
      if (Date.now() > start + timeout) {
        console.error("Tests timed out");
        phantom.exit(124);
      } else {
        var qunitDone = page.evaluate(function() {
          return window.qunitDone;
        });

        if (qunitDone) {
          clearInterval(interval);
          phantom.exit();

          if (qunitDone.failed > 0) {
            phantom.exit(1);
          } else {
            phantom.exit();
          }
        }
      }
    }, 500);
  }
});

function logQUnit() {
  var testResults = [];
  var currentTest = {};

  QUnit.testStart(function(context) {
    currentTest = {};
    currentTest.name = context.name;
  });

  QUnit.log(function(context) {
    if(context.result) return;

    if(context.message) {
      currentTest.failed = true;
      currentTest.message = context.message
    }

    if(context.expected) {
      currentTest.failed = true;
      currentTest.message = "Expected: " + context.expected + ", Actual: " + context.actual
    }
  });

  QUnit.testDone(function(context) {
    testResults.push(JSON.parse(JSON.stringify(currentTest)));
  });

  QUnit.done(function(context) {
    window.qunitDone = context;
    console.log(JSON.stringify(testResults));
  });
}