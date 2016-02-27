/* eslint-env es6 */
(function () {
    'use strict';
    // ------ utils
    let jsonp = (function () {
        const body = document.body;
        function _jsonp (url, callbackName, onResponse) {
            let script = document.createElement('script');
            script.async = true;
            script.src = 'http://api.flickr.com/services/feeds/photos_public.gne?format=json';
            window[callbackName] = (results) => {
                onResponse(results);
                body.removeChild(script);
                window[callbackName] = null;
            }
            body.appendChild(script);
        };
        return _jsonp;
    })();

    // ------- virtualdom

    function getHtml (elementTree) {
        function _cleanTree (node) {
            if (node.render)
                node = node.render();
            node.children = node.children.reduce((prev, curr) =>  prev.concat(curr), [])
            node.children = node.children.map(_cleanTree);
            return node;
        }

        function _drawAttrs (attrs) {
            return Object.keys(attrs).reduce((prev, key) => `${prev} ${key}=\"${attrs[key]}\"`, '')
        }

        function _drawHtml (prev, curr) {
            let attrs = _drawAttrs(curr.attrs);
            if (curr.children.length > 0) {
                let inner = curr.children.reduce(_drawHtml, '');
                return `${prev}<${curr.name}${attrs}>${inner}</${curr.name}>`
            }
            return `${prev}<${curr.name}${attrs}/>`
        }

        return [elementTree].map(_cleanTree).reduce(_drawHtml, '');
    }

    function el (name, attrs) {
        let children = Array.prototype.slice.call(arguments, 2);
        return {
            name: name,
            attrs: attrs,
            children: children,
        }
    }

    // --------- application

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

        updateVirtualDom() {
            this.rootEl.innerHTML = getHtml(this);
        }

        render() {
            return (
                el('div', {'class': 'photos'},
                    DATA_STORE.photos.map((attrs) => new Photo(attrs))
                )
            )
        }
    }

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
            window.app.updateVirtualDom();
    }

    jsonp(
        'http://api.flickr.com/services/feeds/photos_public.gne?format=json',
        'jsonFlickrFeed',
        processFeed
    );

    window.app = new App(document.getElementById('main'));
    window.app.updateVirtualDom();
})();
