module.exports = {
  analyze: analyze
};

var config = require('./config.json');

if (config.alert.interval % config.display.interval != 0) {
  throw new Error('Alert interval must be a multiple of the display interval');
}

var windowSize = config.alert.interval / config.display.interval;
var alertWindow = new Array(windowSize);
for (var i = 0; i < windowSize; i++) {
  alertWindow[i] = 0;
}

var metrics = {
  sections: {},
  totalHits: 0,
  alerting: false,
  alertWindow: alertWindow,
  hitsOverWindow: 0
};


function analyze() {
  var fs = require('fs');
  var Tail = require('tail').Tail;

  var tail = new Tail(config.logFile);
  tail.on('line', function(logEntry) {
    //console.log('New entry written to log: ' + logEntry);
    var urlPath = logEntry.split(' ')[6];
    var section = urlPath.split('/')[1];
    //console.log('Parsed section: ' + section);
    if (metrics.sections[section]) {
      metrics.sections[section]++;
    }
    else {
      metrics.sections[section] = 1;
    }
    metrics.totalHits++;
    metrics.alertWindow[0]++;
  });

  setTimeout(processMetrics, config.display.interval * 1000);
}

function processMetrics() {
  updateAlertWindow();
  writeMetrics();
  setTimeout(processMetrics, config.display.interval * 1000);
}

function writeMetrics() {
  //TODO prettier metrics output
  console.log(metrics);
}

function updateAlertWindow() {
  var hitsOverWindow = metrics.alertWindow.reduce(function(a, b) { return a + b;}, 0);

  metrics.hitsOverWindow = hitsOverWindow;

  if (hitsOverWindow >= config.alert.threshold && ! metrics.alerting) {
    console.log(
        'ALERT More than ' + config.alert.threshold +
        ' hits ' + '(' + hitsOverWindow + ')' +
        ' over the last ' + config.alert.interval + ' seconds'
    );
    metrics.alerting = true;
  }
  else if (hitsOverWindow <= config.alert.threshold && metrics.alerting) {
    console.log(
        'OK    Less than ' + config.alert.threshold +
        ' hits ' + '(' + hitsOverWindow + ')' +
        ' over the last ' + config.alert.interval + ' seconds'
    );
    metrics.alerting = false;
  }

  // shift alertWindow to the right
  metrics.alertWindow.unshift(0);
  metrics.alertWindow.splice(-1);
}
