define('app', function (require) {
    'use strict';

    let el = require('scripts/dom').el;
    let update = require('scripts/dom').update;
    let jsonp = require('scripts/utils').jsonp;

    // -------- data ---------

    const STORAGE_KEY = '__virta__';

    function persistData() {
        // Only save saved photos
        localStorage[STORAGE_KEY] = JSON.stringify({
            saved: DATA_STORE.saved,
            savedByLink: DATA_STORE.savedByLink
        });
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


    function fetchPhotos(callback) {
        jsonp(
            'http://api.flickr.com/services/feeds/photos_public.gne?format=json',
            'jsonFlickrFeed',
            (response) => callback(response.items)
        );
    }

    function refreshPhotoFeed(items) {
        DATA_STORE.photos = items;
        items.forEach((item) => {
            DATA_STORE.photosByLink[item.link] = item;
        });
        update(appElement, app);
        persistData();
    }

    function updatePhotoFeed(items) {
        let updated = false;

        items.forEach((item) => {
            if (!DATA_STORE.savedByLink[item.link]) {
                DATA_STORE.photos.push(item);
                DATA_STORE.photosByLink[item.link] = item;
                updated = true;
            }
        });

        if (updated) {
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

        refresh() {
            fetchPhotos(refreshPhotoFeed);
        }

        loadMore() {
            fetchPhotos(updatePhotoFeed);
        }

        renderPhotos() {
            return el('section', { 'class': 'photos' },
                el('button', { onClick: this.refresh.bind(this) }, 'Refresh'),
                getPhotos().map((attrs) => new Photo(attrs)),
                el('button', { onClick: this.loadMore.bind(this) }, 'Load more')
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

    fetchPhotos(refreshPhotoFeed);
    update(appElement, app);

    return app;
});
