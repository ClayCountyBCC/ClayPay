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
            let notification = document.createElement("div");
            notification.classList.add("notification");
            notification.classList.add("is-danger");
            let deleteButton = document.createElement("button");
            deleteButton.classList.add("delete");
            deleteButton.onclick = () => {
                Hide(e);
            };
            notification.appendChild(deleteButton);
            if (Array.isArray(errorText)) {
                // we're assuming that errorText is an array if we get here.
                let ul = document.createElement("ul");
                errorText.forEach((et) => {
                    let li = document.createElement("li");
                    li.appendChild(document.createTextNode(et));
                    ul.appendChild(li);
                });
                notification.appendChild(ul);
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
    function Create_Option(value, label, selected = false) {
        let o = document.createElement("option");
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
        let id = elementId.replace("nav-", "");
        let menuItems = document.querySelectorAll("#menuTabs > li > a");
        if (menuItems.length > 0) {
            for (let i = 0; i < menuItems.length; i++) {
                let item = menuItems.item(i);
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
        let sections = document.querySelectorAll(selector);
        if (sections.length > 0) {
            for (let i = 0; i < sections.length; i++) {
                let item = sections.item(i);
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
            .then(response => {
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
        }).then(response => {
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
        let ele = e;
        ele.tagName.toLowerCase() === "select" ? ele.parentElement.classList.remove("is-danger") : ele.classList.remove("is-danger");
        let v = Get_Value(ele).trim();
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
        let b = e;
        b.disabled = disabled;
        b.classList.toggle("is-loading", disabled);
    }
    Utilities.Toggle_Loading_Button = Toggle_Loading_Button;
    function Create_Menu_Element(menuItem) {
        let li = document.createElement("li");
        if (menuItem.selected)
            li.classList.add("is-active");
        let a = document.createElement("a");
        a.id = menuItem.id;
        a.href = "#";
        a.onclick = function () {
            let title = document.getElementById("menuTitle");
            let subTitle = document.getElementById("menuSubTitle");
            Utilities.Clear_Element(title);
            Utilities.Clear_Element(subTitle);
            title.appendChild(document.createTextNode(menuItem.title));
            subTitle.appendChild(document.createTextNode(menuItem.subTitle));
            Utilities.Show_Menu(menuItem.id);
        };
        if (menuItem.icon.length > 0) {
            let span = document.createElement("span");
            span.classList.add("icon");
            span.classList.add("is-medium");
            let i = document.createElement("i");
            let icons = menuItem.icon.split(" ");
            for (let icon of icons) {
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
})(Utilities || (Utilities = {}));
//# sourceMappingURL=Utilities.js.map
var clayPay;
(function (clayPay) {
    let ChargeView;
    (function (ChargeView) {
        ChargeView[ChargeView["search_results"] = 0] = "search_results";
        ChargeView[ChargeView["cart"] = 1] = "cart";
        ChargeView[ChargeView["receipt"] = 2] = "receipt";
    })(ChargeView = clayPay.ChargeView || (clayPay.ChargeView = {}));
    class Charge {
        constructor() {
            this.ItemId = 0;
            this.Description = "";
            this.TimeStampDisplay = "";
        }
        static CreateTable(view) {
            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            let thead = document.createElement("THEAD");
            let tr = document.createElement("tr");
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
        }
        static CreateChargesTable(charges, view) {
            let df = document.createDocumentFragment();
            let table = Charge.CreateTable(view);
            let tbody = document.createElement("TBODY");
            charges.forEach(function (charge) {
                tbody.appendChild(Charge.buildChargeRow(charge, view));
            });
            let tfoot = document.createElement("TFOOT");
            tfoot.appendChild(Charge.buildChargeFooterRow(charges, view));
            table.appendChild(tbody);
            table.appendChild(tfoot);
            df.appendChild(table);
            return df;
        }
        static buildChargeFooterRow(charges, view) {
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
            let df = document.createDocumentFragment();
            let trTotal = document.createElement("tr");
            trTotal.appendChild(clayPay.UI.createTableElement("", "", view === ChargeView.receipt ? 1 : 2));
            trTotal.appendChild(clayPay.UI.createTableElement("Total", "has-text-weight-bold has-text-right", 1));
            let TotalAmount = charges.reduce((total, b) => {
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
        }
        static buildConvFeeFooterRow() {
            let tr = document.createElement("tr");
            tr.style.fontWeight = "bolder";
            tr.appendChild(clayPay.UI.createTableElement("There is a nonrefundable transaction fee charged for Credit Card Payments by our payment provider. This is charged in addition to the total above.", "", 2));
            tr.appendChild(clayPay.UI.createTableElement("Conv. Fee", "center", 1));
            tr.appendChild(clayPay.UI.createTableElement(clayPay.ConvenienceFee, "", 1));
            tr.appendChild(clayPay.UI.createTableElement("", "", 1));
            return tr;
        }
        static buildChargeRow(charge, view) {
            let tr = document.createElement("tr");
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
        }
        static createAddAllChargesToCartButton() {
            let td = document.createElement("td");
            let button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-primary");
            button.appendChild(document.createTextNode("Add All To Cart"));
            button.onclick = (ev) => {
                for (let charge of clayPay.CurrentTransaction.CurrentCharges) {
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
        }
        static createChargeCartButtonToggle(value, itemId, className, toggle) {
            let removeButton = document.createElement("a");
            let remove = document.createElement("div");
            let addButton = document.createElement("button");
            let IsInCart = clayPay.UI.IsItemInCart(itemId);
            let d = document.createElement("td");
            d.className = className;
            addButton.style.display = IsInCart ? "none" : "inline-block";
            addButton.type = "button";
            addButton.className = "button is-primary";
            addButton.onclick = (ev) => {
                let item = clayPay.CurrentTransaction.CurrentCharges.filter((c) => {
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
            removeButton.onclick = (ev) => {
                let newCart = clayPay.CurrentTransaction.Cart.filter((c) => {
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
        }
        static createViewCartFooterRow() {
            let tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableElement("", "", 4));
            let td = document.createElement("td");
            let button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-success");
            button.onclick = (ev) => {
                let menulist = clayPay.UI.Menus.filter(function (j) { return j.id === "nav-cart"; });
                let cartMenu = menulist[0];
                let title = document.getElementById("menuTitle");
                let subTitle = document.getElementById("menuSubTitle");
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
        }
    }
    clayPay.Charge = Charge;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=Charge.js.map
var clayPay;
(function (clayPay) {
    class ReceiptPayment {
        constructor() {
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
        static CreateReceiptPaymentView(receipts) {
            let df = document.createDocumentFragment();
            let table = ReceiptPayment.CreateTable();
            let tbody = document.createElement("TBODY");
            for (let receipt of receipts) {
                let transaction = receipt.CheckNumber.length > 0 ? receipt.CheckNumber : receipt.TransactionId;
                tbody.appendChild(ReceiptPayment.BuildPaymentRow(receipt.PaymentTypeDescription, receipt.Info, transaction, receipt.AmountTendered, receipt.AmountApplied));
            }
            // Here we handle Change Due and Convenience fees.
            // We'll add a row for each of them that are > 0
            let changeDueTmp = receipts.filter(function (j) { return j.ChangeDue > 0; });
            let TotalChangeDue = changeDueTmp.reduce((ChangeDue, b) => {
                return ChangeDue + b.ChangeDue;
            }, 0);
            if (TotalChangeDue > 0) {
                tbody.appendChild(ReceiptPayment.BuildPaymentRow("Total Change Due", "", "", TotalChangeDue, 0));
            }
            let convenienceFeeTmp = receipts.filter(function (j) { return j.ConvenienceFeeAmount > 0; });
            let TotalConvenienceFee = convenienceFeeTmp.reduce((ConvenienceFeeAmount, b) => {
                return ConvenienceFeeAmount + b.ConvenienceFeeAmount;
            }, 0);
            if (TotalConvenienceFee > 0) {
                tbody.appendChild(ReceiptPayment.BuildPaymentRow("Convenience Fee Estimate", "", "", TotalConvenienceFee, 0));
            }
            table.appendChild(tbody);
            df.appendChild(table);
            return df;
        }
        static CreateTable() {
            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            let thead = document.createElement("THEAD");
            let tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableHeaderElement("Payment Type", "15%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Info", "35%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Check/Trans#", "20%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Tendered", "15%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Applied", "15%"));
            thead.appendChild(tr);
            table.appendChild(thead);
            return table;
        }
        static BuildPaymentRow(paymentType, info, checkNumber, tendered, applied) {
            let tr = document.createElement("tr");
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
        }
    }
    clayPay.ReceiptPayment = ReceiptPayment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=ReceiptPayment.js.map
var clayPay;
(function (clayPay) {
    class ClientResponse {
        constructor() {
            this.ResponseCashierData = new clayPay.CashierData();
            this.Charges = [];
            this.ReceiptPayments = [];
            this.TransactionId = "";
            this.Errors = []; // Errors are full stop, meaning the payment did not process.
            this.PartialErrors = []; // Partial errors mean part of the transaction was completed, but something wasn't.
        }
        static ShowPaymentReceipt(cr) {
            console.log('client response ShowPaymentReceipt', cr);
            let container = document.getElementById(ClientResponse.ReceiptContainer);
            Utilities.Clear_Element(container);
            container.appendChild(ClientResponse.CreateReceiptView(cr));
            Utilities.Show_Hide_Selector("#views > section", ClientResponse.ReceiptContainer);
        }
        static CreateReceiptView(cr) {
            let df = document.createDocumentFragment();
            if (cr.ReceiptPayments.length === 0)
                return df;
            df.appendChild(ClientResponse.CreateReceiptHeader(cr));
            df.appendChild(ClientResponse.CreateReceiptPayerView(cr.ResponseCashierData));
            df.appendChild(clayPay.Charge.CreateChargesTable(cr.Charges, clayPay.ChargeView.receipt));
            df.appendChild(clayPay.ReceiptPayment.CreateReceiptPaymentView(cr.ReceiptPayments));
            // show payment info
            return df;
        }
        static CreateReceiptHeader(cr) {
            let div = document.createElement("div");
            div.classList.add("level");
            let title = document.createElement("span");
            title.classList.add("level-item");
            title.classList.add("title");
            title.appendChild(document.createTextNode("Payment Receipt for: " + cr.ReceiptPayments[0].CashierId));
            let receiptDate = document.createElement("span");
            receiptDate.classList.add("level-item");
            receiptDate.classList.add("subtitle");
            receiptDate.appendChild(document.createTextNode("Transaction Date: " + Utilities.Format_Date(cr.ResponseCashierData.TransactionDate)));
            div.appendChild(title);
            div.appendChild(receiptDate);
            let timestamp = cr.ResponseCashierData.TransactionDate;
            return div;
        }
        static CreateReceiptPayerView(cd) {
            let df = document.createDocumentFragment();
            df.appendChild(ClientResponse.CreatePayerDataColumns("Name", cd.PayerName, "Company Name", cd.PayerCompanyName));
            df.appendChild(ClientResponse.CreatePayerDataColumns("Phone Number", cd.PayerPhoneNumber, "Email Address", cd.PayerEmailAddress));
            df.appendChild(ClientResponse.CreatePayerDataColumns("Street Address", cd.PayerStreet1, "Address 2", cd.PayerStreet2));
            df.appendChild(ClientResponse.CreatePayerDataColumns("Processed By", cd.UserName, "", ""));
            return df;
        }
        static CreatePayerDataColumns(label1, value1, label2, value2) {
            let div = document.createElement("div");
            div.classList.add("columns");
            div.style.marginBottom = "0";
            div.appendChild(ClientResponse.CreatePayerData(label1, value1));
            div.appendChild(ClientResponse.CreatePayerData(label2, value2));
            return div;
        }
        static CreatePayerData(label, value) {
            let field = document.createElement("div");
            field.classList.add("field");
            field.classList.add("column");
            let dataLabel = document.createElement("label");
            dataLabel.classList.add("label");
            dataLabel.appendChild(document.createTextNode(label));
            let control = document.createElement("div");
            control.classList.add("control");
            let input = document.createElement("input");
            input.classList.add("input");
            input.classList.add("is-static");
            input.readOnly = true;
            input.type = "text";
            input.value = value;
            control.appendChild(input);
            field.appendChild(dataLabel);
            field.appendChild(control);
            return field;
        }
        static Search() {
            Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, true);
            let input = document.getElementById(ClientResponse.receiptSearchInput);
            let k = input.value.trim().toUpperCase();
            if (k.length !== 9) {
                Utilities.Error_Show(ClientResponse.receiptSearchError, "Receipts must be 8 digits and a dash, like 18-000001.");
                return;
            }
            if (k.length > 0) {
                let path = "/";
                let i = window.location.pathname.toLowerCase().indexOf("/claypay");
                if (i == 0) {
                    path = "/claypay/";
                }
                Utilities.Get(path + "API/Payments/Receipt/?CashierId=" + k).then(function (cr) {
                    console.log('Client Response', cr);
                    if (cr.Errors.length > 0) {
                        Utilities.Error_Show(ClientResponse.receiptSearchError, cr.Errors);
                    }
                    else {
                        ClientResponse.ShowPaymentReceipt(cr);
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
        }
    }
    ClientResponse.CashierErrorTarget = "paymentError";
    ClientResponse.PublicErrorTarget = "publicPaymentError";
    ClientResponse.ReceiptContainer = "receipt";
    //static ReceiptErrorContainer: string = "receiptTransactionErrorContainer"; // To be used for partial payments.
    // receiptSearchElements
    ClientResponse.receiptSearchInput = "receiptSearch";
    ClientResponse.receiptSearchButton = "receiptSearchButton";
    ClientResponse.receiptSearchError = "receiptSearchError";
    clayPay.ClientResponse = ClientResponse;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=ClientResponse.js.map
var Balancing;
(function (Balancing) {
    class Account {
        constructor() {
            this.Fund = "";
            this.AccountNumber = "";
            this.Project = "";
            this.ProjectAccount = "";
            this.Total = "";
            this.CashAccount = "";
        }
    }
    Balancing.Account = Account;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=Account.js.map
var Balancing;
(function (Balancing) {
    class CashierTotal {
        constructor() {
            this.Type = "";
            this.Code = "";
            this.TotalAmount = 0;
        }
    }
    Balancing.CashierTotal = CashierTotal;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=CashierTotal.js.map
var Balancing;
(function (Balancing) {
    class Payment {
        constructor() {
        }
        static ShowPayments(payments, paymentType, paymentDate) {
            let paymentContainer = document.getElementById(Balancing.Payment.PaymentsContainer);
            Utilities.Clear_Element(paymentContainer);
            let df = document.createDocumentFragment();
            df.appendChild(Balancing.Payment.CreatePaymentTable(payments, paymentType, paymentDate));
            paymentContainer.appendChild(df);
        }
        static CreatePaymentTable(payments, paymentType, paymentDate) {
            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            // Add Level showing Payment Type / Payment Date / Close button
            table.appendChild(Balancing.Payment.createPaymentTableHeader(paymentType, paymentDate));
            let tbody = document.createElement("tbody");
            // Table with payment info
            for (let p of payments) {
                let tr = document.createElement("tr");
                tr.appendChild(Balancing.Payment.createTableCellLink("td", p.CashierId, "20%"));
                tr.appendChild(Balancing.Payment.createTableCell("td", p.Name, "40%"));
                tr.appendChild(Balancing.Payment.createTableCell("td", Utilities.Format_Date(p.TransactionDate), "25%"));
                let amount = Balancing.Payment.createTableCell("td", Utilities.Format_Amount(p.Total), "15%");
                amount.classList.add("has-text-right");
                tr.appendChild(amount);
                tbody.appendChild(tr);
            }
            table.appendChild(tbody);
            // Show close button
            table.appendChild(Balancing.Payment.createPaymentTableFooter());
            return table;
        }
        static CreateCloseButton() {
            let button = document.createElement("button");
            button.type = "button";
            button.classList.add("is-primary");
            button.classList.add("button");
            button.onclick = () => {
                Utilities.Hide(Balancing.Payment.PaymentsContainer);
                Utilities.Show(Balancing.Payment.DJournalTotalsContainer);
            };
            button.appendChild(document.createTextNode("Close"));
            return button;
        }
        static createPaymentTableHeader(paymentType, paymentDate) {
            let thead = document.createElement("THEAD");
            let trTitle = document.createElement("tr");
            let paymentTypeHeader = document.createElement("th");
            paymentTypeHeader.colSpan = 2;
            paymentTypeHeader.appendChild(document.createTextNode(paymentType + " Payments"));
            paymentTypeHeader.classList.add("has-text-centered");
            paymentTypeHeader.style.verticalAlign = "middle";
            let paymentDateHeader = document.createElement("th");
            paymentDateHeader.classList.add("has-text-centered");
            paymentDateHeader.appendChild(document.createTextNode(paymentDate));
            paymentDateHeader.style.verticalAlign = "middle";
            let closeButtonHeader = document.createElement("th");
            closeButtonHeader.classList.add("has-text-centered");
            closeButtonHeader.appendChild(Balancing.Payment.CreateCloseButton());
            trTitle.appendChild(paymentTypeHeader);
            trTitle.appendChild(paymentDateHeader);
            trTitle.appendChild(closeButtonHeader);
            thead.appendChild(trTitle);
            let tr = document.createElement("tr");
            tr.appendChild(Balancing.Payment.createTableCell("th", "Cashier Id", "20%"));
            tr.appendChild(Balancing.Payment.createTableCell("th", "Name", "40%"));
            tr.appendChild(Balancing.Payment.createTableCell("th", "Transaction Date", "25%"));
            let total = Balancing.Payment.createTableCell("th", "Total", "15%", "has-text-right");
            tr.appendChild(total);
            thead.appendChild(tr);
            return thead;
        }
        static createPaymentTableFooter() {
            let tfoot = document.createElement("TFOOT");
            let tr = document.createElement("tr");
            let td = document.createElement("td");
            td.colSpan = 3;
            let closeButton = document.createElement("td");
            closeButton.classList.add("has-text-centered");
            closeButton.appendChild(Balancing.Payment.CreateCloseButton());
            tr.appendChild(td);
            tr.appendChild(closeButton);
            tfoot.appendChild(tr);
            return tfoot;
        }
        static createTableCell(type, value, width, className = "") {
            let cell = document.createElement(type);
            cell.width = width;
            if (className.length > 0)
                cell.classList.add(className);
            cell.appendChild(document.createTextNode(value));
            return cell;
        }
        static createTableCellLink(type, value, width) {
            let cell = document.createElement(type);
            cell.width = width;
            let link = document.createElement("a");
            link.onclick = () => {
                Utilities.Set_Text(link, "loading...");
                let path = "/";
                let qs = "";
                let i = window.location.pathname.toLowerCase().indexOf("/claypay");
                if (i == 0) {
                    path = "/claypay/";
                }
                //DateTime DateToBalance, string PaymentType
                qs = "?CashierId=" + value;
                Utilities.Get(path + "API/Balancing/Receipt" + qs)
                    .then(function (cr) {
                    console.log('client response', cr);
                    Utilities.Set_Text(link, value);
                    //Balancing.Payment.ShowPayments(payments, value, djournalDate);
                    //Utilities.Hide(DJournal.DJournalTotalsContainer);
                    //Utilities.Hide(DJournal.DJournalReceiptContainer);
                    //Utilities.Set_Text(link, value); // change it back
                    //Utilities.Show(DJournal.PaymentsContainer);
                }, function (error) {
                    console.log('error getting client response for cashier id: ' + value, error);
                    Utilities.Set_Text(link, value); // change it back
                });
            };
            link.appendChild(document.createTextNode(value));
            cell.appendChild(link);
            return cell;
        }
    }
    Payment.PaymentsContainer = "djournalPaymentsByType";
    Payment.DJournalTotalsContainer = "djournalTotals";
    Payment.DJournalReceiptContainer = "djournalReceipt";
    Balancing.Payment = Payment;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=Payment.js.map
var Balancing;
(function (Balancing) {
    class DJournal {
        constructor() {
            this.ProcessedPaymentTotals = [];
            this.GUTotals = [];
            this.GLAccountTotals = [];
            this.Log = new Balancing.DJournalLog();
            this.Error = [];
            this.DJournalDate = new Date();
            this.DJournalDateFormatted = "";
        }
        static GetAndShow(DJournalDate = "") {
            let path = "/";
            let i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            let query = "";
            if (DJournalDate.length > 0) {
                query = "?DateToBalance=" + DJournalDate;
            }
            Utilities.Get(path + "API/Balancing/GetDJournal" + query).then(function (dj) {
                console.log('djournal', dj);
                let dateInput = document.getElementById(DJournal.DJournalDateInput);
                Utilities.Set_Value(dateInput, dj.DJournalDateFormatted);
                DJournal.BuildDJournalDisplay(dj);
            }, function (error) {
                console.log('error', error);
            });
        }
        static BuildDJournalDisplay(dj) {
            let target = document.getElementById(DJournal.DJournalTotalsContainer);
            let df = document.createDocumentFragment();
            df.appendChild(DJournal.CreateDJournalTable(dj));
            Utilities.Clear_Element(target);
            target.appendChild(df);
        }
        static CreateDJournalTable(dj) {
            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            table.classList.add("is-bordered");
            table.appendChild(DJournal.BuildDJournalHeader());
            let tbody = document.createElement("tbody");
            let tfoot = document.createElement("tfoot");
            let totalCharges;
            let totalDeposits;
            let totalPayments;
            for (let payment of dj.ProcessedPaymentTotals) {
                switch (payment.Type) {
                    case "Total Charges":
                        totalCharges = payment;
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
                }
            }
            let tr = DJournal.BuildDJournalRow(totalPayments.Type, totalPayments.TotalAmount, totalDeposits.Type, totalDeposits.TotalAmount);
            tr.style.backgroundColor = "#fafafa";
            tfoot.appendChild(tr);
            tfoot.appendChild(DJournal.BuildDJournalRow(totalCharges.Type, totalCharges.TotalAmount, "", -1));
            for (let gutotal of dj.GUTotals) {
                tfoot.appendChild(DJournal.BuildDJournalRow(gutotal.Type, gutotal.TotalAmount, "", -1));
            }
            table.appendChild(tbody);
            table.appendChild(tfoot);
            return table;
        }
        static BuildDJournalHeader() {
            let head = document.createElement("THEAD");
            let tr = document.createElement("tr");
            let payments = document.createElement("th");
            payments.colSpan = 2;
            payments.width = "60%";
            payments.classList.add("has-text-right");
            payments.appendChild(document.createTextNode("Payments"));
            tr.appendChild(payments);
            let deposits = document.createElement("th");
            deposits.colSpan = 2;
            deposits.width = "40%";
            deposits.classList.add("has-text-right");
            deposits.appendChild(document.createTextNode("Deposits"));
            tr.appendChild(deposits);
            head.appendChild(tr);
            return head;
        }
        static BuildDJournalRow(paymentLabel, paymentAmount, depositLabel, depositAmount) {
            let tr = document.createElement("tr");
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
        }
        static BuildShortDJournalRow(payment, djournalDate) {
            let tr = document.createElement("tr");
            tr.appendChild(DJournal.CreateTableCellLink(payment.Type, payment.Code, "45%", djournalDate));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
            tr.appendChild(DJournal.CreateTableCell(payment.Type + " Deposits", "25%"));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
            return tr;
        }
        static BuildPaymentRow(payment, djournalDate) {
            let tr = document.createElement("tr");
            tr.appendChild(DJournal.CreateTableCellLink(payment.Type, payment.Code, "45%", djournalDate));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
            tr.appendChild(DJournal.CreateTableCell("", "25%"));
            tr.appendChild(DJournal.CreateTableCell("", "15%"));
            return tr;
        }
        static CreateTableCell(value, width) {
            let td = document.createElement("td");
            td.classList.add("has-text-right");
            td.width = width;
            td.appendChild(document.createTextNode(value));
            return td;
        }
        static CreateTableCellLink(value, paymentType, width, djournalDate) {
            let td = document.createElement("td");
            td.classList.add("has-text-right");
            td.width = width;
            let link = document.createElement("A");
            link.onclick = () => {
                Utilities.Set_Text(link, "loading...");
                // load data here
                let path = "/";
                let qs = "";
                let i = window.location.pathname.toLowerCase().indexOf("/claypay");
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
                    Utilities.Hide(DJournal.DJournalReceiptContainer);
                    Utilities.Set_Text(link, value); // change it back
                    Utilities.Show(DJournal.PaymentsContainer);
                }, function (error) {
                    console.log('error getting payments for payment type: ' + paymentType, error);
                    Utilities.Set_Text(link, value); // change it back
                });
            };
            link.appendChild(document.createTextNode(value));
            td.appendChild(link);
            return td;
        }
    }
    DJournal.DJournalTotalsContainer = "djournalTotals";
    DJournal.DJournalDateInput = "djournalDate";
    DJournal.DjournalContainer = "balancingDJournal";
    DJournal.PaymentsContainer = "djournalPaymentsByType";
    DJournal.DJournalReceiptContainer = "djournalReceipt";
    Balancing.DJournal = DJournal;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=DJournal.js.map
var Balancing;
(function (Balancing) {
    class DJournalLog {
        constructor() {
            this.CreatedBy = "";
            this.IsCreated = false;
        }
    }
    Balancing.DJournalLog = DJournalLog;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=DjournalLog.js.map
var Balancing;
(function (Balancing) {
    let Menus = [
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
            subTitle: "The payments made online will be listed here.",
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
    }
    Balancing.Start = Start;
    function buildMenuElements() {
        let menu = document.getElementById("menuTabs");
        for (let menuItem of Menus) {
            menu.appendChild(Utilities.Create_Menu_Element(menuItem));
        }
    }
    Balancing.buildMenuElements = buildMenuElements;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=Balancing.js.map