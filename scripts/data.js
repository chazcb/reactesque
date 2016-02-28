define('scripts/data', function (require, window) {
    'use strict';

    const STORAGE_KEY = '__virta__';

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
            var previous = {};
            try {
                previous = JSON.parse(window.localStorage[this.storageKey]);
            } catch (e) {};
            return Object.assign(this.initialState(), previous)
        }

        onChange(callback) {
            this._listeners.push(callback);
        }
    }

    class PhotoAppStorage extends Storage {

        initialState() {
            return {
                currentRoute: 'feed',
                saved: [],
                savedByLink: {},
                photos: [],
                photosByLink: {},
            };
        }

        toPersist() {
            return {
                saved: this.STORE.saved,
                savedByLink: this.STORE.savedByLink
            };
        }

        updateRoute(route) {
            if (this.STORE.currentRoute !== route) {
                this.STORE.currentRoute = route;
                this.persist();
            }
        }

        getCurrentRoute() {
            return this.STORE.currentRoute;
        }

        getPhotos() {
            return this.STORE.photos;
        }

        getSavedPhotos() {
            return this.STORE.saved;
        }

        refreshPhotoFeed(items) {
            this.STORE.photos = items;
            items.forEach((item) => {
                this.STORE.photosByLink[item.link] = item;
            });
            this.persist();
        }

        updatePhotoFeed(items) {
            let updated = false;

            items.forEach((item) => {
                if (!this.STORE.savedByLink[item.link]) {
                    this.STORE.photos.push(item);
                    this.STORE.photosByLink[item.link] = item;
                    updated = true;
                }
            });

            if (updated) {
                this.persist();
            }
        }

        isPhotoSaved(photo) {
            return Boolean(this.STORE.savedByLink[photo.link]);
        }

        savePhoto(photo) {
            if (this.isPhotoSaved(photo))
                return;

            this.STORE.saved = this.STORE.saved.concat(photo);
            this.STORE.savedByLink[photo.link] = photo;
            this.persist();
        }

        unsavePhoto(photo) {
            if (!this.isPhotoSaved(photo))
                return;

            delete this.STORE.savedByLink[photo.link];
            this.STORE.saved = this.STORE.saved.reduce((prev, curr) => {
                if (curr.link !== photo.link)
                    prev.push(curr)
                return prev;
            }, []);
            this.persist();
        }
    }

    return {
        PhotoAppStorage
    };
});
