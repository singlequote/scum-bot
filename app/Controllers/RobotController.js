/* global process */
require('dotenv').config();
const {keyboard, Key, clipboard} = require('@nut-tree/nut-js');
const clipboardy = require('clipboardy');
const axios = require('axios');
const exec = require('child_process').exec;
const isDev = require('electron-is-dev');
const SettingsController = require('./SettingsController');

class RobotController
{
    /**
     * @returns {nm$_SettingsController.SettingsController}
     */
    constructor()
    {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }
    
    /**
     * 
     * @param {Object} socket
     * @param {Array} data
     * @returns {void}
     */
    async executeFromSocket(socket, data)
    {
        this.shouldTeleport = false;
        this.settings = await SettingsController.get();
        this.chatChannel = this.settings.ACTIVE_CHANNEL;
        
        this.socket = socket;
        const running = await this.isRunning('scum.exe');
        
        if(!running || !this.chatChannel){
            SettingsController.store(socket, {ACTIVE_CHANNEL : this.settings.START_CHANNEL});
            return await this.log(`Error: Game is not running!`);
        }
        
        await this.keyPress(Key.T); //open chat menu

        for (const command of data.commands) {
            await this.changeChannel(socket, command.channel);
            this.log(`Processing #${command.command}...`);
            await this.execCommands(command);
            await this.timeout(this.settings.COMMAND_DELAY);
        }
        
        await this.keyPress(Key.Escape); //close chat menu
    }
    
    /**
     * @returns {void}
     */
    async findChannelName(localSocket = null)
    {
        if(localSocket){
            this.socket = localSocket;
        }
        
        const running = await this.isRunning('scum.exe');
        
        if(!running){
            this.log(`ERROR: Game is not running! Could not validate channel name!`);
            return;
        }
        
        await this.keyPress(Key.T); //open chat menu
        
        await this.message(`@#Powered by : Simply Scum Bot!`);
        
        await this.keyPress(Key.Escape); //close chat menu
    }
    
    /**
     * @param {String} channel
     * @returns {Promise}
     */
    async changeChannel(socket, channel)
    {
        //LOCAL
        if(this.chatChannel === 'local' && channel === 'global'){
            await this.keyPress(Key.Tab);
        }
        
        if(this.chatChannel === 'local' && channel === 'admin'){
            await this.keyPress(Key.Tab);
            await this.keyPress(Key.Tab);
        }
        
        // GLOBAL
        if(this.chatChannel === 'global' && channel === 'admin'){
            await this.keyPress(Key.Tab);
        }
        
        if(this.chatChannel === 'global' && channel === 'local'){
            await this.keyPress(Key.Tab);
            await this.keyPress(Key.Tab);
        }
        
        //ADMIN
        if(this.chatChannel === 'admin' && channel === 'local'){
            await this.keyPress(Key.Tab);
        }
        
        if(this.chatChannel === 'admin' && channel === 'global'){
            await this.keyPress(Key.Tab);
            await this.keyPress(Key.Tab);
        }
        
        //LOG INFO
        if(this.chatChannel !== channel){
            this.log(`Changing channel from ${this.chatChannel} to ${channel}`);
        }else{
            this.log(`Current channel is ${this.chatChannel}`);
        }
        
        if(channel === 'local'){
            this.shouldTeleport = true;
        }
        
        this.chatChannel = channel;
        await SettingsController.store(socket, {ACTIVE_CHANNEL: channel});
    }
    
    /**
     * @default location MadEngineer: X=-254811.891 Y=-24753.699 Z=179891.000
     * 
     * @param {Object} command
     * @returns {void}
     */
    async execCommands(command)
    {
        if(command.player && this.shouldTeleport){
            await this.teleportToPlayer(command.player);
        }
        
        this.shouldTeleport = false;
        
        if (command.is_order) {
            return await this.executeOrder(command);
        }
        
        if (command.is_custom) {
            return await this.executeCustom(command);
        }
        
        if (command.is_location) {
            return await this.getLocations(command);
        }

        if (command.is_message) {
            return await this.executeMessage(command);
        }
    }
    
