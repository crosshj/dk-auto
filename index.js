
var adb = require('adbkit');
var client = adb.createClient();
var fs = require('fs');
var gm = require('gm').subClass({imageMagick: true});
var raphael = require('raphael');

/*

https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
https://github.com/cjheath/Raphaelle/blob/master/example.html

*/

// depends on hidden element being present
function addListItem(x1,y1,x2,y2){
    var clone = document.querySelector('.controls').cloneNode(true);
    clone.style.display="";
    var inputs = clone.getElementsByTagName('input')
    inputs[0].value=x1;
    inputs[1].value=y1;
    inputs[2].value=x2;
    inputs[3].value=y2;
    document.getElementById('list').appendChild(clone);
    return inputs;
}

function tapCB(err, output){
    //console.log(output);
    findPixels(clientId, findPixelsCB);
}

function inputTap(clientId, x, y){
    var isXReasonable = x && isFinite(x); //TODO: add is within screen bounds
    var isYReasonable = y && isFinite(y);
    
    if (!clientId || !isXReasonable || !isYReasonable){
        console.log('tap error: ', arguments);
        return;
    }
    var shellCommand = 'input tap ' + x + " " + y;
    console.log('\tadb shell ' + shellCommand);
    client.shell(clientId, shellCommand, tapCB);
}

function inputSwipe(clientId, x1, y1, x2, y2){
    var isX1Reasonable = x1 && isFinite(x1);
    var isY1Reasonable = y1 && isFinite(y1);
    var isX2Reasonable = x2 && isFinite(x2);
    var isY2Reasonable = y2 && isFinite(y2);
    var isCoordsReasonable = isX1Reasonable
        && isY1Reasonable
        && isX2Reasonable
        && isY2Reasonable;

    if (!clientId || !isCoordsReasonable){
        console.log('swipe error: ', arguments);
        return;
    }
    //adb shell input swipe 100 500 1100 500
    var shellCommand = 'input swipe ' 
        + x1 + " " + y1 + " " 
        + x2 + " " + y2;
    console.log('\tadb shell ' + shellCommand);
    client.shell(clientId, shellCommand, tapCB);
}

function getClickCoords(event){
        var displayWidth=720; //TODO: get dynamically
        var displayHeight=1280;

        var el = event.target;
        var elwidth = el.clientWidth;
        var elheight = el.clientHeight;

        var xPos = event.x - el.offsetLeft;
        var yPos = event.y - el.offsetTop;

        //console.log(e);
        console.log("X coords: " + xPos + ", Y coords: " + yPos);

        var translated = {
            x: Math.round(displayHeight / elwidth * xPos),
            y: Math.round(displayWidth / elheight * yPos)
        }
        return { 
            device: translated,
            browser: { x: xPos, y: yPos }
        };
}

function bindEvents() {
    document.querySelector('#screenshot').addEventListener("contextmenu", function(e){

        var coords = getClickCoords(e);

        var circle = paper.circle(coords.browser.x, coords.browser.y, 10);
        circle.attr("fill", "#f00");
        circle.drag(function (dx, dy) {
            this.attr({
                cx: x + dx, //Math.min(Math.max(x + dx, 15), 85),
                cy: y + dy //Math.min(Math.max(y + dy, 15), 85)
            });
        }, function () {
            x = this.attr("cx");
            y = this.attr("cy");
        });
        //circle.click(function(e) { alert("moveable clicked!"); });

        inputTap(clientId, coords.device.x, coords.device.y);
    });

    document.querySelector('#screenshot').addEventListener("click", function(e){
        //findPixels(clientId, findPixelsCB);
    });

    document.querySelector('svg').addEventListener("click", function(e){
        console.log('clicked Raphael')
    });

    document.querySelector('#refresh').addEventListener("click", function(e){
        location.reload();
    });

    document.querySelector('#swipe').addEventListener("click", function(e){
        newSwipe();
    });

    document.querySelector('#clear').addEventListener("click", function(e){
        paper.clear();
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
    window.paper = setupRaphael();
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

var setupRaphael = function(){
    var paper = Raphael("screenshot", "100%", "100%");

    return paper;
}

var newSwipe = function(){


    var swipe = {
        start: { x: 70, y:70 },
        end:   { x: 640, y:340 },
    };

    var listItem = addListItem(
        swipe.start.x,
        swipe.start.y,
        swipe.end.x,
        swipe.end.y
    );

    //TODO: when list item values change, so should GUI position

    var bOutline = paper.path("M"
        +swipe.start.x+","+
        +swipe.start.y+"L"+
        +swipe.end.x+","
        +swipe.end.y
        );
    bOutline.attr({stroke:'#000',"stroke-width":5});

    var between = paper.path("M"
        +swipe.start.x+","+
        +swipe.start.y+"L"+
        +swipe.end.x+","
        +swipe.end.y
        );
    between.attr({stroke:'#fff',"stroke-width":3});

    var start = paper.circle(swipe.start.x, swipe.start.y, 10);
    start.data({ 'data-type': 'startHandle'});
    
    var end = paper.circle(swipe.end.x, swipe.end.y, 10);
    end.data({ 'data-type': 'endHandle'});

    start.attr("fill", "#0f0");
    end.attr("fill", "#f00");
    var move = function (dx, dy) {
        this.attr({
            cx: x + dx,
            cy: y + dy
        });
        if(this.data('data-type') === 'startHandle'){
            swipe.start.x = this.attr('cx');
            swipe.start.y = this.attr('cy');
        } else {
            swipe.end.x = this.attr('cx');
            swipe.end.y = this.attr('cy');
        }
        between.attr({
            path: "M"
                +swipe.start.x+","+
                +swipe.start.y+"L"+
                +swipe.end.x+","
                +swipe.end.y
        });
        bOutline.attr({
            path: "M"
                +swipe.start.x+","+
                +swipe.start.y+"L"+
                +swipe.end.x+","
                +swipe.end.y
        });
        listItem.fromX.value = swipe.start.x;
        listItem.fromY.value = swipe.start.y;
        listItem.toX.value = swipe.end.x;
        listItem.toY.value = swipe.end.y;
    };
    var stopMove = function () {
        x = this.attr("cx");
        y = this.attr("cy");
    };

    start.drag(move, stopMove);
    end.drag(move, stopMove);
}