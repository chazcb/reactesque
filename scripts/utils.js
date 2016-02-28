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
        })(),

        throttle: (fn, numberOfMsBetweenCalls, ctx) => {
            var lastTime = null;
            var timeout = null;
            return function throttle() {
                window.clearTimeout(timeout);
                var args = arguments;
                var currentTime = Date.now();
                if (!lastTime || (currentTime - lastTime >= numberOfMsBetweenCalls)) {
                    lastTime = currentTime;
                    fn.apply(ctx, args);
                } else {
                    // ugly hack to make sure trailing edge calls call eventually ...
                    timeout = window.setTimeout(() => fn.apply(ctx, args), numberOfMsBetweenCalls + 1);
                }
            };
        }
    };
});