    /**
     * @param {type} player
     * @returns {undefined}
     */
    async teleportToPlayer(player)
    {        
        this.log(`#TeleportTo ${player.name}`);
        await this.message(`#TeleportTo ${player.steam64}`);
                        
        await this.timeout(this.settings.TELEPORT_DELAY);
    }
    
    /**
     * @param {Object} command
     * @returns {void}
     */
    async executeMessage(command)
    {
        await this.setFakeName(command.execName);
        
        for (const message of command.exec) {
            await this.message(message);
        }
    }
    
    /**
     * @param {Object} command
     * @returns {void}
     */
    async getLocations(command)
    {
        for (const item of command.exec) {
            const location = await this.copyLocation(item);
            await this.log(`Location recieved...`); 
            await this.socket.emit('robot:playerloc', {steam64 : item, location : `${location}`});
        }
    }
        
    
    /**
     * @param {Object} command
     * @returns {void}
     */
    async executeOrder(command)
    {
        await this.setFakeName(command.execName); //set fake name

        await this.message(`@${command.player.name} we are processing your #${command.command}...`);
        await this.message(`@${command.player.name} please wait in an open area!`);

        await this.executeItems(command, 'product');

        await this.message(`@${command.player.name} #${command.command} is processed!`);
    }
    
    /**
     * @param {Object} command
     * @returns {void}
     */
    async executeCustom(command)
    {
        await this.setFakeName(command.execName); //set fake name
        await this.executeItems(command, 'custom');
    }
    
    /**
     * @param {Object} command
     * @param {String} type
     * @returns {void}
     */
    async executeItems(command, type = 'product')
    {
        const location = await this.copyLocation(command.player.steam64);
        
        for (const item of command.exec) {
            let addLocation = item.location ? `Location "${location}"` : ``;
            let key = item.hash || `#spawnItem`;
            let list = '';
            
            if(type === 'product'){
                list = `${key} ${item.item} ${item.amount} Uses ${item.uses} Health ${item.health} Dirtiness ${item.dirtiness}`;
            }else{
                list = `${command.execCommand} ${item.item}`;
            }
            
            await this.message(`${list} ${addLocation}`);
        }

        return;
    }
    
    /**
     * @param {type} steam64
     * @returns {unresolved}
     */
    async copyLocation(steam64)
    {
        await clipboard.copy(`#Location ${steam64} true`);
        await this.keyPress(Key.LeftControl, Key.V);
        await this.keyPress(Key.Enter);

        const location = await clipboardy.read();
        
        await this.socket.emit('robot:playerloc', {steam64 : steam64, location : `${location}`});
        
        return location;
    }
    
    /**
     * @param {type} message
     * @returns {void}
     */
    async message(message)
    {
        await clipboard.copy(message);
        await this.keyPress(Key.LeftControl, Key.V);
        await this.keyPress(Key.Enter);
        await this.timeout(this.settings.ROBOT_DELAY);
    }
    
    /**
     * @param {type} name
     * @returns {void}
     */
    async setFakeName(name)
    {
        if(this.setFakedName === name){
            return;
        }
        
        await clipboard.copy(`#setFakeName ${name}`);
        await this.keyPress(Key.LeftControl, Key.V);
        await this.keyPress(Key.Enter);
        
        this.setFakedName = name;
        
        await this.timeout(this.settings.ROBOT_DELAY);
    }
    
    /**
     * @param {type} firstKey
     * @param {type} secondKey
     * @returns {void}
     */
    async keyPress(firstKey, secondKey = null)
    {
        if (secondKey) {
            await keyboard.pressKey(firstKey, secondKey);
            await keyboard.releaseKey(firstKey, secondKey);
        } else {
            await keyboard.pressKey(firstKey);
            await keyboard.releaseKey(firstKey);
        }

        await this.timeout(this.settings.ROBOT_DELAY);
    }
    
    /**
     * @param {type} message
     * @returns {void}
     */
    async log(message)
    {
        if(this.socket){
            this.socket.emit('server:message', message);   
        }
    }
    
    /**
     * @param {type} ms
     * @returns {Promise}
     */
    async timeout(ms = 2000)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * @param {String} query
     * @returns {Promise}
     */
    async isRunning(query) {
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
}

module.exports = new RobotController;