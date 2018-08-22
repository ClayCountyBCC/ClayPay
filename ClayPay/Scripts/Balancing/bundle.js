(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  this._state = 0;
  this._handled = false;
  this._value = undefined;
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = function(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      return constructor.resolve(callback()).then(function() {
        return constructor.reject(reason);
      });
    }
  );
};

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!arr || typeof arr.length === 'undefined')
      throw new TypeError('Promise.all accepts an array');
    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(values) {
  return new Promise(function(resolve, reject) {
    for (var i = 0, len = values.length; i < len; i++) {
      values[i].then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  (typeof setImmediate === 'function' &&
    function(fn) {
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

var globalNS = (function() {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw new Error('unable to locate global object');
})();

if (!globalNS.Promise) {
  globalNS.Promise = Promise;
}

})));

(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ]

    var isDataView = function(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    }

    var isArrayBufferView = ArrayBuffer.isView || function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1])
      }, this)
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var oldValue = this.map[name]
    this.map[name] = oldValue ? oldValue+','+value : value
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    name = normalizeName(name)
    return this.has(name) ? this.map[name] : null
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value)
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this)
      }
    }
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsArrayBuffer(blob)
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsText(blob)
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf)
    var chars = new Array(view.length)

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i])
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength)
      view.set(new Uint8Array(buf))
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (!body) {
        this._bodyText = ''
      } else if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer)
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer])
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body)
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      }
    }

    this.text = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body && input._bodyInit != null) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = String(input)
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this, { body: this._bodyInit })
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers()
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':')
      var key = parts.shift().trim()
      if (key) {
        var value = parts.join(':').trim()
        headers.append(key, value)
      }
    })
    return headers
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status === undefined ? 200 : options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = 'statusText' in options ? options.statusText : 'OK'
    this.headers = new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init)
      var xhr = new XMLHttpRequest()

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        }
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

