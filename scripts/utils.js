define('scripts/utils', function (require, window) {
    'use strict';

    class Timer {
        constructor(name, fn, milliseconds) {
            this.name = name;
            this.fn = fn;
            this.ms = milliseconds;
        }

        start() {
            if (this.timeout) return;
            window.console.info(`Starting ${this.name} timer`);
            function timeout () {
                this.fn();
                this.timeout = null;
                this.start(); // restart the timer
            }
            this.timeout = window.setTimeout(timeout.bind(this), this.ms);
        }

        stop() {
            if (!this.timeout) return;
            window.console.info(`Stopping ${this.name} timer`);
            window.clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    function throttle (fn, numberOfMsBetweenCalls, ctx) {
        let lastTime = null;
        let timeout = null;
        return function throttle() {
            window.clearTimeout(timeout);
            const args = arguments;
            const currentTime = Date.now();
            if (!lastTime || (currentTime - lastTime >= numberOfMsBetweenCalls)) {
                lastTime = currentTime;
                fn.apply(ctx, args);
            } else {
                // ugly hack to make sure trailing edge calls call eventually ...
                timeout = window.setTimeout(() => fn.apply(ctx, args), numberOfMsBetweenCalls + 1);
            }
        };
    }

    function flatten(list) {
        return list.reduce((prev, curr) =>  prev.concat(curr), [])
    }

    const JSONP_MS_TIMEOUT = 3 * 1000;

    return {
        jsonp: (function () {
            const body = window.document.body;
            function jsonp(url, callbackName, onResponse) {

                const script = window.document.createElement('script');
                script.async = true;
                script.src = url;

                const timeout = window.setTimeout(function onTimeout() {
                    onResponse(null, 'timeout');
                    body.removeChild(script);
                    window[callbackName] = null;
                }, JSONP_MS_TIMEOUT);

                window[callbackName] = (results) => {
                    onResponse(results, null);
                    body.removeChild(script);
                    window[callbackName] = null;
                    window.clearTimeout(timeout);
                }

                body.appendChild(script);
            };
            return jsonp;
        })(),

        Timer,
        flatten,
        throttle
    };
});
