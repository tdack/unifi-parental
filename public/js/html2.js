/*jslint browser: true, indent: 2 */
/*global jsl, func, main */
/*
*/
var html2;
html2 = html2 || (function () {
    "use strict";
    var lib;
    lib = {};
    function copyDataObj(obj) {
        /*
        */
        var result, name;
        obj = obj || {};
        result = {};
        for (name in obj) {
            if (obj.hasOwnProperty(name)) {
                result[name] = obj[name];
            }
        }
        return result;
    }
    function convertAttrName(name) {
        switch (name) {
            case "className":
                return "class";
            case "htmlFor":
                return "for";
            default:
                return name;
        }
    }
    function isElem(el) {
        return el instanceof window.HTMLElement;
    }
    function isNode(el) {
        return el instanceof window.Node;
    }
    function getHandler(name, value) {
        var event;
        if (typeof value === 'function') {
            name = name.toLowerCase();
            event = name.match(/^(on)(\w+)$/);
            if (event && event.length === 3) {
                return {
                    event: event[2],
                    handler: value
                };
            }
        }
    }
    function setEventHandlers(el, attributes) {
        var evt, name;
        attributes = attributes || {};
        for (name in attributes) {
            if (attributes.hasOwnProperty(name)) {
                evt = getHandler(name, attributes[name]);
                if (evt) {
                    el.addEventListener(evt.event, evt.handler, false);
                }
            }
        }
    }
    /*
    */
    function createAttributes(el, attributes) {
        var name, value;
        attributes = attributes || {};
        for (name in attributes) {
            if (attributes.hasOwnProperty(name)) {
                value = attributes[name];
                if (!getHandler(name, value)) {
                    if (value === true) {
                        value = "";
                    }
                    name = convertAttrName(name);
                    if (value === null || value === false) {
                        el.removeAttribute(name);
                    } else {
                        el.setAttribute(name, value);
                    }
                }
            }
        }
    }
    function addChildren(el, children) {
        children = children || [];
        children.forEach(function (child) {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (isNode(child)) {
                el.appendChild(child);
            }
        });
    }
    function createId(name, value) {
        var id;
        if (name) {
            id = "ui" + name.charAt(0).toUpperCase() + name.slice(1);
            if (value) {
                id = id + ":" + value;
            }
        }
        return id;
    }
    /*
    */
    lib.elem = function (tag, attributes, children) {
        var el;
        if (!tag || typeof tag !== 'string') {
            return null;
        }
        el = document.createElement(tag);
        createAttributes(el, attributes);
        setEventHandlers(el, attributes);
        if (!Array.isArray(children)) {
            children = jsl.toArray(arguments, 2);
        }
        addChildren(el, children);
        return el;
    };
    lib.attr = function (el, attributes) {
        if (isElem(el)) {
            createAttributes(el, attributes);
            setEventHandlers(el, attributes);
            return true;
        }
        return false;
    };
    lib.add = function (el, children) {
        if (isNode(el)) {
            if (!Array.isArray(children)) {
                children = jsl.toArray(arguments, 1);
            }
            addChildren(el, children);
            return true;
        }
        return false;
    };
    lib.fragment = function (children) {
        var el;
        el = document.createDocumentFragment();
        if (!Array.isArray(children)) {
            children = jsl.toArray(arguments);
        }
        addChildren(el, children);
        return el;
    };
    /*
    */
    [
        "div", "p", "br", "hr", "span", "a",
        "h1", "h2", "h3", "h4", "h5", "h6"
    ].forEach(function (tag) {
        lib[tag] = func.partial(lib.elem, tag);
    });
    /*
    */
    lib.hiddenInput = function (data) {
        var input;
        if (!data.name || data.value === undefined) {
            return;
        }
        input = lib.elem("input", { type: "hidden" });
        lib.attr(input, data);
        return input;
    };
    /*
    };
    ZUTUN: weiter Ausbauen für alle Arten von Inputs, Selects etc.
    - ist es eine gute Idee, hier ein div class="formular" zu erzeugen?
    */
    lib.textInput = function (data) {
        var attr, input, label, prefix, suffix, explain;
        attr = copyDataObj(data);
        if (!attr.name || attr.value === undefined) {
            return;
        }
        attr.type = "text";
        if (attr.text) {
            attr.id = attr.id || createId(attr.name);
            label = lib.elem("label", { for: attr.id }, attr.text);
            delete attr.text;
        }
        if (attr.prefix) {
            prefix = lib.elem("span", { class: "prefix" }, attr.prefix);
            delete attr.prefix;
        }
        if (attr.suffix) {
            suffix = lib.elem("span", { class: "postfix" }, attr.suffix);
            delete attr.suffix;
        }
        if (attr.explain) {
            explain = lib.elem("p", { class: "form_input_note" }, attr.explain);
            delete attr.explain;
        }
        input = lib.elem("input", attr);
        return lib.elem("div", { class: "formular" },
            label, prefix, input, suffix, explain
        );
    };
    lib.sortSpan = function (className, id) {
        var span;
        className = className || "sort_no";
        span = lib.elem("div", { id: id, class: className }, "");
        span.innerHTML = "&nbsp;";
        return span;
    }
    /*
    */
    lib.printViewButtons = function (parent) {
        lib.add(parent, lib.elem("button", { id: "uiDoPrintBtn", type: "button", class: "print", onClick: function () { window.print(); } }, "Print Page"));
        lib.add(parent, lib.elem("button", { id: "uiClosePrintView", type: "button", class: "print", onClick: main.closePrintView }, "Close Print Preview"));
    };
    return lib;
}());
