define('scripts/dom', function () {
    'use strict';

    const TEXT_NODE = 'textnode';

    function _cleanTree (node) {
        if (node.render)
            node = node.render();

        if (node.children) {
            node.children = node.children.reduce((prev, curr) =>  prev.concat(curr), [])
            node.children = node.children.map(_cleanTree);
        }
        return node;
    }

    function setAttrs (element, attrs) {
        return Object.keys(attrs).reduce((el, key) => {
            if (key.indexOf('on') === 0) {
                let eventName = key.replace('on', '').toLowerCase();
                element.addEventListener(eventName, attrs[key]);
            } else
                el.setAttribute(key, attrs[key]);
            return el;
        }, element);
    }

    function drawNodes (parent, node) {
        var element;
        if (typeof node === 'string') {
            element = document.createTextNode(node);
        } else {
            element = setAttrs(document.createElement(node.name), node.attrs);
        }

        if (node.children) {
            element = node.children.reduce(drawNodes, element);
        }

        parent.appendChild(element);
        return parent;
    }

    function update (rootId, elementTree) {
        let newTree = [elementTree].map(_cleanTree);
        let newElements = newTree.reduce(drawNodes, document.createDocumentFragment());
        rootId.innerHTML = '';
        rootId.appendChild(newElements);
    }

    function el (name, attrs) {
        let children = Array.prototype.slice.call(arguments, 2);
        return {
            name: name,
            attrs: attrs,
            children: children,
        }
    }

    return {
        el: el,
        update: update,
    };
});
