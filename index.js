
var adb = require('adbkit');
var client = adb.createClient();
var fs = require('fs');
var gm = require('gm').subClass({imageMagick: true});
var raphael = require('raphael');

/*

https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
https://github.com/cjheath/Raphaelle/blob/master/example.html

*/


function tapCB(err, output){
    //console.log(output);
    findPixels(clientId, findPixelsCB);
}

function bindEvents() {
    document.querySelector('#screenshot').addEventListener("contextmenu", function(e){
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
        console.log("X coords: " + xPos + ", Y coords: " + yPos);
        var circle = paper.circle(xPos, yPos, 10);
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

        var shellCommand = 'input tap ' + translated.x + " " + translated.y;
        console.log('\tadb shell ' + shellCommand);
        if(typeof(clientId) !== 'undefined'){
            client.shell(clientId, shellCommand, tapCB);
        }
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

    document.querySelector('#slide').addEventListener("click", function(e){
        newSlide();
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

var newSlide = function(){
    console.log('make a new slide');
    var slide = {
        start: { x: 20, y:20 },
        end:   { x: 80, y:80 },

    };
    
    var bOutline = paper.path("M"
        +slide.start.x+","+
        +slide.start.y+"L"+
        +slide.end.x+","
        +slide.end.y
        );
    bOutline.attr({stroke:'#000',"stroke-width":5});

    var between = paper.path("M"
        +slide.start.x+","+
        +slide.start.y+"L"+
        +slide.end.x+","
        +slide.end.y
        );
    between.attr({stroke:'#fff',"stroke-width":3});
    

    var start = paper.circle(slide.start.x, slide.start.y, 10);
    start.data({ 'data-type': 'startHandle'});
    
    var end = paper.circle(slide.end.x, slide.end.y, 10);
    end.data({ 'data-type': 'endHandle'});

    start.attr("fill", "#0f0");
    end.attr("fill", "#f00");
    var move = function (dx, dy) {
        this.attr({
            cx: x + dx,
            cy: y + dy
        });
        if(this.data('data-type') === 'startHandle'){
            slide.start.x = this.attr('cx');
            slide.start.y = this.attr('cy');
        } else {
            slide.end.x = this.attr('cx');
            slide.end.y = this.attr('cy');
        }
        between.attr({
            path: "M"
                +slide.start.x+","+
                +slide.start.y+"L"+
                +slide.end.x+","
                +slide.end.y
        });
        bOutline.attr({
            path: "M"
                +slide.start.x+","+
                +slide.start.y+"L"+
                +slide.end.x+","
                +slide.end.y
        });
    };
    var stopMove = function () {
        x = this.attr("cx");
        y = this.attr("cy");
    };

    start.drag(move, stopMove);
    end.drag(move, stopMove);
    
}