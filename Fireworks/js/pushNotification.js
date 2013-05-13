$(document).ready(function () {
    $('.blockPushNotification').each(function () {
        var id = $(this).attr('id');        
        var cookie = JSDoIt.cookie(id);
        if (typeof(cookie) == 'undefined' || cookie != 'block') {
            //        setTimeout(showPushNotification, 2000);
            showPushNotification(id);
            return false;
        }
        
    });

    $('.blockPushNotification .close .btn').click (function () {
        var block = $(this).closest('.blockPushNotification');
        var id = block.attr('id');
        JSDoIt.cookie(id, 'block', { expires: 365 });
        block.slideUp();        
    });
    $('.blockPushNotification a').click (function () {
        var block = $(this).closest('.blockPushNotification');
        var id = block.attr('id');
        JSDoIt.cookie(id, 'block', { expires: 365 });
        block.slideUp();        
        return true;
    });
    function showPushNotification (id) {
        $('#' + id).show();
    }
});
