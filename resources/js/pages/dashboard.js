/* global *default* */
import "regenerator-runtime"
import { io } from "socket.io-client";
import clipboard from 'clipboardy';

export default new class Dashboard
{
    constructor()
    {
        this.server = null;
        this.initialize();
        
        
        
    }
    
    /**
     * @returns {void}
     */
    async initialize()
    {
        await this.retrieveServerSettings();
        
        await this.setUpSocketConnection();
    }
    
    
    /**
     * @returns {void}
     */
    async startFeed()
    {
        
    }
    
    /**
     * @param {Object} server
     * @param {Array} logs
     * @returns {void}
     */
    async serverDownloadLogs(server, logs)
    {
        $('#downloadedLogs').html(``);
        
        for(const index in logs){
            
            const log = logs[index];
            
            $(`#downloadedLogs`).append(`
                <tr>
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
        }
    }
    
    /**
     * @returns {void}
     */
    async retrieveServerSettings()
    {
        const settings = $('.preloader').data('settings');
        
        this.settings = settings;
        
        this.settings.socket = new io();
                                
        this.settings.socket.emit('start:robot', {});

        this.settings.socket.on('server:message', this.addServerMessage.bind(this));
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
        
        $('#visual').prepend(`<pre style="margin-bottom: 0px;">${message.message}</pre>\n`);
    }
    
    /**
     * @param {Closure} callback
     * @returns {void}
     */
    async setUpSocketConnection(callback)
    {
        const host = `${this.settings.END_POINT}:7001`;
        
        this.socket = new io(host, {
            secure:false,
            withCredentials: false,
            extraHeaders: {
                "API_KEY": this.settings.API_KEY
            }
        });
        
        this.socket.on('connect', this.connect.bind(this, callback));
        this.socket.on('server_connect', this.serverConnected.bind(this));
        this.socket.on('server_disconnect', this.serverDisconnect.bind(this));
        this.socket.on('server_download_logs', this.serverDownloadLogs.bind(this));
        
        this.chechServerConnectivity();
    }
    
    /**
     * @returns {void}
     */
    async chechServerConnectivity()
    {
        await this.timeout(1);
        
        if(!this.server){
            this.serverDisconnect();
        }
        
        setTimeout(this.chechServerConnectivity.bind(this), 10 * 1000);
    }
    
    /**
     * 
     * @returns {void}
     */
    async connect()
    {
        $('#socket h4').html(`<span class="text-success text-sm font-weight-bolder material-icons">check</span>`);
        $('#socket p').html(`Server connected`);
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
        
        this.startFeed();
    }
    
    /**
     * @param {type} err
     * @returns {undefined}
     */
    async serverDisconnect(err = null)
    {
        this.server = null;
        $('#server h4').html(`<span class="text-danger text-sm font-weight-bolder material-icons">error</span>`);
        $('#server p').html(`${err ? JSON.stringify(err) : "Can't reach the server. Retrying in 5 seconds..."}`);
        await this.timeout(15);
        location.reload();
    }
    
    /**
     * @param {int} seconds
     * @returns {Promise}
     */
    timeout(seconds)
    {
        if (seconds <= 0) {
            return;
        }

        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
}