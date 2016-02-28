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

    return {
        jsonp: (function () {
            const body = window.document.body;
            function jsonp(url, callbackName, onResponse) {
                const script = window.document.createElement('script');
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

        Timer,

        throttle: (fn, numberOfMsBetweenCalls, ctx) => {
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
    };
});
