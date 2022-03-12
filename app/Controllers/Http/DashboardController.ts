import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Drive from '@ioc:Adonis/Core/Drive';

export default class DashboardController {
    
    
    public async index({ response, view }: HttpContextContract)
    {
        const exists = await Drive.exists('settings.json');
        
        if(!exists){
            return response.redirect().toRoute('SettingsController.index');
        }
        
        const contents = JSON.parse(await (await Drive.get('settings.json')).toString());
                
        if(!contents.API_KEY || contents.API_KEY.length === 0){
            return response.redirect().toRoute('SettingsController.index');
        }
                    
        return view.render('dashboard/index', {
            settings : contents
        });
    }

    public async create({ }: HttpContextContract)
    {
    
    }

    public async store({ }: HttpContextContract)
    {
        
    }

    public async show({ }: HttpContextContract)
    {
        
    }

    public async edit({ }: HttpContextContract)
    {
        
    }

    public async update({ }: HttpContextContract)
    {
       
    }

    public async destroy({ }: HttpContextContract)
    {
        
    }
}
