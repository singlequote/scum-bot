import {} from 'dotenv/config'
import axios from 'axios';
import https from 'https';
import robot from 'robotjs';
import {keyboard, Key} from '@nut-tree/nut-js';
import clipboard from 'clipboardy';


if (process.env.API_ENV === "local") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

class Api
{
    /**
     * @returns {Scrapper}
     */
    constructor()
    {
        
        
        
        this.initialize();
    }

    /**
     * @returns {void}
     */
    async initialize()
    {
        this.log(`Starting appliation in 10 seconds...`);
        
        await this.timeout(10000);
        
        this.log(`Starting appliation...`);
        
        keyboard.config.autoDelayMs = 1;

        this.retrieveChats();
    }
    
    /**
     * @returns {void}
     */
    async retrieveChats()
    {
        const route = `${process.env.API_URL}/api/${process.env.API_KEY}`;

        axios({
            method: 'get',
            url: route,
            responseType: 'json'
        }).then(async (response) => {
            
            if(response.data.length === 0){
                this.log(`No commands retrieved...`);
            }
            
            for (const command of response.data) {
                this.log(`Processing command #${command.id}...`);
                await this.execCommands(command);
                this.log(`Command #${command.id} processed...`);
            }
            
            setTimeout(this.retrieveChats.bind(this), 500);
        }).catch((err) => {
            this.log(err);
        });
    }
    
    /**
     * 
     * @param {Object} command
     * @returns {void}
     */
    async execCommands(command)
    {
        if(command.is_order){
            this.executeOrder(command);
        }
    }
    
    /**
     * @param {type} command
     * @returns {undefined}
     */
    async executeOrder(command)
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
    async executeItems(command)
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
    async copyLocation(steam64)
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
    async message(message)
    {
        await this.copy(message);
        await robot.keyTap("insert", "shift");
        await robot.keyTap("enter");
    }

    /**
     * @param {String} name
     * @returns {void}
     */
    async setFakeName(name)
    {
        await this.copy(`#setFakeName ${name}`);
        await robot.keyTap("insert", "shift");
        await robot.keyTap("enter");
    }

    /**
     * @param {String} content
     * @returns {Boolean}
     */
    async copy(content)
    {
        return await clipboard.write(content);
    }

    /**
     * @param {int} ms
     * @returns {Promise}
     */
    timeout(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 
     * @param {Mixed|String} message
     * @returns {void}
     */
    log(message)
    {
        if(process.env.API_DEBUG){
            console.log(message);
        }
    }
}

new Api;