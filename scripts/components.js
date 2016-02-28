define('scripts/components', function (require, window) {
    'use strict';

    const el = require('scripts/dom').el;
    const Component = require('scripts/dom').Component;
    const jsonp = require('scripts/utils').jsonp;

    class Photo extends Component {
        toggleSave() {
            if (this.props.isSaved)
                this.props.unsavePhoto();
            else
                this.props.savePhoto();
        }

        render() {
            return (
                el('article', { 'class': 'photo' },
                    el('a', { href: this.props.photo.link },
                        el('img', {
                            src: this.props.photo.media.m,
                            alt: this.props.photo.title
                        })
                    ),
                    el('h1', {}, this.props.photo.author),
                    el('button', { onClick: this.toggleSave.bind(this) }, this.props.isSaved ? 'unsave' : 'save')
                )
            )
        }
    }

    Photo.propTypes = {
        isSaved: 'boolean',
        photo: 'object',
        savePhoto: 'function',
        unsavePhoto: 'function',
    }

    class NavTab extends Component {
        onClick(evt) {
            evt.preventDefault();
            this.props.onClick();
        }

        render() {
            return el('a', {
                href: this.props.href,
                'class': 'navitem' + (this.props.isActive ? ' active' : ''),
                onClick: this.onClick.bind(this),
            }, this.props.title);
        }
    }

    NavTab.propTypes = {
        isActive: 'boolean',
        onClick: 'function',
        href: 'string',
        title: 'string',
    }


    class Container extends Component {
        savePhoto(photo) {
            this.props.store.savePhoto(photo);
        }

        unsavePhoto(photo) {
            this.props.store.unsavePhoto(photo);
        }

        updateRoute(routeName) {
            this.props.store.updateRoute(routeName);
        }

        renderPhoto(attrs) {
            return new Photo({
                unsavePhoto: this.unsavePhoto.bind(this, attrs),
                savePhoto: this.savePhoto.bind(this, attrs),
                isSaved: this.props.store.isPhotoSaved(attrs),
                photo: attrs
            });
        }

        renderNavTab(title, routeName) {
            return new NavTab({
                title: title,
                href: routeName,
                isActive: this.props.store.getCurrentRoute() === routeName,
                onClick: this.updateRoute.bind(this, routeName),
            })
        }

        renderSavedView() {
            return el('section', { 'class': 'saved photos' },
                this.props.store.getSavedPhotos().map(this.renderPhoto.bind(this))
            )
        }

        _fetchPhotos(callback) {
            if (this._fetchInProgress) return;
            window.console.info('Getting more photos.');
            this._fetchInProgress = true;
            jsonp(
                'http://api.flickr.com/services/feeds/photos_public.gne?format=json',
                'jsonFlickrFeed',
                (response, error) => {
                    this._fetchInProgress = false;
                    if (error)
                        return void window.console.error('Timeout fetching photos.');
                    callback(response.items);
                }
            );
        }

        refreshPhotos() {
            this._fetchPhotos(this.props.store.refreshPhotoFeed.bind(this.props.store));
        }

        loadMorePhotos() {
            this._fetchPhotos(this.props.store.updatePhotoFeed.bind(this.props.store));
        }

        renderFeedView() {
            return el('section', { 'class': 'feed photos' },
                el('button', { onClick: this.refreshPhotos.bind(this) }, 'Refresh'),
                this.props.store.getPhotos().map(this.renderPhoto.bind(this)),
                el('button', { onClick: this.loadMorePhotos.bind(this) }, 'Load more')
            );
        }

        render() {
            return (
                el('article', { 'class': 'main' },
                    this.props.store.getCurrentRoute() === 'feed' ?
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

    Container.propTypes = {
        store: 'object'
    }

    return {
        Container,
        Photo,
        NavTab,
    }
});
