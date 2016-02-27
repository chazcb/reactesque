define('scripts/utils', function () {
    'use strict';
    return {
        jsonp: (function () {
            const body = document.body;
            function _jsonp (url, callbackName, onResponse) {
                let script = document.createElement('script');
                script.async = true;
                script.src = url;
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
