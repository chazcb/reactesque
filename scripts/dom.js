define('scripts/dom', function (require, window) {
    'use strict';

    function cleanTree(node) {
        if (node.render)
            node = node.render();

        if (node.children) {
            node.children = node.children.reduce((prev, curr) =>  prev.concat(curr), [])
            node.children = node.children.map(cleanTree);
        }
        return node;
    }

    function setAttrs(element, attrs) {
        return Object.keys(attrs).reduce((el, key) => {
            if (key.indexOf('on') === 0) {
                let eventName = key.replace('on', '').toLowerCase();
                element.addEventListener(eventName, attrs[key]);
            } else
                el.setAttribute(key, attrs[key]);
            return el;
        }, element);
    }

    function drawNodes(parent, node) {
        let element;
        if (typeof node === 'string') {
            element = window.document.createTextNode(node);
        } else {
            element = setAttrs(window.document.createElement(node.name), node.attrs);
        }

        if (node.children) {
            element = node.children.reduce(drawNodes, element);
        }

        parent.appendChild(element);
        return parent;
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
        }
    }

    Component.propTypes = {};

    class DOM {
        constructor(element) {
            this.el = element;
        }

        update(elementTree) {
            let newTree = [elementTree].map(cleanTree);
            let newElements = newTree.reduce(drawNodes, window.document.createDocumentFragment());
            this.el.innerHTML = ''; // TODO: don't do this, do something else
            this.el.appendChild(newElements);
        }
    }

    return {
        Component,
        el,
        DOM,
    };
});
