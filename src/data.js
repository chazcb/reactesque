define('src/data', function (require, window) {
    'use strict';

    const Storage = require('lib/data').Storage;

    class PhotoAppStorage extends Storage {

        initialState() {
            return {
                currentRoute: window.location.hash ? window.location.hash.slice(1) : 'feed',
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
            this.STORE.photosByLink = {};
            items.forEach((item) => {
                this.STORE.photosByLink[item.link] = item;
            });
            this.persist();
        }

        updatePhotoFeed(items) {
            let updated = false;

            items.forEach((item) => {
                if (!this.STORE.photosByLink[item.link]) {
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

            this.STORE.saved = [photo].concat(this.STORE.saved);
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
        PhotoAppStorage,
    };
});
