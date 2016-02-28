define('scripts/components', function (require, window) {
    'use strict';

    class Component {
        constructor(props) {
            let propTypes = this.constructor.propTypes;
            Object.keys(propTypes).forEach((key) => {
                if (typeof props[key] !== propTypes[key])
                    window.console.warn(`Expected ${key} to be of type "${propTypes[key]}" but was ${typeof props[key]} instead.`);
            });
            this.props = props;
        }
    }

    let el = require('scripts/dom').el;

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
                    el('img', { src: this.props.photo.media.m }),
                    el('h2', {}, this.props.photo.author),
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

    return {
        Photo,
        NavTab,
    }
});
