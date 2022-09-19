/* global Swal */

//import "regenerator-runtime"
import { io } from "socket.io-client";
import Moment from 'moment'
import '../sass/dashboard.scss'
const packageJson = require('../../package.json');

class Dashboard
{
    /**
     * @returns {Dashboard}
     */
    constructor()
    {
        this.server = null;
        this.inCommandRun = false;
        this.disconnectedFromServer = false;
        this.initialize();
                
//        $('#versionNumber').html(packageJson.version);
        
        $(`#apiKey`).on('click', this.demandApiKey.bind(this));
        $(`input[name="commands"]`).on('change', this.toggleCommands.bind(this));
        $(`input[name="processing"]`).on('change', this.toggleProcessing.bind(this));
        
        //reload the bot after period of time
        setTimeout(this.reloadApp.bind(this), (60 * 1000) * 60);
    }
    
    /**
     * @returns {void}
     */
    async reloadApp()
    {
        location.reload();
    }
    
    /**
     * @returns {void}
     */
    async toggleProcessing()
    {
        this.enableProcessing = $(`input[name="processing"]`).is(':checked');
        
        this.localSocket.emit('settings:store', {ENABLE_PROCESSING : this.enableProcessing});
        
        if(this.enableProcessing){
            this.addServerMessage(`Processing enabled`);
            this.manualDownloadLogs();
        }else{
            if($(`input[name="commands"]`).is(':checked')){
                $(`input[name="commands"]`).prop('checked', false).trigger('change');
            }
            
            this.addServerMessage(`Processing disabled`);
        }
    }
    
    /**
     * @returns {void}
     */
    async toggleCommands()
    {
        this.enableCommands = $(`input[name="commands"]`).is(':checked');
        
        this.localSocket.emit('settings:store', {ENABLE_COMMANDS : this.enableCommands});
        
        if(this.enableCommands){
            this.addServerMessage(`Executing commands enabled`);
            await this.timeout(3);
            this.localSocket.emit('robot:findChannelName');
        }else{
            this.addServerMessage(`Executing commands disabled`);
        }
        
        this.localSocket.emit('exec:running', `scum.exe`);
    }
    
    /**
     * @returns {void}
     */
    async initialize()
    {
        this.localSocket = new io("http://127.0.0.1:3000");
        
        this.retrieveServerSettings();
    }
    
    /**
     * @param {Object} server
     * @param {Array} logs
     * @returns {void}
     */
    async serverDownloadLogs(server, logs)
    {        
        for(const index in logs){
                        
            const log = logs[index];
            
            $(`#downloadedLogs`).prepend(`
                <tr>
                    <td>
                        <p class="text-sm font-weight-normal mb-0">${Moment().format('HH:mm:ss')}</p>
                    </td>
                    <td>
                        <p class="text-sm font-weight-normal mb-0">${log}</p>
                    </td>
                    <td>
                        <span class="badge badge-dot me-4">
                            <i class="bg-success"></i>
                            <span class="text-xs">Success</span>
                        </span>
                    </td>
                </tr>
            `);
            
            if($('#downloadedLogs tr').length > 10){
                $('#downloadedLogs tr').last().remove();
            }
        }
    }
    
    /**
     * @returns {void}
     */
    async retrieveServerSettings()
    {
        this.localSocket.emit('settings:get');
        this.localSocket.emit('exec:running', `scum.exe`);
        
        this.localSocket.on('settings:get', (settings) => {
            this.settings = settings;
            this.applySettings();
        });
        
        this.localSocket.on('settings:store', (settings) => {
            this.settings = settings;
            this.enableSettings();
        });
        
        this.localSocket.on('exec:running', this.checkScumLoading.bind(this));
        
        this.localSocket.on('logs:downloaded', this.downloadedLogs.bind(this));
        this.localSocket.on('server:message', this.addServerMessage.bind(this));
        this.localSocket.on('robot:done', this.robotDone.bind(this));
        this.localSocket.on('robot:playerloc', this.playerLocations.bind(this));
        this.localSocket.on('logs:retry', this.manualDownloadLogs.bind(this));
    }
        
