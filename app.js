define('app', function (require, window) {
    'use strict';

    const throttle = require('scripts/utils').throttle;
    const Timer = require('scripts/utils').Timer;

    const DOM = require('scripts/dom').DOM;

    const Container = require('scripts/components').Container;
    const PhotoAppStorage = require('scripts/data').PhotoAppStorage;

    const IDLE_TIMEOUT = 60 * 1000;

    // ------------- init -------------

    // Set up the outer container for the application, the data store and wire
    // it to the virtual dom implementation. When the store changes, tell the
    // dom to recalculate the tree.
    const dom = new DOM(window.document.getElementById('main'));
    const app = new Container({ store: new PhotoAppStorage('__virta__') });
    app.props.store.onChange(() => {
        dom.update(app)

        if (app.props.store.getCurrentRoute() !== 'feed')
            idleTimer.stop();
    });

    // If the user is near the top of the feed and has been idle for 60 seconds
    // we'll refresh the feed. Normally I'd maintain the countdown in data.js but
    // that seems a bit excessive right now.
    const idleTimer = new Timer('idle', app.refreshPhotos.bind(app), IDLE_TIMEOUT);
    idleTimer.start();

    // When we get within a full viewport height from the end
    // of the scrollheight we should fetch more photos.
    const containerHeight = dom.el.offsetHeight;
    const halfContainerHeight = containerHeight / 2;
    dom.el.addEventListener('scroll', throttle((evt) => {

        if (app.props.store.getCurrentRoute() !== 'feed')
            return void idleTimer.stop();

        const scrollTop = evt.target.scrollTop;
        const scrollBottom = scrollTop + containerHeight;
        const targetScroll = evt.target.scrollHeight - containerHeight;

        if (scrollTop <= halfContainerHeight)
            idleTimer.start();
        else
            idleTimer.stop();

        if (scrollBottom >= targetScroll)
            app.loadMorePhotos();
    }, 250));

    app.refreshPhotos();
    return app;
});
