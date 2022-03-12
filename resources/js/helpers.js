import Swal from 'sweetalert2'
window.Swal = Swal;

import Screen from './plugins/screen';
import Cookies from 'js-cookie'
window.Cookies = Cookies;

import Moment from 'moment'
window.moment = Moment;

require('bootstrap-select');

//set the csrf page token
window._token = $('meta[name="csrf-token"]').attr('content');

/**
 * Return the current csrfToken
 *
 * @return {String}
 */
window.csrfToken = () => {
  return $('meta[name="csrf-token"]').attr('content');
};

$(window).focus(() => {
    window.tabOpen = true;
});

$(window).blur(() => {
    window.tabOpen = false;
});

/**
 * Show a notification
 *
 * @param {String} message
 * @param {String} type
 * @param {Boolean} toast
 * @return {undefined}
 */
window.notify = (message, type = 'success', toast = true, config = {}) => {

    let dataConfig = $.extend({
        toast: toast,
        position: 'bottom-end',
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 3000,
        backdrop: toast,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    }, config);

    return Swal.fire(dataConfig);
};

/**
 * Show a notification using desktop notifications
 * 
 * @param {String} title
 * @param {Object} options
 * @returns {undefined}
 */
window.notification = (title= "...", options = {}) => {
    let config = $.extend({
        icon: $('link[sizes="32x32"]').attr('href'),
        tag : "notify",
        requireInteraction: true
    }, options);

    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        return new Notification(title, config);
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === "granted") {
                return new Notification(title, config);
            }
        });
    }
};

/**
 * Show confirm modal for deleting items
 *
 * @param {Object} callback
 * @return {undefined}
 */