    /**
     * @returns {undefined}
     */
    async robotDone()
    {
        this.inCommandRun = false;
    }
    
    /**
     * @param {type} data
     * @returns {undefined}
     */
    async playerLocations(data)
    {
        if(this.socket){
            this.socket.emit('server:player-locations', {server : this.server, data:data});
        }
    }
    
    /**
     * @param {type} data
     * @returns {undefined}
     */
    async checkScumLoading(data)
    {        
        if(data.query === 'scum.exe' && !data.running && $(`input[name="commands"]`).is(':checked')){
            this.addServerMessage(`Scum is not running. Disabling commands!`);
            
            $(`input[name="commands"]`).prop('checked', false).trigger('change');
            
            Swal.fire({
                title: 'Scum is not running!',
                text: "In order to use the commands in-game you need to run scum!",
                icon: 'warning',
                showCancelButton: false,
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Close'
            }).then((result) => {
                if (result.isConfirmed) {
//                    this.localSocket.emit('exec:start', `scum_Launcher.exe`);
//                    this.localSocket.emit('exec:start', `"C:/Program Files (x86)/Steam/steamapps/common/SCUM/SCUM_Launcher.exe"`);
                }
            });
        }
    }

    
    /**
     * @returns {Boolean}
     */
    async applySettings()
    {        
        if(!this.settings.API_KEY || !this.settings.API_KEY.length){
            await this.demandApiKey();
            
            return false;
        }
        
        await this.enableSettings();
        
        await this.setUpSocketConnection();
    }
    
    /**
     * 
     * @returns {undefined}
     */
    async enableSettings()
    {
        this.enableProcessing = this.settings.ENABLE_PROCESSING;
        this.enableCommands = this.settings.ENABLE_COMMANDS;
        
        $(`input[name="processing"]`).prop('checked', this.enableProcessing);
        $(`input[name="commands"]`).prop('checked', this.enableCommands);
        
        $('#startDelay').html(`${this.settings.START_DELAY} seconds`);
        $('#activeChannel').html(`${this.settings.ACTIVE_CHANNEL || '--'}`);
        $('#lastChannel').html(`${this.settings.LAST_CHANNEL || '--'}`);
        $('#refreshDelay').html(`${this.settings.REFRESH_DELAY} seconds`);
        $('#apiKey').html(`${this.settings.API_KEY}`);
        $('#endPoint').html(`${this.settings.END_POINT}`);
    }
    
