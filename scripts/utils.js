define('scripts/utils', function () {
    'use strict';
    return {
        jsonp: (function () {
            const body = document.body;
            function _jsonp (url, callbackName, onResponse) {
                let script = document.createElement('script');
                script.async = true;
                script.src = 'http://api.flickr.com/services/feeds/photos_public.gne?format=json';
                window[callbackName] = (results) => {
                    onResponse(results);
                    body.removeChild(script);
                    window[callbackName] = null;
                }
                body.appendChild(script);
            };
            return _jsonp;
        })()
    };
});
