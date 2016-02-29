define('app', function (require, window) {
    'use strict';

    const DOM = require('lib/dom').DOM;
    const ScrollTracker = require('lib/utils').ScrollTracker;

    const Container = require('src/components').Container;
    const PhotoAppStorage = require('src/data').PhotoAppStorage;

    // Set up the outer container for the application, the data store and wire
    // it to the virtual dom implementation. When the store changes, tell the
    // dom to recalculate the tree.
    const data = new PhotoAppStorage('__virta__');
    const scroller = new ScrollTracker();
    const dom = new DOM(window.document.getElementById('main'));

    const app = new Container({
        dom: dom,
        store: data,
        scroller: scroller,
    });

    return app.init();
});
