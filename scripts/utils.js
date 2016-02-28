define('scripts/utils', function (require, window) {
    'use strict';
    return {
        jsonp: (function () {
            const body = window.document.body;
            function jsonp(url, callbackName, onResponse) {
                let script = window.document.createElement('script');
                script.async = true;
                script.src = url;
                window[callbackName] = (results) => {
                    onResponse(results);
                    body.removeChild(script);
                    window[callbackName] = null;
                }
                body.appendChild(script);
            };
            return jsonp;
        })()
    };
});
