define('app', function (require, window) {
    'use strict';

    const Timer = require('scripts/utils').Timer;
    const ScrollTracker = require('scripts/utils').ScrollTracker;

    const DOM = require('scripts/dom').DOM;

    const Container = require('scripts/components').Container;
    const PhotoAppStorage = require('scripts/data').PhotoAppStorage;

    const IDLE_TIMEOUT = 60 * 1000;

    // ------------- init -------------

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

    data.onChange(() => {
        dom.update(app)
        scroller.invalidate();
        if (app.props.store.getCurrentRoute() !== 'feed')
            idleTimer.stop();
    });

    // If the user is near the top of the feed and has been idle for 60 seconds
    // we'll refresh the feed. Normally I'd maintain the countdown in data.js but
    // that seems a bit excessive right now.
    const idleTimer = new Timer('idle', app.refreshPhotos.bind(app), IDLE_TIMEOUT);
    idleTimer.start();

    scroller.onScroll(() => {

        const currentRoute = app.props.store.getCurrentRoute();

        // If we're not on the 'feed' route then stop the idle timer
        // and don't do anything else.
        if (currentRoute !== 'feed')
            return void idleTimer.stop();

        // If we're within half a screen height of the top of the document
        // then we can start the idle timer again.
        if (scroller.getScrollTop() <= (scroller.getScreenHeight() / 2))
            idleTimer.start();
        else
            idleTimer.stop();

        // If we are within one full screen of the bottom of the document
        // then it's time to grab more photos!
        if (scroller.getScrollBottom() >= (scroller.getDocumentHeight() - scroller.getScreenHeight()))
            app.loadMorePhotos();
    });

    dom.update(app);
    app.refreshPhotos();

    return app;
});