    /**
     * @returns {Dashboard}
     */
    async demandApiKey()
    {
        const {value: apiKey} = await Swal.fire({
            title: 'Enter your API key',
            input: 'text',
            inputLabel: 'API key',
            inputValue: this.settings.API_KEY,
            showCancelButton: false,
            allowOutsideClick: false,
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to write something!';
                }
            }
        });

        if (apiKey) {
            Swal.fire(`Your API Key is ${apiKey}`);
            this.localSocket.emit('settings:store', {API_KEY : apiKey});
            location.reload();
        }
    }
    
    /**
     * @param {type} message
     * @returns {undefined}
     */
    async addServerMessage(message)
    {
        if($('#visual pre').length >= 10){
            $('#visual pre').last().remove();
        }
        
        $('#visual').prepend(`<pre style="margin-bottom: 0px;">${Moment().format('HH:mm:ss')}: <i>${message}</i></pre>\n`);
    }
    
    /**
     * @returns {void}
     */
    async setUpSocketConnection()
    {        
        this.socket = new io(`${this.settings.END_POINT}:7001`, {
            secure:true,
            withCredentials: false,
            extraHeaders: {
                "API_KEY": this.settings.API_KEY
            }
        });
        
        this.socket.on('connect', this.connect.bind(this));
        this.socket.on('disconnect', this.disconnect.bind(this));
        this.socket.on('connect_error', this.disconnect.bind(this));
        this.socket.on('server:message', this.addServerMessage.bind(this));
        this.socket.on('server:connected', this.serverConnected.bind(this));
        this.socket.on('server:downloads', this.serverDownloadLogs.bind(this));
        this.socket.on('server:downloaded-stored', this.manualDownloadLogs.bind(this));
    }
        
   /**
    * @returns {void}
    */
    async connect()
    {
        $('#socket h4').html(`<span class="text-success text-sm font-weight-bolder material-icons">check</span>`);
        $('#socket p').html(`Server connected`);
                
        if(this.disconnectedFromServer){
            this.addServerMessage(`Restarting websockets...`); 
            setTimeout(() => {
                location.reload();
            }, 5000);
        }else{
            this.addServerMessage(`Server connected`); 
        }               
    }
    
    /**
     * @param {String} reason
     * @returns {void}
     */
    async disconnect(reason)
    {
        this.server = null;
        this.disconnectedFromServer = true;
        this.addServerMessage(reason);
        $('#socket h4').html(`<span class="text-danger text-sm font-weight-bolder material-icons">error</span>`);
        $('#socket p').html(reason);
        $('#server h4').html(`<span class="text-danger text-sm font-weight-bolder material-icons">error</span>`);
        $('#server p').html(reason);
    }

    
    /**
     * @returns {void}
     */
    async startServer()
    {        
        this.addServerMessage(`Registering Bot...`);
        this.addServerMessage(`This takes around ${this.settings.START_DELAY} seconds`);
        
        await this.timeout(this.settings.START_DELAY);
        
        this.addServerMessage(`Bot registered!`);
        
        $(`input[name="commands"],input[name="processing"]`).removeAttr('disabled');
        
        if(this.enableProcessing && this.server.manual_download){
            
            if(this.enableCommands && !this.settings.ACTIVE_CHANNEL){
                this.addServerMessage(`Trying to get current channel...`);
                this.localSocket.emit('robot:findChannelName');
            }
            
            this.manualDownloadLogs();
        }else{
            this.addServerMessage(`Can't start processing = disabled...`);
        }
    }
    
    /**
     * @param {Array} data
     * @returns {undefined}
     */
    async manualDownloadLogs(data = {})
    {     
        if(!this.enableProcessing){
            return;
        }
        
        if(data.settings){
            this.localSocket.emit('settings:store', data.settings);
        }
        
        if(this.enableCommands && data.commands && data.commands.length && !this.settings.ACTIVE_CHANNEL){
            this.addServerMessage(`Trying to get current channel...`);
            this.localSocket.emit('robot:findChannelName');
        }
        
        if(this.enableCommands && data.commands && data.commands.length && this.settings.ACTIVE_CHANNEL){
            this.localSocket.emit('robot:execute', {commands : data.commands});
        }
        
        if(!this.enableCommands && data.commands && data.commands.length && this.settings.ACTIVE_CHANNEL){
            this.addServerMessage(`Commands recieved but disabled!`);
        }
                
        await this.timeout(this.settings.REFRESH_DELAY);
        
        await this.localSocket.emit('logs:download', this.server);
    }
    
    /**
     * @param {Object} data
     * @returns {undefined}
     */
    async downloadedLogs(data)
    {
        if(!this.enableProcessing){
            return false;
        }
        
        data.server = this.server; //add server details
        
        this.serverDownloadLogs(this.server, [data.file.name]);
        
        this.socket.emit(`server:manual-downloaded`, data);
    }
    
    /**
     * @param {Object} server
     * @returns {undefined}
     */
    async serverConnected(server)
    {
        this.server = server;
        $('#server h4').html(`<span class="text-success text-sm font-weight-bolder material-icons">check</span>`);
        $('#server p').html(`${this.server.name}`);

        this.startServer();
    }
    
    /**
     * @param {int} seconds
     * @returns {Promise}
     */
    async timeout(seconds)
    {
        if (seconds <= 0) {
            return;
        }

        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
}

export default new Dashboard;