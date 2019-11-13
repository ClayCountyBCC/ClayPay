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

var clayPay;
(function (clayPay) {
    var LocationHash = /** @class */ (function () {
        function LocationHash(locationHash) {
            this.Permit = "";
            this.CashierId = "";
            this.ContractorId = "";
            this.ApplicationNumber = "";
            var ha = locationHash.split("&");
            for (var i = 0; i < ha.length; i++) {
                var k = ha[i].split("=");
                switch (k[0].toLowerCase()) {
                    case "application":
                        this.ApplicationNumber = k[1];
                        break;
                    case "contractor":
                        this.ContractorId = k[1];
                        break;
                    case "permit":
                        this.Permit = k[1];
                        break;
                    case "cashierid":
                        this.CashierId = k[1];
                        break;
                }
            }
        }
        //UpdatePermit(permit: string)
        //{ // this function is going to take the current LocationHash
        //  // and using its current properties, going to emit an updated hash
        //  // with a new EmailId.
        //  let h: string = "";
        //  if (permit.length > 0) h += "&permit=" + permit;
        //  return h.substring(1);
        //}
        LocationHash.prototype.ToHash = function () {
            var h = "";
            if (this.Permit.length > 0)
                h += "&permit=" + this.Permit;
            if (this.ApplicationNumber.length > 0)
                h += "&application=" + this.ApplicationNumber;
            if (this.ContractorId.length > 0)
                h += "&contractor=" + this.ContractorId;
            if (this.CashierId.length > 0)
                h += "&cashierid=" + this.CashierId;
            if (h.length > 0)
                h = "#" + h.substring(1);
            return h;
        };
        return LocationHash;
    }());
    clayPay.LocationHash = LocationHash;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=LocationHash.js.map
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
                    clayPay.CurrentTransaction.TotalAmountDue = parseFloat(TotalAmount.toFixed(2));
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
    var payment_type;
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
    var Payment = /** @class */ (function () {
        function Payment(paymentType) {
            this.Editable = false;
            this.Amount = 0;
            this.AmountInt = 0;
            this.CheckNumber = "";
            this.TransactionId = "";
            this.Validated = false;
            this.Error = "";
            this.PaymentType = paymentType;
        }
        Payment.prototype.UpdateTotal = function () {
            var input = this.PaymentType === payment_type.cash ? Payment.cashAmountInput : Payment.checkAmountInput;
            Utilities.Set_Value(input, this.Amount.toFixed(2));
        };
        Payment.prototype.Validate = function () {
            this.Validated == false;
            this.Amount = 0;
            this.AmountInt = 0;
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
        };
        Payment.prototype.ValidateCash = function () {
            this.Validated = false;
            var cashAmount = document.getElementById(Payment.cashAmountInput);
            // check that an amount was entered.
            // It must be 0 or greater.
            var testAmount = Utilities.Validate_Text(Payment.cashAmountInput, Payment.cashErrorElement, "You must enter an amount of 0 or greater in order to continue.");
            if (testAmount.length === 0)
                return;
            // check that it's a valid amount.
            // 0 is valid because they could've set it to greater than 0
            // and are now wanting to revert it back to 0.      
            this.Amount = parseFloat(testAmount);
            if (clayPay.isNaN(this.Amount) || this.Amount < 0) {
                cashAmount.classList.add("is-danger");
                cashAmount.focus();
                cashAmount.scrollTo();
                this.Amount = 0;
                Utilities.Error_Show(Payment.cashErrorElement, "An invalid amount was entered.");
                return false;
            }
            this.AmountInt = parseInt((this.Amount * 100).toString());
            if (this.Amount === 0) {
                Payment.ResetCash();
                return false;
            }
            this.Validated = true;
            Utilities.Set_Text(Payment.cashPaymentTotalMenu, Utilities.Format_Amount(this.Amount));
            Utilities.Hide(Payment.cashPaymentContainer);
            clayPay.CurrentTransaction.Validate();
            return this.Validated;
        };
        Payment.prototype.ValidateCheck = function () {
            this.Validated = false;
            var checkAmount = document.getElementById(Payment.checkAmountInput);
            //let checkNumber = <HTMLInputElement>document.getElementById(Payment.checkNumberInput);
            //let checkError = document.getElementById(Payment.checkErrorElement);
            //checkAmount.classList.remove("is-danger");
            //checkNumber.classList.remove("is-danger");
            // check that an amount was entered.
            var testAmount = Utilities.Validate_Text(Payment.checkAmountInput, Payment.checkErrorElement, "You must enter an amount of 0 or greater in order to continue.");
            if (testAmount.length === 0)
                return;
            // check that it's a valid amount.
            // 0 is valid because they could've set it to greater than 0
            // and are now wanting to revert it back to 0.
            // We are also going to make sure that the amount is >= 0.
            this.Amount = parseFloat(testAmount);
            if (clayPay.isNaN(this.Amount) || this.Amount < 0) {
                checkAmount.classList.add("is-danger");
                checkAmount.focus();
                checkAmount.scrollTo();
                this.Amount = 0;
                Utilities.Error_Show(Payment.checkErrorElement, "An invalid amount was entered.");
                return false;
            }
            this.AmountInt = parseInt((this.Amount * 100).toString());
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
        };
        Payment.ResetAll = function () {
            Payment.ResetCash();
            Payment.ResetCheck();
        };
        Payment.ResetCash = function () {
            clayPay.CurrentTransaction.CashPayment = new Payment(payment_type.cash);
            var e = document.getElementById(Payment.cashAmountInput);
            Utilities.Set_Value(e, "");
            e.classList.remove("is-danger");
            var menu = document.getElementById(Payment.cashPaymentTotalMenu);
            Utilities.Set_Text(menu, "Add");
            Utilities.Hide(Payment.cashPaymentContainer);
            clayPay.CurrentTransaction.Validate();
        };
        Payment.ResetCheck = function () {
            clayPay.CurrentTransaction.CheckPayment = new Payment(payment_type.check);
            var amount = document.getElementById(Payment.checkAmountInput);
            Utilities.Set_Value(amount, "");
            amount.classList.remove("is-danger");
            var number = document.getElementById(Payment.checkNumberInput);
            Utilities.Set_Value(number, "");
            number.classList.remove("is-danger");
            var menu = document.getElementById(Payment.checkPaymentTotalMenu);
            Utilities.Set_Text(menu, "Add");
            Utilities.Hide(Payment.checkPaymentContainer);
            clayPay.CurrentTransaction.Validate();
        };
        Payment.checkErrorElement = "checkPaymentError";
        Payment.checkAmountInput = "checkPaymentAmount";
        Payment.checkNumberInput = "checkNumber";
        Payment.checkPaymentTotalMenu = "checkPaymentTotal";
        Payment.checkPaymentContainer = "checkPaymentType";
        Payment.cashErrorElement = "cashPaymentError";
        Payment.cashAmountInput = "cashPaymentAmount";
        Payment.cashPaymentTotalMenu = "cashPaymentTotal";
        Payment.cashPaymentContainer = "cashPaymentType";
        return Payment;
    }());
    clayPay.Payment = Payment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=payment.js.map
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
            this.CanVoid = false;
        }
        ClientResponse.ShowPaymentReceipt = function (cr, target, showVoid) {
            if (showVoid === void 0) { showVoid = false; }
            console.log('client response ShowPaymentReceipt', cr);
            var container = document.getElementById(target);
            Utilities.Clear_Element(container);
            container.appendChild(ClientResponse.CreateReceiptView(cr, showVoid));
            Utilities.Show_Hide_Selector("#views > section", target);
        };
        ClientResponse.CreateReceiptView = function (cr, showVoid) {
            var df = document.createDocumentFragment();
            if (cr.ReceiptPayments.length === 0)
                return df;
            df.appendChild(ClientResponse.CreateReceiptHeader(cr, showVoid));
            df.appendChild(ClientResponse.CreateReceiptPayerView(cr.ResponseCashierData));
            df.appendChild(clayPay.Charge.CreateChargesTable(cr.Charges, clayPay.ChargeView.receipt));
            df.appendChild(clayPay.ReceiptPayment.CreateReceiptPaymentView(cr.ReceiptPayments, cr.IsEditable));
            // show payment info
            return df;
        };
        ClientResponse.CreateReceiptHeader = function (cr, showVoid) {
            var div = document.createElement("div");
            div.classList.add("level");
            var title = document.createElement("span");
            div.appendChild(title);
            title.classList.add("level-item");
            title.classList.add("title");
            title.appendChild(document.createTextNode("Payment Receipt for: " + cr.ReceiptPayments[0].CashierId));
            if (showVoid && cr.CanVoid) {
                var voidbutton = document.createElement("button");
                voidbutton.classList.add("button");
                voidbutton.classList.add("is-warning");
                voidbutton.classList.add("is-normal");
                voidbutton.classList.add("hide-for-print");
                voidbutton.classList.add("level-item");
                voidbutton.appendChild(document.createTextNode("Void Payment"));
                voidbutton.onclick = function () {
                    Utilities.Update_Menu(clayPay.UI.Menus[5]);
                    Utilities.Toggle_Loading_Button("receiptSearchButton", true);
                    //Utilities.Toggle_Loading_Button(voidbutton, true);
                    ClientResponse.Search(cr.ResponseCashierData.CashierId);
                };
                div.appendChild(voidbutton);
            }
            var receiptDate = document.createElement("span");
            receiptDate.classList.add("level-item");
            receiptDate.classList.add("subtitle");
            receiptDate.appendChild(document.createTextNode("Transaction Date: " + Utilities.Format_Date(cr.ResponseCashierData.TransactionDate)));
            div.appendChild(receiptDate);
            var timestamp = cr.ResponseCashierData.TransactionDate;
            return div;
        };
        ClientResponse.CreateReceiptPayerView = function (cd) {
            var df = document.createDocumentFragment();
            if (cd.IsVoided) {
                var level = document.createElement("div");
                level.classList.add("level");
                level.classList.add("notification");
                level.classList.add("is-danger");
                var levelitem = document.createElement("p");
                levelitem.classList.add("level-item");
                levelitem.classList.add("title");
                levelitem.appendChild(document.createTextNode("This transaction has been voided."));
                level.appendChild(levelitem);
                df.appendChild(level);
            }
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
        ClientResponse.Search = function (CashierIdToVoid) {
            if (CashierIdToVoid === void 0) { CashierIdToVoid = ""; }
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
                var fullpath = "";
                if (CashierIdToVoid.length > 0) {
                    fullpath = path + "API/Payments/VoidPayment/?CashierId=" + CashierIdToVoid;
                }
                else {
                    fullpath = path + "API/Payments/Receipt/?CashierId=" + k;
                }
                Utilities.Get(fullpath).then(function (cr) {
                    console.log('Client Response', cr);
                    if (cr.Errors.length > 0) {
                        var container = document.getElementById(ClientResponse.PaymentReceiptContainer);
                        Utilities.Clear_Element(container);
                        Utilities.Error_Show(ClientResponse.receiptSearchError, cr.Errors);
                    }
                    else {
                        ClientResponse.ShowPaymentReceipt(cr, ClientResponse.PaymentReceiptContainer, true);
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
                clayPay.ClientResponse.ShowPaymentReceipt(cr, Balancing.Payment.DJournalReceiptContainer, false);
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
//# sourceMappingURL=ClientResponse.js.map
/// <reference path="payment.ts" />
/// <reference path="clientresponse.ts" />
var clayPay;
(function (clayPay) {
    var NewTransaction = /** @class */ (function () {
        function NewTransaction() {
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
            this.TotalAmountDueInt = 0;
            this.TotalAmountPaid = 0;
            this.TotalAmountPaidInt = 0;
            this.TotalAmountRemaining = 0;
            this.TotalAmountRemainingInt = 0;
            this.TotalChangeDue = 0;
            this.TotalChangeDueInt = 0;
            this.Save = Utilities.Debounce(function () {
                clayPay.CurrentTransaction.DebouncedSave();
            }, 1000, true);
            this.UpdateIsCashier();
        }
        NewTransaction.prototype.UpdateIsCashier = function () {
            var e = document.getElementById(clayPay.Payment.checkPaymentContainer);
            this.IsCashier = e !== undefined && e !== null;
        };
        NewTransaction.prototype.Validate = function () {
            var payments = false;
            if (clayPay.CurrentTransaction.IsCashier) {
                clayPay.CurrentTransaction.UpdateTotals();
                payments = clayPay.CurrentTransaction.ValidatePayments();
            }
            var payer = clayPay.CurrentTransaction.TransactionCashierData.ValidatePayer();
            if (!payer) {
                Utilities.Show("validatePayer");
                Utilities.Hide("paymentData");
                return false;
            }
            else {
                Utilities.Hide("validatePayer");
                Utilities.Show("paymentData");
            }
            //console.log('values', this.TotalAmountDue, this.TotalAmountPaid, this.TotalAmountRemaining);
            if (this.IsCashier) {
                var button = document.getElementById(NewTransaction.PayNowCashierButton);
                button.disabled = !(payer && payments);
                return (payer && payments);
            }
            return true;
        };
        NewTransaction.prototype.UpdateTotals = function () {
            if (!this.IsCashier)
                return;
            this.TotalAmountPaid = 0;
            this.TotalAmountPaidInt = 0;
            this.TotalAmountRemaining = 0;
            this.TotalAmountRemainingInt = 0;
            this.TotalChangeDue = 0;
            this.TotalChangeDueInt = 0;
            var TotalPaid = 0;
            var TotalPaidInt = 0;
            if (this.CheckPayment.Validated) {
                TotalPaid += clayPay.CurrentTransaction.CheckPayment.Amount;
                TotalPaidInt += clayPay.CurrentTransaction.CheckPayment.AmountInt;
            }
            if (this.CashPayment.Validated) {
                TotalPaid += clayPay.CurrentTransaction.CashPayment.Amount;
                TotalPaidInt += clayPay.CurrentTransaction.CashPayment.AmountInt;
            }
            if (this.CCData.Validated) {
                TotalPaid += clayPay.CurrentTransaction.CCData.Amount;
                TotalPaidInt += clayPay.CurrentTransaction.CCData.AmountInt;
            }
            this.TotalAmountPaid = TotalPaid;
            this.TotalAmountPaidInt = TotalPaidInt;
            this.TotalAmountDueInt = parseInt((this.TotalAmountDue * 100).toString());
            this.TotalAmountRemaining = Math.max(this.TotalAmountDue - this.TotalAmountPaid, 0);
            this.TotalAmountRemainingInt = Math.max(this.TotalAmountDueInt - this.TotalAmountPaidInt, 0);
            if (this.TotalAmountDueInt - this.TotalAmountPaidInt < 0) {
                clayPay.CurrentTransaction.TotalChangeDue = clayPay.CurrentTransaction.TotalAmountPaid - clayPay.CurrentTransaction.TotalAmountDue;
                clayPay.CurrentTransaction.TotalChangeDueInt = parseInt((clayPay.CurrentTransaction.TotalChangeDue * 100).toString());
            }
            clayPay.CurrentTransaction.UpdateForm();
        };
        NewTransaction.prototype.UpdateForm = function () {
            Utilities.Set_Text(NewTransaction.TotalAmountDueMenu, Utilities.Format_Amount(clayPay.CurrentTransaction.TotalAmountDue));
            Utilities.Set_Text(NewTransaction.TotalAmountPaidMenu, Utilities.Format_Amount(clayPay.CurrentTransaction.TotalAmountPaid));
            Utilities.Set_Text(NewTransaction.TotalChangeDueMenu, Utilities.Format_Amount(clayPay.CurrentTransaction.TotalChangeDue));
            Utilities.Set_Text(NewTransaction.TotalAmountRemainingMenu, Utilities.Format_Amount(clayPay.CurrentTransaction.TotalAmountRemaining));
            var amount = clayPay.CurrentTransaction.TotalAmountRemaining.toFixed(2);
            if (!clayPay.CurrentTransaction.CCData.Validated)
                Utilities.Set_Value(clayPay.CCPayment.AmountPaidInput, amount);
            if (!clayPay.CurrentTransaction.CheckPayment.Validated)
                Utilities.Set_Value(clayPay.Payment.checkAmountInput, amount);
            if (!clayPay.CurrentTransaction.CashPayment.Validated)
                Utilities.Set_Value(clayPay.Payment.cashAmountInput, amount);
        };
        NewTransaction.prototype.ValidatePayments = function () {
            if (this.IsCashier) {
                if (this.CashPayment.Validated && this.CashPayment.Amount > 0) {
                    if (this.TotalChangeDueInt >= this.CashPayment.AmountInt) {
                        Utilities.Error_Show(NewTransaction.paymentError, "The Total Change due the customer cannot be more than or equal to the amount of Cash paid.");
                        return false;
                    }
                }
                if (this.TotalChangeDueInt > 0 && (!this.CashPayment.Validated || this.CashPayment.AmountInt === 0)) {
                    Utilities.Error_Show(NewTransaction.paymentError, "The Total Amount Paid cannot be greater than the Total Amount Due if no cash has been received.");
                    return false;
                }
                if (this.TotalAmountRemainingInt > 0) {
                    return false;
                }
            }
            return true;
        };
        NewTransaction.prototype.CopyPayerData = function () {
            // this function is used when the user clicks the "This is the same as Payer Information"
            // checkbox in the credit card data.  It takes the information in that form and
            // updates the CCData with it and then the CCData object will update the CCData form.
            this.CCData.FirstName = this.TransactionCashierData.PayerFirstName;
            this.CCData.LastName = this.TransactionCashierData.PayerLastName;
            this.CCData.ZipCode = this.TransactionCashierData.PayerZip;
            // this.CCData.EmailAddress = this.TransactionCashierData.PayerEmailAddress;
            this.CCData.UpdatePayerData();
        };
        NewTransaction.prototype.DebouncedSave = function () {
            // Disable the button that was just used so that it can't be clicked multiple times.
            var loadingButton = this.IsCashier ? NewTransaction.PayNowCashierButton : NewTransaction.PayNowPublicButton;
            Utilities.Toggle_Loading_Button(loadingButton, true);
            if (!this.Validate()) {
                Utilities.Toggle_Loading_Button(loadingButton, false);
                return;
            }
            this.ItemIds = clayPay.CurrentTransaction.Cart.map(function (c) {
                return c.ItemId;
            });
            this.Payments = [];
            var IsCashier = this.IsCashier;
            var toggleButton = IsCashier ? NewTransaction.PayNowCashierButton : NewTransaction.PayNowPublicButton;
            var errorTarget = IsCashier ? clayPay.ClientResponse.CashierErrorTarget : clayPay.ClientResponse.PublicErrorTarget;
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            Utilities.Post(path + "API/Payments/Pay/", this)
                .then(function (cr) {
                if (cr.Errors.length > 0) // Errors occurred, payment was unsuccessful.
                 {
                    Utilities.Error_Show(errorTarget, cr.Errors);
                }
                else {
                    if (clayPay.CurrentTransaction.IsCashier) {
                        clayPay.Payment.ResetAll();
                    }
                    clayPay.CurrentTransaction.TransactionCashierData.ResetPayerForm();
                    clayPay.CurrentTransaction = new NewTransaction(); // this will reset the entire object back to default.
                    clayPay.CurrentTransaction.UpdateTotals();
                    clayPay.CurrentTransaction.CCData.ResetForm();
                    Utilities.Show("validatePayer");
                    Utilities.Hide("paymentData");
                    clayPay.UI.updateCart();
                    clayPay.ClientResponse.ShowPaymentReceipt(cr, clayPay.ClientResponse.PaymentReceiptContainer);
                }
                Utilities.Toggle_Loading_Button(toggleButton, false);
                // need to reset the form and transaction / payment objects
            }, function (e) {
                // We should show an error in the same spot we'd show a client response error.
                Utilities.Error_Show(errorTarget, e);
                Utilities.Toggle_Loading_Button(toggleButton, false);
            });
        };
        // Menu Ids
        NewTransaction.TotalAmountPaidMenu = "cartTotalAmountPaid";
        NewTransaction.TotalAmountDueMenu = "cartTotalAmountDue";
        NewTransaction.TotalAmountRemainingMenu = "cartTotalAmountRemaining";
        NewTransaction.TotalChangeDueMenu = "cartTotalChangeDue";
        NewTransaction.PayNowCashierButton = "processPayments";
        NewTransaction.PayNowPublicButton = "processCCPayment";
        // Transaction Error container
        NewTransaction.paymentError = "paymentError";
        return NewTransaction;
    }());
    clayPay.NewTransaction = NewTransaction;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=NewTransaction.js.map
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
        clayPay.UI.buildMenuElements(clayPay.CurrentTransaction.IsCashier);
        loadDefaultValues();
        window.onhashchange = HandleHash;
    }
    clayPay.start = start;
    function HandleHash() {
        var hash = location.hash;
        var currentHash = new clayPay.LocationHash(location.hash.substring(1));
        if (currentHash.Permit.length > 0) {
            Utilities.Update_Menu(clayPay.UI.Menus[1]);
            HandleSearch('permitSearchButton', 'permitSearch', currentHash.Permit);
            return;
        }
        if (currentHash.CashierId.length > 0) {
            Utilities.Update_Menu(clayPay.UI.Menus[5]);
            HandleSearch('receiptSearchButton', 'receiptSearch', currentHash.CashierId);
            return;
        }
        if (currentHash.ContractorId.length > 0) {
            Utilities.Update_Menu(clayPay.UI.Menus[2]);
            HandleSearch('contractorSearchButton', 'contractorSearch', currentHash.ContractorId);
            return;
        }
        if (currentHash.ApplicationNumber.length > 0) {
            Utilities.Update_Menu(clayPay.UI.Menus[3]);
            HandleSearch('applicationSearchButton', 'applicationSearch', currentHash.ApplicationNumber);
            return;
        }
    }
    clayPay.HandleHash = HandleHash;
    function HandleSearch(buttonId, inputId, value) {
        var button = document.getElementById(buttonId);
        Utilities.Set_Value(inputId, value);
        button.click();
    }
    function HandleUIEvents() {
        document.getElementById('permitSearch')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                clayPay.UI.Search('permitSearchButton', 'permitSearch', 'permitSearchError');
            }
        };
        document.getElementById("permitSearchButton")
            .onclick = function () {
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
            .onclick = function () {
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
            .onclick = function () {
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
            .onclick = function () {
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
        var path = "/";
        var i = window.location.pathname.toLowerCase().indexOf("/claypay");
        if (i == 0) {
            path = "/claypay/";
        }
        Utilities.Get(path + "API/Payments/Fee/")
            .then(function (fee) {
            clayPay.ConvenienceFee = fee;
            console.log('conv fee is', fee);
            if (location.hash.substring(1).length > 0) {
                HandleHash();
            }
        }, function (e) {
            console.log('error getting convenience fee', e);
            // do something with the error here
        });
    }
    function loadApplicationTypes() {
        var path = "/";
        var i = window.location.pathname.toLowerCase().indexOf("/claypay");
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
    function isNaN(value) {
        return value !== value;
    }
    clayPay.isNaN = isNaN;
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
                    //if (menuItem.id !== "nav-existingReceipts")
                    //{
                    menu.appendChild(Utilities.Create_Menu_Element(menuItem));
                    //}
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
//# sourceMappingURL=UI.js.map