define('app', function (require) {
    'use strict';

    let el = require('scripts/dom').el;
    let update = require('scripts/dom').update;
    let jsonp = require('scripts/utils').jsonp;

    let DATA_STORE = {
        photos: [],
        photosByLink: {}
    };

    class Photo {
        constructor(data) {
            this.data = data;
        }

        render() {
            return (
                el('div', {'class': 'photo'},
                    el('img', {src: this.data.media.m})
                )
            )
        }
    }

    class App {
        constructor(rootEl) {
            this.rootEl = rootEl;
        }

        render() {
            return (
                el('div', {'class': 'photos'},
                    DATA_STORE.photos.map((attrs) => new Photo(attrs))
                )
            )
        }
    }

    let app = new App(document.getElementById('main'));

    function processFeed (response) {
        let changed;
        response.items.forEach((item) => {
            if (!DATA_STORE.photosByLink[item.link]) {
                changed = true;
                DATA_STORE.photos.push(item);
                DATA_STORE.photosByLink[item.link] = item;
            }
        });
        if (changed)
            update(app.rootEl, app);
    }

    jsonp(
        'http://api.flickr.com/services/feeds/photos_public.gne?format=json',
        'jsonFlickrFeed',
        processFeed
    );

    update(app.rootEl, app);

    return app;
});