window.confirmDelete = (callback) => {
    Swal.fire({
        title: __('Are you sure'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: __('Yes, delete it'),
        cancelButtonText: __('Cancel')
    }).then((result) => {
        if (result.isConfirmed) {
            callback();
        }
    });
};

/**
 * Show confirm modal for deleting items
 *
 * @param {Object} callback
 * @return {undefined}
 */
window.confirm = (callback, config = {}) => {
    let dataConfig = $.extend({
        title: __('Are you sure'),
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: __('Yes, continue'),
        cancelButtonText: __('Cancel')
    }, config);
    
    Swal.fire(dataConfig).then((result) => {
        if (result.isConfirmed) {
            callback();
        }
    });
};

/**
 * Show a loading popup
 *
 * @param {String} message
 * @param {String} type
 * @param {Boolean} toast
 * @return {Swal}
 */
window.loader = (message = __("Loading"), type = 'info', toast = false) => {
    Swal.fire({
        title: message,
        icon: type,
        toast: toast,
        timerProgressBar: false,
        didOpen: () => {
            Swal.showLoading();
        },
        willClose: () => {}
    }).then((result) => {});

    return Swal;
};

/**
 * Show a confirm modal for deletion.
 * Post request when confirmed
 *
 * @type {type}
 */
$(document).on('click', '.confirm-deleting,.confirm-delete', (e) => {
    e.preventDefault();

    let target = $(e.currentTarget);
    let url = $(e.currentTarget).attr('href') || $(e.currentTarget).data('route');

    confirmDelete(() => {
        pushDelete(url, () => {
            if (target.closest('.confirm-parent,tr').length) {
                target.closest('.confirm-parent,tr').hide('slow');
                notify(__("Deleted"));
            }else if (target.data('delete')) {
                $(`[data-id="${target.data('delete')}"]`).hide('slow');
                notify(__("Deleted"));
            }else if (target.data('redirect')) {
                location.href = target.data('redirect');
            }else {
                location.reload();
            }
        });
    });
});

/**
 * Show a confirm modal for deletion.
 * Post request when confirmed
 *
 * @type {type}
 */
$(document).on('click', '.push-deleting,.push-delete', (e) => {
    e.preventDefault();

    let target = $(e.currentTarget);
    let url = $(e.currentTarget).attr('href');

    pushDelete(url, () => {
        target.closest('.confirm-parent').hide('slow');
        
        notify(__("Deleted"));
    });
});

/**
 * Show a confirm modal for get requests.
 *
 * @type {type}
 */
$(document).on('click', '.confirm', (e) => {
    e.preventDefault();

    let url = $(e.currentTarget).attr('href') || $(e.currentTarget).data('route');
    
    confirm(() => {
        location.href = url;
    });
});

/**
 * Push the delete post
 * 
 * @param {String} url
 * @param {Object} callback
 * @returns {undefined}
 */
window.pushDelete = (url, callback) => {
    
    $.post(url, {_token: _token, _method: "delete"}, (response) => {
        callback();
    }).fail((err) => {
        notify(__("Whoops, something went wrong on our server."), 'error');
    });
};

/**
 * Set a bootstrap spinner
 * 
 * @param {String} type
 * @return {void}
 */
$.fn.spinner = function(type = 'append')
{
    let spinner = this.find('.spinner-border');
    
    if(type === 'remove'){
        return spinner.remove();
    }
    
    if(!spinner.length){
        this.prepend(`<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>`);
    }
};

/**
 * Return new Inscreen
 * 
 * @returns {Screen}
 */
window.screen = () => {
    return Screen;
};
 
 
/**
 * @param {Object} element
 * @param {Object} options
 * @returns {undefined}
 */
window.ticker = (element, options = {}) => {
    const config = $.extend({
        value : 0,
        prev: 0,
        before: '',
        after: '',
        type: 'number',
        showEmpty: false,
        decimals : null
    }, options);            
    
    let value = unPrettyNumber(config.value);
    config.prev = unPrettyNumber(config.prev);
        
    let decimals = config.decimals || decimalCount(config.value);
    
    if(decimals === 1){
        decimals = 2;
    }
    
    element.data('prev', config.value);
    
    if(!config.showEmpty && !value){
        return false;
    }
    
    $({ countNum: config.prev }).animate({ countNum: value }, {
        duration: 1000, // tune the speed here
        easing: 'linear',
        step: (step, steps) => {
            
            try{
                switch (config.type) {
                    case "number":
                        element.html(`${config.before}${prettyNumber(step.toFixed(decimals))}${config.after}`);
                        break;
                    case "currency":
                        element.html(`${config.before}&euro; ${prettyNumber(step.toFixed(decimals))}${config.after}`);
                        break;
                    case "procent":
                        element.html(`${config.before}${prettyNumber(step.toFixed(2))}%${config.after}`);
                        break;
                    case "percentage":
                        element.html(`${config.before}${prettyNumber(step.toFixed(2))}%${config.after}`);
                        break;
                    default:
                        element.html(`${config.before}${unPrettyNumber(step)}${config.after}`);
                        break;
                }
            }catch(err){
                console.log(err, step, config.value);
            }
        },
        complete: () => {
            
        }
    });
    
    
};

/**
 * @param {String} number
 * @returns {unresolved}
 */ 
window.unPrettyNumber = (number) => {
    if(typeof number === 'number'){
        return number;
    }
    
    let raw = number.replace('%', '');
     
    if(raw.includes('.') && raw.includes(',')){
       return Number(raw.replace('.', '').replace(',', '.'));
    }

    if(raw.includes('.') && !raw.includes(',')){
        return Number(raw);
    }

    if(raw.includes(',') && !raw.includes('.')){
        return Number(raw.replace(',', '.'));
    }
    
    return raw;
};

/**
 * @param {String} number
 * @returns {unresolved}
 */ 
window.prettyNumber = (value) => {
    
    let number = value.toString();
        
    return number.replace('.', ',');
};

/**
 * @param {String} number
 * @returns {unresolved}
 */ 
window.decimalCount = (value) => {
    
    let number = unPrettyNumber(value).toString();
    
    if(!number.includes('.')){
        return 0;
    }
    
    return number.split('.').reverse()[0].length;
};