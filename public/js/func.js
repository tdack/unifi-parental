/*
*/
/*jslint browser: true, indent: 2 */
var func;
func = func || (function () {
    "use strict";
    var lib, slice;
    lib = {};
    slice = Function.prototype.call.bind(Array.prototype.slice);
    lib.noop = function () {
        return;
    };
    lib.id = function (x) {
        return x;
    };
    lib.const = function (x) {
        return function () {
            return x;
        };
    };
    lib.eq = function (x, key) {
        if (key === undefined) {
            return function (val) {
                return val === x;
            };
        }
        return function (obj) {
            return Boolean(obj && obj[key] === x);
        };
    };
    lib.neq = function (x, key) {
        var eq;
        eq = lib.eq(x, key);
        return function (v) {
            return !eq(v);
        };
    };
    lib.lt = function (key) {
        if (key === undefined) {
            return function (val1, val2) {
                return val1 < val2;
            };
        }
        return function (obj1, obj2) {
            return Boolean(obj1 && obj2 && obj1[key] < obj2[key]);
        };
    };
    lib.match = function (regex, key) {
        if (key === undefined) {
            return function (val) {
                return (typeof val === 'string' && val.match(regex) !== null);
            };
        }
        return function (obj) {
            var s;
            s = obj && obj[key];
            return (typeof s === 'string' && s.match(regex) !== null);
        };
    };
    lib.get = function (key, defaultValue) {
        return function (obj) {
            var result;
            if (obj && typeof obj === 'object') {
                result = obj[key];
            }
            if (result === undefined) {
                return defaultValue;
            }
            return result;
        };
    };
    lib.partial = function (fn) {
        var fixedArgs;
        fixedArgs = slice(arguments, 1);
        return function () {
            return fn.apply(null, fixedArgs.concat(slice(arguments)));
        };
    };
    lib.rpartial = function (fn) {
        var fixedArgs;
        fixedArgs = slice(arguments, 1);
        return function () {
            return fn.apply(null, slice(arguments).concat(fixedArgs));
        };
    };
    lib.curry = function (n, fn) {
        if (n === 0) {
            return fn();
        }
        return function (arg) {
            return lib.curry(n - 1, function () {
                return fn.apply(null, [arg].concat(slice(arguments)));
            });
        };
    };
    return lib;
}());