var Utilities;
(function (Utilities) {
    function Hide(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("hide");
        e.classList.remove("show");
        e.classList.remove("show-inline");
        e.classList.remove("show-flex");
    }
    Utilities.Hide = Hide;
    function Show(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("show");
        e.classList.remove("hide");
        e.classList.remove("show-inline");
        e.classList.remove("show-flex");
    }
    Utilities.Show = Show;
    function Show_Inline(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("show-inline");
        e.classList.remove("hide");
        e.classList.remove("show");
        e.classList.remove("show-flex");
    }
    Utilities.Show_Inline = Show_Inline;
    function Show_Flex(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("show-flex");
        e.classList.remove("hide");
        e.classList.remove("show-inline");
        e.classList.remove("show");
    }
    Utilities.Show_Flex = Show_Flex;
    function Error_Show(e, errorText, timeout) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        if (errorText) {
            //Set_Text(e, errorText);
            Clear_Element(e);
            var notification = document.createElement("div");
            notification.classList.add("notification");
            notification.classList.add("is-danger");
            var deleteButton = document.createElement("button");
            deleteButton.classList.add("delete");
            deleteButton.onclick = function () {
                Hide(e);
            };
            notification.appendChild(deleteButton);
            if (Array.isArray(errorText)) {
                // we're assuming that errorText is an array if we get here.
                var ul_1 = document.createElement("ul");
                errorText.forEach(function (et) {
                    var li = document.createElement("li");
                    li.appendChild(document.createTextNode(et));
                    ul_1.appendChild(li);
                });
                notification.appendChild(ul_1);
            }
            else {
                notification.appendChild(document.createTextNode(errorText));
            }
            e.appendChild(notification);
        }
        Show(e);
        if (timeout == undefined || timeout === true) {
            window.setTimeout(function (j) {
                Hide(e);
            }, 10000);
        }
    }
    Utilities.Error_Show = Error_Show;
    function Clear_Element(node) {
        if (node === null || node === undefined)
            return;
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }
    Utilities.Clear_Element = Clear_Element;
    function Create_Option(value, label, selected) {
        if (selected === void 0) { selected = false; }
        var o = document.createElement("option");
        o.value = value;
        o.text = label;
        o.selected = selected;
        return o;
    }
    Utilities.Create_Option = Create_Option;
    function Get_Value(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        return e.value;
    }
    Utilities.Get_Value = Get_Value;
    function Set_Value(e, value) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.value = value;
    }
    Utilities.Set_Value = Set_Value;
    function Set_Text(e, value) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        Clear_Element(e);
        e.appendChild(document.createTextNode(value));
    }
    Utilities.Set_Text = Set_Text;
    function Show_Menu(elementId) {
        //let element = e.srcElement;
        // we expect the element's id to be in a "nav-XXX" name format, where 
        // XXX is the element we want to show 
        var id = elementId.replace("nav-", "");
        var menuItems = document.querySelectorAll("#menuTabs > li > a");
        if (menuItems.length > 0) {
            for (var i = 0; i < menuItems.length; i++) {
                var item = menuItems.item(i);
                if (item.id === elementId) {
                    item.parentElement.classList.add("is-active");
                }
                else {
                    item.parentElement.classList.remove("is-active");
                }
            }
        }
        Show_Hide_Selector("#views > section", id);
    }
    Utilities.Show_Menu = Show_Menu;
    function Show_Hide_Selector(selector, id) {
        var sections = document.querySelectorAll(selector);
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                if (item.id === id) {
                    Show(item);
                }
                else {
                    Hide(item);
                }
            }
        }
    }
    Utilities.Show_Hide_Selector = Show_Hide_Selector;
    function Get(url) {
        return fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json" //,"Upgrade-Insecure-Requests": "1"
            },
            cache: "no-cache",
            credentials: "include"
        })
            .then(function (response) {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        });
    }
    Utilities.Get = Get;
    function Post(url, data) {
        return fetch(url, {
            method: "POST",
            body: JSON.stringify(data),
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        }).then(function (response) {
            console.log('Post Response', response);
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        });
    }
    Utilities.Post = Post;
    function Format_Amount(amount) {
        return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
    Utilities.Format_Amount = Format_Amount;
    function Format_Date(date) {
        if (date instanceof Date) {
            return date.toLocaleDateString('en-us');
        }
        return new Date(date).toLocaleString('en-US');
    }
    Utilities.Format_Date = Format_Date;
    function Validate_Text(e, errorElementId, errorText) {
        // this should only be used for required elements.
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        var ele = e;
        ele.tagName.toLowerCase() === "select" ? ele.parentElement.classList.remove("is-danger") : ele.classList.remove("is-danger");
        var v = Get_Value(ele).trim();
        if (v.length == 0) {
            ele.tagName.toLowerCase() === "select" ? ele.parentElement.classList.add("is-danger") : ele.classList.add("is-danger");
            Error_Show(errorElementId, errorText);
            ele.focus();
            ele.scrollTo();
            return "";
        }
        return v;
    }
    Utilities.Validate_Text = Validate_Text;
    function Toggle_Loading_Button(e, disabled) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        var b = e;
        b.disabled = disabled;
        b.classList.toggle("is-loading", disabled);
    }
    Utilities.Toggle_Loading_Button = Toggle_Loading_Button;
    function Create_Menu_Element(menuItem) {
        var li = document.createElement("li");
        if (menuItem.selected)
            li.classList.add("is-active");
        var a = document.createElement("a");
        a.id = menuItem.id;
        a.href = "#";
        a.onclick = function () {
            Update_Menu(menuItem);
            //let title = document.getElementById("menuTitle");
            //let subTitle = document.getElementById("menuSubTitle");
            //Utilities.Clear_Element(title);
            //Utilities.Clear_Element(subTitle);
            //title.appendChild(document.createTextNode(menuItem.title));
            //subTitle.appendChild(document.createTextNode(menuItem.subTitle));
            //Utilities.Show_Menu(menuItem.id);
        };
        if (menuItem.icon.length > 0) {
            var span = document.createElement("span");
            span.classList.add("icon");
            span.classList.add("is-medium");
            var i = document.createElement("i");
            var icons = menuItem.icon.split(" ");
            for (var _i = 0, icons_1 = icons; _i < icons_1.length; _i++) {
                var icon = icons_1[_i];
                i.classList.add(icon);
            }
            span.appendChild(i);
            a.appendChild(span);
        }
        a.appendChild(document.createTextNode(menuItem.label));
        li.appendChild(a);
        return li;
    }
    Utilities.Create_Menu_Element = Create_Menu_Element;
    function Update_Menu(menuItem) {
        Set_Text("menuTitle", menuItem.title);
        Set_Text("menuSubTitle", menuItem.subTitle);
        Show_Menu(menuItem.id);
    }
    Utilities.Update_Menu = Update_Menu;
    //private static BuildFancyLevelItem(label: string, value: string): HTMLElement
    //{
    //  let Container = document.createElement("div");
    //  let innerContainer = document.createElement("div");
    //  Container.classList.add("level-item");
    //  Container.classList.add("has-text-centered");
    //  let Label = document.createElement("p");
    //  Label.classList.add("heading");
    //  Label.appendChild(document.createTextNode(label));
    //  let Value = document.createElement("p");
    //  Value.classList.add("title");
    //  Value.appendChild(document.createTextNode(value));
    //  innerContainer.appendChild(Label);
    //  innerContainer.appendChild(Value);
    //  Container.appendChild(innerContainer);
    //  return Container;
    //}
    function CheckBrowser() {
        var browser = "";
        if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) {
            browser = 'Opera';
        }
        else if (navigator.userAgent.indexOf("Chrome") != -1) {
            browser = 'Chrome';
        }
        else if (navigator.userAgent.indexOf("Safari") != -1) {
            browser = 'Safari';
        }
        else if (navigator.userAgent.indexOf("Firefox") != -1) {
            browser = 'Firefox';
        }
        else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.DOCUMENT_NODE == true)) //IF IE > 10
         {
            browser = 'IE';
        }
        else {
            browser = 'unknown';
        }
        return browser;
    }
    Utilities.CheckBrowser = CheckBrowser;
})(Utilities || (Utilities = {}));
//# sourceMappingURL=Utilities.js.map
var clayPay;
(function (clayPay) {
    var ChargeView;
    (function (ChargeView) {
        ChargeView[ChargeView["search_results"] = 0] = "search_results";
        ChargeView[ChargeView["cart"] = 1] = "cart";
        ChargeView[ChargeView["receipt"] = 2] = "receipt";
    })(ChargeView = clayPay.ChargeView || (clayPay.ChargeView = {}));
    var Charge = /** @class */ (function () {
        function Charge() {
            this.ItemId = 0;
            this.Description = "";
            this.TimeStampDisplay = "";
        }
        Charge.CreateTable = function (view) {
            var table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            var thead = document.createElement("THEAD");
            var tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableHeaderElement("Key", "20%"));
            if (view !== ChargeView.receipt) {
                tr.appendChild(clayPay.UI.createTableHeaderElement("Description", "40%"));
                tr.appendChild(clayPay.UI.createTableHeaderElement("Date", "15%"));
                tr.appendChild(clayPay.UI.createTableHeaderElement("Amount", "15%"));
                tr.appendChild(clayPay.UI.createTableHeaderElement("", "10%"));
            }
            else {
                tr.appendChild(clayPay.UI.createTableHeaderElement("Description", "50%"));
                tr.appendChild(clayPay.UI.createTableHeaderElement("Amount", "30%"));
            }
            thead.appendChild(tr);
            table.appendChild(thead);
            return table;
        };
        Charge.CreateChargesTable = function (charges, view) {
            var df = document.createDocumentFragment();
            var table = Charge.CreateTable(view);
            var tbody = document.createElement("TBODY");
            charges.forEach(function (charge) {
                tbody.appendChild(Charge.buildChargeRow(charge, view));
            });
            var tfoot = document.createElement("TFOOT");
            tfoot.appendChild(Charge.buildChargeFooterRow(charges, view));
            table.appendChild(tbody);
            table.appendChild(tfoot);
            df.appendChild(table);
            return df;
        };
        Charge.buildChargeFooterRow = function (charges, view) {
            // Based on ChargeView:
            // Search Results Footer should show: 
            //  1. Total Charges
            //  2. Add All Charges To Cart
            //  3. View Cart
            // Cart Footer should show:
            //  1. Total Charges
            //  2. Convenience Fee
            // Receipt Footer should show:
            //  1. Total Charges
            var df = document.createDocumentFragment();
            var trTotal = document.createElement("tr");
            trTotal.appendChild(clayPay.UI.createTableElement("", "", view === ChargeView.receipt ? 1 : 2));
            trTotal.appendChild(clayPay.UI.createTableElement("Total", "has-text-weight-bold has-text-right", 1));
            var TotalAmount = charges.reduce(function (total, b) {
                return total + b.Total;
            }, 0);
            trTotal.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(TotalAmount), ""));
            if (view === ChargeView.search_results) {
                trTotal.appendChild(Charge.createAddAllChargesToCartButton());
            }
            else {
                if (view !== ChargeView.receipt) {
                    trTotal.appendChild(clayPay.UI.createTableElement("", "", 1));
                }
            }
            df.appendChild(trTotal);
            switch (view) {
                case ChargeView.search_results:
                    // Add View Cart button
                    df.appendChild(Charge.createViewCartFooterRow());
                    break;
                case ChargeView.cart:
                    // Show Convenience Fee
                    clayPay.CurrentTransaction.TotalAmountDue = TotalAmount;
                    clayPay.CurrentTransaction.UpdateTotals();
                    df.appendChild(Charge.buildConvFeeFooterRow());
                    break;
            }
            return df;
        };
        Charge.buildConvFeeFooterRow = function () {
            var tr = document.createElement("tr");
            tr.style.fontWeight = "bolder";
            tr.appendChild(clayPay.UI.createTableElement("There is a nonrefundable transaction fee charged for Credit Card Payments by our payment provider. This is charged in addition to the total above.", "", 2));
            tr.appendChild(clayPay.UI.createTableElement("Conv. Fee", "center", 1));
            tr.appendChild(clayPay.UI.createTableElement(clayPay.ConvenienceFee, "", 1));
            tr.appendChild(clayPay.UI.createTableElement("", "", 1));
            return tr;
        };
        Charge.buildChargeRow = function (charge, view) {
            var tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableElement(charge.AssocKey));
            tr.appendChild(clayPay.UI.createTableElement(charge.Description, "left"));
            if (view !== ChargeView.receipt) {
                tr.appendChild(clayPay.UI.createTableElement(charge.TimeStampDisplay, "center"));
            }
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(charge.Total), "center"));
            if (view !== ChargeView.receipt) {
                tr.appendChild(Charge.createChargeCartButtonToggle("Add to Cart", charge.ItemId, "center", true));
            }
            return tr;
        };
        Charge.createAddAllChargesToCartButton = function () {
            var td = document.createElement("td");
            var button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-primary");
            button.appendChild(document.createTextNode("Add All To Cart"));
            button.onclick = function (ev) {
                for (var _i = 0, _a = clayPay.CurrentTransaction.CurrentCharges; _i < _a.length; _i++) {
                    var charge = _a[_i];
                    if (!clayPay.UI.IsItemInCart(charge.ItemId)) {
                        clayPay.CurrentTransaction.Cart.push(charge);
                    }
                }
                clayPay.UI.updateCart();
                // we're going to rerun the "Create Table" so that it'll 
                // update each row
                clayPay.UI.ProcessSearchResults(clayPay.CurrentTransaction.CurrentCharges);
                //AddCharges(clayPay.CurrentTransaction.CurrentCharges);
            };
            td.appendChild(button);
            return td;
        };
        Charge.createChargeCartButtonToggle = function (value, itemId, className, toggle) {
            var removeButton = document.createElement("a");
            var remove = document.createElement("div");
            var addButton = document.createElement("button");
            var IsInCart = clayPay.UI.IsItemInCart(itemId);
            var d = document.createElement("td");
            d.className = className;
            addButton.style.display = IsInCart ? "none" : "inline-block";
            addButton.type = "button";
            addButton.className = "button is-primary";
            addButton.onclick = function (ev) {
                var item = clayPay.CurrentTransaction.CurrentCharges.filter(function (c) {
                    return c.ItemId == itemId;
                });
                if (item.length === 1 && clayPay.CurrentTransaction.Cart.indexOf(item[0]) === -1) {
                    clayPay.CurrentTransaction.Cart.push(item[0]);
                }
                remove.style.display = "inline-block";
                addButton.style.display = "none";
                clayPay.UI.updateCart();
            };
            remove.style.display = IsInCart ? "inline-block" : "none";
            remove.appendChild(document.createTextNode('Added ('));
            removeButton.classList.add("is-warning");
            removeButton.style.cursor = "pointer";
            removeButton.appendChild(document.createTextNode('remove'));
            removeButton.onclick = function (ev) {
                var newCart = clayPay.CurrentTransaction.Cart.filter(function (c) {
                    return c.ItemId !== itemId;
                });
                clayPay.CurrentTransaction.Cart = newCart;
                clayPay.UI.updateCart();
                remove.style.display = "none";
                addButton.style.display = "inline-block";
            };
            remove.appendChild(removeButton);
            remove.appendChild(document.createTextNode(')'));
            addButton.appendChild(document.createTextNode(value));
            d.appendChild(addButton);
            d.appendChild(remove);
            return d;
        };
        Charge.createViewCartFooterRow = function () {
            var tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableElement("", "", 4));
            var td = document.createElement("td");
            var button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-success");
            button.onclick = function (ev) {
                var menulist = clayPay.UI.Menus.filter(function (j) { return j.id === "nav-cart"; });
                var cartMenu = menulist[0];
                var title = document.getElementById("menuTitle");
                var subTitle = document.getElementById("menuSubTitle");
                Utilities.Clear_Element(title);
                Utilities.Clear_Element(subTitle);
                title.appendChild(document.createTextNode(cartMenu.title));
                subTitle.appendChild(document.createTextNode(cartMenu.subTitle));
                Utilities.Show_Menu(cartMenu.id);
            };
            button.appendChild(document.createTextNode("View Cart"));
            td.appendChild(button);
            tr.appendChild(td);
            return tr;
        };
        return Charge;
    }());
    clayPay.Charge = Charge;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=Charge.js.map
