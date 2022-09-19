/* global process */
const {readFileSync, existsSync, writeFileSync} = require("fs");

class SettingsController
{
    /**
     * @returns {nm$_SettingsController.SettingsController}
     */
    constructor()
    {
        this.path =  process.env.APPDATA;
        this.appName = `Simply-Scum-Bot`;
        
        this.default = {
            API_KEY: "",
            END_POINT: "https://simply-scum.com",
            START_DELAY: 20,
            REFRESH_DELAY: 5,
            ENABLE_COMMANDS: true,
            ENABLE_PROCESSING: true
        };
    }
    
    /**
     * @returns {Array|Object}
     */
    async get()
    {
        if(!await this.exists()){
            await this.storeDefault();
        }
        
        return await JSON.parse(readFileSync(`${this.path}/${this.appName}/settings.json`));
    }
    
    /**
     * @returns {unresolved}
     */
    async storeDefault()
    {
        const data = JSON.stringify(this.default, null, 4);
        
        try{
            return await writeFileSync(`${this.path}/${this.appName}/settings.json`, data);
        }catch(err){
            
        }
    }
    
    /**
     * @returns {unresolved}
     */
    async exists()
    {
        return existsSync(`${this.path}/${this.appName}/settings.json`);
    }
    
    /**
     * @param {Object} socket
     * @returns {unresolved}
     */
    async emit(socket)
    {
        const settings = await this.get();
        return socket.emit('settings:get', settings);
    }
    
    /**
     * @param {Object} socket
     * @param {Object} data
     * @returns {unresolved}
     */
    async store(socket, data)
    {        
        const spread = await this.storeSync(data);
        
        return socket.emit('settings:store', spread);
    }
    
    /**
     * @param {type} data
     * @returns {undefined}
     */
    async storeSync(data)
    {
        if(!await this.exists()){
            await this.storeDefault();
        }
        
        const settings = await JSON.parse(readFileSync(`${this.path}/${this.appName}/settings.json`));
                
        Object.assign(settings, data);
        
        const spread = { ...this.default, ...settings }
        
        if(spread.LAST_CHANNEL){
            spread.ACTIVE_CHANNEL = spread.LAST_CHANNEL;
        }
        
        await writeFileSync(`${this.path}/${this.appName}/settings.json`, JSON.stringify(spread, null, 4));
        
        return spread;
    }
    
}

module.exports = new SettingsController;