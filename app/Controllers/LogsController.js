/* global process */
const ftp = require("basic-ftp");
const fs = require('fs');

class LogsController
{
    /**
     * @returns {nm$_LogsController.LogsController}
     */
    constructor()
    {
        this.path =  process.env.APPDATA;
        this.appName = `Simply-Scum-Bot`;
        
        if (!fs.existsSync(`${this.path}/${this.appName}`)){
            fs.mkdirSync(`${this.path}/${this.appName}`);
        }
        
        if (!fs.existsSync(`${this.path}/${this.appName}/logs`)){
            fs.mkdirSync(`${this.path}/${this.appName}/logs`);
        }
    }
    
    /**
     * @param {Object} socket
     * @param {Object} server
     * @returns {void}
     */
    async start(socket, server)
    {
        if(!server){
            return false;
        }
        
        try{
            await this.connect(socket, server);
        }catch(err){
            socket.emit('server:message', `Error: ${err.message}`);
            socket.emit('server:message', `Restarting data connection`);
            socket.emit('logs:retry');
        }           
    }
    
    /**
     * @param {type} socket
     * @param {type} server
     * @returns {undefined}
     */
    async connect(socket, server)
    {
        const client = new ftp.Client();
        
        await client.access({
            host: server.ftp_ip,
            user: server.ftp_username,
            password: server.ftp_password,
            port: server.ftp_port
        });
        
        const path = server.log_directory || "SCUM/Saved/SaveFiles/Logs";

        let list = await client.list(path);
        
        const files = await this.processFiles(list);
        
        for (const key of Object.keys(files)) {
            const log = files[key][Object.keys(files[key]).length - 1];
            const folderName = log.name.split('_')[0];
            
            if (!await fs.existsSync(`${this.path}/${this.appName}/logs/${folderName}`)){
                await fs.mkdirSync(`${this.path}/${this.appName}/logs/${folderName}`);
            }
            
            await client.downloadTo(`${this.path}/${this.appName}/logs/${folderName}/${log.name}`, `${path}/${log.name}`);
            
            const content = await fs.readFileSync(`${this.path}/${this.appName}/logs/${folderName}/${log.name}`);

            await socket.emit('logs:downloaded', {path : `${this.path}/${this.appName}/logs/${folderName}`, file : log, buffer : content});
        }
        
        await client.close();
    }
    
    /**
     * @param {array} logs
     * @returns {nm$_LogsController.LogsController.processFiles.files}
     */
    async processFiles(logs)
    {
        const files = {};
        
        for (const log of logs) {
            let name = log.name.split('_');
            
            if(!files[name[0]]){
                files[name[0]] = [];
            }
            
            files[name[0]].push(log);
        }
                
        return files;
    }
    
    
}

module.exports = new LogsController;