define('scripts/dom', function (require, window) {
    'use strict';

    let forEach = require('scripts/utils').forEach
    let forRange = require('scripts/utils').forRange;

    const EVENT_REGISTRY = {};

    let nextId = (() => {
        let current = 0;
        return function nextId () {
            return current++;
        }
    })();

    function shouldReplace(current, target) {
        let name = current.nodeName.toLowerCase();

        // If this target is text and current is a textNode
        // whose data does not match, then we need to replace.
        if (name === '#text' && typeof target === 'string')
            return current.data !== target;

        // If the tag types are not the same, then we need to replace.
        if (name !== target.name)
            return true;
    }

    // Given a node tree, draw the node and children as DOM elements.
    function drawNewTree(start) {
        function _draw(parent, node) {
            let element;
            if (typeof node === 'string')
                element = window.document.createTextNode(node);
            else
                element = setAttrs(window.document.createElement(node.name), node.attrs);

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

    // Given an existing top level element and a target node tree,
    // update or replace the existing element and children to match
    // the target tree.
    function updateExistingTree(parentElement, targetNodes) {
        let maxLength = Math.max(targetNodes.length, parentElement.childNodes.length);
        forRange(maxLength, (index) => {

            let existingEl = parentElement.childNodes[index];
            let targetNode = targetNodes[index];

            if (existingEl && targetNode) {

                // replace node with new node
                if (shouldReplace(existingEl, targetNode)) {
                    parentElement.replaceChild(drawNewTree(targetNode), existingEl);

                // update attributes of node and then walk child tree
                } else {
                    setAttrs(existingEl, targetNode.attrs);
                    forEach(Array.prototype.slice.call(existingEl.childNodes, 0), (child) => {
                        updateExistingTree(existingEl, targetNode.children);
                    });
                }

            // remove case
            } else if (existingEl && !targetNode) {
                parentElement.removeChild(existingEl);

            // add case
            } else if (!existingEl && targetNode) {
                parentElement.appendChild(drawNewTree(targetNode));
            }
        });
    }

    function addEventListener(element, eventName, handler) {
        element.dataset.id = element.dataset.id || nextId();
        if (!EVENT_REGISTRY[element.dataset.id])
            EVENT_REGISTRY[element.dataset.id] = {};

        eventName = eventName.replace('on', '').toLowerCase();
        EVENT_REGISTRY[element.dataset.id][eventName] = handler;
        element.addEventListener(eventName, handler);
    }

    function clearEventListeners(element) {
        if (typeof element.dataset.id === 'undefined')
            return;

        let handlers = EVENT_REGISTRY[element.dataset.id];
        if (!handlers)
            return;

        Object.keys(handlers).forEach((key) => {
            element.removeEventListener(key, handlers[key]);
        });

        delete EVENT_REGISTRY[element.dataset.id];
    }

    function setAttrs(element, attrs) {
        if (!element.attributes)
            return element;

        attrs = attrs || {};

        // Clear any existing event handlers.
        // clearEventListeners(element);

        // Attach new attributes and event handlers.
        for (let key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                if (key.indexOf('on') === 0) {
                    addEventListener(element, key, attrs[key]);
                } else {
                    element.setAttribute(key, attrs[key]);
                }
            }
        }

        // Object.keys(attrs).forEach((key) => {
        // });

        // Clear any attributes that are not part of
        // the new set of attributes.
        // Object.keys(element.attributes).forEach((key) => {
        //     if (!attrs[key])
        //         element.removeAttribute(key);
        // });

        return element;
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
            window.console.log('updating ...');
            // This is just a recursive function to
            // call 'render' on any Components and to
            // flatten out any nested subtrees that shouldn't
            // be nested.
            function renderTree(node) {
                if (node.render)
                    node = node.render();

                if (node.children) {
                    node.children = node.children.reduce((prev, curr) =>  prev.concat(curr), [])
                    node.children = node.children.map(renderTree);
                }
                return node;
            }

            let el = this.el;
            let newTree = [elementTree].map(renderTree);

            window.requestAnimationFrame(() => {
                el.innerHTML = '';
                el.appendChild(drawNewTree(newTree[0]));
            });
        }
    }

    return {
        Component,
        el,
        DOM,
    };
});
