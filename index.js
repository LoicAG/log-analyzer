module.exports = {
  analyze: analyze
};

var config = require('./config.json');

var metrics = {
  sections: {},
  totalHits: 0
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
  });

  setTimeout(writeMetrics, config.interval * 1000);
}

function writeMetrics() {
  //TODO prettier metrics output
  console.log(metrics);
  setTimeout(writeMetrics, config.interval * 1000);
}
