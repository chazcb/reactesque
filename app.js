define('app', function (require) {
    'use strict';

    let el = require('scripts/dom').el;
    let update = require('scripts/dom').update;
    let jsonp = require('scripts/utils').jsonp;

    // -------- data ---------

    const STORAGE_KEY = '__virta__';
    function persistData() {
        localStorage[STORAGE_KEY] = JSON.stringify(DATA_STORE);
    }

    function getInitialData() {
        var previous = {};
        try {
            previous = JSON.parse(localStorage[STORAGE_KEY]);
        } catch (e) {};

        return Object.assign({
            currentRoute: 'feed',
            saved: [],
            savedByLink: {},
            photos: [],
            photosByLink: {},
        }, previous);
    }

    let DATA_STORE = getInitialData();

    function updateRoute(route) {
        if (DATA_STORE.currentRoute !== route) {
            DATA_STORE.currentRoute = route;
            update(appElement, app);
            persistData();
        }
    }

    function getCurrentRoute() {
        return DATA_STORE.currentRoute;
    }

    function getPhotos() {
        return DATA_STORE.photos;
    }

    function getSavedPhotos() {
        return DATA_STORE.saved;
    }

    function updatePhotos(items) {
        let changed;
        items.forEach((item) => {
            if (!DATA_STORE.photosByLink[item.link]) {
                changed = true;
                DATA_STORE.photos.push(item);
                DATA_STORE.photosByLink[item.link] = item;
            }
        });
        if (changed) {
            update(appElement, app);
            persistData();
        }
    }

    function isPhotoSaved(photo) {
        return Boolean(DATA_STORE.savedByLink[photo.link]);
    }

    function savePhoto(photo) {
        if (isPhotoSaved(photo))
            return;

        DATA_STORE.saved = DATA_STORE.saved.concat(photo);
        DATA_STORE.savedByLink[photo.link] = photo;
        update(appElement, app);
        persistData();
    }

    function unsavePhoto(photo) {
        if (!isPhotoSaved(photo))
            return;

        delete DATA_STORE.savedByLink[photo.link];
        DATA_STORE.saved = DATA_STORE.saved.reduce((prev, curr) => {
            if (curr.link !== photo.link)
                prev.push(curr)
            return prev;
        }, []);
        update(appElement, app);
        persistData();
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
                el('article', { 'class': 'photo' },
                    el('img', { src: this.photo.media.m }),
                    el('h2', {}, this.photo.author),
                    el('button', { onClick: this.toggleSave.bind(this) }, this.isSaved() ? 'unsave' : 'save')
                )
            )
        }
    }

    class NavTab {
        constructor(routeName) {
            this.routeName = routeName;
        }

        onClick(evt) {
            evt.preventDefault();
            updateRoute(this.routeName);
        }

        render() {
            let isActive = getCurrentRoute() === this.routeName;
            return el('a', {
                href: this.routeName,
                'class': 'navitem' + (isActive ? ' active' : ''),
                onClick: this.onClick.bind(this),
            }, this.routeName);
        }
    }

    class App {

        renderSaved() {
            return el('section', { 'class': 'photos' },
                getSavedPhotos().map((attrs) => new Photo(attrs))
            )
        }

        renderPhotos() {
            return el('section', { 'class': 'photos' },
                getPhotos().map((attrs) => new Photo(attrs))
            );
        }

        render() {
            return (
                el('article', { 'class': 'main' },
                    getCurrentRoute() === 'feed' ?
                    this.renderPhotos() :
                    this.renderSaved(),
                    el('nav', { 'class': 'navbar' },
                        new NavTab('feed'),
                        new NavTab('saved')
                    )
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
