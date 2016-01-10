
var adb = require('adbkit');
var client = adb.createClient();
var fs = require('fs');
var gm = require('gm').subClass({imageMagick: true});


function tapCB(err, output){
    //console.log(output);
    findPixels(clientId, findPixelsCB);
}

function bindEvents() {
    document.querySelector('#screenshot').addEventListener("click", function(e){
        var displayWidth=720; //TODO: get dynamically
        var displayHeight=1280;

        var el = e.target;
        var elwidth = el.clientWidth;
        var elheight = el.clientHeight;

        var xPos = e.x - el.offsetLeft;
        var yPos = e.y - el.offsetTop;

        var translated = {
            x: Math.round(displayHeight / elwidth * xPos),
            y: Math.round(displayWidth / elheight * yPos)
        }

        //console.log(e);
        console.log("X coords: " + translated.x + ", Y coords: " + translated.y);

        var shellCommand = 'input tap ' + translated.x + " " + translated.y;
        console.log('adb shell ' + shellCommand);
        client.shell(clientId, shellCommand, tapCB);
    });

    document.querySelector('#screenshot').addEventListener("click", function(e){
        findPixels(clientId, findPixelsCB);
    });

    document.addEventListener("keydown", function (e) {
        if (e.which === 123) {
          require('remote').getCurrentWindow().toggleDevTools();
        } else if (e.which === 116) {
          location.reload();
        }
    });
};

// like jQuery $().ready
document.addEventListener("DOMContentLoaded", function(event) { 
    bindEvents();
});


var pngWriteCB = function(err, callback){
    if (err){ return console.log(err); }
    gm('./screencap.png')
    .rotate('black', '<-90')
    .write('./screencap.png', function(err){
        if (err){ return callback('gm.rotate: ' + err); }
        var xLoc = 0;
        var yLoc = 0;
        console.log('//TODO: find pixels and return location');
        callback(null, { 
                    x: xLoc, 
                    y: yLoc  
        });
    });
};

var findPixels = function(clientId, callback){
    if (!clientId){ return callback('findPixels: No client id specified!'); }
    
    var screencapCB = function(err, screencap){
        if (err){ return callback(err); }

        //console.log(screencap);
        var writeStream = fs.createWriteStream('./screencap.png');
        
        writeStream.on('finish', function(err) {
            pngWriteCB(err, callback);
        });

        screencap.pipe(writeStream);
    };
    
    client.screencap(clientId, screencapCB);
};

var findPixelsCB = function(err, location){
    if (err){ return console.log(err); }
    var rand = Math.random().toString().split('.')[1];
    var el = document.querySelector('#screenshot');
    el.style.backgroundImage = "url('screencap.png?"+rand+"')";
    //console.log(location);
};

var listDevicesCB = function(err, devices){
    if (err){ return console.log(err); }
    if (!devices || devices.length === 0){ 
        return console.log('no devices found');
    }

    //TODO: be fancy, let user choose device
    clientId = devices[0].id;

    findPixels(clientId, findPixelsCB);
};




client.listDevices(listDevicesCB);