//import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import {} from 'dotenv/config'
import SettingsController from './SettingsController'
import axios from 'axios';
//import https from 'https';
import robot from 'robotjs';
import {keyboard} from '@nut-tree/nut-js';
import clipboard from 'clipboardy';

export default class RobotsController {
    
    protected settings;
    
    protected socket;
    
    protected disabled = false;
    
    public async index(socket) 
    { 
    
//        this.disabled = true;
        this.socket = socket;

        const controller = new SettingsController;
        this.settings = await controller.settings();
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        this.initialize(this.settings.START_DELAY);
    }
    
    /**
     * @param {String} content
     * @returns {Boolean}
     */
    public async copy(content)
    {
        return await clipboard.write(content);
    }
    
    /**
     * @returns {Mixed}
     */
    public async read()
    {
        return await clipboard.read();
    }

    /**
     * @returns {void}
     */
    async initialize(delay = 5)
    {
        this.log(`Starting application in ${delay} seconds...`);
        
        await this.timeout(delay);
        
        this.log(`Application started!`);
        
        keyboard.config.autoDelayMs = 1;

        this.retrieveChats();
    }
    
    /**
     * @returns {void}
     */
    async retrieveChats()
    {
        const route = `${this.settings.END_POINT}/api/${this.settings.API_KEY}`;
//        console.log(route);
        axios({
            method: 'get',
            url: route,
            responseType: 'json'
        }).then(async (response) => {
//            this.log(`Connection succeed...`);
            
            if(response.data.length === 0){
                this.log(`No commands recieved...`);
            }
            
            for (const command of response.data) {
                this.log(`Processing command #${command.id} - ${command.command}...`);
                await this.execCommands(command);
                this.log(`Command #${command.id} processed...`);
            }
            
            setTimeout(this.retrieveChats.bind(this), this.settings.REFRESH_DELAY * 1000);
        }).catch((err) => {
            this.log(err);
        });
    }
    
    /**
     * 
     * @param {Object} command
     * @returns {void}
     */
    public async execCommands(command)
    {
        if(this.disabled){
            return;
        }
            
        if(command.is_order){
            this.executeOrder(command);
        }
    }
    
    /**
     * @param {type} command
     * @returns {undefined}
     */
    public async executeOrder(command)
    {
        await robot.keyTap('t'); //open chat menu

        await this.setFakeName(command.execName); //set fake name

        await this.message(`@${command.player.name} your order #${command.id} is being processed...`);
        
        await this.executeItems(command);

        await this.message(`@${command.player.name} #${command.id} is processed!`);
			
        await robot.keyTap("escape");
    }

    /**
     * @param {Object} command
     * @returns {void}
     */
    public async executeItems(command)
    {
        const location = await this.copyLocation(command.player.steam64);
        
        for (const item of command.exec) {
            let addLocation = item.location ? `Location "${location}"` : ``;
                        
            let list = `#spawnItem ${item.item} ${item.amount} Uses ${item.uses} Health ${item.health} Dirtiness ${item.dirtiness}`;
            
            await this.message(`${list} ${addLocation}`);
        }
        
        return;
    }

    /**
     * @param {String} steam64
     * @returns {void}
     */
    public async copyLocation(steam64)
    {
        await this.copy(`#Location ${steam64} true`);
        await robot.keyTap("insert", "shift");
        await robot.keyTap("enter");
        
        return await clipboard.read();
    }

    /**
     * @param {String} message
     * @returns {void}
     */
    public async message(message)
    {
        await this.copy(message);
        await robot.keyTap("insert", "shift");
        await robot.keyTap("enter");
    }

    /**
     * @param {String} name
     * @returns {void}
     */
    public async setFakeName(name)
    {
        await this.copy(`#setFakeName ${name}`);
        await robot.keyTap("insert", "shift");
        await robot.keyTap("enter");
    }

    /**
     * 
     * @param {Mixed|String} message
     * @returns {void}
     */
    public async log(message)
    {
        const date = new Date;

        const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
        const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
        const seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
        
        this.socket.emit('server:message', {message : `${hours}:${minutes}:${seconds} > ${message}`});
    }
    
    
    
    public async timeout(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms * 1000));
    }
}
