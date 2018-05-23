var XHR;
(function (XHR) {
    var Header = (function () {
        function Header(header, data) {
            this.header = header;
            this.data = data;
        }
        return Header;
    }());
    XHR.Header = Header;
    var Data = (function () {
        function Data() {
        }
        return Data;
    }());
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
    function SendCommand(method, url, headers, data) {
        if (data === void 0) { data = ""; }
        return new Promise(function (resolve, reject) {
            var jsXHR = new XMLHttpRequest();
            jsXHR.open(method, url);
            if (headers != null)
                headers.forEach(function (header) {
                    return jsXHR.setRequestHeader(header.header, header.data);
                });
            jsXHR.onload = function (ev) {
                if (jsXHR.status < 200 || jsXHR.status >= 300) {
                    reject(DataFromJSXHR(jsXHR));
                }
                resolve(DataFromJSXHR(jsXHR));
            };
            jsXHR.onerror = function (ev) {
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
    function Get(url, headers, isJSON) {
        if (headers === void 0) { headers = null; }
        if (isJSON === void 0) { isJSON = true; }
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('GET', url, headers);
    }
    XHR.Get = Get;
    function Post(url, data, headers, isJSON) {
        if (data === void 0) { data = ""; }
        if (headers === void 0) { headers = null; }
        if (isJSON === void 0) { isJSON = true; }
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('POST', url, headers, data);
    }
    XHR.Post = Post;
    function Put(url, data, headers, isJSON) {
        if (data === void 0) { data = ""; }
        if (headers === void 0) { headers = null; }
        if (isJSON === void 0) { isJSON = true; }
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('PUT', url, headers, data);
    }
    XHR.Put = Put;
    function Delete(url, data, headers, isJSON) {
        if (data === void 0) { data = ""; }
        if (headers === void 0) { headers = null; }
        if (isJSON === void 0) { isJSON = true; }
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('DELETE', url, headers, data);
    }
    XHR.Delete = Delete;
    function GetArray(url, queryString) {
        if (queryString === void 0) { queryString = ""; }
        var x = XHR.Get(url + queryString);
        return new Promise(function (resolve, reject) {
            x.then(function (response) {
                var ar = JSON.parse(response.Text);
                resolve(ar);
            }).catch(function () {
                console.log("error in Get " + url);
                reject(null);
            });
        });
    }
    XHR.GetArray = GetArray;
    function GetObject(url, queryString) {
        if (queryString === void 0) { queryString = ""; }
        var x = XHR.Get(url + queryString);
        return new Promise(function (resolve, reject) {
            x.then(function (response) {
                var ar = JSON.parse(response.Text);
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
                    var ar = JSON.parse(response.Text);
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
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.2.2+35df15ea
 */
(function () {
    "use strict";
    function t(t) { return "function" == typeof t || "object" == typeof t && null !== t; }
    function e(t) { return "function" == typeof t; }
    function n(t) { G = t; }
    function r(t) { Q = t; }
    function o() { return function () { process.nextTick(a); }; }
    function i() { return function () { B(a); }; }
    function s() { var t = 0, e = new X(a), n = document.createTextNode(""); return e.observe(n, { characterData: !0 }), function () { n.data = t = ++t % 2; }; }
    function u() { var t = new MessageChannel; return t.port1.onmessage = a, function () { t.port2.postMessage(0); }; }
    function c() { return function () { setTimeout(a, 1); }; }
    function a() { for (var t = 0; J > t; t += 2) {
        var e = tt[t], n = tt[t + 1];
        e(n), tt[t] = void 0, tt[t + 1] = void 0;
    } J = 0; }
    function f() { try {
        var t = require, e = t("vertx");
        return B = e.runOnLoop || e.runOnContext, i();
    }
    catch (n) {
        return c();
    } }
    function l(t, e) { var n = this, r = new this.constructor(p); void 0 === r[rt] && k(r); var o = n._state; if (o) {
        var i = arguments[o - 1];
        Q(function () { x(o, r, i, n._result); });
    }
    else
        E(n, r, t, e); return r; }
    function h(t) { var e = this; if (t && "object" == typeof t && t.constructor === e)
        return t; var n = new e(p); return g(n, t), n; }
    function p() { }
    function _() { return new TypeError("You cannot resolve a promise with itself"); }
    function d() { return new TypeError("A promises callback cannot return that same promise."); }
    function v(t) { try {
        return t.then;
    }
    catch (e) {
        return ut.error = e, ut;
    } }
    function y(t, e, n, r) { try {
        t.call(e, n, r);
    }
    catch (o) {
        return o;
    } }
    function m(t, e, n) { Q(function (t) { var r = !1, o = y(n, e, function (n) { r || (r = !0, e !== n ? g(t, n) : S(t, n)); }, function (e) { r || (r = !0, j(t, e)); }, "Settle: " + (t._label || " unknown promise")); !r && o && (r = !0, j(t, o)); }, t); }
    function b(t, e) { e._state === it ? S(t, e._result) : e._state === st ? j(t, e._result) : E(e, void 0, function (e) { g(t, e); }, function (e) { j(t, e); }); }
    function w(t, n, r) { n.constructor === t.constructor && r === et && constructor.resolve === nt ? b(t, n) : r === ut ? j(t, ut.error) : void 0 === r ? S(t, n) : e(r) ? m(t, n, r) : S(t, n); }
    function g(e, n) { e === n ? j(e, _()) : t(n) ? w(e, n, v(n)) : S(e, n); }
    function A(t) { t._onerror && t._onerror(t._result), T(t); }
    function S(t, e) { t._state === ot && (t._result = e, t._state = it, 0 !== t._subscribers.length && Q(T, t)); }
    function j(t, e) { t._state === ot && (t._state = st, t._result = e, Q(A, t)); }
    function E(t, e, n, r) { var o = t._subscribers, i = o.length; t._onerror = null, o[i] = e, o[i + it] = n, o[i + st] = r, 0 === i && t._state && Q(T, t); }
    function T(t) { var e = t._subscribers, n = t._state; if (0 !== e.length) {
        for (var r, o, i = t._result, s = 0; s < e.length; s += 3)
            r = e[s], o = e[s + n], r ? x(n, r, o, i) : o(i);
        t._subscribers.length = 0;
    } }
    function M() { this.error = null; }
    function P(t, e) { try {
        return t(e);
    }
    catch (n) {
        return ct.error = n, ct;
    } }
    function x(t, n, r, o) { var i, s, u, c, a = e(r); if (a) {
        if (i = P(r, o), i === ct ? (c = !0, s = i.error, i = null) : u = !0, n === i)
            return void j(n, d());
    }
    else
        i = o, u = !0; n._state !== ot || (a && u ? g(n, i) : c ? j(n, s) : t === it ? S(n, i) : t === st && j(n, i)); }
    function C(t, e) { try {
        e(function (e) { g(t, e); }, function (e) { j(t, e); });
    }
    catch (n) {
        j(t, n);
    } }
    function O() { return at++; }
    function k(t) { t[rt] = at++, t._state = void 0, t._result = void 0, t._subscribers = []; }
    function Y(t) { return new _t(this, t).promise; }
    function q(t) { var e = this; return new e(I(t) ? function (n, r) { for (var o = t.length, i = 0; o > i; i++)
        e.resolve(t[i]).then(n, r); } : function (t, e) { e(new TypeError("You must pass an array to race.")); }); }
    function F(t) { var e = this, n = new e(p); return j(n, t), n; }
    function D() { throw new TypeError("You must pass a resolver function as the first argument to the promise constructor"); }
    function K() { throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function."); }
    function L(t) { this[rt] = O(), this._result = this._state = void 0, this._subscribers = [], p !== t && ("function" != typeof t && D(), this instanceof L ? C(this, t) : K()); }
    function N(t, e) { this._instanceConstructor = t, this.promise = new t(p), this.promise[rt] || k(this.promise), I(e) ? (this._input = e, this.length = e.length, this._remaining = e.length, this._result = new Array(this.length), 0 === this.length ? S(this.promise, this._result) : (this.length = this.length || 0, this._enumerate(), 0 === this._remaining && S(this.promise, this._result))) : j(this.promise, U()); }
    function U() { return new Error("Array Methods must be provided an Array"); }
    function W() { var t; if ("undefined" != typeof global)
        t = global;
    else if ("undefined" != typeof self)
        t = self;
    else
        try {
            t = Function("return this")();
        }
        catch (e) {
            throw new Error("polyfill failed because global object is unavailable in this environment");
        } var n = t.Promise; (!n || "[object Promise]" !== Object.prototype.toString.call(n.resolve()) || n.cast) && (t.Promise = pt); }
    var z;
    z = Array.isArray ? Array.isArray : function (t) { return "[object Array]" === Object.prototype.toString.call(t); };
    var B, G, H, I = z, J = 0, Q = function (t, e) { tt[J] = t, tt[J + 1] = e, J += 2, 2 === J && (G ? G(a) : H()); }, R = "undefined" != typeof window ? window : void 0, V = R || {}, X = V.MutationObserver || V.WebKitMutationObserver, Z = "undefined" == typeof self && "undefined" != typeof process && "[object process]" === {}.toString.call(process), $ = "undefined" != typeof Uint8ClampedArray && "undefined" != typeof importScripts && "undefined" != typeof MessageChannel, tt = new Array(1e3);
    H = Z ? o() : X ? s() : $ ? u() : void 0 === R && "function" == typeof require ? f() : c();
    var et = l, nt = h, rt = Math.random().toString(36).substring(16), ot = void 0, it = 1, st = 2, ut = new M, ct = new M, at = 0, ft = Y, lt = q, ht = F, pt = L;
    L.all = ft, L.race = lt, L.resolve = nt, L.reject = ht, L._setScheduler = n, L._setAsap = r, L._asap = Q, L.prototype = { constructor: L, then: et, "catch": function (t) { return this.then(null, t); } };
    var _t = N;
    N.prototype._enumerate = function () { for (var t = this.length, e = this._input, n = 0; this._state === ot && t > n; n++)
        this._eachEntry(e[n], n); }, N.prototype._eachEntry = function (t, e) { var n = this._instanceConstructor, r = n.resolve; if (r === nt) {
        var o = v(t);
        if (o === et && t._state !== ot)
            this._settledAt(t._state, e, t._result);
        else if ("function" != typeof o)
            this._remaining--, this._result[e] = t;
        else if (n === pt) {
            var i = new n(p);
            w(i, t, o), this._willSettleAt(i, e);
        }
        else
            this._willSettleAt(new n(function (e) { e(t); }), e);
    }
    else
        this._willSettleAt(r(t), e); }, N.prototype._settledAt = function (t, e, n) { var r = this.promise; r._state === ot && (this._remaining--, t === st ? j(r, n) : this._result[e] = n), 0 === this._remaining && S(r, this._result); }, N.prototype._willSettleAt = function (t, e) { var n = this; E(t, void 0, function (t) { n._settledAt(it, e, t); }, function (t) { n._settledAt(st, e, t); }); };
    var dt = W, vt = { Promise: pt, polyfill: dt };
    "function" == typeof define && define.amd ? define(function () { return vt; }) : "undefined" != typeof module && module.exports ? module.exports = vt : "undefined" != typeof this && (this.ES6Promise = vt), dt();
}).call(this);
//# sourceMappingURL=es6-promise.min.js.map
var clayPay;
(function (clayPay) {
    "use strict";
    function start() {
        loadDefaultValues();
    }
    clayPay.start = start;
    function loadDefaultValues() {
        loadApplicationTypes();
        loadCreditCardFee();
        loadCreditCardExpirationValues();
        clayPay.UI.BuildCardTypes("ccTypes");
    }
    function loadCreditCardExpirationValues() {
        clayPay.UI.BuildExpMonths("ccExpMonth");
        clayPay.UI.BuildExpYears("ccExpYear");
    }
    function loadCreditCardFee() {
        clayPay.transport.GetConvenienceFee().then(function (fee) {
            clayPay.ConvenienceFee = fee;
            console.log('conv fee is', fee);
        }, function () {
            console.log('error getting convenience fee');
        });
    }
    function loadApplicationTypes() {
        clayPay.transport.GetApplicationTypes().then(function (appTypes) {
            clayPay.UI.BuildAppTypes(appTypes);
        }, function () {
            console.log('error getting application types');
        });
    }
    function toggleNavDisplay(element) {
        clayPay.UI.toggleNav("navTopMenu", element);
        var section = document.getElementsByTagName("section");
        for (var i = 0; i < section.length; i++) {
            if (section[i].style.display !== "none") {
                section[i].style.display = "none";
            }
        }
        document.getElementById(element).style.display = "block";
    }
    clayPay.toggleNavDisplay = toggleNavDisplay;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=claypay.js.map
var clayPay;
(function (clayPay) {
    var transport;
    (function (transport) {
        "use strict";
        function GetApplicationTypes() {
            var x = XHR.Get("./API/Apptypes/");
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var ar = JSON.parse(response.Text);
                    resolve(ar);
                }).catch(function () {
                    console.log("error in Get Application Types");
                    reject(null);
                });
            });
        }
        transport.GetApplicationTypes = GetApplicationTypes;
        function GetConvenienceFee() {
            var x = XHR.Get("./API/Fee/");
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var ar = JSON.parse(response.Text);
                    resolve(ar);
                }).catch(function () {
                    console.log("error in Get Convenience Fee");
                    reject(null);
                });
            });
        }
        transport.GetConvenienceFee = GetConvenienceFee;
        function GetCharges(key) {
            var x = XHR.Get("./API/Query/" + key);
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var ar = JSON.parse(response.Text);
                    resolve(ar);
                }).catch(function () {
                    console.log("error in Get Charges");
                    reject(null);
                });
            });
        }
        transport.GetCharges = GetCharges;
    })(transport = clayPay.transport || (clayPay.transport = {}));
})(clayPay || (clayPay = {}));
//# sourceMappingURL=transport.js.map
var clayPay;
(function (clayPay) {
    var UI;
    (function (UI) {
        "use strict";
        var Cart = [];
        var CurrentCharges = [];
        UI.ExpMonths = ['01', '02', '03', '04', '05',
            '06', '07', '08', '09', '10', '11', '12'];
        UI.ExpYears = [];
        function Submit() {
            Disable('btnSubmit');
            Hide('errorList');
            Hide('PaymentPosting');
            var f = document.getElementById('paymentForm');
            if (!f.checkValidity())
                return false;
            var itemIds = Cart.map(function (i) {
                return i.ItemId;
            });
            var total = Cart.reduce(function (total, b) {
                return total + b.Total;
            }, 0);
            total = parseFloat(total.toFixed(2));
            var cc = new clayPay.CCData(getValue('ccFirstName'), getValue('ccLastName'), getValue('cardNumber'), getValue('ccTypes'), getValue('ccExpMonth'), getValue('ccExpYear'), getValue('ccCVV'), getValue('ccZip'), getValue('emailAddress'), total, itemIds);
            var errors = cc.Validate();
            if (errors.length === 0) {
                Hide('CCForm');
                Show('PaymentPosting');
                var save = cc.Save();
                save.then(function (response) {
                    var pr = JSON.parse(response);
                    resetApp();
                    PopulateReceipt(pr);
                }, function (reject) {
                    Show('errorList');
                    errors = [reject];
                    BuildErrors(errors);
                    Show('CCForm');
                    Hide('PaymentPosting');
                    Enable('btnSubmit');
                });
            }
            else {
                Show('errorList');
                BuildErrors(errors);
                Enable('btnSubmit');
            }
            return false;
        }
        UI.Submit = Submit;
        function resetApp() {
            CurrentCharges = [];
            Cart = [];
            updateCart();
            updateCartNav();
            var f = document.getElementById('paymentForm');
            f.reset();
            Enable('btnSubmit');
            Show('CCForm');
            Hide('PaymentPosting');
        }
        function PopulateReceipt(pr) {
            clayPay.toggleNavDisplay('receipt');
            SetInputValue("receiptUniqueId", pr.CashierId);
            SetInputValue("receiptTimestamp", pr.TimeStamp_Display);
            SetInputValue("receiptAmount", pr.Amount.toFixed(2));
        }
        function ToggleDisabled(id, status) {
            document.getElementById(id).disabled = status;
        }
        function Disable(id) {
            ToggleDisabled(id, true);
        }
        function Enable(id) {
            ToggleDisabled(id, false);
        }
        function BuildErrors(errors) {
            var errorList = document.getElementById("errorList");
            var df = document.createDocumentFragment();
            clearElement(errorList);
            for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
                var error = errors_1[_i];
                var li = document.createElement("li");
                li.textContent = error;
                df.appendChild(li);
            }
            errorList.appendChild(df);
        }
        function getValue(id) {
            return document.getElementById(id).value;
        }
        function BuildAppTypes(appTypes) {
            var appSelect = document.getElementById("ApplicationTypeSelect");
            clearElement(appSelect);
            appSelect.appendChild(createOption("-1", "Select Application Type"));
            for (var _i = 0, appTypes_1 = appTypes; _i < appTypes_1.length; _i++) {
                var appType = appTypes_1[_i];
                appSelect.appendChild(createOption(appType.Value, appType.Label));
            }
        }
        UI.BuildAppTypes = BuildAppTypes;
        function BuildCardTypes(id) {
            var ccTypes = [
                { label: 'American Express', value: 'AMEX' },
                { label: 'Discover', value: 'DISCOVER' },
                { label: 'MasterCard', value: 'MASTERCARD' },
                { label: 'Visa', value: 'VISA' }
            ];
            var selectTypes = document.getElementById(id);
            clearElement(selectTypes);
            ccTypes.map(function (ccType) {
                selectTypes.appendChild(createOption(ccType.value, ccType.label));
            });
        }
        UI.BuildCardTypes = BuildCardTypes;
        function BuildExpMonths(id) {
            var expMonth = document.getElementById(id);
            if (expMonth === undefined)
                return;
            clearElement(expMonth);
            UI.ExpMonths.map(function (month) {
                expMonth.appendChild(createOption(month, month));
            });
        }
        UI.BuildExpMonths = BuildExpMonths;
        function BuildExpYears(id) {
            var expYear = document.getElementById(id);
            clearElement(expYear);
            var year = new Date().getFullYear();
            for (var i = 0; i < 10; i++) {
                var y = (year + i).toString();
                expYear.appendChild(createOption(y, y));
                UI.ExpYears.push(y);
            }
        }
        UI.BuildExpYears = BuildExpYears;
        function createOption(value, label) {
            var opt = document.createElement("option");
            opt.setAttribute("value", value);
            opt.appendChild(document.createTextNode(label));
            return opt;
        }
        function clearElement(node) {
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
        }
        UI.clearElement = clearElement;
        function toggleNav(nav, element) {
            var e = document.getElementById(nav);
            if (e === null)
                return;
            var activeNodes = e.getElementsByClassName("active");
            for (var i = 0; i < activeNodes.length; i++) {
                activeNodes[i].classList.remove("active");
            }
            var eNav = document.getElementById("nav-" + element);
            if (eNav === null)
                return;
            eNav.classList.add("active");
        }
        UI.toggleNav = toggleNav;
        function Show(id) {
            var e = document.getElementById(id);
            e.style.display = "block";
        }
        function Hide(id) {
            var e = document.getElementById(id);
            e.style.display = "none";
        }
        function Search(key) {
            Hide('InvalidSearch');
            Hide('SearchFailed');
            Hide('SearchSuccessful');
            Show('SearchResults');
            Show('Searching');
            var k = key.trim().toUpperCase();
            if (k.length > 0) {
                clayPay.transport.GetCharges(k).then(function (charges) {
                    CurrentCharges = charges;
                    Hide('Searching');
                    ProcessResults(charges, key);
                    return true;
                }, function () {
                    console.log('error getting charges');
                    Hide('Searching');
                    return false;
                });
            }
            else {
                Hide('Searching');
                Show('InvalidSearch');
                return false;
            }
        }
        UI.Search = Search;
        function ProcessResults(charges, key) {
            AddCharges(charges);
            if (charges.length == 0) {
                UpdateSearchFailed(key);
            }
            else {
                Show('SearchSuccessful');
                SetValue('ChargesKey', charges[0].AssocKey);
                SetValue('ChargesDetail', charges[0].Detail);
            }
        }
        function AddCharges(charges) {
            var container = document.getElementById('Charges');
            var df = document.createDocumentFragment();
            clearElement(container);
            for (var _i = 0, charges_1 = charges; _i < charges_1.length; _i++) {
                var charge = charges_1[_i];
                df.appendChild(buildChargeRow(charge));
            }
            df.appendChild(buildChargeFooterRow());
            container.appendChild(df);
        }
        function buildChargeFooterRow() {
            var df = document.createDocumentFragment();
            var tr1 = document.createElement("tr");
            tr1.appendChild(createTableElement("", "", 3));
            tr1.appendChild(createTableElementButton("Add All to Cart", 0, "", true, AddAllItemsToCart, RemoveItemFromCart));
            df.appendChild(tr1);
            var tr2 = document.createElement("tr");
            tr2.appendChild(createTableElement("", "", 3));
            tr2.appendChild(createViewCartTableElementButton("View Cart", clayPay.toggleNavDisplay));
            df.appendChild(tr2);
            return df;
        }
        function buildChargeRow(charge) {
            var tr = document.createElement("tr");
            tr.appendChild(createTableElement(charge.Description, "left"));
            tr.appendChild(createTableElement(charge.TimeStampDisplay));
            tr.appendChild(createTableElement(charge.Total.toFixed(2)));
            tr.appendChild(createTableElementButton("Add to Cart", charge.ItemId, "", true, AddItemToCart, RemoveItemFromCart));
            return tr;
        }
        function AddItemToCart(ev, itemId) {
            var item = CurrentCharges.filter(function (c) {
                return c.ItemId == itemId;
            });
            if (item.length === 1 && Cart.indexOf(item[0]) === -1) {
                Cart.push(item[0]);
            }
            ToggleAddRemoveButtons(itemId);
            updateCart();
        }
        function RemoveItemFromCart(ev, itemId, toggle) {
            var newCart = Cart.filter(function (c) {
                return c.ItemId !== itemId;
            });
            Cart = newCart;
            if (toggle)
                ToggleAddRemoveButtons(itemId);
            updateCart();
        }
        function ToggleAddRemoveButtons(itemId) {
            var btnAdd = document.getElementById("btnAdd" + itemId.toString());
            var btnRem = document.getElementById("btnRemove" + itemId.toString());
            var showAdd = btnAdd.style.display === "inline-block";
            btnAdd.style.display = showAdd ? "none" : "inline-block";
            btnRem.style.display = showAdd ? "inline-block" : "none";
        }
        function IsItemInCart(itemId) {
            var item = Cart.filter(function (c) {
                return c.ItemId == itemId;
            });
            return item.length !== 0;
        }
        function AddAllItemsToCart() {
            for (var _i = 0, CurrentCharges_1 = CurrentCharges; _i < CurrentCharges_1.length; _i++) {
                var charge = CurrentCharges_1[_i];
                if (!IsItemInCart(charge.ItemId)) {
                    Cart.push(charge);
                }
            }
            updateCart();
            AddCharges(CurrentCharges);
        }
        function createTableElement(value, className, colspan) {
            var d = document.createElement("td");
            if (className !== undefined) {
                d.className = className;
            }
            if (colspan !== undefined) {
                d.colSpan = colspan;
            }
            d.appendChild(document.createTextNode(value));
            return d;
        }
        function createTableElementButton(value, itemId, className, toggle, addOnClickFunction, removeOnClickFunction) {
            var IsInCart = IsItemInCart(itemId);
            var d = document.createElement("td");
            d.className = className;
            var add = document.createElement("button");
            add.style.display = IsInCart ? "none" : "inline-block";
            add.type = "button";
            add.id = "btnAdd" + itemId.toString();
            add.className = "btn btn-primary";
            add.onclick = function (ev) {
                addOnClickFunction(ev, itemId);
            };
            var remove = document.createElement("div");
            remove.id = "btnRemove" + itemId.toString();
            remove.style.display = IsInCart ? "inline-block" : "none";
            remove.appendChild(document.createTextNode('Added ('));
            var removeButton = document.createElement("a");
            removeButton;
            removeButton.style.color = "darkgoldenrod";
            removeButton.style.cursor = "pointer";
            removeButton.appendChild(document.createTextNode('remove'));
            removeButton.onclick = function (ev) {
                removeOnClickFunction(ev, itemId, toggle);
            };
            remove.appendChild(removeButton);
            remove.appendChild(document.createTextNode(')'));
            add.appendChild(document.createTextNode(value));
            d.appendChild(add);
            d.appendChild(remove);
            return d;
        }
        function createAddAllTableElementButton(value, ViewCartClickFunction) {
            var d = document.createElement("td");
            var add = document.createElement("button");
            add.type = "button";
            add.className = "btn btn-primary";
            add.onclick = function (ev) {
                ViewCartClickFunction('cart');
            };
            add.appendChild(document.createTextNode(value));
            d.appendChild(add);
            return d;
        }
        function createViewCartTableElementButton(value, ViewCartClickFunction) {
            var d = document.createElement("td");
            var add = document.createElement("button");
            add.type = "button";
            add.className = "btn btn-success";
            add.onclick = function (ev) {
                ViewCartClickFunction('cart');
            };
            add.appendChild(document.createTextNode(value));
            d.appendChild(add);
            return d;
        }
        function SetInputValue(id, value) {
            var e = document.getElementById(id);
            e.value = value;
        }
        function SetValue(id, value) {
            var e = document.getElementById(id);
            clearElement(e);
            e.appendChild(document.createTextNode(value));
        }
        function UpdateSearchFailed(key) {
            var e = document.getElementById('SearchFailed');
            clearElement(e);
            var message = document.createElement("h4");
            message.appendChild(document.createTextNode("No charges were found for search: " + key));
            e.appendChild(message);
            Show('SearchFailed');
        }
        function updateCartNav() {
            var CartNav = document.getElementById('CartNav');
            clearElement(CartNav);
            var cartIcon = document.createElement("span");
            cartIcon.classList.add("glyphicon");
            cartIcon.classList.add("glyphicon-shopping-cart");
            CartNav.appendChild(cartIcon);
            if (Cart.length === 0) {
                Hide('CartNotEmpty');
                Show('CartEmpty');
                CartNav.appendChild(document.createTextNode('Cart: ('));
                var span = document.createElement("span");
                span.style.color = "darkgoldenrod";
                span.appendChild(document.createTextNode('empty'));
                CartNav.appendChild(span);
                CartNav.appendChild(document.createTextNode(')'));
            }
            else {
                Show('CartNotEmpty');
                Hide('CartEmpty');
                CartNav.appendChild(document.createTextNode('Cart: ' + Cart.length.toString() + (Cart.length === 1 ? ' item' : ' items')));
            }
        }
        function updateCart() {
            var CartCharges = document.getElementById('CartCharges');
            var df = document.createDocumentFragment();
            clearElement(CartCharges);
            for (var _i = 0, Cart_1 = Cart; _i < Cart_1.length; _i++) {
                var charge = Cart_1[_i];
                df.appendChild(buildCartRow(charge));
            }
            df.appendChild(buildCartFooterRow());
            df.appendChild(buildCartConvFeeFooterRow());
            CartCharges.appendChild(df);
            updateCartNav();
        }
        function buildCartFooterRow() {
            var tr = document.createElement("tr");
            tr.style.fontWeight = "bolder";
            tr.appendChild(createTableElement("", "", 2));
            tr.appendChild(createTableElement("Total", "center", 1));
            var TotalAmount = Cart.reduce(function (total, b) {
                return total + b.Total;
            }, 0);
            tr.appendChild(createTableElement(TotalAmount.toFixed(2), "", 1));
            tr.appendChild(createTableElement("", "", 1));
            return tr;
        }
        function buildCartConvFeeFooterRow() {
            var tr = document.createElement("tr");
            tr.style.fontWeight = "bolder";
            tr.appendChild(createTableElement("Please Note: There is a nonrefundable transaction fee charged by our payment provider. This is charged in addition to the total above.", "", 2));
            tr.appendChild(createTableElement("Conv. Fee", "center", 1));
            tr.appendChild(createTableElement(clayPay.ConvenienceFee, "", 1));
            tr.appendChild(createTableElement("", "", 1));
            return tr;
        }
        function buildCartRow(charge) {
            var tr = document.createElement("tr");
            tr.appendChild(createTableElement(charge.AssocKey));
            tr.appendChild(createTableElement(charge.Description, "left"));
            tr.appendChild(createTableElement(charge.TimeStampDisplay, "center"));
            tr.appendChild(createTableElement(charge.Total.toFixed(2), "center"));
            tr.appendChild(createTableElementButton("Add to Cart", charge.ItemId, "center", true, AddItemToCart, RemoveItemFromCart));
            return tr;
        }
    })(UI = clayPay.UI || (clayPay.UI = {}));
})(clayPay || (clayPay = {}));
//# sourceMappingURL=ui.js.map
var clayPay;
(function (clayPay) {
    var CCData = (function () {
        function CCData(FirstName, LastName, CardNumber, CardType, ExpMonth, ExpYear, CVVNumber, ZipCode, EmailAddress, Total, ItemIds) {
            this.FirstName = FirstName;
            this.LastName = LastName;
            this.CardNumber = CardNumber;
            this.CardType = CardType;
            this.ExpMonth = ExpMonth;
            this.ExpYear = ExpYear;
            this.CVVNumber = CVVNumber;
            this.ZipCode = ZipCode;
            this.EmailAddress = EmailAddress;
            this.Total = Total;
            this.ItemIds = ItemIds;
        }
        CCData.prototype.Validate = function () {
            var errors = [];
            this.FirstName = this.FirstName.trim();
            if (this.FirstName.length === 0) {
                errors.push('You must enter a First Name.');
            }
            this.LastName = this.LastName.trim();
            if (this.LastName.length === 0) {
                errors.push('You must enter a Last Name.');
            }
            this.CardNumber = this.CardNumber.trim();
            if (this.CardNumber.length === 0) {
                errors.push('You must enter a Card number.');
            }
            this.CVVNumber = this.CVVNumber.trim();
            if (this.CVVNumber.length === 0) {
                errors.push('You must enter a CVC number.');
            }
            this.ZipCode = this.ZipCode.trim();
            if (this.ZipCode.length === 0) {
                errors.push('You must enter a Zip Code.');
            }
            this.EmailAddress = this.EmailAddress.trim();
            if (this.EmailAddress.length === 0) {
                errors.push('You must enter an Email Address.');
            }
            if (this.ItemIds === null || this.ItemIds.length === 0) {
                errors.push('No items were found in the cart.  Please check this and try again.');
            }
            var cardTypes = ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'];
            if (cardTypes.indexOf(this.CardType) === -1) {
                errors.push('An invalid Credit Card Type has been selected.');
            }
            if (clayPay.UI.ExpMonths.indexOf(this.ExpMonth) === -1) {
                errors.push('An invalid Expiration Month has been selected.');
            }
            if (clayPay.UI.ExpYears.indexOf(this.ExpYear) === -1) {
                errors.push('An invalid Expiration Year has been selected.');
            }
            if (clayPay.UI.ExpMonths.indexOf(this.ExpMonth) !== -1 &&
                clayPay.UI.ExpYears.indexOf(this.ExpYear) !== -1) {
                var year = parseInt(this.ExpYear);
                var month = parseInt(this.ExpMonth);
                var expD = new Date(year, month - 1, 1);
                var tmpD = new Date();
                var thisMonth = new Date(tmpD.getFullYear(), tmpD.getMonth(), 1);
                if (expD < thisMonth) {
                    errors.push('The expiration date entered has passed.  Please check it and try again.');
                }
            }
            return errors;
        };
        CCData.prototype.Save = function () {
            var ccd = this;
            return new Promise(function (resolve, reject) {
                if (ccd.Validate().length > 0) {
                    return reject(false);
                }
                else {
                    var x = XHR.Put("./API/Pay", JSON.stringify(ccd));
                    x.then(function (response) {
                        return resolve(response.Text);
                    }, function (e) {
                        if (e.Text.toLowerCase().indexOf("message")) {
                            return reject(JSON.parse(e.Text).Message);
                        }
                        else {
                            return reject(e.Text);
                        }
                    });
                }
            });
        };
        return CCData;
    }());
    clayPay.CCData = CCData;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=CCData.js.map
var clayPay;
(function (clayPay) {
    var Charge = (function () {
        function Charge() {
            this.ItemId = 0;
            this.Description = "";
            this.TimeStampDisplay = "";
        }
        return Charge;
    }());
    clayPay.Charge = Charge;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=Charge.js.map