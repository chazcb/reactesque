define('app', function (require) {
    'use strict';

    let el = require('scripts/dom').el;
    let update = require('scripts/dom').update;
    let jsonp = require('scripts/utils').jsonp;

    // -------- data ---------

    let DATA_STORE = {
        saved: [],
        savedByLink: {},
        photos: [],
        photosByLink: {}
    };

    function getPhotos () {
        return DATA_STORE.photos;
    }

    function updatePhotos (items) {
        let changed;
        items.forEach((item) => {
            if (!DATA_STORE.photosByLink[item.link]) {
                changed = true;
                DATA_STORE.photos.push(item);
                DATA_STORE.photosByLink[item.link] = item;
            }
        });
        if (changed)
            update(appElement, app);
    }

    function isPhotoSaved (photo) {
        Boolean(DATA_STORE.savedByLink[photo.link]);
    }

    function savePhoto (photo) {
        if (isPhotoSaved(photo)) return;

        DATA_STORE.saved = DATA_STORE.saved.concat(photo);
        DATA_STORE.savedByLink[photo.link] = photo;
        update(appElement, app);
    }

    function unsavePhoto (photo) {
        if (!isPhotoSaved(photo)) return;

        delete DATA_STORE.savedByLink[photo.link];
        DATA_STORE.saved = DATA_STORE.saved.reduce((prev, curr) => {
            if (curr.link !== photo.link) prev.push(curr)
            return prev;
        });
        update(appElement, app);
    }

    // -------- components ----------

    class Photo {
        constructor(photo) {
            this.photo = photo;
        }

        toggleSave() {
            (this.isSaved() ? unsavePhoto : savePhoto)(this.photo);
        }

        isSaved() {
            return isPhotoSaved(this.photo);
        }

        render() {
            return (
                el('div', {'class': 'photo'},
                    el('img', {src: this.photo.media.m}),
                    el('h2', {}, this.photo.author),
                    el('button', {onClick: this.toggleSave.bind(this) }, this.isSaved() ? 'unsave' : 'save')
                )
            )
        }
    }

    class App {
        render() {
            return (
                el('div', {'class': 'photos'},
                    getPhotos().map((attrs) => new Photo(attrs))
                )
            )
        }
    }

    // ------------- init -------------

    let appElement = document.getElementById('main');
    let app = new App();


    jsonp(
        'http://api.flickr.com/services/feeds/photos_public.gne?format=json',
        'jsonFlickrFeed',
        (response) => updatePhotos(response.items)
    );

    update(appElement, app);

    return app;
});