var clayPay;
(function (clayPay) {
    var ReceiptPayment = /** @class */ (function () {
        function ReceiptPayment() {
            this.CashierId = "";
            this.PayId = -1;
            this.OTId = -1;
            this.Info = "";
            this.TransactionDate = new Date();
            this.PaymentType = "";
            this.PaymentTypeDescription = "";
            this.AmountApplied = -1;
            this.AmountTendered = -1;
            this.ChangeDue = -1;
            this.ConvenienceFeeAmount = -1;
            this.CheckNumber = "";
            this.TransactionId = "";
        }
        ReceiptPayment.CreateReceiptPaymentView = function (receipts, IsEditable) {
            var df = document.createDocumentFragment();
            var table = ReceiptPayment.CreateTable();
            var tbody = document.createElement("TBODY");
            for (var _i = 0, receipts_1 = receipts; _i < receipts_1.length; _i++) {
                var receipt = receipts_1[_i];
                var transaction = receipt.CheckNumber.length > 0 ? receipt.CheckNumber : receipt.TransactionId;
                if (IsEditable) {
                    switch (receipt.PaymentTypeDescription.toLowerCase()) {
                        case "cash":
                            tbody.appendChild(ReceiptPayment.BuildCashPaymentRow(receipt));
                            break;
                        case "check":
                            tbody.appendChild(ReceiptPayment.BuildCheckPaymentRow(receipt));
                            break;
                        default:
                            tbody.appendChild(ReceiptPayment.BuildPaymentRow(receipt.PaymentTypeDescription, receipt.Info, transaction, receipt.AmountTendered, receipt.AmountApplied));
                    }
                }
                else {
                    tbody.appendChild(ReceiptPayment.BuildPaymentRow(receipt.PaymentTypeDescription, receipt.Info, transaction, receipt.AmountTendered, receipt.AmountApplied));
                }
            }
            // Here we handle Change Due and Convenience fees.
            // We'll add a row for each of them that are > 0
            var changeDueTmp = receipts.filter(function (j) { return j.ChangeDue > 0; });
            var TotalChangeDue = changeDueTmp.reduce(function (ChangeDue, b) {
                return ChangeDue + b.ChangeDue;
            }, 0);
            if (TotalChangeDue > 0) {
                tbody.appendChild(ReceiptPayment.BuildPaymentRow("Total Change Due", "", "", TotalChangeDue, 0));
            }
            var convenienceFeeTmp = receipts.filter(function (j) { return j.ConvenienceFeeAmount > 0; });
            var TotalConvenienceFee = convenienceFeeTmp.reduce(function (ConvenienceFeeAmount, b) {
                return ConvenienceFeeAmount + b.ConvenienceFeeAmount;
            }, 0);
            if (TotalConvenienceFee > 0) {
                tbody.appendChild(ReceiptPayment.BuildPaymentRow("Convenience Fee Estimate", "", "", TotalConvenienceFee, 0));
            }
            table.appendChild(tbody);
            df.appendChild(table);
            return df;
        };
        ReceiptPayment.CreateTable = function () {
            var table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            var thead = document.createElement("THEAD");
            var tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableHeaderElement("Payment Type", "15%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Info", "35%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Check/Trans#", "20%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Tendered", "15%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Applied", "15%"));
            thead.appendChild(tr);
            table.appendChild(thead);
            return table;
        };
        ReceiptPayment.BuildPaymentRow = function (paymentType, info, checkNumber, tendered, applied) {
            var tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableElement(paymentType));
            tr.appendChild(clayPay.UI.createTableElement(info));
            tr.appendChild(clayPay.UI.createTableElement(checkNumber));
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(tendered)));
            if (paymentType === "Convenience Fee Estimate") {
                tr.appendChild(clayPay.UI.createTableElement(""));
            }
            else {
                tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(applied)));
            }
            return tr;
        };
        ReceiptPayment.BuildCashPaymentRow = function (receipt) {
            var tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableElement(receipt.PaymentTypeDescription));
            tr.appendChild(clayPay.UI.createTableElement(receipt.Info));
            // where the check number goes we're going to put a button labeled: "Change to Check"
            // and if the user clicks it, the button will disappear
            // and a text box will be added with the placeholder "Check Number"
            // for the user to enter the check number, and a Save button next to it.
            // We will need to check to make sure a check number is entered before we allow saving.
            var td = document.createElement("td");
            var container = document.createElement("div");
            var fieldContainer = document.createElement("div");
            fieldContainer.classList.add("hide");
            var field = document.createElement("div");
            field.classList.add("field");
            field.classList.add("is-grouped");
            var inputControl = document.createElement("div");
            inputControl.classList.add("control");
            var input = document.createElement("input");
            input.classList.add("input");
            input.placeholder = "Enter Check Number";
            input.required = true;
            input.type = "text";
            var buttonControl = document.createElement("div");
            buttonControl.classList.add("control");
            var saveButton = document.createElement("button");
            saveButton.type = "button";
            saveButton.classList.add("button");
            saveButton.classList.add("is-success");
            saveButton.appendChild(document.createTextNode("Save"));
            saveButton.onclick = function () {
                var checkNumber = input.value;
                if (checkNumber.length === 0) {
                    alert("You must enter a check number before you can save.");
                    return;
                }
                saveButton.classList.add("is-loading");
                var changed = new ReceiptPayment();
                changed.CashierId = receipt.CashierId;
                changed.OTId = receipt.OTId;
                changed.PaymentType = "CK";
                changed.PayId = receipt.PayId;
                changed.CheckNumber = checkNumber;
                ReceiptPayment.SavePaymentChanges(changed);
            };
            var convertButton = document.createElement("button");
            convertButton.type = "button";
            convertButton.classList.add("button");
            convertButton.classList.add("is-primary");
            convertButton.appendChild(document.createTextNode("Convert To Check"));
            convertButton.onclick = function () {
                Utilities.Hide(convertButton);
                Utilities.Show(fieldContainer);
            };
            inputControl.appendChild(input);
            buttonControl.appendChild(saveButton);
            field.appendChild(inputControl);
            field.appendChild(buttonControl);
            container.appendChild(convertButton);
            fieldContainer.appendChild(field);
            container.appendChild(fieldContainer);
            td.appendChild(container);
            tr.appendChild(td);
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(receipt.AmountTendered)));
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(receipt.AmountApplied)));
            return tr;
        };
        ReceiptPayment.BuildCheckPaymentRow = function (receipt) {
            var tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableElement(receipt.PaymentTypeDescription));
            tr.appendChild(clayPay.UI.createTableElement(receipt.Info));
            var td = clayPay.UI.createTableElement(receipt.CheckNumber);
            // where the check number goes we're going to put a button labeled: "Change to Check"
            // and if the user clicks it, the button will disappear
            // and a text box will be added with the placeholder "Check Number"
            // for the user to enter the check number, and a Save button next to it.
            // We will need to check to make sure a check number is entered before we allow saving.
            var saveButton = document.createElement("button");
            saveButton.type = "button";
            saveButton.classList.add("button");
            saveButton.classList.add("is-success");
            saveButton.appendChild(document.createTextNode("Convert To Cash Payment"));
            saveButton.onclick = function () {
                saveButton.classList.add("is-loading");
                var changed = new ReceiptPayment();
                changed.CashierId = receipt.CashierId;
                changed.OTId = receipt.OTId;
                changed.PaymentType = "CA";
                changed.PayId = receipt.PayId;
                changed.CheckNumber = "";
                ReceiptPayment.SavePaymentChanges(changed);
            };
            td.appendChild(saveButton);
            tr.appendChild(td);
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(receipt.AmountTendered)));
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(receipt.AmountApplied)));
            return tr;
        };
        ReceiptPayment.SavePaymentChanges = function (receipt) {
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            var editPayment = receipt;
            Utilities.Post(path + "API/Balancing/EditPayments", editPayment)
                .then(function (cr) {
                console.log('cr returned', cr);
                if (cr.Errors.length > 0) {
                    alert("Errors occurred while attempting to save: " + cr.Errors[0]);
                    return;
                }
                clayPay.ClientResponse.BalancingSearch();
            }, function (error) {
                console.log('Save Payment Changes error', error);
            });
        };
        return ReceiptPayment;
    }());
    clayPay.ReceiptPayment = ReceiptPayment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=ReceiptPayment.js.map
