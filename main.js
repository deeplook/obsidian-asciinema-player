'use strict';

var obsidian = require('obsidian');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function parseNpt(time) {
  if (typeof time === "number") {
    return time;
  } else if (typeof time === "string") {
    return time.split(":").reverse().map(parseFloat).reduce((sum, n, i) => sum + n * Math.pow(60, i));
  } else {
    return undefined;
  }
}
function debounce(f, delay) {
  let timeout;
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    clearTimeout(timeout);
    timeout = setTimeout(() => f.apply(this, args), delay);
  };
}
function throttle(f, interval) {
  let enableCall = true;
  return function () {
    if (!enableCall) return;
    enableCall = false;
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    f.apply(this, args);
    setTimeout(() => enableCall = true, interval);
  };
}

class DummyLogger {
  log() {}
  debug() {}
  info() {}
  warn() {}
  error() {}
}
class PrefixedLogger {
  constructor(logger, prefix) {
    this.logger = logger;
    this.prefix = prefix;
  }
  log(message) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    this.logger.log(`${this.prefix}${message}`, ...args);
  }
  debug(message) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    this.logger.debug(`${this.prefix}${message}`, ...args);
  }
  info(message) {
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    this.logger.info(`${this.prefix}${message}`, ...args);
  }
  warn(message) {
    for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      args[_key4 - 1] = arguments[_key4];
    }
    this.logger.warn(`${this.prefix}${message}`, ...args);
  }
  error(message) {
    for (var _len5 = arguments.length, args = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
      args[_key5 - 1] = arguments[_key5];
    }
    this.logger.error(`${this.prefix}${message}`, ...args);
  }
}

let wasm;
const heap = new Array(128).fill(undefined);
heap.push(undefined, null, true, false);
function getObject(idx) {
  return heap[idx];
}
function debugString(val) {
  // primitive types
  const type = typeof val;
  if (type == 'number' || type == 'boolean' || val == null) {
    return `${val}`;
  }
  if (type == 'string') {
    return `"${val}"`;
  }
  if (type == 'symbol') {
    const description = val.description;
    if (description == null) {
      return 'Symbol';
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == 'function') {
    const name = val.name;
    if (typeof name == 'string' && name.length > 0) {
      return `Function(${name})`;
    } else {
      return 'Function';
    }
  }
  // objects
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = '[';
    if (length > 0) {
      debug += debugString(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug += ', ' + debugString(val[i]);
    }
    debug += ']';
    return debug;
  }
  // Test for built-in
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    // Failed to match the standard '[object ClassName]'
    return toString.call(val);
  }
  if (className == 'Object') {
    // we're a user defined class or Object
    // JSON.stringify avoids problems with cycles, and is generally much
    // easier than looping through ownProperties of `val`.
    try {
      return 'Object(' + JSON.stringify(val) + ')';
    } catch (_) {
      return 'Object';
    }
  }
  // errors
  if (val instanceof Error) {
    return `${val.name}: ${val.message}\n${val.stack}`;
  }
  // TODO we could test for more things here, like `Set`s and `Map`s.
  return className;
}
let WASM_VECTOR_LEN = 0;
let cachedUint8Memory0 = null;
function getUint8Memory0() {
  if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8Memory0;
}
const cachedTextEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : {
  encode: () => {
    throw Error('TextEncoder not available');
  }
};
const encodeString = typeof cachedTextEncoder.encodeInto === 'function' ? function (arg, view) {
  return cachedTextEncoder.encodeInto(arg, view);
} : function (arg, view) {
  const buf = cachedTextEncoder.encode(arg);
  view.set(buf);
  return {
    read: arg.length,
    written: buf.length
  };
};
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length, 1) >>> 0;
    getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8Memory0();
  let offset = 0;
  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7F) break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }
  WASM_VECTOR_LEN = offset;
  return ptr;
}
let cachedInt32Memory0 = null;
function getInt32Memory0() {
  if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32Memory0;
}
let heap_next = heap.length;
function addHeapObject(obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];
  heap[idx] = obj;
  return idx;
}
const cachedTextDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', {
  ignoreBOM: true,
  fatal: true
}) : {
  decode: () => {
    throw Error('TextDecoder not available');
  }
};
if (typeof TextDecoder !== 'undefined') {
  cachedTextDecoder.decode();
}
function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
function dropObject(idx) {
  if (idx < 132) return;
  heap[idx] = heap_next;
  heap_next = idx;
}
function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}
/**
* @param {number} cols
* @param {number} rows
* @param {number} scrollback_limit
* @returns {Vt}
*/
function create$1(cols, rows, scrollback_limit) {
  const ret = wasm.create(cols, rows, scrollback_limit);
  return Vt.__wrap(ret);
}
let cachedUint32Memory0 = null;
function getUint32Memory0() {
  if (cachedUint32Memory0 === null || cachedUint32Memory0.byteLength === 0) {
    cachedUint32Memory0 = new Uint32Array(wasm.memory.buffer);
  }
  return cachedUint32Memory0;
}
function getArrayU32FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint32Memory0().subarray(ptr / 4, ptr / 4 + len);
}
const VtFinalization = typeof FinalizationRegistry === 'undefined' ? {
  register: () => {},
  unregister: () => {}
} : new FinalizationRegistry(ptr => wasm.__wbg_vt_free(ptr >>> 0));
/**
*/
class Vt {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(Vt.prototype);
    obj.__wbg_ptr = ptr;
    VtFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    VtFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_vt_free(ptr);
  }
  /**
  * @param {string} s
  * @returns {any}
  */
  feed(s) {
    const ptr0 = passStringToWasm0(s, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.vt_feed(this.__wbg_ptr, ptr0, len0);
    return takeObject(ret);
  }
  /**
  * @param {number} cols
  * @param {number} rows
  * @returns {any}
  */
  resize(cols, rows) {
    const ret = wasm.vt_resize(this.__wbg_ptr, cols, rows);
    return takeObject(ret);
  }
  /**
  * @returns {Uint32Array}
  */
  getSize() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.vt_getSize(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v1 = getArrayU32FromWasm0(r0, r1).slice();
      wasm.__wbindgen_export_2(r0, r1 * 4, 4);
      return v1;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {number} n
  * @returns {any}
  */
  getLine(n) {
    const ret = wasm.vt_getLine(this.__wbg_ptr, n);
    return takeObject(ret);
  }
  /**
  * @returns {any}
  */
  getCursor() {
    const ret = wasm.vt_getCursor(this.__wbg_ptr);
    return takeObject(ret);
  }
}
async function __wbg_load(module, imports) {
  if (typeof Response === 'function' && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        if (module.headers.get('Content-Type') != 'application/wasm') {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
        } else {
          throw e;
        }
      }
    }
    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);
    if (instance instanceof WebAssembly.Instance) {
      return {
        instance,
        module
      };
    } else {
      return instance;
    }
  }
}
function __wbg_get_imports() {
  const imports = {};
  imports.wbg = {};
  imports.wbg.__wbindgen_is_string = function (arg0) {
    const ret = typeof getObject(arg0) === 'string';
    return ret;
  };
  imports.wbg.__wbg_new_b525de17f44a8943 = function () {
    const ret = new Array();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_set_17224bc548dd1d7b = function (arg0, arg1, arg2) {
    getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
  };
  imports.wbg.__wbindgen_debug_string = function (arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_0, wasm.__wbindgen_export_1);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  };
  imports.wbg.__wbindgen_number_new = function (arg0) {
    const ret = arg0;
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_bigint_from_u64 = function (arg0) {
    const ret = BigInt.asUintN(64, arg0);
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_error_new = function (arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_new_f9876326328f45ed = function () {
    const ret = new Object();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_set_f975102236d3c502 = function (arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
  };
  imports.wbg.__wbg_new_f841cc6f2098f4b5 = function () {
    const ret = new Map();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_set_388c4c6422704173 = function (arg0, arg1, arg2) {
    const ret = getObject(arg0).set(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_object_drop_ref = function (arg0) {
    takeObject(arg0);
  };
  imports.wbg.__wbindgen_string_new = function (arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_object_clone_ref = function (arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_throw = function (arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
  };
  return imports;
}
function __wbg_finalize_init(instance, module) {
  wasm = instance.exports;
  __wbg_init.__wbindgen_wasm_module = module;
  cachedInt32Memory0 = null;
  cachedUint32Memory0 = null;
  cachedUint8Memory0 = null;
  return wasm;
}
function initSync(module) {
  if (wasm !== undefined) return wasm;
  const imports = __wbg_get_imports();
  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }
  const instance = new WebAssembly.Instance(module, imports);
  return __wbg_finalize_init(instance, module);
}
async function __wbg_init(input) {
  if (wasm !== undefined) return wasm;
  const imports = __wbg_get_imports();
  if (typeof input === 'string' || typeof Request === 'function' && input instanceof Request || typeof URL === 'function' && input instanceof URL) {
    input = fetch(input);
  }
  const {
    instance,
    module
  } = await __wbg_load(await input, imports);
  return __wbg_finalize_init(instance, module);
}

var exports$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Vt: Vt,
    create: create$1,
    default: __wbg_init,
    initSync: initSync
});

const base64codes = [62,0,0,0,63,52,53,54,55,56,57,58,59,60,61,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,0,0,0,0,0,0,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51];

        function getBase64Code(charCode) {
            return base64codes[charCode - 43];
        }

        function base64_decode(str) {
            let missingOctets = str.endsWith("==") ? 2 : str.endsWith("=") ? 1 : 0;
            let n = str.length;
            let result = new Uint8Array(3 * (n / 4));
            let buffer;

            for (let i = 0, j = 0; i < n; i += 4, j += 3) {
                buffer =
                    getBase64Code(str.charCodeAt(i)) << 18 |
                    getBase64Code(str.charCodeAt(i + 1)) << 12 |
                    getBase64Code(str.charCodeAt(i + 2)) << 6 |
                    getBase64Code(str.charCodeAt(i + 3));
                result[j] = buffer >> 16;
                result[j + 1] = (buffer >> 8) & 0xFF;
                result[j + 2] = buffer & 0xFF;
            }

            return result.subarray(0, result.length - missingOctets);
        }

        const wasm_code = base64_decode("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QcACayICJAAgASgCBCEDA0ACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCADBEAgAkG4AmogASgCABB2IAIoArgCIQMgAigCvAJBAWsOBgEFBAUCAwULIABBEjoAAAwLCwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCADLwEAIgMOHgABAgMEBQ4GDgcODg4ODg4ODg4ODggICQoLDgwODQ4LIAJBqAFqQQEgASgCACABKAIEQeiawAAQlQEgASACKQOoATcCACAAQQA6AAAMGAsgAkGwAWpBASABKAIAIAEoAgRB+JrAABCVASABIAIpA7ABNwIAIABBAToAAAwXCyACQbgBakEBIAEoAgAgASgCBEGIm8AAEJUBIAEgAikDuAE3AgAgAEECOgAADBYLIAJBwAFqQQEgASgCACABKAIEQZibwAAQlQEgASACKQPAATcCACAAQQM6AAAMFQsgAkHIAWpBASABKAIAIAEoAgRBqJvAABCVASABIAIpA8gBNwIAIABBBDoAAAwUCyACQdABakEBIAEoAgAgASgCBEG4m8AAEJUBIAEgAikD0AE3AgAgAEEFOgAADBMLIAJB2AFqQQEgASgCACABKAIEQcibwAAQlQEgASACKQPYATcCACAAQQY6AAAMEgsgAkHgAWpBASABKAIAIAEoAgRB2JvAABCVASABIAIpA+ABNwIAIABBBzoAAAwRCyACQegBakEBIAEoAgAgASgCBEHom8AAEJUBIAEgAikD6AE3AgAgAEEIOgAADBALIAJB8AFqQQEgASgCACABKAIEQfibwAAQlQEgASACKQPwATcCACAAQQk6AAAMDwsgAkH4AWpBASABKAIAIAEoAgRBiJzAABCVASABIAIpA/gBNwIAIABBCjoAAAwOCyACQYACakEBIAEoAgAgASgCBEGYnMAAEJUBIAEgAikDgAI3AgAgAEELOgAADA0LIAJBiAJqQQEgASgCACABKAIEQaicwAAQlQEgASACKQOIAjcCACAAQQw6AAAMDAsgAkGQAmpBASABKAIAIAEoAgRBuJzAABCVASABIAIpA5ACNwIAIABBDToAAAwLCwJAAkAgA0Eea0H//wNxQQhPBEAgA0Emaw4CAQgCCyACQQhqQQEgASgCACABKAIEQdiewAAQlQEgASACKQMINwIAIAAgA0EeazoA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AXI6AA8gAyABQQZ2QT9xQYABcjoADiADIAFBDHZBP3FBgAFyOgANIAMgAUESdkEHcUHwAXI6AAxBBAwCCyAAKAIAIgUgACgCCCICRgRAIwBBIGsiBCQAAkACQCACQQFqIgJFDQBBCCAFQQF0IgYgAiACIAZJGyICIAJBCE0bIgJBf3NBH3YhBiAEIAUEfyAEIAU2AhwgBCAAKAIENgIUQQEFQQALNgIYIARBCGogBiACIARBFGoQRyAEKAIIBEAgBCgCDEUNAQALIAQoAgwhBSAAIAI2AgAgACAFNgIEIARBIGokAAwBCxCTAQALIAAoAgghAgsgACACQQFqNgIIIAAoAgQgAmogAToAAAwCCyADIAFBP3FBgAFyOgANIAMgAUEGdkHAAXI6AAxBAgshASABIAAoAgAgACgCCCICa0sEQCAAIAIgARA9IAAoAgghAgsgACgCBCACaiADQQxqIAEQJxogACABIAJqNgIICyADQRBqJABBAAvAAgIEfwJ+IwBBMGsiAyQAQSchAgJAIAA1AgAiBkKQzgBUBEAgBiEHDAELA0AgA0EJaiACaiIAQQRrIAZCkM4AgCIHQvCxA34gBnynIgRB//8DcUHkAG4iBUEBdEGmpcAAai8AADsAACAAQQJrIAVBnH9sIARqQf//A3FBAXRBpqXAAGovAAA7AAAgAkEEayECIAZC/8HXL1YgByEGDQALCyAHpyIAQeMASwRAIAJBAmsiAiADQQlqaiAAIABB//8DcUHkAG4iAEGcf2xqQf//A3FBAXRBpqXAAGovAAA7AAALAkAgAEEKTwRAIAJBAmsiAiADQQlqaiAAQQF0QaalwABqLwAAOwAADAELIAJBAWsiAiADQQlqaiAAQTByOgAACyABQeDmwABBACADQQlqIAJqQScgAmsQGyADQTBqJAALygIBBX8jAEFAaiIDJAAgA0EANgIgIAMgATYCGCADIAEgAmo2AhwgA0EQaiADQRhqEGECQAJAIAMoAhBFBEAgAEEANgIIIABCgICAgMAANwIADAELIAMoAhQhBCADQQhqQQRBEBCmASADKAIIIgVFDQEgBSAENgIAIANBATYCLCADIAU2AiggA0EENgIkIANBOGogA0EgaigCADYCACADIAMpAhg3AzBBBCEEQQEhBgNAIAMgA0EwahBhIAMoAgBBAUdFBEAgAygC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ACAAQQRqKAIAQQFHDQAgAEEIai0AAEECRw0AIABBDGotAABBAkcNACAAQRBqLQAADQAgAUEDay0AAEEfcQ0AIAJBFGohAiADQQFqIQMgACEBDAELCyADIQQLIAQLpQEBAn8jAEEgayICJAAgAiAAKAJoNgIMIAJBADoAHCACIAAoAlQiAzYCECACIAMgACgCWEECdGo2AhQgAiACQQxqNgIYIAACfwJAA0AgAUEBayIBBEAgAkEQahBgDQEMAgsLIAJBEGoQYCIBRQ0AIAAoApwBIgNBAWshACABKAIADAELIAAoApwBIgNBAWsiAAsiASAAIAEgA0kbNgJoIAJBIGokAAuzAQECfyMAQRBrIgIkAAJAIAFFDQAgAUEDakECdiEBAkAgAEEETQRAIAFBAWsiA0GAAkkNAQsgAkH47sAAKAIANgIIIAEgACACQQhqQeDmwABB4ObAABBjIQBB+O7AACACKAIINgIADAELIAJB+O7AADYCBCACIANBAnRB+ObAAGoiAygCADYCDCABIAAgAkEMaiACQQRqQcjmwAAQYyEAIAMgAigCDDYCAAsgAkEQaiQAIAALoAEBA38jAEEQayIFJAAgBUEIaiAAIAEgAkG0jcAAEHQgBSgCDCIGIAMgAiABayIHIAMgB0kbIgNPBEAgBiADayIGIAUoAgggBkEEdGogAxAYIAAgASABIANqIAQQMyABBEAgACABQQFrQcSNwAAQcUEAOgAMCyAAIAJBAWtB1I3AABBxQQA6AAwgBUEQaiQADwtB2InAAEEhQfyJwAAQfgALqAEBAn8jAEEwayIDJAAgA0EQaiAAEIoBIAMoAhQgAygCECIAIAEgAhAwIANBGGogAEHgAGooAgAgAEHkAGooAgAQKiADQQhqIAAQLCADIAMpAwg3AiQgAyADKAIcIAMoAiAQayADKAIEIQAgAygCAARAIAMgADYCLEHUgcAAQSsgA0EsakGAgsAAQdyDwAAQWwALIANBGGoQjwFBADYCACADQTBqJAAgAAunAQECfyMAQRBrIgQkACABIAIgAxB8IAEoAghBACEDIAFBADYCCCABKAIMIQIQzAECQCABKAIARQRAIAEoAgQgAkGCARAKEM8BQYIBEM8BIAIQzwEMAQsgBEEIaiACELkBIAQoAgwhAiAEKAIIRQRAIAEoAgQgAkGCARAIDAELEEwhASACEM8BQYIBEM8BQQEhAwsgACABNgIEIAAgAzYCACAEQRBqJAALmAEBA39BASEEQQQhBgJAIAFFDQAgAkEASA0AAn8CfyADKAIEBEAgAygCCCIBRQRAQaHvwAAtAAAaQQEgAhBDDAILIAMoAgAgAUEBIAIQlgEMAQtBoe/AAC0AABpBASACEEMLIgQEQCAAIAQ2AgRBAAwBCyAAQQE2AgRBAQshBEEIIQYgAiEFCyAAIAZqIAU2AgAgACAENgIAC58BAQF/IwBBEGsiBiQAAkAgAQRAIAZBBGogASADIAQgBSACKAIQEQcAIAYoAgQiAiAGKAIMIgFLBEAgAkECdCECIAYoAgghAwJAIAFFBEAgAyACEMkBQQQhBQwBCyADIAJBBCABQQJ0EJYBIgVFDQMLIAYgBTYCCAsgACABNgIEIAAgBigCCDYCACAGQRBqJAAPC0GcqcAAQTIQ4AEACwALpAEBAX8jAEEQayIDJAACQCAARQ0AIAJFDQACQCABQQRNBEAgAkEDakECdkEBayIBQYACSQ0BCyADQfjuwAAoAgA2AgggACADQQhqQeDmwABBBhBAQfjuwAAgAygCCDYCAAwBCyADQfjuwAA2AgQgAyABQQJ0QfjmwABqIgEoAgA2AgwgACADQQxqIANBBGpBBxBAIAEgAygCDDYCAAsgA0EQaiQAC5cBAQN/IwBBEGsiAiQAIAACfyABRQRAIABCgICAgMAANwIEQQAMAQsCQCABQebMmTNNBEAgAUEUbCIDQQBIBEAgAEEANgIEDAILIAJBCGpBBCADEKYBIAIoAggiBARAIAAgBDYCCCAAIAE2AgRBAAwDCyAAIAM2AgggAEEENgIEDAELIABBADYCBAtBAQs2AgAgAkEQaiQAC4wBAQV/IwBBgAFrIgQkACAALQAAIQBB/wAhAgNAIAIiAyAEaiIFIABBD3EiAkEwciACQdcAaiACQQpJGzoAACADQQFrIQIgAEH/AXEiBkEEdiEAIAZBEE8NAAsgA0GBAU8EQCADQYABQZSlwAAQ2wEACyABQaSlwABBAiAFQYABIANrEBsgBEGAAWokAAujAQEEfyMAQUBqIgAkACAAQQA2AhQgAEKAgICAEDcCDCAAQQM6ADggAEEgNgIoIABBADYCNCAAQZiAwAA2AjAgAEEANgIgIABBADYCGCAAIABBDGo2AiwgAEEYakGQgsAAQTMQEwRAQbCAwABBNyAAQT9qQeiAwABBxIHAABBbAAsgACgCDCAAKAIQIgIgACgCFBAGIQMgAhDOASAAQUBrJAAgAwuIAQEFfyMAQSBrIgIkAEEBIQMCQAJAIAEEQCABQQBIDQEgAkEIakEBIAEQpgEgASEEIAIoAggiA0UNAgsgAkEUaiIFQQhqIgZBADYCACACIAM2AhggAiAENgIUIAUgAUEBEC0gAEEIaiAGKAIANgIAIAAgAikCFDcCACACQSBqJAAPCxCTAQALAAuHAQECfyMAQRBrIgIkACACQoCAgIDAADcCBCACQQA2AgwgAUEIayIDQQAgASADTxsiAUEDdiABQQdxQQBHaiEBQQghAwNAIAEEQCABQQFrIQEgAkEEaiADEIgBIANBCGohAwwBBSAAIAIpAgQ3AgAgAEEIaiACQQxqKAIANgIAIAJBEGokAAsLC4sBAQF/IwBBEGsiAyQAIAMgASgCACIEKAIANgIMQYAQIAJBAmoiASABbCIBIAFBgBBNGyICQQQgA0EMakHg5sAAQeDmwAAQYyEBIAQgAygCDDYCACABBH8gAUIANwIEIAEgASACQQJ0akECcjYCAEEABUEBCyECIAAgATYCBCAAIAI2AgAgA0EQaiQAC+EBAQR/IwBBIGsiAyQAIAEoAggiBCACTwRAIANBFGoiBSAEIAJrIgQQSiADQQhqIAUQpQEgAygCCCEFIAMoAgwgASACNgIIIAEoAgQgAkEUbGogBEEUbBAnIQEgACAENgIIIAAgATYCBCAAIAU2AgAgA0EgaiQADwsjAEEwayIAJAAgACAENgIEIAAgAjYCACAAQSxqQQg2AgAgAEEDNgIMIABBvIfAADYCCCAAQgI3AhQgAEEINgIkIAAgAEEgajYCECAAIABBBGo2AiggACAANgIgIABBCGpB+IrAABCMAQALjwEBAX8jAEFAaiIDJAAgA0IANwM4IANBOGogACgCABADIAMgAygCPCIANgI0IAMgAygCODYCMCADIAA2AiwgA0EBNgIoIANBAjYCECADQczlwAA2AgwgA0IBNwIYIAMgA0EsajYCJCADIANBJGo2AhQgASACIANBDGoQGSADKAIsIAMoAjAQzgEgA0FAayQAC3oBA38gAS0AACECAkACQAJAIAAtAAAiBEECRgRAQQEhAyACQQJHDQEMAwsgAkECRw0BC0EADwsgAiAERw0AIARFBEAgAC0AASABLQABRg8LIAAtAAEgAS0AAUcNACAALQACIAEtAAJHDQAgAC0AAyABLQADRiEDCyADC4cBAQN/IwBBEGsiAiQAIAACfyABRQRAIABCgICAgMAANwIEQQAMAQsCQCABQYCAgMAATwRAIABBADYCBAwBCyACQQhqQQQgAUEEdCIDEKYBIAIoAggiBARAIAAgBDYCCCAAIAE2AgRBAAwCCyAAIAM2AgggAEEENgIEC0EBCzYCACACQRBqJAALfgEDfwJAIAAoAgAiAUECcQ0AIAFBfHEiAkUNACACIAIoAgRBA3EgACgCBEF8cXI2AgQgACgCACEBCyAAKAIEIgJBfHEiAwRAIAMgAygCAEEDcSABQXxxcjYCACAAKAIEIQIgACgCACEBCyAAIAJBA3E2AgQgACABQQNxNgIAC34BAn8gACABIAAoAggiA2siBBB7IAQEQCADIAFrIQQgASAAKAIIIgFqIANrIQMgACgCBCABQRRsaiEBA0AgAUKggICAEDcCACABQQhqIAIpAAA3AAAgAUEQaiACQQhqLwAAOwAAIAFBFGohASAEQQFqIgQNAAsgACADNgIICwtxAQR/QQEhBiACIQQDQAJAAkAgAiAFTQRAIAUhBAwBCyABIARBAXYgBWoiBEECdGooAgAiByADRw0BQQAhBgsgACAENgIEIAAgBjYCAA8LIAQgAiADIAdJGyICIARBAWogBSADIAdLGyIFayEEDAALAAt+AQN/IwBBsAtrIgEkACAAEM0BIAEgABCiASABKAIEQQA2AgAgAUHcBWoiAiAAQdQFECcaIAFBDGoiAyACQQRqQdAFECcaIABBBEHUBRBJIAMQuwEgAUEwahC7ASABKAJcIAEoAmAQvwEgASgCaCABKAJsEMUBIAFBsAtqJAALeAICfwF+AkACQCABrUIMfiIEQiCIpw0AIASnIgJBB2oiAyACSQ0AIANBeHEiAiABakEIaiEBIAEgAkkNASABQfj///8HTQRAIAAgAjYCCCAAIAE2AgQgAEEINgIADwsgAEEANgIADwsgAEEANgIADwsgAEEANgIAC3cBBn8gACgCBCEGIAAoAgAhAgJAA0AgASADRg0BAkAgAiAGRg0AIAAgAkEQaiIHNgIAIAJBBGooAgAhBSACKAIAIgJBgICAgHhGDQAgAiAFEMYBIANBAWohAyAHIQIMAQsLQYCAgIB4IAUQxgEgASADayEECyAEC3YBAn8gAqchA0EIIQQDQCABIANxIgMgAGopAABCgIGChIiQoMCAf4MiAkIAUkUEQCADIARqIQMgBEEIaiEEDAELCyACeqdBA3YgA2ogAXEiBCAAaiwAAEEATgR/IAApAwBCgIGChIiQoMCAf4N6p0EDdgUgBAsLewEBfyMAQUBqIgUkACAFIAE2AgwgBSAANgIIIAUgAzYCFCAFIAI2AhAgBUE8akEENgIAIAVBAjYCHCAFQcikwAA2AhggBUICNwIkIAVBBTYCNCAFIAVBMGo2AiAgBSAFQRBqNgI4IAUgBUEIajYCMCAFQRhqIAQQjAEAC2oAAn8gAkECdCIBIANBA3RBgIABaiICIAEgAksbQYeABGoiAUEQdkAAIgJBf0YEQEEAIQJBAQwBCyACQRB0IgJCADcCBCACIAIgAUGAgHxxakECcjYCAEEACyEDIAAgAjYCBCAAIAM2AgALaAEEfyAAKAIAIQEgACgCBCEDAkADQCABIANGBEBBAA8LIAAgAUEQaiIENgIAIAFBBGovAQAiAkEZTUEAQQEgAnRBwoGAEHEbDQEgAkGXCGtBA0kNASAEIQEgAkEvRw0AC0GXCA8LIAILgwEBAX8CQAJAAkACQAJAAkACQAJAAkACQAJAIAFBCGsOCAECBgYGAwQFAAtBMiECIAFBhAFrDgoFBgkJBwkJCQkICQsMCAtBGyECDAcLQQYhAgwGC0EsIQIMBQtBKiECDAQLQR8hAgwDC0EgIQIMAgtBHCECDAELQSMhAgsgACACOgAAC2sBBH8jAEEgayICJAAgASgCBCEDIAJBFGoiBCABKAIIIgUQSiACQQhqIAQQpQEgAigCCCEEIAIoAgwgAyAFQRRsECchAyAAIAU2AgggACADNgIEIAAgBDYCACAAIAEtAAw6AAwgAkEgaiQAC2gBB38gACgCCCEDIAAoAgQhBCAALQAMIQUgACgCACICIQECQANAIAEgBEYEQEEADwsgACABQQRqIgY2AgAgBQ0BIAEoAgAhByAGIQEgAygCACAHTw0ACyABQQRrIQILIABBAToADCACC2cBB38gASgCCCEDIAEoAgAhAiABKAIEIQYDQAJAIAMhBCACIAZGBEBBACEFDAELQQEhBSABIAJBAWoiBzYCACABIARBAWoiAzYCCCACLQAAIAchAkUNAQsLIAAgBDYCBCAAIAU2AgALZQEDfwNAIANBFEZFBEAgASADaiIEKAIAIQUgBCACIANqIgQoAgA2AgAgBCAFNgIAIANBBGohAwwBCwsgACACKQIANwIAIABBEGogAkEQaigCADYCACAAQQhqIAJBCGopAgA3AgALawECfyMAQRBrIgYkAAJAIAAgASACIAMgBBAeIgUNACAGQQhqIAMgACABIAQoAgwRBQBBACEFIAYoAggNACAGKAIMIgUgAigCADYCCCACIAU2AgAgACABIAIgAyAEEB4hBQsgBkEQaiQAIAULagEBfyMAQTBrIgMkACADIAE2AgQgAyAANgIAIANBLGpBCDYCACADQQI2AgwgA0G0pMAANgIIIANCAjcCFCADQQg2AiQgAyADQSBqNgIQIAMgAzYCKCADIANBBGo2AiAgA0EIaiACEIwBAAtgAQV/IAAoAgRBBGshAiAAKAIIIQMgACgCACEEIAAtAAwhBQNAIAQgAiIBQQRqRgRAQQAPCyAAIAE2AgQgBUUEQCABQQRrIQIgAygCACABKAIATQ0BCwsgAEEBOgAMIAELbQEBfyMAQTBrIgIkACACIAE2AgQgAiAANgIAIAJBLGpBCDYCACACQQM2AgwgAkHghsAANgIIIAJCAjcCFCACQQg2AiQgAiACQSBqNgIQIAIgAkEEajYCKCACIAI2AiAgAkEIakHoisAAEIwBAAtiAQJ/IAAgACgCaCICIAAoApwBQQFrIgMgAiADSRs2AmggACABIAAoAqgBQQAgAC0AvgEiAhsiAWoiAyABIAEgA0kbIgEgACgCrAEgACgCoAFBAWsgAhsiACAAIAFLGzYCbAtcAAJAIAIgA00EQCABIANJDQEgAyACayEDIAAgAmohAgNAIAMEQCACQQE6AAAgA0EBayEDIAJBAWohAgwBCwsPCyACIANByKHAABDcAQALIAMgAUHIocAAENoBAAuFAQECfyAAKAIIIgIgACgCAEYEQCMAQRBrIgMkACADQQhqIAAgAkEBEDUgAygCDBogAygCCBC1ASADQRBqJAAgACgCCCECCyAAIAJBAWo2AgggACgCBCACQRRsaiIAIAEpAgA3AgAgAEEIaiABQQhqKQIANwIAIABBEGogAUEQaigCADYCAAtXAQR/IAAoAgAhAiAAKAIEIQMDQCACIANGBEBBAw8LIAAgAkEQaiIBNgIAIAJBBGohBCABIQJBBEEUQQMgBC8BACIBQRRGGyABQQRGGyIBQQNGDQALIAELTAECfyACQQJ0IQIQASEEA0AgAgRAIAQgAyABKAIAQQAQtwEQAiACQQRrIQIgA0EBaiEDIAFBBGohAQwBCwsgACAENgIEIABBADYCAAtTAQF/IAAoAmwiASAAKAKsAUcEQCAAKAKgAUEBayABSwRAIAAgAUEBajYCbCAAIAAoAmgiASAAKAKcAUEBayIAIAAgAUsbNgJoCw8LIABBARCeAQtXACABIAIQWQRAIABBgICAgHg2AgAPCyABKAIAIgIgASgCBEYEQCAAQYCAgIB4NgIADwsgASACQRBqNgIAIAAgAikCADcCACAAQQhqIAJBCGopAgA3AgALUQECfyAAIAAoAmgiAiAAKAKcAUEBayIDIAIgA0kbNgJoIAAgACgCoAFBAWsgACgCrAEiAiAAKAJsIgAgAksbIgIgACABaiIAIAAgAksbNgJsC1kCAn8BfiMAQRBrIgIkACACQQhqIAEQkQEgAigCCCkCnAEhBCACKAIMIQFBCBCyASIDIAQ3AgAgASABKAIAQQFrNgIAIABBAjYCBCAAIAM2AgAgAkEQaiQAC0oBAn8gACAAKAJoIgIgACgCnAFBAWsiAyACIANJGzYCaCAAIAAoAqgBIgJBACAAKAJsIgAgAk8bIgIgACABayIAIAAgAkgbNgJsCz8BAX8jAEEQayIDJAAgA0EIaiAAEH8gASADKAIMIgBJBEAgAygCCCADQRBqJAAgAUEEdGoPCyABIAAgAhBkAAtUAQF/IAAgACgCbDYCeCAAIAApAbIBNwF8IAAgAC8BvgE7AYYBIABBhAFqIABBugFqLwEAOwEAIAAgACgCaCIBIAAoApwBQQFrIgAgACABSxs2AnQLRgEDfyABIAIgAxBaIgUgAWoiBC0AACEGIAQgA6dBGXYiBDoAACABIAVBCGsgAnFqQQhqIAQ6AAAgACAGOgAEIAAgBTYCAAtJAQF/IwBBEGsiBSQAIAVBCGogARB/IAUgAiADIAUoAgggBSgCDCAEEHggBSgCBCEBIAAgBSgCADYCACAAIAE2AgQgBUEQaiQAC08BAn8gACgCBCECIAAoAgAhAwJAIAAoAggiAC0AAEUNACADQfCkwABBBCACKAIMEQMARQ0AQQEPCyAAIAFBCkY6AAAgAyABIAIoAhARAQALSQECfwJAIAEoAgAiAkF/RwRAIAJBAWohAyACQQZJDQEgA0EGQdifwAAQ2gEAC0HYn8AAEJQBAAsgACADNgIEIAAgAUEEajYCAAtCAQF/IAJBAnQhAgNAIAIEQCAAKAIAIQMgACABKAIANgIAIAEgAzYCACACQQFrIQIgAUEEaiEBIABBBGohAAwBCwsLPwACQCABIAJNBEAgAiAETQ0BIAIgBCAFENoBAAsgASACIAUQ3AEACyAAIAIgAWs2AgQgACADIAFBBHRqNgIAC0MBBH8jAEEQayICJAAgASAAKAIAIAAoAggiA2tLBEAgAkEIaiAAIAMgARA5IAIoAgggAigCDCEFELUBCyACQRBqJAALQQEBfyACIAAoAgAgACgCCCIDa0sEQCAAIAMgAhA9IAAoAgghAwsgACgCBCADaiABIAIQJxogACACIANqNgIIQQALQwEEfyMAQRBrIgIkACABIAAoAgAgACgCCCIDa0sEQCACQQhqIAAgAyABEDUgAigCCCACKAIMIQUQtQELIAJBEGokAAtCAQF/IwBBEGsiAyQAIANBCGogASACEMQBIAMoAgwhASAAKAIIIAAoAgwQ0wEgACABNgIMIABBATYCCCADQRBqJAALQQEDfyABKAIUIgIgASgCHCIDayEEIAIgA0kEQCAEIAJBlI7AABDbAQALIAAgAzYCBCAAIAEoAhAgBEEEdGo2AgALRQEBfyMAQSBrIgMkACADQQE2AgQgA0IANwIMIANB4ObAADYCCCADIAE2AhwgAyAANgIYIAMgA0EYajYCACADIAIQjAEAC0EBA38gASgCFCICIAEoAhwiA2shBCACIANJBEAgBCACQaSOwAAQ2wEACyAAIAM2AgQgACABKAIQIARBBHRqNgIAC0QBAX8gASgCACICIAEoAgRGBEAgAEGAgICAeDYCAA8LIAEgAkEQajYCACAAIAIpAgA3AgAgAEEIaiACQQhqKQIANwIACzsBA38DQCACQRRGRQRAIAAgAmoiAygCACEEIAMgASACaiIDKAIANgIAIAMgBDYCACACQQRqIQIMAQsLCzsBA38DQCACQSRGRQRAIAAgAmoiAygCACEEIAMgASACaiIDKAIANgIAIAMgBDYCACACQQRqIQIMAQsLC0AAIAAtALwBBEAgAEEAOgC8ASAAQfQAaiAAQYgBahCBASAAIABBJGoQggEgACgCYCAAKAJkQQAgACgCoAEQaAsLPgEEfyMAQRBrIgEkACAAKAIIIgIgACgCAEYEQCABQQhqIAAgAhA3IAEoAgggASgCDCEEELUBCyABQRBqJAALOwEBfwJAIAJBf0cEQCACQQFqIQQgAkEgSQ0BIARBICADENoBAAsgAxCUAQALIAAgBDYCBCAAIAE2AgALOwEBfyMAQRBrIgMkACADQQRqIAJBAWoQWCADKAIMIQIgACADKQIENwIEIAAgASACazYCACADQRBqJAALOAACQCABaUEBRw0AQYCAgIB4IAFrIABJDQAgAARAQaHvwAAtAAAaIAEgABBDIgFFDQELIAEPCwALXgECfyAAKAIIIgIgACgCAEYEQCMAQRBrIgMkACADQQhqIAAgAhA3IAMoAgwaIAMoAggQtQEgA0EQaiQAIAAoAgghAgsgACACQQFqNgIIIAAoAgQgAkECdGogATYCAAs5AAJAAn8gAkGAgMQARwRAQQEgACACIAEoAhARAQANARoLIAMNAUEACw8LIAAgAyAEIAEoAgwRAwALOwEBfyMAQRBrIgIkACABEM0BIAJBCGogARCiASACKAIMIQEgACACKAIINgIAIAAgATYCBCACQRBqJAALiQEBBX8gACgCBCECIABB4ObAADYCBCAAKAIAIQEgAEHg5sAANgIAIAEgAkcEQCABIAIgAWtBBHYQnwELIAAoAhAiAQRAIAAoAggiAigCCCIDIAAoAgwiBEcEQCACKAIEIgUgA0EEdGogBSAEQQR0aiABQQR0EBcgACgCECEBCyACIAEgA2o2AggLC9IBAQF/IwBBIGsiAiQAIAJBATsBHCACIAE2AhggAiAANgIUIAJB8KPAADYCECACQeDmwAA2AgwgAkEMaiIAKAIIIgFFBEBBlKvAABDdAQALIAEoAgwhAgJAIAEoAgRBAWsNACACRQ0ACyAALQARGiAALQAQIQBBmO/AAEGY78AAKAIAIgFBAWo2AgACQCABQQBIDQBBoO/AAC0AAEEBcQ0AQZzvwABBnO/AACgCAEEBajYCAEGU78AAKAIAQQBIDQBBoO/AAEEAOgAAIABFDQAACwALNAEBfiABKQMAIgJCAFIEQCABIAJCAX0gAoM3AwALIAAgAkIAUjYCACAAIAJ6p0EDdjYCBAstAQF/IAEgACgCAE8EfyAAKAIEIQIgAC0ACEUEQCABIAJNDwsgASACSQVBAAsLOwECfyAAKAIAIAAoAgQQvwEgACgCDCIBIAAoAhAiACgCABEEACAAKAIEIgIEQCABIAAoAgggAhDCAQsLRAEBf0EBIQICQCABQQFLDQBBxILAACAAEI4BDQBB0ILAACAAEI4BDQBB3ILAACAAEI4BDQBB6ILAACAAEI4BIQILIAILNQEBfyABEM0BIAEoAgAiAkF/RgRAEOEBAAsgASACQQFqNgIAIAAgATYCBCAAIAFBBGo2AgALLgEBfyMAQRBrIgIkACACQQhqIAEgABCmASACKAIIIgAEQCACQRBqJAAgAA8LAAs9AQF/IwBBIGsiACQAIABBATYCDCAAQfyEwAA2AgggAEIANwIUIABB4ObAADYCECAAQQhqQaCFwAAQjAEACzoBAX8jAEEgayIBJAAgAUEBNgIMIAFBtKjAADYCCCABQgA3AhQgAUHg5sAANgIQIAFBCGogABCMAQALLAAgASADTQRAIAAgAyABazYCBCAAIAIgAUEEdGo2AgAPCyABIAMgBBDbAQALKgEBfyACIAMQQyIEBEAgBCAAIAEgAyABIANJGxAnGiAAIAIgARBJCyAECysAIAIgA0kEQCADIAIgBBDbAQALIAAgAiADazYCBCAAIAEgA0EUbGo2AgALLgEBfyAAIAIQeyAAKAIEIAAoAggiA0EUbGogASACQRRsECcaIAAgAiADajYCCAswAAJAAkAgA2lBAUcNAEGAgICAeCADayABSQ0AIAAgASADIAIQlgEiAA0BCwALIAALMAEDfyMAQRBrIgIkACACQQhqIAAgAUEBEDkgAigCCCACKAIMIQQQtQEgAkEQaiQACzIBAX8gACgCCCECIAEgACgCAEECai0AABC3ASEBIAAoAgQgAiABEAIgACACQQFqNgIICyoAIAAgACgCaCABaiIBIAAoApwBIgBBAWsgACABSxtBACABQQBOGzYCaAszAQJ/IAAgACgCqAEiAiAAKAKsAUEBaiIDIAEgAEGyAWoQRCAAKAJgIAAoAmQgAiADEGgLMwECfyAAIAAoAqgBIgIgACgCrAFBAWoiAyABIABBsgFqEB8gACgCYCAAKAJkIAIgAxBoCyoAA0AgAQRAIAAoAgAgAEEEaigCABC+ASABQQFrIQEgAEEQaiEADAELCwsqACABIAJJBEBB2IjAAEEjQciJwAAQfgALIAIgACACQRRsaiABIAJrEB0LNQAgACAAKQJ0NwJoIAAgACkBfDcBsgEgACAALwGGATsBvgEgAEG6AWogAEGEAWovAQA7AQALKAAgASgCAEUEQCABQX82AgAgACABNgIEIAAgAUEEajYCAA8LEOEBAAsoAQF/IAAgAhB5IAAoAggiAyAAKAIEaiABIAIQJxogACACIANqNgIICysBAn8CQCAAKAIEIAAoAggiARBBIQIgAkEBayABTw0AIAAgASACazYCCAsLJQACQCABKAIABEAgASgCBEUNAQALIAAgASkCBDcDAA8LEJMBAAsmACACBEBBoe/AAC0AABogASACEEMhAQsgACACNgIEIAAgATYCAAskACABIAJBARB3IABBCGogAkEIaikCADcCACAAIAIpAgA3AgALJQAgAEEBNgIEIAAgASgCBCABKAIAa0EEdiIBNgIIIAAgATYCAAsbACABIAJNBEAgAiABIAMQZAALIAAgAkEUbGoLIAAgASACTQRAIAIgAUG4ocAAEGQACyAAIAJqQQE6AAALGwAgASACTQRAIAIgASADEGQACyAAIAJBBHRqCyUAIABFBEBBnKnAAEEyEOABAAsgACACIAMgBCAFIAEoAhARCAALIwAgAEUEQEGcqcAAQTIQ4AEACyAAIAIgAyAEIAEoAhARBQALIwAgAEUEQEGcqcAAQTIQ4AEACyAAIAIgAyAEIAEoAhAREwALIwAgAEUEQEGcqcAAQTIQ4AEACyAAIAIgAyAEIAEoAhARCQALIwAgAEUEQEGcqcAAQTIQ4AEACyAAIAIgAyAEIAEoAhARFQALIwAgAEUEQEGcqcAAQTIQ4AEACyAAIAIgAyAEIAEoAhARFwALGgBBoe/AAC0AABpBBCAAEEMiAARAIAAPCwALHQAgBCAAQQJqLQAAELcBIQAgASACIAMQISAAEAgLHQEBfyAAKAIIIgEEQCAAKAIAQQIgAUEBdBDCAQsLHAACQCAAQYGAgIB4RwRAIABFDQEACw8LEJMBAAshACAARQRAQZypwABBMhDgAQALIAAgAiADIAEoAhARAgALFwAgAUH/AXFFBEAgALgQBA8LIACtEAULHwAgAEUEQEGcqcAAQTIQ4AEACyAAIAIgASgCEBEBAAsbAQF/IAEQACECIAAgATYCBCAAIAJBAUc2AgALGQEBfyAAKAIAIgEEQCAAKAIEQQEgARBJCwsdAQF/IAAoAhAiASAAKAIUEJ8BIAAoAgwgARC8AQsTACAABEAgAUEEIABBBHQQwgELCx0BAX8gACgCBCIBIAAoAggQnwEgACgCACABELwBCxMAIAAEQCABQQQgAEEUbBDCAQsLEQAgAARAIAEgAEECdBDJAQsLEwAgAUUEQEEAQQAgAhBkAAsgAAsXACAAQRBqEIsBIAAoAgAgACgCBBDGAQsPACACBEAgACABIAIQSQsLGQAgASgCFEHLhMAAQQUgASgCGCgCDBEDAAsUACAAIAEgAhAMNgIEIABBADYCAAsQACAABEAgAUEBIAAQwgELCxUAIABBgICAgHhHBEAgACABEL4BCwsUACABBEBBgICAgHggARDGAQsgAQsZACABKAIUQZyjwABBDiABKAIYKAIMEQMACw8AIAEEQCAAQQQgARBJCwsTACABKAIEGiAAQdCpwAAgARAZCw8AIAEEQCAAIAIgARBJCwsTACAARQRAQYCAwABBFRDgAQALCxMAIAAEQA8LQdzlwABBGxDgAQALDwAgAARAIAFBASAAEEkLCw8AIABBhAFPBEAgABALCwsVACACIAIQxwEaIABBgICAgHg2AgALFAAgACgCACABIAAoAgQoAgwRAQALEAAgASAAKAIEIAAoAggQEwsMACAABEAgARDPAQsLFAAgAEEANgIIIABCgICAgBA3AgALEgAgACABQfSLwAAQcUEBOgAMCyAAIABCjdOAp9TbosY8NwMIIABC1Z7E49yDwYl7NwMACxAAIAEgACgCACAAKAIEEBMLDwAgACgCACAAKAIEEM4BCw0AIAAgASACEKMBQQALagEBfyMAQTBrIgMkACADIAE2AgQgAyAANgIAIANBLGpBCDYCACADQQI2AgwgA0HEp8AANgIIIANCAjcCFCADQQg2AiQgAyADQSBqNgIQIAMgA0EEajYCKCADIAM2AiAgA0EIaiACEIwBAAtqAQF/IwBBMGsiAyQAIAMgATYCBCADIAA2AgAgA0EsakEINgIAIANBAjYCDCADQaSnwAA2AgggA0ICNwIUIANBCDYCJCADIANBIGo2AhAgAyADQQRqNgIoIAMgAzYCICADQQhqIAIQjAEAC2oBAX8jAEEwayIDJAAgAyABNgIEIAMgADYCACADQSxqQQg2AgAgA0ECNgIMIANB+KfAADYCCCADQgI3AhQgA0EINgIkIAMgA0EgajYCECADIANBBGo2AiggAyADNgIgIANBCGogAhCMAQALDgBBxKPAAEErIAAQfgALDgAgACgCABoDQAwACwALCwAgACMAaiQAIwALCQAgACABEA4ACw4AQfflwABBzwAQ4AEACwoAIAAgARAvQQALDQAgAEHQhMAAIAEQGQsNACAAQdikwAAgARAZCwoAIAAoAgAQzwELDQAgAEGAgICAeDYCAAsHACAAEIsBCwUAQYAECwQAQQELBAAgAQsEAEEACwIACwvdZA8AQYCAwAAL8ylgdW53cmFwX3Rocm93YCBmYWlsZWQAAAAWAAAADAAAAAQAAAAXAAAAGAAAABkAAABhIERpc3BsYXkgaW1wbGVtZW50YXRpb24gcmV0dXJuZWQgYW4gZXJyb3IgdW5leHBlY3RlZGx5ABoAAAAAAAAAAQAAABsAAAAvcnVzdGMvOWIwMDk1NmU1NjAwOWJhYjJhYTE1ZDdiZmYxMDkxNjU5OWUzZDZkNi9saWJyYXJ5L2FsbG9jL3NyYy9zdHJpbmcucnMAeAAQAEsAAAD6CQAADgAAAGNhbGxlZCBgUmVzdWx0Ojp1bndyYXAoKWAgb24gYW4gYEVycmAgdmFsdWUAHAAAAAQAAAAEAAAAHQAAAE1hcCBrZXkgaXMgbm90IGEgc3RyaW5nIGFuZCBjYW5ub3QgYmUgYW4gb2JqZWN0IGtleQAAJQAAfyUAAAAAAAAAKAAA/ygAAAAAAACAJQAAnyUAAAAAAACw4AAAs+AAAAAAAABmZ3NyYy9saWIucnNiZ2ZhaW50Ym9sZGl0YWxpY3VuZGVybGluZXN0cmlrZXRocm91Z2hibGlua2ludmVyc2UjswEQAAEAAABgMxAAAAAAAGAzEAAAAAAAdgEQAAoAAAAlAAAANgAAAHYBEAAKAAAAKgAAADYAAAB2ARAACgAAAEwAAAAxAAAAdgEQAAoAAABDAAAAIAAAAHYBEAAKAAAARgAAACIAAAB2ARAACgAAAFMAAAAvAAAAdGV4dHBlbm9mZnNldGNlbGxDb3VudGNoYXJXaWR0aEVycm9yHgAAAAwAAAAEAAAAHwAAACAAAAAhAAAAY2FwYWNpdHkgb3ZlcmZsb3cAAABoAhAAEQAAAGxpYnJhcnkvYWxsb2Mvc3JjL3Jhd192ZWMucnOEAhAAHAAAABkAAAAFAAAAYSBmb3JtYXR0aW5nIHRyYWl0IGltcGxlbWVudGF0aW9uIHJldHVybmVkIGFuIGVycm9yACIAAAAAAAAAAQAAACMAAABsaWJyYXJ5L2FsbG9jL3NyYy9mbXQucnP0AhAAGAAAAHkCAAAgAAAAKSBzaG91bGQgYmUgPCBsZW4gKGlzIGluc2VydGlvbiBpbmRleCAoaXMgKSBzaG91bGQgYmUgPD0gbGVuIChpcyAAAAAyAxAAFAAAAEYDEAAXAAAAyDIQAAEAAAByZW1vdmFsIGluZGV4IChpcyAAAHgDEAASAAAAHAMQABYAAADIMhAAAQAAAGBhdGAgc3BsaXQgaW5kZXggKGlzIAAAAKQDEAAVAAAARgMQABcAAADIMhAAAQAAAC9ob21lL3J1bm5lci8uY2FyZ28vcmVnaXN0cnkvc3JjL2luZGV4LmNyYXRlcy5pby02ZjE3ZDIyYmJhMTUwMDFmL3VuaWNvZGUtd2lkdGgtMC4xLjE0L3NyYy90YWJsZXMucnPUAxAAZAAAAJEAAAAVAAAA1AMQAGQAAACXAAAAGQAAAGFzc2VydGlvbiBmYWlsZWQ6IG1pZCA8PSBzZWxmLmxlbigpL3J1c3RjLzliMDA5NTZlNTYwMDliYWIyYWExNWQ3YmZmMTA5MTY1OTllM2Q2ZDYvbGlicmFyeS9jb3JlL3NyYy9zbGljZS9tb2QucnN7BBAATQAAAFINAAAJAAAAYXNzZXJ0aW9uIGZhaWxlZDogayA8PSBzZWxmLmxlbigpAAAAewQQAE0AAAB9DQAACQAAAC9ydXN0Yy85YjAwOTU2ZTU2MDA5YmFiMmFhMTVkN2JmZjEwOTE2NTk5ZTNkNmQ2L2xpYnJhcnkvYWxsb2Mvc3JjL3ZlYy9tb2QucnMMBRAATAAAAGAIAAAkAAAADAUQAEwAAAAaBgAAFQAAAAwFEABMAAAA1ggAAA0AAAAvaG9tZS9ydW5uZXIvLmNhcmdvL3JlZ2lzdHJ5L3NyYy9p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cmMvdGFicy5yc+gPEABYAAAAFwAAABQAAAAvaG9tZS9ydW5uZXIvLmNhcmdvL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tNmYxN2QyMmJiYTE1MDAxZi9hdnQtMC4xNi4wL3NyYy90ZXJtaW5hbC9kaXJ0eV9saW5lcy5yc1AQEABoAAAADAAAAA8AAABQEBAAaAAAABAAAAAPAAAAGgAAAAAAAAABAAAAJAAAACUAAAAmAAAAJwAAACgAAAAUAAAABAAAACkAAAAqAAAAKwAAACwAAAAvaG9tZS9ydW5uZXIvLmNhcmdvL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tNmYxN2QyMmJiYTE1MDAxZi9hdnQtMC4xNi4wL3NyYy90ZXJtaW5hbC5ycxAREABcAAAAdQIAABUAAAAQERAAXAAAALECAAAOAAAAEBEQAFwAAAAFBAAAIwAAAEJvcnJvd011dEVycm9yYWxyZWFkeSBib3Jyb3dlZDogqhEQABIAAABjYWxsZWQgYE9wdGlvbjo6dW53cmFwKClgIG9uIGEgYE5vbmVgIHZhbHVlACIAAAAAAAAAAQAAAC0AAABpbmRleCBvdXQgb2YgYm91bmRzOiB0aGUgbGVuIGlzICBidXQgdGhlIGluZGV4IGlzIAAAABIQACAAAAAgEhAAEgAAADogAABgMxAAAAAAAEQSEAACAAAALgAAAAwAAAAEAAAALwAAADAAAAAxAAAAICAgICwKKCgKbGlicmFyeS9jb3JlL3NyYy9mbXQvbnVtLnJzeRIQABsAAABpAAAAFwAAADB4MDAwMTAyMDMwNDA1MDYwNzA4MDkxMDExMTIxMzE0MTUxNjE3MTgxOTIwMjEyMjIzMjQyNTI2MjcyODI5MzAzMTMyMzMzNDM1MzYzNzM4Mzk0MDQxNDI0MzQ0NDU0NjQ3NDg0OTUwNTE1MjUzNTQ1NTU2NTc1ODU5NjA2MTYyNjM2NDY1NjY2NzY4Njk3MDcxNzI3Mzc0NzU3Njc3Nzg3OTgwODE4MjgzODQ4NTg2ODc4ODg5OTA5MTkyOTM5NDk1OTY5Nzk4OTlyYW5nZSBzdGFydCBpbmRleCAgb3V0IG9mIHJhbmdlIGZvciBzbGljZSBvZiBsZW5ndGggAABuExAAEgAAAIATEAAiAAAAcmFuZ2UgZW5kIGluZGV4ILQTEAAQAAAAgBMQACIAAABzbGljZSBpbmRleCBzdGFydHMgYXQgIGJ1dCBlbmRzIGF0IADUExAAFgAAAOoTEAANAAAAYXR0ZW1wdGVkIHRvIGluZGV4IHNsaWNlIHVwIHRvIG1heGltdW0gdXNpemUIFBAALAAAAEhhc2ggdGFibGUgY2FwYWNpdHkgb3ZlcmZsb3c8FBAAHAAAAC9ydXN0L2RlcHMvaGFzaGJyb3duLTAuMTQuMy9zcmMvcmF3L21vZC5ycwAAYBQQACoAAABWAAAAKAAAAGNsb3N1cmUgaW52b2tlZCByZWN1cnNpdmVseSBvciBhZnRlciBiZWluZyBkcm9wcGVkAAAWAAAADAAAAAQAAAAXAAAAMgAAABkAAAD//////////+gUEABBgKrAAAuhAS9ob21lL3J1bm5lci8uY2FyZ28vcmVnaXN0cnkvc3JjL2luZGV4LmNyYXRlcy5pby02ZjE3ZDIyYmJhMTUwMDFmL3NlcmRlLXdhc20tYmluZGdlbi0wLjYuNS9zcmMvbGliLnJzAAAAABUQAGUAAAA1AAAADgAAAGxpYnJhcnkvc3RkL3NyYy9wYW5pY2tpbmcucnN4FRAAHAAAAIQCAAAeAEGBrMAAC4cBAQIDAwQFBgcICQoLDA0OAwMDAwMDAw8DAwMDAwMDDwkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJEAkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJAEGBrsAAC58LAQICAgIDAgIEAgUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0CAh4CAgICAgICHyAhIiMCJCUmJygpAioCAgICKywCAgICLS4CAgIvMDEyMwICAgICAjQCAjU2NwI4OTo7PD0+Pzk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OUA5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5QQICQkMCAkRFRkdISQJKOTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5SwICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjk5OTlMAgICAgJNTk9QAgICUQJSUwICAgICAgICAgICAgJUVQICVgJXAgJYWVpbXF1eX2BhAmJjAmRlZmcCaAJpamtsAgJtbm9wAnFyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdHUCAgICAgICdnc5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OXg5OTk5OTk5OTl5egICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICezk5fDk5fQICAgICAgICAgICAgICAgICAgJ+AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfwICAoCBggICAgICAgICAgICAgICAoOEAgICAgICAgICAoWGdQIChwICAogCAgICAgICiYoCAgICAgICAgICAgICi4wCjY4Cj5CRkpOUlZYClwICmJmamwICAgICAgICAgI5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTmcHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCdAgICAp6fAgQCBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHQICHgICAgICAgIfICEiIwIkJSYnKCkCKgICAgKgoaKjpKWmLqeoqaqrrK0zAgICAgICrgICNTY3Ajg5Ojs8PT6vOTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5TAICAgICsE5PsYWGdQIChwICAogCAgICAgICiYoCAgICAgICAgICAgICi4yys44Cj5CRkpOUlZYClwICmJmamwICAgICAgICAgJVVXVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAQby5wAALKVVVVVUVAFBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUBAEHvucAAC8QBEEEQVVVVVVVXVVVVVVVVVVVVUVVVAABAVPXdVVVVVVVVVVUVAAAAAABVVVVV/F1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQUAFAAUBFBVVVVVVVVVFVFVVVVVVVVVAAAAAAAAQFVVVVVVVVVVVdVXVVVVVVVVVVVVVVUFAABUVVVVVVVVVVVVVVVVVRUAAFVVUVVVVVVVBRAAAAEBUFVVVVVVVVVVVVUBVVVVVVX/////f1VVVVBVAABVVVVVVVVVVVVVBQBBwLvAAAuYBEBVVVVVVVVVVVVVVVVVRVQBAFRRAQBVVQVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVRAFUVVFVFVVVBVVVVVVVVUVBVVVVVVVVVVVVVVVVVVVUQRUUUFFVVVVVVVVVUFFVVUFVVVVVVVVVVVVVVVVVVVQBEFRRVVVVVQVVVVVVVQUAUVVVVVVVVVVVVVVVVVVVBAFUVVFVAVVVBVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVFVFVVUVUVVVVVVVVVVVVVVVRUVVVVVVVVVVVVVVVVVQRUBQRQVUFVVQVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVFEQFBFBVQVVVBVVVVVVVVVVQVVVVVVVVVVVVVVVVVRVEAVRVQVUVVVUFVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVVVUUVBURVFVVVVVVVVVVVVVVVVVVVVVVVVVVVUQBAVVUVAEBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRAABUVVUAQFVVVVVVVVVVVVVVVVVVVVVVVVBVVVVVVVURUVVVVVVVVVVVVVVVVVUBAABAAARVAQAAAQAAAAAAAAAAVFVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQEEAEFBVVVVVVVVUAVUVVVVAVRVVUVBVVFVVVVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqAEGAwMAAC5ADVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUBVVVVVVVVVVVVVVVVBVRVVVVVVVUFVVVVVVVVVQVVVVVVVVVVBVVVVX///ff//ddfd9bV11UQAFBVRQEAAFVXUVVVVVVVVVVVVVUVAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQVVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQBVUVUVVAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVcVFFVVVVVVVVVVVVVVVVVVRQBARAEAVBUAABRVVVVVVVVVVVVVVVUAAAAAAAAAQFVVVVVVVVVVVVVVVQBVVVVVVVVVVVVVVVUAAFAFVVVVVVVVVVVVFQAAVVVVUFVVVVVVVVUFUBBQVVVVVVVVVVVVVVVVVUVQEVBVVVVVVVVVVVVVVVVVVQAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQAAAAAQAVFFVVFBVVVVVVVVVVVVVVVVVVVVVVQBBoMPAAAuTCFVVFQBVVVVVVVUFQFVVVVVVVVVVVVVVVQAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAAAAAAAAAAFRVVVVVVVVVVVX1VVVVaVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/VfXVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX1VVVVVVV9VVVVVVVVVVVVVVVX///9VVVVVVVVVVVVV1VVVVVXVVVVVXVX1VVVVVX1VX1V1VVdVVVVVdVX1XXVdVV31VVVVVVVVVVdVVVVVVVVVVXfV31VVVVVVVVVVVVVVVVVVVf1VVVVVVVVXVVXVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVdVXVVVVVVVVVVVVVVVVV11VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVBVVVVVVVVVVVVVVVVVVVX9////////////////X1XVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQAAAAAAAAAAqqqqqqqqmqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlpVVVVVVVWqqqqqqqqqqqqqqqqqqgoAqqqqaqmqqqqqqqqqqqqqqqqqqqqqqqqqqmqBqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlWpqqqqqqqqqqqqqqmqqqqqqqqqqqqqqqqoqqqqqqqqqqqqaqqqqqqqqqqqqqqqqqqqqqqqqqqqqlVVlaqqqqqqqqqqqqqqaqqqqqqqqqqqqqpVVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpVVVVVVVVVVVVVVVVVVVVVqqqqVqqqqqqqqqqqqqqqqqpqVVVVVVVVVVVVVVVVVV9VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVQAAAUFVVVVVVVVUFVVVVVVVVVVVVVVVVVVVVVVVVVVVQVVVVRUUVVVVVVVVVQVVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVBVVVVVVVUAAAAAUFVFFVVVVVVVVVVVVQUAUFVVVVVVFQAAUFVVVaqqqqqqqqpWQFVVVVVVVVVVVVVVFQVQUFVVVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVVAUBBQVVVFVVVVFVVVVVVVVVVVVVVVFVVVVVVVVVVVVVVVQQUVAVRVVVVVVVVVVVVVVBVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFUUVVVVVWqqqqqqqqqqqpVVVUAAAAAAEAVAEG/y8AAC+EMVVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAAAA8KqqWlUAAAAAqqqqqqqqqqpqqqqqqmqqVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFamqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlZVVVVVVVVVVVVVVVVVVQVUVVVVVVVVVVVVVVVVVVVVqmpVVQAAVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUFQFUBQVUAVVVVVVVVVVVVVUAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVBVVVVVVVV1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVVFVVVVVVVVVVVVVVVVVVVVVVVVUBVVVVVVVVVVVVVVVVVVVVVVUFAABUVVVVVVVVVVVVVVUFUFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVVVVVVVVVVVVVVVVVAAAAQFVVVVVVVVVVVVUUVFUVUFVVVVVVVVVVVVVVFUBBVUVVVVVVVVVVVVVVVVVVVVVAVVVVVVVVVVUVAAEAVFVVVVVVVVVVVVVVVVVVFVVVVVBVVVVVVVVVVVVVVVUFAEAFVQEUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVUARVRVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRUVAEBVVVVVVVBVVVVVVVVVVVVVVVVVFURUVVVVVRVVVVUFAFQAVFVVVVVVVVVVVVVVVVVVVVUAAAVEVVVVVVVFVVVVVVVVVVVVVVVVVVVVVVVVVVUUAEQRBFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFQVQVRBUVVVVVVVVUFVVVVVVVVVVVVVVVVVVVVVVVVVVFQBAEVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVEAEFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUBBRAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVAABBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVRUEEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQAFVVRVVVVVVVVVAQBAVVVVVVVVVVVVFQAEQFUVVVUBQAFVVVVVVVVVVVVVAAAAAEBQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQBAABBVVVVVVVVVVVVVVVVVVVVVVVVVVQUAAAAAAAUABEFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUBQEUQAABVVVVVVVVVVVVVVVVVVVVVVVVQEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVUVVVAVVVVVVVVVVVVVVVVBUBVRFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUFQAAAFBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQBUVVVVVVVVVVVVVVVVVVUAQFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVVVFUBVVVVVVVVVVVVVVVVVVVVVVVVVqlRVVVpVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpVVaqqqqqqqqqqqqqqqqqqqqqqqqqqqlpVVVVVVVVVVVVVqqpWVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVqqmqaaqqqqqqqqqqalVVVWVVVVVVVVVVallVVVWqVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlVVVVVVVVVVQQBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQBBq9jAAAt1UAAAAAAAQFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRFQBQAAAABAAQBVVVVVVVVVBVBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUFVFVVVVVVVVVVVVVVVVVVAEGt2cAACwJAFQBBu9nAAAvFBlRVUVVVVVRVVVVVFQABAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVUAQAAAAAAUABAEQFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAEBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAQFVVVVVVVVVVVVVVVVVVV1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVXVVVVVVVVVVVVVVVVVVVVVdf3/f1VVVVVVVVVVVVVVVVVVVVVVVfX///////9uVVVVqqq6qqqqqur6v79VqqpWVV9VVVWqWlVVVVVVVf//////////V1VV/f/f///////////////////////3//////9VVVX/////////////f9X/VVVV/////1dX//////////////////////9/9//////////////////////////////////////////////////////////////X////////////////////X1VV1X////////9VVVVVdVVVVVVVVX1VVVVXVVVVVVVVVVVVVVVVVVVVVVVVVVXV////////////////////////////VVVVVVVVVVVVVVVV//////////////////////9fVVd//VX/VVXVV1X//1dVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX///9VV1VVVVVVVf//////////////f///3/////////////////////////////////////////////////////////////9VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV////V///V1X//////////////9//X1X1////Vf//V1X//1dVqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlpVVVVVVVVVVVmWVWGqpVmqVVVVVVWVVVVVVVVVVZVVVQBBjuDAAAsBAwBBnODAAAvZBlVVVVVVlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFQCWalpaaqoFQKZZlWVVVVVVVVVVVQAAAABVVlVVqVZVVVVVVVVVVVVWVVVVVVVVVVUAAAAAAAAAAFRVVVWVWVlVVWVVVWlVVVVVVVVVVVVVVZVWlWqqqqpVqqpaVVVVWVWqqqpVVVVVZVVVWlVVVVWlZVZVVVWVVVVVVVVVppaalllZZamWqqpmVapVWllVWlZlVVVVaqqlpVpVVVWlqlpVVVlZVVVZVVVVVVWVVVVVVVVVVVVVVVVVVVVVVVVVVVVlVfVVVVVpVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpVqqqqqqqqqqqqVVVVqqqqqqVaVVWaqlpVpaVVWlqllqVaVVVVpVpVlVVVVX1VaVmlVV9VZlVVVVVVVVVVZlX///9VVVWammqaVVVV1VVVVVXVVVWlXVX1VVVVVb1Vr6q6qquqqppVuqr6rrquVV31VVVVVVVVVVdVVVVVWVVVVXfV31VVVVVVVVWlqqpVVVVVVVXVV1VVVVVVVVVVVVVVVVetWlVVVVVVVVVVVaqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqAAAAwKqqWlUAAAAAqqqqqqqqqqpqqqqqqmqqVVVVVVVVVVVVVVVVBVRVVVVVVVVVVVVVVVVVVVWqalVVAABUWaqqalWqqqqqqqqqWqqqqqqqqqqqqqqqqqqqWlWqqqqqqqqquv7/v6qqqqpWVVVVVVVVVVVVVVVVVfX///////9Kc1ZhbHVlKCkAAADAMhAACAAAAMgyEAABAAAAbnVsbCBwb2ludGVyIHBhc3NlZCB0byBydXN0cmVjdXJzaXZlIHVzZSBvZiBhbiBvYmplY3QgZGV0ZWN0ZWQgd2hpY2ggd291bGQgbGVhZCB0byB1bnNhZmUgYWxpYXNpbmcgaW4gcnVzdAAAMwAAAAQAAAAEAAAANAAAADUAAAAHAAAAGgAAAAAAAAABAAAANgAAADcAAAAGAEcJcHJvZHVjZXJzAQxwcm9jZXNzZWQtYnkCBndhbHJ1cwYwLjIwLjMMd2FzbS1iaW5kZ2VuEjAuMi45MiAoMmE0YTQ5MzYyKQ==");

        var loadVt = async (opt = {}) => {
                let {initializeHook} = opt;

                if (initializeHook != null) {
                    await initializeHook(__wbg_init, wasm_code);

                } else {
                    await __wbg_init(wasm_code);
                }

                return exports$1;
            };

class Clock {
  constructor() {
    let speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1.0;
    this.speed = speed;
    this.startTime = performance.now();
  }
  getTime() {
    return this.speed * (performance.now() - this.startTime) / 1000.0;
  }
  setTime(time) {
    this.startTime = performance.now() - time / this.speed * 1000.0;
  }
}
class NullClock {
  constructor() {}
  getTime(_speed) {}
  setTime(_time) {}
}

// Efficient array transformations without intermediate array objects.
// Inspired by Elixir's streams and Rust's iterator adapters.

class Stream {
  constructor(input, xfs) {
    this.input = typeof input.next === "function" ? input : input[Symbol.iterator]();
    this.xfs = xfs ?? [];
  }
  map(f) {
    return this.transform(Map$1(f));
  }
  flatMap(f) {
    return this.transform(FlatMap(f));
  }
  filter(f) {
    return this.transform(Filter(f));
  }
  take(n) {
    return this.transform(Take(n));
  }
  drop(n) {
    return this.transform(Drop(n));
  }
  transform(f) {
    return new Stream(this.input, this.xfs.concat([f]));
  }
  multiplex(other, comparator) {
    return new Stream(new Multiplexer(this[Symbol.iterator](), other[Symbol.iterator](), comparator));
  }
  toArray() {
    return Array.from(this);
  }
  [Symbol.iterator]() {
    let v = 0;
    let values = [];
    let flushed = false;
    const xf = compose(this.xfs, val => values.push(val));
    return {
      next: () => {
        if (v === values.length) {
          values = [];
          v = 0;
        }
        while (values.length === 0) {
          const next = this.input.next();
          if (next.done) {
            break;
          } else {
            xf.step(next.value);
          }
        }
        if (values.length === 0 && !flushed) {
          xf.flush();
          flushed = true;
        }
        if (values.length > 0) {
          return {
            done: false,
            value: values[v++]
          };
        } else {
          return {
            done: true
          };
        }
      }
    };
  }
}
function Map$1(f) {
  return emit => {
    return input => {
      emit(f(input));
    };
  };
}
function FlatMap(f) {
  return emit => {
    return input => {
      f(input).forEach(emit);
    };
  };
}
function Filter(f) {
  return emit => {
    return input => {
      if (f(input)) {
        emit(input);
      }
    };
  };
}
function Take(n) {
  let c = 0;
  return emit => {
    return input => {
      if (c < n) {
        emit(input);
      }
      c += 1;
    };
  };
}
function Drop(n) {
  let c = 0;
  return emit => {
    return input => {
      c += 1;
      if (c > n) {
        emit(input);
      }
    };
  };
}
function compose(xfs, push) {
  return xfs.reverse().reduce((next, curr) => {
    const xf = toXf(curr(next.step));
    return {
      step: xf.step,
      flush: () => {
        xf.flush();
        next.flush();
      }
    };
  }, toXf(push));
}
function toXf(xf) {
  if (typeof xf === "function") {
    return {
      step: xf,
      flush: () => {}
    };
  } else {
    return xf;
  }
}
class Multiplexer {
  constructor(left, right, comparator) {
    this.left = left;
    this.right = right;
    this.comparator = comparator;
  }
  [Symbol.iterator]() {
    let leftItem;
    let rightItem;
    return {
      next: () => {
        if (leftItem === undefined && this.left !== undefined) {
          const result = this.left.next();
          if (result.done) {
            this.left = undefined;
          } else {
            leftItem = result.value;
          }
        }
        if (rightItem === undefined && this.right !== undefined) {
          const result = this.right.next();
          if (result.done) {
            this.right = undefined;
          } else {
            rightItem = result.value;
          }
        }
        if (leftItem === undefined && rightItem === undefined) {
          return {
            done: true
          };
        } else if (leftItem === undefined) {
          const value = rightItem;
          rightItem = undefined;
          return {
            done: false,
            value: value
          };
        } else if (rightItem === undefined) {
          const value = leftItem;
          leftItem = undefined;
          return {
            done: false,
            value: value
          };
        } else if (this.comparator(leftItem, rightItem)) {
          const value = leftItem;
          leftItem = undefined;
          return {
            done: false,
            value: value
          };
        } else {
          const value = rightItem;
          rightItem = undefined;
          return {
            done: false,
            value: value
          };
        }
      }
    };
  }
}

async function parse$2(data) {
  if (data instanceof Response) {
    const text = await data.text();
    const result = parseJsonl(text);
    if (result !== undefined) {
      const {
        header,
        events
      } = result;
      if (header.version === 2) {
        return parseAsciicastV2(header, events);
      } else if (header.version === 3) {
        return parseAsciicastV3(header, events);
      } else {
        throw `asciicast v${header.version} format not supported`;
      }
    } else {
      const header = JSON.parse(text);
      if (header.version === 1) {
        return parseAsciicastV1(header);
      }
    }
  } else if (typeof data === "object" && data.version === 1) {
    return parseAsciicastV1(data);
  } else if (Array.isArray(data)) {
    const header = data[0];
    if (header.version === 2) {
      const events = data.slice(1, data.length);
      return parseAsciicastV2(header, events);
    } else if (header.version === 3) {
      const events = data.slice(1, data.length);
      return parseAsciicastV3(header, events);
    } else {
      throw `asciicast v${header.version} format not supported`;
    }
  }
  throw "invalid data";
}
function parseJsonl(jsonl) {
  const lines = jsonl.split("\n");
  let header;
  try {
    header = JSON.parse(lines[0]);
  } catch (_error) {
    return;
  }
  const events = new Stream(lines).drop(1).filter(l => l[0] === "[").map(JSON.parse);
  return {
    header,
    events
  };
}
function parseAsciicastV1(data) {
  let time = 0;
  const events = new Stream(data.stdout).map(e => {
    time += e[0];
    return [time, "o", e[1]];
  });
  return {
    cols: data.width,
    rows: data.height,
    events
  };
}
function parseAsciicastV2(header, events) {
  return {
    cols: header.width,
    rows: header.height,
    theme: parseTheme$1(header.theme),
    events,
    idleTimeLimit: header.idle_time_limit
  };
}
function parseAsciicastV3(header, events) {
  if (!(events instanceof Stream)) {
    events = new Stream(events);
  }
  let time = 0;
  events = events.map(e => {
    time += e[0];
    return [time, e[1], e[2]];
  });
  return {
    cols: header.term.cols,
    rows: header.term.rows,
    theme: parseTheme$1(header.term?.theme),
    events,
    idleTimeLimit: header.idle_time_limit
  };
}
function parseTheme$1(theme) {
  if (theme === undefined) return;
  const colorRegex = /^#[0-9A-Fa-f]{6}$/;
  const paletteRegex = /^(#[0-9A-Fa-f]{6}:){7,}#[0-9A-Fa-f]{6}$/;
  const fg = theme?.fg;
  const bg = theme?.bg;
  const palette = theme?.palette;
  if (colorRegex.test(fg) && colorRegex.test(bg) && paletteRegex.test(palette)) {
    return {
      foreground: fg,
      background: bg,
      palette: palette.split(":")
    };
  }
}
function unparseAsciicastV2(recording) {
  const header = JSON.stringify({
    version: 2,
    width: recording.cols,
    height: recording.rows
  });
  const events = recording.events.map(JSON.stringify).join("\n");
  return `${header}\n${events}\n`;
}

function recording(src, _ref, _ref2) {
  let {
    feed,
    resize,
    onInput,
    onMarker,
    setState,
    logger
  } = _ref;
  let {
    speed,
    idleTimeLimit,
    startAt,
    loop,
    posterTime,
    markers: markers_,
    pauseOnMarkers,
    cols: initialCols,
    rows: initialRows,
    audioUrl
  } = _ref2;
  let cols;
  let rows;
  let events;
  let markers;
  let duration;
  let effectiveStartAt;
  let eventTimeoutId;
  let nextEventIndex = 0;
  let lastEventTime = 0;
  let startTime;
  let pauseElapsedTime;
  let playCount = 0;
  let waitingForAudio = false;
  let waitingTimeout;
  let shouldResumeOnAudioPlaying = false;
  let now = () => performance.now() * speed;
  let audioCtx;
  let audioElement;
  let audioSeekable = false;
  async function init() {
    const timeout = setTimeout(() => {
      setState("loading");
    }, 3000);
    try {
      let metadata = loadRecording(src, logger, {
        idleTimeLimit,
        startAt,
        markers_
      });
      const hasAudio = await loadAudio(audioUrl);
      metadata = await metadata;
      return {
        ...metadata,
        hasAudio
      };
    } finally {
      clearTimeout(timeout);
    }
  }
  async function loadRecording(src, logger, opts) {
    const {
      parser,
      minFrameTime,
      inputOffset,
      dumpFilename,
      encoding = "utf-8"
    } = src;
    const data = await doFetch(src);
    const recording = prepare(await parser(data, {
      encoding
    }), logger, {
      ...opts,
      minFrameTime,
      inputOffset
    });
    ({
      cols,
      rows,
      events,
      duration,
      effectiveStartAt
    } = recording);
    initialCols = initialCols ?? cols;
    initialRows = initialRows ?? rows;
    if (events.length === 0) {
      throw "recording is missing events";
    }
    if (dumpFilename !== undefined) {
      dump(recording, dumpFilename);
    }
    const poster = posterTime !== undefined ? getPoster(posterTime) : undefined;
    markers = events.filter(e => e[1] === "m").map(e => [e[0], e[2].label]);
    return {
      cols,
      rows,
      duration,
      theme: recording.theme,
      poster,
      markers
    };
  }
  async function loadAudio(audioUrl) {
    if (!audioUrl) return false;
    audioElement = await createAudioElement(audioUrl);
    audioSeekable = audioElement.duration !== NaN && audioElement.duration !== Infinity && audioElement.seekable.length > 0 && audioElement.seekable.end(audioElement.seekable.length - 1) === audioElement.duration;
    if (audioSeekable) {
      audioElement.addEventListener("playing", onAudioPlaying);
      audioElement.addEventListener("waiting", onAudioWaiting);
    } else {
      logger.warn(`audio is not seekable - you must enable range request support on the server providing ${audioElement.src} for audio seeking to work`);
    }
    return true;
  }
  async function doFetch(_ref3) {
    let {
      url,
      data,
      fetchOpts = {}
    } = _ref3;
    if (typeof url === "string") {
      return await doFetchOne(url, fetchOpts);
    } else if (Array.isArray(url)) {
      return await Promise.all(url.map(url => doFetchOne(url, fetchOpts)));
    } else if (data !== undefined) {
      if (typeof data === "function") {
        data = data();
      }
      if (!(data instanceof Promise)) {
        data = Promise.resolve(data);
      }
      const value = await data;
      if (typeof value === "string" || value instanceof ArrayBuffer) {
        return new Response(value);
      } else {
        return value;
      }
    } else {
      throw "failed fetching recording file: url/data missing in src";
    }
  }
  async function doFetchOne(url, fetchOpts) {
    const response = await fetch(url, fetchOpts);
    if (!response.ok) {
      throw `failed fetching recording from ${url}: ${response.status} ${response.statusText}`;
    }
    return response;
  }
  function scheduleNextEvent() {
    const nextEvent = events[nextEventIndex];
    if (nextEvent) {
      eventTimeoutId = scheduleAt(runNextEvent, nextEvent[0]);
    } else {
      onEnd();
    }
  }
  function scheduleAt(f, targetTime) {
    let timeout = (targetTime * 1000 - (now() - startTime)) / speed;
    if (timeout < 0) {
      timeout = 0;
    }
    return setTimeout(f, timeout);
  }
  function runNextEvent() {
    let event = events[nextEventIndex];
    let elapsedWallTime;
    do {
      lastEventTime = event[0];
      nextEventIndex++;
      const stop = executeEvent(event);
      if (stop) {
        return;
      }
      event = events[nextEventIndex];
      elapsedWallTime = now() - startTime;
    } while (event && elapsedWallTime > event[0] * 1000);
    scheduleNextEvent();
  }
  function cancelNextEvent() {
    clearTimeout(eventTimeoutId);
    eventTimeoutId = null;
  }
  function executeEvent(event) {
    const [time, type, data] = event;
    if (type === "o") {
      feed(data);
    } else if (type === "i") {
      onInput(data);
    } else if (type === "r") {
      const [cols, rows] = data.split("x");
      resize(cols, rows);
    } else if (type === "m") {
      onMarker(data);
      if (pauseOnMarkers) {
        pause();
        pauseElapsedTime = time * 1000;
        setState("idle", {
          reason: "paused"
        });
        return true;
      }
    }
    return false;
  }
  function onEnd() {
    cancelNextEvent();
    playCount++;
    if (loop === true || typeof loop === "number" && playCount < loop) {
      nextEventIndex = 0;
      startTime = now();
      feed("\x1bc"); // reset terminal
      resizeTerminalToInitialSize();
      scheduleNextEvent();
      if (audioElement) {
        audioElement.currentTime = 0;
      }
    } else {
      pauseElapsedTime = duration * 1000;
      setState("ended");
      if (audioElement) {
        audioElement.pause();
      }
    }
  }
  async function play() {
    if (eventTimeoutId) throw "already playing";
    if (events[nextEventIndex] === undefined) throw "already ended";
    if (effectiveStartAt !== null) {
      seek(effectiveStartAt);
    }
    await resume();
    return true;
  }
  function pause() {
    shouldResumeOnAudioPlaying = false;
    if (audioElement) {
      audioElement.pause();
    }
    if (!eventTimeoutId) return true;
    cancelNextEvent();
    pauseElapsedTime = now() - startTime;
    return true;
  }
  async function resume() {
    if (audioElement && !audioCtx) setupAudioCtx();
    startTime = now() - pauseElapsedTime;
    pauseElapsedTime = null;
    scheduleNextEvent();
    if (audioElement) {
      await audioElement.play();
    }
  }
  async function seek(where) {
    if (waitingForAudio) {
      return false;
    }
    const isPlaying = !!eventTimeoutId;
    pause();
    if (audioElement) {
      audioElement.pause();
    }
    const currentTime = (pauseElapsedTime ?? 0) / 1000;
    if (typeof where === "string") {
      if (where === "<<") {
        where = currentTime - 5;
      } else if (where === ">>") {
        where = currentTime + 5;
      } else if (where === "<<<") {
        where = currentTime - 0.1 * duration;
      } else if (where === ">>>") {
        where = currentTime + 0.1 * duration;
      } else if (where[where.length - 1] === "%") {
        where = parseFloat(where.substring(0, where.length - 1)) / 100 * duration;
      }
    } else if (typeof where === "object") {
      if (where.marker === "prev") {
        where = findMarkerTimeBefore(currentTime) ?? 0;
        if (isPlaying && currentTime - where < 1) {
          where = findMarkerTimeBefore(where) ?? 0;
        }
      } else if (where.marker === "next") {
        where = findMarkerTimeAfter(currentTime) ?? duration;
      } else if (typeof where.marker === "number") {
        const marker = markers[where.marker];
        if (marker === undefined) {
          throw `invalid marker index: ${where.marker}`;
        } else {
          where = marker[0];
        }
      }
    }
    const targetTime = Math.min(Math.max(where, 0), duration);
    if (targetTime < lastEventTime) {
      feed("\x1bc"); // reset terminal
      resizeTerminalToInitialSize();
      nextEventIndex = 0;
      lastEventTime = 0;
    }
    let event = events[nextEventIndex];
    while (event && event[0] <= targetTime) {
      if (event[1] === "o" || event[1] === "r") {
        executeEvent(event);
      }
      lastEventTime = event[0];
      event = events[++nextEventIndex];
    }
    pauseElapsedTime = targetTime * 1000;
    effectiveStartAt = null;
    if (audioElement && audioSeekable) {
      audioElement.currentTime = targetTime / speed;
    }
    if (isPlaying) {
      await resume();
    }
    return true;
  }
  function findMarkerTimeBefore(time) {
    if (markers.length == 0) return;
    let i = 0;
    let marker = markers[i];
    let lastMarkerTimeBefore;
    while (marker && marker[0] < time) {
      lastMarkerTimeBefore = marker[0];
      marker = markers[++i];
    }
    return lastMarkerTimeBefore;
  }
  function findMarkerTimeAfter(time) {
    if (markers.length == 0) return;
    let i = markers.length - 1;
    let marker = markers[i];
    let firstMarkerTimeAfter;
    while (marker && marker[0] > time) {
      firstMarkerTimeAfter = marker[0];
      marker = markers[--i];
    }
    return firstMarkerTimeAfter;
  }
  function step(n) {
    if (n === undefined) {
      n = 1;
    }
    let nextEvent;
    let targetIndex;
    if (n > 0) {
      let index = nextEventIndex;
      nextEvent = events[index];
      for (let i = 0; i < n; i++) {
        while (nextEvent !== undefined && nextEvent[1] !== "o") {
          nextEvent = events[++index];
        }
        if (nextEvent !== undefined && nextEvent[1] === "o") {
          targetIndex = index;
        }
      }
    } else {
      let index = Math.max(nextEventIndex - 2, 0);
      nextEvent = events[index];
      for (let i = n; i < 0; i++) {
        while (nextEvent !== undefined && nextEvent[1] !== "o") {
          nextEvent = events[--index];
        }
        if (nextEvent !== undefined && nextEvent[1] === "o") {
          targetIndex = index;
        }
      }
      if (targetIndex !== undefined) {
        feed("\x1bc"); // reset terminal
        resizeTerminalToInitialSize();
        nextEventIndex = 0;
      }
    }
    if (targetIndex === undefined) return;
    while (nextEventIndex <= targetIndex) {
      nextEvent = events[nextEventIndex++];
      if (nextEvent[1] === "o" || nextEvent[1] === "r") {
        executeEvent(nextEvent);
      }
    }
    lastEventTime = nextEvent[0];
    pauseElapsedTime = lastEventTime * 1000;
    effectiveStartAt = null;
    if (audioElement && audioSeekable) {
      audioElement.currentTime = lastEventTime / speed;
    }
    if (events[targetIndex + 1] === undefined) {
      onEnd();
    }
  }
  async function restart() {
    if (eventTimeoutId) throw "still playing";
    if (events[nextEventIndex] !== undefined) throw "not ended";
    seek(0);
    await resume();
    return true;
  }
  function getPoster(time) {
    return events.filter(e => e[0] < time && e[1] === "o").map(e => e[2]);
  }
  function getCurrentTime() {
    if (eventTimeoutId) {
      return (now() - startTime) / 1000;
    } else {
      return (pauseElapsedTime ?? 0) / 1000;
    }
  }
  function resizeTerminalToInitialSize() {
    resize(initialCols, initialRows);
  }
  function setupAudioCtx() {
    audioCtx = new AudioContext({
      latencyHint: "interactive"
    });
    const src = audioCtx.createMediaElementSource(audioElement);
    src.connect(audioCtx.destination);
    now = audioNow;
  }
  function audioNow() {
    if (!audioCtx) throw "audio context not started - can't tell time!";
    const {
      contextTime,
      performanceTime
    } = audioCtx.getOutputTimestamp();

    // The check below is needed for Chrome,
    // which returns 0 for first several dozen millis,
    // completely ruining the timing (the clock jumps backwards once),
    // therefore we initially ignore performanceTime in our calculation.

    return performanceTime === 0 ? contextTime * 1000 : contextTime * 1000 + (performance.now() - performanceTime);
  }
  function onAudioWaiting() {
    logger.debug("audio buffering");
    waitingForAudio = true;
    shouldResumeOnAudioPlaying = !!eventTimeoutId;
    waitingTimeout = setTimeout(() => setState("loading"), 1000);
    if (!eventTimeoutId) return true;
    logger.debug("pausing session playback");
    cancelNextEvent();
    pauseElapsedTime = now() - startTime;
  }
  function onAudioPlaying() {
    logger.debug("audio resumed");
    clearTimeout(waitingTimeout);
    setState("playing");
    if (!waitingForAudio) return;
    waitingForAudio = false;
    if (shouldResumeOnAudioPlaying) {
      logger.debug("resuming session playback");
      startTime = now() - pauseElapsedTime;
      pauseElapsedTime = null;
      scheduleNextEvent();
    }
  }
  function mute() {
    if (audioElement) {
      audioElement.muted = true;
      return true;
    }
  }
  function unmute() {
    if (audioElement) {
      audioElement.muted = false;
      return true;
    }
  }
  return {
    init,
    play,
    pause,
    seek,
    step,
    restart,
    stop: pause,
    mute,
    unmute,
    getCurrentTime
  };
}
function batcher(logger) {
  let minFrameTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.0 / 60;
  let prevEvent;
  return emit => {
    let ic = 0;
    let oc = 0;
    return {
      step: event => {
        ic++;
        if (prevEvent === undefined) {
          prevEvent = event;
          return;
        }
        if (event[1] === "o" && prevEvent[1] === "o" && event[0] - prevEvent[0] < minFrameTime) {
          prevEvent[2] += event[2];
        } else {
          emit(prevEvent);
          prevEvent = event;
          oc++;
        }
      },
      flush: () => {
        if (prevEvent !== undefined) {
          emit(prevEvent);
          oc++;
        }
        logger.debug(`batched ${ic} frames to ${oc} frames`);
      }
    };
  };
}
function prepare(recording, logger, _ref4) {
  let {
    startAt = 0,
    idleTimeLimit,
    minFrameTime,
    inputOffset,
    markers_
  } = _ref4;
  let {
    events
  } = recording;
  if (!(events instanceof Stream)) {
    events = new Stream(events);
  }
  idleTimeLimit = idleTimeLimit ?? recording.idleTimeLimit ?? Infinity;
  const limiterOutput = {
    offset: 0
  };
  events = events.transform(batcher(logger, minFrameTime)).map(timeLimiter(idleTimeLimit, startAt, limiterOutput)).map(markerWrapper());
  if (markers_ !== undefined) {
    markers_ = new Stream(markers_).map(normalizeMarker);
    events = events.filter(e => e[1] !== "m").multiplex(markers_, (a, b) => a[0] < b[0]).map(markerWrapper());
  }
  events = events.toArray();
  if (inputOffset !== undefined) {
    events = events.map(e => e[1] === "i" ? [e[0] + inputOffset, e[1], e[2]] : e);
    events.sort((a, b) => a[0] - b[0]);
  }
  const duration = events[events.length - 1][0];
  const effectiveStartAt = startAt - limiterOutput.offset;
  return {
    ...recording,
    events,
    duration,
    effectiveStartAt
  };
}
function normalizeMarker(m) {
  return typeof m === "number" ? [m, "m", ""] : [m[0], "m", m[1]];
}
function timeLimiter(idleTimeLimit, startAt, output) {
  let prevT = 0;
  let shift = 0;
  return function (e) {
    const delay = e[0] - prevT;
    const delta = delay - idleTimeLimit;
    prevT = e[0];
    if (delta > 0) {
      shift += delta;
      if (e[0] < startAt) {
        output.offset += delta;
      }
    }
    return [e[0] - shift, e[1], e[2]];
  };
}
function markerWrapper() {
  let i = 0;
  return function (e) {
    if (e[1] === "m") {
      return [e[0], e[1], {
        index: i++,
        time: e[0],
        label: e[2]
      }];
    } else {
      return e;
    }
  };
}
function dump(recording, filename) {
  const link = document.createElement("a");
  const events = recording.events.map(e => e[1] === "m" ? [e[0], e[1], e[2].label] : e);
  const asciicast = unparseAsciicastV2({
    ...recording,
    events
  });
  link.href = URL.createObjectURL(new Blob([asciicast], {
    type: "text/plain"
  }));
  link.download = filename;
  link.click();
}
async function createAudioElement(src) {
  const audio = new Audio();
  audio.preload = "none";
  audio.loop = false;
  audio.crossOrigin = "anonymous";
  audio.src = src;
  let resolve;
  const canPlay = new Promise(resolve_ => {
    resolve = resolve_;
  });
  function onCanPlay() {
    resolve();
    audio.removeEventListener("canplay", onCanPlay);
  }
  audio.addEventListener("canplay", onCanPlay);
  audio.load();
  await canPlay;
  return audio;
}

function clock(_ref, _ref2, _ref3) {
  let {
    hourColor = 3,
    minuteColor = 4,
    separatorColor = 9
  } = _ref;
  let {
    feed
  } = _ref2;
  let {
    cols = 5,
    rows = 1
  } = _ref3;
  const middleRow = Math.floor(rows / 2);
  const leftPad = Math.floor(cols / 2) - 2;
  const setupCursor = `\x1b[?25l\x1b[1m\x1b[${middleRow}B`;
  let intervalId;
  const getCurrentTime = () => {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    const seqs = [];
    seqs.push("\r");
    for (let i = 0; i < leftPad; i++) {
      seqs.push(" ");
    }
    seqs.push(`\x1b[3${hourColor}m`);
    if (h < 10) {
      seqs.push("0");
    }
    seqs.push(`${h}`);
    seqs.push(`\x1b[3${separatorColor};5m:\x1b[25m`);
    seqs.push(`\x1b[3${minuteColor}m`);
    if (m < 10) {
      seqs.push("0");
    }
    seqs.push(`${m}`);
    return seqs;
  };
  const updateTime = () => {
    getCurrentTime().forEach(feed);
  };
  return {
    init: () => {
      const duration = 24 * 60;
      const poster = [setupCursor].concat(getCurrentTime());
      return {
        cols,
        rows,
        duration,
        poster
      };
    },
    play: () => {
      feed(setupCursor);
      updateTime();
      intervalId = setInterval(updateTime, 1000);
      return true;
    },
    stop: () => {
      clearInterval(intervalId);
    },
    getCurrentTime: () => {
      const d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    }
  };
}

function random(src, _ref, _ref2) {
  let {
    feed
  } = _ref;
  let {
    speed
  } = _ref2;
  const base = " ".charCodeAt(0);
  const range = "~".charCodeAt(0) - base;
  let timeoutId;
  const schedule = () => {
    const t = Math.pow(5, Math.random() * 4);
    timeoutId = setTimeout(print, t / speed);
  };
  const print = () => {
    schedule();
    const char = String.fromCharCode(base + Math.floor(Math.random() * range));
    feed(char);
  };
  return () => {
    schedule();
    return () => clearInterval(timeoutId);
  };
}

function benchmark(_ref, _ref2) {
  let {
    url,
    iterations = 10
  } = _ref;
  let {
    feed,
    setState
  } = _ref2;
  let data;
  let byteCount = 0;
  return {
    async init() {
      const recording = await parse$2(await fetch(url));
      const {
        cols,
        rows,
        events
      } = recording;
      data = Array.from(events).filter(_ref3 => {
        let [_time, type, _text] = _ref3;
        return type === "o";
      }).map(_ref4 => {
        let [time, _type, text] = _ref4;
        return [time, text];
      });
      const duration = data[data.length - 1][0];
      for (const [_, text] of data) {
        byteCount += new Blob([text]).size;
      }
      return {
        cols,
        rows,
        duration
      };
    },
    play() {
      const startTime = performance.now();
      for (let i = 0; i < iterations; i++) {
        for (const [_, text] of data) {
          feed(text);
        }
        feed("\x1bc"); // reset terminal
      }

      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000;
      const throughput = byteCount * iterations / duration;
      const throughputMbs = byteCount / (1024 * 1024) * iterations / duration;
      console.info("benchmark: result", {
        byteCount,
        iterations,
        duration,
        throughput,
        throughputMbs
      });
      setTimeout(() => {
        setState("stopped", {
          reason: "ended"
        });
      }, 0);
      return true;
    }
  };
}

class Queue {
  constructor() {
    this.items = [];
    this.onPush = undefined;
  }
  push(item) {
    this.items.push(item);
    if (this.onPush !== undefined) {
      this.onPush(this.popAll());
      this.onPush = undefined;
    }
  }
  popAll() {
    if (this.items.length > 0) {
      const items = this.items;
      this.items = [];
      return items;
    } else {
      const thiz = this;
      return new Promise(resolve => {
        thiz.onPush = resolve;
      });
    }
  }
}

function getBuffer(bufferTime, feed, resize, onInput, onMarker, setTime, baseStreamTime, minFrameTime, logger) {
  const execute = executeEvent(feed, resize, onInput, onMarker);
  if (bufferTime === 0) {
    logger.debug("using no buffer");
    return nullBuffer(execute);
  } else {
    bufferTime = bufferTime ?? {};
    let getBufferTime;
    if (typeof bufferTime === "number") {
      logger.debug(`using fixed time buffer (${bufferTime} ms)`);
      getBufferTime = _latency => bufferTime;
    } else if (typeof bufferTime === "function") {
      logger.debug("using custom dynamic buffer");
      getBufferTime = bufferTime({
        logger
      });
    } else {
      logger.debug("using adaptive buffer", bufferTime);
      getBufferTime = adaptiveBufferTimeProvider({
        logger
      }, bufferTime);
    }
    return buffer(getBufferTime, execute, setTime, logger, baseStreamTime ?? 0.0, minFrameTime);
  }
}
function nullBuffer(execute) {
  return {
    pushEvent(event) {
      execute(event[1], event[2]);
    },
    pushText(text) {
      execute("o", text);
    },
    stop() {}
  };
}
function executeEvent(feed, resize, onInput, onMarker) {
  return function (code, data) {
    if (code === "o") {
      feed(data);
    } else if (code === "i") {
      onInput(data);
    } else if (code === "r") {
      resize(data.cols, data.rows);
    } else if (code === "m") {
      onMarker(data);
    }
  };
}
function buffer(getBufferTime, execute, setTime, logger, baseStreamTime) {
  let minFrameTime = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1.0 / 60;
  let epoch = performance.now() - baseStreamTime * 1000;
  let bufferTime = getBufferTime(0);
  const queue = new Queue();
  minFrameTime *= 1000;
  let prevElapsedStreamTime = -minFrameTime;
  let stop = false;
  function elapsedWallTime() {
    return performance.now() - epoch;
  }
  setTimeout(async () => {
    while (!stop) {
      const events = await queue.popAll();
      if (stop) return;
      for (const event of events) {
        const elapsedStreamTime = event[0] * 1000 + bufferTime;
        if (elapsedStreamTime - prevElapsedStreamTime < minFrameTime) {
          execute(event[1], event[2]);
          continue;
        }
        const delay = elapsedStreamTime - elapsedWallTime();
        if (delay > 0) {
          await sleep(delay);
          if (stop) return;
        }
        setTime(event[0]);
        execute(event[1], event[2]);
        prevElapsedStreamTime = elapsedStreamTime;
      }
    }
  }, 0);
  return {
    pushEvent(event) {
      let latency = elapsedWallTime() - event[0] * 1000;
      if (latency < 0) {
        logger.debug(`correcting epoch by ${latency} ms`);
        epoch += latency;
        latency = 0;
      }
      bufferTime = getBufferTime(latency);
      queue.push(event);
    },
    pushText(text) {
      queue.push([elapsedWallTime() / 1000, "o", text]);
    },
    stop() {
      stop = true;
      queue.push(undefined);
    }
  };
}
function sleep(t) {
  return new Promise(resolve => {
    setTimeout(resolve, t);
  });
}
function adaptiveBufferTimeProvider(_ref, _ref2) {
  let {
    logger
  } = _ref;
  let {
    minTime = 25,
    maxLevel = 100,
    interval = 50,
    windowSize = 20,
    smoothingFactor = 0.2,
    minImprovementDuration = 1000
  } = _ref2;
  let bufferLevel = 0;
  let bufferTime = calcBufferTime(bufferLevel);
  let latencies = [];
  let maxJitter = 0;
  let jitterRange = 0;
  let improvementTs = null;
  function calcBufferTime(level) {
    if (level === 0) {
      return minTime;
    } else {
      return interval * level;
    }
  }
  return latency => {
    latencies.push(latency);
    if (latencies.length < windowSize) {
      return bufferTime;
    }
    latencies = latencies.slice(-windowSize);
    const currentMinJitter = min(latencies);
    const currentMaxJitter = max(latencies);
    const currentJitterRange = currentMaxJitter - currentMinJitter;
    maxJitter = currentMaxJitter * smoothingFactor + maxJitter * (1 - smoothingFactor);
    jitterRange = currentJitterRange * smoothingFactor + jitterRange * (1 - smoothingFactor);
    const minBufferTime = maxJitter + jitterRange;
    if (latency > bufferTime) {
      logger.debug('buffer underrun', {
        latency,
        maxJitter,
        jitterRange,
        bufferTime
      });
    }
    if (bufferLevel < maxLevel && minBufferTime > bufferTime) {
      bufferTime = calcBufferTime(bufferLevel += 1);
      logger.debug(`jitter increased, raising bufferTime`, {
        latency,
        maxJitter,
        jitterRange,
        bufferTime
      });
    } else if (bufferLevel > 1 && minBufferTime < calcBufferTime(bufferLevel - 2) || bufferLevel == 1 && minBufferTime < calcBufferTime(bufferLevel - 1)) {
      if (improvementTs === null) {
        improvementTs = performance.now();
      } else if (performance.now() - improvementTs > minImprovementDuration) {
        improvementTs = performance.now();
        bufferTime = calcBufferTime(bufferLevel -= 1);
        logger.debug(`jitter decreased, lowering bufferTime`, {
          latency,
          maxJitter,
          jitterRange,
          bufferTime
        });
      }
      return bufferTime;
    }
    improvementTs = null;
    return bufferTime;
  };
}
function min(numbers) {
  return numbers.reduce((prev, cur) => cur < prev ? cur : prev);
}
function max(numbers) {
  return numbers.reduce((prev, cur) => cur > prev ? cur : prev);
}

const ONE_SEC_IN_USEC = 1000000;
function alisHandler(logger) {
  const outputDecoder = new TextDecoder();
  const inputDecoder = new TextDecoder();
  let handler = parseMagicString;
  let lastEventTime;
  let markerIndex = 0;
  function parseMagicString(buffer) {
    const text = new TextDecoder().decode(buffer);
    if (text === "ALiS\x01") {
      handler = parseFirstFrame;
    } else {
      throw "not an ALiS v1 live stream";
    }
  }
  function parseFirstFrame(buffer) {
    const view = new BinaryReader(new DataView(buffer));
    const type = view.getUint8();
    if (type !== 0x01) throw `expected reset (0x01) frame, got ${type}`;
    return parseResetFrame(view, buffer);
  }
  function parseResetFrame(view, buffer) {
    view.decodeVarUint();
    let time = view.decodeVarUint();
    lastEventTime = time;
    time = time / ONE_SEC_IN_USEC;
    markerIndex = 0;
    const cols = view.decodeVarUint();
    const rows = view.decodeVarUint();
    const themeFormat = view.getUint8();
    let theme;
    if (themeFormat === 8) {
      const len = (2 + 8) * 3;
      theme = parseTheme(new Uint8Array(buffer, view.offset, len));
      view.forward(len);
    } else if (themeFormat === 16) {
      const len = (2 + 16) * 3;
      theme = parseTheme(new Uint8Array(buffer, view.offset, len));
      view.forward(len);
    } else if (themeFormat !== 0) {
      throw `alis: invalid theme format (${themeFormat})`;
    }
    const initLen = view.decodeVarUint();
    let init;
    if (initLen > 0) {
      init = outputDecoder.decode(new Uint8Array(buffer, view.offset, initLen));
    }
    handler = parseFrame;
    return {
      time,
      term: {
        size: {
          cols,
          rows
        },
        theme,
        init
      }
    };
  }
  function parseFrame(buffer) {
    const view = new BinaryReader(new DataView(buffer));
    const type = view.getUint8();
    if (type === 0x01) {
      return parseResetFrame(view, buffer);
    } else if (type === 0x6f) {
      return parseOutputFrame(view, buffer);
    } else if (type === 0x69) {
      return parseInputFrame(view, buffer);
    } else if (type === 0x72) {
      return parseResizeFrame(view);
    } else if (type === 0x6d) {
      return parseMarkerFrame(view, buffer);
    } else if (type === 0x04) {
      // EOT
      handler = parseFirstFrame;
      return false;
    } else {
      logger.debug(`alis: unknown frame type: ${type}`);
    }
  }
  function parseOutputFrame(view, buffer) {
    view.decodeVarUint();
    const relTime = view.decodeVarUint();
    lastEventTime += relTime;
    const len = view.decodeVarUint();
    const text = outputDecoder.decode(new Uint8Array(buffer, view.offset, len));
    return [lastEventTime / ONE_SEC_IN_USEC, "o", text];
  }
  function parseInputFrame(view, buffer) {
    view.decodeVarUint();
    const relTime = view.decodeVarUint();
    lastEventTime += relTime;
    const len = view.decodeVarUint();
    const text = inputDecoder.decode(new Uint8Array(buffer, view.offset, len));
    return [lastEventTime / ONE_SEC_IN_USEC, "i", text];
  }
  function parseResizeFrame(view) {
    view.decodeVarUint();
    const relTime = view.decodeVarUint();
    lastEventTime += relTime;
    const cols = view.decodeVarUint();
    const rows = view.decodeVarUint();
    return [lastEventTime / ONE_SEC_IN_USEC, "r", {
      cols,
      rows
    }];
  }
  function parseMarkerFrame(view, buffer) {
    view.decodeVarUint();
    const relTime = view.decodeVarUint();
    lastEventTime += relTime;
    const len = view.decodeVarUint();
    const decoder = new TextDecoder();
    const index = markerIndex++;
    const time = lastEventTime / ONE_SEC_IN_USEC;
    const label = decoder.decode(new Uint8Array(buffer, view.offset, len));
    return [time, "m", {
      index,
      time,
      label
    }];
  }
  return function (buffer) {
    return handler(buffer);
  };
}
function parseTheme(arr) {
  const colorCount = arr.length / 3;
  const foreground = hexColor(arr[0], arr[1], arr[2]);
  const background = hexColor(arr[3], arr[4], arr[5]);
  const palette = [];
  for (let i = 2; i < colorCount; i++) {
    palette.push(hexColor(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]));
  }
  return {
    foreground,
    background,
    palette
  };
}
function hexColor(r, g, b) {
  return `#${byteToHex(r)}${byteToHex(g)}${byteToHex(b)}`;
}
function byteToHex(value) {
  return value.toString(16).padStart(2, "0");
}
class BinaryReader {
  constructor(inner) {
    let offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    this.inner = inner;
    this.offset = offset;
  }
  forward(delta) {
    this.offset += delta;
  }
  getUint8() {
    const value = this.inner.getUint8(this.offset);
    this.offset += 1;
    return value;
  }
  decodeVarUint() {
    let number = BigInt(0);
    let shift = BigInt(0);
    let byte = this.getUint8();
    while (byte > 127) {
      byte &= 127;
      number += BigInt(byte) << shift;
      shift += BigInt(7);
      byte = this.getUint8();
    }
    number = number + (BigInt(byte) << shift);
    return Number(number);
  }
}

function ascicastV2Handler() {
  let parse = parseHeader;
  function parseHeader(buffer) {
    const header = JSON.parse(buffer);
    if (header.version !== 2) {
      throw "not an asciicast v2 stream";
    }
    parse = parseEvent;
    return {
      time: 0.0,
      term: {
        size: {
          cols: header.width,
          rows: header.height
        }
      }
    };
  }
  function parseEvent(buffer) {
    const event = JSON.parse(buffer);
    if (event[1] === "r") {
      const [cols, rows] = event[2].split("x");
      return [event[0], "r", {
        cols: parseInt(cols, 10),
        rows: parseInt(rows, 10)
      }];
    } else {
      return event;
    }
  }
  return function (buffer) {
    return parse(buffer);
  };
}

function ascicastV3Handler() {
  let parse = parseHeader;
  let currentTime = 0;
  function parseHeader(buffer) {
    const header = JSON.parse(buffer);
    if (header.version !== 3) {
      throw "not an asciicast v3 stream";
    }
    parse = parseEvent;
    const term = {
      size: {
        cols: header.term.cols,
        rows: header.term.rows
      }
    };
    if (header.term.theme) {
      term.theme = {
        foreground: header.term.theme.fg,
        background: header.term.theme.bg,
        palette: header.term.theme.palette.split(":")
      };
    }
    return {
      time: 0.0,
      term
    };
  }
  function parseEvent(buffer) {
    const event = JSON.parse(buffer);
    const [interval, eventType, data] = event;
    currentTime += interval;
    if (eventType === "r") {
      const [cols, rows] = data.split("x");
      return [currentTime, "r", {
        cols: parseInt(cols, 10),
        rows: parseInt(rows, 10)
      }];
    } else {
      return [currentTime, eventType, data];
    }
  }
  return function (buffer) {
    return parse(buffer);
  };
}

function rawHandler() {
  const outputDecoder = new TextDecoder();
  let parse = parseSize;
  function parseSize(buffer) {
    const text = outputDecoder.decode(buffer, {
      stream: true
    });
    const [cols, rows] = sizeFromResizeSeq(text) ?? sizeFromScriptStartMessage(text) ?? [80, 24];
    parse = parseOutput;
    return {
      time: 0.0,
      term: {
        size: {
          cols,
          rows
        },
        init: text
      }
    };
  }
  function parseOutput(buffer) {
    return outputDecoder.decode(buffer, {
      stream: true
    });
  }
  return function (buffer) {
    return parse(buffer);
  };
}
function sizeFromResizeSeq(text) {
  const match = text.match(/\x1b\[8;(\d+);(\d+)t/);
  if (match !== null) {
    return [parseInt(match[2], 10), parseInt(match[1], 10)];
  }
}
function sizeFromScriptStartMessage(text) {
  const match = text.match(/\[.*COLUMNS="(\d{1,3})" LINES="(\d{1,3})".*\]/);
  if (match !== null) {
    return [parseInt(match[1], 10), parseInt(match[2], 10)];
  }
}

const RECONNECT_DELAY_BASE = 500;
const RECONNECT_DELAY_CAP = 10000;
function exponentialDelay(attempt) {
  const base = Math.min(RECONNECT_DELAY_BASE * Math.pow(2, attempt), RECONNECT_DELAY_CAP);
  return Math.random() * base;
}
function websocket(_ref, _ref2) {
  let {
    url,
    bufferTime,
    reconnectDelay = exponentialDelay,
    minFrameTime
  } = _ref;
  let {
    feed,
    reset,
    resize,
    onInput,
    onMarker,
    setState,
    logger
  } = _ref2;
  logger = new PrefixedLogger(logger, "websocket: ");
  let socket;
  let buf;
  let clock = new NullClock();
  let reconnectAttempt = 0;
  let successfulConnectionTimeout;
  let stop = false;
  let wasOnline = false;
  let initTimeout;
  function connect() {
    socket = new WebSocket(url, ["v1.alis", "v2.asciicast", "v3.asciicast", "raw"]);
    socket.binaryType = "arraybuffer";
    socket.onopen = () => {
      const proto = socket.protocol || "raw";
      logger.info("opened");
      logger.info(`activating ${proto} protocol handler`);
      if (proto === "v1.alis") {
        socket.onmessage = onMessage(alisHandler(logger));
      } else if (proto === "v2.asciicast") {
        socket.onmessage = onMessage(ascicastV2Handler());
      } else if (proto === "v3.asciicast") {
        socket.onmessage = onMessage(ascicastV3Handler());
      } else if (proto === "raw") {
        socket.onmessage = onMessage(rawHandler());
      }
      successfulConnectionTimeout = setTimeout(() => {
        reconnectAttempt = 0;
      }, 1000);
    };
    socket.onclose = event => {
      clearTimeout(initTimeout);
      stopBuffer();
      if (stop || event.code === 1000 || event.code === 1005) {
        logger.info("closed");
        setState("ended", {
          message: "Stream ended"
        });
      } else if (event.code === 1002) {
        logger.debug(`close reason: ${event.reason}`);
        setState("ended", {
          message: "Err: Player not compatible with the server"
        });
      } else {
        clearTimeout(successfulConnectionTimeout);
        const delay = reconnectDelay(reconnectAttempt++);
        logger.info(`unclean close, reconnecting in ${delay}...`);
        setState("loading");
        setTimeout(connect, delay);
      }
    };
    wasOnline = false;
  }
  function onMessage(handler) {
    initTimeout = setTimeout(onStreamEnd, 5000);
    return function (event) {
      try {
        const result = handler(event.data);
        if (buf) {
          if (Array.isArray(result)) {
            buf.pushEvent(result);
          } else if (typeof result === "string") {
            buf.pushText(result);
          } else if (typeof result === "object" && !Array.isArray(result)) {
            // TODO: check last event ID from the parser, don't reset if we didn't miss anything
            onStreamReset(result);
          } else if (result === false) {
            // EOT
            onStreamEnd();
          } else if (result !== undefined) {
            throw `unexpected value from protocol handler: ${result}`;
          }
        } else {
          if (typeof result === "object" && !Array.isArray(result)) {
            onStreamReset(result);
            clearTimeout(initTimeout);
          } else if (result === undefined) {
            clearTimeout(initTimeout);
            initTimeout = setTimeout(onStreamEnd, 1000);
          } else {
            clearTimeout(initTimeout);
            throw `unexpected value from protocol handler: ${result}`;
          }
        }
      } catch (e) {
        socket.close();
        throw e;
      }
    };
  }
  function onStreamReset(_ref3) {
    let {
      time,
      term
    } = _ref3;
    const {
      size,
      init,
      theme
    } = term;
    const {
      cols,
      rows
    } = size;
    logger.info(`stream reset (${cols}x${rows} @${time})`);
    setState("playing");
    stopBuffer();
    buf = getBuffer(bufferTime, feed, resize, onInput, onMarker, t => clock.setTime(t), time, minFrameTime, logger);
    reset(cols, rows, init, theme);
    clock = new Clock();
    wasOnline = true;
    if (typeof time === "number") {
      clock.setTime(time);
    }
  }
  function onStreamEnd() {
    stopBuffer();
    if (wasOnline) {
      logger.info("stream ended");
      setState("offline", {
        message: "Stream ended"
      });
    } else {
      logger.info("stream offline");
      setState("offline", {
        message: "Stream offline"
      });
    }
    clock = new NullClock();
  }
  function stopBuffer() {
    if (buf) buf.stop();
    buf = null;
  }
  return {
    play: () => {
      connect();
    },
    stop: () => {
      stop = true;
      stopBuffer();
      if (socket !== undefined) socket.close();
    },
    getCurrentTime: () => clock.getTime()
  };
}

function eventsource(_ref, _ref2) {
  let {
    url,
    bufferTime,
    minFrameTime
  } = _ref;
  let {
    feed,
    reset,
    resize,
    onInput,
    onMarker,
    setState,
    logger
  } = _ref2;
  logger = new PrefixedLogger(logger, "eventsource: ");
  let es;
  let buf;
  let clock = new NullClock();
  function initBuffer(baseStreamTime) {
    if (buf !== undefined) buf.stop();
    buf = getBuffer(bufferTime, feed, resize, onInput, onMarker, t => clock.setTime(t), baseStreamTime, minFrameTime, logger);
  }
  return {
    play: () => {
      es = new EventSource(url);
      es.addEventListener("open", () => {
        logger.info("opened");
        initBuffer();
      });
      es.addEventListener("error", e => {
        logger.info("errored");
        logger.debug({
          e
        });
        setState("loading");
      });
      es.addEventListener("message", event => {
        const e = JSON.parse(event.data);
        if (Array.isArray(e)) {
          buf.pushEvent(e);
        } else if (e.cols !== undefined || e.width !== undefined) {
          const cols = e.cols ?? e.width;
          const rows = e.rows ?? e.height;
          logger.debug(`vt reset (${cols}x${rows})`);
          setState("playing");
          initBuffer(e.time);
          reset(cols, rows, e.init ?? undefined);
          clock = new Clock();
          if (typeof e.time === "number") {
            clock.setTime(e.time);
          }
        } else if (e.state === "offline") {
          logger.info("stream offline");
          setState("offline", {
            message: "Stream offline"
          });
          clock = new NullClock();
        }
      });
      es.addEventListener("done", () => {
        logger.info("closed");
        es.close();
        setState("ended", {
          message: "Stream ended"
        });
      });
    },
    stop: () => {
      if (buf !== undefined) buf.stop();
      if (es !== undefined) es.close();
    },
    getCurrentTime: () => clock.getTime()
  };
}

async function parse$1(responses, _ref) {
  let {
    encoding
  } = _ref;
  const textDecoder = new TextDecoder(encoding);
  let cols;
  let rows;
  let timing = (await responses[0].text()).split("\n").filter(line => line.length > 0).map(line => line.split(" "));
  if (timing[0].length < 3) {
    timing = timing.map(entry => ["O", entry[0], entry[1]]);
  }
  const buffer = await responses[1].arrayBuffer();
  const array = new Uint8Array(buffer);
  const dataOffset = array.findIndex(byte => byte == 0x0a) + 1;
  const header = textDecoder.decode(array.subarray(0, dataOffset));
  const sizeMatch = header.match(/COLUMNS="(\d+)" LINES="(\d+)"/);
  if (sizeMatch !== null) {
    cols = parseInt(sizeMatch[1], 10);
    rows = parseInt(sizeMatch[2], 10);
  }
  const stdout = {
    array,
    cursor: dataOffset
  };
  let stdin = stdout;
  if (responses[2] !== undefined) {
    const buffer = await responses[2].arrayBuffer();
    const array = new Uint8Array(buffer);
    stdin = {
      array,
      cursor: dataOffset
    };
  }
  const events = [];
  let time = 0;
  for (const entry of timing) {
    time += parseFloat(entry[1]);
    if (entry[0] === "O") {
      const count = parseInt(entry[2], 10);
      const bytes = stdout.array.subarray(stdout.cursor, stdout.cursor + count);
      const text = textDecoder.decode(bytes);
      events.push([time, "o", text]);
      stdout.cursor += count;
    } else if (entry[0] === "I") {
      const count = parseInt(entry[2], 10);
      const bytes = stdin.array.subarray(stdin.cursor, stdin.cursor + count);
      const text = textDecoder.decode(bytes);
      events.push([time, "i", text]);
      stdin.cursor += count;
    } else if (entry[0] === "S" && entry[2] === "SIGWINCH") {
      const cols = parseInt(entry[4].slice(5), 10);
      const rows = parseInt(entry[3].slice(5), 10);
      events.push([time, "r", `${cols}x${rows}`]);
    } else if (entry[0] === "H" && entry[2] === "COLUMNS") {
      cols = parseInt(entry[3], 10);
    } else if (entry[0] === "H" && entry[2] === "LINES") {
      rows = parseInt(entry[3], 10);
    }
  }
  cols = cols ?? 80;
  rows = rows ?? 24;
  return {
    cols,
    rows,
    events
  };
}

async function parse(response, _ref) {
  let {
    encoding
  } = _ref;
  const textDecoder = new TextDecoder(encoding);
  const buffer = await response.arrayBuffer();
  const array = new Uint8Array(buffer);
  const firstFrame = parseFrame(array);
  const baseTime = firstFrame.time;
  const firstFrameText = textDecoder.decode(firstFrame.data);
  const sizeMatch = firstFrameText.match(/\x1b\[8;(\d+);(\d+)t/);
  const events = [];
  let cols = 80;
  let rows = 24;
  if (sizeMatch !== null) {
    cols = parseInt(sizeMatch[2], 10);
    rows = parseInt(sizeMatch[1], 10);
  }
  let cursor = 0;
  let frame = parseFrame(array);
  while (frame !== undefined) {
    const time = frame.time - baseTime;
    const text = textDecoder.decode(frame.data);
    events.push([time, "o", text]);
    cursor += frame.len;
    frame = parseFrame(array.subarray(cursor));
  }
  return {
    cols,
    rows,
    events
  };
}
function parseFrame(array) {
  if (array.length < 13) return;
  const time = parseTimestamp(array.subarray(0, 8));
  const len = parseNumber(array.subarray(8, 12));
  const data = array.subarray(12, 12 + len);
  return {
    time,
    data,
    len: len + 12
  };
}
function parseNumber(array) {
  return array[0] + array[1] * 256 + array[2] * 256 * 256 + array[3] * 256 * 256 * 256;
}
function parseTimestamp(array) {
  const sec = parseNumber(array.subarray(0, 4));
  const usec = parseNumber(array.subarray(4, 8));
  return sec + usec / 1000000;
}

const vt = loadVt(); // trigger async loading of wasm

class State {
  constructor(core) {
    this.core = core;
    this.driver = core.driver;
  }
  onEnter(data) {}
  init() {}
  play() {}
  pause() {}
  togglePlay() {}
  mute() {
    if (this.driver && this.driver.mute()) {
      this.core._dispatchEvent("muted", true);
    }
  }
  unmute() {
    if (this.driver && this.driver.unmute()) {
      this.core._dispatchEvent("muted", false);
    }
  }
  seek(where) {
    return false;
  }
  step(n) {}
  stop() {
    this.driver.stop();
  }
}
class UninitializedState extends State {
  async init() {
    try {
      await this.core._initializeDriver();
      return this.core._setState("idle");
    } catch (e) {
      this.core._setState("errored");
      throw e;
    }
  }
  async play() {
    this.core._dispatchEvent("play");
    const idleState = await this.init();
    await idleState.doPlay();
  }
  async togglePlay() {
    await this.play();
  }
  async seek(where) {
    const idleState = await this.init();
    return await idleState.seek(where);
  }
  async step(n) {
    const idleState = await this.init();
    await idleState.step(n);
  }
  stop() {}
}
class Idle extends State {
  onEnter(_ref) {
    let {
      reason,
      message
    } = _ref;
    this.core._dispatchEvent("idle", {
      message
    });
    if (reason === "paused") {
      this.core._dispatchEvent("pause");
    }
  }
  async play() {
    this.core._dispatchEvent("play");
    await this.doPlay();
  }
  async doPlay() {
    const stop = await this.driver.play();
    if (stop === true) {
      this.core._setState("playing");
    } else if (typeof stop === "function") {
      this.core._setState("playing");
      this.driver.stop = stop;
    }
  }
  async togglePlay() {
    await this.play();
  }
  seek(where) {
    return this.driver.seek(where);
  }
  step(n) {
    this.driver.step(n);
  }
}
class PlayingState extends State {
  onEnter() {
    this.core._dispatchEvent("playing");
  }
  pause() {
    if (this.driver.pause() === true) {
      this.core._setState("idle", {
        reason: "paused"
      });
    }
  }
  togglePlay() {
    this.pause();
  }
  seek(where) {
    return this.driver.seek(where);
  }
}
class LoadingState extends State {
  onEnter() {
    this.core._dispatchEvent("loading");
  }
}
class OfflineState extends State {
  onEnter(_ref2) {
    let {
      message
    } = _ref2;
    this.core._dispatchEvent("offline", {
      message
    });
  }
}
class EndedState extends State {
  onEnter(_ref3) {
    let {
      message
    } = _ref3;
    this.core._dispatchEvent("ended", {
      message
    });
  }
  async play() {
    this.core._dispatchEvent("play");
    if (await this.driver.restart()) {
      this.core._setState('playing');
    }
  }
  async togglePlay() {
    await this.play();
  }
  seek(where) {
    if (this.driver.seek(where) === true) {
      this.core._setState('idle');
      return true;
    }
    return false;
  }
}
class ErroredState extends State {
  onEnter() {
    this.core._dispatchEvent("errored");
  }
}
class Core {
  constructor(src, opts) {
    this.logger = opts.logger;
    this.state = new UninitializedState(this);
    this.stateName = "uninitialized";
    this.driver = getDriver(src);
    this.changedLines = new Set();
    this.cursor = undefined;
    this.duration = undefined;
    this.cols = opts.cols;
    this.rows = opts.rows;
    this.speed = opts.speed;
    this.loop = opts.loop;
    this.autoPlay = opts.autoPlay;
    this.idleTimeLimit = opts.idleTimeLimit;
    this.preload = opts.preload;
    this.startAt = parseNpt(opts.startAt);
    this.poster = this._parsePoster(opts.poster);
    this.markers = this._normalizeMarkers(opts.markers);
    this.pauseOnMarkers = opts.pauseOnMarkers;
    this.audioUrl = opts.audioUrl;
    this.commandQueue = Promise.resolve();
    this.eventHandlers = new Map([["ended", []], ["errored", []], ["idle", []], ["input", []], ["loading", []], ["marker", []], ["metadata", []], ["muted", []], ["offline", []], ["pause", []], ["play", []], ["playing", []], ["ready", []], ["reset", []], ["resize", []], ["seeked", []], ["terminalUpdate", []]]);
  }
  async init() {
    this.wasm = await vt;
    const feed = this._feed.bind(this);
    const onInput = data => {
      this._dispatchEvent("input", {
        data
      });
    };
    const onMarker = _ref4 => {
      let {
        index,
        time,
        label
      } = _ref4;
      this._dispatchEvent("marker", {
        index,
        time,
        label
      });
    };
    const reset = this._resetVt.bind(this);
    const resize = this._resizeVt.bind(this);
    const setState = this._setState.bind(this);
    const posterTime = this.poster.type === "npt" ? this.poster.value : undefined;
    this.driver = this.driver({
      feed,
      onInput,
      onMarker,
      reset,
      resize,
      setState,
      logger: this.logger
    }, {
      cols: this.cols,
      rows: this.rows,
      speed: this.speed,
      idleTimeLimit: this.idleTimeLimit,
      startAt: this.startAt,
      loop: this.loop,
      posterTime: posterTime,
      markers: this.markers,
      pauseOnMarkers: this.pauseOnMarkers,
      audioUrl: this.audioUrl
    });
    if (typeof this.driver === "function") {
      this.driver = {
        play: this.driver
      };
    }
    if (this.preload || posterTime !== undefined) {
      this._withState(state => state.init());
    }
    const poster = this.poster.type === "text" ? this._renderPoster(this.poster.value) : null;
    const config = {
      isPausable: !!this.driver.pause,
      isSeekable: !!this.driver.seek,
      poster
    };
    if (this.driver.init === undefined) {
      this.driver.init = () => {
        return {};
      };
    }
    if (this.driver.pause === undefined) {
      this.driver.pause = () => {};
    }
    if (this.driver.seek === undefined) {
      this.driver.seek = where => false;
    }
    if (this.driver.step === undefined) {
      this.driver.step = n => {};
    }
    if (this.driver.stop === undefined) {
      this.driver.stop = () => {};
    }
    if (this.driver.restart === undefined) {
      this.driver.restart = () => {};
    }
    if (this.driver.mute === undefined) {
      this.driver.mute = () => {};
    }
    if (this.driver.unmute === undefined) {
      this.driver.unmute = () => {};
    }
    if (this.driver.getCurrentTime === undefined) {
      const play = this.driver.play;
      let clock = new NullClock();
      this.driver.play = () => {
        clock = new Clock(this.speed);
        return play();
      };
      this.driver.getCurrentTime = () => clock.getTime();
    }
    this._dispatchEvent("ready", config);
    if (this.autoPlay) {
      this.play();
    }
  }
  play() {
    return this._withState(state => state.play());
  }
  pause() {
    return this._withState(state => state.pause());
  }
  togglePlay() {
    return this._withState(state => state.togglePlay());
  }
  seek(where) {
    return this._withState(async state => {
      if (await state.seek(where)) {
        this._dispatchEvent("seeked");
      }
    });
  }
  step(n) {
    return this._withState(state => state.step(n));
  }
  stop() {
    return this._withState(state => state.stop());
  }
  mute() {
    return this._withState(state => state.mute());
  }
  unmute() {
    return this._withState(state => state.unmute());
  }
  getChanges() {
    const changes = {};
    if (this.changedLines.size > 0) {
      const lines = new Map();
      const rows = this.vt.rows;
      for (const i of this.changedLines) {
        if (i < rows) {
          lines.set(i, {
            id: i,
            segments: this.vt.getLine(i)
          });
        }
      }
      this.changedLines.clear();
      changes.lines = lines;
    }
    if (this.cursor === undefined && this.vt) {
      this.cursor = this.vt.getCursor() ?? false;
      changes.cursor = this.cursor;
    }
    return changes;
  }
  getCurrentTime() {
    return this.driver.getCurrentTime();
  }
  getRemainingTime() {
    if (typeof this.duration === "number") {
      return this.duration - Math.min(this.getCurrentTime(), this.duration);
    }
  }
  getProgress() {
    if (typeof this.duration === "number") {
      return Math.min(this.getCurrentTime(), this.duration) / this.duration;
    }
  }
  getDuration() {
    return this.duration;
  }
  addEventListener(eventName, handler) {
    this.eventHandlers.get(eventName).push(handler);
  }
  _dispatchEvent(eventName) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    for (const h of this.eventHandlers.get(eventName)) {
      h(data);
    }
  }
  _withState(f) {
    return this._enqueueCommand(() => f(this.state));
  }
  _enqueueCommand(f) {
    this.commandQueue = this.commandQueue.then(f);
    return this.commandQueue;
  }
  _setState(newState) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (this.stateName === newState) return this.state;
    this.stateName = newState;
    if (newState === "playing") {
      this.state = new PlayingState(this);
    } else if (newState === "idle") {
      this.state = new Idle(this);
    } else if (newState === "loading") {
      this.state = new LoadingState(this);
    } else if (newState === "ended") {
      this.state = new EndedState(this);
    } else if (newState === "offline") {
      this.state = new OfflineState(this);
    } else if (newState === "errored") {
      this.state = new ErroredState(this);
    } else {
      throw `invalid state: ${newState}`;
    }
    this.state.onEnter(data);
    return this.state;
  }
  _feed(data) {
    this._doFeed(data);
    this._dispatchEvent("terminalUpdate");
  }
  _doFeed(data) {
    const affectedLines = this.vt.feed(data);
    affectedLines.forEach(i => this.changedLines.add(i));
    this.cursor = undefined;
  }
  async _initializeDriver() {
    const meta = await this.driver.init();
    this.cols = this.cols ?? meta.cols ?? 80;
    this.rows = this.rows ?? meta.rows ?? 24;
    this.duration = this.duration ?? meta.duration;
    this.markers = this._normalizeMarkers(meta.markers) ?? this.markers ?? [];
    if (this.cols === 0) {
      this.cols = 80;
    }
    if (this.rows === 0) {
      this.rows = 24;
    }
    this._initializeVt(this.cols, this.rows);
    const poster = meta.poster !== undefined ? this._renderPoster(meta.poster) : null;
    this._dispatchEvent("metadata", {
      cols: this.cols,
      rows: this.rows,
      duration: this.duration,
      markers: this.markers,
      theme: meta.theme,
      hasAudio: meta.hasAudio,
      poster
    });
  }
  _resetVt(cols, rows) {
    let init = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
    let theme = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
    this.logger.debug(`core: vt reset (${cols}x${rows})`);
    this.cols = cols;
    this.rows = rows;
    this.cursor = undefined;
    this._initializeVt(cols, rows);
    if (init !== undefined && init !== "") {
      this._doFeed(init);
    }
    this._dispatchEvent("reset", {
      cols,
      rows,
      theme
    });
  }
  _resizeVt(cols, rows) {
    if (cols === this.vt.cols && rows === this.vt.rows) return;
    const affectedLines = this.vt.resize(cols, rows);
    affectedLines.forEach(i => this.changedLines.add(i));
    this.cursor = undefined;
    this.vt.cols = cols;
    this.vt.rows = rows;
    this.logger.debug(`core: vt resize (${cols}x${rows})`);
    this._dispatchEvent("resize", {
      cols,
      rows
    });
  }
  _initializeVt(cols, rows) {
    this.vt = this.wasm.create(cols, rows, true, 100);
    this.vt.cols = cols;
    this.vt.rows = rows;
    this.changedLines.clear();
    for (let i = 0; i < rows; i++) {
      this.changedLines.add(i);
    }
  }
  _parsePoster(poster) {
    if (typeof poster !== "string") return {};
    if (poster.substring(0, 16) == "data:text/plain,") {
      return {
        type: "text",
        value: [poster.substring(16)]
      };
    } else if (poster.substring(0, 4) == "npt:") {
      return {
        type: "npt",
        value: parseNpt(poster.substring(4))
      };
    }
    return {};
  }
  _renderPoster(poster) {
    const cols = this.cols ?? 80;
    const rows = this.rows ?? 24;
    this.logger.debug(`core: poster init (${cols}x${rows})`);
    const vt = this.wasm.create(cols, rows, false, 0);
    poster.forEach(text => vt.feed(text));
    const cursor = vt.getCursor() ?? false;
    const lines = [];
    for (let i = 0; i < rows; i++) {
      lines.push({
        id: i,
        segments: vt.getLine(i)
      });
    }
    return {
      cursor,
      lines
    };
  }
  _normalizeMarkers(markers) {
    if (Array.isArray(markers)) {
      return markers.map(m => typeof m === "number" ? [m, ""] : m);
    }
  }
}
const DRIVERS = new Map([["benchmark", benchmark], ["clock", clock], ["eventsource", eventsource], ["random", random], ["recording", recording], ["websocket", websocket]]);
const PARSERS = new Map([["asciicast", parse$2], ["typescript", parse$1], ["ttyrec", parse]]);
function getDriver(src) {
  if (typeof src === "function") return src;
  if (typeof src === "string") {
    if (src.substring(0, 5) == "ws://" || src.substring(0, 6) == "wss://") {
      src = {
        driver: "websocket",
        url: src
      };
    } else if (src.substring(0, 6) == "clock:") {
      src = {
        driver: "clock"
      };
    } else if (src.substring(0, 7) == "random:") {
      src = {
        driver: "random"
      };
    } else if (src.substring(0, 10) == "benchmark:") {
      src = {
        driver: "benchmark",
        url: src.substring(10)
      };
    } else {
      src = {
        driver: "recording",
        url: src
      };
    }
  }
  if (src.driver === undefined) {
    src.driver = "recording";
  }
  if (src.driver == "recording") {
    if (src.parser === undefined) {
      src.parser = "asciicast";
    }
    if (typeof src.parser === "string") {
      if (PARSERS.has(src.parser)) {
        src.parser = PARSERS.get(src.parser);
      } else {
        throw `unknown parser: ${src.parser}`;
      }
    }
  }
  if (DRIVERS.has(src.driver)) {
    const driver = DRIVERS.get(src.driver);
    return (callbacks, opts) => driver(src, callbacks, opts);
  } else {
    throw `unsupported driver: ${JSON.stringify(src)}`;
  }
}

const IS_DEV = false;
const equalFn = (a, b) => a === b;
const $PROXY = Symbol("solid-proxy");
const SUPPORTS_PROXY = typeof Proxy === "function";
const $TRACK = Symbol("solid-track");
const signalOptions = {
  equals: equalFn
};
let runEffects = runQueue;
const STALE = 1;
const PENDING = 2;
const UNOWNED = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var Owner = null;
let Transition$1 = null;
let ExternalSourceConfig = null;
let Listener = null;
let Updates = null;
let Effects = null;
let ExecCount = 0;
function createRoot(fn, detachedOwner) {
  const listener = Listener,
    owner = Owner,
    unowned = fn.length === 0,
    current = detachedOwner === undefined ? owner : detachedOwner,
    root = unowned
      ? UNOWNED
      : {
          owned: null,
          cleanups: null,
          context: current ? current.context : null,
          owner: current
        },
    updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root)));
  Owner = root;
  Listener = null;
  try {
    return runUpdates(updateFn, true);
  } finally {
    Listener = listener;
    Owner = owner;
  }
}
function createSignal(value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const s = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || undefined
  };
  const setter = value => {
    if (typeof value === "function") {
      value = value(s.value);
    }
    return writeSignal(s, value);
  };
  return [readSignal.bind(s), setter];
}
function createComputed(fn, value, options) {
  const c = createComputation(fn, value, true, STALE);
  updateComputation(c);
}
function createRenderEffect(fn, value, options) {
  const c = createComputation(fn, value, false, STALE);
  updateComputation(c);
}
function createEffect(fn, value, options) {
  runEffects = runUserEffects;
  const c = createComputation(fn, value, false, STALE);
  c.user = true;
  Effects ? Effects.push(c) : updateComputation(c);
}
function createMemo(fn, value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const c = createComputation(fn, value, true, 0);
  c.observers = null;
  c.observerSlots = null;
  c.comparator = options.equals || undefined;
  updateComputation(c);
  return readSignal.bind(c);
}
function batch(fn) {
  return runUpdates(fn, false);
}
function untrack(fn) {
  if (Listener === null) return fn();
  const listener = Listener;
  Listener = null;
  try {
    if (ExternalSourceConfig) ;
    return fn();
  } finally {
    Listener = listener;
  }
}
function onMount(fn) {
  createEffect(() => untrack(fn));
}
function onCleanup(fn) {
  if (Owner === null);
  else if (Owner.cleanups === null) Owner.cleanups = [fn];
  else Owner.cleanups.push(fn);
  return fn;
}
function getListener() {
  return Listener;
}
function startTransition(fn) {
  const l = Listener;
  const o = Owner;
  return Promise.resolve().then(() => {
    Listener = l;
    Owner = o;
    let t;
    runUpdates(fn, false);
    Listener = Owner = null;
    return t ? t.done : undefined;
  });
}
const [transPending] = /*@__PURE__*/ createSignal(false);
function useTransition() {
  return [transPending, startTransition];
}
function children(fn) {
  const children = createMemo(fn);
  const memo = createMemo(() => resolveChildren(children()));
  memo.toArray = () => {
    const c = memo();
    return Array.isArray(c) ? c : c != null ? [c] : [];
  };
  return memo;
}
function readSignal() {
  if (this.sources && (this.state)) {
    if ((this.state) === STALE) updateComputation(this);
    else {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;
    }
  }
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0;
    if (!Listener.sources) {
      Listener.sources = [this];
      Listener.sourceSlots = [sSlot];
    } else {
      Listener.sources.push(this);
      Listener.sourceSlots.push(sSlot);
    }
    if (!this.observers) {
      this.observers = [Listener];
      this.observerSlots = [Listener.sources.length - 1];
    } else {
      this.observers.push(Listener);
      this.observerSlots.push(Listener.sources.length - 1);
    }
  }
  return this.value;
}
function writeSignal(node, value, isComp) {
  let current =
    node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    node.value = value;
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0; i < node.observers.length; i += 1) {
          const o = node.observers[i];
          const TransitionRunning = Transition$1 && Transition$1.running;
          if (TransitionRunning && Transition$1.disposed.has(o)) ;
          if (TransitionRunning ? !o.tState : !o.state) {
            if (o.pure) Updates.push(o);
            else Effects.push(o);
            if (o.observers) markDownstream(o);
          }
          if (!TransitionRunning) o.state = STALE;
        }
        if (Updates.length > 10e5) {
          Updates = [];
          if (IS_DEV);
          throw new Error();
        }
      }, false);
    }
  }
  return value;
}
function updateComputation(node) {
  if (!node.fn) return;
  cleanNode(node);
  const time = ExecCount;
  runComputation(
    node,
    node.value,
    time
  );
}
function runComputation(node, value, time) {
  let nextValue;
  const owner = Owner,
    listener = Listener;
  Listener = Owner = node;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) {
      {
        node.state = STALE;
        node.owned && node.owned.forEach(cleanNode);
        node.owned = null;
      }
    }
    node.updatedAt = time + 1;
    return handleError(err);
  } finally {
    Listener = listener;
    Owner = owner;
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      writeSignal(node, nextValue);
    } else node.value = nextValue;
    node.updatedAt = time;
  }
}
function createComputation(fn, init, pure, state = STALE, options) {
  const c = {
    fn,
    state: state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner,
    context: Owner ? Owner.context : null,
    pure
  };
  if (Owner === null);
  else if (Owner !== UNOWNED) {
    {
      if (!Owner.owned) Owner.owned = [c];
      else Owner.owned.push(c);
    }
  }
  return c;
}
function runTop(node) {
  if ((node.state) === 0) return;
  if ((node.state) === PENDING) return lookUpstream(node);
  if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
  const ancestors = [node];
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
    if (node.state) ancestors.push(node);
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    node = ancestors[i];
    if ((node.state) === STALE) {
      updateComputation(node);
    } else if ((node.state) === PENDING) {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(node, ancestors[0]), false);
      Updates = updates;
    }
  }
}
function runUpdates(fn, init) {
  if (Updates) return fn();
  let wait = false;
  if (!init) Updates = [];
  if (Effects) wait = true;
  else Effects = [];
  ExecCount++;
  try {
    const res = fn();
    completeUpdates(wait);
    return res;
  } catch (err) {
    if (!wait) Effects = null;
    Updates = null;
    handleError(err);
  }
}
function completeUpdates(wait) {
  if (Updates) {
    runQueue(Updates);
    Updates = null;
  }
  if (wait) return;
  const e = Effects;
  Effects = null;
  if (e.length) runUpdates(() => runEffects(e), false);
}
function runQueue(queue) {
  for (let i = 0; i < queue.length; i++) runTop(queue[i]);
}
function runUserEffects(queue) {
  let i,
    userLength = 0;
  for (i = 0; i < queue.length; i++) {
    const e = queue[i];
    if (!e.user) runTop(e);
    else queue[userLength++] = e;
  }
  for (i = 0; i < userLength; i++) runTop(queue[i]);
}
function lookUpstream(node, ignore) {
  node.state = 0;
  for (let i = 0; i < node.sources.length; i += 1) {
    const source = node.sources[i];
    if (source.sources) {
      const state = source.state;
      if (state === STALE) {
        if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount))
          runTop(source);
      } else if (state === PENDING) lookUpstream(source, ignore);
    }
  }
}
function markDownstream(node) {
  for (let i = 0; i < node.observers.length; i += 1) {
    const o = node.observers[i];
    if (!o.state) {
      o.state = PENDING;
      if (o.pure) Updates.push(o);
      else Effects.push(o);
      o.observers && markDownstream(o);
    }
  }
}
function cleanNode(node) {
  let i;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(),
        index = node.sourceSlots.pop(),
        obs = source.observers;
      if (obs && obs.length) {
        const n = obs.pop(),
          s = source.observerSlots.pop();
        if (index < obs.length) {
          n.sourceSlots[s] = index;
          obs[index] = n;
          source.observerSlots[index] = s;
        }
      }
    }
  }
  if (node.tOwned) {
    for (i = node.tOwned.length - 1; i >= 0; i--) cleanNode(node.tOwned[i]);
    delete node.tOwned;
  }
  if (node.owned) {
    for (i = node.owned.length - 1; i >= 0; i--) cleanNode(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i = node.cleanups.length - 1; i >= 0; i--) node.cleanups[i]();
    node.cleanups = null;
  }
  node.state = 0;
}
function castError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : "Unknown error", {
    cause: err
  });
}
function handleError(err, owner = Owner) {
  const error = castError(err);
  throw error;
}
function resolveChildren(children) {
  if (typeof children === "function" && !children.length) return resolveChildren(children());
  if (Array.isArray(children)) {
    const results = [];
    for (let i = 0; i < children.length; i++) {
      const result = resolveChildren(children[i]);
      Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
    }
    return results;
  }
  return children;
}

const FALLBACK = Symbol("fallback");
function dispose(d) {
  for (let i = 0; i < d.length; i++) d[i]();
}
function mapArray(list, mapFn, options = {}) {
  let items = [],
    mapped = [],
    disposers = [],
    len = 0,
    indexes = mapFn.length > 1 ? [] : null;
  onCleanup(() => dispose(disposers));
  return () => {
    let newItems = list() || [],
      newLen = newItems.length,
      i,
      j;
    newItems[$TRACK];
    return untrack(() => {
      let newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
      if (newLen === 0) {
        if (len !== 0) {
          dispose(disposers);
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          indexes && (indexes = []);
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot(disposer => {
            disposers[0] = disposer;
            return options.fallback();
          });
          len = 1;
        }
      } else if (len === 0) {
        mapped = new Array(newLen);
        for (j = 0; j < newLen; j++) {
          items[j] = newItems[j];
          mapped[j] = createRoot(mapper);
        }
        len = newLen;
      } else {
        temp = new Array(newLen);
        tempdisposers = new Array(newLen);
        indexes && (tempIndexes = new Array(newLen));
        for (
          start = 0, end = Math.min(len, newLen);
          start < end && items[start] === newItems[start];
          start++
        );
        for (
          end = len - 1, newEnd = newLen - 1;
          end >= start && newEnd >= start && items[end] === newItems[newEnd];
          end--, newEnd--
        ) {
          temp[newEnd] = mapped[end];
          tempdisposers[newEnd] = disposers[end];
          indexes && (tempIndexes[newEnd] = indexes[end]);
        }
        newIndices = new Map();
        newIndicesNext = new Array(newEnd + 1);
        for (j = newEnd; j >= start; j--) {
          item = newItems[j];
          i = newIndices.get(item);
          newIndicesNext[j] = i === undefined ? -1 : i;
          newIndices.set(item, j);
        }
        for (i = start; i <= end; i++) {
          item = items[i];
          j = newIndices.get(item);
          if (j !== undefined && j !== -1) {
            temp[j] = mapped[i];
            tempdisposers[j] = disposers[i];
            indexes && (tempIndexes[j] = indexes[i]);
            j = newIndicesNext[j];
            newIndices.set(item, j);
          } else disposers[i]();
        }
        for (j = start; j < newLen; j++) {
          if (j in temp) {
            mapped[j] = temp[j];
            disposers[j] = tempdisposers[j];
            if (indexes) {
              indexes[j] = tempIndexes[j];
              indexes[j](j);
            }
          } else mapped[j] = createRoot(mapper);
        }
        mapped = mapped.slice(0, (len = newLen));
        items = newItems.slice(0);
      }
      return mapped;
    });
    function mapper(disposer) {
      disposers[j] = disposer;
      if (indexes) {
        const [s, set] = createSignal(j);
        indexes[j] = set;
        return mapFn(newItems[j], s);
      }
      return mapFn(newItems[j]);
    }
  };
}
function indexArray(list, mapFn, options = {}) {
  let items = [],
    mapped = [],
    disposers = [],
    signals = [],
    len = 0,
    i;
  onCleanup(() => dispose(disposers));
  return () => {
    const newItems = list() || [],
      newLen = newItems.length;
    newItems[$TRACK];
    return untrack(() => {
      if (newLen === 0) {
        if (len !== 0) {
          dispose(disposers);
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          signals = [];
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot(disposer => {
            disposers[0] = disposer;
            return options.fallback();
          });
          len = 1;
        }
        return mapped;
      }
      if (items[0] === FALLBACK) {
        disposers[0]();
        disposers = [];
        items = [];
        mapped = [];
        len = 0;
      }
      for (i = 0; i < newLen; i++) {
        if (i < items.length && items[i] !== newItems[i]) {
          signals[i](() => newItems[i]);
        } else if (i >= items.length) {
          mapped[i] = createRoot(mapper);
        }
      }
      for (; i < items.length; i++) {
        disposers[i]();
      }
      len = signals.length = disposers.length = newLen;
      items = newItems.slice(0);
      return (mapped = mapped.slice(0, len));
    });
    function mapper(disposer) {
      disposers[i] = disposer;
      const [s, set] = createSignal(newItems[i]);
      signals[i] = set;
      return mapFn(s, i);
    }
  };
}
function createComponent(Comp, props) {
  return untrack(() => Comp(props || {}));
}
function trueFn() {
  return true;
}
const propTraps = {
  get(_, property, receiver) {
    if (property === $PROXY) return receiver;
    return _.get(property);
  },
  has(_, property) {
    if (property === $PROXY) return true;
    return _.has(property);
  },
  set: trueFn,
  deleteProperty: trueFn,
  getOwnPropertyDescriptor(_, property) {
    return {
      configurable: true,
      enumerable: true,
      get() {
        return _.get(property);
      },
      set: trueFn,
      deleteProperty: trueFn
    };
  },
  ownKeys(_) {
    return _.keys();
  }
};
function resolveSource(s) {
  return !(s = typeof s === "function" ? s() : s) ? {} : s;
}
function resolveSources() {
  for (let i = 0, length = this.length; i < length; ++i) {
    const v = this[i]();
    if (v !== undefined) return v;
  }
}
function mergeProps(...sources) {
  let proxy = false;
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    proxy = proxy || (!!s && $PROXY in s);
    sources[i] = typeof s === "function" ? ((proxy = true), createMemo(s)) : s;
  }
  if (SUPPORTS_PROXY && proxy) {
    return new Proxy(
      {
        get(property) {
          for (let i = sources.length - 1; i >= 0; i--) {
            const v = resolveSource(sources[i])[property];
            if (v !== undefined) return v;
          }
        },
        has(property) {
          for (let i = sources.length - 1; i >= 0; i--) {
            if (property in resolveSource(sources[i])) return true;
          }
          return false;
        },
        keys() {
          const keys = [];
          for (let i = 0; i < sources.length; i++)
            keys.push(...Object.keys(resolveSource(sources[i])));
          return [...new Set(keys)];
        }
      },
      propTraps
    );
  }
  const sourcesMap = {};
  const defined = Object.create(null);
  for (let i = sources.length - 1; i >= 0; i--) {
    const source = sources[i];
    if (!source) continue;
    const sourceKeys = Object.getOwnPropertyNames(source);
    for (let i = sourceKeys.length - 1; i >= 0; i--) {
      const key = sourceKeys[i];
      if (key === "__proto__" || key === "constructor") continue;
      const desc = Object.getOwnPropertyDescriptor(source, key);
      if (!defined[key]) {
        defined[key] = desc.get
          ? {
              enumerable: true,
              configurable: true,
              get: resolveSources.bind((sourcesMap[key] = [desc.get.bind(source)]))
            }
          : desc.value !== undefined
          ? desc
          : undefined;
      } else {
        const sources = sourcesMap[key];
        if (sources) {
          if (desc.get) sources.push(desc.get.bind(source));
          else if (desc.value !== undefined) sources.push(() => desc.value);
        }
      }
    }
  }
  const target = {};
  const definedKeys = Object.keys(defined);
  for (let i = definedKeys.length - 1; i >= 0; i--) {
    const key = definedKeys[i],
      desc = defined[key];
    if (desc && desc.get) Object.defineProperty(target, key, desc);
    else target[key] = desc ? desc.value : undefined;
  }
  return target;
}

const narrowedError = name => `Stale read from <${name}>.`;
function For(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(mapArray(() => props.each, props.children, fallback || undefined));
}
function Index(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(indexArray(() => props.each, props.children, fallback || undefined));
}
function Show(props) {
  const keyed = props.keyed;
  const conditionValue = createMemo(() => props.when, undefined, undefined);
  const condition = keyed
    ? conditionValue
    : createMemo(conditionValue, undefined, {
        equals: (a, b) => !a === !b
      });
  return createMemo(
    () => {
      const c = condition();
      if (c) {
        const child = props.children;
        const fn = typeof child === "function" && child.length > 0;
        return fn
          ? untrack(() =>
              child(
                keyed
                  ? c
                  : () => {
                      if (!untrack(condition)) throw narrowedError("Show");
                      return conditionValue();
                    }
              )
            )
          : child;
      }
      return props.fallback;
    },
    undefined,
    undefined
  );
}
function Switch(props) {
  const chs = children(() => props.children);
  const switchFunc = createMemo(() => {
    const ch = chs();
    const mps = Array.isArray(ch) ? ch : [ch];
    let func = () => undefined;
    for (let i = 0; i < mps.length; i++) {
      const index = i;
      const mp = mps[i];
      const prevFunc = func;
      const conditionValue = createMemo(
        () => (prevFunc() ? undefined : mp.when),
        undefined,
        undefined
      );
      const condition = mp.keyed
        ? conditionValue
        : createMemo(conditionValue, undefined, {
            equals: (a, b) => !a === !b
          });
      func = () => prevFunc() || (condition() ? [index, conditionValue, mp] : undefined);
    }
    return func;
  });
  return createMemo(
    () => {
      const sel = switchFunc()();
      if (!sel) return props.fallback;
      const [index, conditionValue, mp] = sel;
      const child = mp.children;
      const fn = typeof child === "function" && child.length > 0;
      return fn
        ? untrack(() =>
            child(
              mp.keyed
                ? conditionValue()
                : () => {
                    if (untrack(switchFunc)()?.[0] !== index) throw narrowedError("Match");
                    return conditionValue();
                  }
            )
          )
        : child;
    },
    undefined,
    undefined
  );
}
function Match(props) {
  return props;
}

const memo = fn => createMemo(() => fn());

function reconcileArrays(parentNode, a, b) {
  let bLength = b.length,
    aEnd = a.length,
    bEnd = bLength,
    aStart = 0,
    bStart = 0,
    after = a[aEnd - 1].nextSibling,
    map = null;
  while (aStart < aEnd || bStart < bEnd) {
    if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
      continue;
    }
    while (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    }
    if (aEnd === aStart) {
      const node = bEnd < bLength ? (bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart]) : after;
      while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) a[aStart].remove();
        aStart++;
      }
    } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = a[--aEnd].nextSibling;
      parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
      parentNode.insertBefore(b[--bEnd], node);
      a[aEnd] = b[bEnd];
    } else {
      if (!map) {
        map = new Map();
        let i = bStart;
        while (i < bEnd) map.set(b[i], i++);
      }
      const index = map.get(a[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i = aStart,
            sequence = 1,
            t;
          while (++i < aEnd && i < bEnd) {
            if ((t = map.get(a[i])) == null || t !== index + sequence) break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const node = a[aStart];
            while (bStart < index) parentNode.insertBefore(b[bStart++], node);
          } else parentNode.replaceChild(b[bStart++], a[aStart++]);
        } else aStart++;
      } else a[aStart++].remove();
    }
  }
}

const $$EVENTS = "_$DX_DELEGATE";
function render(code, element, init, options = {}) {
  let disposer;
  createRoot(dispose => {
    disposer = dispose;
    element === document
      ? code()
      : insert(element, code(), element.firstChild ? null : undefined, init);
  }, options.owner);
  return () => {
    disposer();
    element.textContent = "";
  };
}
function template(html, isImportNode, isSVG, isMathML) {
  let node;
  const create = () => {
    const t = document.createElement("template");
    const range = document.createRange();
    const fragment = range.createContextualFragment(html);
    const firstChild = fragment.firstChild;
    t.content.append(fragment);
    return firstChild;
  };
  const fn = isImportNode
    ? () => untrack(() => document.importNode(node || (node = create()), true))
    : () => (node || (node = create())).cloneNode(true);
  fn.cloneNode = fn;
  return fn;
}
function delegateEvents(eventNames, document = window.document) {
  const e = document[$$EVENTS] || (document[$$EVENTS] = new Set());
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];
    if (!e.has(name)) {
      e.add(name);
      document.addEventListener(name, eventHandler);
    }
  }
}
function setAttribute(node, name, value) {
  node.removeAttribute(name);
}
function className(node, value) {
  if (value == null) node.removeAttribute("class");
  else node.className = value;
}
function addEventListener(node, name, handler, delegate) {
  {
    if (Array.isArray(handler)) {
      node[`$$${name}`] = handler[0];
      node[`$$${name}Data`] = handler[1];
    } else node[`$$${name}`] = handler;
  }
}
function style(node, value, prev) {
  if (!value) return prev ? setAttribute(node, "style") : value;
  const nodeStyle = node.style;
  if (typeof value === "string") return (nodeStyle.cssText = value);
  typeof prev === "string" && (nodeStyle.cssText = prev = undefined);
  prev || (prev = {});
  value || (value = {});
  let v, s;
  for (s in prev) {
    value[s] == null && nodeStyle.removeProperty(s);
    delete prev[s];
  }
  for (s in value) {
    v = value[s];
    if (v !== prev[s]) {
      nodeStyle.setProperty(s, v);
      prev[s] = v;
    }
  }
  return prev;
}
function use(fn, element, arg) {
  return untrack(() => fn(element, arg));
}
function insert(parent, accessor, marker, initial) {
  if (marker !== undefined && !initial) initial = [];
  if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
  createRenderEffect(current => insertExpression(parent, accessor(), current, marker), initial);
}
function eventHandler(e) {
  let node = e.target;
  const key = `$$${e.type}`;
  const oriTarget = e.target;
  const oriCurrentTarget = e.currentTarget;
  const retarget = value =>
    Object.defineProperty(e, "target", {
      configurable: true,
      value
    });
  const handleNode = () => {
    const handler = node[key];
    if (handler && !node.disabled) {
      const data = node[`${key}Data`];
      data !== undefined ? handler.call(node, data, e) : handler.call(node, e);
      if (e.cancelBubble) return;
    }
    node.host &&
      typeof node.host !== "string" &&
      !node.host._$host &&
      node.contains(e.target) &&
      retarget(node.host);
    return true;
  };
  const walkUpTree = () => {
    while (handleNode() && (node = node._$host || node.parentNode || node.host));
  };
  Object.defineProperty(e, "currentTarget", {
    configurable: true,
    get() {
      return node || document;
    }
  });
  if (e.composedPath) {
    const path = e.composedPath();
    retarget(path[0]);
    for (let i = 0; i < path.length - 2; i++) {
      node = path[i];
      if (!handleNode()) break;
      if (node._$host) {
        node = node._$host;
        walkUpTree();
        break;
      }
      if (node.parentNode === oriCurrentTarget) {
        break;
      }
    }
  } else walkUpTree();
  retarget(oriTarget);
}
function insertExpression(parent, value, current, marker, unwrapArray) {
  while (typeof current === "function") current = current();
  if (value === current) return current;
  const t = typeof value,
    multi = marker !== undefined;
  parent = (multi && current[0] && current[0].parentNode) || parent;
  if (t === "string" || t === "number") {
    if (t === "number") {
      value = value.toString();
      if (value === current) return current;
    }
    if (multi) {
      let node = current[0];
      if (node && node.nodeType === 3) {
        node.data !== value && (node.data = value);
      } else node = document.createTextNode(value);
      current = cleanChildren(parent, current, marker, node);
    } else {
      if (current !== "" && typeof current === "string") {
        current = parent.firstChild.data = value;
      } else current = parent.textContent = value;
    }
  } else if (value == null || t === "boolean") {
    current = cleanChildren(parent, current, marker);
  } else if (t === "function") {
    createRenderEffect(() => {
      let v = value();
      while (typeof v === "function") v = v();
      current = insertExpression(parent, v, current, marker);
    });
    return () => current;
  } else if (Array.isArray(value)) {
    const array = [];
    const currentArray = current && Array.isArray(current);
    if (normalizeIncomingArray(array, value, current, unwrapArray)) {
      createRenderEffect(() => (current = insertExpression(parent, array, current, marker, true)));
      return () => current;
    }
    if (array.length === 0) {
      current = cleanChildren(parent, current, marker);
      if (multi) return current;
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes(parent, array, marker);
      } else reconcileArrays(parent, current, array);
    } else {
      current && cleanChildren(parent);
      appendNodes(parent, array);
    }
    current = array;
  } else if (value.nodeType) {
    if (Array.isArray(current)) {
      if (multi) return (current = cleanChildren(parent, current, marker, value));
      cleanChildren(parent, current, null, value);
    } else if (current == null || current === "" || !parent.firstChild) {
      parent.appendChild(value);
    } else parent.replaceChild(value, parent.firstChild);
    current = value;
  } else;
  return current;
}
function normalizeIncomingArray(normalized, array, current, unwrap) {
  let dynamic = false;
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i],
      prev = current && current[normalized.length],
      t;
    if (item == null || item === true || item === false);
    else if ((t = typeof item) === "object" && item.nodeType) {
      normalized.push(item);
    } else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
    } else if (t === "function") {
      if (unwrap) {
        while (typeof item === "function") item = item();
        dynamic =
          normalizeIncomingArray(
            normalized,
            Array.isArray(item) ? item : [item],
            Array.isArray(prev) ? prev : [prev]
          ) || dynamic;
      } else {
        normalized.push(item);
        dynamic = true;
      }
    } else {
      const value = String(item);
      if (prev && prev.nodeType === 3 && prev.data === value) normalized.push(prev);
      else normalized.push(document.createTextNode(value));
    }
  }
  return dynamic;
}
function appendNodes(parent, array, marker = null) {
  for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === undefined) return (parent.textContent = "");
  const node = replacement || document.createTextNode("");
  if (current.length) {
    let inserted = false;
    for (let i = current.length - 1; i >= 0; i--) {
      const el = current[i];
      if (node !== el) {
        const isParent = el.parentNode === parent;
        if (!inserted && !i)
          isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
        else isParent && el.remove();
      } else inserted = true;
    }
  } else parent.insertBefore(node, marker);
  return [node];
}

const $RAW = Symbol("store-raw"),
  $NODE = Symbol("store-node"),
  $HAS = Symbol("store-has"),
  $SELF = Symbol("store-self");
function wrap$1(value) {
  let p = value[$PROXY];
  if (!p) {
    Object.defineProperty(value, $PROXY, {
      value: (p = new Proxy(value, proxyTraps$1))
    });
    if (!Array.isArray(value)) {
      const keys = Object.keys(value),
        desc = Object.getOwnPropertyDescriptors(value);
      for (let i = 0, l = keys.length; i < l; i++) {
        const prop = keys[i];
        if (desc[prop].get) {
          Object.defineProperty(value, prop, {
            enumerable: desc[prop].enumerable,
            get: desc[prop].get.bind(p)
          });
        }
      }
    }
  }
  return p;
}
function isWrappable(obj) {
  let proto;
  return (
    obj != null &&
    typeof obj === "object" &&
    (obj[$PROXY] ||
      !(proto = Object.getPrototypeOf(obj)) ||
      proto === Object.prototype ||
      Array.isArray(obj))
  );
}
function unwrap(item, set = new Set()) {
  let result, unwrapped, v, prop;
  if ((result = item != null && item[$RAW])) return result;
  if (!isWrappable(item) || set.has(item)) return item;
  if (Array.isArray(item)) {
    if (Object.isFrozen(item)) item = item.slice(0);
    else set.add(item);
    for (let i = 0, l = item.length; i < l; i++) {
      v = item[i];
      if ((unwrapped = unwrap(v, set)) !== v) item[i] = unwrapped;
    }
  } else {
    if (Object.isFrozen(item)) item = Object.assign({}, item);
    else set.add(item);
    const keys = Object.keys(item),
      desc = Object.getOwnPropertyDescriptors(item);
    for (let i = 0, l = keys.length; i < l; i++) {
      prop = keys[i];
      if (desc[prop].get) continue;
      v = item[prop];
      if ((unwrapped = unwrap(v, set)) !== v) item[prop] = unwrapped;
    }
  }
  return item;
}
function getNodes(target, symbol) {
  let nodes = target[symbol];
  if (!nodes)
    Object.defineProperty(target, symbol, {
      value: (nodes = Object.create(null))
    });
  return nodes;
}
function getNode(nodes, property, value) {
  if (nodes[property]) return nodes[property];
  const [s, set] = createSignal(value, {
    equals: false,
    internal: true
  });
  s.$ = set;
  return (nodes[property] = s);
}
function proxyDescriptor$1(target, property) {
  const desc = Reflect.getOwnPropertyDescriptor(target, property);
  if (!desc || desc.get || !desc.configurable || property === $PROXY || property === $NODE)
    return desc;
  delete desc.value;
  delete desc.writable;
  desc.get = () => target[$PROXY][property];
  return desc;
}
function trackSelf(target) {
  getListener() && getNode(getNodes(target, $NODE), $SELF)();
}
function ownKeys(target) {
  trackSelf(target);
  return Reflect.ownKeys(target);
}
const proxyTraps$1 = {
  get(target, property, receiver) {
    if (property === $RAW) return target;
    if (property === $PROXY) return receiver;
    if (property === $TRACK) {
      trackSelf(target);
      return receiver;
    }
    const nodes = getNodes(target, $NODE);
    const tracked = nodes[property];
    let value = tracked ? tracked() : target[property];
    if (property === $NODE || property === $HAS || property === "__proto__") return value;
    if (!tracked) {
      const desc = Object.getOwnPropertyDescriptor(target, property);
      if (
        getListener() &&
        (typeof value !== "function" || target.hasOwnProperty(property)) &&
        !(desc && desc.get)
      )
        value = getNode(nodes, property, value)();
    }
    return isWrappable(value) ? wrap$1(value) : value;
  },
  has(target, property) {
    if (
      property === $RAW ||
      property === $PROXY ||
      property === $TRACK ||
      property === $NODE ||
      property === $HAS ||
      property === "__proto__"
    )
      return true;
    getListener() && getNode(getNodes(target, $HAS), property)();
    return property in target;
  },
  set() {
    return true;
  },
  deleteProperty() {
    return true;
  },
  ownKeys: ownKeys,
  getOwnPropertyDescriptor: proxyDescriptor$1
};
function setProperty(state, property, value, deleting = false) {
  if (!deleting && state[property] === value) return;
  const prev = state[property],
    len = state.length;
  if (value === undefined) {
    delete state[property];
    if (state[$HAS] && state[$HAS][property] && prev !== undefined) state[$HAS][property].$();
  } else {
    state[property] = value;
    if (state[$HAS] && state[$HAS][property] && prev === undefined) state[$HAS][property].$();
  }
  let nodes = getNodes(state, $NODE),
    node;
  if ((node = getNode(nodes, property, prev))) node.$(() => value);
  if (Array.isArray(state) && state.length !== len) {
    for (let i = state.length; i < len; i++) (node = nodes[i]) && node.$();
    (node = getNode(nodes, "length", len)) && node.$(state.length);
  }
  (node = nodes[$SELF]) && node.$();
}
function mergeStoreNode(state, value) {
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    setProperty(state, key, value[key]);
  }
}
function updateArray(current, next) {
  if (typeof next === "function") next = next(current);
  next = unwrap(next);
  if (Array.isArray(next)) {
    if (current === next) return;
    let i = 0,
      len = next.length;
    for (; i < len; i++) {
      const value = next[i];
      if (current[i] !== value) setProperty(current, i, value);
    }
    setProperty(current, "length", len);
  } else mergeStoreNode(current, next);
}
function updatePath(current, path, traversed = []) {
  let part,
    prev = current;
  if (path.length > 1) {
    part = path.shift();
    const partType = typeof part,
      isArray = Array.isArray(current);
    if (Array.isArray(part)) {
      for (let i = 0; i < part.length; i++) {
        updatePath(current, [part[i]].concat(path), traversed);
      }
      return;
    } else if (isArray && partType === "function") {
      for (let i = 0; i < current.length; i++) {
        if (part(current[i], i)) updatePath(current, [i].concat(path), traversed);
      }
      return;
    } else if (isArray && partType === "object") {
      const { from = 0, to = current.length - 1, by = 1 } = part;
      for (let i = from; i <= to; i += by) {
        updatePath(current, [i].concat(path), traversed);
      }
      return;
    } else if (path.length > 1) {
      updatePath(current[part], path, [part].concat(traversed));
      return;
    }
    prev = current[part];
    traversed = [part].concat(traversed);
  }
  let value = path[0];
  if (typeof value === "function") {
    value = value(prev, traversed);
    if (value === prev) return;
  }
  if (part === undefined && value == undefined) return;
  value = unwrap(value);
  if (part === undefined || (isWrappable(prev) && isWrappable(value) && !Array.isArray(value))) {
    mergeStoreNode(prev, value);
  } else setProperty(current, part, value);
}
function createStore(...[store, options]) {
  const unwrappedStore = unwrap(store || {});
  const isArray = Array.isArray(unwrappedStore);
  const wrappedStore = wrap$1(unwrappedStore);
  function setStore(...args) {
    batch(() => {
      isArray && args.length === 1
        ? updateArray(unwrappedStore, args[0])
        : updatePath(unwrappedStore, args);
    });
  }
  return [wrappedStore, setStore];
}

const $ROOT = Symbol("store-root");
function applyState(target, parent, property, merge, key) {
  const previous = parent[property];
  if (target === previous) return;
  const isArray = Array.isArray(target);
  if (
    property !== $ROOT &&
    (!isWrappable(target) ||
      !isWrappable(previous) ||
      isArray !== Array.isArray(previous) ||
      (key && target[key] !== previous[key]))
  ) {
    setProperty(parent, property, target);
    return;
  }
  if (isArray) {
    if (
      target.length &&
      previous.length &&
      (!merge || (key && target[0] && target[0][key] != null))
    ) {
      let i, j, start, end, newEnd, item, newIndicesNext, keyVal;
      for (
        start = 0, end = Math.min(previous.length, target.length);
        start < end &&
        (previous[start] === target[start] ||
          (key && previous[start] && target[start] && previous[start][key] === target[start][key]));
        start++
      ) {
        applyState(target[start], previous, start, merge, key);
      }
      const temp = new Array(target.length),
        newIndices = new Map();
      for (
        end = previous.length - 1, newEnd = target.length - 1;
        end >= start &&
        newEnd >= start &&
        (previous[end] === target[newEnd] ||
          (key && previous[end] && target[newEnd] && previous[end][key] === target[newEnd][key]));
        end--, newEnd--
      ) {
        temp[newEnd] = previous[end];
      }
      if (start > newEnd || start > end) {
        for (j = start; j <= newEnd; j++) setProperty(previous, j, target[j]);
        for (; j < target.length; j++) {
          setProperty(previous, j, temp[j]);
          applyState(target[j], previous, j, merge, key);
        }
        if (previous.length > target.length) setProperty(previous, "length", target.length);
        return;
      }
      newIndicesNext = new Array(newEnd + 1);
      for (j = newEnd; j >= start; j--) {
        item = target[j];
        keyVal = key && item ? item[key] : item;
        i = newIndices.get(keyVal);
        newIndicesNext[j] = i === undefined ? -1 : i;
        newIndices.set(keyVal, j);
      }
      for (i = start; i <= end; i++) {
        item = previous[i];
        keyVal = key && item ? item[key] : item;
        j = newIndices.get(keyVal);
        if (j !== undefined && j !== -1) {
          temp[j] = previous[i];
          j = newIndicesNext[j];
          newIndices.set(keyVal, j);
        }
      }
      for (j = start; j < target.length; j++) {
        if (j in temp) {
          setProperty(previous, j, temp[j]);
          applyState(target[j], previous, j, merge, key);
        } else setProperty(previous, j, target[j]);
      }
    } else {
      for (let i = 0, len = target.length; i < len; i++) {
        applyState(target[i], previous, i, merge, key);
      }
    }
    if (previous.length > target.length) setProperty(previous, "length", target.length);
    return;
  }
  const targetKeys = Object.keys(target);
  for (let i = 0, len = targetKeys.length; i < len; i++) {
    applyState(target[targetKeys[i]], previous, targetKeys[i], merge, key);
  }
  const previousKeys = Object.keys(previous);
  for (let i = 0, len = previousKeys.length; i < len; i++) {
    if (target[previousKeys[i]] === undefined) setProperty(previous, previousKeys[i], undefined);
  }
}
function reconcile(value, options = {}) {
  const { merge, key = "id" } = options,
    v = unwrap(value);
  return state => {
    if (!isWrappable(state) || !isWrappable(v)) return v;
    const res = applyState(
      v,
      {
        [$ROOT]: state
      },
      $ROOT,
      merge,
      key
    );
    return res === undefined ? state : res;
  };
}

const noop = () => {
    /* noop */
};
const noopTransition = (el, done) => done();
/**
 * Create an element transition interface for switching between single elements.
 * It can be used to implement own transition effect, or a custom `<Transition>`-like component.
 *
 * It will observe {@link source} and return a signal with array of elements to be rendered (current one and exiting ones).
 *
 * @param source a signal with the current element. Any nullish value will mean there is no element.
 * Any object can used as the source, but most likely you will want to use a `HTMLElement` or `SVGElement`.
 * @param options transition options {@link SwitchTransitionOptions}
 * @returns a signal with an array of the current element and exiting previous elements.
 *
 * @see https://github.com/solidjs-community/solid-primitives/tree/main/packages/transition-group#createSwitchTransition
 *
 * @example
 * const [el, setEl] = createSignal<HTMLDivElement>();
 *
 * const rendered = createSwitchTransition(el, {
 *   onEnter(el, done) {
 *     // the enter callback is called before the element is inserted into the DOM
 *     // so run the animation in the next animation frame / microtask
 *     queueMicrotask(() => { ... })
 *   },
 *   onExit(el, done) {
 *     // the exitting element is kept in the DOM until the done() callback is called
 *   },
 * })
 *
 * // change the source to trigger the transition
 * setEl(refToHtmlElement);
 */
function createSwitchTransition(source, options) {
    const initSource = untrack(source);
    const initReturned = initSource ? [initSource] : [];
    const { onEnter = noopTransition, onExit = noopTransition } = options;
    const [returned, setReturned] = createSignal(options.appear ? [] : initReturned);
    const [isTransitionPending] = useTransition();
    let next;
    let isExiting = false;
    function exitTransition(el, after) {
        if (!el)
            return after && after();
        isExiting = true;
        onExit(el, () => {
            batch(() => {
                isExiting = false;
                setReturned(p => p.filter(e => e !== el));
                after && after();
            });
        });
    }
    function enterTransition(after) {
        const el = next;
        if (!el)
            return after && after();
        next = undefined;
        setReturned(p => [el, ...p]);
        onEnter(el, after ?? noop);
    }
    const triggerTransitions = options.mode === "out-in"
        ? // exit -> enter
            // exit -> enter
            prev => isExiting || exitTransition(prev, enterTransition)
        : options.mode === "in-out"
            ? // enter -> exit
                // enter -> exit
                prev => enterTransition(() => exitTransition(prev))
            : // exit & enter
                // exit & enter
                prev => {
                    exitTransition(prev);
                    enterTransition();
                };
    createComputed((prev) => {
        const el = source();
        if (untrack(isTransitionPending)) {
            // wait for pending transition to end before animating
            isTransitionPending();
            return prev;
        }
        if (el !== prev) {
            next = el;
            batch(() => untrack(() => triggerTransitions(prev)));
        }
        return el;
    }, options.appear ? undefined : initSource);
    return returned;
}

/**
 * Default predicate used in `resolveElements()` and `resolveFirst()` to filter Elements.
 *
 * On the client it uses `instanceof Element` check, on the server it checks for the object with `t` property. (generated by compiling JSX)
 */
const defaultElementPredicate = (item) => item instanceof Element;
/**
 * Utility for resolving recursively nested JSX children in search of the first element that matches a predicate.
 *
 * It does **not** create a computation - should be wrapped in one to repeat the resolution on changes.
 *
 * @param value JSX children
 * @param predicate predicate to filter elements
 * @returns single found element or `null` if no elements were found
 */
function getFirstChild(value, predicate) {
    if (predicate(value))
        return value;
    if (typeof value === "function" && !value.length)
        return getFirstChild(value(), predicate);
    if (Array.isArray(value)) {
        for (const item of value) {
            const result = getFirstChild(item, predicate);
            if (result)
                return result;
        }
    }
    return null;
}
function resolveFirst(fn, predicate = defaultElementPredicate, serverPredicate = defaultElementPredicate) {
    const children = createMemo(fn);
    return createMemo(() => getFirstChild(children(), predicate));
}

// src/common.ts
function createClassnames(props) {
  return createMemo(() => {
    const name = props.name || "s";
    return {
      enterActive: (props.enterActiveClass || name + "-enter-active").split(" "),
      enter: (props.enterClass || name + "-enter").split(" "),
      enterTo: (props.enterToClass || name + "-enter-to").split(" "),
      exitActive: (props.exitActiveClass || name + "-exit-active").split(" "),
      exit: (props.exitClass || name + "-exit").split(" "),
      exitTo: (props.exitToClass || name + "-exit-to").split(" "),
      move: (props.moveClass || name + "-move").split(" ")
    };
  });
}
function nextFrame(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}
function enterTransition(classes, events, el, done) {
  const { onBeforeEnter, onEnter, onAfterEnter } = events;
  onBeforeEnter?.(el);
  el.classList.add(...classes.enter);
  el.classList.add(...classes.enterActive);
  queueMicrotask(() => {
    if (!el.parentNode)
      return done?.();
    onEnter?.(el, () => endTransition());
  });
  nextFrame(() => {
    el.classList.remove(...classes.enter);
    el.classList.add(...classes.enterTo);
    if (!onEnter || onEnter.length < 2) {
      el.addEventListener("transitionend", endTransition);
      el.addEventListener("animationend", endTransition);
    }
  });
  function endTransition(e) {
    if (!e || e.target === el) {
      done?.();
      el.removeEventListener("transitionend", endTransition);
      el.removeEventListener("animationend", endTransition);
      el.classList.remove(...classes.enterActive);
      el.classList.remove(...classes.enterTo);
      onAfterEnter?.(el);
    }
  }
}
function exitTransition(classes, events, el, done) {
  const { onBeforeExit, onExit, onAfterExit } = events;
  if (!el.parentNode)
    return done?.();
  onBeforeExit?.(el);
  el.classList.add(...classes.exit);
  el.classList.add(...classes.exitActive);
  onExit?.(el, () => endTransition());
  nextFrame(() => {
    el.classList.remove(...classes.exit);
    el.classList.add(...classes.exitTo);
    if (!onExit || onExit.length < 2) {
      el.addEventListener("transitionend", endTransition);
      el.addEventListener("animationend", endTransition);
    }
  });
  function endTransition(e) {
    if (!e || e.target === el) {
      done?.();
      el.removeEventListener("transitionend", endTransition);
      el.removeEventListener("animationend", endTransition);
      el.classList.remove(...classes.exitActive);
      el.classList.remove(...classes.exitTo);
      onAfterExit?.(el);
    }
  }
}
var TRANSITION_MODE_MAP = {
  inout: "in-out",
  outin: "out-in"
};
var Transition = (props) => {
  const classnames = createClassnames(props);
  return createSwitchTransition(
    resolveFirst(() => props.children),
    {
      mode: TRANSITION_MODE_MAP[props.mode],
      appear: props.appear,
      onEnter(el, done) {
        enterTransition(classnames(), props, el, done);
      },
      onExit(el, done) {
        exitTransition(classnames(), props, el, done);
      }
    }
  );
};

const _tmpl$$g = /*#__PURE__*/template(`<span></span>`, 2);
var Segment = (props => {
  const codePoint = createMemo(() => {
    if (props.text.length == 1) {
      const cp = props.text.codePointAt(0);
      if (cp >= 0x2580 && cp <= 0x259f || cp == 0xe0b0 || cp == 0xe0b2) {
        return cp;
      }
    }
  });
  const text = createMemo(() => codePoint() ? " " : props.text);
  const style$1 = createMemo(() => buildStyle(props.pen, props.offset, props.cellCount));
  const className$1 = createMemo(() => buildClassName(props.pen, codePoint(), props.extraClass));
  return (() => {
    const _el$ = _tmpl$$g.cloneNode(true);
    insert(_el$, text);
    createRenderEffect(_p$ => {
      const _v$ = className$1(),
        _v$2 = style$1();
      _v$ !== _p$._v$ && className(_el$, _p$._v$ = _v$);
      _p$._v$2 = style(_el$, _v$2, _p$._v$2);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined
    });
    return _el$;
  })();
});
function buildClassName(attrs, codePoint, extraClass) {
  const fgClass = colorClass(attrs.get("fg"), attrs.get("bold"), "fg-");
  const bgClass = colorClass(attrs.get("bg"), false, "bg-");
  let cls = extraClass ?? "";
  if (codePoint !== undefined) {
    cls += ` cp-${codePoint.toString(16)}`;
  }
  if (fgClass) {
    cls += " " + fgClass;
  }
  if (bgClass) {
    cls += " " + bgClass;
  }
  if (attrs.has("bold")) {
    cls += " ap-bright";
  }
  if (attrs.has("faint")) {
    cls += " ap-faint";
  }
  if (attrs.has("italic")) {
    cls += " ap-italic";
  }
  if (attrs.has("underline")) {
    cls += " ap-underline";
  }
  if (attrs.has("blink")) {
    cls += " ap-blink";
  }
  if (attrs.get("inverse")) {
    cls += " ap-inverse";
  }
  return cls;
}
function colorClass(color, intense, prefix) {
  if (typeof color === "number") {
    if (intense && color < 8) {
      color += 8;
    }
    return `${prefix}${color}`;
  }
}
function buildStyle(attrs, offset, width) {
  const fg = attrs.get("fg");
  const bg = attrs.get("bg");
  let style = {
    "--offset": offset,
    width: `${width + 0.01}ch`
  };
  if (typeof fg === "string") {
    style["--fg"] = fg;
  }
  if (typeof bg === "string") {
    style["--bg"] = bg;
  }
  return style;
}

const _tmpl$$f = /*#__PURE__*/template(`<span class="ap-line" role="paragraph"></span>`, 2);
var Line = (props => {
  const segments = () => {
    if (typeof props.cursor === "number") {
      const segs = [];
      let cellOffset = 0;
      let segIndex = 0;
      while (segIndex < props.segments.length && cellOffset + props.segments[segIndex].cellCount - 1 < props.cursor) {
        const seg = props.segments[segIndex];
        segs.push(seg);
        cellOffset += seg.cellCount;
        segIndex++;
      }
      if (segIndex < props.segments.length) {
        const seg = props.segments[segIndex];
        const charWidth = seg.charWidth;
        let cellIndex = props.cursor - cellOffset;
        const charIndex = Math.floor(cellIndex / charWidth);
        cellIndex = charIndex * charWidth;
        const chars = Array.from(seg.text);
        if (charIndex > 0) {
          segs.push({
            ...seg,
            text: chars.slice(0, charIndex).join("")
          });
        }
        segs.push({
          ...seg,
          text: chars[charIndex],
          offset: cellOffset + cellIndex,
          cellCount: charWidth,
          extraClass: "ap-cursor"
        });
        if (charIndex < chars.length - 1) {
          segs.push({
            ...seg,
            text: chars.slice(charIndex + 1).join(""),
            offset: cellOffset + cellIndex + 1,
            cellCount: seg.cellCount - charWidth
          });
        }
        segIndex++;
        while (segIndex < props.segments.length) {
          const seg = props.segments[segIndex];
          segs.push(seg);
          segIndex++;
        }
      }
      return segs;
    } else {
      return props.segments;
    }
  };
  return (() => {
    const _el$ = _tmpl$$f.cloneNode(true);
    insert(_el$, createComponent(Index, {
      get each() {
        return segments();
      },
      children: s => createComponent(Segment, mergeProps(s))
    }));
    return _el$;
  })();
});

const _tmpl$$e = /*#__PURE__*/template(`<pre class="ap-terminal" aria-live="off" tabindex="0"></pre>`, 2);
var Terminal = (props => {
  const lineHeight = () => props.lineHeight ?? 1.3333333333;
  const style$1 = createMemo(() => {
    return {
      width: `${props.cols}ch`,
      height: `${lineHeight() * props.rows}em`,
      "font-size": `${(props.scale || 1.0) * 100}%`,
      "font-family": props.fontFamily,
      "--term-line-height": `${lineHeight()}em`,
      "--term-cols": props.cols
    };
  });
  const cursorCol = createMemo(() => props.cursor?.[0]);
  const cursorRow = createMemo(() => props.cursor?.[1]);
  return (() => {
    const _el$ = _tmpl$$e.cloneNode(true);
    const _ref$ = props.ref;
    typeof _ref$ === "function" ? use(_ref$, _el$) : props.ref = _el$;
    insert(_el$, createComponent(For, {
      get each() {
        return props.lines;
      },
      children: (line, i) => createComponent(Line, {
        get segments() {
          return line.segments;
        },
        get cursor() {
          return memo(() => i() === cursorRow())() ? cursorCol() : null;
        }
      })
    }));
    createRenderEffect(_p$ => {
      const _v$ = !!(props.blink || props.cursorHold),
        _v$2 = !!props.blink,
        _v$3 = style$1();
      _v$ !== _p$._v$ && _el$.classList.toggle("ap-cursor-on", _p$._v$ = _v$);
      _v$2 !== _p$._v$2 && _el$.classList.toggle("ap-blink", _p$._v$2 = _v$2);
      _p$._v$3 = style(_el$, _v$3, _p$._v$3);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined
    });
    return _el$;
  })();
});

const _tmpl$$d = /*#__PURE__*/template(`<svg version="1.1" viewBox="0 0 12 12" class="ap-icon ap-icon-fullscreen-off"><path d="M7,5 L7,0 L9,2 L11,0 L12,1 L10,3 L12,5 Z"></path><path d="M5,7 L0,7 L2,9 L0,11 L1,12 L3,10 L5,12 Z"></path></svg>`, 6);
var ExpandIcon = (props => {
  return _tmpl$$d.cloneNode(true);
});

const _tmpl$$c = /*#__PURE__*/template(`<svg version="1.1" viewBox="6 8 14 16" class="ap-icon"><path d="M0.938 8.313h22.125c0.5 0 0.938 0.438 0.938 0.938v13.5c0 0.5-0.438 0.938-0.938 0.938h-22.125c-0.5 0-0.938-0.438-0.938-0.938v-13.5c0-0.5 0.438-0.938 0.938-0.938zM1.594 22.063h20.813v-12.156h-20.813v12.156zM3.844 11.188h1.906v1.938h-1.906v-1.938zM7.469 11.188h1.906v1.938h-1.906v-1.938zM11.031 11.188h1.938v1.938h-1.938v-1.938zM14.656 11.188h1.875v1.938h-1.875v-1.938zM18.25 11.188h1.906v1.938h-1.906v-1.938zM5.656 15.031h1.938v1.938h-1.938v-1.938zM9.281 16.969v-1.938h1.906v1.938h-1.906zM12.875 16.969v-1.938h1.906v1.938h-1.906zM18.406 16.969h-1.938v-1.938h1.938v1.938zM16.531 20.781h-9.063v-1.906h9.063v1.906z"></path></svg>`, 4);
var KeyboardIcon = (props => {
  return _tmpl$$c.cloneNode(true);
});

const _tmpl$$b = /*#__PURE__*/template(`<svg version="1.1" viewBox="0 0 12 12" class="ap-icon" aria-label="Pause" role="button"><path d="M1,0 L4,0 L4,12 L1,12 Z"></path><path d="M8,0 L11,0 L11,12 L8,12 Z"></path></svg>`, 6);
var PauseIcon = (props => {
  return _tmpl$$b.cloneNode(true);
});

const _tmpl$$a = /*#__PURE__*/template(`<svg version="1.1" viewBox="0 0 12 12" class="ap-icon" aria-label="Play" role="button"><path d="M1,0 L11,6 L1,12 Z"></path></svg>`, 4);
var PlayIcon = (props => {
  return _tmpl$$a.cloneNode(true);
});

const _tmpl$$9 = /*#__PURE__*/template(`<svg version="1.1" viewBox="0 0 12 12" class="ap-icon ap-icon-fullscreen-on"><path d="M12,0 L7,0 L9,2 L7,4 L8,5 L10,3 L12,5 Z"></path><path d="M0,12 L0,7 L2,9 L4,7 L5,8 L3,10 L5,12 Z"></path></svg>`, 6);
var ShrinkIcon = (props => {
  return _tmpl$$9.cloneNode(true);
});

const _tmpl$$8 = /*#__PURE__*/template(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.5 3.75a.75.75 0 0 0-1.264-.546L5.203 7H2.667a.75.75 0 0 0-.7.48A6.985 6.985 0 0 0 1.5 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h2.535l4.033 3.796a.75.75 0 0 0 1.264-.546V3.75ZM16.45 5.05a.75.75 0 0 0-1.06 1.061 5.5 5.5 0 0 1 0 7.778.75.75 0 0 0 1.06 1.06 7 7 0 0 0 0-9.899Z"></path><path d="M14.329 7.172a.75.75 0 0 0-1.061 1.06 2.5 2.5 0 0 1 0 3.536.75.75 0 0 0 1.06 1.06 4 4 0 0 0 0-5.656Z"></path></svg>`, 6);
var SpeakerOnIcon = (props => {
  return _tmpl$$8.cloneNode(true);
});

const _tmpl$$7 = /*#__PURE__*/template(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5"><path d="M10.047 3.062a.75.75 0 0 1 .453.688v12.5a.75.75 0 0 1-1.264.546L5.203 13H2.667a.75.75 0 0 1-.7-.48A6.985 6.985 0 0 1 1.5 10c0-.887.165-1.737.468-2.52a.75.75 0 0 1 .7-.48h2.535l4.033-3.796a.75.75 0 0 1 .811-.142ZM13.78 7.22a.75.75 0 1 0-1.06 1.06L14.44 10l-1.72 1.72a.75.75 0 0 0 1.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 1 0 1.06-1.06L16.56 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L15.5 8.94l-1.72-1.72Z"></path></svg>`, 4);
var SpeakerOffIcon = (props => {
  return _tmpl$$7.cloneNode(true);
});

const _tmpl$$6 = /*#__PURE__*/template(`<span class="ap-button ap-playback-button" tabindex="0"></span>`, 2),
  _tmpl$2$1 = /*#__PURE__*/template(`<span class="ap-bar"><span class="ap-gutter ap-gutter-empty"></span><span class="ap-gutter ap-gutter-full"></span></span>`, 6),
  _tmpl$3$1 = /*#__PURE__*/template(`<span class="ap-button ap-speaker-button ap-tooltip-container" aria-label="Unmute" role="button" tabindex="0"><span class="ap-tooltip">Unmute (m)</span></span>`, 4),
  _tmpl$4$1 = /*#__PURE__*/template(`<span class="ap-button ap-speaker-button ap-tooltip-container" aria-label="Mute" role="button" tabindex="0"><span class="ap-tooltip">Mute (m)</span></span>`, 4),
  _tmpl$5$1 = /*#__PURE__*/template(`<div class="ap-control-bar"><span class="ap-timer" aria-readonly="true" role="textbox" tabindex="0"><span class="ap-time-elapsed"></span><span class="ap-time-remaining"></span></span><span class="ap-progressbar"></span><span class="ap-button ap-kbd-button ap-tooltip-container" aria-label="Show keyboard shortcuts" role="button" tabindex="0"><span class="ap-tooltip">Keyboard shortcuts (?)</span></span><span class="ap-button ap-fullscreen-button ap-tooltip-container" aria-label="Toggle fullscreen mode" role="button" tabindex="0"><span class="ap-tooltip">Fullscreen (f)</span></span></div>`, 18),
  _tmpl$6$1 = /*#__PURE__*/template(`<span class="ap-marker-container ap-tooltip-container"><span class="ap-marker"></span><span class="ap-tooltip"></span></span>`, 6);
function formatTime(seconds) {
  let s = Math.floor(seconds);
  const d = Math.floor(s / 86400);
  s %= 86400;
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  s %= 60;
  if (d > 0) {
    return `${zeroPad(d)}:${zeroPad(h)}:${zeroPad(m)}:${zeroPad(s)}`;
  } else if (h > 0) {
    return `${zeroPad(h)}:${zeroPad(m)}:${zeroPad(s)}`;
  } else {
    return `${zeroPad(m)}:${zeroPad(s)}`;
  }
}
function zeroPad(n) {
  return n < 10 ? `0${n}` : n.toString();
}
var ControlBar = (props => {
  const e = f => {
    return e => {
      e.preventDefault();
      f(e);
    };
  };
  const currentTime = () => typeof props.currentTime === "number" ? formatTime(props.currentTime) : "--:--";
  const remainingTime = () => typeof props.remainingTime === "number" ? "-" + formatTime(props.remainingTime) : currentTime();
  const markers = createMemo(() => typeof props.duration === "number" ? props.markers.filter(m => m[0] < props.duration) : []);
  const markerPosition = m => `${m[0] / props.duration * 100}%`;
  const markerText = m => {
    if (m[1] === "") {
      return formatTime(m[0]);
    } else {
      return `${formatTime(m[0])} - ${m[1]}`;
    }
  };
  const isPastMarker = m => typeof props.currentTime === "number" ? m[0] <= props.currentTime : false;
  const gutterBarStyle = () => {
    return {
      transform: `scaleX(${props.progress || 0}`
    };
  };
  const calcPosition = e => {
    const barWidth = e.currentTarget.offsetWidth;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pos = Math.max(0, mouseX / barWidth);
    return `${pos * 100}%`;
  };
  const [mouseDown, setMouseDown] = createSignal(false);
  const throttledSeek = throttle(props.onSeekClick, 50);
  const onMouseDown = e => {
    if (e._marker) return;
    if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey || e.button !== 0) return;
    setMouseDown(true);
    props.onSeekClick(calcPosition(e));
  };
  const seekToMarker = index => {
    return e(() => {
      props.onSeekClick({
        marker: index
      });
    });
  };
  const onMove = e => {
    if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) return;
    if (mouseDown()) {
      throttledSeek(calcPosition(e));
    }
  };
  const onDocumentMouseUp = () => {
    setMouseDown(false);
  };
  document.addEventListener("mouseup", onDocumentMouseUp);
  onCleanup(() => {
    document.removeEventListener("mouseup", onDocumentMouseUp);
  });
  return (() => {
    const _el$ = _tmpl$5$1.cloneNode(true),
      _el$3 = _el$.firstChild,
      _el$4 = _el$3.firstChild,
      _el$5 = _el$4.nextSibling,
      _el$6 = _el$3.nextSibling,
      _el$14 = _el$6.nextSibling,
      _el$15 = _el$14.firstChild,
      _el$16 = _el$14.nextSibling,
      _el$17 = _el$16.firstChild;
    const _ref$ = props.ref;
    typeof _ref$ === "function" ? use(_ref$, _el$) : props.ref = _el$;
    insert(_el$, createComponent(Show, {
      get when() {
        return props.isPausable;
      },
      get children() {
        const _el$2 = _tmpl$$6.cloneNode(true);
        addEventListener(_el$2, "click", e(props.onPlayClick));
        insert(_el$2, createComponent(Switch, {
          get children() {
            return [createComponent(Match, {
              get when() {
                return props.isPlaying;
              },
              get children() {
                return createComponent(PauseIcon, {});
              }
            }), createComponent(Match, {
              when: true,
              get children() {
                return createComponent(PlayIcon, {});
              }
            })];
          }
        }));
        return _el$2;
      }
    }), _el$3);
    insert(_el$4, currentTime);
    insert(_el$5, remainingTime);
    insert(_el$6, createComponent(Show, {
      get when() {
        return typeof props.progress === "number" || props.isSeekable;
      },
      get children() {
        const _el$7 = _tmpl$2$1.cloneNode(true),
          _el$8 = _el$7.firstChild,
          _el$9 = _el$8.nextSibling;
        _el$7.$$mousemove = onMove;
        _el$7.$$mousedown = onMouseDown;
        insert(_el$7, createComponent(For, {
          get each() {
            return markers();
          },
          children: (m, i) => (() => {
            const _el$18 = _tmpl$6$1.cloneNode(true),
              _el$19 = _el$18.firstChild,
              _el$20 = _el$19.nextSibling;
            _el$18.$$mousedown = e => {
              e._marker = true;
            };
            addEventListener(_el$18, "click", seekToMarker(i()));
            insert(_el$20, () => markerText(m));
            createRenderEffect(_p$ => {
              const _v$ = markerPosition(m),
                _v$2 = !!isPastMarker(m);
              _v$ !== _p$._v$ && _el$18.style.setProperty("left", _p$._v$ = _v$);
              _v$2 !== _p$._v$2 && _el$19.classList.toggle("ap-marker-past", _p$._v$2 = _v$2);
              return _p$;
            }, {
              _v$: undefined,
              _v$2: undefined
            });
            return _el$18;
          })()
        }), null);
        createRenderEffect(_$p => style(_el$9, gutterBarStyle(), _$p));
        return _el$7;
      }
    }));
    insert(_el$, createComponent(Switch, {
      get children() {
        return [createComponent(Match, {
          get when() {
            return props.isMuted === true;
          },
          get children() {
            const _el$10 = _tmpl$3$1.cloneNode(true),
              _el$11 = _el$10.firstChild;
            addEventListener(_el$10, "click", e(props.onMuteClick));
            insert(_el$10, createComponent(SpeakerOffIcon, {}), _el$11);
            return _el$10;
          }
        }), createComponent(Match, {
          get when() {
            return props.isMuted === false;
          },
          get children() {
            const _el$12 = _tmpl$4$1.cloneNode(true),
              _el$13 = _el$12.firstChild;
            addEventListener(_el$12, "click", e(props.onMuteClick));
            insert(_el$12, createComponent(SpeakerOnIcon, {}), _el$13);
            return _el$12;
          }
        })];
      }
    }), _el$14);
    addEventListener(_el$14, "click", e(props.onHelpClick));
    insert(_el$14, createComponent(KeyboardIcon, {}), _el$15);
    addEventListener(_el$16, "click", e(props.onFullscreenClick));
    insert(_el$16, createComponent(ShrinkIcon, {}), _el$17);
    insert(_el$16, createComponent(ExpandIcon, {}), _el$17);
    createRenderEffect(() => _el$.classList.toggle("ap-seekable", !!props.isSeekable));
    return _el$;
  })();
});
delegateEvents(["click", "mousedown", "mousemove"]);

const _tmpl$$5 = /*#__PURE__*/template(`<div class="ap-overlay ap-overlay-error"><span>💥</span></div>`, 4);
var ErrorOverlay = (props => {
  return _tmpl$$5.cloneNode(true);
});

const _tmpl$$4 = /*#__PURE__*/template(`<div class="ap-overlay ap-overlay-loading"><span class="ap-loader"></span></div>`, 4);
var LoaderOverlay = (props => {
  return _tmpl$$4.cloneNode(true);
});

const _tmpl$$3 = /*#__PURE__*/template(`<div class="ap-overlay ap-overlay-info"><span></span></div>`, 4);
var InfoOverlay = (props => {
  const style$1 = () => {
    return {
      "font-family": props.fontFamily
    };
  };
  return (() => {
    const _el$ = _tmpl$$3.cloneNode(true),
      _el$2 = _el$.firstChild;
    insert(_el$2, () => props.message);
    createRenderEffect(_p$ => {
      const _v$ = !!props.wasPlaying,
        _v$2 = style$1();
      _v$ !== _p$._v$ && _el$.classList.toggle("ap-was-playing", _p$._v$ = _v$);
      _p$._v$2 = style(_el$2, _v$2, _p$._v$2);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined
    });
    return _el$;
  })();
});

const _tmpl$$2 = /*#__PURE__*/template(`<div class="ap-overlay ap-overlay-start"><div class="ap-play-button"><div><span><svg version="1.1" viewBox="0 0 1000.0 1000.0" class="ap-icon"><defs><mask id="small-triangle-mask"><rect width="100%" height="100%" fill="white"></rect><polygon points="700.0 500.0, 400.00000000000006 326.7949192431122, 399.9999999999999 673.2050807568877" fill="black"></polygon></mask></defs><polygon points="1000.0 500.0, 250.0000000000001 66.98729810778059, 249.99999999999977 933.0127018922192" mask="url(#small-triangle-mask)" fill="white" class="ap-play-btn-fill"></polygon><polyline points="673.2050807568878 400.0, 326.7949192431123 600.0" stroke="white" stroke-width="90" class="ap-play-btn-stroke"></polyline></svg></span></div></div></div>`, 22);
var StartOverlay = (props => {
  const e = f => {
    return e => {
      e.preventDefault();
      f(e);
    };
  };
  return (() => {
    const _el$ = _tmpl$$2.cloneNode(true);
    addEventListener(_el$, "click", e(props.onClick));
    return _el$;
  })();
});
delegateEvents(["click"]);

const _tmpl$$1 = /*#__PURE__*/template(`<li><kbd>space</kbd> - pause / resume</li>`, 4),
  _tmpl$2 = /*#__PURE__*/template(`<li><kbd>←</kbd> / <kbd>→</kbd> - rewind / fast-forward by 5 seconds</li>`, 6),
  _tmpl$3 = /*#__PURE__*/template(`<li><kbd>Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd> - rewind / fast-forward by 10%</li>`, 8),
  _tmpl$4 = /*#__PURE__*/template(`<li><kbd>[</kbd> / <kbd>]</kbd> - jump to the previous / next marker</li>`, 6),
  _tmpl$5 = /*#__PURE__*/template(`<li><kbd>0</kbd>, <kbd>1</kbd>, <kbd>2</kbd> ... <kbd>9</kbd> - jump to 0%, 10%, 20% ... 90%</li>`, 10),
  _tmpl$6 = /*#__PURE__*/template(`<li><kbd>,</kbd> / <kbd>.</kbd> - step back / forward, a frame at a time (when paused)</li>`, 6),
  _tmpl$7 = /*#__PURE__*/template(`<li><kbd>m</kbd> - mute / unmute audio</li>`, 4),
  _tmpl$8 = /*#__PURE__*/template(`<div class="ap-overlay ap-overlay-help"><div><div><p>Keyboard shortcuts</p><ul><li><kbd>f</kbd> - toggle fullscreen mode</li><li><kbd>?</kbd> - show this help popup</li></ul></div></div></div>`, 18);
var HelpOverlay = (props => {
  const style$1 = () => {
    return {
      "font-family": props.fontFamily
    };
  };
  const e = f => {
    return e => {
      e.preventDefault();
      f(e);
    };
  };
  return (() => {
    const _el$ = _tmpl$8.cloneNode(true),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.firstChild,
      _el$4 = _el$3.firstChild,
      _el$5 = _el$4.nextSibling,
      _el$12 = _el$5.firstChild,
      _el$14 = _el$12.nextSibling;
    addEventListener(_el$, "click", e(props.onClose));
    _el$2.$$click = e => {
      e.stopPropagation();
    };
    insert(_el$5, createComponent(Show, {
      get when() {
        return props.isPausable;
      },
      get children() {
        return _tmpl$$1.cloneNode(true);
      }
    }), _el$12);
    insert(_el$5, createComponent(Show, {
      get when() {
        return props.isSeekable;
      },
      get children() {
        return [_tmpl$2.cloneNode(true), _tmpl$3.cloneNode(true), _tmpl$4.cloneNode(true), _tmpl$5.cloneNode(true), _tmpl$6.cloneNode(true)];
      }
    }), _el$12);
    insert(_el$5, createComponent(Show, {
      get when() {
        return props.hasAudio;
      },
      get children() {
        return _tmpl$7.cloneNode(true);
      }
    }), _el$14);
    createRenderEffect(_$p => style(_el$, style$1(), _$p));
    return _el$;
  })();
});
delegateEvents(["click"]);

const _tmpl$ = /*#__PURE__*/template(`<div class="ap-wrapper" tabindex="-1"><div></div></div>`, 4);
const CONTROL_BAR_HEIGHT = 32; // must match height of div.ap-control-bar in CSS

var Player = (props => {
  const logger = props.logger;
  const core = props.core;
  const autoPlay = props.autoPlay;
  const [state, setState] = createStore({
    lines: [],
    cursor: undefined,
    charW: props.charW,
    charH: props.charH,
    bordersW: props.bordersW,
    bordersH: props.bordersH,
    containerW: 0,
    containerH: 0,
    isPausable: true,
    isSeekable: true,
    isFullscreen: false,
    currentTime: null,
    remainingTime: null,
    progress: null,
    blink: true,
    cursorHold: false
  });
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isMuted, setIsMuted] = createSignal(undefined);
  const [wasPlaying, setWasPlaying] = createSignal(false);
  const [overlay, setOverlay] = createSignal(!autoPlay ? "start" : null);
  const [infoMessage, setInfoMessage] = createSignal(null);
  const [terminalSize, setTerminalSize] = createSignal({
    cols: props.cols,
    rows: props.rows
  }, {
    equals: (newVal, oldVal) => newVal.cols === oldVal.cols && newVal.rows === oldVal.rows
  });
  const [duration, setDuration] = createSignal(undefined);
  const [markers, setMarkers] = createStore([]);
  const [userActive, setUserActive] = createSignal(false);
  const [isHelpVisible, setIsHelpVisible] = createSignal(false);
  const [originalTheme, setOriginalTheme] = createSignal(undefined);
  const terminalCols = createMemo(() => terminalSize().cols || 80);
  const terminalRows = createMemo(() => terminalSize().rows || 24);
  const controlBarHeight = () => props.controls === false ? 0 : CONTROL_BAR_HEIGHT;
  const controlsVisible = () => props.controls === true || props.controls === "auto" && userActive();
  let frameRequestId;
  let userActivityTimeoutId;
  let timeUpdateIntervalId;
  let blinkIntervalId;
  let wrapperRef;
  let playerRef;
  let terminalRef;
  let controlBarRef;
  let resizeObserver;
  function onPlaying() {
    updateTerminal();
    startBlinking();
    startTimeUpdates();
  }
  function onStopped() {
    stopBlinking();
    stopTimeUpdates();
    updateTime();
  }
  function resize(size_) {
    batch(() => {
      if (size_.rows < terminalSize().rows) {
        setState("lines", state.lines.slice(0, size_.rows));
      }
      setTerminalSize(size_);
    });
  }
  function setPoster(poster) {
    if (poster !== null && !autoPlay) {
      setState({
        lines: poster.lines,
        cursor: poster.cursor
      });
    }
  }
  let resolveCoreReady;
  const coreReady = new Promise(resolve => {
    resolveCoreReady = resolve;
  });
  core.addEventListener("ready", _ref => {
    let {
      isPausable,
      isSeekable,
      poster
    } = _ref;
    setState({
      isPausable,
      isSeekable
    });
    setPoster(poster);
    resolveCoreReady();
  });
  core.addEventListener("metadata", _ref2 => {
    let {
      cols,
      rows,
      duration,
      theme,
      poster,
      markers,
      hasAudio
    } = _ref2;
    batch(() => {
      resize({
        cols,
        rows
      });
      setDuration(duration);
      setOriginalTheme(theme);
      setMarkers(markers);
      setPoster(poster);
      setIsMuted(hasAudio ? false : undefined);
    });
  });
  core.addEventListener("play", () => {
    setOverlay(null);
  });
  core.addEventListener("playing", () => {
    batch(() => {
      setIsPlaying(true);
      setWasPlaying(true);
      setOverlay(null);
      onPlaying();
    });
  });
  core.addEventListener("idle", () => {
    batch(() => {
      setIsPlaying(false);
      onStopped();
    });
  });
  core.addEventListener("loading", () => {
    batch(() => {
      setIsPlaying(false);
      onStopped();
      setOverlay("loader");
    });
  });
  core.addEventListener("offline", _ref3 => {
    let {
      message
    } = _ref3;
    batch(() => {
      setIsPlaying(false);
      onStopped();
      if (message !== undefined) {
        setInfoMessage(message);
        setOverlay("info");
      }
    });
  });
  core.addEventListener("muted", muted => {
    setIsMuted(muted);
  });
  let renderCount = 0;
  core.addEventListener("ended", _ref4 => {
    let {
      message
    } = _ref4;
    batch(() => {
      setIsPlaying(false);
      onStopped();
      if (message !== undefined) {
        setInfoMessage(message);
        setOverlay("info");
      }
    });
    logger.debug(`view: render count: ${renderCount}`);
  });
  core.addEventListener("errored", () => {
    setOverlay("error");
  });
  core.addEventListener("resize", resize);
  core.addEventListener("reset", _ref5 => {
    let {
      cols,
      rows,
      theme
    } = _ref5;
    batch(() => {
      resize({
        cols,
        rows
      });
      setOriginalTheme(theme);
      updateTerminal();
    });
  });
  core.addEventListener("seeked", () => {
    updateTime();
  });
  core.addEventListener("terminalUpdate", () => {
    if (frameRequestId === undefined) {
      frameRequestId = requestAnimationFrame(updateTerminal);
    }
  });
  const setupResizeObserver = () => {
    resizeObserver = new ResizeObserver(debounce(_entries => {
      setState({
        containerW: wrapperRef.offsetWidth,
        containerH: wrapperRef.offsetHeight
      });
      wrapperRef.dispatchEvent(new CustomEvent("resize", {
        detail: {
          el: playerRef
        }
      }));
    }, 10));
    resizeObserver.observe(wrapperRef);
  };
  onMount(async () => {
    logger.info("view: mounted");
    logger.debug("view: font measurements", {
      charW: state.charW,
      charH: state.charH
    });
    setupResizeObserver();
    setState({
      containerW: wrapperRef.offsetWidth,
      containerH: wrapperRef.offsetHeight
    });
  });
  onCleanup(() => {
    core.stop();
    stopBlinking();
    stopTimeUpdates();
    resizeObserver.disconnect();
  });
  const updateTerminal = async () => {
    const changes = await core.getChanges();
    batch(() => {
      if (changes.lines !== undefined) {
        changes.lines.forEach((line, i) => {
          setState("lines", i, reconcile(line));
        });
      }
      if (changes.cursor !== undefined) {
        setState("cursor", reconcile(changes.cursor));
      }
      setState("cursorHold", true);
    });
    frameRequestId = undefined;
    renderCount += 1;
  };
  const terminalElementSize = createMemo(() => {
    const terminalW = state.charW * terminalCols() + state.bordersW;
    const terminalH = state.charH * terminalRows() + state.bordersH;
    let fit = props.fit ?? "width";
    if (fit === "both" || state.isFullscreen) {
      const containerRatio = state.containerW / (state.containerH - controlBarHeight());
      const terminalRatio = terminalW / terminalH;
      if (containerRatio > terminalRatio) {
        fit = "height";
      } else {
        fit = "width";
      }
    }
    if (fit === false || fit === "none") {
      return {};
    } else if (fit === "width") {
      const scale = state.containerW / terminalW;
      return {
        scale: scale,
        width: state.containerW,
        height: terminalH * scale + controlBarHeight()
      };
    } else if (fit === "height") {
      const scale = (state.containerH - controlBarHeight()) / terminalH;
      return {
        scale: scale,
        width: terminalW * scale,
        height: state.containerH
      };
    } else {
      throw `unsupported fit mode: ${fit}`;
    }
  });
  const onFullscreenChange = () => {
    setState("isFullscreen", document.fullscreenElement ?? document.webkitFullscreenElement);
  };
  const toggleFullscreen = () => {
    if (state.isFullscreen) {
      (document.exitFullscreen ?? document.webkitExitFullscreen ?? (() => {})).apply(document);
    } else {
      (wrapperRef.requestFullscreen ?? wrapperRef.webkitRequestFullscreen ?? (() => {})).apply(wrapperRef);
    }
  };
  const toggleHelp = () => {
    if (isHelpVisible()) {
      setIsHelpVisible(false);
    } else {
      core.pause();
      setIsHelpVisible(true);
    }
  };
  const onKeyDown = e => {
    if (e.altKey || e.metaKey || e.ctrlKey) {
      return;
    }
    if (e.key == " ") {
      core.togglePlay();
    } else if (e.key == ",") {
      core.step(-1).then(updateTime);
    } else if (e.key == ".") {
      core.step().then(updateTime);
    } else if (e.key == "f") {
      toggleFullscreen();
    } else if (e.key == "m") {
      toggleMuted();
    } else if (e.key == "[") {
      core.seek({
        marker: "prev"
      });
    } else if (e.key == "]") {
      core.seek({
        marker: "next"
      });
    } else if (e.key.charCodeAt(0) >= 48 && e.key.charCodeAt(0) <= 57) {
      const pos = (e.key.charCodeAt(0) - 48) / 10;
      core.seek(`${pos * 100}%`);
    } else if (e.key == "?") {
      toggleHelp();
    } else if (e.key == "ArrowLeft") {
      if (e.shiftKey) {
        core.seek("<<<");
      } else {
        core.seek("<<");
      }
    } else if (e.key == "ArrowRight") {
      if (e.shiftKey) {
        core.seek(">>>");
      } else {
        core.seek(">>");
      }
    } else if (e.key == "Escape") {
      setIsHelpVisible(false);
    } else {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
  };
  const wrapperOnMouseMove = () => {
    if (state.isFullscreen) {
      onUserActive(true);
    }
  };
  const playerOnMouseLeave = () => {
    if (!state.isFullscreen) {
      onUserActive(false);
    }
  };
  const startTimeUpdates = () => {
    timeUpdateIntervalId = setInterval(updateTime, 100);
  };
  const stopTimeUpdates = () => {
    clearInterval(timeUpdateIntervalId);
  };
  const updateTime = async () => {
    const currentTime = await core.getCurrentTime();
    const remainingTime = await core.getRemainingTime();
    const progress = await core.getProgress();
    setState({
      currentTime,
      remainingTime,
      progress
    });
  };
  const startBlinking = () => {
    blinkIntervalId = setInterval(() => {
      setState(state => {
        const changes = {
          blink: !state.blink
        };
        if (changes.blink) {
          changes.cursorHold = false;
        }
        return changes;
      });
    }, 600);
  };
  const stopBlinking = () => {
    clearInterval(blinkIntervalId);
    setState("blink", true);
  };
  const onUserActive = show => {
    clearTimeout(userActivityTimeoutId);
    if (show) {
      userActivityTimeoutId = setTimeout(() => onUserActive(false), 2000);
    }
    setUserActive(show);
  };
  const theme = createMemo(() => {
    const name = props.theme || "auto/asciinema";
    if (name.slice(0, 5) === "auto/") {
      return {
        name: name.slice(5),
        colors: originalTheme()
      };
    } else {
      return {
        name
      };
    }
  });
  const playerStyle = () => {
    const style = {};
    if ((props.fit === false || props.fit === "none") && props.terminalFontSize !== undefined) {
      if (props.terminalFontSize === "small") {
        style["font-size"] = "12px";
      } else if (props.terminalFontSize === "medium") {
        style["font-size"] = "18px";
      } else if (props.terminalFontSize === "big") {
        style["font-size"] = "24px";
      } else {
        style["font-size"] = props.terminalFontSize;
      }
    }
    const size = terminalElementSize();
    if (size.width !== undefined) {
      style["width"] = `${size.width}px`;
      style["height"] = `${size.height}px`;
    }
    const themeColors = theme().colors;
    if (themeColors) {
      style["--term-color-foreground"] = themeColors.foreground;
      style["--term-color-background"] = themeColors.background;
      themeColors.palette.forEach((color, i) => {
        style[`--term-color-${i}`] = color;
      });
    }
    return style;
  };
  const play = () => {
    coreReady.then(() => core.play());
  };
  const togglePlay = () => {
    coreReady.then(() => core.togglePlay());
  };
  const toggleMuted = () => {
    coreReady.then(() => {
      if (isMuted() === true) {
        core.unmute();
      } else {
        core.mute();
      }
    });
  };
  const seek = pos => {
    coreReady.then(() => core.seek(pos));
  };
  const playerClass = () => `ap-player asciinema-player-theme-${theme().name}`;
  const terminalScale = () => terminalElementSize()?.scale;
  const el = (() => {
    const _el$ = _tmpl$.cloneNode(true),
      _el$2 = _el$.firstChild;
    const _ref$ = wrapperRef;
    typeof _ref$ === "function" ? use(_ref$, _el$) : wrapperRef = _el$;
    _el$.addEventListener("webkitfullscreenchange", onFullscreenChange);
    _el$.addEventListener("fullscreenchange", onFullscreenChange);
    _el$.$$mousemove = wrapperOnMouseMove;
    _el$.$$keydown = onKeyDown;
    const _ref$2 = playerRef;
    typeof _ref$2 === "function" ? use(_ref$2, _el$2) : playerRef = _el$2;
    _el$2.$$mousemove = () => onUserActive(true);
    _el$2.addEventListener("mouseleave", playerOnMouseLeave);
    insert(_el$2, createComponent(Terminal, {
      get cols() {
        return terminalCols();
      },
      get rows() {
        return terminalRows();
      },
      get scale() {
        return terminalScale();
      },
      get blink() {
        return state.blink;
      },
      get lines() {
        return state.lines;
      },
      get cursor() {
        return state.cursor;
      },
      get cursorHold() {
        return state.cursorHold;
      },
      get fontFamily() {
        return props.terminalFontFamily;
      },
      get lineHeight() {
        return props.terminalLineHeight;
      },
      ref(r$) {
        const _ref$3 = terminalRef;
        typeof _ref$3 === "function" ? _ref$3(r$) : terminalRef = r$;
      }
    }), null);
    insert(_el$2, createComponent(Show, {
      get when() {
        return props.controls !== false;
      },
      get children() {
        return createComponent(ControlBar, {
          get duration() {
            return duration();
          },
          get currentTime() {
            return state.currentTime;
          },
          get remainingTime() {
            return state.remainingTime;
          },
          get progress() {
            return state.progress;
          },
          markers: markers,
          get isPlaying() {
            return isPlaying() || overlay() == "loader";
          },
          get isPausable() {
            return state.isPausable;
          },
          get isSeekable() {
            return state.isSeekable;
          },
          get isMuted() {
            return isMuted();
          },
          onPlayClick: togglePlay,
          onFullscreenClick: toggleFullscreen,
          onHelpClick: toggleHelp,
          onSeekClick: seek,
          onMuteClick: toggleMuted,
          ref(r$) {
            const _ref$4 = controlBarRef;
            typeof _ref$4 === "function" ? _ref$4(r$) : controlBarRef = r$;
          }
        });
      }
    }), null);
    insert(_el$2, createComponent(Switch, {
      get children() {
        return [createComponent(Match, {
          get when() {
            return overlay() == "start";
          },
          get children() {
            return createComponent(StartOverlay, {
              onClick: play
            });
          }
        }), createComponent(Match, {
          get when() {
            return overlay() == "loader";
          },
          get children() {
            return createComponent(LoaderOverlay, {});
          }
        }), createComponent(Match, {
          get when() {
            return overlay() == "error";
          },
          get children() {
            return createComponent(ErrorOverlay, {});
          }
        })];
      }
    }), null);
    insert(_el$2, createComponent(Transition, {
      name: "slide",
      get children() {
        return createComponent(Show, {
          get when() {
            return overlay() == "info";
          },
          get children() {
            return createComponent(InfoOverlay, {
              get message() {
                return infoMessage();
              },
              get fontFamily() {
                return props.terminalFontFamily;
              },
              get wasPlaying() {
                return wasPlaying();
              }
            });
          }
        });
      }
    }), null);
    insert(_el$2, createComponent(Show, {
      get when() {
        return isHelpVisible();
      },
      get children() {
        return createComponent(HelpOverlay, {
          get fontFamily() {
            return props.terminalFontFamily;
          },
          onClose: () => setIsHelpVisible(false),
          get isPausable() {
            return state.isPausable;
          },
          get isSeekable() {
            return state.isSeekable;
          },
          get hasAudio() {
            return isMuted() !== undefined;
          }
        });
      }
    }), null);
    createRenderEffect(_p$ => {
      const _v$ = !!controlsVisible(),
        _v$2 = playerClass(),
        _v$3 = playerStyle();
      _v$ !== _p$._v$ && _el$.classList.toggle("ap-hud", _p$._v$ = _v$);
      _v$2 !== _p$._v$2 && className(_el$2, _p$._v$2 = _v$2);
      _p$._v$3 = style(_el$2, _v$3, _p$._v$3);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined
    });
    return _el$;
  })();
  return el;
});
delegateEvents(["keydown", "mousemove"]);

function mount(core, elem) {
  let opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const metrics = measureTerminal(opts.terminalFontFamily, opts.terminalLineHeight);
  const props = {
    core: core,
    logger: opts.logger,
    cols: opts.cols,
    rows: opts.rows,
    fit: opts.fit,
    controls: opts.controls,
    autoPlay: opts.autoPlay,
    terminalFontSize: opts.terminalFontSize,
    terminalFontFamily: opts.terminalFontFamily,
    terminalLineHeight: opts.terminalLineHeight,
    theme: opts.theme,
    ...metrics
  };
  let el;
  const dispose = render(() => {
    el = createComponent(Player, props);
    return el;
  }, elem);
  return {
    el: el,
    dispose: dispose
  };
}
function measureTerminal(fontFamily, lineHeight) {
  const cols = 80;
  const rows = 24;
  const div = document.createElement("div");
  div.style.height = "0px";
  div.style.overflow = "hidden";
  div.style.fontSize = "15px"; // must match font-size of div.asciinema-player in CSS
  document.body.appendChild(div);
  let el;
  const dispose = render(() => {
    el = createComponent(Terminal, {
      cols: cols,
      rows: rows,
      lineHeight: lineHeight,
      fontFamily: fontFamily,
      lines: []
    });
    return el;
  }, div);
  const metrics = {
    charW: el.clientWidth / cols,
    charH: el.clientHeight / rows,
    bordersW: el.offsetWidth - el.clientWidth,
    bordersH: el.offsetHeight - el.clientHeight
  };
  dispose();
  document.body.removeChild(div);
  return metrics;
}

const CORE_OPTS = ['autoPlay', 'autoplay', 'cols', 'idleTimeLimit', 'loop', 'markers', 'pauseOnMarkers', 'poster', 'preload', 'rows', 'speed', 'startAt', 'audioUrl'];
const UI_OPTS = ['autoPlay', 'autoplay', 'cols', 'controls', 'fit', 'rows', 'terminalFontFamily', 'terminalFontSize', 'terminalLineHeight', 'theme'];
function coreOpts(inputOpts) {
  let overrides = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const opts = Object.fromEntries(Object.entries(inputOpts).filter(_ref => {
    let [key] = _ref;
    return CORE_OPTS.includes(key);
  }));
  opts.autoPlay ??= opts.autoplay;
  opts.speed ??= 1.0;
  return {
    ...opts,
    ...overrides
  };
}
function uiOpts(inputOpts) {
  let overrides = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const opts = Object.fromEntries(Object.entries(inputOpts).filter(_ref2 => {
    let [key] = _ref2;
    return UI_OPTS.includes(key);
  }));
  opts.autoPlay ??= opts.autoplay;
  opts.controls ??= "auto";
  return {
    ...opts,
    ...overrides
  };
}

function create(src, elem) {
  let opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const logger = opts.logger ?? new DummyLogger();
  const core = new Core(src, coreOpts(opts, {
    logger
  }));
  const {
    el,
    dispose
  } = mount(core, elem, uiOpts(opts, {
    logger
  }));
  const ready = core.init();
  const player = {
    el,
    dispose,
    getCurrentTime: () => ready.then(core.getCurrentTime.bind(core)),
    getDuration: () => ready.then(core.getDuration.bind(core)),
    play: () => ready.then(core.play.bind(core)),
    pause: () => ready.then(core.pause.bind(core)),
    seek: pos => ready.then(() => core.seek(pos))
  };
  player.addEventListener = (name, callback) => {
    return core.addEventListener(name, callback.bind(player));
  };
  return player;
}

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = "div.ap-wrapper {\n  outline: none;\n  height: 100%;\n  display: flex;\n  justify-content: center;\n}\ndiv.ap-wrapper .title-bar {\n  display: none;\n  top: -78px;\n  transition: top 0.15s linear;\n  position: absolute;\n  left: 0;\n  right: 0;\n  box-sizing: content-box;\n  font-size: 20px;\n  line-height: 1em;\n  padding: 15px;\n  font-family: sans-serif;\n  color: white;\n  background-color: rgba(0, 0, 0, 0.8);\n}\ndiv.ap-wrapper .title-bar img {\n  vertical-align: middle;\n  height: 48px;\n  margin-right: 16px;\n}\ndiv.ap-wrapper .title-bar a {\n  color: white;\n  text-decoration: underline;\n}\ndiv.ap-wrapper .title-bar a:hover {\n  text-decoration: none;\n}\ndiv.ap-wrapper:fullscreen {\n  background-color: #000;\n  width: 100%;\n  align-items: center;\n}\ndiv.ap-wrapper:fullscreen .title-bar {\n  display: initial;\n}\ndiv.ap-wrapper:fullscreen.hud .title-bar {\n  top: 0;\n}\ndiv.ap-wrapper div.ap-player {\n  text-align: left;\n  display: inline-block;\n  padding: 0px;\n  position: relative;\n  box-sizing: content-box;\n  overflow: hidden;\n  max-width: 100%;\n  border-radius: 4px;\n  font-size: 15px;\n  background-color: var(--term-color-background);\n}\n.ap-player {\n  --term-color-foreground: #ffffff;\n  --term-color-background: #000000;\n  --term-color-0: var(--term-color-foreground);\n  --term-color-1: var(--term-color-foreground);\n  --term-color-2: var(--term-color-foreground);\n  --term-color-3: var(--term-color-foreground);\n  --term-color-4: var(--term-color-foreground);\n  --term-color-5: var(--term-color-foreground);\n  --term-color-6: var(--term-color-foreground);\n  --term-color-7: var(--term-color-foreground);\n  --term-color-8: var(--term-color-0);\n  --term-color-9: var(--term-color-1);\n  --term-color-10: var(--term-color-2);\n  --term-color-11: var(--term-color-3);\n  --term-color-12: var(--term-color-4);\n  --term-color-13: var(--term-color-5);\n  --term-color-14: var(--term-color-6);\n  --term-color-15: var(--term-color-7);\n}\n.ap-player .fg-0 {\n  --fg: var(--term-color-0);\n}\n.ap-player .bg-0 {\n  --bg: var(--term-color-0);\n}\n.ap-player .fg-1 {\n  --fg: var(--term-color-1);\n}\n.ap-player .bg-1 {\n  --bg: var(--term-color-1);\n}\n.ap-player .fg-2 {\n  --fg: var(--term-color-2);\n}\n.ap-player .bg-2 {\n  --bg: var(--term-color-2);\n}\n.ap-player .fg-3 {\n  --fg: var(--term-color-3);\n}\n.ap-player .bg-3 {\n  --bg: var(--term-color-3);\n}\n.ap-player .fg-4 {\n  --fg: var(--term-color-4);\n}\n.ap-player .bg-4 {\n  --bg: var(--term-color-4);\n}\n.ap-player .fg-5 {\n  --fg: var(--term-color-5);\n}\n.ap-player .bg-5 {\n  --bg: var(--term-color-5);\n}\n.ap-player .fg-6 {\n  --fg: var(--term-color-6);\n}\n.ap-player .bg-6 {\n  --bg: var(--term-color-6);\n}\n.ap-player .fg-7 {\n  --fg: var(--term-color-7);\n}\n.ap-player .bg-7 {\n  --bg: var(--term-color-7);\n}\n.ap-player .fg-8 {\n  --fg: var(--term-color-8);\n}\n.ap-player .bg-8 {\n  --bg: var(--term-color-8);\n}\n.ap-player .fg-9 {\n  --fg: var(--term-color-9);\n}\n.ap-player .bg-9 {\n  --bg: var(--term-color-9);\n}\n.ap-player .fg-10 {\n  --fg: var(--term-color-10);\n}\n.ap-player .bg-10 {\n  --bg: var(--term-color-10);\n}\n.ap-player .fg-11 {\n  --fg: var(--term-color-11);\n}\n.ap-player .bg-11 {\n  --bg: var(--term-color-11);\n}\n.ap-player .fg-12 {\n  --fg: var(--term-color-12);\n}\n.ap-player .bg-12 {\n  --bg: var(--term-color-12);\n}\n.ap-player .fg-13 {\n  --fg: var(--term-color-13);\n}\n.ap-player .bg-13 {\n  --bg: var(--term-color-13);\n}\n.ap-player .fg-14 {\n  --fg: var(--term-color-14);\n}\n.ap-player .bg-14 {\n  --bg: var(--term-color-14);\n}\n.ap-player .fg-15 {\n  --fg: var(--term-color-15);\n}\n.ap-player .bg-15 {\n  --bg: var(--term-color-15);\n}\n.ap-player .fg-8,\n.ap-player .fg-9,\n.ap-player .fg-10,\n.ap-player .fg-11,\n.ap-player .fg-12,\n.ap-player .fg-13,\n.ap-player .fg-14,\n.ap-player .fg-15 {\n  font-weight: bold;\n}\npre.ap-terminal {\n  box-sizing: content-box;\n  overflow: hidden;\n  padding: 0;\n  margin: 0px;\n  display: block;\n  white-space: pre;\n  word-wrap: normal;\n  word-break: normal;\n  border-radius: 0;\n  border-style: solid;\n  cursor: text;\n  border-width: 0.75em;\n  color: var(--term-color-foreground);\n  background-color: var(--term-color-background);\n  border-color: var(--term-color-background);\n  outline: none;\n  line-height: var(--term-line-height);\n  font-family: Consolas, Menlo, 'Bitstream Vera Sans Mono', monospace, 'Powerline Symbols';\n  font-variant-ligatures: none;\n}\npre.ap-terminal .ap-line {\n  letter-spacing: normal;\n  overflow: hidden;\n}\npre.ap-terminal .ap-line span {\n  padding: 0;\n  display: inline-block;\n  height: 100%;\n}\npre.ap-terminal .ap-line {\n  display: block;\n  width: 100%;\n  height: var(--term-line-height);\n  position: relative;\n}\npre.ap-terminal .ap-line span {\n  position: absolute;\n  left: calc(100% * var(--offset) / var(--term-cols));\n  color: var(--fg);\n  background-color: var(--bg);\n}\npre.ap-terminal .ap-line .ap-inverse {\n  color: var(--bg);\n  background-color: var(--fg);\n}\npre.ap-terminal .ap-line .cp-2580 {\n  border-top: calc(0.5 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2581 {\n  border-bottom: calc(0.125 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2582 {\n  border-bottom: calc(0.25 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2583 {\n  border-bottom: calc(0.375 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2584 {\n  border-bottom: calc(0.5 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2585 {\n  border-bottom: calc(0.625 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2586 {\n  border-bottom: calc(0.75 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2587 {\n  border-bottom: calc(0.875 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2588 {\n  background-color: var(--fg);\n}\npre.ap-terminal .ap-line .cp-2589 {\n  border-left: 0.875ch solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-258a {\n  border-left: 0.75ch solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-258b {\n  border-left: 0.625ch solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-258c {\n  border-left: 0.5ch solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-258d {\n  border-left: 0.375ch solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-258e {\n  border-left: 0.25ch solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-258f {\n  border-left: 0.125ch solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2590 {\n  border-right: 0.5ch solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2591 {\n  background-color: color-mix(in srgb, var(--fg) 25%, var(--bg));\n}\npre.ap-terminal .ap-line .cp-2592 {\n  background-color: color-mix(in srgb, var(--fg) 50%, var(--bg));\n}\npre.ap-terminal .ap-line .cp-2593 {\n  background-color: color-mix(in srgb, var(--fg) 75%, var(--bg));\n}\npre.ap-terminal .ap-line .cp-2594 {\n  border-top: calc(0.125 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2595 {\n  border-right: 0.125ch solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2596 {\n  border-right: 0.5ch solid var(--bg);\n  border-top: calc(0.5 * var(--term-line-height)) solid var(--bg);\n  background-color: var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2597 {\n  border-left: 0.5ch solid var(--bg);\n  border-top: calc(0.5 * var(--term-line-height)) solid var(--bg);\n  background-color: var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2598 {\n  border-right: 0.5ch solid var(--bg);\n  border-bottom: calc(0.5 * var(--term-line-height)) solid var(--bg);\n  background-color: var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-2599 {\n  border-left: 0.5ch solid var(--fg);\n  border-bottom: calc(0.5 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-259a {\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-259a::before,\npre.ap-terminal .ap-line .cp-259a::after {\n  content: '';\n  position: absolute;\n  width: 0.5ch;\n  height: calc(0.5 * var(--term-line-height));\n  background-color: var(--fg);\n}\npre.ap-terminal .ap-line .cp-259a::before {\n  top: 0;\n  left: 0;\n}\npre.ap-terminal .ap-line .cp-259a::after {\n  bottom: 0;\n  right: 0;\n}\npre.ap-terminal .ap-line .cp-259b {\n  border-left: 0.5ch solid var(--fg);\n  border-top: calc(0.5 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-259c {\n  border-right: 0.5ch solid var(--fg);\n  border-top: calc(0.5 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-259d {\n  border-left: 0.5ch solid var(--bg);\n  border-bottom: calc(0.5 * var(--term-line-height)) solid var(--bg);\n  background-color: var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-259e {\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-259e::before,\npre.ap-terminal .ap-line .cp-259e::after {\n  content: '';\n  position: absolute;\n  width: 0.5ch;\n  height: calc(0.5 * var(--term-line-height));\n  background-color: var(--fg);\n}\npre.ap-terminal .ap-line .cp-259e::before {\n  top: 0;\n  right: 0;\n}\npre.ap-terminal .ap-line .cp-259e::after {\n  bottom: 0;\n  left: 0;\n}\npre.ap-terminal .ap-line .cp-259f {\n  border-right: 0.5ch solid var(--fg);\n  border-bottom: calc(0.5 * var(--term-line-height)) solid var(--fg);\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-e0b0 {\n  border-left: 1ch solid var(--fg);\n  border-top: calc(0.5 * var(--term-line-height)) solid transparent;\n  border-bottom: calc(0.5 * var(--term-line-height)) solid transparent;\n  box-sizing: border-box;\n}\npre.ap-terminal .ap-line .cp-e0b2 {\n  border-right: 1ch solid var(--fg);\n  border-top: calc(0.5 * var(--term-line-height)) solid transparent;\n  border-bottom: calc(0.5 * var(--term-line-height)) solid transparent;\n  box-sizing: border-box;\n}\npre.ap-terminal.ap-cursor-on .ap-line .ap-cursor {\n  color: var(--bg);\n  background-color: var(--fg);\n  border-radius: 0.05em;\n}\npre.ap-terminal.ap-cursor-on .ap-line .ap-cursor.ap-inverse {\n  color: var(--fg);\n  background-color: var(--bg);\n}\npre.ap-terminal:not(.ap-blink) .ap-line .ap-blink {\n  color: transparent;\n  border-color: transparent;\n}\npre.ap-terminal .ap-bright {\n  font-weight: bold;\n}\npre.ap-terminal .ap-faint {\n  opacity: 0.5;\n}\npre.ap-terminal .ap-underline {\n  text-decoration: underline;\n}\npre.ap-terminal .ap-italic {\n  font-style: italic;\n}\npre.ap-terminal .ap-strikethrough {\n  text-decoration: line-through;\n}\n.ap-line span {\n  --fg: var(--term-color-foreground);\n  --bg: var(--term-color-background);\n}\ndiv.ap-player div.ap-control-bar {\n  width: 100%;\n  height: 32px;\n  display: flex;\n  justify-content: space-between;\n  align-items: stretch;\n  color: var(--term-color-foreground);\n  box-sizing: content-box;\n  line-height: 1;\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  opacity: 0;\n  transition: opacity 0.15s linear;\n  user-select: none;\n  border-top: 2px solid color-mix(in oklab, var(--term-color-background) 80%, var(--term-color-foreground));\n  z-index: 30;\n}\ndiv.ap-player div.ap-control-bar * {\n  box-sizing: inherit;\n}\ndiv.ap-control-bar svg.ap-icon path {\n  fill: var(--term-color-foreground);\n}\ndiv.ap-control-bar span.ap-button {\n  display: flex;\n  flex: 0 0 auto;\n  cursor: pointer;\n}\ndiv.ap-control-bar span.ap-playback-button {\n  width: 12px;\n  height: 12px;\n  padding: 10px;\n  margin: 0 0 0 2px;\n}\ndiv.ap-control-bar span.ap-playback-button svg {\n  height: 12px;\n  width: 12px;\n}\ndiv.ap-control-bar span.ap-timer {\n  display: flex;\n  flex: 0 0 auto;\n  min-width: 50px;\n  margin: 0 10px;\n  height: 100%;\n  text-align: center;\n  font-size: 13px;\n  line-height: 100%;\n  cursor: default;\n}\ndiv.ap-control-bar span.ap-timer span {\n  font-family: Consolas, Menlo, 'Bitstream Vera Sans Mono', monospace;\n  font-size: inherit;\n  font-weight: 600;\n  margin: auto;\n}\ndiv.ap-control-bar span.ap-timer .ap-time-remaining {\n  display: none;\n}\ndiv.ap-control-bar span.ap-timer:hover .ap-time-elapsed {\n  display: none;\n}\ndiv.ap-control-bar span.ap-timer:hover .ap-time-remaining {\n  display: flex;\n}\ndiv.ap-control-bar .ap-progressbar {\n  display: block;\n  flex: 1 1 auto;\n  height: 100%;\n  padding: 0 10px;\n}\ndiv.ap-control-bar .ap-progressbar .ap-bar {\n  display: block;\n  position: relative;\n  cursor: default;\n  height: 100%;\n  font-size: 0;\n}\ndiv.ap-control-bar .ap-progressbar .ap-bar .ap-gutter {\n  display: block;\n  position: absolute;\n  top: 15px;\n  left: 0;\n  right: 0;\n  height: 3px;\n}\ndiv.ap-control-bar .ap-progressbar .ap-bar .ap-gutter-empty {\n  background-color: color-mix(in oklab, var(--term-color-foreground) 20%, var(--term-color-background));\n}\ndiv.ap-control-bar .ap-progressbar .ap-bar .ap-gutter-full {\n  width: 100%;\n  transform-origin: left center;\n  background-color: var(--term-color-foreground);\n  border-radius: 3px;\n}\ndiv.ap-control-bar.ap-seekable .ap-progressbar .ap-bar {\n  cursor: pointer;\n}\ndiv.ap-control-bar .ap-fullscreen-button {\n  width: 14px;\n  height: 14px;\n  padding: 9px;\n  margin: 0 2px 0 4px;\n}\ndiv.ap-control-bar .ap-fullscreen-button svg {\n  width: 14px;\n  height: 14px;\n}\ndiv.ap-control-bar .ap-fullscreen-button svg.ap-icon-fullscreen-on {\n  display: inline;\n}\ndiv.ap-control-bar .ap-fullscreen-button svg.ap-icon-fullscreen-off {\n  display: none;\n}\ndiv.ap-control-bar .ap-fullscreen-button .ap-tooltip {\n  right: 5px;\n  left: initial;\n  transform: none;\n}\ndiv.ap-control-bar .ap-kbd-button {\n  height: 14px;\n  padding: 9px;\n  margin: 0 0 0 4px;\n}\ndiv.ap-control-bar .ap-kbd-button svg {\n  width: 26px;\n  height: 14px;\n}\ndiv.ap-control-bar .ap-kbd-button .ap-tooltip {\n  right: 5px;\n  left: initial;\n  transform: none;\n}\ndiv.ap-control-bar .ap-speaker-button {\n  width: 19px;\n  padding: 6px 9px;\n  margin: 0 0 0 4px;\n  position: relative;\n}\ndiv.ap-control-bar .ap-speaker-button svg {\n  width: 19px;\n}\ndiv.ap-control-bar .ap-speaker-button .ap-tooltip {\n  left: -50%;\n  transform: none;\n}\ndiv.ap-wrapper.ap-hud .ap-control-bar {\n  opacity: 1;\n}\ndiv.ap-wrapper:fullscreen .ap-fullscreen-button svg.ap-icon-fullscreen-on {\n  display: none;\n}\ndiv.ap-wrapper:fullscreen .ap-fullscreen-button svg.ap-icon-fullscreen-off {\n  display: inline;\n}\nspan.ap-progressbar span.ap-marker-container {\n  display: block;\n  top: 0;\n  bottom: 0;\n  width: 21px;\n  position: absolute;\n  margin-left: -10px;\n}\nspan.ap-marker-container span.ap-marker {\n  display: block;\n  top: 13px;\n  bottom: 12px;\n  left: 7px;\n  right: 7px;\n  background-color: color-mix(in oklab, var(--term-color-foreground) 33%, var(--term-color-background));\n  position: absolute;\n  transition: top 0.1s, bottom 0.1s, left 0.1s, right 0.1s, background-color 0.1s;\n  border-radius: 50%;\n}\nspan.ap-marker-container span.ap-marker.ap-marker-past {\n  background-color: var(--term-color-foreground);\n}\nspan.ap-marker-container span.ap-marker:hover,\nspan.ap-marker-container:hover span.ap-marker {\n  background-color: var(--term-color-foreground);\n  top: 11px;\n  bottom: 10px;\n  left: 5px;\n  right: 5px;\n}\n.ap-tooltip-container span.ap-tooltip {\n  visibility: hidden;\n  background-color: var(--term-color-foreground);\n  color: var(--term-color-background);\n  font-family: Consolas, Menlo, 'Bitstream Vera Sans Mono', monospace;\n  font-weight: bold;\n  text-align: center;\n  padding: 0 0.5em;\n  border-radius: 4px;\n  position: absolute;\n  z-index: 1;\n  white-space: nowrap;\n  /* Prevents the text from wrapping and makes sure the tooltip width adapts to the text length */\n  font-size: 13px;\n  line-height: 2em;\n  bottom: 100%;\n  left: 50%;\n  transform: translateX(-50%);\n}\n.ap-tooltip-container:hover span.ap-tooltip {\n  visibility: visible;\n}\n.ap-player .ap-overlay {\n  z-index: 10;\n  background-repeat: no-repeat;\n  background-position: center;\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n.ap-player .ap-overlay-start {\n  cursor: pointer;\n}\n.ap-player .ap-overlay-start .ap-play-button {\n  font-size: 0px;\n  position: absolute;\n  left: 0;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  text-align: center;\n  color: white;\n  height: 80px;\n  max-height: 66%;\n  margin: auto;\n}\n.ap-player .ap-overlay-start .ap-play-button div {\n  height: 100%;\n}\n.ap-player .ap-overlay-start .ap-play-button div span {\n  height: 100%;\n  display: block;\n}\n.ap-player .ap-overlay-start .ap-play-button div span svg {\n  height: 100%;\n  display: inline-block;\n}\n.ap-player .ap-overlay-start .ap-play-button svg {\n  filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.4));\n}\n.ap-player .ap-overlay-loading .ap-loader {\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n  display: inline-block;\n  position: relative;\n  border: 10px solid;\n  border-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.5) rgba(255, 255, 255, 0.7) #ffffff;\n  border-color: color-mix(in srgb, var(--term-color-foreground) 30%, var(--term-color-background)) color-mix(in srgb, var(--term-color-foreground) 50%, var(--term-color-background)) color-mix(in srgb, var(--term-color-foreground) 70%, var(--term-color-background)) color-mix(in srgb, var(--term-color-foreground) 100%, var(--term-color-background));\n  box-sizing: border-box;\n  animation: ap-loader-rotation 1s linear infinite;\n}\n.ap-player .ap-overlay-info {\n  background-color: var(--term-color-background);\n}\n.ap-player .ap-overlay-info span {\n  font-family: Consolas, Menlo, 'Bitstream Vera Sans Mono', monospace, 'Powerline Symbols';\n  font-variant-ligatures: none;\n  font-size: 2em;\n  color: var(--term-color-foreground);\n}\n.ap-player .ap-overlay-info span .ap-line {\n  letter-spacing: normal;\n  overflow: hidden;\n}\n.ap-player .ap-overlay-info span .ap-line span {\n  padding: 0;\n  display: inline-block;\n  height: 100%;\n}\n.ap-player .ap-overlay-help {\n  background-color: rgba(0, 0, 0, 0.8);\n  container-type: inline-size;\n}\n.ap-player .ap-overlay-help > div {\n  font-family: Consolas, Menlo, 'Bitstream Vera Sans Mono', monospace, 'Powerline Symbols';\n  font-variant-ligatures: none;\n  max-width: 85%;\n  max-height: 85%;\n  font-size: 18px;\n  color: var(--term-color-foreground);\n  box-sizing: border-box;\n  margin-bottom: 32px;\n}\n.ap-player .ap-overlay-help > div .ap-line {\n  letter-spacing: normal;\n  overflow: hidden;\n}\n.ap-player .ap-overlay-help > div .ap-line span {\n  padding: 0;\n  display: inline-block;\n  height: 100%;\n}\n.ap-player .ap-overlay-help > div div {\n  padding: calc(min(4cqw, 40px));\n  font-size: calc(min(1.9cqw, 18px));\n  background-color: var(--term-color-background);\n  border: 1px solid color-mix(in oklab, var(--term-color-background) 90%, var(--term-color-foreground));\n  border-radius: 6px;\n}\n.ap-player .ap-overlay-help > div div p {\n  font-weight: bold;\n  margin: 0 0 2em 0;\n}\n.ap-player .ap-overlay-help > div div ul {\n  list-style: none;\n  padding: 0;\n}\n.ap-player .ap-overlay-help > div div ul li {\n  margin: 0 0 0.75em 0;\n}\n.ap-player .ap-overlay-help > div div kbd {\n  color: var(--term-color-background);\n  background-color: var(--term-color-foreground);\n  padding: 0.2em 0.5em;\n  border-radius: 0.2em;\n  font-family: inherit;\n  font-size: 0.85em;\n  border: none;\n  margin: 0;\n}\n.ap-player .ap-overlay-error span {\n  font-size: 8em;\n}\n.ap-player .slide-enter-active {\n  transition: opacity 0.2s;\n}\n.ap-player .slide-enter-active.ap-was-playing {\n  transition: top 0.2s ease-out, opacity 0.2s;\n}\n.ap-player .slide-exit-active {\n  transition: top 0.2s ease-in, opacity 0.2s;\n}\n.ap-player .slide-enter {\n  top: -50%;\n  opacity: 0;\n}\n.ap-player .slide-enter-to {\n  top: 0%;\n}\n.ap-player .slide-enter,\n.ap-player .slide-enter-to,\n.ap-player .slide-exit,\n.ap-player .slide-exit-to {\n  bottom: auto;\n  height: 100%;\n}\n.ap-player .slide-exit {\n  top: 0%;\n}\n.ap-player .slide-exit-to {\n  top: -50%;\n  opacity: 0;\n}\n@keyframes ap-loader-rotation {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.ap-terminal .fg-16 {\n  --fg: #000000;\n}\n.ap-terminal .bg-16 {\n  --bg: #000000;\n}\n.ap-terminal .fg-17 {\n  --fg: #00005f;\n}\n.ap-terminal .bg-17 {\n  --bg: #00005f;\n}\n.ap-terminal .fg-18 {\n  --fg: #000087;\n}\n.ap-terminal .bg-18 {\n  --bg: #000087;\n}\n.ap-terminal .fg-19 {\n  --fg: #0000af;\n}\n.ap-terminal .bg-19 {\n  --bg: #0000af;\n}\n.ap-terminal .fg-20 {\n  --fg: #0000d7;\n}\n.ap-terminal .bg-20 {\n  --bg: #0000d7;\n}\n.ap-terminal .fg-21 {\n  --fg: #0000ff;\n}\n.ap-terminal .bg-21 {\n  --bg: #0000ff;\n}\n.ap-terminal .fg-22 {\n  --fg: #005f00;\n}\n.ap-terminal .bg-22 {\n  --bg: #005f00;\n}\n.ap-terminal .fg-23 {\n  --fg: #005f5f;\n}\n.ap-terminal .bg-23 {\n  --bg: #005f5f;\n}\n.ap-terminal .fg-24 {\n  --fg: #005f87;\n}\n.ap-terminal .bg-24 {\n  --bg: #005f87;\n}\n.ap-terminal .fg-25 {\n  --fg: #005faf;\n}\n.ap-terminal .bg-25 {\n  --bg: #005faf;\n}\n.ap-terminal .fg-26 {\n  --fg: #005fd7;\n}\n.ap-terminal .bg-26 {\n  --bg: #005fd7;\n}\n.ap-terminal .fg-27 {\n  --fg: #005fff;\n}\n.ap-terminal .bg-27 {\n  --bg: #005fff;\n}\n.ap-terminal .fg-28 {\n  --fg: #008700;\n}\n.ap-terminal .bg-28 {\n  --bg: #008700;\n}\n.ap-terminal .fg-29 {\n  --fg: #00875f;\n}\n.ap-terminal .bg-29 {\n  --bg: #00875f;\n}\n.ap-terminal .fg-30 {\n  --fg: #008787;\n}\n.ap-terminal .bg-30 {\n  --bg: #008787;\n}\n.ap-terminal .fg-31 {\n  --fg: #0087af;\n}\n.ap-terminal .bg-31 {\n  --bg: #0087af;\n}\n.ap-terminal .fg-32 {\n  --fg: #0087d7;\n}\n.ap-terminal .bg-32 {\n  --bg: #0087d7;\n}\n.ap-terminal .fg-33 {\n  --fg: #0087ff;\n}\n.ap-terminal .bg-33 {\n  --bg: #0087ff;\n}\n.ap-terminal .fg-34 {\n  --fg: #00af00;\n}\n.ap-terminal .bg-34 {\n  --bg: #00af00;\n}\n.ap-terminal .fg-35 {\n  --fg: #00af5f;\n}\n.ap-terminal .bg-35 {\n  --bg: #00af5f;\n}\n.ap-terminal .fg-36 {\n  --fg: #00af87;\n}\n.ap-terminal .bg-36 {\n  --bg: #00af87;\n}\n.ap-terminal .fg-37 {\n  --fg: #00afaf;\n}\n.ap-terminal .bg-37 {\n  --bg: #00afaf;\n}\n.ap-terminal .fg-38 {\n  --fg: #00afd7;\n}\n.ap-terminal .bg-38 {\n  --bg: #00afd7;\n}\n.ap-terminal .fg-39 {\n  --fg: #00afff;\n}\n.ap-terminal .bg-39 {\n  --bg: #00afff;\n}\n.ap-terminal .fg-40 {\n  --fg: #00d700;\n}\n.ap-terminal .bg-40 {\n  --bg: #00d700;\n}\n.ap-terminal .fg-41 {\n  --fg: #00d75f;\n}\n.ap-terminal .bg-41 {\n  --bg: #00d75f;\n}\n.ap-terminal .fg-42 {\n  --fg: #00d787;\n}\n.ap-terminal .bg-42 {\n  --bg: #00d787;\n}\n.ap-terminal .fg-43 {\n  --fg: #00d7af;\n}\n.ap-terminal .bg-43 {\n  --bg: #00d7af;\n}\n.ap-terminal .fg-44 {\n  --fg: #00d7d7;\n}\n.ap-terminal .bg-44 {\n  --bg: #00d7d7;\n}\n.ap-terminal .fg-45 {\n  --fg: #00d7ff;\n}\n.ap-terminal .bg-45 {\n  --bg: #00d7ff;\n}\n.ap-terminal .fg-46 {\n  --fg: #00ff00;\n}\n.ap-terminal .bg-46 {\n  --bg: #00ff00;\n}\n.ap-terminal .fg-47 {\n  --fg: #00ff5f;\n}\n.ap-terminal .bg-47 {\n  --bg: #00ff5f;\n}\n.ap-terminal .fg-48 {\n  --fg: #00ff87;\n}\n.ap-terminal .bg-48 {\n  --bg: #00ff87;\n}\n.ap-terminal .fg-49 {\n  --fg: #00ffaf;\n}\n.ap-terminal .bg-49 {\n  --bg: #00ffaf;\n}\n.ap-terminal .fg-50 {\n  --fg: #00ffd7;\n}\n.ap-terminal .bg-50 {\n  --bg: #00ffd7;\n}\n.ap-terminal .fg-51 {\n  --fg: #00ffff;\n}\n.ap-terminal .bg-51 {\n  --bg: #00ffff;\n}\n.ap-terminal .fg-52 {\n  --fg: #5f0000;\n}\n.ap-terminal .bg-52 {\n  --bg: #5f0000;\n}\n.ap-terminal .fg-53 {\n  --fg: #5f005f;\n}\n.ap-terminal .bg-53 {\n  --bg: #5f005f;\n}\n.ap-terminal .fg-54 {\n  --fg: #5f0087;\n}\n.ap-terminal .bg-54 {\n  --bg: #5f0087;\n}\n.ap-terminal .fg-55 {\n  --fg: #5f00af;\n}\n.ap-terminal .bg-55 {\n  --bg: #5f00af;\n}\n.ap-terminal .fg-56 {\n  --fg: #5f00d7;\n}\n.ap-terminal .bg-56 {\n  --bg: #5f00d7;\n}\n.ap-terminal .fg-57 {\n  --fg: #5f00ff;\n}\n.ap-terminal .bg-57 {\n  --bg: #5f00ff;\n}\n.ap-terminal .fg-58 {\n  --fg: #5f5f00;\n}\n.ap-terminal .bg-58 {\n  --bg: #5f5f00;\n}\n.ap-terminal .fg-59 {\n  --fg: #5f5f5f;\n}\n.ap-terminal .bg-59 {\n  --bg: #5f5f5f;\n}\n.ap-terminal .fg-60 {\n  --fg: #5f5f87;\n}\n.ap-terminal .bg-60 {\n  --bg: #5f5f87;\n}\n.ap-terminal .fg-61 {\n  --fg: #5f5faf;\n}\n.ap-terminal .bg-61 {\n  --bg: #5f5faf;\n}\n.ap-terminal .fg-62 {\n  --fg: #5f5fd7;\n}\n.ap-terminal .bg-62 {\n  --bg: #5f5fd7;\n}\n.ap-terminal .fg-63 {\n  --fg: #5f5fff;\n}\n.ap-terminal .bg-63 {\n  --bg: #5f5fff;\n}\n.ap-terminal .fg-64 {\n  --fg: #5f8700;\n}\n.ap-terminal .bg-64 {\n  --bg: #5f8700;\n}\n.ap-terminal .fg-65 {\n  --fg: #5f875f;\n}\n.ap-terminal .bg-65 {\n  --bg: #5f875f;\n}\n.ap-terminal .fg-66 {\n  --fg: #5f8787;\n}\n.ap-terminal .bg-66 {\n  --bg: #5f8787;\n}\n.ap-terminal .fg-67 {\n  --fg: #5f87af;\n}\n.ap-terminal .bg-67 {\n  --bg: #5f87af;\n}\n.ap-terminal .fg-68 {\n  --fg: #5f87d7;\n}\n.ap-terminal .bg-68 {\n  --bg: #5f87d7;\n}\n.ap-terminal .fg-69 {\n  --fg: #5f87ff;\n}\n.ap-terminal .bg-69 {\n  --bg: #5f87ff;\n}\n.ap-terminal .fg-70 {\n  --fg: #5faf00;\n}\n.ap-terminal .bg-70 {\n  --bg: #5faf00;\n}\n.ap-terminal .fg-71 {\n  --fg: #5faf5f;\n}\n.ap-terminal .bg-71 {\n  --bg: #5faf5f;\n}\n.ap-terminal .fg-72 {\n  --fg: #5faf87;\n}\n.ap-terminal .bg-72 {\n  --bg: #5faf87;\n}\n.ap-terminal .fg-73 {\n  --fg: #5fafaf;\n}\n.ap-terminal .bg-73 {\n  --bg: #5fafaf;\n}\n.ap-terminal .fg-74 {\n  --fg: #5fafd7;\n}\n.ap-terminal .bg-74 {\n  --bg: #5fafd7;\n}\n.ap-terminal .fg-75 {\n  --fg: #5fafff;\n}\n.ap-terminal .bg-75 {\n  --bg: #5fafff;\n}\n.ap-terminal .fg-76 {\n  --fg: #5fd700;\n}\n.ap-terminal .bg-76 {\n  --bg: #5fd700;\n}\n.ap-terminal .fg-77 {\n  --fg: #5fd75f;\n}\n.ap-terminal .bg-77 {\n  --bg: #5fd75f;\n}\n.ap-terminal .fg-78 {\n  --fg: #5fd787;\n}\n.ap-terminal .bg-78 {\n  --bg: #5fd787;\n}\n.ap-terminal .fg-79 {\n  --fg: #5fd7af;\n}\n.ap-terminal .bg-79 {\n  --bg: #5fd7af;\n}\n.ap-terminal .fg-80 {\n  --fg: #5fd7d7;\n}\n.ap-terminal .bg-80 {\n  --bg: #5fd7d7;\n}\n.ap-terminal .fg-81 {\n  --fg: #5fd7ff;\n}\n.ap-terminal .bg-81 {\n  --bg: #5fd7ff;\n}\n.ap-terminal .fg-82 {\n  --fg: #5fff00;\n}\n.ap-terminal .bg-82 {\n  --bg: #5fff00;\n}\n.ap-terminal .fg-83 {\n  --fg: #5fff5f;\n}\n.ap-terminal .bg-83 {\n  --bg: #5fff5f;\n}\n.ap-terminal .fg-84 {\n  --fg: #5fff87;\n}\n.ap-terminal .bg-84 {\n  --bg: #5fff87;\n}\n.ap-terminal .fg-85 {\n  --fg: #5fffaf;\n}\n.ap-terminal .bg-85 {\n  --bg: #5fffaf;\n}\n.ap-terminal .fg-86 {\n  --fg: #5fffd7;\n}\n.ap-terminal .bg-86 {\n  --bg: #5fffd7;\n}\n.ap-terminal .fg-87 {\n  --fg: #5fffff;\n}\n.ap-terminal .bg-87 {\n  --bg: #5fffff;\n}\n.ap-terminal .fg-88 {\n  --fg: #870000;\n}\n.ap-terminal .bg-88 {\n  --bg: #870000;\n}\n.ap-terminal .fg-89 {\n  --fg: #87005f;\n}\n.ap-terminal .bg-89 {\n  --bg: #87005f;\n}\n.ap-terminal .fg-90 {\n  --fg: #870087;\n}\n.ap-terminal .bg-90 {\n  --bg: #870087;\n}\n.ap-terminal .fg-91 {\n  --fg: #8700af;\n}\n.ap-terminal .bg-91 {\n  --bg: #8700af;\n}\n.ap-terminal .fg-92 {\n  --fg: #8700d7;\n}\n.ap-terminal .bg-92 {\n  --bg: #8700d7;\n}\n.ap-terminal .fg-93 {\n  --fg: #8700ff;\n}\n.ap-terminal .bg-93 {\n  --bg: #8700ff;\n}\n.ap-terminal .fg-94 {\n  --fg: #875f00;\n}\n.ap-terminal .bg-94 {\n  --bg: #875f00;\n}\n.ap-terminal .fg-95 {\n  --fg: #875f5f;\n}\n.ap-terminal .bg-95 {\n  --bg: #875f5f;\n}\n.ap-terminal .fg-96 {\n  --fg: #875f87;\n}\n.ap-terminal .bg-96 {\n  --bg: #875f87;\n}\n.ap-terminal .fg-97 {\n  --fg: #875faf;\n}\n.ap-terminal .bg-97 {\n  --bg: #875faf;\n}\n.ap-terminal .fg-98 {\n  --fg: #875fd7;\n}\n.ap-terminal .bg-98 {\n  --bg: #875fd7;\n}\n.ap-terminal .fg-99 {\n  --fg: #875fff;\n}\n.ap-terminal .bg-99 {\n  --bg: #875fff;\n}\n.ap-terminal .fg-100 {\n  --fg: #878700;\n}\n.ap-terminal .bg-100 {\n  --bg: #878700;\n}\n.ap-terminal .fg-101 {\n  --fg: #87875f;\n}\n.ap-terminal .bg-101 {\n  --bg: #87875f;\n}\n.ap-terminal .fg-102 {\n  --fg: #878787;\n}\n.ap-terminal .bg-102 {\n  --bg: #878787;\n}\n.ap-terminal .fg-103 {\n  --fg: #8787af;\n}\n.ap-terminal .bg-103 {\n  --bg: #8787af;\n}\n.ap-terminal .fg-104 {\n  --fg: #8787d7;\n}\n.ap-terminal .bg-104 {\n  --bg: #8787d7;\n}\n.ap-terminal .fg-105 {\n  --fg: #8787ff;\n}\n.ap-terminal .bg-105 {\n  --bg: #8787ff;\n}\n.ap-terminal .fg-106 {\n  --fg: #87af00;\n}\n.ap-terminal .bg-106 {\n  --bg: #87af00;\n}\n.ap-terminal .fg-107 {\n  --fg: #87af5f;\n}\n.ap-terminal .bg-107 {\n  --bg: #87af5f;\n}\n.ap-terminal .fg-108 {\n  --fg: #87af87;\n}\n.ap-terminal .bg-108 {\n  --bg: #87af87;\n}\n.ap-terminal .fg-109 {\n  --fg: #87afaf;\n}\n.ap-terminal .bg-109 {\n  --bg: #87afaf;\n}\n.ap-terminal .fg-110 {\n  --fg: #87afd7;\n}\n.ap-terminal .bg-110 {\n  --bg: #87afd7;\n}\n.ap-terminal .fg-111 {\n  --fg: #87afff;\n}\n.ap-terminal .bg-111 {\n  --bg: #87afff;\n}\n.ap-terminal .fg-112 {\n  --fg: #87d700;\n}\n.ap-terminal .bg-112 {\n  --bg: #87d700;\n}\n.ap-terminal .fg-113 {\n  --fg: #87d75f;\n}\n.ap-terminal .bg-113 {\n  --bg: #87d75f;\n}\n.ap-terminal .fg-114 {\n  --fg: #87d787;\n}\n.ap-terminal .bg-114 {\n  --bg: #87d787;\n}\n.ap-terminal .fg-115 {\n  --fg: #87d7af;\n}\n.ap-terminal .bg-115 {\n  --bg: #87d7af;\n}\n.ap-terminal .fg-116 {\n  --fg: #87d7d7;\n}\n.ap-terminal .bg-116 {\n  --bg: #87d7d7;\n}\n.ap-terminal .fg-117 {\n  --fg: #87d7ff;\n}\n.ap-terminal .bg-117 {\n  --bg: #87d7ff;\n}\n.ap-terminal .fg-118 {\n  --fg: #87ff00;\n}\n.ap-terminal .bg-118 {\n  --bg: #87ff00;\n}\n.ap-terminal .fg-119 {\n  --fg: #87ff5f;\n}\n.ap-terminal .bg-119 {\n  --bg: #87ff5f;\n}\n.ap-terminal .fg-120 {\n  --fg: #87ff87;\n}\n.ap-terminal .bg-120 {\n  --bg: #87ff87;\n}\n.ap-terminal .fg-121 {\n  --fg: #87ffaf;\n}\n.ap-terminal .bg-121 {\n  --bg: #87ffaf;\n}\n.ap-terminal .fg-122 {\n  --fg: #87ffd7;\n}\n.ap-terminal .bg-122 {\n  --bg: #87ffd7;\n}\n.ap-terminal .fg-123 {\n  --fg: #87ffff;\n}\n.ap-terminal .bg-123 {\n  --bg: #87ffff;\n}\n.ap-terminal .fg-124 {\n  --fg: #af0000;\n}\n.ap-terminal .bg-124 {\n  --bg: #af0000;\n}\n.ap-terminal .fg-125 {\n  --fg: #af005f;\n}\n.ap-terminal .bg-125 {\n  --bg: #af005f;\n}\n.ap-terminal .fg-126 {\n  --fg: #af0087;\n}\n.ap-terminal .bg-126 {\n  --bg: #af0087;\n}\n.ap-terminal .fg-127 {\n  --fg: #af00af;\n}\n.ap-terminal .bg-127 {\n  --bg: #af00af;\n}\n.ap-terminal .fg-128 {\n  --fg: #af00d7;\n}\n.ap-terminal .bg-128 {\n  --bg: #af00d7;\n}\n.ap-terminal .fg-129 {\n  --fg: #af00ff;\n}\n.ap-terminal .bg-129 {\n  --bg: #af00ff;\n}\n.ap-terminal .fg-130 {\n  --fg: #af5f00;\n}\n.ap-terminal .bg-130 {\n  --bg: #af5f00;\n}\n.ap-terminal .fg-131 {\n  --fg: #af5f5f;\n}\n.ap-terminal .bg-131 {\n  --bg: #af5f5f;\n}\n.ap-terminal .fg-132 {\n  --fg: #af5f87;\n}\n.ap-terminal .bg-132 {\n  --bg: #af5f87;\n}\n.ap-terminal .fg-133 {\n  --fg: #af5faf;\n}\n.ap-terminal .bg-133 {\n  --bg: #af5faf;\n}\n.ap-terminal .fg-134 {\n  --fg: #af5fd7;\n}\n.ap-terminal .bg-134 {\n  --bg: #af5fd7;\n}\n.ap-terminal .fg-135 {\n  --fg: #af5fff;\n}\n.ap-terminal .bg-135 {\n  --bg: #af5fff;\n}\n.ap-terminal .fg-136 {\n  --fg: #af8700;\n}\n.ap-terminal .bg-136 {\n  --bg: #af8700;\n}\n.ap-terminal .fg-137 {\n  --fg: #af875f;\n}\n.ap-terminal .bg-137 {\n  --bg: #af875f;\n}\n.ap-terminal .fg-138 {\n  --fg: #af8787;\n}\n.ap-terminal .bg-138 {\n  --bg: #af8787;\n}\n.ap-terminal .fg-139 {\n  --fg: #af87af;\n}\n.ap-terminal .bg-139 {\n  --bg: #af87af;\n}\n.ap-terminal .fg-140 {\n  --fg: #af87d7;\n}\n.ap-terminal .bg-140 {\n  --bg: #af87d7;\n}\n.ap-terminal .fg-141 {\n  --fg: #af87ff;\n}\n.ap-terminal .bg-141 {\n  --bg: #af87ff;\n}\n.ap-terminal .fg-142 {\n  --fg: #afaf00;\n}\n.ap-terminal .bg-142 {\n  --bg: #afaf00;\n}\n.ap-terminal .fg-143 {\n  --fg: #afaf5f;\n}\n.ap-terminal .bg-143 {\n  --bg: #afaf5f;\n}\n.ap-terminal .fg-144 {\n  --fg: #afaf87;\n}\n.ap-terminal .bg-144 {\n  --bg: #afaf87;\n}\n.ap-terminal .fg-145 {\n  --fg: #afafaf;\n}\n.ap-terminal .bg-145 {\n  --bg: #afafaf;\n}\n.ap-terminal .fg-146 {\n  --fg: #afafd7;\n}\n.ap-terminal .bg-146 {\n  --bg: #afafd7;\n}\n.ap-terminal .fg-147 {\n  --fg: #afafff;\n}\n.ap-terminal .bg-147 {\n  --bg: #afafff;\n}\n.ap-terminal .fg-148 {\n  --fg: #afd700;\n}\n.ap-terminal .bg-148 {\n  --bg: #afd700;\n}\n.ap-terminal .fg-149 {\n  --fg: #afd75f;\n}\n.ap-terminal .bg-149 {\n  --bg: #afd75f;\n}\n.ap-terminal .fg-150 {\n  --fg: #afd787;\n}\n.ap-terminal .bg-150 {\n  --bg: #afd787;\n}\n.ap-terminal .fg-151 {\n  --fg: #afd7af;\n}\n.ap-terminal .bg-151 {\n  --bg: #afd7af;\n}\n.ap-terminal .fg-152 {\n  --fg: #afd7d7;\n}\n.ap-terminal .bg-152 {\n  --bg: #afd7d7;\n}\n.ap-terminal .fg-153 {\n  --fg: #afd7ff;\n}\n.ap-terminal .bg-153 {\n  --bg: #afd7ff;\n}\n.ap-terminal .fg-154 {\n  --fg: #afff00;\n}\n.ap-terminal .bg-154 {\n  --bg: #afff00;\n}\n.ap-terminal .fg-155 {\n  --fg: #afff5f;\n}\n.ap-terminal .bg-155 {\n  --bg: #afff5f;\n}\n.ap-terminal .fg-156 {\n  --fg: #afff87;\n}\n.ap-terminal .bg-156 {\n  --bg: #afff87;\n}\n.ap-terminal .fg-157 {\n  --fg: #afffaf;\n}\n.ap-terminal .bg-157 {\n  --bg: #afffaf;\n}\n.ap-terminal .fg-158 {\n  --fg: #afffd7;\n}\n.ap-terminal .bg-158 {\n  --bg: #afffd7;\n}\n.ap-terminal .fg-159 {\n  --fg: #afffff;\n}\n.ap-terminal .bg-159 {\n  --bg: #afffff;\n}\n.ap-terminal .fg-160 {\n  --fg: #d70000;\n}\n.ap-terminal .bg-160 {\n  --bg: #d70000;\n}\n.ap-terminal .fg-161 {\n  --fg: #d7005f;\n}\n.ap-terminal .bg-161 {\n  --bg: #d7005f;\n}\n.ap-terminal .fg-162 {\n  --fg: #d70087;\n}\n.ap-terminal .bg-162 {\n  --bg: #d70087;\n}\n.ap-terminal .fg-163 {\n  --fg: #d700af;\n}\n.ap-terminal .bg-163 {\n  --bg: #d700af;\n}\n.ap-terminal .fg-164 {\n  --fg: #d700d7;\n}\n.ap-terminal .bg-164 {\n  --bg: #d700d7;\n}\n.ap-terminal .fg-165 {\n  --fg: #d700ff;\n}\n.ap-terminal .bg-165 {\n  --bg: #d700ff;\n}\n.ap-terminal .fg-166 {\n  --fg: #d75f00;\n}\n.ap-terminal .bg-166 {\n  --bg: #d75f00;\n}\n.ap-terminal .fg-167 {\n  --fg: #d75f5f;\n}\n.ap-terminal .bg-167 {\n  --bg: #d75f5f;\n}\n.ap-terminal .fg-168 {\n  --fg: #d75f87;\n}\n.ap-terminal .bg-168 {\n  --bg: #d75f87;\n}\n.ap-terminal .fg-169 {\n  --fg: #d75faf;\n}\n.ap-terminal .bg-169 {\n  --bg: #d75faf;\n}\n.ap-terminal .fg-170 {\n  --fg: #d75fd7;\n}\n.ap-terminal .bg-170 {\n  --bg: #d75fd7;\n}\n.ap-terminal .fg-171 {\n  --fg: #d75fff;\n}\n.ap-terminal .bg-171 {\n  --bg: #d75fff;\n}\n.ap-terminal .fg-172 {\n  --fg: #d78700;\n}\n.ap-terminal .bg-172 {\n  --bg: #d78700;\n}\n.ap-terminal .fg-173 {\n  --fg: #d7875f;\n}\n.ap-terminal .bg-173 {\n  --bg: #d7875f;\n}\n.ap-terminal .fg-174 {\n  --fg: #d78787;\n}\n.ap-terminal .bg-174 {\n  --bg: #d78787;\n}\n.ap-terminal .fg-175 {\n  --fg: #d787af;\n}\n.ap-terminal .bg-175 {\n  --bg: #d787af;\n}\n.ap-terminal .fg-176 {\n  --fg: #d787d7;\n}\n.ap-terminal .bg-176 {\n  --bg: #d787d7;\n}\n.ap-terminal .fg-177 {\n  --fg: #d787ff;\n}\n.ap-terminal .bg-177 {\n  --bg: #d787ff;\n}\n.ap-terminal .fg-178 {\n  --fg: #d7af00;\n}\n.ap-terminal .bg-178 {\n  --bg: #d7af00;\n}\n.ap-terminal .fg-179 {\n  --fg: #d7af5f;\n}\n.ap-terminal .bg-179 {\n  --bg: #d7af5f;\n}\n.ap-terminal .fg-180 {\n  --fg: #d7af87;\n}\n.ap-terminal .bg-180 {\n  --bg: #d7af87;\n}\n.ap-terminal .fg-181 {\n  --fg: #d7afaf;\n}\n.ap-terminal .bg-181 {\n  --bg: #d7afaf;\n}\n.ap-terminal .fg-182 {\n  --fg: #d7afd7;\n}\n.ap-terminal .bg-182 {\n  --bg: #d7afd7;\n}\n.ap-terminal .fg-183 {\n  --fg: #d7afff;\n}\n.ap-terminal .bg-183 {\n  --bg: #d7afff;\n}\n.ap-terminal .fg-184 {\n  --fg: #d7d700;\n}\n.ap-terminal .bg-184 {\n  --bg: #d7d700;\n}\n.ap-terminal .fg-185 {\n  --fg: #d7d75f;\n}\n.ap-terminal .bg-185 {\n  --bg: #d7d75f;\n}\n.ap-terminal .fg-186 {\n  --fg: #d7d787;\n}\n.ap-terminal .bg-186 {\n  --bg: #d7d787;\n}\n.ap-terminal .fg-187 {\n  --fg: #d7d7af;\n}\n.ap-terminal .bg-187 {\n  --bg: #d7d7af;\n}\n.ap-terminal .fg-188 {\n  --fg: #d7d7d7;\n}\n.ap-terminal .bg-188 {\n  --bg: #d7d7d7;\n}\n.ap-terminal .fg-189 {\n  --fg: #d7d7ff;\n}\n.ap-terminal .bg-189 {\n  --bg: #d7d7ff;\n}\n.ap-terminal .fg-190 {\n  --fg: #d7ff00;\n}\n.ap-terminal .bg-190 {\n  --bg: #d7ff00;\n}\n.ap-terminal .fg-191 {\n  --fg: #d7ff5f;\n}\n.ap-terminal .bg-191 {\n  --bg: #d7ff5f;\n}\n.ap-terminal .fg-192 {\n  --fg: #d7ff87;\n}\n.ap-terminal .bg-192 {\n  --bg: #d7ff87;\n}\n.ap-terminal .fg-193 {\n  --fg: #d7ffaf;\n}\n.ap-terminal .bg-193 {\n  --bg: #d7ffaf;\n}\n.ap-terminal .fg-194 {\n  --fg: #d7ffd7;\n}\n.ap-terminal .bg-194 {\n  --bg: #d7ffd7;\n}\n.ap-terminal .fg-195 {\n  --fg: #d7ffff;\n}\n.ap-terminal .bg-195 {\n  --bg: #d7ffff;\n}\n.ap-terminal .fg-196 {\n  --fg: #ff0000;\n}\n.ap-terminal .bg-196 {\n  --bg: #ff0000;\n}\n.ap-terminal .fg-197 {\n  --fg: #ff005f;\n}\n.ap-terminal .bg-197 {\n  --bg: #ff005f;\n}\n.ap-terminal .fg-198 {\n  --fg: #ff0087;\n}\n.ap-terminal .bg-198 {\n  --bg: #ff0087;\n}\n.ap-terminal .fg-199 {\n  --fg: #ff00af;\n}\n.ap-terminal .bg-199 {\n  --bg: #ff00af;\n}\n.ap-terminal .fg-200 {\n  --fg: #ff00d7;\n}\n.ap-terminal .bg-200 {\n  --bg: #ff00d7;\n}\n.ap-terminal .fg-201 {\n  --fg: #ff00ff;\n}\n.ap-terminal .bg-201 {\n  --bg: #ff00ff;\n}\n.ap-terminal .fg-202 {\n  --fg: #ff5f00;\n}\n.ap-terminal .bg-202 {\n  --bg: #ff5f00;\n}\n.ap-terminal .fg-203 {\n  --fg: #ff5f5f;\n}\n.ap-terminal .bg-203 {\n  --bg: #ff5f5f;\n}\n.ap-terminal .fg-204 {\n  --fg: #ff5f87;\n}\n.ap-terminal .bg-204 {\n  --bg: #ff5f87;\n}\n.ap-terminal .fg-205 {\n  --fg: #ff5faf;\n}\n.ap-terminal .bg-205 {\n  --bg: #ff5faf;\n}\n.ap-terminal .fg-206 {\n  --fg: #ff5fd7;\n}\n.ap-terminal .bg-206 {\n  --bg: #ff5fd7;\n}\n.ap-terminal .fg-207 {\n  --fg: #ff5fff;\n}\n.ap-terminal .bg-207 {\n  --bg: #ff5fff;\n}\n.ap-terminal .fg-208 {\n  --fg: #ff8700;\n}\n.ap-terminal .bg-208 {\n  --bg: #ff8700;\n}\n.ap-terminal .fg-209 {\n  --fg: #ff875f;\n}\n.ap-terminal .bg-209 {\n  --bg: #ff875f;\n}\n.ap-terminal .fg-210 {\n  --fg: #ff8787;\n}\n.ap-terminal .bg-210 {\n  --bg: #ff8787;\n}\n.ap-terminal .fg-211 {\n  --fg: #ff87af;\n}\n.ap-terminal .bg-211 {\n  --bg: #ff87af;\n}\n.ap-terminal .fg-212 {\n  --fg: #ff87d7;\n}\n.ap-terminal .bg-212 {\n  --bg: #ff87d7;\n}\n.ap-terminal .fg-213 {\n  --fg: #ff87ff;\n}\n.ap-terminal .bg-213 {\n  --bg: #ff87ff;\n}\n.ap-terminal .fg-214 {\n  --fg: #ffaf00;\n}\n.ap-terminal .bg-214 {\n  --bg: #ffaf00;\n}\n.ap-terminal .fg-215 {\n  --fg: #ffaf5f;\n}\n.ap-terminal .bg-215 {\n  --bg: #ffaf5f;\n}\n.ap-terminal .fg-216 {\n  --fg: #ffaf87;\n}\n.ap-terminal .bg-216 {\n  --bg: #ffaf87;\n}\n.ap-terminal .fg-217 {\n  --fg: #ffafaf;\n}\n.ap-terminal .bg-217 {\n  --bg: #ffafaf;\n}\n.ap-terminal .fg-218 {\n  --fg: #ffafd7;\n}\n.ap-terminal .bg-218 {\n  --bg: #ffafd7;\n}\n.ap-terminal .fg-219 {\n  --fg: #ffafff;\n}\n.ap-terminal .bg-219 {\n  --bg: #ffafff;\n}\n.ap-terminal .fg-220 {\n  --fg: #ffd700;\n}\n.ap-terminal .bg-220 {\n  --bg: #ffd700;\n}\n.ap-terminal .fg-221 {\n  --fg: #ffd75f;\n}\n.ap-terminal .bg-221 {\n  --bg: #ffd75f;\n}\n.ap-terminal .fg-222 {\n  --fg: #ffd787;\n}\n.ap-terminal .bg-222 {\n  --bg: #ffd787;\n}\n.ap-terminal .fg-223 {\n  --fg: #ffd7af;\n}\n.ap-terminal .bg-223 {\n  --bg: #ffd7af;\n}\n.ap-terminal .fg-224 {\n  --fg: #ffd7d7;\n}\n.ap-terminal .bg-224 {\n  --bg: #ffd7d7;\n}\n.ap-terminal .fg-225 {\n  --fg: #ffd7ff;\n}\n.ap-terminal .bg-225 {\n  --bg: #ffd7ff;\n}\n.ap-terminal .fg-226 {\n  --fg: #ffff00;\n}\n.ap-terminal .bg-226 {\n  --bg: #ffff00;\n}\n.ap-terminal .fg-227 {\n  --fg: #ffff5f;\n}\n.ap-terminal .bg-227 {\n  --bg: #ffff5f;\n}\n.ap-terminal .fg-228 {\n  --fg: #ffff87;\n}\n.ap-terminal .bg-228 {\n  --bg: #ffff87;\n}\n.ap-terminal .fg-229 {\n  --fg: #ffffaf;\n}\n.ap-terminal .bg-229 {\n  --bg: #ffffaf;\n}\n.ap-terminal .fg-230 {\n  --fg: #ffffd7;\n}\n.ap-terminal .bg-230 {\n  --bg: #ffffd7;\n}\n.ap-terminal .fg-231 {\n  --fg: #ffffff;\n}\n.ap-terminal .bg-231 {\n  --bg: #ffffff;\n}\n.ap-terminal .fg-232 {\n  --fg: #080808;\n}\n.ap-terminal .bg-232 {\n  --bg: #080808;\n}\n.ap-terminal .fg-233 {\n  --fg: #121212;\n}\n.ap-terminal .bg-233 {\n  --bg: #121212;\n}\n.ap-terminal .fg-234 {\n  --fg: #1c1c1c;\n}\n.ap-terminal .bg-234 {\n  --bg: #1c1c1c;\n}\n.ap-terminal .fg-235 {\n  --fg: #262626;\n}\n.ap-terminal .bg-235 {\n  --bg: #262626;\n}\n.ap-terminal .fg-236 {\n  --fg: #303030;\n}\n.ap-terminal .bg-236 {\n  --bg: #303030;\n}\n.ap-terminal .fg-237 {\n  --fg: #3a3a3a;\n}\n.ap-terminal .bg-237 {\n  --bg: #3a3a3a;\n}\n.ap-terminal .fg-238 {\n  --fg: #444444;\n}\n.ap-terminal .bg-238 {\n  --bg: #444444;\n}\n.ap-terminal .fg-239 {\n  --fg: #4e4e4e;\n}\n.ap-terminal .bg-239 {\n  --bg: #4e4e4e;\n}\n.ap-terminal .fg-240 {\n  --fg: #585858;\n}\n.ap-terminal .bg-240 {\n  --bg: #585858;\n}\n.ap-terminal .fg-241 {\n  --fg: #626262;\n}\n.ap-terminal .bg-241 {\n  --bg: #626262;\n}\n.ap-terminal .fg-242 {\n  --fg: #6c6c6c;\n}\n.ap-terminal .bg-242 {\n  --bg: #6c6c6c;\n}\n.ap-terminal .fg-243 {\n  --fg: #767676;\n}\n.ap-terminal .bg-243 {\n  --bg: #767676;\n}\n.ap-terminal .fg-244 {\n  --fg: #808080;\n}\n.ap-terminal .bg-244 {\n  --bg: #808080;\n}\n.ap-terminal .fg-245 {\n  --fg: #8a8a8a;\n}\n.ap-terminal .bg-245 {\n  --bg: #8a8a8a;\n}\n.ap-terminal .fg-246 {\n  --fg: #949494;\n}\n.ap-terminal .bg-246 {\n  --bg: #949494;\n}\n.ap-terminal .fg-247 {\n  --fg: #9e9e9e;\n}\n.ap-terminal .bg-247 {\n  --bg: #9e9e9e;\n}\n.ap-terminal .fg-248 {\n  --fg: #a8a8a8;\n}\n.ap-terminal .bg-248 {\n  --bg: #a8a8a8;\n}\n.ap-terminal .fg-249 {\n  --fg: #b2b2b2;\n}\n.ap-terminal .bg-249 {\n  --bg: #b2b2b2;\n}\n.ap-terminal .fg-250 {\n  --fg: #bcbcbc;\n}\n.ap-terminal .bg-250 {\n  --bg: #bcbcbc;\n}\n.ap-terminal .fg-251 {\n  --fg: #c6c6c6;\n}\n.ap-terminal .bg-251 {\n  --bg: #c6c6c6;\n}\n.ap-terminal .fg-252 {\n  --fg: #d0d0d0;\n}\n.ap-terminal .bg-252 {\n  --bg: #d0d0d0;\n}\n.ap-terminal .fg-253 {\n  --fg: #dadada;\n}\n.ap-terminal .bg-253 {\n  --bg: #dadada;\n}\n.ap-terminal .fg-254 {\n  --fg: #e4e4e4;\n}\n.ap-terminal .bg-254 {\n  --bg: #e4e4e4;\n}\n.ap-terminal .fg-255 {\n  --fg: #eeeeee;\n}\n.ap-terminal .bg-255 {\n  --bg: #eeeeee;\n}\n.asciinema-player-theme-asciinema {\n  --term-color-foreground: #cccccc;\n  --term-color-background: #121314;\n  --term-color-0: hsl(0, 0%, 0%);\n  --term-color-1: hsl(343, 70%, 55%);\n  --term-color-2: hsl(103, 70%, 44%);\n  --term-color-3: hsl(43, 70%, 55%);\n  --term-color-4: hsl(193, 70%, 49.5%);\n  --term-color-5: hsl(283, 70%, 60.5%);\n  --term-color-6: hsl(163, 70%, 60.5%);\n  --term-color-7: hsl(0, 0%, 85%);\n  --term-color-8: hsl(0, 0%, 30%);\n  --term-color-9: hsl(343, 70%, 55%);\n  --term-color-10: hsl(103, 70%, 44%);\n  --term-color-11: hsl(43, 70%, 55%);\n  --term-color-12: hsl(193, 70%, 49.5%);\n  --term-color-13: hsl(283, 70%, 60.5%);\n  --term-color-14: hsl(163, 70%, 60.5%);\n  --term-color-15: hsl(0, 0%, 100%);\n}\n/*\n  Based on Dracula: https://draculatheme.com\n */\n.asciinema-player-theme-dracula {\n  --term-color-foreground: #f8f8f2;\n  --term-color-background: #282a36;\n  --term-color-0: #21222c;\n  --term-color-1: #ff5555;\n  --term-color-2: #50fa7b;\n  --term-color-3: #f1fa8c;\n  --term-color-4: #bd93f9;\n  --term-color-5: #ff79c6;\n  --term-color-6: #8be9fd;\n  --term-color-7: #f8f8f2;\n  --term-color-8: #6272a4;\n  --term-color-9: #ff6e6e;\n  --term-color-10: #69ff94;\n  --term-color-11: #ffffa5;\n  --term-color-12: #d6acff;\n  --term-color-13: #ff92df;\n  --term-color-14: #a4ffff;\n  --term-color-15: #ffffff;\n}\n/* Based on Monokai from base16 collection - https://github.com/chriskempson/base16 */\n.asciinema-player-theme-monokai {\n  --term-color-foreground: #f8f8f2;\n  --term-color-background: #272822;\n  --term-color-0: #272822;\n  --term-color-1: #f92672;\n  --term-color-2: #a6e22e;\n  --term-color-3: #f4bf75;\n  --term-color-4: #66d9ef;\n  --term-color-5: #ae81ff;\n  --term-color-6: #a1efe4;\n  --term-color-7: #f8f8f2;\n  --term-color-8: #75715e;\n  --term-color-15: #f9f8f5;\n}\n/*\n  Based on Nord: https://github.com/arcticicestudio/nord\n  Via: https://github.com/neilotoole/asciinema-theme-nord\n */\n.asciinema-player-theme-nord {\n  --term-color-foreground: #eceff4;\n  --term-color-background: #2e3440;\n  --term-color-0: #3b4252;\n  --term-color-1: #bf616a;\n  --term-color-2: #a3be8c;\n  --term-color-3: #ebcb8b;\n  --term-color-4: #81a1c1;\n  --term-color-5: #b48ead;\n  --term-color-6: #88c0d0;\n  --term-color-7: #eceff4;\n}\n.asciinema-player-theme-seti {\n  --term-color-foreground: #cacecd;\n  --term-color-background: #111213;\n  --term-color-0: #323232;\n  --term-color-1: #c22832;\n  --term-color-2: #8ec43d;\n  --term-color-3: #e0c64f;\n  --term-color-4: #43a5d5;\n  --term-color-5: #8b57b5;\n  --term-color-6: #8ec43d;\n  --term-color-7: #eeeeee;\n  --term-color-15: #ffffff;\n}\n/*\n  Based on Solarized Dark: https://ethanschoonover.com/solarized/\n */\n.asciinema-player-theme-solarized-dark {\n  --term-color-foreground: #839496;\n  --term-color-background: #002b36;\n  --term-color-0: #073642;\n  --term-color-1: #dc322f;\n  --term-color-2: #859900;\n  --term-color-3: #b58900;\n  --term-color-4: #268bd2;\n  --term-color-5: #d33682;\n  --term-color-6: #2aa198;\n  --term-color-7: #eee8d5;\n  --term-color-8: #002b36;\n  --term-color-9: #cb4b16;\n  --term-color-10: #586e75;\n  --term-color-11: #657b83;\n  --term-color-12: #839496;\n  --term-color-13: #6c71c4;\n  --term-color-14: #93a1a1;\n  --term-color-15: #fdf6e3;\n}\n/*\n  Based on Solarized Light: https://ethanschoonover.com/solarized/\n */\n.asciinema-player-theme-solarized-light {\n  --term-color-foreground: #657b83;\n  --term-color-background: #fdf6e3;\n  --term-color-0: #073642;\n  --term-color-1: #dc322f;\n  --term-color-2: #859900;\n  --term-color-3: #b58900;\n  --term-color-4: #268bd2;\n  --term-color-5: #d33682;\n  --term-color-6: #2aa198;\n  --term-color-7: #eee8d5;\n  --term-color-8: #002b36;\n  --term-color-9: #cb4b16;\n  --term-color-10: #586e75;\n  --term-color-11: #657c83;\n  --term-color-12: #839496;\n  --term-color-13: #6c71c4;\n  --term-color-14: #93a1a1;\n  --term-color-15: #fdf6e3;\n}\n.asciinema-player-theme-solarized-light .ap-overlay-start .ap-play-button svg .ap-play-btn-fill {\n  fill: var(--term-color-1);\n}\n.asciinema-player-theme-solarized-light .ap-overlay-start .ap-play-button svg .ap-play-btn-stroke {\n  stroke: var(--term-color-1);\n}\n/*\n  Based on Tango: https://en.wikipedia.org/wiki/Tango_Desktop_Project\n */\n.asciinema-player-theme-tango {\n  --term-color-foreground: #cccccc;\n  --term-color-background: #121314;\n  --term-color-0: #000000;\n  --term-color-1: #cc0000;\n  --term-color-2: #4e9a06;\n  --term-color-3: #c4a000;\n  --term-color-4: #3465a4;\n  --term-color-5: #75507b;\n  --term-color-6: #06989a;\n  --term-color-7: #d3d7cf;\n  --term-color-8: #555753;\n  --term-color-9: #ef2929;\n  --term-color-10: #8ae234;\n  --term-color-11: #fce94f;\n  --term-color-12: #729fcf;\n  --term-color-13: #ad7fa8;\n  --term-color-14: #34e2e2;\n  --term-color-15: #eeeeec;\n}\n/*\n  Based on gruvbox: https://github.com/morhetz/gruvbox\n */\n.asciinema-player-theme-gruvbox-dark {\n  --term-color-foreground: #fbf1c7;\n  --term-color-background: #282828;\n  --term-color-0: #282828;\n  --term-color-1: #cc241d;\n  --term-color-2: #98971a;\n  --term-color-3: #d79921;\n  --term-color-4: #458588;\n  --term-color-5: #b16286;\n  --term-color-6: #689d6a;\n  --term-color-7: #a89984;\n  --term-color-8: #7c6f65;\n  --term-color-9: #fb4934;\n  --term-color-10: #b8bb26;\n  --term-color-11: #fabd2f;\n  --term-color-12: #83a598;\n  --term-color-13: #d3869b;\n  --term-color-14: #8ec07c;\n  --term-color-15: #fbf1c7;\n}\n";
styleInject(css_248z);

const VIEW_TYPE_ASCIINEMA = 'asciinema-cast';
const CAST_EXTENSION = '.cast';
function createPlayer(src, el, opts) {
    // Live preview selects the block on click unless the target sits in this class.
    el.addClass('interactive-child');
    return create(src, el, opts);
}
function playbackOptions(fit, controls) {
    return {
        autoplay: true,
        loop: true,
        controls,
        fit,
    };
}
function castEmbedRegistry(app) {
    const registry = app.embedRegistry;
    if (!registry || typeof registry.registerExtension !== 'function') {
        return null;
    }
    return registry;
}
function castLinkpath(src) {
    const path = src.split('#')[0].split('|')[0].trim();
    if (!path.toLowerCase().endsWith(CAST_EXTENSION)) {
        return null;
    }
    return path;
}
function replaceEmbed(embed) {
    const host = embed.doc.createElement('div');
    host.addClass('asciinema-player-embed');
    if (embed.style.width) {
        host.style.width = embed.style.width;
    }
    if (embed.style.height) {
        host.style.height = embed.style.height;
    }
    embed.replaceWith(host);
    return host;
}
class AsciinemaEmbed extends obsidian.MarkdownRenderChild {
    constructor(containerEl, src) {
        super(containerEl);
        this.src = src;
        this.player = null;
    }
    onload() {
        this.mount();
    }
    // The embed registry calls this after onload. Mount again only if that did not run.
    loadFile() {
        if (!this.player) {
            this.mount();
        }
    }
    onunload() {
        this.destroyPlayer();
    }
    mount() {
        this.destroyPlayer();
        this.player = createPlayer(this.src, this.containerEl, playbackOptions('width', true));
    }
    destroyPlayer() {
        const player = this.player;
        this.player = null;
        player === null || player === void 0 ? void 0 : player.dispose();
    }
}
class AsciinemaCastView extends obsidian.FileView {
    constructor() {
        super(...arguments);
        this.player = null;
    }
    getViewType() {
        return VIEW_TYPE_ASCIINEMA;
    }
    getDisplayText() {
        var _a, _b;
        return (_b = (_a = this.file) === null || _a === void 0 ? void 0 : _a.basename) !== null && _b !== void 0 ? _b : 'Asciinema';
    }
    getIcon() {
        return 'play';
    }
    canAcceptExtension(extension) {
        return extension === 'cast';
    }
    onLoadFile(file) {
        const _super = Object.create(null, {
            onLoadFile: { get: () => super.onLoadFile }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.onLoadFile.call(this, file);
            this.mount(file);
        });
    }
    onUnloadFile(file) {
        const _super = Object.create(null, {
            onUnloadFile: { get: () => super.onUnloadFile }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this.destroyPlayer();
            this.contentEl.empty();
            yield _super.onUnloadFile.call(this, file);
        });
    }
    onClose() {
        const _super = Object.create(null, {
            onClose: { get: () => super.onClose }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this.destroyPlayer();
            yield _super.onClose.call(this);
        });
    }
    mount(file) {
        this.destroyPlayer();
        this.contentEl.empty();
        const frame = this.contentEl.createDiv({ cls: 'asciinema-player-view-frame' });
        this.player = createPlayer(this.app.vault.getResourcePath(file), frame, playbackOptions('both', true));
    }
    destroyPlayer() {
        const player = this.player;
        this.player = null;
        player === null || player === void 0 ? void 0 : player.dispose();
    }
}
class AsciinemaPlayerPlugin extends obsidian.Plugin {
    onload() {
        this.registerView(VIEW_TYPE_ASCIINEMA, (leaf) => new AsciinemaCastView(leaf));
        try {
            this.registerExtensions(['cast'], VIEW_TYPE_ASCIINEMA);
        }
        catch (err) {
            console.error('asciinema-player: failed to register .cast files', err);
        }
        this.registerCastEmbeds();
        this.registerMarkdownPostProcessor((el, ctx) => {
            const embeds = [];
            if (el.hasClass('internal-embed')) {
                embeds.push(el);
            }
            for (const node of el.findAll('.internal-embed')) {
                embeds.push(node);
            }
            for (const embed of embeds) {
                if (embed.hasClass('asciinema-player-embed')) {
                    continue;
                }
                const src = embed.getAttr('src');
                if (!src) {
                    continue;
                }
                const linkpath = castLinkpath(src);
                if (!linkpath) {
                    continue;
                }
                const host = embed === el ? embed : replaceEmbed(embed);
                host.addClass('asciinema-player-embed');
                host.addClass('is-loaded');
                host.empty();
                const file = this.app.metadataCache.getFirstLinkpathDest(linkpath, ctx.sourcePath);
                if (!(file instanceof obsidian.TFile)) {
                    const errorDiv = host.createDiv({ cls: 'asciinema-player-file-not-found' });
                    errorDiv.createSpan({ text: `asciinema-player: ${linkpath} not found` });
                    continue;
                }
                const frame = host.createDiv({ cls: 'asciinema-player-frame' });
                ctx.addChild(new AsciinemaEmbed(frame, this.app.vault.getResourcePath(file)));
            }
        });
        this.registerMarkdownCodeBlockProcessor('asciinema', (source, el) => {
            const lines = source.split('\n').filter(line => line.trim() !== '');
            if (lines.length === 0) {
                return;
            }
            const castPath = lines[0].trim();
            const opts = {};
            for (let i = 1; i < lines.length; i++) {
                const match = lines[i].match(/^\s*(\w+):\s*(.*)\s*$/);
                if (match) {
                    const key = match[1];
                    const value = match[2];
                    if (value === 'true') {
                        opts[key] = key === 'loop' ? 1 : true;
                    }
                    else if (value === 'false') {
                        opts[key] = false;
                    }
                    else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                            opts[key] = numValue;
                        }
                        else {
                            opts[key] = value;
                        }
                    }
                }
            }
            const playerContainer = el.createDiv();
            const urlPrefix = 'src:';
            if (castPath.startsWith(urlPrefix)) {
                const url = castPath.substring(urlPrefix.length).trim();
                const player = createPlayer(url, playerContainer, opts);
                if (opts.loop) {
                    player.addEventListener('ended', () => player.play());
                }
            }
            else {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile) {
                    return;
                }
                const castFile = this.app.metadataCache.getFirstLinkpathDest(castPath, activeFile.path);
                if (castFile) {
                    const resourcePath = this.app.vault.getResourcePath(castFile);
                    const player = createPlayer(resourcePath, playerContainer, opts);
                    if (opts.loop) {
                        player.addEventListener('ended', () => player.play());
                    }
                }
                else {
                    const errorDiv = playerContainer.createDiv({
                        cls: 'asciinema-player-file-not-found',
                    });
                    errorDiv.createSpan({
                        text: `asciinema-player: ${castPath} not found`,
                    });
                }
            }
        });
    }
    onunload() {
        var _a, _b;
        try {
            (_b = (_a = castEmbedRegistry(this.app)) === null || _a === void 0 ? void 0 : _a.unregisterExtension) === null || _b === void 0 ? void 0 : _b.call(_a, 'cast');
        }
        catch (err) {
            console.error('asciinema-player: failed to unregister cast embeds', err);
        }
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_ASCIINEMA);
    }
    registerCastEmbeds() {
        var _a;
        const registry = castEmbedRegistry(this.app);
        if (!registry) {
            return;
        }
        try {
            if ((_a = registry.isExtensionRegistered) === null || _a === void 0 ? void 0 : _a.call(registry, 'cast')) {
                return;
            }
            registry.registerExtension('cast', (ctx, file) => {
                ctx.containerEl.addClass('asciinema-player-embed');
                ctx.containerEl.addClass('interactive-child');
                const frame = ctx.containerEl.createDiv({ cls: 'asciinema-player-frame' });
                return new AsciinemaEmbed(frame, ctx.app.vault.getResourcePath(file));
            });
        }
        catch (err) {
            console.error('asciinema-player: failed to register cast embeds', err);
        }
    }
}

module.exports = AsciinemaPlayerPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzLy5wbnBtL0Byb2xsdXArcGx1Z2luLXR5cGVzY3JpcHRAMTIuMS40X3JvbGx1cEA0LjUyLjRfdHNsaWJAMi44LjFfdHlwZXNjcmlwdEA1LjkuMy9ub2RlX21vZHVsZXMvdHNsaWIvdHNsaWIuZXM2LmpzIiwibm9kZV9tb2R1bGVzLy5wbnBtL2FzY2lpbmVtYS1wbGF5ZXJAMy4xMS4wL25vZGVfbW9kdWxlcy9hc2NpaW5lbWEtcGxheWVyL2Rpc3QvbG9nZ2luZy1IYjk0RXZzSS5qcyIsIm5vZGVfbW9kdWxlcy8ucG5wbS9hc2NpaW5lbWEtcGxheWVyQDMuMTEuMC9ub2RlX21vZHVsZXMvYXNjaWluZW1hLXBsYXllci9kaXN0L2NvcmUtQ2Q4RDlYVmwuanMiLCJub2RlX21vZHVsZXMvLnBucG0vYXNjaWluZW1hLXBsYXllckAzLjExLjAvbm9kZV9tb2R1bGVzL2FzY2lpbmVtYS1wbGF5ZXIvZGlzdC9vcHRzLUR0WmV1bWIxLmpzIiwibm9kZV9tb2R1bGVzLy5wbnBtL2FzY2lpbmVtYS1wbGF5ZXJAMy4xMS4wL25vZGVfbW9kdWxlcy9hc2NpaW5lbWEtcGxheWVyL2Rpc3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvLnBucG0vc3R5bGUtaW5qZWN0QDAuMy4wL25vZGVfbW9kdWxlcy9zdHlsZS1pbmplY3QvZGlzdC9zdHlsZS1pbmplY3QuZXMuanMiLCJzcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6bnVsbCwibmFtZXMiOlsiY3JlYXRlIiwiZXhwb3J0cyIsIkFzY2lpbmVtYVBsYXllci5jcmVhdGUiLCJNYXJrZG93blJlbmRlckNoaWxkIiwiRmlsZVZpZXciLCJQbHVnaW4iLCJURmlsZSJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBa0dBO0FBQ08sU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFO0FBQzdELElBQUksU0FBUyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsT0FBTyxLQUFLLFlBQVksQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxVQUFVLE9BQU8sRUFBRSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoSCxJQUFJLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUMvRCxRQUFRLFNBQVMsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkcsUUFBUSxTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEcsUUFBUSxTQUFTLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0SCxRQUFRLElBQUksQ0FBQyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFB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QUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFDMUQsRUFBRTtBQUNGLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNoQixJQUFJLEtBQUssSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTtBQUN2SCxNQUFNLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztBQUN4QyxJQUFJO0FBQ0osSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFDekQsRUFBRTtBQUNGLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNoQixJQUFJLEtBQUssSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTtBQUN2SCxNQUFNLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztBQUN4QyxJQUFJO0FBQ0osSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsR0FB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QUUsSUFBSTtBQUNuQixJQUFJLEVBQUUsRUFBRSxFQUFFO0FBQ1YsSUFBSSxNQUFNLEVBQUVELFFBQU07QUFDbEIsSUFBSSxPQUFPLEVBQUUsVUFBVTtBQUN2QixJQUFJLFFBQVEsRUFBRTtBQUNkLENBQUMsQ0FBQzs7QUFFRixNQUFNLFdBQVcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVB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QU0sR0FBRyxLQUFLLENBQUM7QUFDNUUsTUFBTSxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUM1QyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BDLE1BQU0sS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLO0FBQzNCLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssVUFBVSxFQUFFO0FBQzVELE1BQU0sTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO0FBQ2xELE1BQU0sTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO0FBQ2xELE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pELElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxFQUFFO0FBQzNELE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO0FBQ25DLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssT0FBTyxFQUFFO0FBQ3pELE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxD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QU8sSUFBSSxDQUFDLFlBQVk7QUFDNUIsRUFBRTtBQUNGLEVBQUUsU0FBUyxDQUFDLFFBQVEsRUFBRTtBQUN0QixJQUFJLElBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUU7QUFDckYsSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFLE9BQU8sSUFBSSxDQUFDLEtBQUs7QUFDdEQsSUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVE7QUFDN0IsSUFBSSxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7QUFDaEMsTUFBTSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQztBQUN6QyxJQUFJLENBQUMsTUFBTSxJQUFJLFFBQVEsS0FBSyxNQUFNLEVBQUU7QUFDcEMsTUFBTSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQztBQUNqQyxJQUFJLENBQUMsTUFBTSxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7QUFDdkMsTUFBTSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQztBQUN6QyxJQUFJLENBQUMsTUFBTSxJQUFJLFFBQVEsS0FBSyxPQUFPLEVBQUU7QUFDckMsTUFBTSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQztBQUN2QyxJQUFJLENBQUMsTUFBTSxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7QUFDdkMsTUFBTSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQztBQUN6QyxJQUFJLENBQUMsTUFBTSxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7QUFDdkMsTUFBTSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQztBQUN6QyxJQUFJLENBQUMsTUFBTTtBQUNYLE1BQU0sTUFBTSxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN4QyxJQUFJO0FBQ0osSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDNUIsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLO0FBQ3JCLEVBQUU7QUFDRixFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUU7QUFDZCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ3RCLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQztBQUN6QyxFQUFFO0FBQ0YsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFO0FBQ2hCLElBQUksTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQzVDLElBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVM7QUFDM0IsRUFBRTtBQUNGLEVBQUUsTUFBTSxpQkFBaUIsR0FBRztBQUM1QixJQUFJLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7QUFDekMsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFO0FBQzVDLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRTtBQUM1QyxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUTtBQUNsRCxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLEVBQUU7QUFDN0UsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO0FBQ3pCLE1BQU0sSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFO0FBQ3BCLElBQUk7QUFDSixJQUFJLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUU7QUFDekIsTUFBTSxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUU7QUFDcEIsSUFBSTtBQUNKLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDNUMsSUFBSSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxLQUFLLFNBQVMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJO0FBQ3JGLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUU7QUFDcEMsTUFBTSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7QUFDckIsTUFBTSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7QUFDckIsTUFBTSxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7QUFDN0IsTUFBTSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87QUFDM0IsTUFBTSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7QUFDdkIsTUFBTSxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7QUFDN0IsTUFBTTtBQUNOLEtBQUssQ0FBQztBQUNOLEVBQUU7QUFDRixFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQ3ZCLElBQUksSUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUztBQUM1RixJQUFJLElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVM7QUFDN0YsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJO0FBQ3BCLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJO0FBQ3BCLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTO0FBQzNCLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO0FBQ2xDLElBQUksSUFBSSxJQUFJLEtBQUssU0FBUyxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUU7QUFDM0MsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUN4QixJQUFJO0FBQ0osSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRTtBQUNqQyxNQUFNLElBQUk7QUFDVixNQUFNLElBQUk7QUFDVixNQUFNO0FBQ04sS0FBSyxDQUFDO0FBQ04sRUFBRTtBQUNGLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDeEIsSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUU7QUFDeEQsSUFBSSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO0FBQ3BELElBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVM7QUFDM0IsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJO0FBQ3ZCLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSTtBQUN2QixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUQsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRTtBQUNsQyxNQUFNLElBQUk7QUFDVixNQUFNO0FBQ04sS0FBSyxDQUFDO0FBQ04sRUFBRTtBQUNGLEVBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDNUIsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQztBQUNyRCxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUk7QUFDdkIsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJO0FBQ3ZCLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDN0IsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ25DLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzlCLElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxZQUFZLENBQUMsTUFBTSxFQUFFO0FBQ3ZCLElBQUksSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUUsT0FBTyxFQUFFO0FBQzdDLElBQUksSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxrQkFBa0IsRUFBRTtBQUN2RCxNQUFNLE9BQU87QUFDYixRQUFRLElBQUksRUFBRSxNQUFNO0FBQ3BCLFFBQVEsS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7QUFDcEMsT0FBTztBQUNQLElBQUksQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksTUFBTSxFQUFFO0FBQ2pELE1BQU0sT0FBTztBQUNiLFFBQVEsSUFBSSxFQUFFLEtBQUs7QUFDbkIsUUFBUSxLQUFLLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQzNDLE9BQU87QUFDUCxJQUFJO0FBQ0osSUFBSSxPQUFPLEVBQUU7QUFDYixFQUFFO0FBQ0YsRUFBRSxhQUFhLENBQUMsTUFBTSxFQUFFO0FBQ3hCLElBQUksTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFO0FBQ2hDLElBQUksTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFO0FBQ2hDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1RCxJQUFJLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztBQUNyRCxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekMsSUFBSSxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLElBQUksS0FBSztBQUMxQyxJQUFJLE1BQU0sS0FBSyxHQUFHLEVBQUU7QUFDcEIsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ25DLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQztBQUNqQixRQUFRLEVBQUUsRUFBRSxDQUFDO0FBQ2IsUUFBUSxRQUFRLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLE9BQU8sQ0FBQztBQUNSLElBQUk7QUFDSixJQUFJLE9BQU87QUFDWCxNQUFNLE1BQU07QUFDWixNQUFNO0FBQ04sS0FBSztBQUNMLEVBQUU7QUFDRixFQUFFLGlCQUFpQixDQUFDLE9BQU8sRUFBRTtBQUM3QixJQUFJLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNoQyxNQUFNLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsRSxJQUFJO0FBQ0osRUFBRTtBQUNGO0FBQ0EsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQzNLLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUM3RixTQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUU7QUFDeEIsRUFBRSxJQUFJLE9BQU8sR0FBRyxLQUFLLFVBQVUsRUFBRSxPQUFPLEdBQUc7QUFDM0MsRUFBRSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtBQUMvQixJQUFJLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksT0FBTyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLFFBQVEsRUFBRTtBQUMzRSxNQUFNLEdBQUcsR0FBRztBQUNaLFFBQVEsTUFBTSxFQUFFLFdBQVc7QUFDM0IsUUFBUSxHQUFHLEVBQUU7QUFDYixPQUFPO0FBQ1AsSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxRQUFRLEVBQUU7QUFDaEQsTUFBTSxHQUFHLEdBQUc7QUFDWixRQUFRLE1BQU0sRUFBRTtBQUNoQixPQUFPO0FBQ1AsSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxTQUFTLEVBQUU7QUFDakQsTUFBTSxHQUFHLEdBQUc7QUFDWixRQUFRLE1BQU0sRUFBRTtBQUNoQixPQUFPO0FBQ1AsSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxZQUFZLEVBQUU7QUFDckQsTUFBTSxHQUFHLEdBQUc7QUFDWixRQUFRLE1BQU0sRUFBRSxXQUFXO0FBQzNCLFFBQVEsR0FBRyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUM3QixPQUFPO0FBQ1AsSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLEdBQUcsR0FBRztBQUNaLFFBQVEsTUFBTSxFQUFFLFdBQVc7QUFDM0IsUUFBUSxHQUFHLEVBQUU7QUFDYixPQUFPO0FBQ1AsSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUU7QUFDaEMsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLFdBQVc7QUFDNUIsRUFBRTtBQUNGLEVBQUUsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLFdBQVcsRUFBRTtBQUNqQyxJQUFJLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUU7QUFDbEMsTUFBTSxHQUFHLENBQUMsTUFBTSxHQUFHLFdBQVc7QUFDOUIsSUFBSTtBQUNKLElBQUksSUFBSSxPQUFPLEdBQUcsQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFO0FBQ3hDLE1BQU0sSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNuQyxRQUFRLEdBQUcsQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQzVDLE1BQU0sQ0FBQyxNQUFNO0FBQ2IsUUFBUSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdDLE1BQU07QUFDTixJQUFJO0FBQ0osRUFBRTtBQUNGLEVBQUUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUMvQixJQUFJLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUMxQyxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQztBQUM1RCxFQUFFLENBQUMsTUFBTTtBQUNULElBQUksTUFBTSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN0RCxFQUFFO0FBQ0Y7O0FDLzRGQSxNQUFNLE1BQU0sR0FBRyxLQUFLO0FBQ3BCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztBQUNqQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO0FBQ3BDLE1BQU0sY0FBYyxHQUFHLE9BQU8sS0FBSyxLQUFLLFVBQVU7QUFDbEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztBQUNwQyxNQUFNLGFBQWEsR0FBRztBQUN0QixFQUFFLE1BQU0sRUFBRTtBQUNWLENBQUM7QUFDRCxJQUFJLFVBQVUsR0FBRyxRQUFRO0FBQ3pCLE1BQU0sS0FBSyxHQUFHLENBQUM7QUFDZixNQUFNLE9BQU8sR0FBRyxDQUFDO0FBQ2pCLE1BQU0sT0FBTyxHQUFHO0FBQ2hCLEVBQUUsS0FBSyxFQUFFLElBQUk7QUFDYixFQUFFLFFBQVEsRUFBRSxJQUFJO0FBQ2hCLEVBQUUsT0FBTyxFQUFFLElBQUk7QUFDZixFQUFFLEtBQUssRUFBRTtBQUNULENBQUM7QUFDRCxJQUFJLEtBQUssR0FBRyxJQUFJO0FBQ2hCLElBQUksWUFBWSxHQUFHLElBQUk7QUFDdkIsSUFBSSxvQkFBb0IsR0FBRyxJQUFJO0FBQy9CLElBQUksUUFBUSxHQUFHLElBQUk7QUFDbkIsSUFBSSxPQUFPLEdBQUcsSUFBSTtBQUNsQixJQUFJLE9BQU8sR0FBRyxJQUFJO0FBQ2xCLElBQUksU0FBUyxHQUFHLENBQUM7QUFDakIsU0FBUyxVQUFVLENBQUMsRUFBRSxFQUFFLGFBQWEsRUFBRTtBQUN2QyxFQUFFLE1BQU0sUUFBUSxHQUFHLFFBQVE7QUFDM0IsSUFBSSxLQUFLLEdBQUcsS0FBSztBQUNqQixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxLQUFLLENBQUM7QUFDN0IsSUFBSSxPQUFPLEdBQUcsYUFBYSxLQUFLLFNBQVMsR0FBRyxLQUFLLEdBQUcsYUFBYTtBQUNqRSxJQUFJLElBQUksR0FBRztBQUNYLFFBQVE7QUFDUixRQUFRO0FBQ1IsVUFBVSxLQUFLLEVBQUUsSUFBSTtBQUNyQixVQUFVLFFBQVEsRUFBRSxJQUFJO0FBQ3hCLFVBQVUsT0FBTyxFQUFFLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxHQUFHLElBQUk7QUFDbkQsVUFBVSxLQUFLLEVBQUU7QUFDakIsU0FBUztBQUNULElBQUksUUFBUSxHQUFHLE9BQU8sR0FBRyxFQUFFLEdBQUcsTUFBTSxFQUFFLENBQUMsTUFBTSxPQUFPLENBQUMsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM1RSxFQUFFLEtBQUssR0FBRyxJQUFJO0FBQ2QsRUFBRSxRQUFRLEdBQUcsSUFBSTtBQUNqQixFQUFFLElBQUk7QUFDTixJQUFJLE9BQU8sVUFBVSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUM7QUFDckMsRUFBRSxDQUFDLFNBQVM7QUFDWixJQUFJLFFBQVEsR0FBRyxRQUFRO0FBQ3ZCLElBQUksS0FBSyxHQUFHLEtBQUs7QUFDakIsRUFBRTtBQUNGO0FBQ0EsU0FBUyxZQUFZLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRTtBQUN0QyxFQUFFLE9BQU8sR0FBRyxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLGFBQWE7QUFDL0UsRUFBRSxNQUFNLENBQUMsR0FBRztBQUNaLElBQUksS0FBSztBQUNULElBQUksU0FBUyxFQUFFLElBQUk7QUFDbkIsSUFBSSxhQUFhLEVBQUUsSUFBSTtBQUN2QixJQUFJLFVBQVUsRUFBRSxPQUFPLENBQUMsTUFBTSxJQUFJO0FBQ2xDLEdBQUc7QUFDSCxFQUFFLE1BQU0sTUFBTSxHQUFHLEtBQUssSUFBSTtBQUMxQixJQUFJLElBQUksT0FBTyxLQUFLLEtBQUssVUFBVSxFQUFFO0FBQ3JDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQzVCLElBQUk7QUFDSixJQUFJLE9BQU8sV0FBVyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUM7QUFDaEMsRUFBRSxDQUFDO0FBQ0gsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUM7QUFDckM7QUFDQSxTQUFTLGNBQWMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtBQUM1QyxFQUFFLE1BQU0sQ0FBQyxHQUFHLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQztBQUNyRCxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztBQUN0QjtBQUNBLFNBQVMsa0JBQWtCLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7QUFDaEQsRUFBRSxNQUFNLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7QUFDdEQsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7QUFDdEI7QUFDQSxTQUFTLFlBQVksQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtBQUMxQyxFQUFFLFVBQVUsR0FBRyxjQUFjO0FBQzdCLEVBQUUsTUFBTSxDQUFDLEdBQUcsaUJBQWlCLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO0FBQ3RELEVBQUUsQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJO0FBQ2YsRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7QUFDbEQ7QUFDQSxTQUFTLFVBQVUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtBQUN4QyxFQUFFLE9BQU8sR0FBRyxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLGFBQWE7QUFDL0UsRUFBRSxNQUFNLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFDakQsRUFBRSxDQUFDLENBQUMsU0FBUyxHQUFHLElBQUk7QUFDcEIsRUFBRSxDQUFDLENBQUMsYUFBYSxHQUFHLElBQUk7QUFDeEIsRUFBRSxDQUFDLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksU0FBUztBQUM1QyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztBQUN0QixFQUFFLE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDM0I7QUFDQSxTQUFTLEtBQUssQ0FBQyxFQUFFLEVBQUU7QUFDbkIsRUFBRSxPQUFPLFVBQVUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDO0FBQzlCO0FBQ0EsU0FBUyxPQUFPLENBQUMsRUFBRSxFQUFFO0FBQ3JCLEVBQUUsSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFO0FBQ3BDLEVBQUUsTUFBTSxRQUFRLEdBQUcsUUFBUTtBQUMzQixFQUFFLFFBQVEsR0FBRyxJQUFJO0FBQ2pCLEVBQUUsSUFBSTtBQUNOLElBQUksSUFBSSxvQkFBb0IsRUFBRTtBQUM5QixJQUFJLE9BQU8sRUFBRSxFQUFFO0FBQ2YsRUFBRSxDQUFDLFNBQVM7QUFDWixJQUFJLFFBQVEsR0FBRyxRQUFRO0FBQ3ZCLEVBQUU7QUFDRjtBQUNBLFNBQVMsT0FBTyxDQUFDLEVBQUUsRUFBRTtBQUNyQixFQUFFLFlBQVksQ0FBQyxNQUFNLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNqQztBQUNBLFNBQVMsU0FBUyxDQUFDLEVBQUUsRUFBRTtBQUN2QixFQUFFLElBQUksS0FBSyxLQUFLLElBQUksQ0FBQztBQUNyQixPQUFPLElBQUksS0FBSyxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUUsS0FBSyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUN6RCxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUM5QixFQUFFLE9BQU8sRUFBRTtBQUNYO0FBQ0EsU0FBUyxXQUFXLEdBQUc7QUFDdkIsRUFBRSxPQUFPLFFBQVE7QUFDakI7QUFDQSxTQUFTLGVBQWUsQ0FBQyxFQUFFLEVBQUU7QUFDN0IsRUFBRSxNQUFNLENBQUMsR0FBRyxRQUFRO0FBQ3BCLEVBQUUsTUFBTSxDQUFDLEdBQUcsS0FBSztBQUNqQixFQUFFLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNO0FBQ3RDLElBQUksUUFBUSxHQUFHLENBQUM7QUFDaEIsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUNiLElBQUksSUFBSSxDQUFDO0FBQ1QsSUFBSSxVQUFVLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQztBQUN6QixJQUFJLFFBQVEsR0FBRyxLQUFLLEdBQUcsSUFBSTtBQUMzQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsU0FBUztBQUNqQyxFQUFFLENBQUMsQ0FBQztBQUNKO0FBQ0EsTUFBTSxDQUFDLFlBQTZCLENBQUMsaUJBQWlCLFlBQVksQ0FBQyxLQUFLLENBQUM7QUFDekUsU0FBUyxhQUFhLEdBQUc7QUFDekIsRUFBRSxPQUFPLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQztBQUN4QztBQUNBLFNBQVMsUUFBUSxDQUFDLEVBQUUsRUFBRTtBQUN0QixFQUFFLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxFQUFFLENBQUM7QUFDakMsRUFBRSxNQUFNLElBQUksR0FBRyxVQUFVLENBQUMsTUFBTSxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUM1RCxFQUFFLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTTtBQUN2QixJQUFJLE1BQU0sQ0FBQyxHQUFHLElBQUksRUFBRTtBQUNwQixJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUU7QUFDdEQsRUFBRSxDQUFDO0FBQ0gsRUFBRSxPQUFPLElBQUk7QUFDYjtBQUNBLFNBQVMsVUFBVSxHQUFHO0FBQ3RCLEVBQUUsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNwQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxNQUFNLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUM7QUFDdkQsU0FBUztBQUNULE1BQU0sTUFBTSxPQUFPLEdBQUcsT0FBTztBQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJO0FBQ3BCLE1BQU0sVUFBVSxDQUFDLE1BQU0sWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQztBQUNqRCxNQUFNLE9BQU8sR0FBRyxPQUFPO0FBQ3ZCLElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxJQUFJLFFBQVEsRUFBRTtBQUNoQixJQUFJLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQztBQUM1RCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO0FBQzNCLE1BQU0sUUFBUSxDQUFDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztBQUMvQixNQUFNLFFBQVEsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxLQUFLLENBQUM7QUFDcEMsSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUNqQyxNQUFNLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN0QyxJQUFJO0FBQ0osSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUN6QixNQUFNLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDakMsTUFBTSxJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ3hELElBQUksQ0FBQyxNQUFNO0FBQ1gsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDbkMsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7QUFDMUQsSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLE9BQU8sSUFBSSxDQUFDLEtBQUs7QUFDbkI7QUFDQSxTQUFTLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRTtBQUMxQyxFQUFFLElBQUksT0FBTztBQUNiLElBQUksSUFBSSxDQUFDLEtBQUs7QUFDZCxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUU7QUFDNUQsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUs7QUFDdEIsSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7QUFDakQsTUFBTSxVQUFVLENBQUMsTUFBTTtBQUN2QixRQUFRLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzNELFVBQVUsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDckMsVUFBVSxNQUFNLGlCQUFpQixHQUFHLFlBQVksSUFBSSxZQUFZLENBQUMsT0FBTztBQUN4RSxVQUFVLElBQUksaUJBQWlCLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDakUsVUFBVSxJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUU7QUFDeEQsWUFBWSxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDdkMsaUJBQWlCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLFlBQVksSUFBSSxDQUFDLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDOUMsVUFBVTtBQUNWLFVBQVUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsS0FBSztBQUNqRCxRQUFRO0FBQ1IsUUFBUSxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxFQUFFO0FBQ25DLFVBQVUsT0FBTyxHQUFHLEVBQUU7QUFDdEIsVUFBVSxJQUFJLE1BQU0sQ0FBQztBQUNyQixVQUFVLE1BQU0sSUFBSSxLQUFLLEVBQUU7QUFDM0IsUUFBUTtBQUNSLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQztBQUNmLElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxPQUFPLEtBQUs7QUFDZDtBQUNBLFNBQVMsaUJBQWlCLENBQUMsSUFBSSxFQUFFO0FBQ2pDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUU7QUFDaEIsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQ2pCLEVBQUUsTUFBTSxJQUFJLEdBQUcsU0FBUztBQUN4QixFQUFFLGNBQWM7QUFDaEIsSUFBSSxJQUFJO0FBQ1IsSUFBSSxJQUFJLENBQUMsS0FBSztBQUNkLElBQUk7QUFDSixHQUFHO0FBQ0g7QUFDQSxTQUFTLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtBQUMzQyxFQUFFLElBQUksU0FBUztBQUNmLEVBQUUsTUFBTSxLQUFLLEdBQUcsS0FBSztBQUNyQixJQUFJLFFBQVEsR0FBRyxRQUFRO0FBQ3ZCLEVBQUUsUUFBUSxHQUFHLEtBQUssR0FBRyxJQUFJO0FBQ3pCLEVBQUUsSUFBSTtBQUNOLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDO0FBQzlCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFO0FBQ2hCLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO0FBQ25CLE1BQU07QUFDTixRQUFRLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSztBQUMxQixRQUFRLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO0FBQ25ELFFBQVEsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJO0FBQ3pCLE1BQU07QUFDTixJQUFJO0FBQ0osSUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxDQUFDO0FBQzdCLElBQUksT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDO0FBQzNCLEVBQUUsQ0FBQyxTQUFTO0FBQ1osSUFBSSxRQUFRLEdBQUcsUUFBUTtBQUN2QixJQUFJLEtBQUssR0FBRyxLQUFLO0FBQ2pCLEVBQUU7QUFDRixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxFQUFFO0FBQ2pELElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxXQUFXLElBQUksSUFBSSxFQUFFO0FBQ3ZELE1BQU0sV0FBVyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUM7QUFDbEMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTO0FBQ2pDLElBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJO0FBQ3pCLEVBQUU7QUFDRjtBQUNBLFNBQVMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxHQUFHLEtBQUssRUFBRSxPQUFPLEVBQUU7QUFDbkUsRUFBRSxNQUFNLENBQUMsR0FBRztBQUNaLElBQUksRUFBRTtBQUNOLElBQUksS0FBSyxFQUFFLEtBQUs7QUFDaEIsSUFBSSxTQUFTLEVBQUUsSUFBSTtBQUNuQixJQUFJLEtBQUssRUFBRSxJQUFJO0FBQ2YsSUFBSSxPQUFPLEVBQUUsSUFBSTtBQUNqQixJQUFJLFdBQVcsRUFBRSxJQUFJO0FBQ3JCLElBQUksUUFBUSxFQUFFLElBQUk7QUFDbEIsSUFBSSxLQUFLLEVBQUUsSUFBSTtBQUNmLElBQUksS0FBSyxFQUFFLEtBQUs7QUFDaEIsSUFBSSxPQUFPLEVBQUUsS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSTtBQUN6QyxJQUFJO0FBQ0osR0FBRztBQUNILEVBQUUsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDO0FBQ3JCLE9BQU8sSUFBSSxLQUFLLEtBQUssT0FBTyxFQUFFO0FBQzlCLElBQUk7QUFDSixNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDekMsV0FBVyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDOUIsSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLE9BQU8sQ0FBQztBQUNWO0FBQ0EsU0FBUyxNQUFNLENBQUMsSUFBSSxFQUFFO0FBQ3RCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLE1BQU0sQ0FBQyxFQUFFO0FBQzFCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLE1BQU0sT0FBTyxFQUFFLE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQztBQUN6RCxFQUFFLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDakcsRUFBRSxNQUFNLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQztBQUMxQixFQUFFLE9BQU8sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsRUFBRTtBQUNqRixJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUN4QyxFQUFFO0FBQ0YsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDbEQsSUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQztBQUN2QixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxNQUFNLEtBQUssRUFBRTtBQUNoQyxNQUFNLGlCQUFpQixDQUFDLElBQUksQ0FBQztBQUM3QixJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssTUFBTSxPQUFPLEVBQUU7QUFDekMsTUFBTSxNQUFNLE9BQU8sR0FBRyxPQUFPO0FBQzdCLE1BQU0sT0FBTyxHQUFHLElBQUk7QUFDcEIsTUFBTSxVQUFVLENBQUMsTUFBTSxZQUFZLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQztBQUMvRCxNQUFNLE9BQU8sR0FBRyxPQUFPO0FBQ3ZCLElBQUk7QUFDSixFQUFFO0FBQ0Y7QUFDQSxTQUFTLFVBQVUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFO0FBQzlCLEVBQUUsSUFBSSxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUU7QUFDMUIsRUFBRSxJQUFJLElBQUksR0FBRyxLQUFLO0FBQ2xCLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEdBQUcsRUFBRTtBQUN6QixFQUFFLElBQUksT0FBTyxFQUFFLElBQUksR0FBRyxJQUFJO0FBQzFCLE9BQU8sT0FBTyxHQUFHLEVBQUU7QUFDbkIsRUFBRSxTQUFTLEVBQUU7QUFDYixFQUFFLElBQUk7QUFDTixJQUFJLE1BQU0sR0FBRyxHQUFHLEVBQUUsRUFBRTtBQUNwQixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUM7QUFDekIsSUFBSSxPQUFPLEdBQUc7QUFDZCxFQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRTtBQUNoQixJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxHQUFHLElBQUk7QUFDN0IsSUFBSSxPQUFPLEdBQUcsSUFBSTtBQUNsQixJQUFJLFdBQVcsQ0FBQyxHQUFHLENBQUM7QUFDcEIsRUFBRTtBQUNGO0FBQ0EsU0FBUyxlQUFlLENBQUMsSUFBSSxFQUFFO0FBQy9CLEVBQUUsSUFBSSxPQUFPLEVBQUU7QUFDZixJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUM7QUFDckIsSUFBSSxPQUFPLEdBQUcsSUFBSTtBQUNsQixFQUFFO0FBQ0YsRUFBRSxJQUFJLElBQUksRUFBRTtBQUNaLEVBQUUsTUFBTSxDQUFDLEdBQUcsT0FBTztBQUNuQixFQUFFLE9BQU8sR0FBRyxJQUFJO0FBQ2hCLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUM7QUFDdEQ7QUFDQSxTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUU7QUFDekIsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pEO0FBQ0EsU0FBUyxjQUFjLENBQUMsS0FBSyxFQUFFO0FBQy9CLEVBQUUsSUFBSSxDQUFDO0FBQ1AsSUFBSSxVQUFVLEdBQUcsQ0FBQztBQUNsQixFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNyQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDdEIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQzFCLFNBQVMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsQ0FBQztBQUNoQyxFQUFFO0FBQ0YsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25EO0FBQ0EsU0FBUyxZQUFZLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRTtBQUNwQyxFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQztBQUNoQixFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ25ELElBQUksTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDbEMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUU7QUFDeEIsTUFBTSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSztBQUNoQyxNQUFNLElBQUksS0FBSyxLQUFLLEtBQUssRUFBRTtBQUMzQixRQUFRLElBQUksTUFBTSxLQUFLLE1BQU0sS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7QUFDcEYsVUFBVSxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ3hCLE1BQU0sQ0FBQyxNQUFNLElBQUksS0FBSyxLQUFLLE9BQU8sRUFBRSxZQUFZLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztBQUNoRSxJQUFJO0FBQ0osRUFBRTtBQUNGO0FBQ0EsU0FBUyxjQUFjLENBQUMsSUFBSSxFQUFFO0FBQzlCLEVBQUUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDckQsSUFBSSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztBQUMvQixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFO0FBQ2xCLE1BQU0sQ0FBQyxDQUFDLEtBQUssR0FBRyxPQUFPO0FBQ3ZCLE1BQU0sSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLFdBQVcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDMUIsTUFBTSxDQUFDLENBQUMsU0FBUyxJQUFJLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDdEMsSUFBSTtBQUNKLEVBQUU7QUFDRjtBQUNBLFNBQVMsU0FBUyxDQUFDLElBQUksRUFBRTtBQUN6QixFQUFFLElBQUksQ0FBQztBQUNQLEVBQUUsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ3BCLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUNoQyxNQUFNLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO0FBQ3ZDLFFBQVEsS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFO0FBQ3RDLFFBQVEsR0FBRyxHQUFHLE1BQU0sQ0FBQyxTQUFTO0FBQzlCLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRTtBQUM3QixRQUFRLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUU7QUFDM0IsVUFBVSxDQUFDLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUU7QUFDeEMsUUFBUSxJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFO0FBQ2hDLFVBQVUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLO0FBQ2xDLFVBQVUsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7QUFDeEIsVUFBVSxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7QUFDekMsUUFBUTtBQUNSLE1BQU07QUFDTixJQUFJO0FBQ0osRUFBRTtBQUNGLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ25CLElBQUksS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0UsSUFBSSxPQUFPLElBQUksQ0FBQyxNQUFNO0FBQ3RCLEVBQUU7QUFDRixFQUFFLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNsQixJQUFJLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pFLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJO0FBQ3JCLEVBQUU7QUFDRixFQUFFLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtBQUNyQixJQUFJLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDdEUsSUFBSSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUk7QUFDeEIsRUFBRTtBQUNGLEVBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDO0FBQ2hCO0FBQ0EsU0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFO0FBQ3hCLEVBQUUsSUFBSSxHQUFHLFlBQVksS0FBSyxFQUFFLE9BQU8sR0FBRztBQUN0QyxFQUFFLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxHQUFHLEtBQUssUUFBUSxHQUFHLEdBQUcsR0FBRyxlQUFlLEVBQUU7QUFDcEUsSUFBSSxLQUFLLEVBQUU7QUFDWCxHQUFHLENBQUM7QUFDSjtBQUNBLFNBQVMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLEdBQUcsS0FBSyxFQUFFO0FBQ3pDLEVBQUUsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUM5QixFQUFFLE1BQU0sS0FBSztBQUNiO0FBQ0EsU0FBUyxlQUFlLENBQUMsUUFBUSxFQUFFO0FBQ25DLEVBQUUsSUFBSSxPQUFPLFFBQVEsS0FBSyxVQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE9BQU8sZUFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzVGLEVBQUUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQy9CLElBQUksTUFBTSxPQUFPLEdBQUcsRUFBRTtBQUN0QixJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzlDLE1BQU0sTUFBTSxNQUFNLEdBQUcsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRCxNQUFNLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ3hGLElBQUk7QUFDSixJQUFJLE9BQU8sT0FBTztBQUNsQixFQUFFO0FBQ0YsRUFBRSxPQUFPLFFBQVE7QUFDakI7O0FBRUEsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztBQUNuQyxTQUFTLE9BQU8sQ0FBQyxDQUFDLEVBQUU7QUFDcEIsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDM0M7QUFDQSxTQUFTLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQU8sR0FBRyxFQUFFLEVBQUU7QUFDN0MsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFO0FBQ2hCLElBQUksTUFBTSxHQUFHLEVBQUU7QUFDZixJQUFJLFNBQVMsR0FBRyxFQUFFO0FBQ2xCLElBQUksR0FBRyxHQUFHLENBQUM7QUFDWCxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSTtBQUMxQyxFQUFFLFNBQVMsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNyQyxFQUFFLE9BQU8sTUFBTTtBQUNmLElBQUksSUFBSSxRQUFRLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRTtBQUMvQixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTTtBQUM5QixNQUFNLENBQUM7QUFDUCxNQUFNLENBQUM7QUFDUCxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUM7QUFDcEIsSUFBSSxPQUFPLE9BQU8sQ0FBQyxNQUFNO0FBQ3pCLE1BQU0sSUFBSSxVQUFVLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUk7QUFDaEcsTUFBTSxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDeEIsUUFBUSxJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUU7QUFDdkIsVUFBVSxPQUFPLENBQUMsU0FBUyxDQUFDO0FBQzVCLFVBQVUsU0FBUyxHQUFHLEVBQUU7QUFDeEIsVUFBVSxLQUFLLEdBQUcsRUFBRTtBQUNwQixVQUFVLE1BQU0sR0FBRyxFQUFFO0FBQ3JCLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFDakIsVUFBVSxPQUFPLEtBQUssT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNuQyxRQUFRO0FBQ1IsUUFBUSxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUU7QUFDOUIsVUFBVSxLQUFLLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDNUIsVUFBVSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLFFBQVEsSUFBSTtBQUM3QyxZQUFZLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRO0FBQ25DLFlBQVksT0FBTyxPQUFPLENBQUMsUUFBUSxFQUFFO0FBQ3JDLFVBQVUsQ0FBQyxDQUFDO0FBQ1osVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUNqQixRQUFRO0FBQ1IsTUFBTSxDQUFDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFO0FBQzVCLFFBQVEsTUFBTSxHQUFHLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUNsQyxRQUFRLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3JDLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDaEMsVUFBVSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztBQUN4QyxRQUFRO0FBQ1IsUUFBUSxHQUFHLEdBQUcsTUFBTTtBQUNwQixNQUFNLENBQUMsTUFBTTtBQUNiLFFBQVEsSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUNoQyxRQUFRLGFBQWEsR0FBRyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDekMsUUFBUSxPQUFPLEtBQUssV0FBVyxHQUFHLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BELFFBQVE7QUFDUixVQUFVLEtBQUssR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQztBQUNoRCxVQUFVLEtBQUssR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDekQsVUFBVSxLQUFLO0FBQ2YsU0FBUztBQUNULFFBQVE7QUFDUixVQUFVLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxNQUFNLEdBQUcsQ0FBQztBQUM1QyxVQUFVLEdBQUcsSUFBSSxLQUFLLElBQUksTUFBTSxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUM1RSxVQUFVLEdBQUcsRUFBRSxFQUFFLE1BQU07QUFDdkIsVUFBVTtBQUNWLFVBQVUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUM7QUFDcEMsVUFBVSxhQUFhLENBQUMsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUNoRCxVQUFVLE9BQU8sS0FBSyxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3pELFFBQVE7QUFDUixRQUFRLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBRTtBQUM5QixRQUFRLGNBQWMsR0FBRyxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQzlDLFFBQVEsS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDMUMsVUFBVSxJQUFJLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUM1QixVQUFVLENBQUMsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztBQUNsQyxVQUFVLGNBQWMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssU0FBUyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDdEQsVUFBVSxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7QUFDakMsUUFBUTtBQUNSLFFBQVEsS0FBSyxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDdkMsVUFBVSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN6QixVQUFVLENBQUMsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztBQUNsQyxVQUFVLElBQUksQ0FBQyxLQUFLLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDM0MsWUFBWSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUMvQixZQUFZLGFBQWEsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQzNDLFlBQVksT0FBTyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEQsWUFBWSxDQUFDLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQztBQUNqQyxZQUFZLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUNuQyxVQUFVLENBQUMsTUFBTSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDL0IsUUFBUTtBQUNSLFFBQVEsS0FBSyxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDekMsVUFBVSxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7QUFDekIsWUFBWSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMvQixZQUFZLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDO0FBQzNDLFlBQVksSUFBSSxPQUFPLEVBQUU7QUFDekIsY0FBYyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQztBQUN6QyxjQUFjLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsWUFBWTtBQUNaLFVBQVUsQ0FBQyxNQUFNLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBQy9DLFFBQVE7QUFDUixRQUFRLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsTUFBTSxFQUFFO0FBQ2hELFFBQVEsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLE1BQU07QUFDTixNQUFNLE9BQU8sTUFBTTtBQUNuQixJQUFJLENBQUMsQ0FBQztBQUNOLElBQUksU0FBUyxNQUFNLENBQUMsUUFBUSxFQUFFO0FBQzlCLE1BQU0sU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVE7QUFDN0IsTUFBTSxJQUFJLE9BQU8sRUFBRTtBQUNuQixRQUFRLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQztBQUN4QyxRQUFRLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHO0FBQ3hCLFFBQVEsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNwQyxNQUFNO0FBQ04sTUFBTSxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsSUFBSTtBQUNKLEVBQUUsQ0FBQztBQUNIO0FBQ0EsU0FBUyxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEdBQUcsRUFBRSxFQUFFO0FBQy9DLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUNoQixJQUFJLE1BQU0sR0FBRyxFQUFFO0FBQ2YsSUFBSSxTQUFTLEdBQUcsRUFBRTtBQUNsQixJQUFJLE9BQU8sR0FBRyxFQUFFO0FBQ2hCLElBQUksR0FBRyxHQUFHLENBQUM7QUFDWCxJQUFJLENBQUM7QUFDTCxFQUFFLFNBQVMsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNyQyxFQUFFLE9BQU8sTUFBTTtBQUNmLElBQUksTUFBTSxRQUFRLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRTtBQUNqQyxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTTtBQUM5QixJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUM7QUFDcEIsSUFBSSxPQUFPLE9BQU8sQ0FBQyxNQUFNO0FBQ3pCLE1BQU0sSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQ3hCLFFBQVEsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFO0FBQ3ZCLFVBQVUsT0FBTyxDQUFDLFNBQVMsQ0FBQztBQUM1QixVQUFVLFNBQVMsR0FBRyxFQUFFO0FBQ3hCLFVBQVUsS0FBSyxHQUFHLEVBQUU7QUFDcEIsVUFBVSxNQUFNLEdBQUcsRUFBRTtBQUNyQixVQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ2pCLFVBQVUsT0FBTyxHQUFHLEVBQUU7QUFDdEIsUUFBUTtBQUNSLFFBQVEsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO0FBQzlCLFVBQVUsS0FBSyxHQUFHLENBQUMsUUFBUSxDQUFDO0FBQzVCLFVBQVUsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxRQUFRLElBQUk7QUFDN0MsWUFBWSxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUTtBQUNuQyxZQUFZLE9BQU8sT0FBTyxDQUFDLFFBQVEsRUFBRTtBQUNyQyxVQUFVLENBQUMsQ0FBQztBQUNaLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFDakIsUUFBUTtBQUNSLFFBQVEsT0FBTyxNQUFNO0FBQ3JCLE1BQU07QUFDTixNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRTtBQUNqQyxRQUFRLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUN0QixRQUFRLFNBQVMsR0FBRyxFQUFFO0FBQ3RCLFFBQVEsS0FBSyxHQUFHLEVBQUU7QUFDbEIsUUFBUSxNQUFNLEdBQUcsRUFBRTtBQUNuQixRQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ2YsTUFBTTtBQUNOLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDbkMsUUFBUSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDMUQsVUFBVSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkMsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtBQUN0QyxVQUFVLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBQ3hDLFFBQVE7QUFDUixNQUFNO0FBQ04sTUFBTSxPQUFPLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3BDLFFBQVEsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ3RCLE1BQU07QUFDTixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsTUFBTTtBQUN0RCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMvQixNQUFNLFFBQVEsTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQztBQUMzQyxJQUFJLENBQUMsQ0FBQztBQUNOLElBQUksU0FBUyxNQUFNLENBQUMsUUFBUSxFQUFFO0FBQzlCLE1BQU0sU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVE7QUFDN0IsTUFBTSxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEQsTUFBTSxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRztBQUN0QixNQUFNLE9BQU8sS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDeEIsSUFBSTtBQUNKLEVBQUUsQ0FBQztBQUNIO0FBQ0EsU0FBUyxlQUFlLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUN0QyxFQUFFLE9BQU8sT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQztBQUN6QztBQUNBLFNBQVMsTUFBTSxHQUFHO0FBQ2xCLEVBQUUsT0FBTyxJQUFJO0FBQ2I7QUFDQSxNQUFNLFNBQVMsR0FBRztBQUNsQixFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRTtBQUM3QixJQUFJLElBQUksUUFBUSxLQUFLLE1BQU0sRUFBRSxPQUFPLFFBQVE7QUFDNUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0FBQzFCLEVBQUUsQ0FBQztBQUNILEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUU7QUFDbkIsSUFBSSxJQUFJLFFBQVEsS0FBSyxNQUFNLEVBQUUsT0FBTyxJQUFJO0FBQ3hDLElBQUksT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUMxQixFQUFFLENBQUM7QUFDSCxFQUFFLEdBQUcsRUFBRSxNQUFNO0FBQ2IsRUFBRSxjQUFjLEVBQUUsTUFBTTtBQUN4QixFQUFFLHdCQUF3QixDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUU7QUFDeEMsSUFBSSxPQUFPO0FBQ1gsTUFBTSxZQUFZLEVBQUUsSUFBSTtBQUN4QixNQUFNLFVBQVUsRUFBRSxJQUFJO0FBQ3RCLE1BQU0sR0FBRyxHQUFHO0FBQ1osUUFBUSxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0FBQzlCLE1BQU0sQ0FBQztBQUNQLE1BQU0sR0FBRyxFQUFFLE1BQU07QUFDakIsTUFBTSxjQUFjLEVBQUU7QUFDdEIsS0FBSztBQUNMLEVBQUUsQ0FBQztBQUNILEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRTtBQUNiLElBQUksT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFO0FBQ25CLEVBQUU7QUFDRixDQUFDO0FBQ0QsU0FBUyxhQUFhLENBQUMsQ0FBQyxFQUFFO0FBQzFCLEVBQUUsT0FBTyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxVQUFVLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7QUFDMUQ7QUFDQSxTQUFTLGNBQWMsR0FBRztBQUMxQixFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7QUFDekQsSUFBSSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDdkIsSUFBSSxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUUsT0FBTyxDQUFDO0FBQ2pDLEVBQUU7QUFDRjtBQUNBLFNBQVMsVUFBVSxDQUFDLEdBQUcsT0FBTyxFQUFFO0FBQ2hDLEVBQUUsSUFBSSxLQUFLLEdBQUcsS0FBSztBQUNuQixFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzNDLElBQUksTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUN4QixJQUFJLEtBQUssR0FBRyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQ3pDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxLQUFLLFVBQVUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDOUUsRUFBRTtBQUNGLEVBQUUsSUFBSSxjQUFjLElBQUksS0FBSyxFQUFFO0FBQy9CLElBQUksT0FBTyxJQUFJLEtBQUs7QUFDcEIsTUFBTTtBQUNOLFFBQVEsR0FBRyxDQUFDLFFBQVEsRUFBRTtBQUN0QixVQUFVLEtBQUssSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN4RCxZQUFZLE1BQU0sQ0FBQyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDekQsWUFBWSxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUUsT0FBTyxDQUFDO0FBQ3pDLFVBQVU7QUFDVixRQUFRLENBQUM7QUFDVCxRQUFRLEdBQUcsQ0FBQyxRQUFRLEVBQUU7QUFDdEIsVUFBVSxLQUFLLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDeEQsWUFBWSxJQUFJLFFBQVEsSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJO0FBQ2xFLFVBQVU7QUFDVixVQUFVLE9BQU8sS0FBSztBQUN0QixRQUFRLENBQUM7QUFDVCxRQUFRLElBQUksR0FBRztBQUNmLFVBQVUsTUFBTSxJQUFJLEdBQUcsRUFBRTtBQUN6QixVQUFVLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRTtBQUNqRCxZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hFLFVBQVUsT0FBTyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkMsUUFBUTtBQUNSLE9BQU87QUFDUCxNQUFNO0FBQ04sS0FBSztBQUNMLEVBQUU7QUFDRixFQUFFLE1BQU0sVUFBVSxHQUFHLEVBQUU7QUFDdkIsRUFBRSxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNyQyxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNoRCxJQUFJLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDN0IsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ2pCLElBQUksTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQztBQUN6RCxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNyRCxNQUFNLE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDL0IsTUFBTSxJQUFJLEdBQUcsS0FBSyxXQUFXLElBQUksR0FBRyxLQUFLLGFBQWEsRUFBRTtBQUN4RCxNQUFNLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDO0FBQy9ELE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUN6QixRQUFRLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDNUIsWUFBWTtBQUNaLGNBQWMsVUFBVSxFQUFFLElBQUk7QUFDOUIsY0FBYyxZQUFZLEVBQUUsSUFBSTtBQUNoQyxjQUFjLEdBQUcsRUFBRSxjQUFjLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2pGO0FBQ0EsWUFBWSxJQUFJLENBQUMsS0FBSyxLQUFLO0FBQzNCLFlBQVk7QUFDWixZQUFZLFNBQVM7QUFDckIsTUFBTSxDQUFDLE1BQU07QUFDYixRQUFRLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUM7QUFDdkMsUUFBUSxJQUFJLE9BQU8sRUFBRTtBQUNyQixVQUFVLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNELGVBQWUsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQztBQUMzRSxRQUFRO0FBQ1IsTUFBTTtBQUNOLElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxNQUFNLE1BQU0sR0FBRyxFQUFFO0FBQ25CLEVBQUUsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDMUMsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDcEQsSUFBSSxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDO0FBQzlCLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDekIsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFDbEUsU0FBUyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUztBQUNwRCxFQUFFO0FBQ0YsRUFBRSxPQUFPLE1BQU07QUFDZjs7QUFFQSxNQUFNLGFBQWEsR0FBRyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO0FBQzFELFNBQVMsR0FBRyxDQUFDLEtBQUssRUFBRTtBQUNwQixFQUFFLE1BQU0sUUFBUSxHQUFHLFVBQVUsSUFBSSxLQUFLLElBQUk7QUFDMUMsSUFBSSxRQUFRLEVBQUUsTUFBTSxLQUFLLENBQUM7QUFDMUIsR0FBRztBQUNILEVBQUUsT0FBTyxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsSUFBSSxTQUFTLENBQUMsQ0FBQztBQUN0RjtBQUNBLFNBQVMsS0FBSyxDQUFDLEtBQUssRUFBRTtBQUN0QixFQUFFLE1BQU0sUUFBUSxHQUFHLFVBQVUsSUFBSSxLQUFLLElBQUk7QUFDMUMsSUFBSSxRQUFRLEVBQUUsTUFBTSxLQUFLLENBQUM7QUFDMUIsR0FBRztBQUNILEVBQUUsT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsSUFBSSxTQUFTLENBQUMsQ0FBQztBQUN4RjtBQUNBLFNBQVMsSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNyQixFQUFFLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLO0FBQzNCLEVBQUUsTUFBTSxjQUFjLEdBQUcsVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDO0FBQzNFLEVBQUUsTUFBTSxTQUFTLEdBQUc7QUFDcEIsTUFBTTtBQUNOLE1BQU0sVUFBVSxDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUU7QUFDNUMsUUFBUSxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDbEMsT0FBTyxDQUFDO0FBQ1IsRUFBRSxPQUFPLFVBQVU7QUFDbkIsSUFBSSxNQUFNO0FBQ1YsTUFBTSxNQUFNLENBQUMsR0FBRyxTQUFTLEVBQUU7QUFDM0IsTUFBTSxJQUFJLENBQUMsRUFBRTtBQUNiLFFBQVEsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVE7QUFDcEMsUUFBUSxNQUFNLEVBQUUsR0FBRyxPQUFPLEtBQUssS0FBSyxVQUFVLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDO0FBQ2xFLFFBQVEsT0FBTztBQUNmLFlBQVksT0FBTyxDQUFDO0FBQ3BCLGNBQWMsS0FBSztBQUNuQixnQkFBZ0I7QUFDaEIsb0JBQW9CO0FBQ3BCLG9CQUFvQixNQUFNO0FBQzFCLHNCQUFzQixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sYUFBYSxDQUFDLE1BQU0sQ0FBQztBQUMxRSxzQkFBc0IsT0FBTyxjQUFjLEVBQUU7QUFDN0Msb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQSxZQUFZLEtBQUs7QUFDakIsTUFBTTtBQUNOLE1BQU0sT0FBTyxLQUFLLENBQUMsUUFBUTtBQUMzQixJQUFJLENBQUM7QUFDTCxJQUFJLFNBQVM7QUFDYixJQUFJO0FBQ0osR0FBRztBQUNIO0FBQ0EsU0FBUyxNQUFNLENBQUMsS0FBSyxFQUFFO0FBQ3ZCLEVBQUUsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLFFBQVEsQ0FBQztBQUM1QyxFQUFFLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNO0FBQ3RDLElBQUksTUFBTSxFQUFFLEdBQUcsR0FBRyxFQUFFO0FBQ3BCLElBQUksTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDN0MsSUFBSSxJQUFJLElBQUksR0FBRyxNQUFNLFNBQVM7QUFDOUIsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN6QyxNQUFNLE1BQU0sS0FBSyxHQUFHLENBQUM7QUFDckIsTUFBTSxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLE1BQU0sTUFBTSxRQUFRLEdBQUcsSUFBSTtBQUMzQixNQUFNLE1BQU0sY0FBYyxHQUFHLFVBQVU7QUFDdkMsUUFBUSxPQUFPLFFBQVEsRUFBRSxHQUFHLFNBQVMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQ2hELFFBQVEsU0FBUztBQUNqQixRQUFRO0FBQ1IsT0FBTztBQUNQLE1BQU0sTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQzNCLFVBQVU7QUFDVixVQUFVLFVBQVUsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFO0FBQ2hELFlBQVksTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3RDLFdBQVcsQ0FBQztBQUNaLE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxFQUFFLEtBQUssU0FBUyxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQztBQUN4RixJQUFJO0FBQ0osSUFBSSxPQUFPLElBQUk7QUFDZixFQUFFLENBQUMsQ0FBQztBQUNKLEVBQUUsT0FBTyxVQUFVO0FBQ25CLElBQUksTUFBTTtBQUNWLE1BQU0sTUFBTSxHQUFHLEdBQUcsVUFBVSxFQUFFLEVBQUU7QUFDaEMsTUFBTSxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sS0FBSyxDQUFDLFFBQVE7QUFDckMsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHO0FBQzdDLE1BQU0sTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFFBQVE7QUFDL0IsTUFBTSxNQUFNLEVBQUUsR0FBRyxPQUFPLEtBQUssS0FBSyxVQUFVLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDO0FBQ2hFLE1BQU0sT0FBTztBQUNiLFVBQVUsT0FBTyxDQUFDO0FBQ2xCLFlBQVksS0FBSztBQUNqQixjQUFjLEVBQUUsQ0FBQztBQUNqQixrQkFBa0IsY0FBYztBQUNoQyxrQkFBa0IsTUFBTTtBQUN4QixvQkFBb0IsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsS0FBSyxLQUFLLEVBQUUsTUFBTSxhQUFhLENBQUMsT0FBTyxDQUFDO0FBQzFGLG9CQUFvQixPQUFPLGNBQWMsRUFBRTtBQUMzQyxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBLFVBQVUsS0FBSztBQUNmLElBQUksQ0FBQztBQUNMLElBQUksU0FBUztBQUNiLElBQUk7QUFDSixHQUFHO0FBQ0g7QUFDQSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUU7QUFDdEIsRUFBRSxPQUFPLEtBQUs7QUFDZDs7QUFFQSxNQUFNLElBQUksR0FBRyxFQUFFLElBQUksVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7O0FBRXpDLFNBQVMsZUFBZSxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzNDLEVBQUUsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLE1BQU07QUFDeEIsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU07QUFDbkIsSUFBSSxJQUFJLEdBQUcsT0FBTztBQUNsQixJQUFJLE1BQU0sR0FBRyxDQUFDO0FBQ2QsSUFBSSxNQUFNLEdBQUcsQ0FBQztBQUNkLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVztBQUNuQyxJQUFJLEdBQUcsR0FBRyxJQUFJO0FBQ2QsRUFBRSxPQUFPLE1BQU0sR0FBRyxJQUFJLElBQUksTUFBTSxHQUFHLElBQUksRUFBRTtBQUN6QyxJQUFJLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNqQyxNQUFNLE1BQU0sRUFBRTtBQUNkLE1BQU0sTUFBTSxFQUFFO0FBQ2QsTUFBTTtBQUNOLElBQUk7QUFDSixJQUFJLE9BQU8sQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFO0FBQ3hDLE1BQU0sSUFBSSxFQUFFO0FBQ1osTUFBTSxJQUFJLEVBQUU7QUFDWixJQUFJO0FBQ0osSUFBSSxJQUFJLElBQUksS0FBSyxNQUFNLEVBQUU7QUFDekIsTUFBTSxNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsT0FBTyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEtBQUs7QUFDbkcsTUFBTSxPQUFPLE1BQU0sR0FBRyxJQUFJLEVBQUUsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUM7QUFDdEUsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLEtBQUssTUFBTSxFQUFFO0FBQ2hDLE1BQU0sT0FBTyxNQUFNLEdBQUcsSUFBSSxFQUFFO0FBQzVCLFFBQVEsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRTtBQUMzRCxRQUFRLE1BQU0sRUFBRTtBQUNoQixNQUFNO0FBQ04sSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRTtBQUN2RSxNQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLFdBQVc7QUFDeEMsTUFBTSxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQztBQUNuRSxNQUFNLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDO0FBQzlDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDdkIsSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUU7QUFDaEIsUUFBUSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQUU7QUFDdkIsUUFBUSxJQUFJLENBQUMsR0FBRyxNQUFNO0FBQ3RCLFFBQVEsT0FBTyxDQUFDLEdBQUcsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0FBQzNDLE1BQU07QUFDTixNQUFNLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3RDLE1BQU0sSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO0FBQ3pCLFFBQVEsSUFBSSxNQUFNLEdBQUcsS0FBSyxJQUFJLEtBQUssR0FBRyxJQUFJLEVBQUU7QUFDNUMsVUFBVSxJQUFJLENBQUMsR0FBRyxNQUFNO0FBQ3hCLFlBQVksUUFBUSxHQUFHLENBQUM7QUFDeEIsWUFBWSxDQUFDO0FBQ2IsVUFBVSxPQUFPLEVBQUUsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFO0FBQ3pDLFlBQVksSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxHQUFHLFFBQVEsRUFBRTtBQUN2RSxZQUFZLFFBQVEsRUFBRTtBQUN0QixVQUFVO0FBQ1YsVUFBVSxJQUFJLFFBQVEsR0FBRyxLQUFLLEdBQUcsTUFBTSxFQUFFO0FBQ3pDLFlBQVksTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNsQyxZQUFZLE9BQU8sTUFBTSxHQUFHLEtBQUssRUFBRSxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztBQUM3RSxVQUFVLENBQUMsTUFBTSxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ2xFLFFBQVEsQ0FBQyxNQUFNLE1BQU0sRUFBRTtBQUN2QixNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUU7QUFDakMsSUFBSTtBQUNKLEVBQUU7QUFDRjs7QUFFQSxNQUFNLFFBQVEsR0FBRyxlQUFlO0FBQ2hDLFNBQVMsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sR0FBRyxFQUFFLEVBQUU7QUFDbkQsRUFBRSxJQUFJLFFBQVE7QUFDZCxFQUFFLFVBQVUsQ0FBQyxPQUFPLElBQUk7QUFDeEIsSUFBSSxRQUFRLEdBQUcsT0FBTztBQUN0QixJQUFJLE9BQU8sS0FBSztBQUNoQixRQUFRLElBQUk7QUFDWixRQUFRLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsT0FBTyxDQUFDLFVBQVUsR0FBRyxJQUFJLEdBQUcsU0FBUyxFQUFFLElBQUksQ0FBQztBQUM1RSxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDO0FBQ25CLEVBQUUsT0FBTyxNQUFNO0FBQ2YsSUFBSSxRQUFRLEVBQUU7QUFDZCxJQUFJLE9BQU8sQ0FBQyxXQUFXLEdBQUcsRUFBRTtBQUM1QixFQUFFLENBQUM7QUFDSDtBQUNBLFNBQVMsUUFBUSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRTtBQUN2RCxFQUFFLElBQUksSUFBSTtBQUNWLEVBQUUsTUFBTSxNQUFNLEdBQUcsTUFBTTtBQUN2QixJQUFJLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDO0FBQ2hELElBQUksTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFdBQVcsRUFBRTtBQUN4QyxJQUFJLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUM7QUFDekQsSUFBSSxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBVTtBQUMxQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztBQUM5QixJQUFJLE9BQU8sVUFBVTtBQUNyQixFQUFFLENBQUM7QUFDSCxFQUFFLE1BQU0sRUFBRSxHQUFHO0FBQ2IsTUFBTSxNQUFNLE9BQU8sQ0FBQyxNQUFNLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLElBQUksR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztBQUM5RSxNQUFNLE1BQU0sQ0FBQyxJQUFJLEtBQUssSUFBSSxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQztBQUN2RCxFQUFFLEVBQUUsQ0FBQyxTQUFTLEdBQUcsRUFBRTtBQUNuQixFQUFFLE9BQU8sRUFBRTtBQUNYO0FBQ0EsU0FBUyxjQUFjLENBQUMsVUFBVSxFQUFFLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFO0FBQ2hFLEVBQUUsTUFBTSxDQUFDLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ2xFLEVBQUUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNyRCxJQUFJLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDOUIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUN0QixNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO0FBQ2pCLE1BQU0sUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxZQUFZLENBQUM7QUFDbkQsSUFBSTtBQUNKLEVBQUU7QUFDRjtBQUNBLFNBQVMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ3pDLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7QUFDNUI7QUFDQSxTQUFTLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2hDLEVBQUUsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDO0FBQ2xELE9BQU8sSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLO0FBQzdCO0FBQ0EsU0FBUyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUU7QUFDekQsRUFBRTtBQUNGLElBQUksSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ2hDLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDeEMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPO0FBQ3RDLEVBQUU7QUFDRjtBQUNBLFNBQVMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO0FBQ2xDLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLElBQUksR0FBRyxZQUFZLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEtBQUs7QUFDL0QsRUFBRSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSztBQUM5QixFQUFFLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLFFBQVEsU0FBUyxDQUFDLE9BQU8sR0FBRyxLQUFLO0FBQ2xFLEVBQUUsT0FBTyxJQUFJLEtBQUssUUFBUSxLQUFLLFNBQVMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLFNBQVMsQ0FBQztBQUNwRSxFQUFFLElBQUksS0FBSyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLEVBQUUsS0FBSyxLQUFLLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDdkIsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO0FBQ1YsRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUU7QUFDbEIsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBQ25ELElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLEVBQUU7QUFDRixFQUFFLEtBQUssQ0FBQyxJQUFJLEtBQUssRUFBRTtBQUNuQixJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ2hCLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ3ZCLE1BQU0sU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2pDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDakIsSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLE9BQU8sSUFBSTtBQUNiO0FBQ0EsU0FBUyxHQUFHLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7QUFDL0IsRUFBRSxPQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDeEM7QUFDQSxTQUFTLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUU7QUFDbkQsRUFBRSxJQUFJLE1BQU0sS0FBSyxTQUFTLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxHQUFHLEVBQUU7QUFDcEQsRUFBRSxJQUFJLE9BQU8sUUFBUSxLQUFLLFVBQVUsRUFBRSxPQUFPLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztBQUNoRyxFQUFFLGtCQUFrQixDQUFDLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxFQUFFLE9BQU8sQ0FBQztBQUMvRjtBQUNBLFNBQVMsWUFBWSxDQUFDLENBQUMsRUFBRTtBQUN6QixFQUFFLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNO0FBQ3JCLEVBQUUsTUFBTSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNCLEVBQUUsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLE1BQU07QUFDNUIsRUFBRSxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxhQUFhO0FBQzFDLEVBQUUsTUFBTSxRQUFRLEdBQUcsS0FBSztBQUN4QixJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRTtBQUN2QyxNQUFNLFlBQVksRUFBRSxJQUFJO0FBQ3hCLE1BQU07QUFDTixLQUFLLENBQUM7QUFDTixFQUFFLE1BQU0sVUFBVSxHQUFHLE1BQU07QUFDM0IsSUFBSSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO0FBQ25DLE1BQU0sTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckMsTUFBTSxJQUFJLEtBQUssU0FBUyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7QUFDOUUsTUFBTSxJQUFJLENBQUMsQ0FBQyxZQUFZLEVBQUU7QUFDMUIsSUFBSTtBQUNKLElBQUksSUFBSSxDQUFDLElBQUk7QUFDYixNQUFNLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRO0FBQ25DLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU07QUFDdkIsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDN0IsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUN6QixJQUFJLE9BQU8sSUFBSTtBQUNmLEVBQUUsQ0FBQztBQUNILEVBQUUsTUFBTSxVQUFVLEdBQUcsTUFBTTtBQUMzQixJQUFJLE9BQU8sVUFBVSxFQUFFLEtBQUssSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEYsRUFBRSxDQUFDO0FBQ0gsRUFBRSxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxlQUFlLEVBQUU7QUFDNUMsSUFBSSxZQUFZLEVBQUUsSUFBSTtBQUN0QixJQUFJLEdBQUcsR0FBRztBQUNWLE1BQU0sT0FBTyxJQUFJLElBQUksUUFBUTtBQUM3QixJQUFJO0FBQ0osR0FBRyxDQUFDO0FBQ0osRUFBRSxJQUFJLENBQUMsQ0FBQyxZQUFZLEVBQUU7QUFDdEIsSUFBSSxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsWUFBWSxFQUFFO0FBQ2pDLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM5QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3BCLE1BQU0sSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFO0FBQ3pCLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ3ZCLFFBQVEsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNO0FBQzFCLFFBQVEsVUFBVSxFQUFFO0FBQ3BCLFFBQVE7QUFDUixNQUFNO0FBQ04sTUFBTSxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssZ0JBQWdCLEVBQUU7QUFDaEQsUUFBUTtBQUNSLE1BQU07QUFDTixJQUFJO0FBQ0osRUFBRSxDQUFDLE1BQU0sVUFBVSxFQUFFO0FBQ3JCLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQztBQUNyQjtBQUNBLFNBQVMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtBQUN2RSxFQUFFLE9BQU8sT0FBTyxPQUFPLEtBQUssVUFBVSxFQUFFLE9BQU8sR0FBRyxPQUFPLEVBQUU7QUFDM0QsRUFBRSxJQUFJLEtBQUssS0FBSyxPQUFPLEVBQUUsT0FBTyxPQUFPO0FBQ3ZDLEVBQUUsTUFBTSxDQUFDLEdBQUcsT0FBTyxLQUFLO0FBQ3hCLElBQUksS0FBSyxHQUFHLE1BQU0sS0FBSyxTQUFTO0FBQ2hDLEVBQUUsTUFBTSxHQUFHLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxLQUFLLE1BQU07QUFDbkUsRUFBRSxJQUFJLENBQUMsS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtBQUN4QyxJQUFJLElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtBQUN4QixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFO0FBQzlCLE1BQU0sSUFBSSxLQUFLLEtBQUssT0FBTyxFQUFFLE9BQU8sT0FBTztBQUMzQyxJQUFJO0FBQ0osSUFBSSxJQUFJLEtBQUssRUFBRTtBQUNmLE1BQU0sSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUMzQixNQUFNLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFO0FBQ3ZDLFFBQVEsSUFBSSxDQUFDLElBQUksS0FBSyxLQUFLLEtBQUssSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7QUFDbEQsTUFBTSxDQUFDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO0FBQ2xELE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUM7QUFDNUQsSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLElBQUksT0FBTyxLQUFLLEVBQUUsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7QUFDekQsUUFBUSxPQUFPLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEdBQUcsS0FBSztBQUNoRCxNQUFNLENBQUMsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFdBQVcsR0FBRyxLQUFLO0FBQ2pELElBQUk7QUFDSixFQUFFLENBQUMsTUFBTSxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLFNBQVMsRUFBRTtBQUMvQyxJQUFJLE9BQU8sR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUM7QUFDcEQsRUFBRSxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssVUFBVSxFQUFFO0FBQy9CLElBQUksa0JBQWtCLENBQUMsTUFBTTtBQUM3QixNQUFNLElBQUksQ0FBQyxHQUFHLEtBQUssRUFBRTtBQUNyQixNQUFNLE9BQU8sT0FBTyxDQUFDLEtBQUssVUFBVSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDN0MsTUFBTSxPQUFPLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO0FBQzVELElBQUksQ0FBQyxDQUFDO0FBQ04sSUFBSSxPQUFPLE1BQU0sT0FBTztBQUN4QixFQUFFLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDbkMsSUFBSSxNQUFNLEtBQUssR0FBRyxFQUFFO0FBQ3BCLElBQUksTUFBTSxZQUFZLEdBQUcsT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO0FBQzFELElBQUksSUFBSSxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsRUFBRTtBQUNwRSxNQUFNLGtCQUFrQixDQUFDLE9BQU8sT0FBTyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2xHLE1BQU0sT0FBTyxNQUFNLE9BQU87QUFDMUIsSUFBSTtBQUNKLElBQUksSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUM1QixNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUM7QUFDdEQsTUFBTSxJQUFJLEtBQUssRUFBRSxPQUFPLE9BQU87QUFDL0IsSUFBSSxDQUFDLE1BQU0sSUFBSSxZQUFZLEVBQUU7QUFDN0IsTUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQ2hDLFFBQVEsV0FBVyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDO0FBQzFDLE1BQU0sQ0FBQyxNQUFNLGVBQWUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQztBQUNwRCxJQUFJLENBQUMsTUFBTTtBQUNYLE1BQU0sT0FBTyxJQUFJLGFBQWEsQ0FBQyxNQUFNLENBQUM7QUFDdEMsTUFBTSxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQztBQUNoQyxJQUFJO0FBQ0osSUFBSSxPQUFPLEdBQUcsS0FBSztBQUNuQixFQUFFLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUU7QUFDN0IsSUFBSSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDaEMsTUFBTSxJQUFJLEtBQUssRUFBRSxRQUFRLE9BQU8sR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDO0FBQ2hGLE1BQU0sYUFBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQztBQUNqRCxJQUFJLENBQUMsTUFBTSxJQUFJLE9BQU8sSUFBSSxJQUFJLElBQUksT0FBTyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUU7QUFDeEUsTUFBTSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztBQUMvQixJQUFJLENBQUMsTUFBTSxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDO0FBQ3hELElBQUksT0FBTyxHQUFHLEtBQUs7QUFDbkIsRUFBRSxDQUFDLEtBQUs7QUFDUixFQUFFLE9BQU8sT0FBTztBQUNoQjtBQUNBLFNBQVMsc0JBQXNCLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQ3BFLEVBQUUsSUFBSSxPQUFPLEdBQUcsS0FBSztBQUNyQixFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDcEQsSUFBSSxJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLE1BQU0sSUFBSSxHQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztBQUNsRCxNQUFNLENBQUM7QUFDUCxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxLQUFLLENBQUM7QUFDeEQsU0FBUyxJQUFJLENBQUMsQ0FBQyxHQUFHLE9BQU8sSUFBSSxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO0FBQzlELE1BQU0sVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDM0IsSUFBSSxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3BDLE1BQU0sT0FBTyxHQUFHLHNCQUFzQixDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksT0FBTztBQUN6RSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsS0FBSyxVQUFVLEVBQUU7QUFDakMsTUFBTSxJQUFJLE1BQU0sRUFBRTtBQUNsQixRQUFRLE9BQU8sT0FBTyxJQUFJLEtBQUssVUFBVSxFQUFFLElBQUksR0FBRyxJQUFJLEVBQUU7QUFDeEQsUUFBUSxPQUFPO0FBQ2YsVUFBVSxzQkFBc0I7QUFDaEMsWUFBWSxVQUFVO0FBQ3RCLFlBQVksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDL0MsWUFBWSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUk7QUFDOUMsV0FBVyxJQUFJLE9BQU87QUFDdEIsTUFBTSxDQUFDLE1BQU07QUFDYixRQUFRLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQzdCLFFBQVEsT0FBTyxHQUFHLElBQUk7QUFDdEIsTUFBTTtBQUNOLElBQUksQ0FBQyxNQUFNO0FBQ1gsTUFBTSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2hDLE1BQU0sSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxLQUFLLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDbkYsV0FBVyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUQsSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLE9BQU8sT0FBTztBQUNoQjtBQUNBLFNBQVMsV0FBVyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxHQUFHLElBQUksRUFBRTtBQUNuRCxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDO0FBQ3pGO0FBQ0EsU0FBUyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFO0FBQzdELEVBQUUsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFLFFBQVEsTUFBTSxDQUFDLFdBQVcsR0FBRyxFQUFFO0FBQzNELEVBQUUsTUFBTSxJQUFJLEdBQUcsV0FBVyxJQUFJLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO0FBQ3pELEVBQUUsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQ3RCLElBQUksSUFBSSxRQUFRLEdBQUcsS0FBSztBQUN4QixJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNsRCxNQUFNLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDM0IsTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUU7QUFDdkIsUUFBUSxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMsVUFBVSxLQUFLLE1BQU07QUFDakQsUUFBUSxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQztBQUMzQixVQUFVLFFBQVEsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7QUFDdEYsYUFBYSxRQUFRLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRTtBQUNwQyxNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsSUFBSTtBQUM1QixJQUFJO0FBQ0osRUFBRSxDQUFDLE1BQU0sTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO0FBQzFDLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNmOztBQUVBLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7QUFDaEMsRUFBRSxLQUFLLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQztBQUM5QixFQUFFLElBQUksR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO0FBQzVCLEVBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUM7QUFDOUIsU0FBUyxNQUFNLENBQUMsS0FBSyxFQUFFO0FBQ3ZCLEVBQUUsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUN2QixFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUU7QUFDVixJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRTtBQUN6QyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQztBQUNoRCxLQUFLLENBQUM7QUFDTixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQy9CLE1BQU0sTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDckMsUUFBUSxJQUFJLEdBQUcsTUFBTSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQztBQUN0RCxNQUFNLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDbkQsUUFBUSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzVCLFFBQVEsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFO0FBQzVCLFVBQVUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFO0FBQzdDLFlBQVksVUFBVSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxVQUFVO0FBQzdDLFlBQVksR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEMsV0FBVyxDQUFDO0FBQ1osUUFBUTtBQUNSLE1BQU07QUFDTixJQUFJO0FBQ0osRUFBRTtBQUNGLEVBQUUsT0FBTyxDQUFDO0FBQ1Y7QUFDQSxTQUFTLFdBQVcsQ0FBQyxHQUFHLEVBQUU7QUFDMUIsRUFBRSxJQUFJLEtBQUs7QUFDWCxFQUFFO0FBQ0YsSUFBSSxHQUFHLElBQUksSUFBSTtBQUNmLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUTtBQUMzQixLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDaEIsTUFBTSxFQUFFLEtBQUssR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sS0FBSyxLQUFLLE1BQU0sQ0FBQyxTQUFTO0FBQ2hDLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDeEI7QUFDQTtBQUNBLFNBQVMsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQUUsRUFBRTtBQUN2QyxFQUFFLElBQUksTUFBTSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsSUFBSTtBQUNoQyxFQUFFLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sTUFBTTtBQUMxRCxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLElBQUk7QUFDdEQsRUFBRSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDM0IsSUFBSSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ25ELFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDdEIsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ2pELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDakIsTUFBTSxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTO0FBQ2pFLElBQUk7QUFDSixFQUFFLENBQUMsTUFBTTtBQUNULElBQUksSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUM7QUFDN0QsU0FBUyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztBQUN0QixJQUFJLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ2xDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7QUFDbkQsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ2pELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDcEIsTUFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUU7QUFDMUIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztBQUNwQixNQUFNLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLFNBQVM7QUFDcEUsSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLE9BQU8sSUFBSTtBQUNiO0FBQ0EsU0FBUyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRTtBQUNsQyxFQUFFLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDNUIsRUFBRSxJQUFJLENBQUMsS0FBSztBQUNaLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFO0FBQzFDLE1BQU0sS0FBSyxHQUFHLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztBQUN6QyxLQUFLLENBQUM7QUFDTixFQUFFLE9BQU8sS0FBSztBQUNkO0FBQ0EsU0FBUyxPQUFPLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUU7QUFDekMsRUFBRSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDN0MsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDdkMsSUFBSSxNQUFNLEVBQUUsS0FBSztBQUNqQixJQUFJLFFBQVEsRUFBRTtBQUNkLEdBQUcsQ0FBQztBQUNKLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHO0FBQ1gsRUFBRSxRQUFRLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO0FBQzdCO0FBQ0EsU0FBUyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFO0FBQzdDLEVBQUUsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUM7QUFDakUsRUFBRSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLFFBQVEsS0FBSyxNQUFNLElBQUksUUFBUSxLQUFLLEtBQUs7QUFDMUYsSUFBSSxPQUFPLElBQUk7QUFDZixFQUFFLE9BQU8sSUFBSSxDQUFDLEtBQUs7QUFDbkIsRUFBRSxPQUFPLElBQUksQ0FBQyxRQUFRO0FBQ3RCLEVBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDM0MsRUFBRSxPQUFPLElBQUk7QUFDYjtBQUNBLFNBQVMsU0FBUyxDQUFDLE1BQU0sRUFBRTtBQUMzQixFQUFFLFdBQVcsRUFBRSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFO0FBQzVEO0FBQ0EsU0FBUyxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQ3pCLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUNuQixFQUFFLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDaEM7QUFDQSxNQUFNLFlBQVksR0FBRztBQUNyQixFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRTtBQUNsQyxJQUFJLElBQUksUUFBUSxLQUFLLElBQUksRUFBRSxPQUFPLE1BQU07QUFDeEMsSUFBSSxJQUFJLFFBQVEsS0FBSyxNQUFNLEVBQUUsT0FBTyxRQUFRO0FBQzVDLElBQUksSUFBSSxRQUFRLEtBQUssTUFBTSxFQUFFO0FBQzdCLE1BQU0sU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUN2QixNQUFNLE9BQU8sUUFBUTtBQUNyQixJQUFJO0FBQ0osSUFBSSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQztBQUN6QyxJQUFJLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDbkMsSUFBSSxJQUFJLEtBQUssR0FBRyxPQUFPLEdBQUcsT0FBTyxFQUFFLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztBQUN0RCxJQUFJLElBQUksUUFBUSxLQUFLLEtBQUssSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxXQUFXLEVBQUUsT0FBTyxLQUFLO0FBQ3pGLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNsQixNQUFNLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDO0FBQ3BFLE1BQU07QUFDTixRQUFRLFdBQVcsRUFBRTtBQUNyQixTQUFTLE9BQU8sS0FBSyxLQUFLLFVBQVUsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3hFLFFBQVEsRUFBRSxJQUFJLElBQUksSUFBSSxDQUFDLEdBQUc7QUFDMUI7QUFDQSxRQUFRLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsRUFBRTtBQUNqRCxJQUFJO0FBQ0osSUFBSSxPQUFPLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSztBQUNyRCxFQUFFLENBQUM7QUFDSCxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFO0FBQ3hCLElBQUk7QUFDSixNQUFNLFFBQVEsS0FBSyxJQUFJO0FBQ3ZCLE1BQU0sUUFBUSxLQUFLLE1BQU07QUFDekIsTUFBTSxRQUFRLEtBQUssTUFBTTtBQUN6QixNQUFNLFFBQVEsS0FBSyxLQUFLO0FBQ3hCLE1BQU0sUUFBUSxLQUFLLElBQUk7QUFDdkIsTUFBTSxRQUFRLEtBQUs7QUFDbkI7QUFDQSxNQUFNLE9BQU8sSUFBSTtBQUNqQixJQUFJLFdBQVcsRUFBRSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFLFFBQVEsQ0FBQyxFQUFFO0FBQ2hFLElBQUksT0FBTyxRQUFRLElBQUksTUFBTTtBQUM3QixFQUFFLENBQUM7QUFDSCxFQUFFLEdBQUcsR0FBRztBQUNSLElBQUksT0FBTyxJQUFJO0FBQ2YsRUFBRSxDQUFDO0FBQ0gsRUFBRSxjQUFjLEdBQUc7QUFDbkIsSUFBSSxPQUFPLElBQUk7QUFDZixFQUFFLENBQUM7QUFDSCxFQUFFLE9BQU8sRUFBRSxPQUFPO0FBQ2xCLEVBQUUsd0JBQXdCLEVBQUU7QUFDNUIsQ0FBQztBQUNELFNBQVMsV0FBVyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsR0FBRyxLQUFLLEVBQUU7QUFDL0QsRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxLQUFLLEVBQUU7QUFDOUMsRUFBRSxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO0FBQzlCLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNO0FBQ3RCLEVBQUUsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO0FBQzNCLElBQUksT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDO0FBQzFCLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUM3RixFQUFFLENBQUMsTUFBTTtBQUNULElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUs7QUFDM0IsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQzdGLEVBQUU7QUFDRixFQUFFLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO0FBQ3BDLElBQUksSUFBSTtBQUNSLEVBQUUsS0FBSyxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQztBQUNsRSxFQUFFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLEdBQUcsRUFBRTtBQUNwRCxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxFQUFFO0FBQzFFLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQ2xFLEVBQUU7QUFDRixFQUFFLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxFQUFFO0FBQ25DO0FBQ0EsU0FBUyxjQUFjLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTtBQUN0QyxFQUFFLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ2pDLEVBQUUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMzQyxJQUFJLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDdkIsSUFBSSxXQUFXLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdkMsRUFBRTtBQUNGO0FBQ0EsU0FBUyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRTtBQUNwQyxFQUFFLElBQUksT0FBTyxJQUFJLEtBQUssVUFBVSxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ3RELEVBQUUsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDckIsRUFBRSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDM0IsSUFBSSxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7QUFDMUIsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQ2IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU07QUFDdkIsSUFBSSxPQUFPLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDekIsTUFBTSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzNCLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxFQUFFLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQztBQUM5RCxJQUFJO0FBQ0osSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUM7QUFDdkMsRUFBRSxDQUFDLE1BQU0sY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUM7QUFDdEM7QUFDQSxTQUFTLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsR0FBRyxFQUFFLEVBQUU7QUFDbkQsRUFBRSxJQUFJLElBQUk7QUFDVixJQUFJLElBQUksR0FBRyxPQUFPO0FBQ2xCLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUN2QixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ3ZCLElBQUksTUFBTSxRQUFRLEdBQUcsT0FBTyxJQUFJO0FBQ2hDLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO0FBQ3RDLElBQUksSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzdCLE1BQU0sS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDNUMsUUFBUSxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQztBQUM5RCxNQUFNO0FBQ04sTUFBTTtBQUNOLElBQUksQ0FBQyxNQUFNLElBQUksT0FBTyxJQUFJLFFBQVEsS0FBSyxVQUFVLEVBQUU7QUFDbkQsTUFBTSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUMvQyxRQUFRLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQztBQUNqRixNQUFNO0FBQ04sTUFBTTtBQUNOLElBQUksQ0FBQyxNQUFNLElBQUksT0FBTyxJQUFJLFFBQVEsS0FBSyxRQUFRLEVBQUU7QUFDakQsTUFBTSxNQUFNLEVBQUUsSUFBSSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLElBQUk7QUFDaEUsTUFBTSxLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7QUFDM0MsUUFBUSxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQztBQUN4RCxNQUFNO0FBQ04sTUFBTTtBQUNOLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDaEMsTUFBTSxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMvRCxNQUFNO0FBQ04sSUFBSTtBQUNKLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDeEIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDO0FBQ3hDLEVBQUU7QUFDRixFQUFFLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDckIsRUFBRSxJQUFJLE9BQU8sS0FBSyxLQUFLLFVBQVUsRUFBRTtBQUNuQyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQztBQUNsQyxJQUFJLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtBQUN4QixFQUFFO0FBQ0YsRUFBRSxJQUFJLElBQUksS0FBSyxTQUFTLElBQUksS0FBSyxJQUFJLFNBQVMsRUFBRTtBQUNoRCxFQUFFLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQ3ZCLEVBQUUsSUFBSSxJQUFJLEtBQUssU0FBUyxLQUFLLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDaEcsSUFBSSxjQUFjLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQztBQUMvQixFQUFFLENBQUMsTUFBTSxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUM7QUFDMUM7QUFDQSxTQUFTLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxFQUFFO0FBQzFDLEVBQUUsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7QUFDNUMsRUFBRSxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQztBQUMvQyxFQUFFLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUM7QUFDN0MsRUFBRSxTQUFTLFFBQVEsQ0FBQyxHQUFHLElBQUksRUFBRTtBQUM3QixJQUFJLEtBQUssQ0FBQyxNQUFNO0FBQ2hCLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUs7QUFDakMsVUFBVSxXQUFXLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDN0MsVUFBVSxVQUFVLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQztBQUMxQyxJQUFJLENBQUMsQ0FBQztBQUNOLEVBQUU7QUFDRixFQUFFLE9BQU8sQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDO0FBQ2pDOztBQUVBLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUM7QUFDbEMsU0FBUyxVQUFVLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtBQUMxRCxFQUFFLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7QUFDbkMsRUFBRSxJQUFJLE1BQU0sS0FBSyxRQUFRLEVBQUU7QUFDM0IsRUFBRSxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUN2QyxFQUFFO0FBQ0YsSUFBSSxRQUFRLEtBQUssS0FBSztBQUN0QixLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQztBQUN6QixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQztBQUM1QixNQUFNLE9BQU8sS0FBSyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztBQUN6QyxPQUFPLEdBQUcsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLElBQUk7QUFDSixJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQztBQUN6QyxJQUFJO0FBQ0osRUFBRTtBQUNGLEVBQUUsSUFBSSxPQUFPLEVBQUU7QUFDZixJQUFJO0FBQ0osTUFBTSxNQUFNLENBQUMsTUFBTTtBQUNuQixNQUFNLFFBQVEsQ0FBQyxNQUFNO0FBQ3JCLE9BQU8sQ0FBQyxLQUFLLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDO0FBQzdELE1BQU07QUFDTixNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLE1BQU07QUFDaEUsTUFBTTtBQUNOLFFBQVEsS0FBSyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDakUsUUFBUSxLQUFLLEdBQUcsR0FBRztBQUNuQixTQUFTLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQzFDLFdBQVcsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ25HLFFBQVEsS0FBSztBQUNiLFFBQVE7QUFDUixRQUFRLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDO0FBQzlELE1BQU07QUFDTixNQUFNLE1BQU0sSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDM0MsUUFBUSxVQUFVLEdBQUcsSUFBSSxHQUFHLEVBQUU7QUFDOUIsTUFBTTtBQUNOLFFBQVEsR0FBRyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUM7QUFDN0QsUUFBUSxHQUFHLElBQUksS0FBSztBQUNwQixRQUFRLE1BQU0sSUFBSSxLQUFLO0FBQ3ZCLFNBQVMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDekMsV0FBVyxHQUFHLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDakcsUUFBUSxHQUFHLEVBQUUsRUFBRSxNQUFNO0FBQ3JCLFFBQVE7QUFDUixRQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDO0FBQ3BDLE1BQU07QUFDTixNQUFNLElBQUksS0FBSyxHQUFHLE1BQU0sSUFBSSxLQUFLLEdBQUcsR0FBRyxFQUFFO0FBQ3pDLFFBQVEsS0FBSyxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsSUFBSSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdFLFFBQVEsT0FBTyxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN2QyxVQUFVLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQyxVQUFVLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDO0FBQ3hELFFBQVE7QUFDUixRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDM0YsUUFBUTtBQUNSLE1BQU07QUFDTixNQUFNLGNBQWMsR0FBRyxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLE1BQU0sS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDeEMsUUFBUSxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUN4QixRQUFRLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJO0FBQy9DLFFBQVEsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQ2xDLFFBQVEsY0FBYyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxTQUFTLEdBQUcsRUFBRSxHQUFHLENBQUM7QUFDcEQsUUFBUSxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDakMsTUFBTTtBQUNOLE1BQU0sS0FBSyxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDckMsUUFBUSxJQUFJLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUMxQixRQUFRLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxHQUFHLElB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
