function ajaxGet(url, callback, abortAfter) {
    return sendXhr("GET", url, null, callback, { abortAfter: abortAfter });
}
function ajaxPost(url, postData, callback) {
    return sendXhr("POST", url, postData, callback, {});
}
function ajaxPostJSON(url, postData, callback) {
    return sendXhr("POST", url, postData, callback, { asJSON: true });
}
function ajaxPostSync(url, postData) {
    return sendXhr("POST", url, postData, null, { aSync: false });
}
function ajaxDelete(url, postData, callback) {
    return sendXhr("DELETE", url, postData, callback, { asJSON: false });
}

function sendXhr(method, url, postData, callback, options) {
    var allowed = true;
    options = options || {};
    var abortAfter = options.abortAfter;
    var aSync = (options.aSync !== false);
    var postAsJSON = (options.asJSON !== false);
    var abortTimeout;
    var xhr = newXhr();
    if (!xhr) {
        return false;
    }
    method = method.toUpperCase();
    if (method == "GET") {
        url = addUrlParam(url, "t" + String((new Date()).getTime()), "nocache");
    }
    xhr.open(method, url, aSync);
    if ((method == "POST") || (method == "DELETE")) {
        if (postAsJSON) {
            xhr.setRequestHeader('Content-Type', 'application/json');
            postData = JSON.stringify(postData);
        } else {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            postData = [postData || ""].join("&");
        }
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            clearTimeout(abortTimeout);
            if (typeof callback == 'function') {
                callback(xhr);
                callback = null;
            }
            xhr.onreadystatechange = function () { };
        }
    };
    if (abortAfter) {
        abortTimeout = setTimeout(function () {
            stopXhr(xhr);
            if (typeof callback == 'function') {
                callback("aborted");
                callback = null;
            }
        }, abortAfter);
    }
    xhr.send(postData);
    return xhr;
}
function stopXhr(xhr) {
    if (xhr && xhr.readyState && xhr.readyState < 4) {
        xhr.onreadystatechange = function () { };
        xhr.abort();
    }
}
function newXhr() {
    var createFuncs = [
        function () { return new XMLHttpRequest(); },
        function () { return new ActiveXObject("Msxml2.XMLHTTP"); },
        function () { return new ActiveXObject("Microsoft.XMLHTTP"); }
    ];
    var xhr = null;
    for (var i = 0; i < createFuncs.length; i++) {
        try {
            xhr = createFuncs[i]();
            if (xhr) {
                newXhr = createFuncs[i];
                return xhr;
            }
        }
        catch (err) {}
    }
    newXhr = function () { return null; };
    return null;
}
function makeJSONParser() {
    if (window.JSON && typeof window.JSON.parse == 'function') {
        return window.JSON.parse;
    }
    else {
        return function (txt) {
            return (new Function('return (' + txt + ')'))();
        };
    }
}
function buildUrlParam(name, value) {
    if (typeof value == 'undefined') {
        value = "";
    }
    return encodeURIComponent(name) + "=" + encodeURIComponent(value);
}
function addUrlParam(url, name, value) {
    if (!name) {
        return url;
    }
    var sep = "&";
    url = url || "";
    if (url.indexOf("?") < 0) {
        sep = "?";
    }
    return url + sep + buildUrlParam(name, value);
}
//-----------------------------------------------------------------------
// Einen String (Name oder Value) für die POST-Daten codieren.
// Encode a string (name or value) for the POST data.
//-----------------------------------------------------------------------
function postEncode(str) {
    var result = encodeURIComponent(str);
    result = result.replace(/%20/g, '+');
    result = result.replace(/(.{0,3})(%0A)/g,
        function (m, s1, s2) { return s1 + (s1 == '%0D' ? '' : '%0D') + s2; }
    );
    result = result.replace(/(%0D)(.{0,3})/g,
        function (m, s1, s2) { return s1 + (s2 == '%0A' ? '' : '%0A') + s2; }
    );
    return result;
}
function ajaxRequest(options) {
    var cfg = {};
    cfg.method = (options.method || "GET").toUpperCase();
    cfg.url = options.url || "";
    cfg.sync = (cfg.method == "POST" && Boolean(options.sync));
    //TODO: params wirklich kopieren
    //TODO: really copy params
    cfg.params = options.params || {};
    cfg.type = (options.type || 'json').toLowerCase();
    cfg.callback = options.callback || function () { };
    if (options.sidRenew !== true) {
        cfg.params.no_sidrenew = "";
    }
    var xhr;
    var json = makeJSONParser();
    function buildParams(params) {
        params = params || {};
        var encFunc = encodeURIComponent;
        if (cfg.method == "POST") {
            encFunc = postEncode;
        }
        var data = [];
        for (var name in params) {
            if (name && params.hasOwnProperty(name)) {
                var value = params[name];
                if (typeof value == 'undefined') {
                    value = "";
                }
                data.push(encFunc(name) + "=" + encFunc(value));
            }
        }
        return data.join("&");
    }
    function callback(xhr) {
        var answer;
        switch (cfg.type) {
            case 'html': {
                answer = xhr.responseText || "";
                break;
            }
            case 'json':
            default: {
                answer = json(xhr.responseText || "null");
                answer = answer || { answer: false };
                break;
            }
        }
        cfg.callback(answer);
    }
    function start(addParams) {
        var url = cfg.url;
        var params = jxl.mergeObjects(cfg.params, addParams);
        var data = buildParams(params);
        if (cfg.method == "GET") {
            url += "?" + data;
            data = null;
        }
        if (cfg.sync) {
            xhr = sendXhr(cfg.method, url, data, null, { aSync: false });
            callback(xhr);
        }
        else {
            xhr = sendXhr(cfg.method, url, data, callback);
        }
    }
    function stop() {
        stopXhr(xhr);
    }
    return {
        start: start,
        stop: stop
    };
}
