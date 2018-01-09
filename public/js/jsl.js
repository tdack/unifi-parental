/*jslint browser: true, indent: 2 */
/*global func */
/*
*/
var jsl;
jsl = jsl || (function () {
    "use strict";
    var lib, entityMap;
    lib = {};
    lib.get = function (idOrElement) {
        if (idOrElement && 'string' === typeof idOrElement) {
            return document.getElementById(idOrElement);
        }
        return idOrElement;
    };
    /*
    */
    lib.find = function (selector, parentIdOrElement) {
        var parent, result;
        parent = lib.get(parentIdOrElement) || document;
        if (parent && parent.querySelectorAll) {
            try {
                result = parent.querySelectorAll(selector);
            } catch (err) {
                lib.log(err.name, "\"", selector, "\"");
                result = [];
            }
        }
        return lib.toArray(result || []);
    };
    /*
    */
    lib.findFirst = function (selector, parentIdOrElement) {
        var parent, result;
        parent = lib.get(parentIdOrElement) || document;
        if (parent && parent.querySelector) {
            try {
                result = parent.querySelector(selector);
            } catch (err) {
                lib.log(err.name, "\"", selector, "\"");
                result = null;
            }
        }
        return result || null;
    };
    /*
    */
    lib.matches = function (elem, selector) {
        var parent;
        elem = lib.get(elem);
        if (elem && elem.ownerDocument) {
            parent = elem.parentNode;
            if (!parent) {
                parent = document.createDocumentFragment();
                parent.appendChild(elem.cloneNode());
            }
            return lib.find(selector, parent).some(func.eq(elem));
        }
        return false;
    };
    /*
    */
    lib.findParent = function (idOrElement, selector) {
        var elem;
        elem = lib.get(idOrElement);
        do {
            if (lib.matches(elem, selector)) {
                return elem;
            }
            elem = elem.parentNode;
        } while (elem);
        return null;
    };
    /*
    */
    lib.getHead = function () {
        if (document.head) {
            return document.head;
        }
        var head = document.getElementsByTagName("head");
        if (head && head.length) {
            return head[0];
        }
    };
    /*
    */
    lib.walkDom = function (idOrElement, tag, callback) {
        var elem = lib.get(idOrElement),
            result = [],
            noFunc = null,
            args = [],
            i = 0,
            nodes = null;
        if (elem) {
            tag = tag || "*";
            noFunc = typeof callback !== 'function';
            args = [""];
            if (!noFunc) {
                for (i = 3; i < arguments.length; i += 1) {
                    args.push(arguments[i]);
                }
            }
            nodes = elem.getElementsByTagName(tag);
            for (i = 0; i < nodes.length; i += 1) {
                args[0] = nodes[i];
                if (noFunc || callback.apply(null, args)) {
                    result.push(nodes[i]);
                }
            }
        }
        return result;
    };
    /*
    */
    function splitClasses(str) {
        str = (str || "").trim();
        return str.split(/\s+/g);
    }
    lib.hasClass = function (idOrElement, strClass) {
        var elem;
        elem = lib.get(idOrElement);
        if (elem && elem.classList) {
            return elem.classList.contains(strClass);
        }
        return false;
    };
    lib.addClass = function (idOrElement, strClasses) {
        var elem;
        elem = lib.get(idOrElement);
        if (elem && elem.classList) {
            splitClasses(strClasses).forEach(function (c) {
                elem.classList.add(c);
            });
        }
    };
    lib.removeClass = function (idOrElement, strClasses) {
        var elem;
        elem = lib.get(idOrElement);
        if (elem && elem.classList) {
            splitClasses(strClasses).forEach(function (c) {
                elem.classList.remove(c);
            });
        }
    };
    lib.toggleClass = function (idOrElement, strClass) {
        var elem;
        elem = lib.get(idOrElement);
        if (elem && elem.classList) {
            elem.classList.toggle(strClass);
        }
    };
    lib.removeClassRegExp = function (idOrElement, reClass) {
        var elem, i, c;
        if (reClass instanceof RegExp) {
            elem = lib.get(idOrElement);
            if (elem && elem.classList) {
                i = elem.classList.length || 0;
                while (i > 0) {
                    i = i - 1;
                    c = elem.classList[i];
                    if (reClass.test(c)) {
                        elem.classList.remove(c);
                    }
                }
            }
        }
    };
    lib.clearClass = function (idOrElement) {
        lib.overwriteClass(idOrElement);
    };
    lib.overwriteClass = function (idOrElement, strClasses) {
        var elem;
        elem = lib.get(idOrElement);
        if (elem) {
            elem.className = strClasses || "";
        }
    };
    lib.replaceClass = function (idOrElement, strOldClasses, strNewClasses) {
        lib.removeClass(idOrElement, strOldClasses);
        lib.addClass(idOrElement, strNewClasses);
    };
    /*
    */
    lib.getByClass = function (strClass, parentIdOrElement, tag) {
        return lib.walkDom(
            parentIdOrElement || document,
            tag || "",
            function (el) {
                return lib.hasClass(el, strClass);
            }
        );
    };
    /*
    */
    function cssStrToCamelCase(str) {
        str = (str || "").split('-');
        return str.slice(1).reduce(function (prev, curr) {
            return prev + curr.charAt(0).toUpperCase() + curr.slice(1);
        }, str[0]);
    }
    /*
    */
    lib.setStyle = function (idOrElement, cssName, cssValue) {
        var elem = lib.get(idOrElement);
        if (elem) {
            if (cssName === 'float') {
                cssName = 'cssFloat';
            }
            elem.style[cssStrToCamelCase(cssName)] = cssValue;
        }
    };
    /*
    */
    lib.display = function (idOrElement, show) {
        lib.setStyle(idOrElement, "display", show ? "" : "none");
    };
    lib.hide = function (idOrElement) {
        lib.display(idOrElement, false);
    };
    lib.show = function (idOrElement) {
        lib.display(idOrElement, true);
    };
    lib.loadCss = function (cssPath) {
        var head = lib.getHead(),
            link = null;
        if (head && "string" === typeof cssPath) {
            link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = cssPath;
            head.appendChild(link);
        }
    };
    lib.createStyleTag = function (styles) {
        var head = lib.getHead(),
            styleTag = null;
        if (head && "string" === typeof styles) {
            styleTag = document.createElement("style");
            styleTag.type = "text/css";
            styleTag.innerHTML = styles;
            head.appendChild(styleTag);
        }
    };
    /*
    */
    lib.addEventHandler = function (idOrElement, eventName, handlerFunction) {
        var elem = lib.get(idOrElement);
        if (elem) {
            elem.addEventListener(eventName, handlerFunction, false);
            return true;
        }
        return false;
    };
    lib.removeEventHandler = function (idOrElement, eventName, handlerFunction) {
        var elem = lib.get(idOrElement);
        if (elem) {
            elem.removeEventListener(eventName, handlerFunction, false);
        }
    };
    /*
    */
    lib.evtTarget = function (evt, expectedType) {
        var result = evt.target || evt.srcElement;
        if (expectedType) {
            /*
            */
            while (result && result.type !== expectedType) {
                result = result.parentNode;
            }
        } else {
            /*
            */
            if (result && result.nodeType === 3) {
                result = result.parentNode;
            }
        }
        return result;
    };
    /*
    */
    lib.eventTarget = function (evt, selector) {
        var result = evt.target;
        if (result && selector) {
            result = lib.findParent(result, selector);
        }
        return result;
    };
    lib.stopBubbling = function (evt) {
        if (evt) {
            if (evt.stopPropagation) {
                evt.stopPropagation();
            }
            evt.cancelBubble = true;
        }
    };
    lib.cancelEvent = function (evt) {
        if (evt) {
            if (evt.preventDefault) {
                evt.preventDefault();
            }
            evt.cancel = true;
            evt.returnValue = false;
        }
        return false;
    };
    /*
    */
    lib.setDisabled = function (idOrElement, disable) {
        var elem = lib.get(idOrElement),
            p = null,
            labels = null,
            i = 0;
        if (elem) {
            elem.disabled = disable;
            /*
            */
            p = elem.parentNode;
            if (p) {
                p = p.parentNode;
            }
            p = p || document;
            if (p) {
                labels = p.getElementsByTagName('label');
                for (i = 0; i < labels.length; i += 1) {
                    if (labels[i].htmlFor === elem.id) {
                        if (disable) {
                            lib.addClass(labels[i], "disabled");
                        } else {
                            lib.removeClass(labels[i], "disabled");
                        }
                        break;
                    }
                }
            }
        }
    };
    function disableNodeSpecials(node, disableNode) {
        if (node) {
            switch ((node.nodeName || "").toLowerCase()) {
                case "a":
                    /*
                    */
                    node.onclick = disableNode ? function () { return false; } : null;
                    break;
                case "button":
                case "input":
                case "select":
                    node.disabled = disableNode;
                    break;
                default:
                    break;
            }
        }
    }
    /*
    */
    lib.disableNode = function (idOrNode, disableNode, fogOnly) {
        var setNodeOpacity = disableNode ? lib.addClass : lib.removeClass;
        setNodeOpacity(idOrNode, "disableNode");
        if (fogOnly) {
            return;
        }
        lib.walkDom(idOrNode, "*", disableNodeSpecials, disableNode);
        /*
        */
        disableNodeSpecials(lib.get(idOrNode), disableNode);
    };
    lib.enableNode = function (idOrNode, disableNode, fogOnly) {
        lib.disableNode(idOrNode, !disableNode, fogOnly);
    };
    lib.disable = function (idOrElement) {
        lib.setDisabled(idOrElement, true);
    };
    lib.enable = function (idOrElement) {
        lib.setDisabled(idOrElement, false);
    };
    lib.getEnabled = function (idOrElement) {
        var elem = lib.get(idOrElement);
        if (elem) {
            return !elem.disabled;
        }
        return false;
    };
    lib.enableWithFocus = function (idOrElement) {
        var elem = lib.get(idOrElement);
        if (elem) {
            lib.enable(elem);
            lib.focus(elem);
        }
    };
    /*
    */
    lib.addOption = function (idOrElement, value, text) {
        var elem = lib.get(idOrElement);
        if (elem && elem.options) {
            elem.options[elem.length || 0] = new Option(text, value);
        }
    };
    //?????
    lib.getOptionTextOf = function (idOrElement, idx) {
        var elem = lib.get(idOrElement);
        if (elem && elem.options) {
            return elem.options[idx].text;
        }
        return null;
    };
    //?????
    lib.lenSelection = function (idOrElement) {
        var elem = lib.get(idOrElement);
        if (elem && elem.options) {
            return elem.length;
        }
        return 0;
    };
    function findOptionIdx(elem, value) {
        var i = elem.options.length || 0;
        while (i > 0) {
            i = i - 1;
            if (elem.options[i].value === value) {
                return i;
            }
        }
        return -1;
    }
    /*
    */
    lib.updateOptions = function (idOrElement, value, text) {
        var elem = lib.get(idOrElement),
            idx = null;
        if (elem && elem.options) {
            idx = findOptionIdx(elem, value);
            if (idx < 0) {
                idx = elem.options.length || 0;
                elem.options[idx] = new Option(text, value);
            } else {
                elem.options[idx].text = text;
            }
        }
    };
    lib.deleteOption = function (idOrElement, value) {
        var elem = lib.get(idOrElement),
            idx = null;
        if (elem && elem.options) {
            idx = findOptionIdx(elem, value);
            if (idx >= 0) {
                elem.options[idx] = null;
                if (value === elem.value) {
                    elem.selectedIndex = 0;
                }
            }
        }
    };
    //?????
    lib.clearSelection = function (idOrElement) {
        var elem = lib.get(idOrElement),
            disabled = null;
        if (elem) {
            disabled = elem.disabled;
            elem.disabled = false;
            elem.length = 0;
            elem.disabled = disabled;
        }
    };
    /*
    */
    lib.submitForm = function (name) {
        var frm = document.forms[name];
        if (frm) {
            frm.submit();
        }
    };
    /*
    */
    lib.getFormElements = function (elementName, formNameOrIdx) {
        var result = [],
            f = null,
            elems = null;
        if (elementName) {
            f = document.forms[formNameOrIdx || 0];
            if (f && f.elements) {
                elems = f.elements[elementName];
                if (elems) {
                    result = [elems];
                    if (typeof elems.length === 'number') {
                        if (!elems.options || elems[0] !== elems.options[0]) {
                            result = elems;
                        }
                    }
                }
            }
        }
        return result;
    };
    lib.getForm = function (idOrElement) {
        var elem = lib.get(idOrElement);
        if (elem) {
            if (elem.form) {
                return lib.get(elem.form);
            }
            return lib.findParent(elem, "form");
        }
        return null;
    };
    /*
    */
    lib.getByName = function (name, parentIdOrElement) {
        var elem = document;
        if (parentIdOrElement) {
            elem = lib.get(parentIdOrElement);
        }
        if (elem && typeof name === 'string') {
            return elem.getElementsByName(name);
        }
        return null;
    };
    //?????
    lib.getHtml = function (idOrElement) {
        var elem = lib.get(idOrElement);
        if (elem) {
            return elem.innerHTML;
        }
        return "";
    };
    lib.setHtml = function (idOrElement, txt) {
        var elem = lib.get(idOrElement);
        if (elem) {
            elem.innerHTML = txt;
        }
    };
    lib.changeImage = function (imageName, newSource, newTitle) {
        var image = document.images[imageName] || lib.get(imageName);
        if (image) {
            if (newSource !== undefined) {
                image.src = newSource;
            }
            if (newTitle !== undefined) {
                image.title = newTitle;
            }
        }
    };
    lib.setText = function (idOrElement, txt) {
        var elem = lib.get(idOrElement);
        if (elem) {
            if (elem.hasChildNodes()) {
                elem.innerHTML = "";
            }
            elem.appendChild(document.createTextNode(txt));
        }
    };
    //?????
    lib.getText = function (idOrElement) {
        var elem = lib.get(idOrElement);
        if (elem) {
            if (elem.textContent) {
                return elem.textContent;
            } else {
                return elem.innerHTML;
            }
        }
        return "";
    };
    lib.focus = function (idOrElement) {
        var elem = lib.get(idOrElement);
        if (elem && elem.focus) {
            elem.focus();
        }
    };
    lib.select = function (idOrElement) {
        var elem = lib.get(idOrElement);
        if (elem && elem.select) {
            elem.select();
        }
    };
    lib.getChecked = function (idOrElement) {
        var elem = lib.get(idOrElement);
        if (elem) {
            return elem.checked;
        }
        return false;
    };
    lib.setChecked = function (idOrElement, value) {
        var elem = lib.get(idOrElement);
        if (elem) {
            elem.checked = (value !== false);
        }
    };
    lib.getValue = function (idOrElement) {
        var elem = lib.get(idOrElement);
        if (elem) {
            return elem.value;
        }
        return "";
    };
    lib.getSelectValue = lib.getValue;
    lib.getEvtValue = function (evt) {
        var elem = lib.evtTarget(evt);
        return lib.getValue(elem);
    };
    lib.setValue = function (idOrElement, value) {
        var elem = lib.get(idOrElement);
        if (elem) {
            elem.value = value;
        }
    };
    lib.setSelection = lib.setValue;
    lib.getRadioValue = function (radioName, formNameOrIdx) {
        var radios = lib.getFormElements(radioName, formNameOrIdx),
            i = radios.length || 0;
        while (i > 0) {
            i = i - 1;
            if (radios[i].checked) {
                return radios[i].value;
            }
        }
        return "";
    };
    lib.getCssText = function (idOrElement) {
        var elem = lib.get(idOrElement);
        if (!elem || !elem.style) {
            return "";
        }
        if (typeof elem.style.cssText === 'string') {
            return elem.style.cssText;
        }
        return elem.getAttribute('style');
    };
    lib.setCssText = function (idOrElement, cssText) {
        var elem = lib.get(idOrElement);
        if (!elem || !elem.style) {
            return;
        }
        if (typeof elem.style.cssText === 'string') {
            elem.style.cssText = cssText;
        } else {
            elem.setAttribute('style', cssText);
        }
    };
    lib.changeInputType = function (idOrElement, newType) {
        var elem = lib.get(idOrElement);
        if (elem && typeof newType === 'string') {
            elem.type = newType;
        }
    };
    /*
    */
    lib.moveElement = function (idOrElement, hookIdOrElement) {
        var elem = lib.get(idOrElement),
            hook = lib.get(hookIdOrElement);
        if (elem && hook && hook.parentNode) {
            hook.parentNode.insertBefore(elem, hook);
        }
    };
    lib.findParentByTagName = function (idOrElement, tagName) {
        var elem;
        if (tagName && typeof tagName === 'string') {
            elem = lib.get(idOrElement);
            tagName = tagName.toLowerCase();
            while (elem && elem.parentNode) {
                elem = elem.parentNode;
                if ((elem.tagName || "").toLowerCase() === tagName) {
                    return elem;
                }
            }
        }
        return null;
    };
    /*
    */
    lib.setHiddenValue = function (name, value, formIdOrElement) {
        var form, inp, isNew;
        form = lib.get(formIdOrElement) || document.forms[0];
        if (form) {
            inp = form.elements[name];
            isNew = !inp;
            if (isNew) {
                inp = document.createElement("input");
                inp.type = "hidden";
                inp.name = name;
            }
            inp.value = value;
            if (isNew) {
                form.appendChild(inp);
            }
        }
    };
    /*
    */
    lib.removeElements = function (idsOrElements) {
        var i, elem;
        i = (idsOrElements || []).length || 0;
        while (i > 0) {
            i = i - 1;
            elem = lib.get(idsOrElements[i]);
            if (elem && elem.parentNode) {
                elem.parentNode.removeChild(elem);
            }
        }
    };
    /*
    */
    lib.sprintf = function (formatstr) {
        var i, exp;
        for (i = 1; i < arguments.length; i += 1) {
            /*
            */
            formatstr = formatstr || "";
            exp = new RegExp("(%" + i + ")(%[a-zA-Z]+%)?", "g");
            formatstr = formatstr.replace(exp, "$1");
            exp = new RegExp("%" + i, "g");
            formatstr = formatstr.replace(exp, arguments[i]);
        }
        return formatstr;
    };
    lib.toArray = Function.prototype.call.bind(Array.prototype.slice);
    /*
    */
    lib.getArrayPart = function (luaTable, doDelete) {
        var array, n;
        luaTable = luaTable || {};
        array = [];
        n = 1;
        while (luaTable[n] !== undefined) {
            array.push(luaTable[n]);
            if (doDelete) {
                delete luaTable[n];
            }
            n = n + 1;
        }
        return array;
    };
    entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;'
        /*
        */
    };
    lib.htmlEscape = function (str) {
        return String(str).replace(/[&<>"]/g, function (s) {
            return entityMap[s];
        });
    };
    lib.htmlUnEscape = function (str) {
        var i = 0;
        for (i in entityMap) {
            if (entityMap.hasOwnProperty(i)) {
                str = String(str).replace(new RegExp(entityMap[i], "g"), i);
            }
        }
        str = String(str).replace(new RegExp("&apos;", "g"), "'");
        return str;
    };
    /*
    */
    lib.removeHtml = function (str, rep) {
        if (!rep) {
            rep = " ";
        }
        str = String(str).replace("&nbsp;", rep);
        return String(str).replace(/(<([^>]+)>)/ig, rep);
    };
    lib.getParams = function (obj) {
        var params = "",
            i = 0;
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (params !== "") {
                    params += "&";
                }
                params += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
            }
        }
        return params;
    };
    /*
    */
    lib.toFixed = function (num, decimals, decimalPoint) {
        var n = Number(num);
        if (isNaN(n)) {
            return num;
        }
        n = n.toFixed(Number(decimals) || 0);
        if (decimalPoint) {
            n = n.replace(".", decimalPoint);
        }
        return n;
    };
    lib.rnd = function (n, m) {
        return n + Math.floor(Math.random() * (m - n + 1));
    };
    /*
    */
    lib.log = function () {
        /*
        */
    };
    lib.show_table = function (display, table) {
        var i;
        /*
        */
    };
    /*
    */
    lib.writeDataLabel = function (tableId, contentTableId) {
        var headRows, headTxts, colspan, columnCount, tdText, i, j, k, l, n;
        headTxts = [];
        columnCount = 0;
        if (!contentTableId) {
            contentTableId = tableId;
        }
        headRows = lib.getByClass("thead", tableId, "tr");
        headRows.forEach(function (trHead) {
            j = 0;
            for (i = 0; i < trHead.childElementCount; i = i + 1) {
                l = j + 1;
                colspan = trHead.children[i].getAttribute('colspan');
                if (colspan) {
                    l = j + parseInt(colspan);
                }
                for (j; j < l; j = j + 1) {
                    if (!headTxts[j]) {
                        headTxts[j] = "";
                    }
                    headTxts[j] = headTxts[j] + " " + lib.removeHtml(lib.getHtml(trHead.children[i]));
                }
            }
        });
        columnCount = headTxts.length;
        lib.walkDom(contentTableId, "tr", function (tr) {
            if (columnCount == tr.childElementCount) {
                for (i = 0; i < columnCount; i = i + 1) {
                    tdText = lib.getText(tr.children[i]);
                    if (tdText != "" && tdText != "&nbsp;") {
                        tr.children[i].setAttribute('datalabel', headTxts[i]);
                    } else {
                        tr.children[i].setAttribute('datalabel', "");
                    }
                }
            } else {
                for (j = 0; j < tr.childElementCount; j = j + 1) {
                    tr.children[j].setAttribute('datalabel', '');
                }
            }
        });
    };
    return lib;
}());
