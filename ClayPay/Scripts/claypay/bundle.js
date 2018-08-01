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
    function Put(url, data) {
        return fetch(url, {
            method: "PUT",
            body: JSON.stringify(data),
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        }).then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        });
    }
    Utilities.Put = Put;
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
    class CashierData {
        constructor() {
            this.PayerFirstName = "";
            this.PayerLastName = "";
            this.PayerName = "";
            this.PayerPhoneNumber = "";
            this.PayerEmailAddress = "";
            this.PayerCompanyName = "";
            this.PayerStreetAddress = "";
            this.PayerStreet1 = "";
            this.PayerStreet2 = "";
            this.PayerCity = "";
            this.PayerState = "";
            this.PayerZip = "";
            this.UserName = "";
            this.TransactionDate = new Date();
        }
        ValidatePayer() {
            this.ResetPayerData();
            this.PayerFirstName = Utilities.Validate_Text(CashierData.payerFirstName, CashierData.payerNameError, "The Firstname field is required.");
            if (this.PayerFirstName.length === 0)
                return false;
            this.PayerLastName = Utilities.Validate_Text(CashierData.payerLastName, CashierData.payerNameError, "The Lastname field is required.");
            if (this.PayerLastName.length === 0)
                return false;
            this.PayerPhoneNumber = Utilities.Validate_Text(CashierData.payerPhone, CashierData.payerPhoneError, "The Phone number field is required.");
            if (this.PayerPhoneNumber.length === 0)
                return false;
            if (this.PayerPhoneNumber.length < 10) {
                Utilities.Error_Show(CashierData.payerPhoneError, "The Phone Number should include area code and a 7 digit number.");
                let element = document.getElementById(CashierData.payerPhone);
                element.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return false;
            }
            this.PayerEmailAddress = Utilities.Get_Value(CashierData.payerEmail).trim();
            this.PayerCompanyName = Utilities.Get_Value(CashierData.payerCompany).trim();
            this.PayerStreetAddress = Utilities.Validate_Text(CashierData.payerStreet, CashierData.payerStreetError, "The street address field is required.");
            if (this.PayerStreetAddress.length === 0)
                return false;
            this.PayerCity = Utilities.Validate_Text(CashierData.payerCity, CashierData.payerCityError, "The City field is required.");
            if (this.PayerCity.length === 0)
                return false;
            this.PayerState = Utilities.Validate_Text(CashierData.payerState, CashierData.payerCityError, "The State field is required.");
            if (this.PayerState.length === 0)
                return false;
            this.PayerZip = Utilities.Validate_Text(CashierData.payerZip, CashierData.payerCityError, "You must enter a Zip code of at least 5 digits.");
            if (this.PayerZip.length === 0)
                return false;
            if (this.PayerZip.length < 5) {
                Utilities.Error_Show(CashierData.payerCityError, "You must enter a Zip code of at least 5 digits.");
                let element = document.getElementById(CashierData.payerZip);
                element.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return false;
            }
            return true;
        }
        ResetPayerForm() {
            Utilities.Set_Value(CashierData.payerCity, "");
            Utilities.Set_Value(CashierData.payerCompany, "");
            Utilities.Set_Value(CashierData.payerFirstName, "");
            Utilities.Set_Value(CashierData.payerLastName, "");
            Utilities.Set_Value(CashierData.payerPhone, "");
            Utilities.Set_Value(CashierData.payerEmail, "");
            Utilities.Set_Value(CashierData.payerStreet, "");
            document.getElementById(CashierData.payerState).selectedIndex = 0;
        }
        ResetPayerData() {
            this.PayerFirstName = "";
            this.PayerLastName = "";
            this.PayerPhoneNumber = "";
            this.PayerEmailAddress = "";
            this.PayerCompanyName = "";
            this.PayerState = "";
            this.PayerCity = "";
            this.PayerStreetAddress = "";
            this.PayerZip = "";
        }
    }
    // Payer Inputs
    CashierData.payerFirstName = "payerFirstName";
    CashierData.payerLastName = "payerLastName";
    CashierData.payerPhone = "payerPhone";
    CashierData.payerEmail = "payerEmailAddress";
    CashierData.payerCompany = "payerCompany";
    CashierData.payerStreet = "payerStreetAddress";
    CashierData.payerCity = "payerCity";
    CashierData.payerState = "payerState";
    CashierData.payerZip = "payerZip";
    // Payer error text elemnets
    CashierData.payerNameError = "payerNameError";
    CashierData.payerPhoneError = "payerPhoneError";
    CashierData.payerStreetError = "payerStreetError";
    CashierData.payerCityError = "payerCityError";
    clayPay.CashierData = CashierData;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=CashierData.js.map
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
Number.isNaN = Number.isNaN || function (value) {
    return value !== value;
};
var clayPay;
(function (clayPay) {
    let payment_type;
    (function (payment_type) {
        payment_type[payment_type["cash"] = 0] = "cash";
        payment_type[payment_type["check"] = 1] = "check";
        payment_type[payment_type["credit_card_public"] = 2] = "credit_card_public";
        payment_type[payment_type["impact_fee_credit"] = 3] = "impact_fee_credit";
        payment_type[payment_type["impact_fee_exemption"] = 4] = "impact_fee_exemption";
        payment_type[payment_type["impact_fee_waiver_school"] = 5] = "impact_fee_waiver_school";
        payment_type[payment_type["impact_fee_waiver_road"] = 6] = "impact_fee_waiver_road";
        payment_type[payment_type["credit_card_cashier"] = 7] = "credit_card_cashier";
    })(payment_type = clayPay.payment_type || (clayPay.payment_type = {}));
    class Payment {
        constructor(paymentType) {
            this.Editable = false;
            this.Amount = 0;
            this.CheckNumber = "";
            this.TransactionId = "";
            this.Validated = false;
            this.Error = "";
            this.PaymentType = paymentType;
        }
        UpdateTotal() {
            let input = this.PaymentType === payment_type.cash ? Payment.cashAmountInput : Payment.checkAmountInput;
            Utilities.Set_Value(input, this.Amount.toFixed(2));
        }
        Validate() {
            this.Validated == false;
            this.Amount = 0;
            this.CheckNumber = "";
            this.TransactionId = "";
            // We don't need to validate Credit card payments here
            // because they are validated in CCData.
            if (this.PaymentType === payment_type.cash) {
                return this.ValidateCash();
            }
            else {
                return this.ValidateCheck();
            }
        }
        ValidateCash() {
            this.Validated = false;
            let cashAmount = document.getElementById(Payment.cashAmountInput);
            // check that an amount was entered.
            // It must be 0 or greater.
            let testAmount = Utilities.Validate_Text(Payment.cashAmountInput, Payment.cashErrorElement, "You must enter an amount of 0 or greater in order to continue.");
            if (testAmount.length === 0)
                return;
            // check that it's a valid amount.
            // 0 is valid because they could've set it to greater than 0
            // and are now wanting to revert it back to 0.      
            this.Amount = parseFloat(testAmount);
            if (Number.isNaN(this.Amount) || this.Amount < 0) {
                cashAmount.classList.add("is-danger");
                cashAmount.focus();
                cashAmount.scrollTo();
                this.Amount = 0;
                Utilities.Error_Show(Payment.cashErrorElement, "An invalid amount was entered.");
                return false;
            }
            if (this.Amount === 0) {
                Payment.ResetCash();
                return false;
            }
            this.Validated = true;
            Utilities.Set_Text(Payment.cashPaymentTotalMenu, Utilities.Format_Amount(this.Amount));
            Utilities.Hide(Payment.cashPaymentContainer);
            clayPay.CurrentTransaction.Validate();
            return this.Validated;
        }
        ValidateCheck() {
            this.Validated = false;
            let checkAmount = document.getElementById(Payment.checkAmountInput);
            //let checkNumber = <HTMLInputElement>document.getElementById(Payment.checkNumberInput);
            //let checkError = document.getElementById(Payment.checkErrorElement);
            //checkAmount.classList.remove("is-danger");
            //checkNumber.classList.remove("is-danger");
            // check that an amount was entered.
            let testAmount = Utilities.Validate_Text(Payment.checkAmountInput, Payment.checkErrorElement, "You must enter an amount of 0 or greater in order to continue.");
            if (testAmount.length === 0)
                return;
            // check that it's a valid amount.
            // 0 is valid because they could've set it to greater than 0
            // and are now wanting to revert it back to 0.
            // We are also going to make sure that the amount is >= 0.
            this.Amount = parseFloat(testAmount);
            if (Number.isNaN(this.Amount) || this.Amount < 0) {
                checkAmount.classList.add("is-danger");
                checkAmount.focus();
                checkAmount.scrollTo();
                this.Amount = 0;
                Utilities.Error_Show(Payment.checkErrorElement, "An invalid amount was entered.");
                return false;
            }
            if (this.Amount > clayPay.CurrentTransaction.TotalAmountDue) {
                checkAmount.classList.add("is-danger");
                checkAmount.focus();
                checkAmount.scrollTo();
                Utilities.Error_Show(Payment.checkErrorElement, "You cannot enter an amount for more than the total amount due.");
                return false;
            }
            // get the check number
            this.CheckNumber = Utilities.Validate_Text(Payment.checkNumberInput, Payment.checkErrorElement, "You must enter the check number to continue.");
            if (this.CheckNumber.length === 0)
                return;
            if (this.Amount === 0) {
                Payment.ResetCheck();
                return false;
            }
            this.Validated = true;
            Utilities.Set_Text(Payment.checkPaymentTotalMenu, Utilities.Format_Amount(this.Amount));
            Utilities.Hide(Payment.checkPaymentContainer);
            clayPay.CurrentTransaction.Validate();
            return this.Validated;
        }
        static ResetAll() {
            Payment.ResetCash();
            Payment.ResetCheck();
        }
        static ResetCash() {
            clayPay.CurrentTransaction.CashPayment = new Payment(payment_type.cash);
            let e = document.getElementById(Payment.cashAmountInput);
            Utilities.Set_Value(e, "");
            e.classList.remove("is-danger");
            let menu = document.getElementById(Payment.cashPaymentTotalMenu);
            Utilities.Set_Text(menu, "Add");
            Utilities.Hide(Payment.cashPaymentContainer);
            clayPay.CurrentTransaction.Validate();
        }
        static ResetCheck() {
            clayPay.CurrentTransaction.CheckPayment = new Payment(payment_type.check);
            let amount = document.getElementById(Payment.checkAmountInput);
            Utilities.Set_Value(amount, "");
            amount.classList.remove("is-danger");
            let number = document.getElementById(Payment.checkNumberInput);
            Utilities.Set_Value(number, "");
            number.classList.remove("is-danger");
            let menu = document.getElementById(Payment.checkPaymentTotalMenu);
            Utilities.Set_Text(menu, "Add");
            Utilities.Hide(Payment.checkPaymentContainer);
            clayPay.CurrentTransaction.Validate();
        }
    }
    Payment.checkErrorElement = "checkPaymentError";
    Payment.checkAmountInput = "checkPaymentAmount";
    Payment.checkNumberInput = "checkNumber";
    Payment.checkPaymentTotalMenu = "checkPaymentTotal";
    Payment.checkPaymentContainer = "checkPaymentType";
    Payment.cashErrorElement = "cashPaymentError";
    Payment.cashAmountInput = "cashPaymentAmount";
    Payment.cashPaymentTotalMenu = "cashPaymentTotal";
    Payment.cashPaymentContainer = "cashPaymentType";
    clayPay.Payment = Payment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=payment.js.map
var clayPay;
(function (clayPay) {
    class CCPayment {
        constructor() {
            this.Validated = false;
        }
        UpdatePayerData() {
            Utilities.Set_Value(CCPayment.FirstNameInput, this.FirstName);
            Utilities.Set_Value(CCPayment.LastNameInput, this.LastName);
            Utilities.Set_Value(CCPayment.EmailAddressInput, this.EmailAddress);
            Utilities.Set_Value(CCPayment.ZipCodeInput, this.ZipCode);
        }
        UpdateTotal() {
            Utilities.Set_Value(CCPayment.AmountPaidInput, this.Amount.toFixed(2));
        }
        ResetForm() {
            this.ResetData();
            this.ResetFormErrors();
            // now clear the form
            Utilities.Set_Value(CCPayment.FirstNameInput, "");
            Utilities.Set_Value(CCPayment.LastNameInput, "");
            Utilities.Set_Value(CCPayment.ZipCodeInput, "");
            Utilities.Set_Value(CCPayment.EmailAddressInput, "");
            Utilities.Set_Value(CCPayment.ccNumberInput, "");
            document.getElementById(CCPayment.ccTypeSelect).selectedIndex = 0;
            document.getElementById(CCPayment.ccMonthSelect).selectedIndex = 0;
            document.getElementById(CCPayment.ccYearSelect).selectedIndex = 0;
            Utilities.Set_Value(CCPayment.ccCVCInput, "");
            Utilities.Set_Value(CCPayment.AmountPaidInput, "");
            Utilities.Hide(CCPayment.CreditCardForm);
        }
        ResetData() {
            this.Amount = 0;
            this.Validated = false;
            this.FirstName = "";
            this.LastName = "";
            this.EmailAddress = "";
            this.ZipCode = "";
            this.CardNumber = "";
            this.CardType = "";
            this.ExpMonth = "";
            this.ExpYear = "";
            this.CVVNumber = "";
        }
        ResetFormErrors() {
            document.getElementById(CCPayment.FirstNameInput).classList.remove("is-danger");
            document.getElementById(CCPayment.LastNameInput).classList.remove("is-danger");
            document.getElementById(CCPayment.ZipCodeInput).classList.remove("is-danger");
            document.getElementById(CCPayment.EmailAddressInput).classList.remove("is-danger");
            document.getElementById(CCPayment.ccNumberInput).classList.remove("is-danger");
            document.getElementById(CCPayment.ccTypeSelect).parentElement.classList.remove("is-danger");
            document.getElementById(CCPayment.ccMonthSelect).parentElement.classList.remove("is-danger");
            document.getElementById(CCPayment.ccYearSelect).parentElement.classList.remove("is-danger");
            document.getElementById(CCPayment.ccCVCInput).classList.remove("is-danger");
            if (clayPay.CurrentTransaction.IsCashier) {
                document.getElementById(CCPayment.AmountPaidInput).classList.remove("is-danger");
            }
        }
        Validate() {
            this.ResetData();
            this.ResetFormErrors();
            this.Validated = false;
            this.FirstName = Utilities.Validate_Text(CCPayment.FirstNameInput, CCPayment.NameError, "The Firstname field is required.");
            if (this.FirstName.length === 0)
                return;
            this.LastName = Utilities.Validate_Text(CCPayment.LastNameInput, CCPayment.NameError, "The Lastname field is required.");
            if (this.LastName.length === 0)
                return;
            this.ZipCode = Utilities.Validate_Text(CCPayment.ZipCodeInput, CCPayment.ZipError, "The Zip code field is required.");
            if (this.ZipCode.length === 0)
                return;
            if (this.ZipCode.length < 5) {
                Utilities.Error_Show(CCPayment.ZipError, "You must enter a Zip code of at least 5 digits.");
                let element = document.getElementById(CCPayment.ZipCodeInput);
                element.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            this.EmailAddress = Utilities.Get_Value(CCPayment.EmailAddressInput).trim();
            if (this.EmailAddress.length > 0 && this.EmailAddress.indexOf("@") == -1) {
                Utilities.Error_Show(CCPayment.ZipError, "The email address appears to be invalid. Please correct it to continue.");
                let element = document.getElementById(CCPayment.EmailAddressInput);
                element.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            this.CardNumber = Utilities.Validate_Text(CCPayment.ccNumberInput, CCPayment.NumberError, "The Credit Card Number field is required.");
            if (this.CardNumber.length === 0)
                return;
            this.CardType = Utilities.Validate_Text(CCPayment.ccTypeSelect, CCPayment.NumberError, "You must select a Card Type.");
            if (this.CardType.length === 0)
                return;
            let cardTypes = ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'];
            if (cardTypes.indexOf(this.CardType) === -1) {
                Utilities.Error_Show(CCPayment.NumberError, "The credit card type appears to be invalid, please correct it and try again.");
                let element = document.getElementById(CCPayment.ccTypeSelect);
                element.parentElement.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            // add in some validation to ensure that only the months we've listed are valid.
            // and check to make sure that the month/year are not in the past.
            this.ExpMonth = Utilities.Validate_Text(CCPayment.ccMonthSelect, CCPayment.ExpirationError, "The Month Expiration field is required.");
            if (this.ExpMonth.length === 0)
                return;
            if (clayPay.UI.ExpMonths.indexOf(this.ExpMonth) === -1) {
                Utilities.Error_Show(CCPayment.ExpirationError, "The Expiration Month appears to be invalid, please correct it and try again.");
                let element = document.getElementById(CCPayment.ccMonthSelect);
                element.parentElement.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            this.ExpYear = Utilities.Validate_Text(CCPayment.ccYearSelect, CCPayment.ExpirationError, "The Year Expiration field is required.");
            if (this.ExpYear.length === 0)
                return;
            if (clayPay.UI.ExpYears.indexOf(this.ExpYear) === -1) {
                Utilities.Error_Show(CCPayment.ExpirationError, "The Expiration Year appears to be invalid, please correct it and try again.");
                let element = document.getElementById(CCPayment.ccYearSelect);
                element.parentElement.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            // here we're checking to make sure that the expiration date they put in is
            // greater than or equal to this month/year.
            let year = parseInt(this.ExpYear);
            let month = parseInt(this.ExpMonth);
            let expD = new Date(year, month - 1, 1); // subtracting 1 from month because Date's month is Base 0
            let tmpD = new Date();
            let thisMonth = new Date(tmpD.getFullYear(), tmpD.getMonth(), 1);
            if (expD < thisMonth) {
                Utilities.Error_Show(CCPayment.ExpirationError, "The expiration date entered has passed.  Please check it and try again.");
                let element = document.getElementById(CCPayment.ccYearSelect);
                element.parentElement.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            this.CVVNumber = Utilities.Validate_Text(CCPayment.ccCVCInput, CCPayment.ExpirationError, "The CV Code field is required.");
            if (this.CVVNumber.length === 0)
                return;
            if (clayPay.CurrentTransaction.IsCashier) {
                let testAmount = Utilities.Validate_Text(CCPayment.AmountPaidInput, CCPayment.AmountError, "The Amount field is required.");
                if (testAmount.length === 0)
                    return;
                this.Amount = parseFloat(testAmount);
                if (Number.isNaN(this.Amount) || this.Amount < 0) {
                    this.Amount = 0;
                    Utilities.Error_Show(CCPayment.AmountError, "An invalid amount was entered.");
                    return false;
                }
                if (this.Amount > clayPay.CurrentTransaction.TotalAmountDue) {
                    let element = document.getElementById(CCPayment.AmountPaidInput);
                    element.classList.add("is-danger");
                    element.focus();
                    element.scrollTo();
                    Utilities.Error_Show(clayPay.Payment.checkErrorElement, "You cannot enter an amount for more than the total amount due.");
                    return false;
                }
            }
            else {
                clayPay.CurrentTransaction.CCData.Amount = clayPay.CurrentTransaction.TotalAmountDue;
            }
            this.Validated = true;
            if (clayPay.CurrentTransaction.IsCashier) {
                Utilities.Set_Text(CCPayment.creditCardTotalMenu, Utilities.Format_Amount(this.Amount));
                Utilities.Hide(CCPayment.CreditCardForm);
            }
            return clayPay.CurrentTransaction.Validate();
        }
        ValidateAndSave() {
            if (!this.Validate())
                return;
            clayPay.CurrentTransaction.Save();
        }
    }
    // credit card form container
    CCPayment.CreditCardForm = "creditCardPaymentType";
    // inputs
    CCPayment.FirstNameInput = "creditCardFirstName";
    CCPayment.LastNameInput = "creditCardLastName";
    CCPayment.ZipCodeInput = "creditCardZip";
    CCPayment.EmailAddressInput = "creditCardEmailAddress";
    CCPayment.ccNumberInput = "creditCardNumber";
    CCPayment.ccTypeSelect = "creditCardType";
    CCPayment.ccMonthSelect = "creditCardMonth";
    CCPayment.ccYearSelect = "creditCardYear";
    CCPayment.ccCVCInput = "creditCardCVV";
    CCPayment.AmountPaidInput = "creditCardPaymentAmount";
    // Error Inputs
    CCPayment.NameError = "creditCardNameError";
    CCPayment.ZipError = "creditCardZipError";
    CCPayment.NumberError = "creditCardNumberError";
    CCPayment.ExpirationError = "creditCardExpirationError";
    CCPayment.AmountError = "creditCardPaymentAmountError";
    // Menus
    CCPayment.creditCardTotalMenu = "creditCardPaymentTotal";
    clayPay.CCPayment = CCPayment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=CCPayment.js.map
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
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(applied)));
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
//# sourceMappingURL=clientresponse.js.map
/// <reference path="payment.ts" />
/// <reference path="clientresponse.ts" />
var clayPay;
(function (clayPay) {
    class NewTransaction {
        constructor() {
            // CurrentCharges are the search results (charges) returned and displayed
            // in the results container.
            this.CurrentCharges = [];
            // Cart are the charges that the user chose from the CurrentCharges to
            // pay for in this session.
            this.Cart = [];
            this.OTid = 0; // used after the transaction is saved
            this.CashierId = ""; // used after the transaction is saved
            this.ItemIds = [];
            this.CCData = new clayPay.CCPayment();
            this.Payments = [];
            this.TransactionCashierData = new clayPay.CashierData();
            this.IsCashier = false;
            this.CheckPayment = new clayPay.Payment(clayPay.payment_type.check);
            this.CashPayment = new clayPay.Payment(clayPay.payment_type.cash);
            this.TotalAmountDue = 0;
            this.TotalAmountPaid = 0;
            this.TotalAmountRemaining = 0;
            this.TotalChangeDue = 0;
        }
        UpdateIsCashier() {
            let e = document.getElementById(clayPay.Payment.checkPaymentContainer);
            this.IsCashier = e !== undefined && e !== null;
        }
        Validate() {
            let payer = this.TransactionCashierData.ValidatePayer();
            if (!payer) {
                Utilities.Show("validatePayer");
                Utilities.Hide("paymentData");
                return false;
            }
            else {
                Utilities.Hide("validatePayer");
                Utilities.Show("paymentData");
            }
            if (this.IsCashier) {
                this.UpdateTotals();
                let payments = this.ValidatePayments();
                let button = document.getElementById(NewTransaction.PayNowCashierButton);
                button.disabled = !(payer && payments);
                return (payer && payments);
            }
            return true;
        }
        UpdateTotals() {
            if (!this.IsCashier)
                return;
            this.TotalAmountPaid = 0;
            this.TotalAmountRemaining = 0;
            this.TotalChangeDue = 0;
            let TotalPaid = 0;
            if (this.CheckPayment.Validated)
                TotalPaid += this.CheckPayment.Amount;
            if (this.CashPayment.Validated)
                TotalPaid += this.CashPayment.Amount;
            if (this.CCData.Validated)
                TotalPaid += this.CCData.Amount;
            this.TotalAmountPaid = TotalPaid;
            this.TotalAmountRemaining = Math.max(this.TotalAmountDue - this.TotalAmountPaid, 0);
            if (this.TotalAmountDue - this.TotalAmountPaid < 0) {
                this.TotalChangeDue = this.TotalAmountPaid - this.TotalAmountDue;
            }
            this.UpdateForm();
        }
        UpdateForm() {
            Utilities.Set_Text(NewTransaction.TotalAmountDueMenu, Utilities.Format_Amount(this.TotalAmountDue));
            Utilities.Set_Text(NewTransaction.TotalAmountPaidMenu, Utilities.Format_Amount(this.TotalAmountPaid));
            Utilities.Set_Text(NewTransaction.TotalChangeDueMenu, Utilities.Format_Amount(this.TotalChangeDue));
            Utilities.Set_Text(NewTransaction.TotalAmountRemainingMenu, Utilities.Format_Amount(this.TotalAmountRemaining));
            let amount = this.TotalAmountRemaining.toFixed(2);
            if (!this.CCData.Validated)
                Utilities.Set_Value(clayPay.CCPayment.AmountPaidInput, amount);
            if (!this.CheckPayment.Validated)
                Utilities.Set_Value(clayPay.Payment.checkAmountInput, amount);
            if (!this.CashPayment.Validated)
                Utilities.Set_Value(clayPay.Payment.cashAmountInput, amount);
        }
        ValidatePayments() {
            if (this.IsCashier) {
                if (this.CashPayment.Validated && this.CashPayment.Amount > 0) {
                    if (this.TotalChangeDue >= this.CashPayment.Amount) {
                        Utilities.Error_Show(NewTransaction.paymentError, "The Total Change due the customer cannot be more than or equal to the amount of Cash paid.");
                        return false;
                    }
                }
                if (this.TotalChangeDue > 0 && (!this.CashPayment.Validated || this.CashPayment.Amount === 0)) {
                    Utilities.Error_Show(NewTransaction.paymentError, "The Total Amount Paid cannot be greater than the Total Amount Due if no cash has been received.");
                    return false;
                }
                if (this.TotalAmountRemaining > 0)
                    return false;
            }
            return true;
        }
        CopyPayerData() {
            // this function is used when the user clicks the "This is the same as Payer Information"
            // checkbox in the credit card data.  It takes the information in that form and
            // updates the CCData with it and then the CCData object will update the CCData form.
            this.CCData.FirstName = this.TransactionCashierData.PayerFirstName;
            this.CCData.LastName = this.TransactionCashierData.PayerLastName;
            this.CCData.ZipCode = this.TransactionCashierData.PayerZip;
            this.CCData.EmailAddress = this.TransactionCashierData.PayerEmailAddress;
            this.CCData.UpdatePayerData();
        }
        Save() {
            // Disable the button that was just used so that it can't be clicked multiple times.
            let loadingButton = this.IsCashier ? NewTransaction.PayNowCashierButton : NewTransaction.PayNowPublicButton;
            Utilities.Toggle_Loading_Button(loadingButton, true);
            if (!this.Validate()) {
                Utilities.Toggle_Loading_Button(loadingButton, false);
                return;
            }
            this.ItemIds = clayPay.CurrentTransaction.Cart.map((c) => {
                return c.ItemId;
            });
            this.Payments = [];
            let IsCashier = this.IsCashier;
            let toggleButton = IsCashier ? NewTransaction.PayNowCashierButton : NewTransaction.PayNowPublicButton;
            let errorTarget = IsCashier ? clayPay.ClientResponse.CashierErrorTarget : clayPay.ClientResponse.PublicErrorTarget;
            let path = "/";
            let i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            Utilities.Post(path + "API/Payments/Pay/", this)
                .then(function (cr) {
                console.log('client response', cr);
                if (cr.Errors.length > 0) // Errors occurred, payment was unsuccessful.
                 {
                    Utilities.Error_Show(errorTarget, cr.Errors);
                }
                else {
                    clayPay.CurrentTransaction.TransactionCashierData.ResetPayerForm();
                    clayPay.CurrentTransaction.CCData.ResetForm();
                    clayPay.Payment.ResetAll();
                    clayPay.CurrentTransaction = new NewTransaction(); // this will reset the entire object back to default.
                    clayPay.UI.updateCart();
                    clayPay.ClientResponse.ShowPaymentReceipt(cr);
                }
                Utilities.Toggle_Loading_Button(toggleButton, false);
                // need to reset the form and transaction / payment objects
            }, function (e) {
                // We should show an error in the same spot we'd show a client response error.
                Utilities.Error_Show(errorTarget, e);
                Utilities.Toggle_Loading_Button(toggleButton, false);
            });
        }
    }
    // Menu Ids
    NewTransaction.TotalAmountPaidMenu = "cartTotalAmountPaid";
    NewTransaction.TotalAmountDueMenu = "cartTotalAmountDue";
    NewTransaction.TotalAmountRemainingMenu = "cartTotalAmountRemaining";
    NewTransaction.TotalChangeDueMenu = "cartTotalChangeDue";
    NewTransaction.PayNowCashierButton = "processPayments";
    NewTransaction.PayNowPublicButton = "processCCPayment";
    // Transaction Error container
    NewTransaction.paymentError = "paymentError";
    clayPay.NewTransaction = NewTransaction;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=newtransaction.js.map
var clayPay;
(function (clayPay) {
    class AppType {
        constructor(Label, Value) {
            this.Label = Label;
            this.Value = Value;
        }
    }
    clayPay.AppType = AppType;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=AppTypes.js.map
/// <reference path="transport.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="ui.ts" />
/// <reference path="CCPayment.ts" />
/// <reference path="newtransaction.ts" />
/// <reference path="payment.ts" />
/// <reference path="clientresponse.ts" />
//let Card: any;
//let CurrentCard: any;
var clayPay;
(function (clayPay) {
    "use strict";
    clayPay.CurrentTransaction = new clayPay.NewTransaction();
    function start() {
        clayPay.CurrentTransaction.UpdateIsCashier();
        HandleUIEvents();
        clayPay.UI.buildMenuElements();
        loadDefaultValues();
        // let's test the receipt view
        // uncomment this to test the receipt view.
        //let cr = new ClientResponse();
        //cr.AmountPaid = 165;
        //cr.CashierId = "18-55544";
        //cr.ChangeDue = 0;
        //cr.Errors = [];
        //cr.TimeStamp = "7/13/2018 7:34 AM";
        //cr.TransactionId = "555ff";
        //ClientResponse.HandleResponse(cr, true);
    }
    clayPay.start = start;
    function HandleUIEvents() {
        document.getElementById('permitSearch')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                clayPay.UI.Search('permitSearchButton', 'permitSearch', 'permitSearchError');
            }
        };
        document.getElementById("permitSearchButton")
            .onclick = () => {
            clayPay.UI.Search('permitSearchButton', 'permitSearch', 'permitSearchError');
        };
        document.getElementById('contractorSearch')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                clayPay.UI.Search('contractorSearchButton', 'contractorSearch', 'contractorSearchError');
            }
        };
        document.getElementById("contractorSearchButton")
            .onclick = () => {
            clayPay.UI.Search('contractorSearchButton', 'contractorSearch', 'contractorSearchError');
        };
        document.getElementById('applicationSearch')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                clayPay.UI.Search('applicationSearchButton', 'applicationSearch', 'applicationSearchError');
            }
        };
        document.getElementById("applicationSearchButton")
            .onclick = () => {
            clayPay.UI.Search('applicationSearchButton', 'applicationSearch', 'applicationSearchError');
        };
        document.getElementById('receiptSearch')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                clayPay.ClientResponse.Search();
            }
        };
        document.getElementById("receiptSearchButton")
            .onclick = () => {
            clayPay.ClientResponse.Search();
        };
    }
    function loadDefaultValues() {
        loadApplicationTypes();
        clayPay.UI.BuildPayerStates(clayPay.UI.AllStates, "payerState");
        loadCreditCardFee();
        loadCreditCardExpirationValues();
    }
    function loadCreditCardExpirationValues() {
        clayPay.UI.BuildExpMonths("creditCardMonth");
        clayPay.UI.BuildExpYears("creditCardYear");
    }
    function loadCreditCardFee() {
        let path = "/";
        let i = window.location.pathname.toLowerCase().indexOf("/claypay");
        if (i == 0) {
            path = "/claypay/";
        }
        Utilities.Get(path + "API/Payments/Fee/")
            .then(function (fee) {
            clayPay.ConvenienceFee = fee;
            console.log('conv fee is', fee);
        }, function (e) {
            console.log('error getting convenience fee', e);
            // do something with the error here
        });
    }
    function loadApplicationTypes() {
        let path = "/";
        let i = window.location.pathname.toLowerCase().indexOf("/claypay");
        if (i == 0) {
            path = "/claypay/";
        }
        Utilities.Get(path + "API/Payments/Apptypes/")
            .then(function (appTypes) {
            clayPay.UI.BuildAppTypes(appTypes);
        }, function (e) {
            console.log('error getting application types', e);
            // do something with the error here
        });
    }
})(clayPay || (clayPay = {}));
//# sourceMappingURL=claypay.js.map
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
        //export function Submit():boolean
        //{
        //  Disable('btnSubmit');
        //  Utilities.Hide('errorList');
        //  Utilities.Hide('PaymentPosting');
        //  let f: HTMLFormElement = <HTMLFormElement>document.getElementById('paymentForm');
        //  if (!f.checkValidity()) return false;
        //  let itemIds: Array<number> = Cart.map(function (i)
        //  {
        //    return i.ItemId;
        //  });
        //  let total: number = Cart.reduce((total: number, b: Charge) =>
        //  {
        //    return total + b.Total;
        //  }, 0);
        //  total = parseFloat(total.toFixed(2));
        //  let cc = new clayPay.CCPayment();
        //  let errors: Array<string> = cc.Validate(); // clientside validation
        //  if (errors.length === 0)
        //  {
        //    Utilities.Hide('CCForm'); // Hide the form
        //    Utilities.Show('PaymentPosting'); // show swirly
        //    //let save = cc.Save();
        //    //save.then(function (response)
        //    //{
        //    //  let pr = JSON.parse(response);
        //    //  resetApp();
        //    //  PopulateReceipt(pr);
        //    //},
        //    //  function (reject)
        //    //  {
        //    //    Utilities.Show('errorList');
        //    //    errors = [reject];
        //    //    BuildErrors(errors);          
        //    //    Utilities.Show('CCForm');
        //    //    Utilities.Hide('PaymentPosting');
        //    //    Enable('btnSubmit');
        //    //  });
        //  } else
        //  {
        //    // show errors section
        //    Utilities.Show('errorList');
        //    BuildErrors(errors);
        //    Enable('btnSubmit');
        //  }    
        //  return false;
        //}
        //function resetApp():void
        //{
        //  CurrentCharges = [];
        //  Cart = [];
        //  updateCart();
        //  updateCartNav();
        //  // reset paymentForm
        //  let f: HTMLFormElement = <HTMLFormElement>document.getElementById('paymentForm');
        //  f.reset();
        //  Enable('btnSubmit');
        //  Utilities.Show('CCForm');
        //  Utilities.Hide('PaymentPosting');
        //}
        //function PopulateReceipt(pr: {CashierId:string, TimeStamp_Display: string, Amount: number}):void
        //{
        //  //clayPay.toggleNavDisplay('receipt');
        //  Utilities.Set_Value("receiptUniqueId", pr.CashierId);
        //  Utilities.Set_Value("receiptTimestamp", pr.TimeStamp_Display);
        //  Utilities.Set_Value("receiptAmount", pr.Amount.toFixed(2));
        //}
        //function ToggleDisabled(id: string, status: boolean): void
        //{
        //  (<HTMLButtonElement>document.getElementById(id)).disabled = status;
        //}
        //function Disable(id: string): void
        //{
        //  ToggleDisabled(id, true);
        //}
        //function Enable(id: string): void
        //{
        //  ToggleDisabled(id, false);
        //}
        function BuildErrors(errors) {
            let errorList = document.getElementById("errorList");
            let df = document.createDocumentFragment();
            Utilities.Clear_Element(errorList);
            for (let error of errors) {
                let li = document.createElement("li");
                li.textContent = error;
                df.appendChild(li);
            }
            errorList.appendChild(df);
        }
        function BuildPayerStates(States, id) {
            let stateSelect = document.getElementById(id);
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
            let appSelect = document.getElementById("applicationSearchType");
            Utilities.Clear_Element(appSelect);
            appSelect.appendChild(Utilities.Create_Option("-1", "Select Application Type", true));
            appTypes.forEach(function (a) {
                appSelect.appendChild(Utilities.Create_Option(a.Value, a.Label));
            });
            appSelect.selectedIndex = 0;
        }
        UI.BuildAppTypes = BuildAppTypes;
        function BuildExpMonths(id) {
            let expMonth = document.getElementById(id);
            if (expMonth === undefined)
                return;
            Utilities.Clear_Element(expMonth);
            for (let month of UI.ExpMonths) {
                expMonth.appendChild(Utilities.Create_Option(month, month));
            }
            expMonth.selectedIndex = 0;
        }
        UI.BuildExpMonths = BuildExpMonths;
        function BuildExpYears(id) {
            let expYear = document.getElementById(id);
            Utilities.Clear_Element(expYear);
            var year = new Date().getFullYear();
            for (var i = 0; i < 10; i++) {
                let y = (year + i).toString();
                expYear.appendChild(Utilities.Create_Option(y, y));
                UI.ExpYears.push(y); // save the year we're adding for later when we do some basic validation
            }
        }
        UI.BuildExpYears = BuildExpYears;
        function Search(buttonId, inputId, errorId) {
            Utilities.Toggle_Loading_Button(buttonId, true);
            let input = document.getElementById(inputId);
            let k = input.value.trim().toUpperCase();
            if (inputId.indexOf("application") > -1) {
                // we'll need to validate the application data
                // the user needs to select a valid application type 
                // and enter a valid application number.
                let appType = document.getElementById(inputId + "Type").value;
                if (appType === "-1" || appType.length === 0) {
                    Utilities.Error_Show(errorId, "You must select an Application Type in order to search by Application Number.");
                    Utilities.Toggle_Loading_Button(buttonId, false);
                    return false;
                }
                k = appType.toUpperCase() + "-" + input.value.trim().toUpperCase();
            }
            if (k.length > 0) {
                let path = "/";
                let i = window.location.pathname.toLowerCase().indexOf("/claypay");
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
            let container = document.getElementById('Charges');
            Utilities.Clear_Element(container);
            container.appendChild(clayPay.Charge.CreateChargesTable(charges, clayPay.ChargeView.search_results));
            Utilities.Set_Text('ChargesKey', charges[0].AssocKey);
            Utilities.Set_Text('ChargesDetail', charges[0].Detail);
        }
        UI.ProcessSearchResults = ProcessSearchResults;
        function IsItemInCart(itemId) {
            let item = clayPay.CurrentTransaction.Cart.filter((c) => {
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
            let th = document.createElement("th");
            th.width = width;
            th.appendChild(document.createTextNode(value));
            return th;
        }
        UI.createTableHeaderElement = createTableHeaderElement;
        function createTableElement(value, className, colspan) {
            let d = document.createElement("td");
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
            let IsInCart = IsItemInCart(itemId);
            let d = document.createElement("td");
            d.className = className;
            let add = document.createElement("button");
            add.style.display = IsInCart ? "none" : "inline-block";
            add.type = "button";
            add.id = "btnAdd" + itemId.toString();
            add.className = "button is-primary";
            add.onclick = (ev) => {
                addOnClickFunction(ev, itemId);
            };
            let remove = document.createElement("div");
            remove.id = "btnRemove" + itemId.toString();
            remove.style.display = IsInCart ? "inline-block" : "none";
            remove.appendChild(document.createTextNode('Added ('));
            let removeButton = document.createElement("a");
            //removeButton
            removeButton.classList.add("is-warning");
            //removeButton.style.color = "darkgoldenrod";
            removeButton.style.cursor = "pointer";
            removeButton.appendChild(document.createTextNode('remove'));
            removeButton.onclick = (ev) => {
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
            let d = document.createElement("td");
            let add = document.createElement("button");
            add.type = "button";
            add.className = "btn btn-primary";
            add.onclick = (ev) => {
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
            let CartNav = document.getElementById('nav-cart-total');
            // emptyCart / fullCart is used when displaying the Cart
            // if there are no charges, we show emptyCart.
            // if there are charges, we show fullCart.
            let emptyCart = document.getElementById("emptyCart");
            let fullCart = document.getElementById("fullCart");
            let payerData = document.getElementById("payerData");
            let paymentData = document.getElementById("paymentData");
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
                let cartLength = clayPay.CurrentTransaction.Cart.length;
                CartNav.appendChild(document.createTextNode(+cartLength.toString() + (cartLength === 1 ? ' item' : ' items')));
                Utilities.Show(fullCart);
                Utilities.Show(payerData);
                //Utilities.Show(paymentData);
            }
        }
        function updateCart() {
            let CartCharges = document.getElementById('fullCart');
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
        function buildMenuElements() {
            let menu = document.getElementById("menuTabs");
            for (let menuItem of UI.Menus) {
                menu.appendChild(Utilities.Create_Menu_Element(menuItem));
            }
            createNavCart();
        }
        UI.buildMenuElements = buildMenuElements;
        function createNavCart() {
            let cart = document.getElementById("nav-cart");
            let cartTotal = document.createElement("span");
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