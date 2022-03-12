
class Screen
{
    /**
     * 
     * @returns {InScreen}
     */
    constructor()
    {
        this.parent = $('.main-panel');
        this.url;
        this.animate = "animate__animated animate__fadeIn";
        
        this.failCallback = (e) => {
            notify(e.statusText, "error");
            this.hide();
        };
        
        this.callback = () => {};
        this.loadConfig();
        
        $(document).on('keydown', (event) =>  {
            if (event.key === "Escape") {
                this.hide();
            }
        });
    }
    
    /**
     * Set loaders
     * 
     * @returns {undefined}
     */
    loadConfig()
    {
        this.settings = {
            id : this.uuidv4(),
            closeButton : false
        };
    }
    
    /**
     * 
     * @returns {Number}
     */
    uuidv4()
    {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
    
    /**
     * 
     * @returns {undefined}
     */
    initInSceen()
    {                 
        this.parent.append(`
            <div id="${this.settings.id}" class="in-screen">
                ${this.settings.closeButton ? `<a class="btn btn-primary btn-nm closeInScreen InScreenActionButtons"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left-circle" style=""><circle cx="12" cy="12" r="10"></circle><polyline points="12 8 8 12 12 16"></polyline><line x1="16" y1="12" x2="8" y2="12"></line></svg></a>` : ``}
                <div class="in-screen-content"></div>
            </div>
        `);
        
        $(document).on('click', `#${this.settings.id} .closeInScreen`, this.hide.bind(this, false));
        $(document).on('click', `#${this.settings.id} .refreshInScreen`, this.refresh.bind(this, false));
        
        return this;
    }
    
    /**
     * Set the config
     * 
     * @param {type} config
     * @returns {InScreen}
     */
    config(config = {})
    {
        $.extend( this.settings, config );
        
        return this;
    }
    
    /**
     * 
     * @param {String} url
     * @param {Integer} skeleton
     * @returns {InScreen}
     */
    load(url)
    {
        this.url = url;
        
        this.initInSceen();
        
        $(`#${this.settings.id} .in-screen-content`).load(url || location.href+'404', (responseText, textStatus, req) => {
            req.fail((response) => {
                return this.failCallback(response);
            }).done((response) => {
                return this.callback(response);
            });
        });
        
        return this;
    }
    
    /**
     * Refresh the current open screen
     * 
     * @returns {undefined}
     */
    refresh()
    {
        $(`#${this.settings.id} .in-screen-content`).load(this.url, (responseText, textStatus, req) => {
            req.fail((response) => {
                return this.failCallback(response);
            }).done((response) => {
                return this.callback(response);
            });
        });
        
        return this;
    }
    
    /**
     * 
     * @returns {InScreen}
     */
    show()
    {        
        $(`#${this.settings.id}`).show().find('.in-screen-content').show().addClass(this.animate);
        
//        this.parent.css({"height":'100%', "overflow" : "hidden"});
        
        return this;
    }
    
    /**
     * 
     * @param {Object} e
     * @returns {InScreen}
     */
    hide(e = false)
    {
//        this.parent.removeAttr('style');
        
        if(e && $(e.target).attr('id') === this.settings.id){
            $(`#${this.settings.id}`).remove();
        }
        
        if(!e){
            $(`#${this.settings.id}`).remove();
        }
        
        return this;
    }
    
    /**
     * Hide all inscreens
     * 
     * @returns {Screen}
     */
    hideAll()
    {
        this.parent.removeAttr('style');
        $('.in-screen').remove();
        
        return this;
    }
    
    /**
     * Fail fallback
     * 
     * @param {Object} callback
     * @returns {InScreen}
     */
    fail(callback)
    {
        this.failCallback = callback;
        
        return this;
    }
    
    /**
     * Done callback
     * 
     * @param {Object} callback
     * @returns {InScreen}
     */
    done(callback)
    {
        this.callback = callback;
        
        return this;
    }
    
    /**
     * Return new instance
     * 
     * @returns {InScreen}
     */
    new()
    {
        return new InScreen;
    }
}

export default new Screen;
