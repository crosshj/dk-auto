'use strict';


function setup(electron){
    const app = electron.app;  // Module to control application life.
    const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
    // Keep a global reference of the window object, if you don't, the window will
    // be closed automatically when the JavaScript object is garbage collected.
    var mainWindow;
    //var ipc = electron.ipcMain;    
    
    // Quit when all windows are closed.
    app.on('window-all-closed', function() {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform != 'darwin') {
        app.quit();
        }
    });

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    app.on('ready', function() {
        // Create the browser window.
        mainWindow = new BrowserWindow({
            width: 1265, 
            height: 760,
            frame: false,
            icon:'appIcon.png',
            //transparent: true, 
            //type: "notification",
            //type: "splash",
            });

        mainWindow.setMenu(null);
        mainWindow.maximize();

        // and load the index.html of the app.
        mainWindow.loadURL('file://' + __dirname + '/index.html');

        // Open the DevTools.
        mainWindow.webContents.openDevTools();

        // Emitted when the window is closed.
        mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        });
    });

    // ipc.on('device-screencap', function () {
    //     var files = dialog.showOpenDialog({ properties: [ 'openFile', 'multiSelections' ]})
    //     if (files) win.send('add-to-playlist', files)
    // });

    return mainWindow;
}

module.exports = {
    setup: setup
}