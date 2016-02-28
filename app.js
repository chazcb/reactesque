define('app', function (require, window) {
    'use strict';

    let el = require('scripts/dom').el;
    let DOM = require('scripts/dom').DOM;
    let jsonp = require('scripts/utils').jsonp;

    let Photo = require('scripts/components').Photo;
    let NavTab = require('scripts/components').NavTab;

    let PhotoAppStorage = require('scripts/data').PhotoAppStorage;

    const dom = new DOM(window.document.getElementById('main'));
    const store = new PhotoAppStorage('__virta__');

    function fetchPhotos(callback) {
        jsonp(
            'http://api.flickr.com/services/feeds/photos_public.gne?format=json',
            'jsonFlickrFeed',
            (response) => callback(response.items)
        );
    }

    class Container {
        savePhoto(photo) {
            store.savePhoto(photo);
        }

        unsavePhoto(photo) {
            store.unsavePhoto(photo);
        }

        updateRoute(routeName) {
            store.updateRoute(routeName);
        }

        renderPhoto(attrs) {
            return new Photo({
                unsavePhoto: this.unsavePhoto.bind(this, attrs),
                savePhoto: this.savePhoto.bind(this, attrs),
                isSaved: store.isPhotoSaved(attrs),
                photo: attrs
            });
        }

        renderNavTab(title, routeName) {
            return new NavTab({
                title: title,
                href: routeName,
                isActive: store.getCurrentRoute() === routeName,
                onClick: this.updateRoute.bind(this, routeName),
            })
        }

        renderSavedView() {
            return el('section', { 'class': 'saved-photos photos' },
                store.getSavedPhotos().map(this.renderPhoto.bind(this))
            )
        }

        refreshPhotos() {
            fetchPhotos(store.refreshPhotoFeed.bind(store));
        }

        loadMorePhotos() {
            fetchPhotos(store.updatePhotoFeed.bind(store));
        }

        renderFeedView() {
            return el('section', { 'class': 'photos' },
                el('button', { onClick: this.refreshPhotos.bind(this) }, 'Refresh'),
                store.getPhotos().map(this.renderPhoto.bind(this)),
                el('button', { onClick: this.loadMorePhotos.bind(this) }, 'Load more')
            );
        }

        render() {
            return (
                el('article', { 'class': 'main' },
                    store.getCurrentRoute() === 'feed' ?
                    this.renderFeedView() :
                    this.renderSavedView(),
                    el('nav', { 'class': 'navbar' },
                        this.renderNavTab('Photo Feed', 'feed'),
                        this.renderNavTab('My Saved Photos', 'saved')
                    )
                )
            )
        }
    }

    // ------------- init -------------
    let app = new Container();
    store.onChange(() => dom.update(app));
    fetchPhotos(store.refreshPhotoFeed.bind(store));
    return app;
});
