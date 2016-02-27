define('scripts/dom', function () {
    'use strict';

    function update (rootId, elementTree) {
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

        rootId.innerHTML = [elementTree].map(_cleanTree).reduce(_drawHtml, '');
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
