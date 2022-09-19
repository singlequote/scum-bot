import Swal from 'sweetalert2'
window.Swal = Swal;


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