(function () {
    'use strict';


    var data = {
        photos: [],
        photosByUrl: {}
    };

    function getPhotos () {
        let script = document.createElement('script');
        script.async = true;
        script.src = 'http://api.flickr.com/services/feeds/photos_public.gne?format=json';
        window.jsonFlickrFeed = (results) => {
            console.log(results);
            document.body.removeChild(script);
            window.jsonFlickrFeed = null;
        }
        document.body.appendChild(script);
    }

    function getHtml (elementTree) {
        console.log(elementTree);
        return '<h1>Hi!</h1>';
    }

    function el (name, attrs) {
        let children = Array.prototype.slice(arguments, 2);
        console.log('children', children);
        return {
            name: name,
            attrs: attrs,
            children: children
        }
    }


    class Photo {

        constructor(data) {
            this.data = data;
        }

        render() {
            return (
                el('div', {'class': 'photo'},
                    el('img', {src: this.data.url})
                )
            )
        }
    }

    class App {

        constructor(rootEl) {
            this.rootEl = rootEl;
        }

        init() {
            this.rootEl.innerHtml = getHtml(this.render());
        }

        render() {
            return (
                el('div', {'class': 'photos'},
                    data.photos.map((attrs) => Photo(attrs))
                )
            )
        }
    }


    window.app = new App({el: document.getElementById('main')});
    window.app.init();

    getPhotos();

})();
