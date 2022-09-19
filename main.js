/* global process */

require('dotenv').config();
const {app, BrowserWindow} = require('electron');
const {readFileSync} = require("fs");
const {createServer} = require("http");
const {Server} = require("socket.io");
const path = require('path');

const RobotController = require('./app/Controllers/RobotController');
const SettingsController = require('./app/Controllers/SettingsController');
const LogsController = require('./app/Controllers/LogsController');

const exec = require('child_process').exec;

/**
 * @returns {StartApp}
 */
class StartApp
{

    /**
     * @returns {StartApp}
     */
    constructor()
    {
        if (require('electron-squirrel-startup')) {
            return app.quit();
        }
                
        this.setupLocalSocket();
        this.isProd = process.argv[2] !== '--dev';
        this.init();
    }
    
    /**
     * @returns {void}
     */
    async setupLocalSocket()
    {
        const httpServer = createServer({
        }, (req, res) => {
            res.writeHead(200);
            res.end('hello world\n');
        });

        const serverOpen = httpServer.listen(3000);
        
        this.settings = await SettingsController.get();
        
        const running = await this.running('scum.exe');

        if(running){
            await SettingsController.storeSync({ACTIVE_CHANNEL: null});
        }else{
            await SettingsController.storeSync({ACTIVE_CHANNEL: this.settings.START_CHANNEL});
        }
        
        const io = new Server(httpServer, {/* options */});

        io.on("connection", (localSocket) => {
            localSocket.on('settings:get', SettingsController.emit.bind(SettingsController, localSocket));
            localSocket.on('settings:store', SettingsController.store.bind(SettingsController, localSocket));
            localSocket.on('robot:execute', RobotController.executeFromSocket.bind(RobotController, localSocket));
            localSocket.on('robot:findChannelName', RobotController.findChannelName.bind(RobotController, localSocket));
            localSocket.on('logs:download', LogsController.start.bind(LogsController, localSocket));
            localSocket.on('exec:running', this.isRunning.bind(this, localSocket));
            localSocket.on('exec:start', this.startProgram.bind(this, localSocket));
        });

    }
    
    /**
     * @returns {void}
     */
    async init()
    {        
        app.on('ready', await this.createWindow.bind(this));
        app.on('activate', await this.activateWindow.bind(this));
        app.on('certificate-error', await this.certificateError.bind(this));
        app.on('window-all-closed', await this.closeALlWindows.bind(this));
    }


    /**
     * @returns {void}
     */
    async loadProgram()
    {
        await this.mainWindow.loadFile(`./resources/views/dashboard/index.html`);
    }

    /**
     * @returns {void}
     */
    async loadDefaultLoader()
    {
        await this.mainWindow.loadFile(`./loader/loader.html`);
        await this.loadProgram();
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
     * @returns {void}
     */
    async closeALlWindows()
    {
        if (process.platform !== 'darwin') {
            app.quit();
        }

        process.exit();
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

        await require('update-electron-app')({
            logger: require('electron-log')
        });

//        this.mainWindow.webContents.openDevTools();

        return await this.loadDefaultLoader();
    }

    /**
     * @param {int} ms
     * @returns {Promise}
     */
    async timeout(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * @param {Object} socket
     * @param {String} query
     * @returns {void}
     */
    async isRunning(socket, query) {
        
        if(!this.isProd){
            const running = true;
            return socket.emit('exec:running', {query, running});
        }
        
        let platform = process.platform;
        let cmd = '';
        switch (platform) {
            case 'win32':
                cmd = `tasklist`;
                break;
            default:
                break;
        }
        exec(cmd, (err, stdout, stderr) => {
            const running = stdout.toLowerCase().indexOf(query.toLowerCase()) > -1;
            socket.emit('exec:running', {query, running});
        });
    }
        
    /**
     * @param {String} query
     * @returns {Promise}
     */
    async running(query) {
        let platform = process.platform;
        let cmd = '';
        switch (platform) {
            case 'win32':
                cmd = `tasklist`;
                break;
            default:
                break;
        }
        
        return new Promise((resolve, reject) => {
            exec(cmd, (err, stdout, stderr) => {
                resolve(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
            });
        });
    }
    
    /**
     * @param {Object} socket
     * @param {String} query
     * @returns {void}
     */
    async startProgram(socket, query) {
        exec(`start ${query}`).unref();
    }
}

new StartApp;