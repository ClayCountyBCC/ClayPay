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
    //export function Debounce<F extends Function>(func: F, wait: number = 1000): F
    //{
    //  let timeoutID: number;
    //  // conversion through any necessary as it wont satisfy criteria otherwise
    //  return <F><any>function (this: any, ...args: any[])
    //  {
    //    clearTimeout(timeoutID);
    //    const context = this;
    //    timeoutID = window.setTimeout(function ()
    //    {
    //      func.apply(context, args);
    //    }, wait);
    //  };
    //};
    function Debounce(func, wait, immediate) {
        var timeout;
        return function executedFunction() {
            var context = this;
            var args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate)
                    func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow)
                func.apply(context, args);
        };
    }
    Utilities.Debounce = Debounce;
    ;
})(Utilities || (Utilities = {}));
//# sourceMappingURL=Utilities.js.map
var ImpactFees;
(function (ImpactFees) {
    var PermitWaiver = /** @class */ (function () {
        function PermitWaiver() {
        }
        return PermitWaiver;
    }());
    ImpactFees.PermitWaiver = PermitWaiver;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=PermitWaiver.js.map
var ImpactFees;
(function (ImpactFees) {
    var PermitImpactFee = /** @class */ (function () {
        function PermitImpactFee() {
        }
        PermitImpactFee.Get = function (Permit_Number, Agreement_Number, Search_Type) {
            if (Agreement_Number === void 0) { Agreement_Number = ""; }
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            var qs = "?permit_number=" + Permit_Number.trim();
            qs += "&search_type=" + Search_Type;
            if (Agreement_Number.length > 0) {
                qs += "&agreement_number=" + Agreement_Number;
            }
            return Utilities.Get(path + "API/ImpactFees/GetPermit" + qs);
        };
        return PermitImpactFee;
    }());
    ImpactFees.PermitImpactFee = PermitImpactFee;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=PermitImpactFee.js.map
var ImpactFees;
(function (ImpactFees) {
    var PermitAllocation = /** @class */ (function () {
        function PermitAllocation() {
        }
        PermitAllocation.LoadBuilders = function (e, selectedBuilder) {
            if (selectedBuilder === void 0) { selectedBuilder = -1; }
            var parent = e.parentElement;
            parent.classList.add("is-loading");
            var id = e.id.replace("Add", "");
            var permitBuilderContainer = document.getElementById("permitBuilderContainer");
            var developerAmount = document.getElementById("permitDeveloperAmount");
            var developerAllocated = document.getElementById("permitDeveloperCurrentlyAllocated");
            if (e.selectedIndex === 0) {
                Utilities.Hide(permitBuilderContainer);
                developerAllocated.value = "";
                developerAmount.value = "";
                parent.classList.remove("is-loading");
                return; // no agreement selected.
            }
            Utilities.Show(permitBuilderContainer);
            var agreementNumber = e.options[e.selectedIndex].value;
            ImpactFees.CombinedAllocation.GetAll(agreementNumber, -1, "").then(function (builders) {
                var selectBuilder = document.getElementById("permitSelectBuilder");
                Utilities.Clear_Element(selectBuilder);
                builders = builders.filter(function (b) { return b.Builder_Name.trim().length > 0 && b.Builder_Allocation_Amount > 0; });
                if (builders.length > 0) {
                    developerAmount.value = builders[0].Agreement_Amount_Formatted;
                    developerAllocated.value = builders[0].Developer_Amount_Currently_Allocated_Formatted;
                    selectBuilder.add(Utilities.Create_Option("", "Select Builder", selectedBuilder === -1));
                    var distinctBuilder = [];
                    for (var _i = 0, builders_1 = builders; _i < builders_1.length; _i++) {
                        var b = builders_1[_i];
                        if (distinctBuilder.indexOf(b.Builder_Id) === -1 && b.Builder_Name.trim() !== "") {
                            distinctBuilder.push(b.Builder_Id);
                            selectBuilder.add(Utilities.Create_Option(b.Builder_Id.toString(), b.Builder_Name, b.Builder_Id === selectedBuilder));
                        }
                    }
                }
                if (selectedBuilder !== -1) {
                    PermitAllocation.BuilderSelected(selectBuilder);
                }
                parent.classList.remove("is-loading");
            }).catch(function (e) {
                parent.classList.remove("is-loading");
                // some kind of error occurred.
            });
        };
        PermitAllocation.Reset = function () {
            // this function will unselect all dropdowns and clear every text box
            document.getElementById("formPermitAllocations").reset();
            document.getElementById("permitSelectAgreement").selectedIndex = 0;
            document.getElementById("permitSelectBuilder").selectedIndex = 0;
            Utilities.Hide(document.getElementById("permitAllocationError"));
            Utilities.Hide(document.getElementById("permitBuilderContainer"));
            Utilities.Hide(document.getElementById("permitBuilderSelected"));
            Utilities.Hide(document.getElementById("permitInfo"));
            Utilities.Hide(document.getElementById("permitErrorContainer"));
            Utilities.Hide(document.getElementById("permitSelectDeveloper"));
        };
        PermitAllocation.BuilderSelected = function (e) {
            // once they get to this place, I need to do a final validation on the permit
            // to check to make sure that this permit is inside the agreement's boundary      
            var parent = e.parentElement;
            parent.classList.add("is-loading");
            var id = e.id.replace("Add", "");
            var builderSelectedContainer = document.getElementById("permitBuilderSelected");
            var builderAmount = document.getElementById("permitBuilderAmount");
            var builderAllocated = document.getElementById("permitBuilderCurrentlyAllocated");
            var builderAllocationRemaining = document.getElementById("permitBuilderAllocationRemaining");
            var permitCreditAmount = document.getElementById("permitCreditAmount");
            permitCreditAmount.value = "";
            if (e.selectedIndex === 0) {
                Utilities.Hide(builderSelectedContainer);
                parent.classList.remove("is-loading");
                builderAmount.value = "";
                builderAllocated.value = "";
                return; // no agreement selected.
            }
            var builderId = e.options[e.selectedIndex].value;
            ImpactFees.CombinedAllocation.GetAll("", parseInt(builderId), "").then(function (builders) {
                builderAmount.value = builders[0].Builder_Allocation_Amount_Formatted;
                builderAllocated.value = builders[0].Builder_Amount_Currently_Allocated_Formatted;
                var difference = (builders[0].Builder_Allocation_Amount - builders[0].Builder_Amount_Currently_Allocated);
                var fee = document.getElementById("permitRoadImpactFee").value.replace("$", "").replace(",", "");
                var parsedFee = parseFloat(fee);
                builderAllocationRemaining.value = difference.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                permitCreditAmount.value = Math.min(parsedFee, difference).toFixed();
                parent.classList.remove("is-loading");
                Utilities.Show(builderSelectedContainer);
            }).catch(function (e) {
                parent.classList.remove("is-loading");
                // some kind of error occurred.
            });
        };
        PermitAllocation.SearchPermit = function () {
            // this function will take the contents of the permit input and query it against the webservice.
            var permitErrorContainer = document.getElementById("permitErrorContainer");
            var permitErrorText = document.getElementById("permitErrorText");
            var permitInfo = document.getElementById("permitInfo");
            Utilities.Hide(permitErrorContainer);
            Utilities.Hide(permitInfo);
            var permitInput = document.getElementById("permitNumber");
            var permitNumber = permitInput.value.trim();
            var searchType = document.querySelector('input[name="searchType"]:checked').value;
            PermitAllocation.Reset();
            permitInput.value = permitNumber;
            var searchTypeInput = document.querySelector('input[name="searchType"][value="' + searchType + '"]');
            searchTypeInput.checked = true;
            if (permitNumber.length !== 8) {
                // show error
                var permitNumberLengthError = document.getElementById("permitNumberLengthError");
                Utilities.Error_Show(permitNumberLengthError);
                return;
            }
            if (isNaN(parseInt(permitNumber))) {
                var permitNumberNumericError = document.getElementById("permitNumberNumericError");
                Utilities.Error_Show(permitNumberNumericError);
                return;
            }
            ImpactFees.PermitImpactFee.Get(permitNumber, "", "IFCR").then(function (pif) {
                var ImpactFee = document.getElementById("permitRoadImpactFee");
                var ContractorNumber = document.getElementById("permitContractorNumber");
                var ContractorName = document.getElementById("permitContractorName");
                var CashierId = document.getElementById("permitCashierId");
                ImpactFee.value = pif.ImpactFee_Amount_Formatted;
                ContractorNumber.value = pif.Contractor_Id;
                ContractorName.value = pif.Contractor_Name;
                CashierId.value = pif.Cashier_Id;
                Utilities.Show(permitInfo);
                if (pif.Error_Text.length > 0) {
                    permitErrorText.value = pif.Error_Text;
                    Utilities.Show(permitErrorContainer);
                    return; // if we find an error, we should stop here.
                }
                // if we made it here, let's query the combined allocations for this permit number
                // to see if it is already associated to any agreements/ builders.
                ImpactFees.CombinedAllocation.GetAll("", -1, permitNumber).then(function (comb) {
                    var selectDeveloperContainer = document.getElementById("permitSelectDeveloper");
                    Utilities.Show(selectDeveloperContainer);
                    var selectAgreement = document.getElementById("permitSelectAgreement");
                    selectAgreement.selectedIndex = 0;
                    if (comb.length == 1) {
                        // let's select the right agreement
                        for (var i = 0; i < selectAgreement.options.length; i++) {
                            if (selectAgreement.options.item(i).value === comb[0].Agreement_Number) {
                                selectAgreement.selectedIndex = i;
                                break;
                            }
                        }
                        // then load the builders for that agreement
                        // and select the right builder
                        PermitAllocation.LoadBuilders(selectAgreement, comb[0].Builder_Id);
                    }
                    else {
                        if (comb.length === 0) {
                            // we should figure out how to show an unselected agreement select here.
                        }
                        else {
                            // if multiple rows are returned, dunno
                            console.log('multiple rows returned for this permit number', comb);
                        }
                    }
                }, function (err) {
                    console.log('error', err);
                    permitErrorText.value = err;
                    Utilities.Show(permitErrorContainer);
                });
            }, function (e) {
                console.log('error', e);
                permitErrorText.value = e;
                Utilities.Show(permitErrorContainer);
            });
        };
        PermitAllocation.SearchPermitOther = function () {
            // this function will take the contents of the permit input and query it against the webservice.
            Utilities.Hide("permitOtherApplyWaiver"); // hide the button, we'll show it if we make it there.
            var permitErrorContainer = document.getElementById("permitOtherErrorContainer");
            var permitErrorText = document.getElementById("permitOtherErrorText");
            Utilities.Hide(permitErrorContainer);
            var permitInput = document.getElementById("permitNumberOther");
            var permitNumber = permitInput.value.trim();
            permitInput.value = permitNumber;
            if (permitNumber.length !== 8) {
                // show error
                var permitNumberLengthError = document.getElementById("permitNumberOtherLengthError");
                Utilities.Error_Show(permitNumberLengthError);
                return;
            }
            if (isNaN(parseInt(permitNumber))) {
                var permitNumberNumericError = document.getElementById("permitNumberOtherNumericError");
                Utilities.Error_Show(permitNumberNumericError);
                return;
            }
            var searchType = document.querySelector('input[name="searchType"]:checked').value;
            ImpactFees.PermitImpactFee.Get(permitNumber, "", searchType).then(function (pif) {
                var ImpactFee = document.getElementById("permitOtherImpactFee");
                ImpactFee.value = pif.ImpactFee_Amount_Formatted;
                var AmountToWaive = document.getElementById("AmountToWaive");
                AmountToWaive.value = pif.ImpactFee_Amount.toFixed(2);
                if (pif.Error_Text.length > 0) {
                    permitErrorText.value = pif.Error_Text;
                    Utilities.Show(permitErrorContainer);
                    return; // if we find an error, we should stop here.
                }
                Utilities.Show("permitOtherApplyWaiver");
            }, function (e) {
                permitErrorText.value = e;
                Utilities.Show(permitErrorContainer);
            });
        };
        PermitAllocation.SavePermitAllocation = function () {
            // need permit number, builder Id, and allocation amount
            var permitNumber = document.getElementById("permitNumber");
            var selectedBuilder = document.getElementById("permitSelectBuilder");
            var allocationAmount = document.getElementById("permitCreditAmount");
            allocationAmount.classList.remove("is-danger");
            // we're going to add this extra line here just to handle if anyone 
            // tries to use more than 2 digits after the decimal point.
            allocationAmount.value = parseFloat(allocationAmount.value).toFixed(2);
            var Amount = parseFloat(allocationAmount.value);
            if (isNaN(Amount) || Amount < 0) {
                allocationAmount.classList.add("is-danger");
                allocationAmount.focus();
                var amountError = document.getElementById("permitCreditAmountError");
                Utilities.Error_Show(amountError);
                return;
            }
            var pa = new PermitAllocation();
            pa.Amount_Allocated = Amount;
            pa.Builder_Id = parseInt(selectedBuilder.options[selectedBuilder.selectedIndex].value);
            pa.Permit_Number = permitNumber.value.trim();
            pa.Save();
        };
        PermitAllocation.SavePermitWaiver = function () {
            Utilities.Toggle_Loading_Button("SavePermitWaiver", true);
            var permitNumber = document.getElementById("permitNumberOther");
            var permitErrorContainer = document.getElementById("permitOtherErrorContainer");
            var permitErrorText = document.getElementById("permitOtherErrorText");
            var searchType = document.querySelector('input[name="searchType"]:checked').value;
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            var pw = new ImpactFees.PermitWaiver();
            var amount = document.getElementById("AmountToWaive").value.trim();
            console.log('amount', amount);
            pw.Amount = parseFloat(amount);
            if (isNaN(pw.Amount)) {
                alert("There is a problem with the amount entered.  Please check the amount and try again.");
                return;
            }
            pw.Permit_Number = permitNumber.value.trim();
            pw.Waiver_Type = searchType;
            Utilities.Post(path + "API/ImpactFees/SavePermitWaiver", pw)
                .then(function (a) {
                console.log('response', a);
                if (a.length > 0 && a !== "success") {
                    Utilities.Show(permitErrorContainer);
                    permitErrorText.value = a;
                }
                else {
                    // let's indicate success in some way.
                    // probably show a message of some sort
                    // and then reset();
                    PermitAllocation.Reset();
                    Utilities.Hide("permitCredits");
                    Utilities.Hide("permitOther");
                    alert("Successfully applied Waiver/Exemption to Permit: " + pw.Permit_Number);
                }
                Utilities.Toggle_Loading_Button("SavePermitWaiver", false);
            }).catch(function (e) {
                // figure out what we want to do with the errors.
                Utilities.Show(permitErrorContainer);
                permitErrorText.value = e;
                Utilities.Toggle_Loading_Button("SavePermitWaiver", false);
            });
        };
        PermitAllocation.prototype.Save = function () {
            var permitAllocationErrorContainer = document.getElementById("permitAllocationError");
            var permitAllocationError = document.getElementById("permitAllocationErrorList");
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            Utilities.Post(path + "API/ImpactFees/SavePermitAllocation", this)
                .then(function (a) {
                console.log('response', a);
                if (a.length > 0) {
                    Utilities.Show(permitAllocationErrorContainer);
                    permitAllocationError.value = a.join("\n");
                }
                else {
                    PermitAllocation.SearchPermit();
                }
            }).catch(function (e) {
                // figure out what we want to do with the errors.
                Utilities.Show(permitAllocationErrorContainer);
                permitAllocationError.value = e;
            });
        };
        return PermitAllocation;
    }());
    ImpactFees.PermitAllocation = PermitAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=PermitAllocation.js.map
/// <reference path="../app/utilities.ts" />
var ImpactFees;
(function (ImpactFees) {
    ImpactFees.CombinedAllocations = [];
    var Menus = [
        {
            id: "nav-existingAllocations",
            title: "Existing Agreements and Allocations",
            subTitle: "View the existing allocations by Developer, Builder, or Permit.",
            icon: "fas fa-home",
            label: "Current Allocations",
            selected: true
        },
        {
            id: "nav-developerAgreement",
            title: "Developer Agreements",
            subTitle: "Use this menu to add or make changes to existing developer agreements.",
            icon: "fas fa-user",
            label: "Developer",
            selected: false
        },
        {
            id: "nav-builderAllocations",
            title: "Builder Allocations",
            subTitle: "Use this menu to add or make changes to existing builder allocations.",
            icon: "fas fa-user",
            label: "Builder",
            selected: false
        },
        {
            id: "nav-permitAllocations",
            title: "Permit Waivers, Exemptions, and Allocations",
            subTitle: "Use this menu to add or make changes to existing permit allocations, or to apply waivers or exemptions.",
            icon: "fas fa-clipboard",
            label: "Permit",
            selected: false
        }
    ];
    function Start() {
        buildMenuElements();
        LoadAgreements();
        HandleUIEvents();
    }
    ImpactFees.Start = Start;
    function PermitActionChange() {
        Utilities.Hide("permitOtherApplyWaiver");
        Utilities.Set_Value("permitNumberOther", "");
        Utilities.Set_Value("permitNumber", "");
        var actionType = document.querySelector('input[name="searchType"]:checked').value;
        if (actionType === null || actionType === undefined)
            return;
        Utilities.Hide("permitCredits");
        Utilities.Hide("permitOther");
        if (actionType === "IFCR") {
            Utilities.Show("permitCredits");
            return;
        }
        Utilities.Show("permitOther");
    }
    ImpactFees.PermitActionChange = PermitActionChange;
    function LoadAgreements() {
        ImpactFees.CombinedAllocation.GetAll("", -1, "").then(function (a) {
            ImpactFees.CombinedAllocations = a;
            PopulateAgreementDropdowns(a);
            PopulateExistingAllocations(BuildDeveloperTable());
        });
    }
    function PopulateAgreementDropdowns(agreements) {
        console.log('agreements to Populate', agreements);
        var added = [];
        var developer = document.getElementById("developerAgreementAdd");
        var builder = document.getElementById("builderAllocationAgreementAdd");
        var permit = document.getElementById("permitSelectAgreement");
        for (var _i = 0, agreements_1 = agreements; _i < agreements_1.length; _i++) {
            var a = agreements_1[_i];
            if (added.indexOf(a.Agreement_Number) === -1) {
                added.push(a.Agreement_Number);
                var label = a.Agreement_Number + ' - ' + a.Developer_Name;
                developer.add(Utilities.Create_Option(a.Agreement_Number, label));
                if (a.Agreement_Amount > 0) { // we don't need to make them selectable if there is no money allocated to this developer.
                    builder.add(Utilities.Create_Option(a.Agreement_Number, label));
                    if (a.Builder_Allocation_Amount > 0) // same for the permit and the builder.
                     {
                        permit.add(Utilities.Create_Option(a.Agreement_Number, label));
                    }
                }
            }
        }
    }
    function PopulateExistingAllocations(df) {
        var container = document.getElementById("existingAllocationsContainer");
        Utilities.Clear_Element(container);
        Utilities.Show(container);
        container.appendChild(df);
    }
    function BuildBreadCrumbs(Agreement_Number, Builder_Name) {
        if (Agreement_Number === void 0) { Agreement_Number = ""; }
        if (Builder_Name === void 0) { Builder_Name = ""; }
        var bc = document.getElementById("breadcrumbs");
        Utilities.Clear_Element(bc);
        var baseLI = document.createElement("li");
        bc.appendChild(baseLI);
        var baseA = document.createElement("a");
        baseA.href = "#";
        baseA.appendChild(document.createTextNode("Agreements"));
        baseA.onclick = function () {
            console.log('testing');
            View("", "");
        };
        baseLI.appendChild(baseA);
        if (Agreement_Number.length === 0) {
            baseLI.classList.add("is-active");
        }
        else {
            var agreementLI = document.createElement("li");
            var agreementA = document.createElement("a");
            agreementA.href = "#";
            agreementA.appendChild(document.createTextNode(Agreement_Number));
            agreementA.onclick = function () {
                console.log("testa");
                View(Agreement_Number, "");
            };
            agreementLI.appendChild(agreementA);
            bc.appendChild(agreementLI);
            if (Builder_Name.length > 0) {
                var builderLI = document.createElement("li");
                builderLI.classList.add("is-active");
                var builderA = document.createElement("a");
                builderA.appendChild(document.createTextNode(Builder_Name));
                builderA.onclick = function () {
                    console.log("test");
                    View(Agreement_Number, Builder_Name);
                };
                builderLI.appendChild(builderA);
                bc.appendChild(builderLI);
            }
            else {
                agreementLI.classList.add("is-active");
            }
        }
    }
    function BuildDeveloperTable() {
        BuildBreadCrumbs();
        var df = new DocumentFragment();
        var t = document.createElement("table");
        t.classList.add("table");
        t.width = "100%";
        var tHead = document.createElement("thead");
        tHead.appendChild(DeveloperHeaderRow());
        var tBody = document.createElement("tbody");
        var distinct = [];
        for (var _i = 0, CombinedAllocations_1 = ImpactFees.CombinedAllocations; _i < CombinedAllocations_1.length; _i++) {
            var ca = CombinedAllocations_1[_i];
            if (distinct.indexOf(ca.Agreement_Number) === -1) {
                distinct.push(ca.Agreement_Number);
                tBody.appendChild(BuildRow(ca.Agreement_Number, "", ca.Agreement_Number, ca.Developer_Name, ca.Agreement_Amount_Formatted, ca.Developer_Amount_Currently_Allocated_Formatted));
            }
        }
        t.appendChild(tHead);
        t.appendChild(tBody);
        df.appendChild(t);
        return df;
    }
    function View(Agreement_Number, Builder_Name) {
        if (Agreement_Number.length > 0) {
            if (Builder_Name.length > 0) {
                PopulateExistingAllocations(BuildPermitTable(Agreement_Number, Builder_Name));
            }
            else {
                PopulateExistingAllocations(BuildBuilderTable(Agreement_Number));
            }
        }
        else {
            PopulateExistingAllocations(BuildDeveloperTable());
        }
    }
    ImpactFees.View = View;
    function BuildBuilderTable(Agreement_Number) {
        BuildBreadCrumbs(Agreement_Number);
        var df = new DocumentFragment();
        var t = document.createElement("table");
        t.classList.add("table");
        t.width = "100%";
        var tHead = document.createElement("thead");
        tHead.appendChild(BuilderHeaderRow());
        var tBody = document.createElement("tbody");
        var distinct = [];
        for (var _i = 0, CombinedAllocations_2 = ImpactFees.CombinedAllocations; _i < CombinedAllocations_2.length; _i++) {
            var ca = CombinedAllocations_2[_i];
            if (ca.Agreement_Number === Agreement_Number && distinct.indexOf(ca.Builder_Name) === -1) {
                distinct.push(ca.Builder_Name);
                tBody.appendChild(BuildRow(ca.Agreement_Number, ca.Builder_Name, ca.Builder_Name, ca.Builder_Allocation_Amount_Formatted, ca.Builder_Amount_Currently_Allocated_Formatted));
            }
        }
        t.appendChild(tHead);
        t.appendChild(tBody);
        df.appendChild(t);
        return df;
    }
    function BuildPermitTable(Agreement_Number, Builder_Name) {
        BuildBreadCrumbs(Agreement_Number, Builder_Name);
        var df = new DocumentFragment();
        var t = document.createElement("table");
        t.classList.add("table");
        t.width = "100%";
        var tHead = document.createElement("thead");
        tHead.appendChild(PermitHeaderRow());
        var tBody = document.createElement("tbody");
        for (var _i = 0, CombinedAllocations_3 = ImpactFees.CombinedAllocations; _i < CombinedAllocations_3.length; _i++) {
            var ca = CombinedAllocations_3[_i];
            if (ca.Agreement_Number === Agreement_Number && ca.Builder_Name === Builder_Name) {
                tBody.appendChild(BuildRow(ca.Agreement_Number, "", ca.Permit_Number, ca.Permit_Amount_Allocated.toLocaleString('en-US', { style: 'currency', currency: 'USD' })));
            }
        }
        t.appendChild(tHead);
        t.appendChild(tBody);
        df.appendChild(t);
        return df;
    }
    function DeveloperHeaderRow() {
        var tr = document.createElement("tr");
        tr.classList.add("tr");
        var an = document.createElement("th");
        an.appendChild(document.createTextNode("Agreement Number"));
        an.width = "25%";
        var dn = document.createElement("th");
        dn.appendChild(document.createTextNode("Developer Name"));
        dn.width = "25%";
        var aa = document.createElement("th");
        aa.appendChild(document.createTextNode("Agreement Amount"));
        aa.width = "25%";
        var ca = document.createElement("th");
        ca.appendChild(document.createTextNode("Currently Allocated"));
        ca.width = "25%";
        tr.appendChild(an);
        tr.appendChild(dn);
        tr.appendChild(aa);
        tr.appendChild(ca);
        return tr;
    }
    function BuilderHeaderRow() {
        var tr = document.createElement("tr");
        tr.classList.add("tr");
        var bn = document.createElement("th");
        bn.appendChild(document.createTextNode("Builder Name"));
        bn.width = "33%";
        var aa = document.createElement("th");
        aa.appendChild(document.createTextNode("Amount Allocated"));
        aa.width = "33%";
        var ca = document.createElement("th");
        ca.appendChild(document.createTextNode("Currently Allocated"));
        ca.width = "33%";
        tr.appendChild(bn);
        tr.appendChild(aa);
        tr.appendChild(ca);
        return tr;
    }
    function PermitHeaderRow() {
        var tr = document.createElement("tr");
        tr.classList.add("tr");
        var bn = document.createElement("th");
        bn.appendChild(document.createTextNode("Permit Name"));
        bn.width = "50%";
        var aa = document.createElement("th");
        aa.appendChild(document.createTextNode("Amount Allocated"));
        aa.width = "50%";
        tr.appendChild(bn);
        tr.appendChild(aa);
        return tr;
    }
    function BuildRow(key1, key2) {
        var values = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            values[_i - 2] = arguments[_i];
        }
        var tr = document.createElement("tr");
        tr.style.cursor = "pointer";
        tr.classList.add("tr");
        tr.onclick = function () {
            View(key1, key2);
        };
        for (var _a = 0, values_1 = values; _a < values_1.length; _a++) {
            var v = values_1[_a];
            var td = document.createElement("td");
            td.classList.add("td");
            td.appendChild(document.createTextNode(v));
            tr.appendChild(td);
        }
        return tr;
    }
    function buildMenuElements() {
        var menu = document.getElementById("menuTabs");
        for (var _i = 0, Menus_1 = Menus; _i < Menus_1.length; _i++) {
            var menuItem = Menus_1[_i];
            menu.appendChild(Utilities.Create_Menu_Element(menuItem));
        }
    }
    ImpactFees.buildMenuElements = buildMenuElements;
    function HandleUIEvents() {
        document.getElementById('permitNumberOther')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                ImpactFees.PermitAllocation.SearchPermitOther();
            }
        };
        document.getElementById('permitNumber')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                ImpactFees.PermitAllocation.SearchPermit();
            }
        };
    }
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=ImpactFees.js.map
var ImpactFees;
(function (ImpactFees) {
    var DeveloperAgreement = /** @class */ (function () {
        function DeveloperAgreement() {
            this.Application_Name = "";
            this.Developer_Name = "";
            this.Amount_Currently_Allocated = 0;
            this.Audit_Log = "";
        }
        DeveloperAgreement.Load = function (e) {
            var parent = e.parentElement;
            parent.classList.add("is-loading");
            var id = e.id.replace("Add", "");
            var container = document.getElementById(id + "Selected");
            Utilities.Hide(container);
            if (e.selectedIndex === 0) {
                parent.classList.remove("is-loading");
                return; // no agreement selected.
            }
            var agreementNumber = e.options[e.selectedIndex].value;
            ImpactFees.CombinedAllocation.GetAll(agreementNumber, -1, "").then(function (agreements) {
                if (agreements.length > 0) {
                    var da = agreements[0];
                    // Load this object's data into the html form.
                    var Amount = document.getElementById("developerAgreementAmount");
                    Amount.classList.remove("is-danger");
                    var AllocatedAmount = document.getElementById("developerCurrentlyAllocated");
                    var AuditLog = document.getElementById("developerAgreementAuditLog");
                    var existingAgreement = document.getElementById("existingDeveloperAgreement");
                    var existingAmountAllocated = document.getElementById("existingAgreementAmountAllocated");
                    Amount.value = da.Agreement_Amount.toString();
                    AllocatedAmount.value = da.Developer_Amount_Currently_Allocated_Formatted;
                    AuditLog.value = da.Developer_Audit_Log;
                    if (da.Developer_Audit_Log.length === 0) {
                        Utilities.Hide(existingAgreement);
                        Utilities.Hide(existingAmountAllocated);
                    }
                    else {
                        Utilities.Show(existingAgreement);
                        Utilities.Show(existingAmountAllocated);
                    }
                    Utilities.Show(container);
                    parent.classList.remove("is-loading");
                }
            }).catch(function (e) {
                parent.classList.remove("is-loading");
                // some kind of error occurred.
            });
        };
        DeveloperAgreement.SaveAgreement = function () {
            var developerAgreementError = document.getElementById("developerAgreementErrorList");
            var developerAgreementErrorContainer = document.getElementById("developerAgreementError");
            Utilities.Hide(developerAgreementErrorContainer);
            var agreementSelect = document.getElementById("developerAgreementAdd");
            var agreementNumber = agreementSelect.options[agreementSelect.selectedIndex].value;
            var AmountElement = document.getElementById("developerAgreementAmount");
            AmountElement.classList.remove("is-danger");
            var Amount = parseFloat(AmountElement.value);
            if (!isNaN(Amount) && Amount >= 0) { // cursory validation, main validation will be the backend.
                var d = new DeveloperAgreement();
                d.Agreement_Amount = Amount;
                d.Agreement_Number = agreementNumber;
                //XHR.SaveObject<DeveloperAgreement>("../API/ImpactFees/SaveDeveloperAgreement", d)
                var path = "/";
                var i = window.location.pathname.toLowerCase().indexOf("/claypay");
                if (i == 0) {
                    path = "/claypay/";
                }
                Utilities.Post(path + "API/ImpactFees/SaveDeveloperAgreement", d)
                    .then(function (a) {
                    console.log('response', a);
                    if (a.length > 0) {
                        Utilities.Show(developerAgreementErrorContainer);
                        developerAgreementError.value = a.join("\n");
                    }
                    else {
                        DeveloperAgreement.Load(agreementSelect);
                    }
                }).catch(function (e) {
                    // figure out what we want to do with the errors.
                    console.log('error response', e);
                    Utilities.Show(developerAgreementErrorContainer);
                    developerAgreementError.value = e;
                });
            }
            else {
                // show error messages
                AmountElement.focus();
                AmountElement.classList.add("is-danger");
                var errorElement = document.getElementById("developerAgreementAmountError");
                Utilities.Error_Show(errorElement);
            }
        };
        return DeveloperAgreement;
    }());
    ImpactFees.DeveloperAgreement = DeveloperAgreement;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=DeveloperAgreement.js.map
var ImpactFees;
(function (ImpactFees) {
    var CombinedAllocation = /** @class */ (function () {
        function CombinedAllocation() {
        }
        CombinedAllocation.GetAll = function (agreementNumber, builderId, permitNumber) {
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            var qs = "";
            if (agreementNumber.length > 0) {
                qs = "&agreementNumber=" + agreementNumber;
            }
            if (builderId != -1) {
                qs = "&builderId=" + builderId.toString();
            }
            if (permitNumber.length > 0) {
                qs = "&permitNumber=" + permitNumber;
            }
            if (qs.length > 0) {
                qs = "?" + qs.substr(1); // no matter which arguments we used, we'll always remove the leading & and add a ?
            } //"../API/Payments/Fee/"
            return Utilities.Get(path + "API/ImpactFees/GetAgreements" + qs);
            //return fetch("./API/ImpactFees/GetAgreements" + qs) : Promise<Array<CombinedAllocation>>;
            //return XHR.GetArray<CombinedAllocation>("./API/ImpactFees/GetAgreements", qs);
        };
        return CombinedAllocation;
    }());
    ImpactFees.CombinedAllocation = CombinedAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=CombinedAllocation.js.map
var ImpactFees;
(function (ImpactFees) {
    var BuilderAllocation = /** @class */ (function () {
        function BuilderAllocation() {
            this.Amount_Currently_Allocated = 0;
            this.Audit_Log = "";
        }
        BuilderAllocation.LoadBuilders = function (e) {
            var parent = e.parentElement;
            parent.classList.add("is-loading");
            var id = e.id.replace("Add", "");
            var container = document.getElementById(id + "Selected");
            var agreementSelectedDeveloperAmount = document.getElementById("builderDeveloperSelectedAmount");
            var agreementSelectedDeveloperCurrentlyAllocated = document.getElementById("builderDeveloperSelectedCurrentlyAllocated");
            var builderSelectedContainer = document.getElementById("builderSelected");
            BuilderAllocation.LoadBuilder("", "", "", "$0.00");
            Utilities.Hide(builderSelectedContainer);
            Utilities.Hide(container);
            Utilities.Hide(agreementSelectedDeveloperAmount);
            Utilities.Hide(agreementSelectedDeveloperCurrentlyAllocated);
            if (e.selectedIndex === 0) {
                parent.classList.remove("is-loading");
                return; // no agreement selected.
            }
            var agreementNumber = e.options[e.selectedIndex].value;
            ImpactFees.CombinedAllocation.GetAll(agreementNumber, -1, "").then(function (builders) {
                // let's load the dropdown
                var selectBuilder = document.getElementById("existingBuilders");
                Utilities.Clear_Element(selectBuilder);
                builders = builders.filter(function (b) { return b.Builder_Name.trim().length > 0; });
                if (builders.length > 0) {
                    Utilities.Show(container);
                    Utilities.Show(agreementSelectedDeveloperAmount);
                    Utilities.Show(agreementSelectedDeveloperCurrentlyAllocated);
                    var DeveloperAmount = document.getElementById("buildersDeveloperAgreementAmount");
                    var DeveloperAllocated = document.getElementById("buildersDeveloperCurrentlyAllocated");
                    DeveloperAmount.value = builders[0].Agreement_Amount_Formatted;
                    DeveloperAllocated.value = builders[0].Developer_Amount_Currently_Allocated_Formatted;
                    selectBuilder.add(Utilities.Create_Option("", "Select Builder or Add New", true));
                    var distinctBuilder = [];
                    for (var _i = 0, builders_1 = builders; _i < builders_1.length; _i++) {
                        var b = builders_1[_i];
                        if (distinctBuilder.indexOf(b.Builder_Id) === -1 && b.Builder_Name.trim() !== "") {
                            distinctBuilder.push(b.Builder_Id);
                            selectBuilder.add(Utilities.Create_Option(b.Builder_Id.toString(), b.Builder_Name));
                        }
                    }
                }
                else {
                    // if there are no builders for this agreement already setup
                    // let's just show the add builder inputs.
                    BuilderAllocation.LoadBuilder("", "", "", "$0.00");
                }
                parent.classList.remove("is-loading");
            }).catch(function (e) {
                parent.classList.remove("is-loading");
                // some kind of error occurred.
            });
        };
        BuilderAllocation.LoadSpecificBuilder = function (e) {
            if (e.selectedIndex === 0) {
                BuilderAllocation.LoadBuilder("", "", "", "$0.00", false);
                return;
            }
            var parent = e.parentElement;
            parent.classList.add("is-loading");
            var builderId = parseInt(e.options[e.selectedIndex].value);
            ImpactFees.CombinedAllocation.GetAll("", builderId, "").then(function (builders) {
                if (builders.length > 0) {
                    var builder = builders[0];
                    BuilderAllocation.LoadBuilder(builder.Builder_Name, builder.Builder_Allocation_Amount.toString(), builder.Builder_Audit_Log, builder.Builder_Amount_Currently_Allocated_Formatted);
                }
                parent.classList.remove("is-loading");
            }).catch(function (e) {
                parent.classList.remove("is-loading");
                console.log('Load Specific builder error happened', e);
            });
        };
        BuilderAllocation.LoadBuilder = function (BuilderName, BuilderAmount, AuditLog, AlreadyAllocated, ShowContainer) {
            if (ShowContainer === void 0) { ShowContainer = true; }
            // hide Add New Builder button unless select index = 0
            var Name = document.getElementById("builderAllocationName");
            var Amount = document.getElementById("builderAllocationAmount");
            var Log = document.getElementById("builderAllocationAuditLog");
            var Allocated = document.getElementById("buildersAmountAllocatedToPermits");
            var container = document.getElementById("builderSelected");
            var existingContainer = document.getElementById("existingBuilderAllocation");
            Utilities.Hide(existingContainer);
            Utilities.Hide(container);
            if (ShowContainer)
                Utilities.Show(container);
            Name.value = BuilderName;
            Amount.value = BuilderAmount;
            Log.value = AuditLog;
            Allocated.value = AlreadyAllocated;
            if (AuditLog.length > 0) {
                Utilities.Show(existingContainer);
            }
            // load the values into the form and show it
        };
        BuilderAllocation.AddNewBuilder = function () {
            // clear out the form and show it
            var builderSelect = document.getElementById("existingBuilders");
            if (builderSelect.options.length > 0)
                builderSelect.selectedIndex = 0;
            BuilderAllocation.LoadBuilder("", "", "", "$0.00");
        };
        BuilderAllocation.SaveAllocation = function () {
            //builderAllocationErrorList
            var builderAllocationErrorContainer = document.getElementById("builderAllocationError");
            var builderAllocationError = document.getElementById("builderAllocationErrorList");
            Utilities.Hide(builderAllocationErrorContainer);
            var agreementSelect = document.getElementById("builderAllocationAgreementAdd");
            var agreementNumber = agreementSelect.options[agreementSelect.selectedIndex].value;
            var builderSelect = document.getElementById("existingBuilders");
            var builderId = null;
            if (builderSelect.options.length > 0 && builderSelect.selectedIndex > 0) {
                builderId = builderSelect.options[builderSelect.selectedIndex].value;
            }
            var NameElement = document.getElementById("builderAllocationName");
            var AmountElement = document.getElementById("builderAllocationAmount");
            AmountElement.classList.remove("is-danger");
            NameElement.classList.remove("is-danger");
            var Amount = parseFloat(AmountElement.value);
            var BuilderName = NameElement.value.trim().toUpperCase();
            if (BuilderName.length < 3) {
                NameElement.focus();
                NameElement.classList.add("is-danger");
                var NameErrorElement = document.getElementById("builderAllocationNameError");
                Utilities.Error_Show(NameErrorElement);
                return;
            }
            if (isNaN(Amount) || Amount < 0) {
                // show error messages
                AmountElement.focus();
                AmountElement.classList.add("is-danger");
                var errorElement = document.getElementById("builderAllocationAmountError");
                Utilities.Error_Show(errorElement);
                return;
            }
            var b = new BuilderAllocation();
            b.Agreement_Number = agreementNumber;
            b.Builder_Name = BuilderName;
            b.Allocation_Amount = Amount;
            b.Id = builderId;
            //XHR.SaveObject<BuilderAllocation>("./.API/ImpactFees/SaveBuilderAllocation", b)
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            Utilities.Post(path + "API/ImpactFees/SaveBuilderAllocation", b)
                .then(function (a) {
                console.log('response', a);
                if (a.length > 0) {
                    Utilities.Show(builderAllocationErrorContainer);
                    builderAllocationError.value = a.join("\n");
                }
                else {
                    BuilderAllocation.LoadBuilders(agreementSelect);
                }
            }).catch(function (e) {
                // figure out what we want to do with the errors.
                Utilities.Show(builderAllocationErrorContainer);
                builderAllocationError.value = e;
            });
        };
        return BuilderAllocation;
    }());
    ImpactFees.BuilderAllocation = BuilderAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=BuilderAllocation.js.map