define('src/components', function (require, window) {
    'use strict';

    const el = require('lib/dom').el;
    const Component = require('lib/dom').Component;
    const jsonp = require('lib/utils').jsonp;
    const Timer = require('lib/utils').Timer;

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


    function daysAgo(time) {
        let msAgo = Date.now() - new Date(time);
        let daysAgo = Math.ceil(msAgo / 1000 / 60 / 60 / 24)

        if (daysAgo === 0)
            return 'today';

        if (daysAgo === 1)
            return 'yesterday';

        return `${daysAgo} days ago`;
    }

    function getTitle(title) {
        title = title.trim();
        return title || 'no title';
    }

    let _authorReg = /\(([^\)]+)\)/;
    function getAuthor(authorText) {
        let match = authorText.match(_authorReg);
        return match ? match[1] : authorText;
    }

    class Photo extends Component {
        toggleSave() {
            if (this.props.isSaved)
                this.props.unsavePhoto();
            else
                this.props.savePhoto();
        }

        render() {
            let dateTaken = this.props.photo.date_taken;
            let title = getTitle(this.props.photo.title);
            return (
                el('article', null,
                    el('div', { 'class': 'topbar' },
                        el('time', { datetime: dateTaken }, daysAgo(dateTaken)),
                        el('a', { href: this.props.photo.link, rel: 'author' }, getAuthor(this.props.photo.author))
                    ),
                    el('div', { 'class': 'photo', onClick: this.toggleSave.bind(this) },
                        new Heart({ isActive: this.props.isSaved }),
                        el('img', {
                            src: this.props.photo.media.m,
                            alt: title
                        })
                    ),
                    el('h1', null, el('a', { href: this.props.photo.link }, title))
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
            }, el('span', null, this.props.title));
        }
    }

    NavTab.propTypes = {
        isActive: 'boolean',
        onClick: 'function',
        href: 'string',
        title: 'string',
    }


    class Button extends Component {
        onClick(evt) {
            evt.preventDefault();
            this.props.onClick();
        }

        render() {
            return el('a', {
                href: '#',
                'class': this.props.class,
                onClick: this.onClick.bind(this)
            }, this.props.text);
        }
    }

    Button.propTypes = {
        'class': 'string',
        onClick: 'function',
        text: 'string',
    }


    class Empty extends Component {
        render() {
            return el('div', {
                'class': 'empty-wrapper',
                style: `height:${this.props.height}px;`
            }, el('div', { 'class': 'empty' }, this.children))
        }
    }

    Empty.propTypes = {
        height: 'number',
    }


    const IDLE_TIMEOUT = 60 * 1000;

    class Container extends Component {

        onDataChange () {
            this.props.dom.update(this);
            this.props.scroller.invalidate();
            if (this.props.store.getCurrentRoute() !== 'feed')
                this.idleTimer.stop();
        }

        onScroll () {
            const currentRoute = this.props.store.getCurrentRoute();

            // If we're not on the 'feed' route then stop the idle timer
            // and don't do anything else.
            if (currentRoute !== 'feed')
                return void this.idleTimer.stop();

            // If we're within half a screen height of the top of the document
            // then we can start the idle timer again.
            if (this.props.scroller.getScrollTop() <= (this.props.scroller.getScreenHeight() / 2))
                this.idleTimer.start();
            else
                this.idleTimer.stop();

            // If we are within one full screen of the bottom of the document
            // then it's time to grab more photos!
            if (this.props.scroller.getScrollBottom() >= (this.props.scroller.getDocumentHeight() - this.props.scroller.getScreenHeight()))
                this.loadMorePhotos();
        }

        init() {
            this.idleTimer = new Timer('idle', this.refreshPhotos.bind(this), IDLE_TIMEOUT);

            this.props.scroller.onScroll(this.onScroll.bind(this));
            this.props.store.onChange(this.onDataChange.bind(this));

            this.idleTimer.start();

            this.props.dom.update(this);
            this.refreshPhotos();

            return this;
        }

        savePhoto(photo) {
            this.props.store.savePhoto(photo);
        }

        unsavePhoto(photo) {
            this.props.store.unsavePhoto(photo);
        }

        updateRoute(routeName) {
            window.location.hash = routeName;
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

        _getAvailableScreenHeight() {
            // substract height of navbar
            return this.props.scroller.getScreenHeight() - 50;
        }

        _fetchPhotos(callback) {
            if (this._fetchInProgress) return;
            window.console.info('Getting more photos');
            this._fetchInProgress = true;
            jsonp(
                'http://api.flickr.com/services/feeds/photos_public.gne?format=json',
                'jsonFlickrFeed',
                (response, error) => {
                    this._fetchInProgress = false;
                    if (error)
                        return void window.console.error('Timeout fetching photos');
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

        renderSavedView() {

            const photos = this.props.store.getSavedPhotos();

            return photos.length ?
                el('div', null, photos.map(this.renderPhoto.bind(this))) :
                new Empty({ height: this._getAvailableScreenHeight() },
                    new Button({
                        onClick: this.updateRoute.bind(this, 'feed'),
                        text: 'save photos with',
                        'class': 'refresh load-more'
                    }),
                    new Heart({ isActive: true })
                )
        }

        renderFeedView() {
            const photos = this.props.store.getPhotos();
            if (photos.length) {
                return el('div', null,
                    new Button({ onClick: this.refreshPhotos.bind(this), text: 'refresh ↺', 'class': 'refresh' }),
                    this.props.store.getPhotos().map(this.renderPhoto.bind(this)),
                    new Button({ onClick: this.loadMorePhotos.bind(this), text: 'load more ↻', 'class': 'refresh load-more' })
                );
            } else {
                return new Empty({ height: this._getAvailableScreenHeight() },
                    new Button({
                        onClick: this.loadMorePhotos.bind(this),
                        text: 'loading ...',
                        'class': 'refresh load-more'
                    })
                )
            }
        }

        render() {
            return (
                el('div', { 'class': 'main' },
                    el('section', { 'class': 'photos' },
                        this.props.store.getCurrentRoute() === 'feed' ?
                        this.renderFeedView() :
                        this.renderSavedView()
                    ),
                    el('nav', { 'class': 'navbar' },
                        this.renderNavTab('photos', 'feed'),
                        this.renderNavTab('my saved', 'saved')
                    )
                )
            )
        }
    }

    Container.propTypes = {
        store: 'object',
        scroller: 'object',
        dom: 'object',
    }

    return {
        Container,
        Photo,
        NavTab,
    }
});
