var adb = require('adbkit');
var client = adb.createClient();
var fs = require('fs');
var exec = require('child_process').exec;

var swipe = function(start, stop){
  var cmd = 'adb shell input swipe '
    + start.x + " " + start.y + " "
    + stop.x  + " " + stop.y;
  exec(cmd, function(error, stdout, stderr) {
    if (error){ return console.log(error); }
    stdout && console.log(stdout);
    stderr && console.log(stderr);
    setTimeout(function(){
      takeScreen();
    }, 200);
  });
}

var takeScreen = function(name){
  var filename = name || 'screen-' + Math.round(+new Date()/1000);
  var cmd = "adb shell screencap -p | perl -pe 's/\\x0D\\x0A/\\x0A/g' > ./screenshots/"
    + filename + ".png";
  exec(cmd, function(error, stdout, stderr) {
    if (error){ return console.log(error); }
    stdout && console.log(stdout);
    stderr && console.log(stderr);
  });
}

var listDevicesCB = function(err, devices){
    if (err){ return console.log(err); }
    if (!devices || devices.length === 0){
        return console.log('no devices found');
    }
    clientId = devices[0].id;

    takeScreen('screen-1484099397');
    // var count = 10000;
    // var interval = setInterval(function(){
    //   if(count-- < 0){ return clearInterval(interval); }
    //   swipe({x: 0, y: 1150}, {x: 0, y: 0});
    // }, 2000);
};

client.listDevices(listDevicesCB);
