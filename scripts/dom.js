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

    function drawAttrs (attrs) {
        return Object.keys(attrs).reduce((prev, key) => `${prev} ${key}=\"${attrs[key]}\"`, '')
    }

    function drawNodes (prev, node) {
        if (typeof node === 'string')
            return prev + node;

        let attrs = drawAttrs(node.attrs);
        if (node.children.length > 0) {
            let inner = node.children.reduce(drawNodes, '');
            return `${prev}<${node.name}${attrs}>${inner}</${node.name}>`
        }

        return `${prev}<${node.name}${attrs}/>`
    }

    function update (rootId, elementTree) {
        let newTree = [elementTree].map(_cleanTree);
        let newHtml = newTree.reduce(drawNodes, '');
        rootId.innerHTML = newHtml;
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
