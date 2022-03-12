/* global process */

require('dotenv').config();
const {app, BrowserWindow} = require('electron');
const axios = require('axios');
const cp = require('child_process');
var path = require("path");

require('update-electron-app')({
  repo: 'https://github.com/singlequote/scum-bot',
  updateInterval: '1 hour'
});

/**
 * @returns {StartApp}
 */
new class StartApp
{

    /**
     * @returns {StartApp}
     */
    constructor()
    {
        this.exec;
        this.isProd = process.env.NODE_ENV === 'production';
        this.init();
    }

    /**
     * @returns {void}
     */
    async init()
    {
        await this.startAdonis();

        app.on('ready', await this.createWindow.bind(this));
        app.on('activate', await this.activateWindow.bind(this));
        app.on('certificate-error', await this.certificateError.bind(this));
        app.on('window-all-closed', await this.closeALlWindows.bind(this));
    }

    /**
     * @returns {void}
     */
    async loadWindow()
    {
        const url = `http://127.0.0.1:3333`;

        await axios.get(url).catch(async (err) => {
            await this.timeout(1000);
            this.loadWindow();
        }).then(async (response) => {
            if (response) {
                this.mainWindow.loadURL(url);
            }
        });
    }

    /**
     * @returns {void}
     */
    async loadDefaultLoader()
    {
        await this.mainWindow.loadFile(`./resources/views/start.html`);
        await this.loadWindow();
    }

    /**
     * On OS X it's common to re-create a window in the app when the
     * dock icon is clicked and there are no other windows open.
     * 
     * @returns {undefined}
     */
    async activateWindow()
    {
        if (this.mainWindow === null) {
            this.createWindow();
        }
    }

    /**
     * Quit when all windows are closed.
     * On OS X it is common for applications and their menu bar
     * to stay active until the user quits explicitly with Cmd + Q
     * 
     * @returns {undefined}
     */
    async closeALlWindows()
    {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    }

    /**
     * SSL/TSL: this is the self signed certificate support
     * On certificate error we disable default behaviour (stop loading the page)
     * and we then say "it is all fine - true" to the callback
     * 
     * @param {type} event
     * @param {type} webContents
     * @param {type} url
     * @param {type} error
     * @param {type} certificate
     * @param {type} callback
     * @returns {undefined}
     */
    async certificateError(event, webContents, url, error, certificate, callback)
    {
        event.preventDefault();
        callback(true);
    }

    /**
     * Create the browser window. 
     * 
     * @returns {void}
     */
    async createWindow()
    {
        this.mainWindow = await new BrowserWindow({
            width: 800,
            height: 600,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true
            }
        });

        this.mainWindow.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            this.mainWindow = null;
        });

//        this.mainWindow.webContents.openDevTools();

        return await this.loadDefaultLoader();
    }

    /**
     * @returns {void}
     */
    async startAdonis()
    {
        if (this.isProd) {
            await cp.exec(`node build/server.js`);
        } else {
            await cp.exec(`npm run dev --watch`);
        }
    }

    /**
     * @param {int} ms
     * @returns {Promise}
     */
    async timeout(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};




//let mainWindow;
//let exec;
//
//
//
//
//async function createWindow() {
//    // Create the browser window.     
//    mainWindow = new BrowserWindow({
//        width: 800,
//        height: 600,
//        autoHideMenuBar: true,
//        webPreferences: {
//            nodeIntegration: true
//        }
//    });
//
//    await startAdonis();
//
//    //mainWindow.webContents.openDevTools()
//
//    // and load the index.html of the app.     
//    //mainWindow.loadURL(`http://${process.env.HOST}:${process.env.PORT}`)  
//    await mainWindow.loadFile(`./resources/views/start.html`);
//
//    await loadWindow();
//    
//    
//    
////    exec.kill('SIGINT');
//    
//    // Emitted when the window is closed.
//    mainWindow.on('closed', function () {
//        // Dereference the window object, usually you would store windows
//        // in an array if your app supports multi windows, this is the time
//        // when you should delete the corresponding element.
//        mainWindow = null;
//    });
//}
//
///**
// * 
// * @returns {unresolved}
// */
//async function loadWindow()
//{
//    const url = `http://127.0.0.1:3333`;
//    axios.get(url).catch((err) => {
//        loadWindow();
//        console.log('check again');
//    }).then((response) => {
//        if(response){
//            console.log('good');
//            mainWindow.loadURL(url);
//        }
//    });
//    
////    return await mainWindow.loadURL().catch((err : any) => {
////        console.log('oopsie');
////    });
//}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//app.on('ready', createWindow);

// Quit when all windows are closed.
//app.on('window-all-closed', function () {
//    // On OS X it is common for applications and their menu bar
//    // to stay active until the user quits explicitly with Cmd + Q
//    if (process.platform !== 'darwin') {
//        app.quit();
//    }
//});
//
//app.on('activate', function () {
//    // On OS X it's common to re-create a window in the app when the
//    // dock icon is clicked and there are no other windows open.
//    if (mainWindow === null) {
////        createWindow();
//    }
//});

//// SSL/TSL: this is the self signed certificate support
//app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
//    // On certificate error we disable default behaviour (stop loading the page)
//    // and we then say "it is all fine - true" to the callback
//    event.preventDefault();
//    callback(true);
//});