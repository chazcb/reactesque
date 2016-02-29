define('lib/data', function (require, window) {
    'use strict';

    class Storage {

        constructor(storageKey) {
            this._listeners = [];
            this.key = storageKey;
            this.STORE = this.load();
        }

        initialState() { return {}; }

        toPersist() { return {}; }

        persist() {
            window.localStorage[this.storageKey] = JSON.stringify(this.toPersist());
            this._listeners.forEach((fn) => fn());
        }

        load() {
            let previous = {};
            try {
                previous = JSON.parse(window.localStorage[this.storageKey]);
            } catch (e) {};
            return Object.assign(this.initialState(), previous)
        }

        onChange(callback) {
            this._listeners.push(callback);
        }
    }

    return {
        Storage,
    };
});
