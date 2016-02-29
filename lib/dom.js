define('lib/dom', function (require, window) {
    'use strict';

    const flatten = require('lib/utils').flatten;

    // Set attributes or event handlers on a given element.
    // Does nothing to remove attributes.
    function setAttrs(element, attrs) {
        if (!(element.attributes && attrs))
            return element;

        return Object.keys(attrs).reduce((el, key) => {
            if (key.indexOf('on') === 0)
                el.addEventListener(key.replace('on', '').toLowerCase(), attrs[key]);
            else
                el.setAttribute(key, attrs[key]);
            return el;
        }, element);
    }

    const SVG_TYPES = { svg: 1, defs: 1, path: 1, g: 1 };

    // Given a node returns a valid DOM element.
    function buildElement(node) {
        if (typeof node === 'string')
            return window.document.createTextNode(node)

        let element = SVG_TYPES[node.name] ?
            window.document.createElementNS('http://www.w3.org/2000/svg', node.name) :
            window.document.createElement(node.name);

        return setAttrs(element, node.attrs);
    }

    // Given a node tree, draw the node and children as DOM elements.
    function drawNewTree(start) {
        function _draw(parent, node) {

            let element = buildElement(node);
            if (node.children)
                element = node.children.reduce(_draw, element);

            // base case, if we start with just the node and no parent
            if (!parent)
                return element;

            parent.appendChild(element);
            return parent;
        }

        return _draw(null, start);
    }

    // Flattens node lists and renders any components.
    function prepareTree(node) {
        if (typeof node === 'string')
            return node;

        if (node instanceof Component)
            node = prepareTree(node.render());

        if (node.children)
            node.children = flatten(node.children).map(prepareTree);

        return node;
    }

    function el(name, attrs) {
        let children = Array.prototype.slice.call(arguments, 2);
        return {
            name,
            attrs,
            children,
        }
    }

    class Component {
        constructor(props) {
            let propTypes = this.constructor.propTypes;
            Object.keys(propTypes).forEach((key) => {
                if (typeof props[key] !== propTypes[key])
                    window.console.warn(`Expected ${key} to be of type "${propTypes[key]}" but was ${typeof props[key]} instead.`);
            });
            this.props = props;
            this.children = Array.prototype.slice.call(arguments, 1);
        }
    }

    Component.propTypes = {};

    class DOM {
        constructor(element) {
            this.el = element;
        }

        update(elementTree) {
            elementTree = prepareTree(elementTree);
            function render() {
                this.el.innerHTML = '';
                this.el.appendChild(drawNewTree(elementTree));
            }
            window.requestAnimationFrame(render.bind(this));
        }
    }

    return {
        Component,
        el,
        DOM,
    };
});
