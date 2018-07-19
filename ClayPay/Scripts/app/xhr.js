/*  This code was written by macromaniac
 *  Originally pulled from: https://gist.github.com/macromaniac/e62ed27781842b6c8611 on 7/14/2016
 *  and from https://gist.github.com/takanori-ugai/8262008944769419e614
 *
 */
var XHR;
(function (XHR) {
    class Header {
        constructor(header, data) {
            this.header = header;
            this.data = data;
        }
    }
    XHR.Header = Header;
    class Data {
    }
    XHR.Data = Data;
    function DataFromJSXHR(jsXHR) {
        var data = new Data();
        data.Headers = jsXHR.getAllResponseHeaders();
        data.Text = jsXHR.responseText;
        data.Type = jsXHR.responseType;
        data.Status = jsXHR.status;
        data.StatusText = jsXHR.statusText;
        return data;
    }
    function SendCommand(method, url, headers, data = "") {
        return new Promise(function (resolve, reject) {
            var jsXHR = new XMLHttpRequest();
            jsXHR.open(method, url);
            if (headers != null)
                headers.forEach(header => jsXHR.setRequestHeader(header.header, header.data));
            jsXHR.onload = (ev) => {
                if (jsXHR.status < 200 || jsXHR.status >= 300) {
                    reject(DataFromJSXHR(jsXHR));
                }
                resolve(DataFromJSXHR(jsXHR));
            };
            jsXHR.onerror = (ev) => {
                reject("There was an error communicating with the server.  Please check your connection and try again.");
            };
            if (data.length > 0)
                jsXHR.send(data);
            else
                jsXHR.send();
        });
    }
    function addJSONHeader(headers) {
        if (headers === null || headers.length == 0) {
            headers = [
                new XHR.Header("Content-Type", "application/json; charset=utf-8"),
                new XHR.Header("Accept", "application/json")
            ];
        }
        else {
            headers.push(new XHR.Header("Content-Type", "application/json; charset=utf-8"));
            headers.push(new XHR.Header("Accept", "application/json"));
        }
        return headers;
    }
    function Get(url, headers = null, isJSON = true) {
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('GET', url, headers);
    }
    XHR.Get = Get;
    function Post(url, data = "", headers = null, isJSON = true) {
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('POST', url, headers, data);
    }
    XHR.Post = Post;
    function Put(url, data = "", headers = null, isJSON = true) {
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('PUT', url, headers, data);
    }
    XHR.Put = Put;
    function Delete(url, data = "", headers = null, isJSON = true) {
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('DELETE', url, headers, data);
    }
    XHR.Delete = Delete;
    function GetArray(url, queryString = "") {
        var x = XHR.Get(url + queryString);
        return new Promise(function (resolve, reject) {
            x.then(function (response) {
                let ar = JSON.parse(response.Text);
                resolve(ar);
            }).catch(function () {
                console.log("error in Get " + url);
                reject(null);
            });
        });
    }
    XHR.GetArray = GetArray;
    function GetObject(url, queryString = "") {
        var x = XHR.Get(url + queryString);
        return new Promise(function (resolve, reject) {
            x.then(function (response) {
                let ar = JSON.parse(response.Text);
                resolve(ar);
            }).catch(function () {
                console.log("error in Get " + url);
                reject(null);
            });
        });
    }
    XHR.GetObject = GetObject;
    function SaveObject(url, object) {
        var x = XHR.Post(url, JSON.stringify(object));
        return new Promise(function (resolve, reject) {
            x.then(function (response) {
                if (response.Text.length === 0) {
                    resolve([]);
                }
                else {
                    let ar = JSON.parse(response.Text);
                    resolve(ar);
                }
            }).catch(function (e) {
                console.log('save object error ' + url + ' ' + e);
                reject(null);
            });
        });
    }
    XHR.SaveObject = SaveObject;
})(XHR || (XHR = {}));
//# sourceMappingURL=XHR.js.map