var clayPay;
(function (clayPay) {
    var ClientResponse = /** @class */ (function () {
        function ClientResponse() {
            this.ResponseCashierData = new clayPay.CashierData();
            this.Charges = [];
            this.ReceiptPayments = [];
            this.TransactionId = "";
            this.IsEditable = false;
            this.Errors = []; // Errors are full stop, meaning the payment did not process.
            this.PartialErrors = []; // Partial errors mean part of the transaction was completed, but something wasn't.
        }
        ClientResponse.ShowPaymentReceipt = function (cr, target) {
            console.log('client response ShowPaymentReceipt', cr);
            var container = document.getElementById(target);
            Utilities.Clear_Element(container);
            container.appendChild(ClientResponse.CreateReceiptView(cr));
            Utilities.Show_Hide_Selector("#views > section", target);
        };
        ClientResponse.CreateReceiptView = function (cr) {
            var df = document.createDocumentFragment();
            if (cr.ReceiptPayments.length === 0)
                return df;
            df.appendChild(ClientResponse.CreateReceiptHeader(cr));
            df.appendChild(ClientResponse.CreateReceiptPayerView(cr.ResponseCashierData));
            df.appendChild(clayPay.Charge.CreateChargesTable(cr.Charges, clayPay.ChargeView.receipt));
            df.appendChild(clayPay.ReceiptPayment.CreateReceiptPaymentView(cr.ReceiptPayments, cr.IsEditable));
            // show payment info
            return df;
        };
        ClientResponse.CreateReceiptHeader = function (cr) {
            var div = document.createElement("div");
            div.classList.add("level");
            var title = document.createElement("span");
            title.classList.add("level-item");
            title.classList.add("title");
            title.appendChild(document.createTextNode("Payment Receipt for: " + cr.ReceiptPayments[0].CashierId));
            var receiptDate = document.createElement("span");
            receiptDate.classList.add("level-item");
            receiptDate.classList.add("subtitle");
            receiptDate.appendChild(document.createTextNode("Transaction Date: " + Utilities.Format_Date(cr.ResponseCashierData.TransactionDate)));
            div.appendChild(title);
            div.appendChild(receiptDate);
            var timestamp = cr.ResponseCashierData.TransactionDate;
            return div;
        };
        ClientResponse.CreateReceiptPayerView = function (cd) {
            var df = document.createDocumentFragment();
            df.appendChild(ClientResponse.CreatePayerDataColumns("Name", cd.PayerName, "Company Name", cd.PayerCompanyName));
            df.appendChild(ClientResponse.CreatePayerDataColumns("Phone Number", cd.PayerPhoneNumber, "Email Address", cd.PayerEmailAddress));
            df.appendChild(ClientResponse.CreatePayerDataColumns("Street Address", cd.PayerStreet1, "Address 2", cd.PayerStreet2));
            df.appendChild(ClientResponse.CreatePayerDataColumns("Processed By", cd.UserName, "", ""));
            return df;
        };
        ClientResponse.CreatePayerDataColumns = function (label1, value1, label2, value2) {
            var div = document.createElement("div");
            div.classList.add("columns");
            div.style.marginBottom = "0";
            div.appendChild(ClientResponse.CreatePayerData(label1, value1));
            div.appendChild(ClientResponse.CreatePayerData(label2, value2));
            return div;
        };
        ClientResponse.CreatePayerData = function (label, value) {
            var field = document.createElement("div");
            field.classList.add("field");
            field.classList.add("column");
            var dataLabel = document.createElement("label");
            dataLabel.classList.add("label");
            dataLabel.appendChild(document.createTextNode(label));
            var control = document.createElement("div");
            control.classList.add("control");
            var input = document.createElement("input");
            input.classList.add("input");
            input.classList.add("is-static");
            input.readOnly = true;
            input.type = "text";
            input.value = value;
            control.appendChild(input);
            field.appendChild(dataLabel);
            field.appendChild(control);
            return field;
        };
        ClientResponse.Search = function () {
            Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, true);
            var input = document.getElementById(ClientResponse.receiptSearchInput);
            var k = input.value.trim().toUpperCase();
            if (k.length !== 9) {
                Utilities.Error_Show(ClientResponse.receiptSearchError, "Receipts must be 8 digits and a dash, like 18-000001.");
                return;
            }
            if (k.length > 0) {
                var path = "/";
                var i = window.location.pathname.toLowerCase().indexOf("/claypay");
                if (i == 0) {
                    path = "/claypay/";
                }
                Utilities.Get(path + "API/Payments/Receipt/?CashierId=" + k).then(function (cr) {
                    console.log('Client Response', cr);
                    if (cr.Errors.length > 0) {
                        Utilities.Error_Show(ClientResponse.receiptSearchError, cr.Errors);
                    }
                    else {
                        ClientResponse.ShowPaymentReceipt(cr, ClientResponse.PaymentReceiptContainer);
                    }
                    Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, false);
                }, function (errorText) {
                    console.log('error in Receipt Search', errorText);
                    Utilities.Error_Show(ClientResponse.receiptSearchError, errorText);
                    // do something with the error here
                    // need to figure out how to detect if something wasn't found
                    // versus an error.
                    Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, false);
                });
            }
            else {
                Utilities.Error_Show(ClientResponse.receiptSearchError, "Invalid search. Please check your entry and try again.");
                input.focus();
                Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, false);
            }
        };
        ClientResponse.BalancingSearch = function (link) {
            if (link === void 0) { link = null; }
            var cashierId = Utilities.Get_Value("receiptSearch");
            var path = "/";
            var qs = "";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            //DateTime DateToBalance, string PaymentType
            qs = "?CashierId=" + cashierId;
            Utilities.Get(path + "API/Balancing/Receipt" + qs)
                .then(function (cr) {
                console.log('client response', cr);
                if (link !== null)
                    Utilities.Set_Text(link, cashierId);
                clayPay.ClientResponse.ShowPaymentReceipt(cr, Balancing.Payment.DJournalReceiptContainer);
                // need to select the right box at the top
                var menulist = Balancing.Menus.filter(function (j) { return j.id === "nav-receipts"; });
                var receiptMenu = menulist[0];
                Utilities.Update_Menu(receiptMenu);
            }, function (error) {
                console.log('error getting client response for cashier id: ' + cashierId, error);
                if (link !== null)
                    Utilities.Set_Text(link, cashierId); // change it back
            });
        };
        ClientResponse.CashierErrorTarget = "paymentError";
        ClientResponse.PublicErrorTarget = "publicPaymentError";
        ClientResponse.PaymentReceiptContainer = "receipt";
        ClientResponse.BalancingReceiptContainer = "receiptView";
        //static ReceiptErrorContainer: string = "receiptTransactionErrorContainer"; // To be used for partial payments.
        // receiptSearchElements
        ClientResponse.receiptSearchInput = "receiptSearch";
        ClientResponse.receiptSearchButton = "receiptSearchButton";
        ClientResponse.receiptSearchError = "receiptSearchError";
        return ClientResponse;
    }());
    clayPay.ClientResponse = ClientResponse;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=clientresponse.js.map
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="claypay.ts" />
var clayPay;
(function (clayPay) {
    var UI;
    (function (UI) {
        "use strict";
        UI.ExpMonths = ['01', '02', '03', '04', '05',
            '06', '07', '08', '09', '10', '11', '12'];
        UI.AllStates = [
            { state: "Select", abv: "" },
            { state: "ALABAMA", abv: "AL" },
            { state: "ALASKA", abv: "AK" },
            { state: "ARIZONA", abv: "AZ" },
            { state: "ARKANSAS", abv: "AR" },
            { state: "CALIFORNIA", abv: "CA" },
            { state: "COLORADO", abv: "CO" },
            { state: "CONNECTICUT", abv: "CT" },
            { state: "DELAWARE", abv: "DE" },
            { state: "FLORIDA", abv: "FL" },
            { state: "GEORGIA", abv: "GA" },
            { state: "HAWAII", abv: "HI" },
            { state: "IDAHO", abv: "ID" },
            { state: "ILLINOIS", abv: "IL" },
            { state: "INDIANA", abv: "IN" },
            { state: "IOWA", abv: "IA" },
            { state: "KANSAS", abv: "KS" },
            { state: "KENTUCKY", abv: "KY" },
            { state: "LOUISIANA", abv: "LA" },
            { state: "MAINE", abv: "ME" },
            { state: "MARYLAND", abv: "MD" },
            { state: "MASSACHUSETTS", abv: "MA" },
            { state: "MICHIGAN", abv: "MI" },
            { state: "MINNESOTA", abv: "MN" },
            { state: "MISSISSIPPI", abv: "MS" },
            { state: "MISSOURI", abv: "MO" },
            { state: "MONTANA", abv: "MT" },
            { state: "NEBRASKA", abv: "NE" },
            { state: "NEVADA", abv: "NV" },
            { state: "NEW HAMPSHIRE", abv: "NH" },
            { state: "NEW JERSEY", abv: "NJ" },
            { state: "NEW MEXICO", abv: "NM" },
            { state: "NEW YORK", abv: "NY" },
            { state: "NORTH CAROLINA", abv: "NC" },
            { state: "NORTH DAKOTA", abv: "ND" },
            { state: "OHIO", abv: "OH" },
            { state: "OKLAHOMA", abv: "OK" },
            { state: "OREGON", abv: "OR" },
            { state: "PENNSYLVANIA", abv: "PA" },
            { state: "RHODE ISLAND", abv: "RI" },
            { state: "SOUTH CAROLINA", abv: "SC" },
            { state: "SOUTH DAKOTA", abv: "SD" },
            { state: "TENNESSEE", abv: "TN" },
            { state: "TEXAS", abv: "TX" },
            { state: "UTAH", abv: "UT" },
            { state: "VERMONT", abv: "VT" },
            { state: "VIRGINIA", abv: "VA" },
            { state: "WASHINGTON", abv: "WA" },
            { state: "WEST VIRGINIA", abv: "WV" },
            { state: "WISCONSIN", abv: "WI" },
            { state: "WYOMING", abv: "WY" }
        ];
        UI.ExpYears = [];
        UI.Menus = [
            {
                id: "nav-Home",
                title: "Welcome!",
                subTitle: "You can use this application to easily find and pay Clay County fees.",
                icon: "fas fa-home",
                label: "Home",
                selected: true
            },
            {
                id: "nav-permitFees",
                title: "Search by Permit Number",
                subTitle: "Searching by Permit number will show you all of the unpaid fees for a given permit number.",
                icon: "fas fa-file",
                label: "Permit Fees",
                selected: false
            },
            {
                id: "nav-contractorFees",
                title: "Search by Contractor ID number",
                subTitle: "Searching by Contractor ID will list any unpaid fees for a given contractor.",
                icon: "fas fa-user",
                label: "Contractor Fees",
                selected: false
            },
            {
                id: "nav-applicationFees",
                title: "Search by Application Type and Application Number",
                subTitle: "Pick an application type and then enter an application number to see any unpaid fees associated with that application.",
                icon: "fas fa-clipboard",
                label: "Application Fees",
                selected: false
            },
            {
                id: "nav-cart",
                title: "Your Shopping Cart",
                subTitle: "Shows the charges you have added to your shopping cart. You can pay for them here.",
                icon: "fas fa-shopping-cart",
                label: "Cart",
                selected: false
            },
            {
                id: "nav-existingReceipts",
                title: "View Existing Receipts",
                subTitle: "Shows the Transaction Date, Charges Paid, and method of payment for a receipt number.",
                icon: "fas fa-file",
                label: "Receipt Search",
                selected: false
            },
        ];
        function BuildErrors(errors) {
            var errorList = document.getElementById("errorList");
            var df = document.createDocumentFragment();
            Utilities.Clear_Element(errorList);
            for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
                var error = errors_1[_i];
                var li = document.createElement("li");
                li.textContent = error;
                df.appendChild(li);
            }
            errorList.appendChild(df);
        }
        function BuildPayerStates(States, id) {
            var stateSelect = document.getElementById(id);
            if (stateSelect === undefined)
                return;
            Utilities.Clear_Element(stateSelect);
            States.forEach(function (j) {
                stateSelect.appendChild(Utilities.Create_Option(j.abv, j.state));
            });
            stateSelect.selectedIndex = 0;
        }
        UI.BuildPayerStates = BuildPayerStates;
        function BuildAppTypes(appTypes) {
            var appSelect = document.getElementById("applicationSearchType");
            Utilities.Clear_Element(appSelect);
            appSelect.appendChild(Utilities.Create_Option("-1", "Select Application Type", true));
            appTypes.forEach(function (a) {
                appSelect.appendChild(Utilities.Create_Option(a.Value, a.Label));
            });
            appSelect.selectedIndex = 0;
        }
        UI.BuildAppTypes = BuildAppTypes;
        function BuildExpMonths(id) {
            var expMonth = document.getElementById(id);
            if (expMonth === undefined)
                return;
            Utilities.Clear_Element(expMonth);
            for (var _i = 0, ExpMonths_1 = UI.ExpMonths; _i < ExpMonths_1.length; _i++) {
                var month = ExpMonths_1[_i];
                expMonth.appendChild(Utilities.Create_Option(month, month));
            }
            expMonth.selectedIndex = 0;
        }
        UI.BuildExpMonths = BuildExpMonths;
        function BuildExpYears(id) {
            var expYear = document.getElementById(id);
            Utilities.Clear_Element(expYear);
            var year = new Date().getFullYear();
            for (var i = 0; i < 10; i++) {
                var y = (year + i).toString();
                expYear.appendChild(Utilities.Create_Option(y, y));
                UI.ExpYears.push(y); // save the year we're adding for later when we do some basic validation
            }
        }
        UI.BuildExpYears = BuildExpYears;
        function Search(buttonId, inputId, errorId) {
            Utilities.Toggle_Loading_Button(buttonId, true);
            var input = document.getElementById(inputId);
            var k = input.value.trim().toUpperCase();
            if (inputId.indexOf("application") > -1) {
                // we'll need to validate the application data
                // the user needs to select a valid application type 
                // and enter a valid application number.
                var appType = document.getElementById(inputId + "Type").value;
                if (appType === "-1" || appType.length === 0) {
                    Utilities.Error_Show(errorId, "You must select an Application Type in order to search by Application Number.");
                    Utilities.Toggle_Loading_Button(buttonId, false);
                    return false;
                }
                k = appType.toUpperCase() + "-" + input.value.trim().toUpperCase();
            }
            if (k.length > 0) {
                var path = "/";
                var i = window.location.pathname.toLowerCase().indexOf("/claypay");
                if (i == 0) {
                    path = "/claypay/";
                }
                Utilities.Get(path + "API/Payments/Query/?key=" + k).then(function (charges) {
                    clayPay.CurrentTransaction.CurrentCharges = charges;
                    if (charges.length > 0) {
                        ProcessSearchResults(charges);
                        Utilities.Show("searchResults");
                    }
                    else {
                        Utilities.Error_Show(errorId, "No charges were found for search: " + k);
                    }
                    Utilities.Toggle_Loading_Button(buttonId, false);
                    return true;
                }, function (errorText) {
                    Utilities.Error_Show(errorId, errorText);
                    console.log('error getting charges');
                    // do something with the error here
                    // need to figure out how to detect if something wasn't found
                    // versus an error.
                    Utilities.Toggle_Loading_Button(buttonId, false);
                    return false;
                });
            }
            else {
                Utilities.Error_Show(errorId, "Invalid search. Please check your entry and try again.");
                input.focus();
                Utilities.Toggle_Loading_Button(buttonId, false);
                return false;
            }
        }
        UI.Search = Search;
        function ProcessSearchResults(charges) {
            var container = document.getElementById('Charges');
            Utilities.Clear_Element(container);
            container.appendChild(clayPay.Charge.CreateChargesTable(charges, clayPay.ChargeView.search_results));
            Utilities.Set_Text('ChargesKey', charges[0].AssocKey);
            Utilities.Set_Text('ChargesDetail', charges[0].Detail);
        }
        UI.ProcessSearchResults = ProcessSearchResults;
        function IsItemInCart(itemId) {
            var item = clayPay.CurrentTransaction.Cart.filter(function (c) {
                return c.ItemId == itemId;
            });
            return item.length !== 0;
        }
        UI.IsItemInCart = IsItemInCart;
        //export function AddAllItemsToCart(): void
        //{
        //  for (let charge of clayPay.CurrentTransaction.CurrentCharges)
        //  {
        //    if (!IsItemInCart(charge.ItemId))
        //    {
        //      clayPay.CurrentTransaction.Cart.push(charge);
        //    }
        //  }
        //  updateCart();
        //  // we're going to rerun the "Create Table" so that it'll 
        //  // update each row
        //  ProcessSearchResults(clayPay.CurrentTransaction.CurrentCharges);
        //  //AddCharges(clayPay.CurrentTransaction.CurrentCharges);
        //}
        function createTableHeaderElement(value, width) {
            var th = document.createElement("th");
            th.width = width;
            th.appendChild(document.createTextNode(value));
            return th;
        }
        UI.createTableHeaderElement = createTableHeaderElement;
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
        UI.createTableElement = createTableElement;
        function createTableElementButton(value, itemId, className, toggle, addOnClickFunction, removeOnClickFunction) {
            var IsInCart = IsItemInCart(itemId);
            var d = document.createElement("td");
            d.className = className;
            var add = document.createElement("button");
            add.style.display = IsInCart ? "none" : "inline-block";
            add.type = "button";
            add.id = "btnAdd" + itemId.toString();
            add.className = "button is-primary";
            add.onclick = function (ev) {
                addOnClickFunction(ev, itemId);
            };
            var remove = document.createElement("div");
            remove.id = "btnRemove" + itemId.toString();
            remove.style.display = IsInCart ? "inline-block" : "none";
            remove.appendChild(document.createTextNode('Added ('));
            var removeButton = document.createElement("a");
            //removeButton
            removeButton.classList.add("is-warning");
            //removeButton.style.color = "darkgoldenrod";
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
        UI.createTableElementButton = createTableElementButton;
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
        function updateCartNav() {
            // This function is going to take the contents of the Cart array and 
            // update the CartNav element.
            // it's also going to make some changes to the cart Div, 
            // specifically it's going to hide and unhide the CartEmpty Div
            // based on the size of the array.
            var CartNav = document.getElementById('nav-cart-total');
            // emptyCart / fullCart is used when displaying the Cart
            // if there are no charges, we show emptyCart.
            // if there are charges, we show fullCart.
            var emptyCart = document.getElementById("emptyCart");
            var fullCart = document.getElementById("fullCart");
            var payerData = document.getElementById("payerData");
            var paymentData = document.getElementById("paymentData");
            Utilities.Hide(emptyCart);
            Utilities.Hide(fullCart);
            Utilities.Hide(payerData);
            //Utilities.Hide(paymentData);
            //Utilities.Show()
            Utilities.Clear_Element(CartNav);
            if (clayPay.CurrentTransaction.Cart.length === 0) {
                CartNav.appendChild(document.createTextNode("(empty)"));
                Utilities.Show(emptyCart);
            }
            else {
                var cartLength = clayPay.CurrentTransaction.Cart.length;
                CartNav.appendChild(document.createTextNode(+cartLength.toString() + (cartLength === 1 ? ' item' : ' items')));
                Utilities.Show(fullCart);
                Utilities.Show(payerData);
                //Utilities.Show(paymentData);
            }
        }
        function updateCart() {
            var CartCharges = document.getElementById('fullCart');
            Utilities.Clear_Element(CartCharges);
            //let df = document.createDocumentFragment();
            //for (let charge of clayPay.CurrentTransaction.Cart)
            //{
            //  df.appendChild(buildCartRow(charge));
            //}
            //df.appendChild(buildCartFooterRow());
            //df.appendChild(buildCartConvFeeFooterRow());
            //CartCharges.appendChild(df);
            CartCharges.appendChild(clayPay.Charge.CreateChargesTable(clayPay.CurrentTransaction.Cart, clayPay.ChargeView.cart));
            updateCartNav();
        }
        UI.updateCart = updateCart;
        function buildMenuElements(IsCashier) {
            var menu = document.getElementById("menuTabs");
            for (var _i = 0, Menus_1 = UI.Menus; _i < Menus_1.length; _i++) {
                var menuItem = Menus_1[_i];
                if (IsCashier) {
                    menu.appendChild(Utilities.Create_Menu_Element(menuItem));
                }
                else {
                    if (menuItem.id !== "nav-existingReceipts") {
                        menu.appendChild(Utilities.Create_Menu_Element(menuItem));
                    }
                }
            }
            createNavCart();
        }
        UI.buildMenuElements = buildMenuElements;
        function createNavCart() {
            var cart = document.getElementById("nav-cart");
            var cartTotal = document.createElement("span");
            cartTotal.id = "nav-cart-total";
            cartTotal.style.fontSize = "larger";
            cartTotal.style.fontWeight = "bolder";
            cartTotal.style.paddingLeft = "1em";
            cartTotal.appendChild(document.createTextNode("(empty)"));
            cart.appendChild(cartTotal);
        }
    })(UI = clayPay.UI || (clayPay.UI = {}));
})(clayPay || (clayPay = {}));
//# sourceMappingURL=ui.js.map
var Balancing;
(function (Balancing) {
    var CashierDetailData = /** @class */ (function () {
        function CashierDetailData() {
        }
        CashierDetailData.BuildCashierDataTable = function (cdd) {
            var df = document.createDocumentFragment();
            var table = document.createElement("table"); //<HTMLTableElement>
            table.classList.add("pagebreak");
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            table.style.marginTop = "1em";
            table.style.marginBottom = "1em";
            table.appendChild(CashierDetailData.BuildTableHeader());
            var tbody = document.createElement("tbody");
            for (var _i = 0, cdd_1 = cdd; _i < cdd_1.length; _i++) {
                var cd = cdd_1[_i];
                tbody.appendChild(CashierDetailData.BuildTableRow(cd));
            }
            table.appendChild(tbody);
            df.appendChild(table);
            return df;
        };
        CashierDetailData.BuildTableHeader = function () {
            var thead = document.createElement("thead");
            var tr = document.createElement("tr");
            tr.appendChild(CashierDetailData.CreateTableCell("th", "CashierId", "10%", "has-text-centered"));
            tr.appendChild(CashierDetailData.CreateTableCell("th", "Date", "15%", "has-text-centered"));
            tr.appendChild(CashierDetailData.CreateTableCell("th", "Name", "15%", "has-text-centered"));
            tr.appendChild(CashierDetailData.CreateTableCell("th", "Amount", "5%", "has-text-centered"));
            tr.appendChild(CashierDetailData.CreateTableCell("th", "Type", "5%", "has-text-centered"));
            tr.appendChild(CashierDetailData.CreateTableCell("th", "Ck/Trans#", "10%", "has-text-centered"));
            tr.appendChild(CashierDetailData.CreateTableCell("th", "Info", "25%", "has-text-centered"));
            tr.appendChild(CashierDetailData.CreateTableCell("th", "Key", "10%", "has-text-centered"));
            tr.appendChild(CashierDetailData.CreateTableCell("th", "Charge", "5%", "has-text-centered"));
            thead.appendChild(tr);
            return thead;
        };
        CashierDetailData.BuildTableRow = function (data) {
            var tr = document.createElement("tr");
            tr.appendChild(CashierDetailData.CreateTableCell("td", data.CashierId));
            tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Date(data.TransactionDate), "10%", "has-text-centered"));
            tr.appendChild(CashierDetailData.CreateTableCell("td", data.Name, "", "has-text-left"));
            tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Amount(data.AmountApplied), "", "has-text-right"));
            tr.appendChild(CashierDetailData.CreateTableCell("td", data.PaymentType));
            var trans = data.CheckNumber.length > 0 ? data.CheckNumber : data.TransactionNumber;
            tr.appendChild(CashierDetailData.CreateTableCell("td", trans));
            tr.appendChild(CashierDetailData.CreateTableCell("td", data.Info));
            tr.appendChild(CashierDetailData.CreateTableCell("td", data.AssocKey));
            tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Amount(data.ChargeTotal), "", "has-text-right"));
            return tr;
        };
        CashierDetailData.CreateTableCell = function (type, value, width, className) {
            if (width === void 0) { width = ""; }
            if (className === void 0) { className = "has-text-centered"; }
            var cell = document.createElement(type);
            if (width.length > 0)
                cell.width = width;
            if (className.length > 0)
                cell.classList.add(className);
            cell.appendChild(document.createTextNode(value));
            return cell;
        };
        return CashierDetailData;
    }());
    Balancing.CashierDetailData = CashierDetailData;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=CashierDetailData.js.map
