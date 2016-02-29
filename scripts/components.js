define('scripts/components', function (require, window) {
    'use strict';

    const el = require('scripts/dom').el;
    const Component = require('scripts/dom').Component;
    const jsonp = require('scripts/utils').jsonp;

    class Heart extends Component {
        render() {
            // svg path is CC licenced by Google
            return (
                el('svg', {
                    width: 16,
                    height: 16,
                    viewBox: '0 0 510 510',
                    'class': 'heart'
                },
                    el('g', {},
                        el('path', {
                           d: 'M255,489.6l-35.7-35.7C86.7,336.6,0,257.55,0,160.65C0,81.6,61.2,20.4,140.25,20.4c43.35,0,86.7,20.4,114.75,53.55 C283.05,40.8,326.4,20.4,369.75,20.4C448.8,20.4,510,81.6,510,160.65c0,96.9-86.7,175.95-219.3,293.25L255,489.6z',
                           style: `fill:${this.props.isActive ? 'rgba(236, 6, 6, 0.65)' : 'rgba(216,196,196,0.59)'};`
                        })
                    )
                )
            )
        }
    }

    Heart.propTypes = {
        isActive: 'boolean',
    }


    class Photo extends Component {
        toggleSave() {
            if (this.props.isSaved)
                this.props.unsavePhoto();
            else
                this.props.savePhoto();
        }

        timeAgo() {
            let msAgo = Date.now() - new Date(this.props.photo.date_taken);
            let daysAgo = Math.ceil(msAgo / 1000 / 60 / 60 / 24)

            if (daysAgo === 0)
                return 'today';

            if (daysAgo === 1)
                return 'yesterday';

            return `${daysAgo} days`;
        }

        render() {
            return (
                el('article', { 'class': 'photo-wrapper' },
                    el('h1', { 'class': 'title' },
                        this.props.photo.title,
                        el('small', {}, this.timeAgo())
                    ),
                    el('div', { 'class': 'photo', onClick: this.toggleSave.bind(this) },
                        new Heart({ isActive: this.props.isSaved }),
                        el('img', {
                            src: this.props.photo.media.m,
                            alt: this.props.photo.title
                        })
                    ),
                    el('a', { href: this.props.photo.link, rel: 'author' }, this.props.photo.author)
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
