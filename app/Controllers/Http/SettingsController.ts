import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Drive from '@ioc:Adonis/Core/Drive';

export default class SettingsController 
{

    public async index({ view }: HttpContextContract) {
        const exists = await Drive.exists('settings.json');

        if (!exists) {
            await Drive.put('settings.json', JSON.stringify({ 
                API_KEY: "",
                END_POINT : "https://simply-scum.com",
                START_DELAY : 10,
                REFRESH_DELAY : 1
            }))
        }

        const contents = JSON.parse((await Drive.get('settings.json')).toString());

        return view.render('settings/index', {
            settings: contents
        });
    }    
    
    public async store({ request, session, response }: HttpContextContract) {
        const postSchema = schema.create({
            api_key: schema.string({ trim: true }, [
                rules.minLength(36),
                rules.maxLength(36)
            ]),
            end_point: schema.string()
        })

        const payload = await request.validate({ schema: postSchema });
        
        const contents = JSON.parse((await Drive.get('settings.json')).toString());
        
        contents.API_KEY = payload.api_key;
        contents.END_POINT = payload.end_point;
        
        await Drive.put('settings.json', JSON.stringify(contents))
        
        session.flash('success', 'Post created successfully');
        
        return response.redirect().toRoute('DashboardController.index');
    }
    
    
    public async settings()
    {
        return JSON.parse((await Drive.get('settings.json')).toString());
    }
}