var Balancing;
(function (Balancing) {
    var AssignedOnlinePayment = /** @class */ (function () {
        function AssignedOnlinePayment() {
            this.CashierId = "";
            this.AmountApplied = 0;
            this.AssignedTo = "";
        }
        AssignedOnlinePayment.GetAndDisplay = function () {
            var container = document.getElementById(AssignedOnlinePayment.OnlinePaymentsContainer);
            Utilities.Clear_Element(container);
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            Utilities.Get(path + "API/Balancing/UnassignedPayments").then(function (payments) {
                console.log('assigned online payments', payments);
                if (payments.length === 0) {
                    container.appendChild(document.createTextNode("No payments found, please check again later."));
                    return;
                }
                container.appendChild(AssignedOnlinePayment.BuildTable(payments));
            }, function (error) {
                console.log('error', error);
                Utilities.Error_Show(container, error, false);
            });
        };
        AssignedOnlinePayment.AssignAndDisplay = function (cashierId) {
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            var query = "?CashierId=" + cashierId;
            Utilities.Post(path + "API/Balancing/AssignPayment" + query, null).then(function (response) {
                console.log('assigned online payments', response);
                if (response.length !== 0) {
                    alert(response);
                }
                AssignedOnlinePayment.GetAndDisplay();
            }, function (error) {
                console.log('error', error);
            });
        };
        AssignedOnlinePayment.BuildTable = function (payments) {
            var df = document.createDocumentFragment();
            var table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            table.classList.add("pagebreak");
            table.classList.add("is-bordered");
            table.appendChild(AssignedOnlinePayment.BuildTableHeader());
            var tbody = document.createElement("tbody");
            for (var _i = 0, payments_1 = payments; _i < payments_1.length; _i++) {
                var p = payments_1[_i];
                tbody.appendChild(AssignedOnlinePayment.BuildTableRow(p));
            }
            table.appendChild(tbody);
            df.appendChild(table);
            return df;
        };
        AssignedOnlinePayment.BuildTableHeader = function () {
            var thead = document.createElement("thead");
            var tr = document.createElement("tr");
            tr.appendChild(AssignedOnlinePayment.CreateTableCell("th", "CashierId", "25%"));
            tr.appendChild(AssignedOnlinePayment.CreateTableCell("th", "Date", "25%"));
            tr.appendChild(AssignedOnlinePayment.CreateTableCell("th", "Amount", "25%"));
            var th = AssignedOnlinePayment.CreateTableCell("th", "", "25%");
            var refresh = document.createElement("button");
            refresh.type = "button";
            refresh.classList.add("is-primary");
            refresh.classList.add("button");
            refresh.appendChild(document.createTextNode("Refresh"));
            refresh.onclick = function () {
                refresh.classList.add("is-loading");
                AssignedOnlinePayment.GetAndDisplay();
            };
            th.appendChild(refresh);
            tr.appendChild(th);
            thead.appendChild(tr);
            return thead;
        };
        AssignedOnlinePayment.BuildTableRow = function (payment) {
            var tr = document.createElement("tr");
            tr.appendChild(Balancing.Payment.createTableCellLink("td", payment.CashierId, "25%"));
            tr.appendChild(AssignedOnlinePayment.CreateTableCell("td", Utilities.Format_Date(payment.TransactionDate)));
            tr.appendChild(AssignedOnlinePayment.CreateTableCell("td", Utilities.Format_Amount(payment.AmountApplied), "", "has-text-right"));
            var td = AssignedOnlinePayment.CreateTableCell("td", "");
            var assign = document.createElement("button");
            assign.type = "button";
            assign.classList.add("is-primary");
            assign.classList.add("button");
            assign.appendChild(document.createTextNode("Assign to me"));
            assign.onclick = function () {
                assign.classList.add("is-loading");
                AssignedOnlinePayment.AssignAndDisplay(payment.CashierId);
            };
            td.appendChild(assign);
            tr.appendChild(td);
            return tr;
        };
        AssignedOnlinePayment.CreateTableCell = function (type, value, width, className) {
            if (width === void 0) { width = ""; }
            if (className === void 0) { className = "has-text-centered"; }
            var cell = document.createElement(type);
            if (width.length > 0)
                cell.width = width;
            if (className.length > 0)
                cell.classList.add(className);
            cell.appendChild(document.createTextNode(value));
            return cell;
        };
        AssignedOnlinePayment.OnlinePaymentsContainer = "onlinePayments";
        return AssignedOnlinePayment;
    }());
    Balancing.AssignedOnlinePayment = AssignedOnlinePayment;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=AssignedOnlinePayment.js.map
var Balancing;
(function (Balancing) {
    var Account = /** @class */ (function () {
        function Account() {
            this.Fund = "";
            this.AccountNumber = "";
            this.Project = "";
            this.ProjectAccount = "";
            this.Total = "";
            this.CashAccount = "";
        }
        Account.BuildGLAccountTotals = function (accounts) {
            var df = document.createDocumentFragment();
            var table = document.createElement("table"); //<HTMLTableElement>
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            table.classList.add("print-with-no-border");
            table.style.marginTop = "1em";
            table.style.marginBottom = "1em";
            table.appendChild(Account.BuildGLAccountHeader());
            var tbody = document.createElement("tbody");
            for (var _i = 0, accounts_1 = accounts; _i < accounts_1.length; _i++) {
                var account = accounts_1[_i];
                tbody.appendChild(Account.BuildGLAccountRow(account));
            }
            table.appendChild(tbody);
            df.appendChild(table);
            return df;
        };
        Account.BuildGLAccountHeader = function () {
            var thead = document.createElement("thead");
            var tr = document.createElement("tr");
            tr.appendChild(Account.CreateTableCell("th", "FUND", "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("th", "Account", "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("th", "Total", "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("th", "Cash Account", "25%", "has-text-centered"));
            thead.appendChild(tr);
            return thead;
        };
        Account.BuildGLAccountRow = function (account) {
            var tr = document.createElement("tr");
            tr.appendChild(Account.CreateTableCell("td", account.Fund, "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("td", account.AccountNumber, "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("td", account.Total, "25%", "has-text-right"));
            tr.appendChild(Account.CreateTableCell("td", account.CashAccount, "25%", "has-text-centered"));
            return tr;
        };
        Account.CreateTableCell = function (type, value, width, className) {
            if (className === void 0) { className = ""; }
            var cell = document.createElement(type);
            cell.width = width;
            if (className.length > 0)
                cell.classList.add(className);
            cell.appendChild(document.createTextNode(value));
            return cell;
        };
        return Account;
    }());
    Balancing.Account = Account;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=Account.js.map
var Balancing;
(function (Balancing) {
    var CashierTotal = /** @class */ (function () {
        function CashierTotal() {
            this.Type = "";
            this.Code = "";
            this.TotalAmount = 0;
        }
        return CashierTotal;
    }());
    Balancing.CashierTotal = CashierTotal;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=CashierTotal.js.map
var Balancing;
(function (Balancing) {
    var Payment = /** @class */ (function () {
        function Payment() {
        }
        Payment.ShowPayments = function (payments, paymentType, paymentDate) {
            var paymentContainer = document.getElementById(Balancing.Payment.PaymentsContainer);
            Utilities.Clear_Element(paymentContainer);
            var df = document.createDocumentFragment();
            df.appendChild(Balancing.Payment.CreatePaymentTable(payments, paymentType, paymentDate));
            paymentContainer.appendChild(df);
        };
        Payment.CreatePaymentTable = function (payments, paymentType, paymentDate) {
            var table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            // Add Level showing Payment Type / Payment Date / Close button
            table.appendChild(Balancing.Payment.createPaymentTableHeader(paymentType, paymentDate));
            var tbody = document.createElement("tbody");
            // Table with payment info
            for (var _i = 0, payments_1 = payments; _i < payments_1.length; _i++) {
                var p = payments_1[_i];
                var tr = document.createElement("tr");
                tr.appendChild(Balancing.Payment.createTableCellLink("td", p.CashierId, "20%"));
                tr.appendChild(Balancing.Payment.createTableCell("td", p.Name, "40%"));
                tr.appendChild(Balancing.Payment.createTableCell("td", Utilities.Format_Date(p.TransactionDate), "25%"));
                var amount = Balancing.Payment.createTableCell("td", Utilities.Format_Amount(p.Total), "15%");
                amount.classList.add("has-text-right");
                tr.appendChild(amount);
                tbody.appendChild(tr);
            }
            table.appendChild(tbody);
            // Show close button
            table.appendChild(Balancing.Payment.createPaymentTableFooter());
            return table;
        };
        Payment.CreateCloseButton = function () {
            var button = document.createElement("button");
            button.type = "button";
            button.classList.add("is-primary");
            button.classList.add("button");
            button.onclick = function () {
                Utilities.Hide(Balancing.Payment.PaymentsContainer);
                Utilities.Show(Balancing.Payment.DJournalTotalsContainer);
            };
            button.appendChild(document.createTextNode("Close"));
            return button;
        };
        Payment.createPaymentTableHeader = function (paymentType, paymentDate) {
            var thead = document.createElement("THEAD");
            var trTitle = document.createElement("tr");
            var paymentTypeHeader = document.createElement("th");
            paymentTypeHeader.colSpan = 2;
            paymentTypeHeader.appendChild(document.createTextNode(paymentType + " Payments"));
            paymentTypeHeader.classList.add("has-text-centered");
            paymentTypeHeader.style.verticalAlign = "middle";
            var paymentDateHeader = document.createElement("th");
            paymentDateHeader.classList.add("has-text-centered");
            paymentDateHeader.appendChild(document.createTextNode(paymentDate));
            paymentDateHeader.style.verticalAlign = "middle";
            var closeButtonHeader = document.createElement("th");
            closeButtonHeader.classList.add("has-text-centered");
            closeButtonHeader.appendChild(Balancing.Payment.CreateCloseButton());
            trTitle.appendChild(paymentTypeHeader);
            trTitle.appendChild(paymentDateHeader);
            trTitle.appendChild(closeButtonHeader);
            thead.appendChild(trTitle);
            var tr = document.createElement("tr");
            tr.appendChild(Balancing.Payment.createTableCell("th", "Cashier Id", "20%"));
            tr.appendChild(Balancing.Payment.createTableCell("th", "Name", "40%"));
            tr.appendChild(Balancing.Payment.createTableCell("th", "Transaction Date", "25%"));
            var total = Balancing.Payment.createTableCell("th", "Total", "15%", "has-text-right");
            tr.appendChild(total);
            thead.appendChild(tr);
            return thead;
        };
        Payment.createPaymentTableFooter = function () {
            var tfoot = document.createElement("TFOOT");
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            td.colSpan = 3;
            var closeButton = document.createElement("td");
            closeButton.classList.add("has-text-centered");
            closeButton.appendChild(Balancing.Payment.CreateCloseButton());
            tr.appendChild(td);
            tr.appendChild(closeButton);
            tfoot.appendChild(tr);
            return tfoot;
        };
        Payment.createTableCell = function (type, value, width, className) {
            if (className === void 0) { className = ""; }
            var cell = document.createElement(type);
            cell.width = width;
            if (className.length > 0)
                cell.classList.add(className);
            cell.appendChild(document.createTextNode(value));
            return cell;
        };
        Payment.createTableCellLink = function (type, value, width) {
            var cell = document.createElement(type);
            cell.width = width;
            var link = document.createElement("a");
            link.onclick = function () {
                Utilities.Set_Text(link, "loading...");
                Utilities.Set_Value("receiptSearch", value);
                clayPay.ClientResponse.BalancingSearch(link);
            };
            link.appendChild(document.createTextNode(value));
            cell.appendChild(link);
            return cell;
        };
        Payment.PaymentsContainer = "djournalPaymentsByType";
        Payment.DJournalTotalsContainer = "djournalTotals";
        Payment.DJournalReceiptContainer = "receiptView";
        return Payment;
    }());
    Balancing.Payment = Payment;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=Payment.js.map
var Balancing;
(function (Balancing) {
    var DJournal = /** @class */ (function () {
        function DJournal() {
            this.ProcessedPaymentTotals = [];
            this.GUTotals = [];
            this.GLAccountTotals = [];
            this.Log = new Balancing.DJournalLog();
            this.Error = [];
            this.DJournalDate = new Date();
            this.DJournalDateFormatted = "";
            this.CanDJournalBeFinalized = false;
            this.CashierData = [];
        }
        DJournal.ToggleButtons = function (toggle) {
            Utilities.Toggle_Loading_Button(DJournal.DJournalSearchDateButton, toggle);
            //Utilities.Toggle_Loading_Button(DJournal.DJournalSearchNextDateButton, toggle);
        };
        DJournal.GetAndShow = function (DJournalDate) {
            if (DJournalDate === void 0) { DJournalDate = ""; }
            DJournal.ToggleButtons(true);
            Utilities.Hide(DJournal.PrintingContainer);
            Utilities.Show(DJournal.BalancingContainer);
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            var query = "";
            if (DJournalDate.length > 0) {
                query = "?DateToBalance=" + DJournalDate;
            }
            Utilities.Get(path + "API/Balancing/GetDJournal" + query).then(function (dj) {
                console.log('djournal', dj);
                var dateInput = document.getElementById(DJournal.DJournalDateInput);
                Utilities.Set_Value(dateInput, dj.DJournalDateFormatted);
                if (dj.Error.length === 0) {
                    Utilities.Clear_Element(document.getElementById(DJournal.DJournalErrorContainer));
                }
                else {
                    Utilities.Error_Show(DJournal.DJournalErrorContainer, dj.Error, false);
                }
                DJournal.BuildDJournalDisplay(dj);
                DJournal.ToggleButtons(false);
            }, function (error) {
                console.log('error', error);
                Utilities.Error_Show(DJournal.DJournalErrorContainer, error, false);
                DJournal.ToggleButtons(false);
            });
        };
        DJournal.BuildDJournalFinalizeDisplay = function (dj) {
            // Rules:
            // df.CanBeFinalized is true, we show the finalize button
            // Otherwise:
            // If the date is already finalized, we show who did it and when
            // along with a "View Printable DJournal" button
            // If it's not, we don't show anything.
            var finalizeContainer = document.getElementById(DJournal.DJournalFinalizeContainer);
            Utilities.Clear_Element(finalizeContainer);
            var df = document.createDocumentFragment();
            if (dj.CanDJournalBeFinalized) {
                console.log('showing finalize button');
                df.appendChild(DJournal.BuildDJournalFinalizeButton(dj));
            }
            else {
                if (dj.Log.IsCreated) {
                    console.log('showing finalize info');
                    df.appendChild(DJournal.BuildDJournalFinalizeInfo(dj));
                }
                else {
                    console.log('no finalize to show');
                }
            }
            finalizeContainer.appendChild(df);
        };
        DJournal.BuildDJournalFinalizeButton = function (dj) {
            var level = document.createElement("div");
            level.classList.add("level");
            level.style.marginTop = ".75em";
            var button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-success");
            button.classList.add("level-item");
            button.classList.add("is-large");
            button.appendChild(document.createTextNode("Finalize Date"));
            button.onclick = function () {
                button.disabled = true;
                button.classList.add("is-loading");
                var path = "/";
                var i = window.location.pathname.toLowerCase().indexOf("/claypay");
                if (i == 0) {
                    path = "/claypay/";
                }
                var query = "?DateToFinalize=" + dj.DJournalDate;
                Utilities.Post(path + "API/Balancing/Finalize" + query, null)
                    .then(function (dj) {
                    console.log('dj returned from finalize', dj);
                    DJournal.BuildDJournalDisplay(dj);
                    Utilities.Hide(DJournal.BalancingContainer);
                    Utilities.Show(DJournal.PrintingContainer);
                    button.disabled = false;
                    button.classList.remove("is-loading");
                }, function (error) {
                    console.log("error in finalize", error);
                    button.disabled = false;
                    button.classList.remove("is-loading");
                });
            };
            level.appendChild(button);
            return level;
        };
        DJournal.BuildDJournalFinalizeInfo = function (dj) {
            var container = document.createElement("div");
            container.appendChild(DJournal.CreateDisplayField("Finalized On", Utilities.Format_Date(dj.Log.FinalizedOn)));
            container.appendChild(DJournal.CreateDisplayField("Finalized By", dj.Log.CreatedBy));
            var level = document.createElement("div");
            level.classList.add("level");
            level.style.marginTop = ".75em";
            var button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-success");
            button.classList.add("level-item");
            button.classList.add("is-large");
            button.appendChild(document.createTextNode("View Printable DJournal"));
            button.onclick = function () {
                Utilities.Hide(DJournal.BalancingContainer);
                Utilities.Show(DJournal.PrintingContainer);
            };
            level.appendChild(button);
            container.appendChild(level);
            return container;
        };
        DJournal.CreateDisplayField = function (label, value) {
            var field = document.createElement("div");
            field.classList.add("field");
            field.classList.add("column");
            var dataLabel = document.createElement("label");
            dataLabel.classList.add("label");
            dataLabel.appendChild(document.createTextNode(label));
            var control = document.createElement("div");
            control.classList.add("control");
            var input = document.createElement("input");
            input.classList.add("input");
            input.classList.add("is-static");
            input.readOnly = true;
            input.type = "text";
            input.value = value;
            control.appendChild(input);
            field.appendChild(dataLabel);
            field.appendChild(control);
            return field;
        };
        DJournal.BuildDJournalDisplay = function (dj) {
            var target = document.getElementById(DJournal.DJournalTotalsContainer);
            var df = document.createDocumentFragment();
            df.appendChild(DJournal.CreateDJournalTable(dj));
            Utilities.Clear_Element(target);
            target.appendChild(df);
            DJournal.BuildDJournalFinalizeDisplay(dj);
            DJournal.BuildPrintableDJournal(dj);
        };
        DJournal.CreateDJournalTable = function (dj, ShowClose) {
            if (ShowClose === void 0) { ShowClose = false; }
            var table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            table.classList.add("print-with-no-border");
            table.appendChild(DJournal.BuildDJournalHeader(dj, ShowClose));
            var tbody = document.createElement("tbody");
            var tfoot = document.createElement("tfoot");
            var totalCharges = new Balancing.CashierTotal();
            var totalDeposits = new Balancing.CashierTotal();
            var totalPayments = new Balancing.CashierTotal();
            for (var _i = 0, _a = dj.ProcessedPaymentTotals; _i < _a.length; _i++) {
                var payment = _a[_i];
                switch (payment.Type) {
                    case "Total Charges":
                        totalCharges = payment;
                        tbody.appendChild(DJournal.BuildPaymentRow(payment, dj.DJournalDateFormatted));
                        break;
                    case "Total Deposit":
                        totalDeposits = payment;
                        break;
                    case "Total Payments":
                        totalPayments = payment;
                        break;
                    case "Check":
                    case "Cash":
                        tbody.appendChild(DJournal.BuildShortDJournalRow(payment, dj.DJournalDateFormatted));
                        break;
                    default:
                        tbody.appendChild(DJournal.BuildPaymentRow(payment, dj.DJournalDateFormatted));
                        break;
                }
            }
            var tr = DJournal.BuildDJournalRow(totalPayments.Type, totalPayments.TotalAmount, totalDeposits.Type, totalDeposits.TotalAmount);
            tr.style.backgroundColor = "#fafafa";
            tfoot.appendChild(tr);
            //tfoot.appendChild(DJournal.BuildDJournalRow(totalCharges.Type, totalCharges.TotalAmount, "", -1));
            for (var _b = 0, _c = dj.GUTotals; _b < _c.length; _b++) {
                var gutotal = _c[_b];
                tfoot.appendChild(DJournal.BuildDJournalRow(gutotal.Type, gutotal.TotalAmount, "", -1));
            }
            table.appendChild(tbody);
            table.appendChild(tfoot);
            return table;
        };
        DJournal.BuildDJournalHeader = function (dj, ShowClose) {
            var head = document.createElement("THEAD");
            var bccTitle = document.createElement("div");
            bccTitle.textContent = "Clay County, BCC";
            bccTitle.classList.add("hide");
            bccTitle.classList.add("show-for-print");
            bccTitle.classList.add("print-title-size");
            var closeRow = document.createElement("tr");
            var title = document.createElement("th");
            title.colSpan = ShowClose ? 3 : 4;
            title.classList.add("has-text-left");
            title.classList.add("print-title-size");
            title.appendChild(document.createTextNode("DJournal " + dj.DJournalDateFormatted));
            title.appendChild(document.createElement("br"));
            title.appendChild(bccTitle);
            closeRow.appendChild(title);
            if (ShowClose) {
                var close_1 = document.createElement("th");
                close_1.classList.add("has-text-centered");
                var button = document.createElement("button");
                button.type = "button";
                button.classList.add("button");
                button.classList.add("is-primary");
                button.classList.add("hide-for-print");
                button.appendChild(document.createTextNode("Close"));
                button.onclick = function () {
                    Utilities.Hide(DJournal.PrintingContainer);
                    Utilities.Show(DJournal.BalancingContainer);
                };
                close_1.appendChild(button);
                closeRow.appendChild(close_1);
            }
            head.appendChild(closeRow);
            var tr = document.createElement("tr");
            var payments = document.createElement("th");
            payments.colSpan = 2;
            payments.width = "60%";
            payments.classList.add("has-text-right");
            payments.appendChild(document.createTextNode("Payments"));
            tr.appendChild(payments);
            var deposits = document.createElement("th");
            deposits.colSpan = 2;
            deposits.width = "40%";
            deposits.classList.add("has-text-right");
            deposits.appendChild(document.createTextNode("Deposits"));
            tr.appendChild(deposits);
            head.appendChild(tr);
            return head;
        };
        DJournal.BuildDJournalRow = function (paymentLabel, paymentAmount, depositLabel, depositAmount) {
            var tr = document.createElement("tr");
            tr.appendChild(DJournal.CreateTableCell(paymentLabel, "45%"));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(paymentAmount), "15%"));
            if (depositLabel.length > 0) {
                tr.appendChild(DJournal.CreateTableCell(depositLabel, "25%"));
                tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(depositAmount), "15%"));
            }
            else {
                tr.appendChild(DJournal.CreateTableCell("", "25%"));
                tr.appendChild(DJournal.CreateTableCell("", "15%"));
            }
            return tr;
        };
        DJournal.BuildShortDJournalRow = function (payment, djournalDate) {
            var tr = document.createElement("tr");
            tr.appendChild(DJournal.CreateTableCellLink(payment.Type, payment.Code, "45%", djournalDate));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
            tr.appendChild(DJournal.CreateTableCell(payment.Type + " Deposits", "25%"));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
            return tr;
        };
        DJournal.BuildPaymentRow = function (payment, djournalDate) {
            var tr = document.createElement("tr");
            tr.appendChild(DJournal.CreateTableCellLink(payment.Type, payment.Code, "45%", djournalDate));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
            tr.appendChild(DJournal.CreateTableCell("", "25%"));
            tr.appendChild(DJournal.CreateTableCell("", "15%"));
            return tr;
        };
        DJournal.CreateTableCell = function (value, width) {
            var td = document.createElement("td");
            td.classList.add("has-text-right");
            td.width = width;
            td.appendChild(document.createTextNode(value));
            return td;
        };
        DJournal.CreateTableCellLink = function (value, paymentType, width, djournalDate) {
            var td = document.createElement("td");
            td.classList.add("has-text-right");
            td.width = width;
            if (paymentType.length > 0) {
                var link_1 = document.createElement("A");
                link_1.onclick = function () {
                    Utilities.Set_Text(link_1, "loading...");
                    // load data here
                    var path = "/";
                    var qs = "";
                    var i = window.location.pathname.toLowerCase().indexOf("/claypay");
                    if (i == 0) {
                        path = "/claypay/";
                    }
                    //DateTime DateToBalance, string PaymentType
                    qs = "?DateToBalance=" + djournalDate + "&PaymentType=" + paymentType;
                    Utilities.Get(path + "API/Balancing/GetPayments" + qs)
                        .then(function (payments) {
                        console.log('payments', payments);
                        Balancing.Payment.ShowPayments(payments, value, djournalDate);
                        Utilities.Hide(DJournal.DJournalTotalsContainer);
                        Utilities.Set_Text(link_1, value); // change it back
                        Utilities.Show(DJournal.PaymentsContainer);
                    }, function (error) {
                        console.log('error getting payments for payment type: ' + paymentType, error);
                        Utilities.Set_Text(link_1, value); // change it back
                    });
                };
                link_1.appendChild(document.createTextNode(value));
                td.appendChild(link_1);
            }
            else {
                td.appendChild(document.createTextNode(value));
            }
            return td;
        };
        DJournal.BuildPrintableDJournal = function (dj) {
            var container = document.getElementById(DJournal.PrintingContainer);
            Utilities.Clear_Element(container);
            if (!dj.Log.IsCreated)
                return; // Let's not do anything if this thing isn't finalized
            var df = document.createDocumentFragment();
            df.appendChild(DJournal.CreateDJournalTable(dj, true));
            df.appendChild(Balancing.Account.BuildGLAccountTotals(dj.GLAccountTotals));
            df.appendChild(Balancing.CashierDetailData.BuildCashierDataTable(dj.CashierData));
            container.appendChild(df);
        };
        DJournal.DJournalTotalsContainer = "djournalTotals";
        DJournal.DJournalDateInput = "djournalDate";
        DJournal.BalancingContainer = "balancingDJournal";
        DJournal.PrintingContainer = "printingDJournal";
        DJournal.PaymentsContainer = "djournalPaymentsByType";
        DJournal.DJournalSearchErrorContainer = "djournalSearchError";
        DJournal.DJournalErrorContainer = "djournalErrors";
        DJournal.DJournalSearchDateButton = "BalanceByDate";
        DJournal.DJournalSearchNextDateButton = "NextFinalizeDate";
        DJournal.DJournalFinalizeContainer = "djournalFinalizeContainer";
        return DJournal;
    }());
    Balancing.DJournal = DJournal;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=DJournal.js.map
var Balancing;
(function (Balancing) {
    var DJournalLog = /** @class */ (function () {
        function DJournalLog() {
            this.CreatedBy = "";
            this.IsCreated = false;
        }
        return DJournalLog;
    }());
    Balancing.DJournalLog = DJournalLog;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=DjournalLog.js.map
var Balancing;
(function (Balancing) {
    Balancing.Menus = [
        {
            id: "nav-balancing",
            title: "Balancing & DJournal Handling",
            subTitle: "Use this page to finalize a day's charges, or see if any payments are not balancing.",
            icon: "fas fa-home",
            label: "Balancing",
            selected: true
        },
        {
            id: "nav-onlinePayments",
            title: "Online Payments Handling",
            subTitle: "The payments made online will be listed here.  Assign them to yourself to indicate that you're going to handle it.",
            icon: "fas fa-credit-card",
            label: "Online Payments",
            selected: false
        },
        {
            id: "nav-receipts",
            title: "Receipts",
            subTitle: "You can use this to view a receipt.",
            icon: "fas fa-file",
            label: "Receipts",
            selected: false
        }
    ];
    function Start() {
        buildMenuElements();
        Balancing.DJournal.GetAndShow();
        Balancing.AssignedOnlinePayment.GetAndDisplay();
    }
    Balancing.Start = Start;
    function DJournalByDate() {
        var DJournalDate = Utilities.Get_Value(Balancing.DJournal.DJournalDateInput);
        if (DJournalDate.length == 0) {
            // invalid date entered
            Utilities.Error_Show(Balancing.DJournal.DJournalSearchErrorContainer, "Invalid date entered, please try again.");
            return;
        }
        Balancing.DJournal.GetAndShow(DJournalDate);
    }
    Balancing.DJournalByDate = DJournalByDate;
    function buildMenuElements() {
        var menu = document.getElementById("menuTabs");
        for (var _i = 0, Menus_1 = Balancing.Menus; _i < Menus_1.length; _i++) {
            var menuItem = Menus_1[_i];
            menu.appendChild(Utilities.Create_Menu_Element(menuItem));
        }
    }
    Balancing.buildMenuElements = buildMenuElements;
    function ClearReceipt() {
        var e = document.getElementById("receiptView");
        Utilities.Clear_Element(e);
        Utilities.Set_Value("receiptSearch", "");
    }
    Balancing.ClearReceipt = ClearReceipt;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=Balancing.js.map