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
    t.innerHTML = html;
    return t.content.firstChild;
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

class AsciinemaPlayerPlugin extends obsidian.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.registerMarkdownCodeBlockProcessor('asciinema', (source, el, ctx) => {
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
                            // Try to parse value as a number
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
                    // It's a URL, use it directly after trimming the prefix
                    const url = castPath.substring(urlPrefix.length).trim();
                    const player = create(url, playerContainer, opts);
                    if (opts.loop) {
                        player.addEventListener('ended', () => player.play());
                    }
                }
                else {
                    // It's a local file, resolve it through Obsidian's vault
                    const activeFile = this.app.workspace.getActiveFile();
                    if (!activeFile) {
                        return;
                    }
                    const castFile = this.app.metadataCache.getFirstLinkpathDest(castPath, activeFile.path);
                    if (castFile) {
                        const resourcePath = this.app.vault.adapter.getResourcePath(castFile.path);
                        const player = create(resourcePath, playerContainer, opts);
                        if (opts.loop) {
                            player.addEventListener('ended', () => player.play());
                        }
                    }
                    else {
                        const errorDiv = playerContainer.createEl('div');
                        errorDiv.className = 'asciinema-player-file-not-found';
                        errorDiv.innerHTML = '<span>asciinema-player: ' + castPath + ' not found</span>';
                    }
                }
            });
        });
    }
}

module.exports = AsciinemaPlayerPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzLy5wbnBtL0Byb2xsdXArcGx1Z2luLXR5cGVzY3JpcHRAMTIuMS40X3JvbGx1cEA0LjUyLjRfdHNsaWJAMi44LjFfdHlwZXNjcmlwdEA1LjkuMy9ub2RlX21vZHVsZXMvdHNsaWIvdHNsaWIuZXM2LmpzIiwibm9kZV9tb2R1bGVzLy5wbnBtL2FzY2lpbmVtYS1wbGF5ZXJAMy4xMS4wL25vZGVfbW9kdWxlcy9hc2NpaW5lbWEtcGxheWVyL2Rpc3QvbG9nZ2luZy1IYjk0RXZzSS5qcyIsIm5vZGVfbW9kdWxlcy8ucG5wbS9hc2NpaW5lbWEtcGxheWVyQDMuMTEuMC9ub2RlX21vZHVsZXMvYXNjaWluZW1hLXBsYXllci9kaXN0L2NvcmUtQ2Q4RDlYVmwuanMiLCJub2RlX21vZHVsZXMvLnBucG0vYXNjaWluZW1hLXBsYXllckAzLjExLjAvbm9kZV9tb2R1bGVzL2FzY2lpbmVtYS1wbGF5ZXIvZGlzdC9vcHRzLUR0WmV1bWIxLmpzIiwibm9kZV9tb2R1bGVzLy5wbnBtL2FzY2lpbmVtYS1wbGF5ZXJAMy4xMS4wL25vZGVfbW9kdWxlcy9hc2NpaW5lbWEtcGxheWVyL2Rpc3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvLnBucG0vc3R5bGUtaW5qZWN0QDAuMy4wL25vZGVfbW9kdWxlcy9zdHlsZS1pbmplY3QvZGlzdC9zdHlsZS1pbmplY3QuZXMuanMiLCJzcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6bnVsbCwibmFtZXMiOlsiY3JlYXRlIiwiZXhwb3J0cyIsIlBsdWdpbiIsIkFzY2lpbmVtYVBsYXllci5jcmVhdGUiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQWtHQTtBQUNPLFNBQVMsU0FBUyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRTtBQUM3RCxJQUFJLFNBQVMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLE9BQU8sS0FBSyxZQUFZLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsVUFBVSxPQUFPLEVBQUUsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEgsSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDL0QsUUFBUSxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25HLFFBQVEsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RHLFFBQVEsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEgsUUFBUSxJQUFJLENBQUMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsVUFBVSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFD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QUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQzFELEVBQUU7QUFDRixFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDaEIsSUFBSSxLQUFLLElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUU7QUFDdkgsTUFBTSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUM7QUFDeEMsSUFBSTtBQUNKLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ3pELEVBQUU7QUFDRixFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDaEIsSUFBSSxLQUFLLElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUU7QUFDdkgsTUFBTSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUM7QUFDeEMsSUFBSTtBQUNKLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ3pELEVBQUU7QUFDRixFQUFFLEtBQUssQ0FB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QUksTUFBTSxFQUFFRCxRQUFNO0FBQ2xCLElBQUksT0FBTyxFQUFFLFVBQVU7QUFDdkIsSUFBSSxRQUFRLEVBQUU7QUFDZCxDQUFDLENBQUM7O0FBRUYsTUFBTSxXQUFXLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDOztBQUUzTyxRQUFRLFNBQVMsYUFBYSxDQUFDLFFBQVEsRUFBRTtBQUN6QyxZQUFZLE9BQU8sV0FBVyxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7QUFDN0MsUUFBUTs7QUFFUixRQUFRLFNBQVMsYUFBYSxDQUFDLEdBQUcsRUFBRTtBQUNwQyxZQUFZLElBQUksYUFBYSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFDbEYsWUFBWSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTTtBQUM5QixZQUFZLElBQUksTUFBTSxHQUFHLElBQUksVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDcEQsWUFBWSxJQUFJLE1BQU07O0FBRXRCLFlBQVksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMxRCxnQkFBZ0IsTUFBTTtBQUN0QixvQkFBb0IsYUFBYSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFO0FBQzFELG9CQUFvQixhQUFhLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFO0FBQzlELG9CQUFvQixhQUFhLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQzdELG9CQUFvQixhQUFhLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEQsZ0JBQWdCLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLElBQUksRUFBRTtBQUN4QyxnQkFBZ0IsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksSUFBSTtBQUNwRCxnQkFBZ0IsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsSUFBSTtBQUM3QyxZQUFZOztBQUVaLFlBQVksT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQztBQUNwRSxRQUFROztBQUVSLFFBQVEsTUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLGs4K0VBQWs4K0UsQ0FBQzs7QUFFMysrRSxRQUFRLElBQUksTUFBTSxHQUFHLE9BQU8sR0FBRyxHQUFHLEVBQUUsS0FBSztBQUN6QyxnQkFBZ0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEdBQUc7O0FBRTFDLGdCQUFnQixJQUFJLGNBQWMsSUFBSSxJQUFJLEVBQUU7QUFDNUMsb0JBQW9CLE1BQU0sY0FBYyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUM7O0FBRS9ELGdCQUFnQixDQUFDLE1BQU07QUFDdkIsb0JBQW9CLE1BQU0sVUFBVSxDQUFDLFNBQVMsQ0FBQztBQUMvQyxnQkFBZ0I7O0FBRWhCLGdCQUFnQixPQUFPQyxTQUFPO0FBQzlCLFlBQVksQ0FBQzs7QUFFYixNQUFNLEtBQUssQ0FBQztBQUNaLEVBQUUsV0FBVyxHQUFHO0FBQ2hCLElBQUksSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRztBQUN2RixJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSztBQUN0QixJQUFJLElBQUksQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRTtBQUN0QyxFQUFFO0FBQ0YsRUFBRSxPQUFPLEdBQUc7QUFDWixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssSUFBSSxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLE1BQU07QUFDckUsRUFBRTtBQUNGLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRTtBQUNoQixJQUFJLElBQUksQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU07QUFDbkUsRUFBRTtBQUNGO0FBQ0EsTUFBTSxTQUFTLENBQUM7QUFDaEIsRUFBRSxXQUFXLEdBQUcsQ0FBQztBQUNqQixFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNuQixFQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNsQjs7QUFFQTtBQUNBOztBQUVBLE1BQU0sTUFBTSxDQUFDO0FBQ2IsRUFBRSxXQUFXLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtBQUMxQixJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxLQUFLLENBQUMsSUFBSSxLQUFLLFVBQVUsR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUNwRixJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLEVBQUU7QUFDeEIsRUFBRTtBQUNGLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRTtBQUNULElBQUksT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQyxFQUFFO0FBQ0YsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFO0FBQ2IsSUFBSSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JDLEVBQUU7QUFDRixFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUU7QUFDWixJQUFJLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEMsRUFBRTtBQUNGLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRTtBQUNWLElBQUksT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQyxFQUFFO0FBQ0YsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFO0FBQ1YsSUFBSSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLEVBQUU7QUFDRixFQUFFLFNBQVMsQ0FBQyxDQUFDLEVBQUU7QUFDZixJQUFJLE9BQU8sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkQsRUFBRTtBQUNGLEVBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7QUFDL0IsSUFBSSxPQUFPLElBQUksTUFBTSxDQUFDLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDckcsRUFBRTtBQUNGLEVBQUUsT0FBTyxHQUFHO0FBQ1osSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQzNCLEVBQUU7QUFDRixFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHO0FBQ3RCLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNiLElBQUksSUFBSSxNQUFNLEdBQUcsRUFBRTtBQUNuQixJQUFJLElBQUksT0FBTyxHQUFHLEtBQUs7QUFDdkIsSUFBSSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN6RCxJQUFJLE9BQU87QUFDWCxNQUFNLElBQUksRUFBRSxNQUFNO0FBQ2xCLFFBQVEsSUFBSSxDQUFDLEtBQUssTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNqQyxVQUFVLE1BQU0sR0FBRyxFQUFFO0FBQ3JCLFVBQVUsQ0FBQyxHQUFHLENBQUM7QUFDZixRQUFRO0FBQ1IsUUFBUSxPQUFPLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQ3BDLFVBQVUsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7QUFDeEMsVUFBVSxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDekIsWUFBWTtBQUNaLFVBQVUsQ0FBQyxNQUFNO0FBQ2pCLFlBQVksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQy9CLFVBQVU7QUFDVixRQUFRO0FBQ1IsUUFBUSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQzdDLFVBQVUsRUFBRSxDQUFDLEtBQUssRUFBRTtBQUNwQixVQUFVLE9BQU8sR0FBRyxJQUFJO0FBQ3hCLFFBQVE7QUFDUixRQUFRLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDL0IsVUFBVSxPQUFPO0FBQ2pCLFlBQVksSUFBSSxFQUFFLEtBQUs7QUFDdkIsWUFBWSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRTtBQUM3QixXQUFXO0FBQ1gsUUFBUSxDQUFDLE1BQU07QUFDZixVQUFVLE9BQU87QUFDakIsWUFBWSxJQUFJLEVBQUU7QUFDbEIsV0FBVztBQUNYLFFBQVE7QUFDUixNQUFNO0FBQ04sS0FBSztBQUNMLEVBQUU7QUFDRjtBQUNBLFNBQVMsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNsQixFQUFFLE9BQU8sSUFBSSxJQUFJO0FBQ2pCLElBQUksT0FBTyxLQUFLLElBQUk7QUFDcEIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BCLElBQUksQ0FBQztBQUNMLEVBQUUsQ0FBQztBQUNIO0FBQ0EsU0FBUyxPQUFPLENBQUMsQ0FBQyxFQUFFO0FBQ3BCLEVBQUUsT0FBTyxJQUFJLElBQUk7QUFDakIsSUFBSSxPQUFPLEtBQUssSUFBSTtBQUNwQixNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQzVCLElBQUksQ0FBQztBQUNMLEVBQUUsQ0FBQztBQUNIO0FBQ0EsU0FBUyxNQUFNLENBQUMsQ0FBQyxFQUFFO0FBQ25CLEVBQUUsT0FBTyxJQUFJLElBQUk7QUFDakIsSUFBSSxPQUFPLEtBQUssSUFBSTtBQUNwQixNQUFNLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ3BCLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUNuQixNQUFNO0FBQ04sSUFBSSxDQUFDO0FBQ0wsRUFBRSxDQUFDO0FBQ0g7QUFDQSxTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUU7QUFDakIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQ1gsRUFBRSxPQUFPLElBQUksSUFBSTtBQUNqQixJQUFJLE9BQU8sS0FBSyxJQUFJO0FBQ3BCLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQ2pCLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUNuQixNQUFNO0FBQ04sTUFBTSxDQUFDLElBQUksQ0FBQztBQUNaLElBQUksQ0FBQztBQUNMLEVBQUUsQ0FBQztBQUNIO0FBQ0EsU0FBUyxJQUFJLENBQUMsQ0FBQyxFQUFFO0FBQ2pCLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNYLEVBQUUsT0FBTyxJQUFJLElBQUk7QUFDakIsSUFBSSxPQUFPLEtBQUssSUFBSTtBQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ1osTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDakIsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ25CLE1BQU07QUFDTixJQUFJLENBQUM7QUFDTCxFQUFFLENBQUM7QUFDSDtBQUNBLFNBQVMsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUU7QUFDNUIsRUFBRSxPQUFPLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxLQUFLO0FBQzlDLElBQUksTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEMsSUFBSSxPQUFPO0FBQ1gsTUFBTSxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUk7QUFDbkIsTUFBTSxLQUFLLEVBQUUsTUFBTTtBQUNuQixRQUFRLEVBQUUsQ0FBQyxLQUFLLEVBQUU7QUFDbEIsUUFBUSxJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ3BCLE1BQU07QUFDTixLQUFLO0FBQ0wsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hCO0FBQ0EsU0FBUyxJQUFJLENBQUMsRUFBRSxFQUFFO0FBQ2xCLEVBQUUsSUFBSSxPQUFPLEVBQUUsS0FBSyxVQUFVLEVBQUU7QUFDaEMsSUFBSSxPQUFPO0FBQ1gsTUFBTSxJQUFJLEVBQUUsRUFBRTtBQUNkLE1BQU0sS0FBSyxFQUFFLE1BQU0sQ0FBQztBQUNwQixLQUFLO0FBQ0wsRUFBRSxDQUFDLE1BQU07QUFDVCxJQUFJLE9BQU8sRUFBRTtBQUNiLEVBQUU7QUFDRjtBQUNBLE1BQU0sV0FBVyxDQUFDO0FBQ2xCLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFO0FBQ3ZDLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJO0FBQ3BCLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLO0FBQ3RCLElBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVO0FBQ2hDLEVBQUU7QUFDRixFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHO0FBQ3RCLElBQUksSUFBSSxRQUFRO0FBQ2hCLElBQUksSUFBSSxTQUFTO0FBQ2pCLElBQUksT0FBTztBQUNYLE1BQU0sSUFBSSxFQUFFLE1BQU07QUFDbEIsUUFBUSxJQUFJLFFBQVEsS0FBSyxTQUFTLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7QUFDL0QsVUFBVSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtBQUN6QyxVQUFVLElBQUksTUFBTSxDQUFDLElBQUksRUFBRTtBQUMzQixZQUFZLElBQUksQ0FBQyxJQUFJLEdBQUcsU0FBUztBQUNqQyxVQUFVLENBQUMsTUFBTTtBQUNqQixZQUFZLFFBQVEsR0FBRyxNQUFNLENBQUMsS0FBSztBQUNuQyxVQUFVO0FBQ1YsUUFBUTtBQUNSLFFBQVEsSUFBSSxTQUFTLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO0FBQ2pFLFVBQVUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7QUFDMUMsVUFBVSxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUU7QUFDM0IsWUFBWSxJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVM7QUFDbEMsVUFBVSxDQUFDLE1BQU07QUFDakIsWUFBWSxTQUFTLEdBQUcsTUFBTSxDQUFDLEtBQUs7QUFDcEMsVUFBVTtBQUNWLFFBQVE7QUFDUixRQUFRLElBQUksUUFBUSxLQUFLLFNBQVMsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFO0FBQy9ELFVBQVUsT0FBTztBQUNqQixZQUFZLElBQUksRUFBRTtBQUNsQixXQUFXO0FBQ1gsUUFBUSxDQUFDLE1BQU0sSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO0FBQzNDLFVBQVUsTUFBTSxLQUFLLEdBQUcsU0FBUztBQUNqQyxVQUFVLFNBQVMsR0FBRyxTQUFTO0FBQy9CLFVBQVUsT0FBTztBQUNqQixZQUFZLElBQUksRUFBRSxLQUFLO0FBQ3ZCLFlBQVksS0FBSyxFQUFFO0FBQ25CLFdBQVc7QUFDWCxRQUFRLENBQUMsTUFBTSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7QUFDNUMsVUFBVSxNQUFNLEtBQUssR0FBRyxRQUFRO0FBQ2hDLFVBQVUsUUFBUSxHQUFHLFNBQVM7QUFDOUIsVUFBVSxPQUFPO0FBQ2pCLFlBQVksSUFBSSxFQUFFLEtBQUs7QUFDdkIsWUFBWSxLQUFLLEVBQUU7QUFDbkIsV0FBVztBQUNYLFFBQVEsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLEVBQUU7QUFDekQsVUFBVSxNQUFNLEtBQUssR0FBRyxRQUFRO0FBQ2hDLFVBQVUsUUFBUSxHQUFHLFNBQVM7QUFDOUIsVUFBVSxPQUFPO0FBQ2pCLFlBQVksSUFBSSxFQUFFLEtBQUs7QUFDdkIsWUFBWSxLQUFLLEVBQUU7QUFDbkIsV0FBVztBQUNYLFFBQVEsQ0FBQyxNQUFNO0FBQ2YsVUFBVSxNQUFNLEtBQUssR0FBRyxTQUFTO0FBQ2pDLFVBQVUsU0FBUyxHQUFHLFNBQVM7QUFDL0IsVUFBVSxPQUFPO0FBQ2pCLFlBQVksSUFBSSxFQUFFLEtBQUs7QUFDdkIsWUFBWSxLQUFLLEVBQUU7QUFDbkIsV0FBVztBQUNYLFFBQVE7QUFDUixNQUFNO0FBQ04sS0FBSztBQUNMLEVBQUU7QUFDRjs7QUFFQSxlQUFlLE9BQU8sQ0FBQyxJQUFJLEVBQUU7QUFDN0IsRUFBRSxJQUFJLElBQUksWUFBWSxRQUFRLEVBQUU7QUFDaEMsSUFBSSxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDbEMsSUFBSSxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDO0FBQ25DLElBQUksSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO0FBQzlCLE1BQU0sTUFBTTtBQUNaLFFBQVEsTUFBTTtBQUNkLFFBQVE7QUFDUixPQUFPLEdBQUcsTUFBTTtBQUNoQixNQUFNLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxDQUFDLEVBQUU7QUFDaEMsUUFBUSxPQUFPLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUM7QUFDL0MsTUFBTSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLENBQUMsRUFBRTtBQUN2QyxRQUFRLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztBQUMvQyxNQUFNLENBQUMsTUFBTTtBQUNiLFFBQVEsTUFBTSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDO0FBQ2pFLE1BQU07QUFDTixJQUFJLENBQUMsTUFBTTtBQUNYLE1BQU0sTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7QUFDckMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFO0FBQ2hDLFFBQVEsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUM7QUFDdkMsTUFBTTtBQUNOLElBQUk7QUFDSixFQUFFLENBQUMsTUFBTSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLENBQUMsRUFBRTtBQUM3RCxJQUFJLE9BQU8sZ0JBQWdCLENBQUMsSUFBSSxDQUFDO0FBQ2pDLEVBQUUsQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNsQyxJQUFJLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDMUIsSUFBSSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFO0FBQzlCLE1BQU0sTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUMvQyxNQUFNLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztBQUM3QyxJQUFJLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFO0FBQ3JDLE1BQU0sTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUMvQyxNQUFNLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztBQUM3QyxJQUFJLENBQUMsTUFBTTtBQUNYLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDO0FBQy9ELElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxNQUFNLGNBQWM7QUFDdEI7QUFDQSxTQUFTLFVBQVUsQ0FBQyxLQUFLLEVBQUU7QUFDM0IsRUFBRSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztBQUNqQyxFQUFFLElBQUksTUFBTTtBQUNaLEVBQUUsSUFBSTtBQUNOLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sTUFBTSxFQUFFO0FBQ25CLElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDcEYsRUFBRSxPQUFPO0FBQ1QsSUFBSSxNQUFNO0FBQ1YsSUFBSTtBQUNKLEdBQUc7QUFDSDtBQUNBLFNBQVMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFO0FBQ2hDLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUNkLEVBQUUsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUk7QUFDbEQsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQixJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixFQUFFLENBQUMsQ0FBQztBQUNKLEVBQUUsT0FBTztBQUNULElBQUksSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLO0FBQ3BCLElBQUksSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNO0FBQ3JCLElBQUk7QUFDSixHQUFHO0FBQ0g7QUFDQSxTQUFTLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUU7QUFDMUMsRUFBRSxPQUFPO0FBQ1QsSUFBSSxJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQUs7QUFDdEIsSUFBSSxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU07QUFDdkIsSUFBSSxLQUFLLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDckMsSUFBSSxNQUFNO0FBQ1YsSUFBSSxhQUFhLEVBQUUsTUFBTSxDQUFDO0FBQzFCLEdBQUc7QUFDSDtBQUNBLFNBQVMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRTtBQUMxQyxFQUFFLElBQUksRUFBRSxNQUFNLFlBQVksTUFBTSxDQUFDLEVBQUU7QUFDbkMsSUFBSSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQy9CLEVBQUU7QUFDRixFQUFFLElBQUksSUFBSSxHQUFHLENBQUM7QUFDZCxFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSTtBQUMzQixJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hCLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdCLEVBQUUsQ0FBQyxDQUFDO0FBQ0osRUFBRSxPQUFPO0FBQ1QsSUFBSSxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJO0FBQzFCLElBQUksSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSTtBQUMxQixJQUFJLEtBQUssRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUM7QUFDM0MsSUFBSSxNQUFNO0FBQ1YsSUFBSSxhQUFhLEVBQUUsTUFBTSxDQUFDO0FBQzFCLEdBQUc7QUFDSDtBQUNBLFNBQVMsWUFBWSxDQUFDLEtBQUssRUFBRTtBQUM3QixFQUFFLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtBQUMzQixFQUFFLE1BQU0sVUFBVSxHQUFHLG1CQUFtQjtBQUN4QyxFQUFFLE1BQU0sWUFBWSxHQUFHLHlDQUF5QztBQUNoRSxFQUFFLE1BQU0sRUFBRSxHQUFHLEtBQUssRUFBRSxFQUFFO0FBQ3RCLEVBQUUsTUFBTSxFQUFFLEdBQUcsS0FBSyxFQUFFLEVBQUU7QUFDdEIsRUFBRSxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsT0FBTztBQUNoQyxFQUFFLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDaEYsSUFBSSxPQUFPO0FBQ1gsTUFBTSxVQUFVLEVBQUUsRUFBRTtBQUNwQixNQUFNLFVBQVUsRUFBRSxFQUFFO0FBQ3BCLE1BQU0sT0FBTyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRztBQUNoQyxLQUFLO0FBQ0wsRUFBRTtBQUNGO0FBQ0EsU0FBUyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUU7QUFDdkMsRUFBRSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQ2hDLElBQUksT0FBTyxFQUFFLENBQUM7QUFDZCxJQUFJLEtBQUssRUFBRSxTQUFTLENBQUMsSUFBSTtBQUN6QixJQUFJLE1BQU0sRUFBRSxTQUFTLENBQUM7QUFDdEIsR0FBRyxDQUFDO0FBQ0osRUFBRSxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUNoRSxFQUFFLE9BQU8sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztBQUNqQzs7QUFFQSxTQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNyQyxFQUFFLElBQUk7QUFDTixJQUFJLElBQUk7QUFDUixJQUFJLE1BQU07QUFDVixJQUFJLE9BQU87QUFDWCxJQUFJLFFBQVE7QUFDWixJQUFJLFFBQVE7QUFDWixJQUFJO0FBQ0osR0FBRyxHQUFHLElBQUk7QUFDVixFQUFFLElBQUk7QUFDTixJQUFJLEtBQUs7QUFDVCxJQUFJLGFBQWE7QUFDakIsSUFBSSxPQUFPO0FBQ1gsSUFBSSxJQUFJO0FBQ1IsSUFBSSxVQUFVO0FBQ2QsSUFBSSxPQUFPLEVBQUUsUUFBUTtBQUNyQixJQUFJLGNBQWM7QUFDbEIsSUFBSSxJQUFJLEVBQUUsV0FBVztBQUNyQixJQUFJLElBQUksRUFBRSxXQUFXO0FBQ3JCLElBQUk7QUFDSixHQUFHLEdBQUcsS0FBSztBQUNYLEVBQUUsSUFBSSxJQUFJO0FBQ1YsRUFBRSxJQUFJLElBQUk7QUFDVixFQUFFLElBQUksTUFBTTtBQUNaLEVBQUUsSUFBSSxPQUFPO0FBQ2IsRUFBRSxJQUFJLFFBQVE7QUFDZCxFQUFFLElBQUksZ0JBQWdCO0FBQ3RCLEVBQUUsSUFBSSxjQUFjO0FBQ3BCLEVBQUUsSUFBSSxjQUFjLEdBQUcsQ0FBQztBQUN4QixFQUFFLElBQUksYUFBYSxHQUFHLENBQUM7QUFDdkIsRUFBRSxJQUFJLFNBQVM7QUFDZixFQUFFLElBQUksZ0JBQWdCO0FBQ3RCLEVBQUUsSUFBSSxTQUFTLEdBQUcsQ0FBQztBQUNuQixFQUFFLElBQUksZUFBZSxHQUFHLEtBQUs7QUFDN0IsRUFBRSxJQUFJLGNBQWM7QUFDcEIsRUFBRSxJQUFJLDBCQUEwQixHQUFHLEtBQUs7QUFDeEMsRUFBRSxJQUFJLEdBQUcsR0FBRyxNQUFNLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLO0FBQzNDLEVBQUUsSUFBSSxRQUFRO0FBQ2QsRUFBRSxJQUFJLFlBQVk7QUFDbEIsRUFBRSxJQUFJLGFBQWEsR0FBRyxLQUFLO0FBQzNCLEVBQUUsZUFBZSxJQUFJLEdBQUc7QUFDeEIsSUFBSSxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsTUFBTTtBQUNyQyxNQUFNLFFBQVEsQ0FBQyxTQUFTLENBQUM7QUFDekIsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDO0FBQ1osSUFBSSxJQUFJO0FBQ1IsTUFBTSxJQUFJLFFBQVEsR0FBRyxhQUFhLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRTtBQUNoRCxRQUFRLGFBQWE7QUFDckIsUUFBUSxPQUFPO0FBQ2YsUUFBUTtBQUNSLE9BQU8sQ0FBQztBQUNSLE1BQU0sTUFBTSxRQUFRLEdBQUcsTUFBTSxTQUFTLENBQUMsUUFBUSxDQUFDO0FBQ2hELE1BQU0sUUFBUSxHQUFHLE1BQU0sUUFBUTtBQUMvQixNQUFNLE9BQU87QUFDYixRQUFRLEdBQUcsUUFBUTtBQUNuQixRQUFRO0FBQ1IsT0FBTztBQUNQLElBQUksQ0FBQyxTQUFTO0FBQ2QsTUFBTSxZQUFZLENBQUMsT0FBTyxDQUFDO0FBQzNCLElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxlQUFlLGFBQWEsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtBQUNsRCxJQUFJLE1BQU07QUFDVixNQUFNLE1BQU07QUFDWixNQUFNLFlBQVk7QUFDbEIsTUFBTSxXQUFXO0FBQ2pCLE1BQU0sWUFBWTtBQUNsQixNQUFNLFFBQVEsR0FBRztBQUNqQixLQUFLLEdBQUcsR0FBRztBQUNYLElBQUksTUFBTSxJQUFJLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO0FBQ25DLElBQUksTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLE1BQU0sTUFBTSxDQUFDLElBQUksRUFBRTtBQUNqRCxNQUFNO0FBQ04sS0FBSyxDQUFDLEVBQUUsTUFBTSxFQUFFO0FBQ2hCLE1BQU0sR0FBRyxJQUFJO0FBQ2IsTUFBTSxZQUFZO0FBQ2xCLE1BQU07QUFDTixLQUFLLENBQUM7QUFDTixJQUFJLENBQUM7QUFDTCxNQUFNLElBQUk7QUFDVixNQUFNLElBQUk7QUFDVixNQUFNLE1BQU07QUFDWixNQUFNLFFBQVE7QUFDZCxNQUFNO0FBQ04sS0FBSyxHQUFHLFNBQVM7QUFDakIsSUFBSSxXQUFXLEdBQUcsV0FBVyxJQUFJLElBQUk7QUFDckMsSUFBSSxXQUFXLEdBQUcsV0FBVyxJQUFJLElBQUk7QUFDckMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQzdCLE1BQU0sTUFBTSw2QkFBNkI7QUFDekMsSUFBSTtBQUNKLElBQUksSUFBSSxZQUFZLEtBQUssU0FBUyxFQUFFO0FBQ3BDLE1BQU0sSUFBSSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUM7QUFDbkMsSUFBSTtBQUNKLElBQUksTUFBTSxNQUFNLEdBQUcsVUFBVSxLQUFLLFNBQVMsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQUcsU0FBUztBQUMvRSxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0UsSUFBSSxPQUFPO0FBQ1gsTUFBTSxJQUFJO0FBQ1YsTUFBTSxJQUFJO0FBQ1YsTUFBTSxRQUFRO0FBQ2QsTUFBTSxLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUs7QUFDNUIsTUFBTSxNQUFNO0FBQ1osTUFBTTtBQUNOLEtBQUs7QUFDTCxFQUFFO0FBQ0YsRUFBRSxlQUFlLFNBQVMsQ0FBQyxRQUFRLEVBQUU7QUFDckMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sS0FBSztBQUMvQixJQUFJLFlBQVksR0FBRyxNQUFNLGtCQUFrQixDQUFDLFFBQVEsQ0FBQztBQUNyRCxJQUFJLGFBQWEsR0FBRyxZQUFZLENBQUMsUUFBUSxLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxLQUFLLFFBQVEsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssWUFBWSxDQUFDLFFBQVE7QUFDcE4sSUFBSSxJQUFJLGFBQWEsRUFBRTtBQUN2QixNQUFNLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDO0FBQzlELE1BQU0sWUFBWSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUM7QUFDOUQsSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxzRkFBc0YsRUFBRSxZQUFZLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFDeEosSUFBSTtBQUNKLElBQUksT0FBTyxJQUFJO0FBQ2YsRUFBRTtBQUNGLEVBQUUsZUFBZSxPQUFPLENBQUMsS0FBSyxFQUFFO0FBQ2hDLElBQUksSUFBSTtBQUNSLE1BQU0sR0FBRztBQUNULE1BQU0sSUFBSTtBQUNWLE1BQU0sU0FBUyxHQUFHO0FBQ2xCLEtBQUssR0FBRyxLQUFLO0FBQ2IsSUFBSSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtBQUNqQyxNQUFNLE9BQU8sTUFBTSxVQUFVLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQztBQUM3QyxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDbkMsTUFBTSxPQUFPLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxVQUFVLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDMUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO0FBQ25DLE1BQU0sSUFBSSxPQUFPLElBQUksS0FBSyxVQUFVLEVBQUU7QUFDdEMsUUFBUSxJQUFJLEdBQUcsSUFBSSxFQUFFO0FBQ3JCLE1BQU07QUFDTixNQUFNLElBQUksRUFBRSxJQUFJLFlBQVksT0FBTyxDQUFDLEVBQUU7QUFDdEMsUUFBUSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDcEMsTUFBTTtBQUNOLE1BQU0sTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJO0FBQzlCLE1BQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxZQUFZLFdBQVcsRUFBRTtBQUNyRSxRQUFRLE9BQU8sSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDO0FBQ2xDLE1BQU0sQ0FBQyxNQUFNO0FBQ2IsUUFBUSxPQUFPLEtBQUs7QUFDcEIsTUFBTTtBQUNOLElBQUksQ0FBQyxNQUFNO0FBQ1gsTUFBTSxNQUFNLHlEQUF5RDtBQUNyRSxJQUFJO0FBQ0osRUFBRTtBQUNGLEVBQUUsZUFBZSxVQUFVLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtBQUM1QyxJQUFJLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUM7QUFDaEQsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRTtBQUN0QixNQUFNLE1BQU0sQ0FBQywrQkFBK0IsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RixJQUFJO0FBQ0osSUFBSSxPQUFPLFFBQVE7QUFDbkIsRUFBRTtBQUNGLEVBQUUsU0FBUyxpQkFBaUIsR0FBRztBQUMvQixJQUFJLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUM7QUFDNUMsSUFBSSxJQUFJLFNBQVMsRUFBRTtBQUNuQixNQUFNLGNBQWMsR0FBRyxVQUFVLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3RCxJQUFJLENBQUMsTUFBTTtBQUNYLE1BQU0sS0FBSyxFQUFFO0FBQ2IsSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLFNBQVMsVUFBVSxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUU7QUFDckMsSUFBSSxJQUFJLE9BQU8sR0FBRyxDQUFDLFVBQVUsR0FBRyxJQUFJLElBQUksR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLElBQUksS0FBSztBQUNuRSxJQUFJLElBQUksT0FBTyxHQUFHLENBQUMsRUFBRTtBQUNyQixNQUFNLE9BQU8sR0FBRyxDQUFDO0FBQ2pCLElBQUk7QUFDSixJQUFJLE9BQU8sVUFBVSxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUM7QUFDakMsRUFBRTtBQUNGLEVBQUUsU0FBUyxZQUFZLEdBQUc7QUFDMUIsSUFBSSxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDO0FBQ3RDLElBQUksSUFBSSxlQUFlO0FBQ3ZCLElBQUksR0FBRztBQUNQLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDOUIsTUFBTSxjQUFjLEVBQUU7QUFDdEIsTUFBTSxNQUFNLElBQUksR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO0FBQ3RDLE1BQU0sSUFBSSxJQUFJLEVBQUU7QUFDaEIsUUFBUTtBQUNSLE1BQU07QUFDTixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDO0FBQ3BDLE1BQU0sZUFBZSxHQUFHLEdBQUcsRUFBRSxHQUFHLFNBQVM7QUFDekMsSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSTtBQUN2RCxJQUFJLGlCQUFpQixFQUFFO0FBQ3ZCLEVBQUU7QUFDRixFQUFFLFNBQVMsZUFBZSxHQUFHO0FBQzdCLElBQUksWUFBWSxDQUFDLGNBQWMsQ0FBQztBQUNoQyxJQUFJLGNBQWMsR0FBRyxJQUFJO0FBQ3pCLEVBQUU7QUFDRixFQUFFLFNBQVMsWUFBWSxDQUFDLEtBQUssRUFBRTtBQUMvQixJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLEtBQUs7QUFDcEMsSUFBSSxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7QUFDdEIsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ2hCLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUM3QixNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDbkIsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLEtBQUssR0FBRyxFQUFFO0FBQzdCLE1BQU0sTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUMxQyxNQUFNLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO0FBQ3hCLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUM3QixNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUM7QUFDcEIsTUFBTSxJQUFJLGNBQWMsRUFBRTtBQUMxQixRQUFRLEtBQUssRUFBRTtBQUNmLFFBQVEsZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLElBQUk7QUFDdEMsUUFBUSxRQUFRLENBQUMsTUFBTSxFQUFFO0FBQ3pCLFVBQVUsTUFBTSxFQUFFO0FBQ2xCLFNBQVMsQ0FBQztBQUNWLFFBQVEsT0FBTyxJQUFJO0FBQ25CLE1BQU07QUFDTixJQUFJO0FBQ0osSUFBSSxPQUFPLEtBQUs7QUFDaEIsRUFBRTtBQUNGLEVBQUUsU0FBUyxLQUFLLEdBQUc7QUFDbkIsSUFBSSxlQUFlLEVBQUU7QUFDckIsSUFBSSxTQUFTLEVBQUU7QUFDZixJQUFJLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksU0FBUyxHQUFHLElBQUksRUFBRTtBQUN2RSxNQUFNLGNBQWMsR0FBRyxDQUFDO0FBQ3hCLE1BQU0sU0FBUyxHQUFHLEdBQUcsRUFBRTtBQUN2QixNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNwQixNQUFNLDJCQUEyQixFQUFFO0FBQ25DLE1BQU0saUJBQWlCLEVBQUU7QUFDekIsTUFBTSxJQUFJLFlBQVksRUFBRTtBQUN4QixRQUFRLFlBQVksQ0FBQyxXQUFXLEdBQUcsQ0FBQztBQUNwQyxNQUFNO0FBQ04sSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLGdCQUFnQixHQUFHLFFBQVEsR0FBRyxJQUFJO0FBQ3hDLE1BQU0sUUFBUSxDQUFDLE9BQU8sQ0FBQztBQUN2QixNQUFNLElBQUksWUFBWSxFQUFFO0FBQ3hCLFFBQVEsWUFBWSxDQUFDLEtBQUssRUFBRTtBQUM1QixNQUFNO0FBQ04sSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLGVBQWUsSUFBSSxHQUFHO0FBQ3hCLElBQUksSUFBSSxjQUFjLEVBQUUsTUFBTSxpQkFBaUI7QUFDL0MsSUFBSSxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxTQUFTLEVBQUUsTUFBTSxlQUFlO0FBQ25FLElBQUksSUFBSSxnQkFBZ0IsS0FBSyxJQUFJLEVBQUU7QUFDbkMsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUM7QUFDNUIsSUFBSTtBQUNKLElBQUksTUFBTSxNQUFNLEVBQUU7QUFDbEIsSUFBSSxPQUFPLElBQUk7QUFDZixFQUFFO0FBQ0YsRUFBRSxTQUFTLEtBQUssR0FBRztBQUNuQixJQUFJLDBCQUEwQixHQUFHLEtBQUs7QUFDdEMsSUFBSSxJQUFJLFlBQVksRUFBRTtBQUN0QixNQUFNLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDMUIsSUFBSTtBQUNKLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLElBQUk7QUFDcEMsSUFBSSxlQUFlLEVBQUU7QUFDckIsSUFBSSxnQkFBZ0IsR0FBRyxHQUFHLEVBQUUsR0FBRyxTQUFTO0FBQ3hDLElBQUksT0FBTyxJQUFJO0FBQ2YsRUFBRTtBQUNGLEVBQUUsZUFBZSxNQUFNLEdBQUc7QUFDMUIsSUFBSSxJQUFJLFlBQVksSUFBSSxDQUFDLFFBQVEsRUFBRSxhQUFhLEVBQUU7QUFDbEQsSUFBSSxTQUFTLEdBQUcsR0FBRyxFQUFFLEdBQUcsZ0JBQWdCO0FBQ3hDLElBQUksZ0JBQWdCLEdBQUcsSUFBSTtBQUMzQixJQUFJLGlCQUFpQixFQUFFO0FBQ3ZCLElBQUksSUFBSSxZQUFZLEVBQUU7QUFDdEIsTUFBTSxNQUFNLFlBQVksQ0FBQyxJQUFJLEVBQUU7QUFDL0IsSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLGVBQWUsSUFBSSxDQUFDLEtBQUssRUFBRTtBQUM3QixJQUFJLElBQUksZUFBZSxFQUFFO0FBQ3pCLE1BQU0sT0FBTyxLQUFLO0FBQ2xCLElBQUk7QUFDSixJQUFJLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxjQUFjO0FBQ3RDLElBQUksS0FBSyxFQUFFO0FBQ1gsSUFBSSxJQUFJLFlBQVksRUFBRTtBQUN0QixNQUFNLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDMUIsSUFBSTtBQUNKLElBQUksTUFBTSxXQUFXLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLElBQUksSUFBSTtBQUN0RCxJQUFJLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO0FBQ25DLE1BQU0sSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO0FBQzFCLFFBQVEsS0FBSyxHQUFHLFdBQVcsR0FBRyxDQUFDO0FBQy9CLE1BQU0sQ0FBQyxNQUFNLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtBQUNqQyxRQUFRLEtBQUssR0FBRyxXQUFXLEdBQUcsQ0FBQztBQUMvQixNQUFNLENBQUMsTUFBTSxJQUFJLEtBQUssS0FBSyxLQUFLLEVBQUU7QUFDbEMsUUFBUSxLQUFLLEdBQUcsV0FBVyxHQUFHLEdBQUcsR0FBRyxRQUFRO0FBQzVDLE1BQU0sQ0FBQyxNQUFNLElBQUksS0FBSyxLQUFLLEtBQUssRUFBRTtBQUNsQyxRQUFRLEtBQUssR0FBRyxXQUFXLEdBQUcsR0FBRyxHQUFHLFFBQVE7QUFDNUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7QUFDbEQsUUFBUSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsUUFBUTtBQUNqRixNQUFNO0FBQ04sSUFBSSxDQUFDLE1BQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7QUFDMUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssTUFBTSxFQUFFO0FBQ25DLFFBQVEsS0FBSyxHQUFHLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7QUFDdEQsUUFBUSxJQUFJLFNBQVMsSUFBSSxXQUFXLEdBQUcsS0FBSyxHQUFHLENBQUMsRUFBRTtBQUNsRCxVQUFVLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQ2xELFFBQVE7QUFDUixNQUFNLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssTUFBTSxFQUFFO0FBQzFDLFFBQVEsS0FBSyxHQUFHLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxJQUFJLFFBQVE7QUFDNUQsTUFBTSxDQUFDLE1BQU0sSUFBSSxPQUFPLEtBQUssQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFO0FBQ25ELFFBQVEsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDNUMsUUFBUSxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7QUFDbEMsVUFBVSxNQUFNLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZELFFBQVEsQ0FBQyxNQUFNO0FBQ2YsVUFBVSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUMzQixRQUFRO0FBQ1IsTUFBTTtBQUNOLElBQUk7QUFDSixJQUFJLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDO0FBQzdELElBQUksSUFBSSxVQUFVLEdBQUcsYUFBYSxFQUFFO0FBQ3BDLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3BCLE1BQU0sMkJBQTJCLEVBQUU7QUFDbkMsTUFBTSxjQUFjLEdBQUcsQ0FBQztBQUN4QixNQUFNLGFBQWEsR0FBRyxDQUFDO0FBQ3ZCLElBQUk7QUFDSixJQUFJLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUM7QUFDdEMsSUFBSSxPQUFPLEtBQUssSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksVUFBVSxFQUFFO0FBQzVDLE1BQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7QUFDaEQsUUFBUSxZQUFZLENBQUMsS0FBSyxDQUFDO0FBQzNCLE1BQU07QUFDTixNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQzlCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxFQUFFLGNBQWMsQ0FBQztBQUN0QyxJQUFJO0FBQ0osSUFBSSxnQkFBZ0IsR0FBRyxVQUFVLEdBQUcsSUFBSTtBQUN4QyxJQUFJLGdCQUFnQixHQUFHLElBQUk7QUFDM0IsSUFBSSxJQUFJLFlBQVksSUFBSSxhQUFhLEVBQUU7QUFDdkMsTUFBTSxZQUFZLENBQUMsV0FBVyxHQUFHLFVBQVUsR0FBRyxLQUFLO0FBQ25ELElBQUk7QUFDSixJQUFJLElBQUksU0FBUyxFQUFFO0FBQ25CLE1BQU0sTUFBTSxNQUFNLEVBQUU7QUFDcEIsSUFBSTtBQUNKLElBQUksT0FBTyxJQUFJO0FBQ2YsRUFBRTtBQUNGLEVBQUUsU0FBUyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUU7QUFDdEMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO0FBQzdCLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNiLElBQUksSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUMzQixJQUFJLElBQUksb0JBQW9CO0FBQzVCLElBQUksT0FBTyxNQUFNLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksRUFBRTtBQUN2QyxNQUFNLG9CQUFvQixHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDdEMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzNCLElBQUk7QUFDSixJQUFJLE9BQU8sb0JBQW9CO0FBQy9CLEVBQUU7QUFDRixFQUFFLFNBQVMsbUJBQW1CLENBQUMsSUFBSSxFQUFFO0FBQ3JDLElBQUksSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtBQUM3QixJQUFJLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQztBQUM5QixJQUFJLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDM0IsSUFBSSxJQUFJLG9CQUFvQjtBQUM1QixJQUFJLE9BQU8sTUFBTSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEVBQUU7QUFDdkMsTUFBTSxvQkFBb0IsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMzQixJQUFJO0FBQ0osSUFBSSxPQUFPLG9CQUFvQjtBQUMvQixFQUFFO0FBQ0YsRUFBRSxTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUU7QUFDbkIsSUFBSSxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUU7QUFDekIsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNYLElBQUk7QUFDSixJQUFJLElBQUksU0FBUztBQUNqQixJQUFJLElBQUksV0FBVztBQUNuQixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUNmLE1BQU0sSUFBSSxLQUFLLEdBQUcsY0FBYztBQUNoQyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQy9CLE1BQU0sS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNsQyxRQUFRLE9BQU8sU0FBUyxLQUFLLFNBQVMsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQ2hFLFVBQVUsU0FBUyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQztBQUNyQyxRQUFRO0FBQ1IsUUFBUSxJQUFJLFNBQVMsS0FBSyxTQUFTLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUM3RCxVQUFVLFdBQVcsR0FBRyxLQUFLO0FBQzdCLFFBQVE7QUFDUixNQUFNO0FBQ04sSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDakQsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUMvQixNQUFNLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDbEMsUUFBUSxPQUFPLFNBQVMsS0FBSyxTQUFTLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUNoRSxVQUFVLFNBQVMsR0FBRyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUM7QUFDckMsUUFBUTtBQUNSLFFBQVEsSUFBSSxTQUFTLEtBQUssU0FBUyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7QUFDN0QsVUFBVSxXQUFXLEdBQUcsS0FBSztBQUM3QixRQUFRO0FBQ1IsTUFBTTtBQUNOLE1BQU0sSUFBSSxXQUFXLEtBQUssU0FBUyxFQUFFO0FBQ3JDLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3RCLFFBQVEsMkJBQTJCLEVBQUU7QUFDckMsUUFBUSxjQUFjLEdBQUcsQ0FBQztBQUMxQixNQUFNO0FBQ04sSUFBSTtBQUNKLElBQUksSUFBSSxXQUFXLEtBQUssU0FBUyxFQUFFO0FBQ25DLElBQUksT0FBTyxjQUFjLElBQUksV0FBVyxFQUFFO0FBQzFDLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMxQyxNQUFNLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQ3hELFFBQVEsWUFBWSxDQUFDLFNBQVMsQ0FBQztBQUMvQixNQUFNO0FBQ04sSUFBSTtBQUNKLElBQUksYUFBYSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsSUFBSSxnQkFBZ0IsR0FBRyxhQUFhLEdBQUcsSUFBSTtBQUMzQyxJQUFJLGdCQUFnQixHQUFHLElBQUk7QUFDM0IsSUFBSSxJQUFJLFlBQVksSUFBSSxhQUFhLEVBQUU7QUFDdkMsTUFBTSxZQUFZLENBQUMsV0FBVyxHQUFHLGFBQWEsR0FBRyxLQUFLO0FBQ3RELElBQUk7QUFDSixJQUFJLElBQUksTUFBTSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUU7QUFDL0MsTUFBTSxLQUFLLEVBQUU7QUFDYixJQUFJO0FBQ0osRUFBRTtBQUNGLEVBQUUsZUFBZSxPQUFPLEdBQUc7QUFDM0IsSUFBSSxJQUFJLGNBQWMsRUFBRSxNQUFNLGVBQWU7QUFDN0MsSUFBSSxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxTQUFTLEVBQUUsTUFBTSxXQUFXO0FBQy9ELElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNYLElBQUksTUFBTSxNQUFNLEVBQUU7QUFDbEIsSUFBSSxPQUFPLElBQUk7QUFDZixFQUFFO0FBQ0YsRUFBRSxTQUFTLFNBQVMsQ0FBQyxJQUFJLEVBQUU7QUFDM0IsSUFBSSxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pFLEVBQUU7QUFDRixFQUFFLFNBQVMsY0FBYyxHQUFHO0FBQzVCLElBQUksSUFBSSxjQUFjLEVBQUU7QUFDeEIsTUFBTSxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxJQUFJLElBQUk7QUFDdkMsSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLElBQUksSUFBSTtBQUMzQyxJQUFJO0FBQ0osRUFBRTtBQUNGLEVBQUUsU0FBUywyQkFBMkIsR0FBRztBQUN6QyxJQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDO0FBQ3BDLEVBQUU7QUFDRixFQUFFLFNBQVMsYUFBYSxHQUFHO0FBQzNCLElBQUksUUFBUSxHQUFHLElBQUksWUFBWSxDQUFDO0FBQ2hDLE1BQU0sV0FBVyxFQUFFO0FBQ25CLEtBQUssQ0FBQztBQUNOLElBQUksTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLHdCQUF3QixDQUFDLFlBQVksQ0FBQztBQUMvRCxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQztBQUNyQyxJQUFJLEdBQUcsR0FBRyxRQUFRO0FBQ2xCLEVBQUU7QUFDRixFQUFFLFNBQVMsUUFBUSxHQUFHO0FBQ3RCLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLDhDQUE4QztBQUN2RSxJQUFJLE1BQU07QUFDVixNQUFNLFdBQVc7QUFDakIsTUFBTTtBQUNOLEtBQUssR0FBRyxRQUFRLENBQUMsa0JBQWtCLEVBQUU7O0FBRXJDO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQUksT0FBTyxlQUFlLEtBQUssQ0FBQyxHQUFHLFdBQVcsR0FBRyxJQUFJLEdBQUcsV0FBVyxHQUFHLElBQUksSUFBSSxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsZUFBZSxDQUFDO0FBQ2xILEVBQUU7QUFDRixFQUFFLFNBQVMsY0FBYyxHQUFHO0FBQzVCLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztBQUNuQyxJQUFJLGVBQWUsR0FBRyxJQUFJO0FBQzFCLElBQUksMEJBQTBCLEdBQUcsQ0FBQyxDQUFDLGNBQWM7QUFDakQsSUFBSSxjQUFjLEdBQUcsVUFBVSxDQUFDLE1BQU0sUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQztBQUNoRSxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsT0FBTyxJQUFJO0FBQ3BDLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQztBQUM1QyxJQUFJLGVBQWUsRUFBRTtBQUNyQixJQUFJLGdCQUFnQixHQUFHLEdBQUcsRUFBRSxHQUFHLFNBQVM7QUFDeEMsRUFBRTtBQUNGLEVBQUUsU0FBUyxjQUFjLEdBQUc7QUFDNUIsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUNqQyxJQUFJLFlBQVksQ0FBQyxjQUFjLENBQUM7QUFDaEMsSUFBSSxRQUFRLENBQUMsU0FBUyxDQUFDO0FBQ3ZCLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtBQUMxQixJQUFJLGVBQWUsR0FBRyxLQUFLO0FBQzNCLElBQUksSUFBSSwwQkFBMEIsRUFBRTtBQUNwQyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLENBQUM7QUFDL0MsTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFLEdBQUcsZ0JBQWdCO0FBQzFDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSTtBQUM3QixNQUFNLGlCQUFpQixFQUFFO0FBQ3pCLElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxTQUFTLElBQUksR0FBRztBQUNsQixJQUFJLElBQUksWUFBWSxFQUFFO0FBQ3RCLE1BQU0sWUFBWSxDQUFDLEtBQUssR0FBRyxJQUFJO0FBQy9CLE1BQU0sT0FBTyxJQUFJO0FBQ2pCLElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxTQUFTLE1BQU0sR0FBRztBQUNwQixJQUFJLElBQUksWUFBWSxFQUFFO0FBQ3RCLE1BQU0sWUFBWSxDQUFDLEtBQUssR0FBRyxLQUFLO0FBQ2hDLE1BQU0sT0FBTyxJQUFJO0FBQ2pCLElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxPQUFPO0FBQ1QsSUFBSSxJQUFJO0FBQ1IsSUFBSSxJQUFJO0FBQ1IsSUFBSSxLQUFLO0FBQ1QsSUFBSSxJQUFJO0FBQ1IsSUFBSSxJQUFJO0FBQ1IsSUFBSSxPQUFPO0FBQ1gsSUFBSSxJQUFJLEVBQUUsS0FBSztBQUNmLElBQUksSUFBSTtBQUNSLElBQUksTUFBTTtBQUNWLElBQUk7QUFDSixHQUFHO0FBQ0g7QUFDQSxTQUFTLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDekIsRUFBRSxJQUFJLFlBQVksR0FBRyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRTtBQUNqRyxFQUFFLElBQUksU0FBUztBQUNmLEVBQUUsT0FBTyxJQUFJLElBQUk7QUFDakIsSUFBSSxJQUFJLEVBQUUsR0FBRyxDQUFDO0FBQ2QsSUFBSSxJQUFJLEVBQUUsR0FBRyxDQUFDO0FBQ2QsSUFBSSxPQUFPO0FBQ1gsTUFBTSxJQUFJLEVBQUUsS0FBSyxJQUFJO0FBQ3JCLFFBQVEsRUFBRSxFQUFFO0FBQ1osUUFBUSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7QUFDckMsVUFBVSxTQUFTLEdBQUcsS0FBSztBQUMzQixVQUFVO0FBQ1YsUUFBUTtBQUNSLFFBQVEsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLEVBQUU7QUFDaEcsVUFBVSxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNsQyxRQUFRLENBQUMsTUFBTTtBQUNmLFVBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUN6QixVQUFVLFNBQVMsR0FBRyxLQUFLO0FBQzNCLFVBQVUsRUFBRSxFQUFFO0FBQ2QsUUFBUTtBQUNSLE1BQU0sQ0FBQztBQUNQLE1BQU0sS0FBSyxFQUFFLE1BQU07QUFDbkIsUUFBUSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7QUFDckMsVUFBVSxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQ3pCLFVBQVUsRUFBRSxFQUFFO0FBQ2QsUUFBUTtBQUNSLFFBQVEsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM1RCxNQUFNO0FBQ04sS0FBSztBQUNMLEVBQUUsQ0FBQztBQUNIO0FBQ0EsU0FBUyxPQUFPLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7QUFDM0MsRUFBRSxJQUFJO0FBQ04sSUFBSSxPQUFPLEdBQUcsQ0FBQztBQUNmLElBQUksYUFBYTtBQUNqQixJQUFJLFlBQVk7QUFDaEIsSUFBSSxXQUFXO0FBQ2YsSUFBSTtBQUNKLEdBQUcsR0FBRyxLQUFLO0FBQ1gsRUFBRSxJQUFJO0FBQ04sSUFBSTtBQUNKLEdBQUcsR0FBRyxTQUFTO0FBQ2YsRUFBRSxJQUFJLEVBQUUsTUFBTSxZQUFZLE1BQU0sQ0FBQyxFQUFFO0FBQ25DLElBQUksTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUMvQixFQUFFO0FBQ0YsRUFBRSxhQUFhLEdBQUcsYUFBYSxJQUFJLFNBQVMsQ0FBQyxhQUFhLElBQUksUUFBUTtBQUN0RSxFQUFFLE1BQU0sYUFBYSxHQUFHO0FBQ3hCLElBQUksTUFBTSxFQUFFO0FBQ1osR0FBRztBQUNILEVBQUUsTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUN2SSxFQUFFLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRTtBQUM5QixJQUFJLFFBQVEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDO0FBQ3hELElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO0FBQzdHLEVBQUU7QUFDRixFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxFQUFFO0FBQzNCLEVBQUUsSUFBSSxXQUFXLEtBQUssU0FBUyxFQUFFO0FBQ2pDLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakYsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLEVBQUU7QUFDRixFQUFFLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxFQUFFLE1BQU0sZ0JBQWdCLEdBQUcsT0FBTyxHQUFHLGFBQWEsQ0FBQyxNQUFNO0FBQ3pELEVBQUUsT0FBTztBQUNULElBQUksR0FBRyxTQUFTO0FBQ2hCLElBQUksTUFBTTtBQUNWLElBQUksUUFBUTtBQUNaLElBQUk7QUFDSixHQUFHO0FBQ0g7QUFDQSxTQUFTLGVBQWUsQ0FBQyxDQUFDLEVBQUU7QUFDNUIsRUFBRSxPQUFPLE9BQU8sQ0FBQyxLQUFLLFFBQVEsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRTtBQUNBLFNBQVMsV0FBVyxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQ3JELEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUNmLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUNmLEVBQUUsT0FBTyxVQUFVLENBQUMsRUFBRTtBQUN0QixJQUFJLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLO0FBQzlCLElBQUksTUFBTSxLQUFLLEdBQUcsS0FBSyxHQUFHLGFBQWE7QUFDdkMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQixJQUFJLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtBQUNuQixNQUFNLEtBQUssSUFBSSxLQUFLO0FBQ3BCLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxFQUFFO0FBQzFCLFFBQVEsTUFBTSxDQUFDLE1BQU0sSUFBSSxLQUFLO0FBQzlCLE1BQU07QUFDTixJQUFJO0FBQ0osSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JDLEVBQUUsQ0FBQztBQUNIO0FBQ0EsU0FBUyxhQUFhLEdBQUc7QUFDekIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQ1gsRUFBRSxPQUFPLFVBQVUsQ0FBQyxFQUFFO0FBQ3RCLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQ3RCLE1BQU0sT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDMUIsUUFBUSxLQUFLLEVBQUUsQ0FBQyxFQUFFO0FBQ2xCLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEIsUUFBUSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDbEIsT0FBTyxDQUFDO0FBQ1IsSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLE9BQU8sQ0FBQztBQUNkLElBQUk7QUFDSixFQUFFLENBQUM7QUFDSDtBQUNBLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUU7QUFDbkMsRUFBRSxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQztBQUMxQyxFQUFFLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZGLEVBQUUsTUFBTSxTQUFTLEdBQUcsa0JBQWtCLENBQUM7QUFDdkMsSUFBSSxHQUFHLFNBQVM7QUFDaEIsSUFBSTtBQUNKLEdBQUcsQ0FBQztBQUNKLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDeEQsSUFBSSxJQUFJLEVBQUU7QUFDVixHQUFHLENBQUMsQ0FBQztBQUNMLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRO0FBQzFCLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNkO0FBQ0EsZUFBZSxrQkFBa0IsQ0FBQyxHQUFHLEVBQUU7QUFDdkMsRUFBRSxNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssRUFBRTtBQUMzQixFQUFFLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTTtBQUN4QixFQUFFLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSztBQUNwQixFQUFFLEtBQUssQ0FBQyxXQUFXLEdBQUcsV0FBVztBQUNqQyxFQUFFLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRztBQUNqQixFQUFFLElBQUksT0FBTztBQUNiLEVBQUUsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxJQUFJO0FBQzFDLElBQUksT0FBTyxHQUFHLFFBQVE7QUFDdEIsRUFBRSxDQUFDLENBQUM7QUFDSixFQUFFLFNBQVMsU0FBUyxHQUFHO0FBQ3ZCLElBQUksT0FBTyxFQUFFO0FBQ2IsSUFBSSxLQUFLLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQztBQUNuRCxFQUFFO0FBQ0YsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQztBQUM5QyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUU7QUFDZCxFQUFFLE1BQU0sT0FBTztBQUNmLEVBQUUsT0FBTyxLQUFLO0FBQ2Q7O0FBRUEsU0FBUyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7QUFDbkMsRUFBRSxJQUFJO0FBQ04sSUFBSSxTQUFTLEdBQUcsQ0FBQztBQUNqQixJQUFJLFdBQVcsR0FBRyxDQUFDO0FBQ25CLElBQUksY0FBYyxHQUFHO0FBQ3JCLEdBQUcsR0FBRyxJQUFJO0FBQ1YsRUFBRSxJQUFJO0FBQ04sSUFBSTtBQUNKLEdBQUcsR0FBRyxLQUFLO0FBQ1gsRUFBRSxJQUFJO0FBQ04sSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUNaLElBQUksSUFBSSxHQUFHO0FBQ1gsR0FBRyxHQUFHLEtBQUs7QUFDWCxFQUFFLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztBQUN4QyxFQUFFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDMUMsRUFBRSxNQUFNLFdBQVcsR0FBRyxDQUFDLHFCQUFxQixFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDMUQsRUFBRSxJQUFJLFVBQVU7QUFDaEIsRUFBRSxNQUFNLGNBQWMsR0FBRyxNQUFNO0FBQy9CLElBQUksTUFBTSxDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUU7QUFDeEIsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFO0FBQzFCLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRTtBQUM1QixJQUFJLE1BQU0sSUFBSSxHQUFHLEVBQUU7QUFDbkIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUNuQixJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDdEMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNwQixJQUFJO0FBQ0osSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtBQUNoQixNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQ3BCLElBQUk7QUFDSixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNwRCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQ2hCLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDcEIsSUFBSTtBQUNKLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixJQUFJLE9BQU8sSUFBSTtBQUNmLEVBQUUsQ0FBQztBQUNILEVBQUUsTUFBTSxVQUFVLEdBQUcsTUFBTTtBQUMzQixJQUFJLGNBQWMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDbEMsRUFBRSxDQUFDO0FBQ0gsRUFBRSxPQUFPO0FBQ1QsSUFBSSxJQUFJLEVBQUUsTUFBTTtBQUNoQixNQUFNLE1BQU0sUUFBUSxHQUFHLEVBQUUsR0FBRyxFQUFFO0FBQzlCLE1BQU0sTUFBTSxNQUFNLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDM0QsTUFBTSxPQUFPO0FBQ2IsUUFBUSxJQUFJO0FBQ1osUUFBUSxJQUFJO0FBQ1osUUFBUSxRQUFRO0FBQ2hCLFFBQVE7QUFDUixPQUFPO0FBQ1AsSUFBSSxDQUFDO0FBQ0wsSUFBSSxJQUFJLEVBQUUsTUFBTTtBQUNoQixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDdkIsTUFBTSxVQUFVLEVBQUU7QUFDbEIsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUM7QUFDaEQsTUFBTSxPQUFPLElBQUk7QUFDakIsSUFBSSxDQUFDO0FBQ0wsSUFBSSxJQUFJLEVBQUUsTUFBTTtBQUNoQixNQUFNLGFBQWEsQ0FBQyxVQUFVLENBQUM7QUFDL0IsSUFBSSxDQUFDO0FBQ0wsSUFBSSxjQUFjLEVBQUUsTUFBTTtBQUMxQixNQUFNLE1BQU0sQ0FBQyxHQUFHLElBQUksSUFBSSxFQUFFO0FBQzFCLE1BQU0sT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUU7QUFDL0MsSUFBSTtBQUNKLEdBQUc7QUFDSDs7QUFFQSxTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNsQyxFQUFFLElBQUk7QUFDTixJQUFJO0FBQ0osR0FBRyxHQUFHLElBQUk7QUFDVixFQUFFLElBQUk7QUFDTixJQUFJO0FBQ0osR0FBRyxHQUFHLEtBQUs7QUFDWCxFQUFFLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLEVBQUUsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJO0FBQ3hDLEVBQUUsSUFBSSxTQUFTO0FBQ2YsRUFBRSxNQUFNLFFBQVEsR0FBRyxNQUFNO0FBQ3pCLElBQUksTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM1QyxJQUFJLFNBQVMsR0FBRyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDNUMsRUFBRSxDQUFDO0FBQ0gsRUFBRSxNQUFNLEtBQUssR0FBRyxNQUFNO0FBQ3RCLElBQUksUUFBUSxFQUFFO0FBQ2QsSUFBSSxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQztBQUM5RSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDZCxFQUFFLENBQUM7QUFDSCxFQUFFLE9BQU8sTUFBTTtBQUNmLElBQUksUUFBUSxFQUFFO0FBQ2QsSUFBSSxPQUFPLE1BQU0sYUFBYSxDQUFDLFNBQVMsQ0FBQztBQUN6QyxFQUFFLENBQUM7QUFDSDs7QUFFQSxTQUFTLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2hDLEVBQUUsSUFBSTtBQUNOLElBQUksR0FBRztBQUNQLElBQUksVUFBVSxHQUFHO0FBQ2pCLEdBQUcsR0FBRyxJQUFJO0FBQ1YsRUFBRSxJQUFJO0FBQ04sSUFBSSxJQUFJO0FBQ1IsSUFBSTtBQUNKLEdBQUcsR0FBRyxLQUFLO0FBQ1gsRUFBRSxJQUFJLElBQUk7QUFDVixFQUFFLElBQUksU0FBUyxHQUFHLENBQUM7QUFDbkIsRUFBRSxPQUFPO0FBQ1QsSUFBSSxNQUFNLElBQUksR0FBRztBQUNqQixNQUFNLE1BQU0sU0FBUyxHQUFHLE1BQU0sT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZELE1BQU0sTUFBTTtBQUNaLFFBQVEsSUFBSTtBQUNaLFFBQVEsSUFBSTtBQUNaLFFBQVE7QUFDUixPQUFPLEdBQUcsU0FBUztBQUNuQixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUk7QUFDaEQsUUFBUSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsR0FBRyxLQUFLO0FBQ3hDLFFBQVEsT0FBTyxJQUFJLEtBQUssR0FBRztBQUMzQixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUk7QUFDdEIsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxLQUFLO0FBQ3ZDLFFBQVEsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUM7QUFDM0IsTUFBTSxDQUFDLENBQUM7QUFDUixNQUFNLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxNQUFNLEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7QUFDcEMsUUFBUSxTQUFTLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDMUMsTUFBTTtBQUNOLE1BQU0sT0FBTztBQUNiLFFBQVEsSUFBSTtBQUNaLFFBQVEsSUFBSTtBQUNaLFFBQVE7QUFDUixPQUFPO0FBQ1AsSUFBSSxDQUFDO0FBQ0wsSUFBSSxJQUFJLEdBQUc7QUFDWCxNQUFNLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUU7QUFDekMsTUFBTSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzNDLFFBQVEsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRTtBQUN0QyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDcEIsUUFBUTtBQUNSLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3RCLE1BQU07O0FBRU4sTUFBTSxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFO0FBQ3ZDLE1BQU0sTUFBTSxRQUFRLEdBQUcsQ0FBQyxPQUFPLEdBQUcsU0FBUyxJQUFJLElBQUk7QUFDbkQsTUFBTSxNQUFNLFVBQVUsR0FBRyxTQUFTLEdBQUcsVUFBVSxHQUFHLFFBQVE7QUFDMUQsTUFBTSxNQUFNLGFBQWEsR0FBRyxTQUFTLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLFVBQVUsR0FBRyxRQUFRO0FBQzdFLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtBQUN4QyxRQUFRLFNBQVM7QUFDakIsUUFBUSxVQUFVO0FBQ2xCLFFBQVEsUUFBUTtBQUNoQixRQUFRLFVBQVU7QUFDbEIsUUFBUTtBQUNSLE9BQU8sQ0FBQztBQUNSLE1BQU0sVUFBVSxDQUFDLE1BQU07QUFDdkIsUUFBUSxRQUFRLENBQUMsU0FBUyxFQUFFO0FBQzVCLFVBQVUsTUFBTSxFQUFFO0FBQ2xCLFNBQVMsQ0FBQztBQUNWLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNYLE1BQU0sT0FBTyxJQUFJO0FBQ2pCLElBQUk7QUFDSixHQUFHO0FBQ0g7O0FBRUEsTUFBTSxLQUFLLENBQUM7QUFDWixFQUFFLFdBQVcsR0FBRztBQUNoQixJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUNuQixJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBUztBQUMzQixFQUFFO0FBQ0YsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFO0FBQ2IsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDekIsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFO0FBQ25DLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDaEMsTUFBTSxJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVM7QUFDN0IsSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLE1BQU0sR0FBRztBQUNYLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDL0IsTUFBTSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSztBQUM5QixNQUFNLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUNyQixNQUFNLE9BQU8sS0FBSztBQUNsQixJQUFJLENBQUMsTUFBTTtBQUNYLE1BQU0sTUFBTSxJQUFJLEdBQUcsSUFBSTtBQUN2QixNQUFNLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxJQUFJO0FBQ3BDLFFBQVEsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPO0FBQzdCLE1BQU0sQ0FBQyxDQUFDO0FBQ1IsSUFBSTtBQUNKLEVBQUU7QUFDRjs7QUFFQSxTQUFTLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRTtBQUMvRyxFQUFFLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUM7QUFDL0QsRUFBRSxJQUFJLFVBQVUsS0FBSyxDQUFDLEVBQUU7QUFDeEIsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0FBQ25DLElBQUksT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDO0FBQzlCLEVBQUUsQ0FBQyxNQUFNO0FBQ1QsSUFBSSxVQUFVLEdBQUcsVUFBVSxJQUFJLEVBQUU7QUFDakMsSUFBSSxJQUFJLGFBQWE7QUFDckIsSUFBSSxJQUFJLE9BQU8sVUFBVSxLQUFLLFFBQVEsRUFBRTtBQUN4QyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyx5QkFBeUIsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEUsTUFBTSxhQUFhLEdBQUcsUUFBUSxJQUFJLFVBQVU7QUFDNUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxPQUFPLFVBQVUsS0FBSyxVQUFVLEVBQUU7QUFDakQsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLDZCQUE2QixDQUFDO0FBQ2pELE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQztBQUNqQyxRQUFRO0FBQ1IsT0FBTyxDQUFDO0FBQ1IsSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsVUFBVSxDQUFDO0FBQ3ZELE1BQU0sYUFBYSxHQUFHLDBCQUEwQixDQUFDO0FBQ2pELFFBQVE7QUFDUixPQUFPLEVBQUUsVUFBVSxDQUFDO0FBQ3BCLElBQUk7QUFDSixJQUFJLE9BQU8sTUFBTSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxjQUFjLElBQUksR0FBRyxFQUFFLFlBQVksQ0FBQztBQUMvRixFQUFFO0FBQ0Y7QUFDQSxTQUFTLFVBQVUsQ0FBQyxPQUFPLEVBQUU7QUFDN0IsRUFBRSxPQUFPO0FBQ1QsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFO0FBQ3JCLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMsSUFBSSxDQUFDO0FBQ0wsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ25CLE1BQU0sT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFDeEIsSUFBSSxDQUFDO0FBQ0wsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUNaLEdBQUc7QUFDSDtBQUNBLFNBQVMsWUFBWSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRTtBQUN2RCxFQUFFLE9BQU8sVUFBVSxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQy9CLElBQUksSUFBSSxJQUFJLEtBQUssR0FBRyxFQUFFO0FBQ3RCLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQztBQUNoQixJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7QUFDN0IsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ25CLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUM3QixNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDbEMsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLEtBQUssR0FBRyxFQUFFO0FBQzdCLE1BQU0sUUFBUSxDQUFDLElBQUksQ0FBQztBQUNwQixJQUFJO0FBQ0osRUFBRSxDQUFDO0FBQ0g7QUFDQSxTQUFTLE1BQU0sQ0FBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFO0FBQ3pFLEVBQUUsSUFBSSxZQUFZLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUU7QUFDakcsRUFBRSxJQUFJLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsY0FBYyxHQUFHLElBQUk7QUFDdkQsRUFBRSxJQUFJLFVBQVUsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDO0FBQ25DLEVBQUUsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUU7QUFDM0IsRUFBRSxZQUFZLElBQUksSUFBSTtBQUN0QixFQUFFLElBQUkscUJBQXFCLEdBQUcsQ0FBQyxZQUFZO0FBQzNDLEVBQUUsSUFBSSxJQUFJLEdBQUcsS0FBSztBQUNsQixFQUFFLFNBQVMsZUFBZSxHQUFHO0FBQzdCLElBQUksT0FBTyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSztBQUNwQyxFQUFFO0FBQ0YsRUFBRSxVQUFVLENBQUMsWUFBWTtBQUN6QixJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUU7QUFDbEIsTUFBTSxNQUFNLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDekMsTUFBTSxJQUFJLElBQUksRUFBRTtBQUNoQixNQUFNLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFO0FBQ2xDLFFBQVEsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLFVBQVU7QUFDOUQsUUFBUSxJQUFJLGlCQUFpQixHQUFHLHFCQUFxQixHQUFHLFlBQVksRUFBRTtBQUN0RSxVQUFVLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JDLFVBQVU7QUFDVixRQUFRO0FBQ1IsUUFBUSxNQUFNLEtBQUssR0FBRyxpQkFBaUIsR0FBRyxlQUFlLEVBQUU7QUFDM0QsUUFBUSxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7QUFDdkIsVUFBVSxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDNUIsVUFBVSxJQUFJLElBQUksRUFBRTtBQUNwQixRQUFRO0FBQ1IsUUFBUSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLFFBQVEsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkMsUUFBUSxxQkFBcUIsR0FBRyxpQkFBaUI7QUFDakQsTUFBTTtBQUNOLElBQUk7QUFDSixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDUCxFQUFFLE9BQU87QUFDVCxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUU7QUFDckIsTUFBTSxJQUFJLE9BQU8sR0FBRyxlQUFlLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSTtBQUN2RCxNQUFNLElBQUksT0FBTyxHQUFHLENBQUMsRUFBRTtBQUN2QixRQUFRLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxvQkFBb0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekQsUUFBUSxLQUFLLElBQUksT0FBTztBQUN4QixRQUFRLE9BQU8sR0FBRyxDQUFDO0FBQ25CLE1BQU07QUFDTixNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDO0FBQ3pDLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDdkIsSUFBSSxDQUFDO0FBQ0wsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ25CLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLGVBQWUsRUFBRSxHQUFHLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdkQsSUFBSSxDQUFDO0FBQ0wsSUFBSSxJQUFJLEdBQUc7QUFDWCxNQUFNLElBQUksR0FBRyxJQUFJO0FBQ2pCLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDM0IsSUFBSTtBQUNKLEdBQUc7QUFDSDtBQUNBLFNBQVMsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNsQixFQUFFLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxJQUFJO0FBQ2hDLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDMUIsRUFBRSxDQUFDLENBQUM7QUFDSjtBQUNBLFNBQVMsMEJBQTBCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNqRCxFQUFFLElBQUk7QUFDTixJQUFJO0FBQ0osR0FBRyxHQUFHLElBQUk7QUFDVixFQUFFLElBQUk7QUFDTixJQUFJLE9BQU8sR0FBRyxFQUFFO0FBQ2hCLElBQUksUUFBUSxHQUFHLEdBQUc7QUFDbEIsSUFBSSxRQUFRLEdBQUcsRUFBRTtBQUNqQixJQUFJLFVBQVUsR0FBRyxFQUFFO0FBQ25CLElBQUksZUFBZSxHQUFHLEdBQUc7QUFDekIsSUFBSSxzQkFBc0IsR0FBRztBQUM3QixHQUFHLEdBQUcsS0FBSztBQUNYLEVBQUUsSUFBSSxXQUFXLEdBQUcsQ0FBQztBQUNyQixFQUFFLElBQUksVUFBVSxHQUFHLGNBQWMsQ0FBQyxXQUFXLENBQUM7QUFDOUMsRUFBRSxJQUFJLFNBQVMsR0FBRyxFQUFFO0FBQ3BCLEVBQUUsSUFBSSxTQUFTLEdBQUcsQ0FBQztBQUNuQixFQUFFLElBQUksV0FBVyxHQUFHLENBQUM7QUFDckIsRUFBRSxJQUFJLGFBQWEsR0FBRyxJQUFJO0FBQzFCLEVBQUUsU0FBUyxjQUFjLENBQUMsS0FBSyxFQUFFO0FBQ2pDLElBQUksSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO0FBQ3JCLE1BQU0sT0FBTyxPQUFPO0FBQ3BCLElBQUksQ0FBQyxNQUFNO0FBQ1gsTUFBTSxPQUFPLFFBQVEsR0FBRyxLQUFLO0FBQzdCLElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxPQUFPLE9BQU8sSUFBSTtBQUNwQixJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQzNCLElBQUksSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVUsRUFBRTtBQUN2QyxNQUFNLE9BQU8sVUFBVTtBQUN2QixJQUFJO0FBQ0osSUFBSSxTQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQztBQUM1QyxJQUFJLE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztBQUMzQyxJQUFJLE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztBQUMzQyxJQUFJLE1BQU0sa0JBQWtCLEdBQUcsZ0JBQWdCLEdBQUcsZ0JBQWdCO0FBQ2xFLElBQUksU0FBUyxHQUFHLGdCQUFnQixHQUFHLGVBQWUsR0FBRyxTQUFTLElBQUksQ0FBQyxHQUFHLGVBQWUsQ0FBQztBQUN0RixJQUFJLFdBQVcsR0FBRyxrQkFBa0IsR0FBRyxlQUFlLEdBQUcsV0FBVyxJQUFJLENBQUMsR0FBRyxlQUFlLENBQUM7QUFDNUYsSUFBSSxNQUFNLGFBQWEsR0FBRyxTQUFTLEdBQUcsV0FBVztBQUNqRCxJQUFJLElBQUksT0FBTyxHQUFHLFVBQVUsRUFBRTtBQUM5QixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUU7QUFDdEMsUUFBUSxPQUFPO0FBQ2YsUUFBUSxTQUFTO0FBQ2pCLFFBQVEsV0FBVztBQUNuQixRQUFRO0FBQ1IsT0FBTyxDQUFDO0FBQ1IsSUFBSTtBQUNKLElBQUksSUFBSSxXQUFXLEdBQUcsUUFBUSxJQUFJLGFBQWEsR0FBRyxVQUFVLEVBQUU7QUFDOUQsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUM7QUFDbkQsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsb0NBQW9DLENBQUMsRUFBRTtBQUMzRCxRQUFRLE9BQU87QUFDZixRQUFRLFNBQVM7QUFDakIsUUFBUSxXQUFXO0FBQ25CLFFBQVE7QUFDUixPQUFPLENBQUM7QUFDUixJQUFJLENBQUMsTUFBTSxJQUFJLFdBQVcsR0FBRyxDQUFDLElBQUksYUFBYSxHQUFHLGNBQWMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLElBQUksV0FBVyxJQUFJLENBQUMsSUFBSSxhQUFhLEdBQUcsY0FBYyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsRUFBRTtBQUMxSixNQUFNLElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtBQUNsQyxRQUFRLGFBQWEsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFO0FBQ3pDLE1BQU0sQ0FBQyxNQUFNLElBQUksV0FBVyxDQUFDLEdBQUcsRUFBRSxHQUFHLGFBQWEsR0FBRyxzQkFBc0IsRUFBRTtBQUM3RSxRQUFRLGFBQWEsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFO0FBQ3pDLFFBQVEsVUFBVSxHQUFHLGNBQWMsQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDO0FBQ3JELFFBQVEsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLHFDQUFxQyxDQUFDLEVBQUU7QUFDOUQsVUFBVSxPQUFPO0FBQ2pCLFVBQVUsU0FBUztBQUNuQixVQUFVLFdBQVc7QUFDckIsVUFBVTtBQUNWLFNBQVMsQ0FBQztBQUNWLE1BQU07QUFDTixNQUFNLE9BQU8sVUFBVTtBQUN2QixJQUFJO0FBQ0osSUFBSSxhQUFhLEdBQUcsSUFBSTtBQUN4QixJQUFJLE9BQU8sVUFBVTtBQUNyQixFQUFFLENBQUM7QUFDSDtBQUNBLFNBQVMsR0FBRyxDQUFDLE9BQU8sRUFBRTtBQUN0QixFQUFFLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEtBQUssR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQy9EO0FBQ0EsU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFO0FBQ3RCLEVBQUUsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsS0FBSyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDL0Q7O0FBRUEsTUFBTSxlQUFlLEdBQUcsT0FBTztBQUMvQixTQUFTLFdBQVcsQ0FBQyxNQUFNLEVBQUU7QUFDN0IsRUFBRSxNQUFNLGFBQWEsR0FBRyxJQUFJLFdBQVcsRUFBRTtBQUN6QyxFQUFFLE1BQU0sWUFBWSxHQUFHLElBQUksV0FBVyxFQUFFO0FBQ3hDLEVBQUUsSUFBSSxPQUFPLEdBQUcsZ0JBQWdCO0FBQ2hDLEVBQUUsSUFBSSxhQUFhO0FBQ25CLEVBQUUsSUFBSSxXQUFXLEdBQUcsQ0FBQztBQUNyQixFQUFFLFNBQVMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFO0FBQ3BDLElBQUksTUFBTSxJQUFJLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ2pELElBQUksSUFBSSxJQUFJLEtBQUssVUFBVSxFQUFFO0FBQzdCLE1BQU0sT0FBTyxHQUFHLGVBQWU7QUFDL0IsSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLE1BQU0sNEJBQTRCO0FBQ3hDLElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxTQUFTLGVBQWUsQ0FBQyxNQUFNLEVBQUU7QUFDbkMsSUFBSSxNQUFNLElBQUksR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN2RCxJQUFJLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUU7QUFDaEMsSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUUsTUFBTSxDQUFDLGlDQUFpQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZFLElBQUksT0FBTyxlQUFlLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztBQUN4QyxFQUFFO0FBQ0YsRUFBRSxTQUFTLGVBQWUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFO0FBQ3pDLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUN4QixJQUFJLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDbkMsSUFBSSxhQUFhLEdBQUcsSUFBSTtBQUN4QixJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsZUFBZTtBQUNqQyxJQUFJLFdBQVcsR0FBRyxDQUFDO0FBQ25CLElBQUksTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUNyQyxJQUFJLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDckMsSUFBSSxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFO0FBQ3ZDLElBQUksSUFBSSxLQUFLO0FBQ2IsSUFBSSxJQUFJLFdBQVcsS0FBSyxDQUFDLEVBQUU7QUFDM0IsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztBQUM3QixNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDbEUsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztBQUN2QixJQUFJLENBQUMsTUFBTSxJQUFJLFdBQVcsS0FBSyxFQUFFLEVBQUU7QUFDbkMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztBQUM5QixNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDbEUsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztBQUN2QixJQUFJLENBQUMsTUFBTSxJQUFJLFdBQVcsS0FBSyxDQUFDLEVBQUU7QUFDbEMsTUFBTSxNQUFNLENBQUMsNEJBQTRCLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztBQUN6RCxJQUFJO0FBQ0osSUFBSSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3hDLElBQUksSUFBSSxJQUFJO0FBQ1osSUFBSSxJQUFJLE9BQU8sR0FBRyxDQUFDLEVBQUU7QUFDckIsTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMvRSxJQUFJO0FBQ0osSUFBSSxPQUFPLEdBQUcsVUFBVTtBQUN4QixJQUFJLE9BQU87QUFDWCxNQUFNLElBQUk7QUFDVixNQUFNLElBQUksRUFBRTtBQUNaLFFBQVEsSUFBSSxFQUFFO0FBQ2QsVUFBVSxJQUFJO0FBQ2QsVUFBVTtBQUNWLFNBQVM7QUFDVCxRQUFRLEtBQUs7QUFDYixRQUFRO0FBQ1I7QUFDQSxLQUFLO0FBQ0wsRUFBRTtBQUNGLEVBQUUsU0FBUyxVQUFVLENBQUMsTUFBTSxFQUFFO0FBQzlCLElBQUksTUFBTSxJQUFJLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdkQsSUFBSSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFO0FBQ2hDLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQ3ZCLE1BQU0sT0FBTyxlQUFlLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztBQUMxQyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDOUIsTUFBTSxPQUFPLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7QUFDM0MsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQzlCLE1BQU0sT0FBTyxlQUFlLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztBQUMxQyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDOUIsTUFBTSxPQUFPLGdCQUFnQixDQUFDLElBQUksQ0FBQztBQUNuQyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDOUIsTUFBTSxPQUFPLGdCQUFnQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7QUFDM0MsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQzlCO0FBQ0EsTUFBTSxPQUFPLEdBQUcsZUFBZTtBQUMvQixNQUFNLE9BQU8sS0FBSztBQUNsQixJQUFJLENBQUMsTUFBTTtBQUNYLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLDBCQUEwQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDdkQsSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLFNBQVMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRTtBQUMxQyxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDeEIsSUFBSSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3hDLElBQUksYUFBYSxJQUFJLE9BQU87QUFDNUIsSUFBSSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3BDLElBQUksTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMvRSxJQUFJLE9BQU8sQ0FBQyxhQUFhLEdBQUcsZUFBZSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFDdkQsRUFBRTtBQUNGLEVBQUUsU0FBUyxlQUFlLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRTtBQUN6QyxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDeEIsSUFBSSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3hDLElBQUksYUFBYSxJQUFJLE9BQU87QUFDNUIsSUFBSSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3BDLElBQUksTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM5RSxJQUFJLE9BQU8sQ0FBQyxhQUFhLEdBQUcsZUFBZSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUM7QUFDdkQsRUFBRTtBQUNGLEVBQUUsU0FBUyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUU7QUFDbEMsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3hCLElBQUksTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUN4QyxJQUFJLGFBQWEsSUFBSSxPQUFPO0FBQzVCLElBQUksTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUNyQyxJQUFJLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDckMsSUFBSSxPQUFPLENBQUMsYUFBYSxHQUFHLGVBQWUsRUFBRSxHQUFHLEVBQUU7QUFDbEQsTUFBTSxJQUFJO0FBQ1YsTUFBTTtBQUNOLEtBQUssQ0FBQztBQUNOLEVBQUU7QUFDRixFQUFFLFNBQVMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRTtBQUMxQyxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDeEIsSUFBSSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3hDLElBQUksYUFBYSxJQUFJLE9BQU87QUFDNUIsSUFBSSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3BDLElBQUksTUFBTSxPQUFPLEdBQUcsSUFBSSxXQUFXLEVBQUU7QUFDckMsSUFBSSxNQUFNLEtBQUssR0FBRyxXQUFXLEVBQUU7QUFDL0IsSUFBSSxNQUFNLElBQUksR0FBRyxhQUFhLEdBQUcsZUFBZTtBQUNoRCxJQUFJLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDMUUsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtBQUN2QixNQUFNLEtBQUs7QUFDWCxNQUFNLElBQUk7QUFDVixNQUFNO0FBQ04sS0FBSyxDQUFDO0FBQ04sRUFBRTtBQUNGLEVBQUUsT0FBTyxVQUFVLE1BQU0sRUFBRTtBQUMzQixJQUFJLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUMxQixFQUFFLENBQUM7QUFDSDtBQUNBLFNBQVMsVUFBVSxDQUFDLEdBQUcsRUFBRTtBQUN6QixFQUFFLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQztBQUNuQyxFQUFFLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyRCxFQUFFLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyRCxFQUFFLE1BQU0sT0FBTyxHQUFHLEVBQUU7QUFDcEIsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3ZDLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RFLEVBQUU7QUFDRixFQUFFLE9BQU87QUFDVCxJQUFJLFVBQVU7QUFDZCxJQUFJLFVBQVU7QUFDZCxJQUFJO0FBQ0osR0FBRztBQUNIO0FBQ0EsU0FBUyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDM0IsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pEO0FBQ0EsU0FBUyxTQUFTLENBQUMsS0FBSyxFQUFFO0FBQzFCLEVBQUUsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDO0FBQzVDO0FBQ0EsTUFBTSxZQUFZLENBQUM7QUFDbkIsRUFBRSxXQUFXLENBQUMsS0FBSyxFQUFFO0FBQ3JCLElBQUksSUFBSSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUN0RixJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSztBQUN0QixJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTTtBQUN4QixFQUFFO0FBQ0YsRUFBRSxPQUFPLENBQUMsS0FBSyxFQUFFO0FBQ2pCLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxLQUFLO0FBQ3hCLEVBQUU7QUFDRixFQUFFLFFBQVEsR0FBRztBQUNiLElBQUksTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUNsRCxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQztBQUNwQixJQUFJLE9BQU8sS0FBSztBQUNoQixFQUFFO0FBQ0YsRUFBRSxhQUFhLEdBQUc7QUFDbEIsSUFBSSxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQzFCLElBQUksSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUN6QixJQUFJLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUU7QUFDOUIsSUFBSSxPQUFPLElBQUksR0FBRyxHQUFHLEVBQUU7QUFDdkIsTUFBTSxJQUFJLElBQUksR0FBRztBQUNqQixNQUFNLE1BQU0sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSztBQUNyQyxNQUFNLEtBQUssSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ3hCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUU7QUFDNUIsSUFBSTtBQUNKLElBQUksTUFBTSxHQUFHLE1BQU0sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDO0FBQzdDLElBQUksT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ3pCLEVBQUU7QUFDRjs7QUFFQSxTQUFTLGlCQUFpQixHQUFHO0FBQzdCLEVBQUUsSUFBSSxLQUFLLEdBQUcsV0FBVztBQUN6QixFQUFFLFNBQVMsV0FBVyxDQUFDLE1BQU0sRUFBRTtBQUMvQixJQUFJLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQ3JDLElBQUksSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLENBQUMsRUFBRTtBQUM5QixNQUFNLE1BQU0sNEJBQTRCO0FBQ3hDLElBQUk7QUFDSixJQUFJLEtBQUssR0FBRyxVQUFVO0FBQ3RCLElBQUksT0FBTztBQUNYLE1BQU0sSUFBSSxFQUFFLEdBQUc7QUFDZixNQUFNLElBQUksRUFBRTtBQUNaLFFBQVEsSUFBSSxFQUFFO0FBQ2QsVUFBVSxJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQUs7QUFDNUIsVUFBVSxJQUFJLEVBQUUsTUFBTSxDQUFDO0FBQ3ZCO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsRUFBRTtBQUNGLEVBQUUsU0FBUyxVQUFVLENBQUMsTUFBTSxFQUFFO0FBQzlCLElBQUksTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDcEMsSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7QUFDMUIsTUFBTSxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzlDLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUU7QUFDN0IsUUFBUSxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7QUFDaEMsUUFBUSxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFO0FBQy9CLE9BQU8sQ0FBQztBQUNSLElBQUksQ0FBQyxNQUFNO0FBQ1gsTUFBTSxPQUFPLEtBQUs7QUFDbEIsSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLE9BQU8sVUFBVSxNQUFNLEVBQUU7QUFDM0IsSUFBSSxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDeEIsRUFBRSxDQUFDO0FBQ0g7O0FBRUEsU0FBUyxpQkFBaUIsR0FBRztBQUM3QixFQUFFLElBQUksS0FBSyxHQUFHLFdBQVc7QUFDekIsRUFBRSxJQUFJLFdBQVcsR0FBRyxDQUFDO0FBQ3JCLEVBQUUsU0FBUyxXQUFXLENBQUMsTUFBTSxFQUFFO0FBQy9CLElBQUksTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDckMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFO0FBQzlCLE1BQU0sTUFBTSw0QkFBNEI7QUFDeEMsSUFBSTtBQUNKLElBQUksS0FBSyxHQUFHLFVBQVU7QUFDdEIsSUFBSSxNQUFNLElBQUksR0FBRztBQUNqQixNQUFNLElBQUksRUFBRTtBQUNaLFFBQVEsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSTtBQUM5QixRQUFRLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQzFCO0FBQ0EsS0FBSztBQUNMLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtBQUMzQixNQUFNLElBQUksQ0FBQyxLQUFLLEdBQUc7QUFDbkIsUUFBUSxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUN4QyxRQUFRLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ3hDLFFBQVEsT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRztBQUNwRCxPQUFPO0FBQ1AsSUFBSTtBQUNKLElBQUksT0FBTztBQUNYLE1BQU0sSUFBSSxFQUFFLEdBQUc7QUFDZixNQUFNO0FBQ04sS0FBSztBQUNMLEVBQUU7QUFDRixFQUFFLFNBQVMsVUFBVSxDQUFDLE1BQU0sRUFBRTtBQUM5QixJQUFJLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQ3BDLElBQUksTUFBTSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsS0FBSztBQUM3QyxJQUFJLFdBQVcsSUFBSSxRQUFRO0FBQzNCLElBQUksSUFBSSxTQUFTLEtBQUssR0FBRyxFQUFFO0FBQzNCLE1BQU0sTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUMxQyxNQUFNLE9BQU8sQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO0FBQ2hDLFFBQVEsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO0FBQ2hDLFFBQVEsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRTtBQUMvQixPQUFPLENBQUM7QUFDUixJQUFJLENBQUMsTUFBTTtBQUNYLE1BQU0sT0FBTyxDQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDO0FBQzNDLElBQUk7QUFDSixFQUFFO0FBQ0YsRUFBRSxPQUFPLFVBQVUsTUFBTSxFQUFFO0FBQzNCLElBQUksT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQ3hCLEVBQUUsQ0FBQztBQUNIOztBQUVBLFNBQVMsVUFBVSxHQUFHO0FBQ3RCLEVBQUUsTUFBTSxhQUFhLEdBQUcsSUFBSSxXQUFXLEVBQUU7QUFDekMsRUFBRSxJQUFJLEtBQUssR0FBRyxTQUFTO0FBQ3ZCLEVBQUUsU0FBUyxTQUFTLENBQUMsTUFBTSxFQUFFO0FBQzdCLElBQUksTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDOUMsTUFBTSxNQUFNLEVBQUU7QUFDZCxLQUFLLENBQUM7QUFDTixJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksMEJBQTBCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0FBQ2hHLElBQUksS0FBSyxHQUFHLFdBQVc7QUFDdkIsSUFBSSxPQUFPO0FBQ1gsTUFBTSxJQUFJLEVBQUUsR0FBRztBQUNmLE1BQU0sSUFBSSxFQUFFO0FBQ1osUUFBUSxJQUFJLEVBQUU7QUFDZCxVQUFVLElBQUk7QUFDZCxVQUFVO0FBQ1YsU0FBUztBQUNULFFBQVEsSUFBSSxFQUFFO0FBQ2Q7QUFDQSxLQUFLO0FBQ0wsRUFBRTtBQUNGLEVBQUUsU0FBUyxXQUFXLENBQUMsTUFBTSxFQUFFO0FBQy9CLElBQUksT0FBTyxhQUFhLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUN4QyxNQUFNLE1BQU0sRUFBRTtBQUNkLEtBQUssQ0FBQztBQUNOLEVBQUU7QUFDRixFQUFFLE9BQU8sVUFBVSxNQUFNLEVBQUU7QUFDM0IsSUFBSSxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDeEIsRUFBRSxDQUFDO0FBQ0g7QUFDQSxTQUFTLGlCQUFpQixDQUFDLElBQUksRUFBRTtBQUNqQyxFQUFFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsc0JBQXNCLENBQUM7QUFDbEQsRUFBRSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7QUFDdEIsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzNELEVBQUU7QUFDRjtBQUNBLFNBQVMsMEJBQTBCLENBQUMsSUFBSSxFQUFFO0FBQzFDLEVBQUUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQztBQUMzRSxFQUFFLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtBQUN0QixJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDM0QsRUFBRTtBQUNGOztBQUVBLE1BQU0sb0JBQW9CLEdBQUcsR0FBRztBQUNoQyxNQUFNLG1CQUFtQixHQUFHLEtBQUs7QUFDakMsU0FBUyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUU7QUFDbkMsRUFBRSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxFQUFFLG1CQUFtQixDQUFDO0FBQ3pGLEVBQUUsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSTtBQUM3QjtBQUNBLFNBQVMsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDaEMsRUFBRSxJQUFJO0FBQ04sSUFBSSxHQUFHO0FBQ1AsSUFBSSxVQUFVO0FBQ2QsSUFBSSxjQUFjLEdBQUcsZ0JBQWdCO0FBQ3JDLElBQUk7QUFDSixHQUFHLEdBQUcsSUFBSTtBQUNWLEVBQUUsSUFBSTtBQUNOLElBQUksSUFBSTtBQUNSLElBQUksS0FBSztBQUNULElBQUksTUFBTTtBQUNWLElBQUksT0FBTztBQUNYLElBQUksUUFBUTtBQUNaLElBQUksUUFBUTtBQUNaLElBQUk7QUFDSixHQUFHLEdBQUcsS0FBSztBQUNYLEVBQUUsTUFBTSxHQUFHLElBQUksY0FBYyxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUM7QUFDcEQsRUFBRSxJQUFJLE1BQU07QUFDWixFQUFFLElBQUksR0FBRztBQUNULEVBQUUsSUFBSSxLQUFLLEdBQUcsSUFBSSxTQUFTLEVBQUU7QUFDN0IsRUFBRSxJQUFJLGdCQUFnQixHQUFHLENBQUM7QUFDMUIsRUFBRSxJQUFJLDJCQUEyQjtBQUNqQyxFQUFFLElBQUksSUFBSSxHQUFHLEtBQUs7QUFDbEIsRUFBRSxJQUFJLFNBQVMsR0FBRyxLQUFLO0FBQ3ZCLEVBQUUsSUFBSSxXQUFXO0FBQ2pCLEVBQUUsU0FBUyxPQUFPLEdBQUc7QUFDckIsSUFBSSxNQUFNLEdBQUcsSUFBSSxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkYsSUFBSSxNQUFNLENBQUMsVUFBVSxHQUFHLGFBQWE7QUFDckMsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU07QUFDMUIsTUFBTSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxJQUFJLEtBQUs7QUFDNUMsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUMzQixNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDekQsTUFBTSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7QUFDL0IsUUFBUSxNQUFNLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDekQsTUFBTSxDQUFDLE1BQU0sSUFBSSxLQUFLLEtBQUssY0FBYyxFQUFFO0FBQzNDLFFBQVEsTUFBTSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUN6RCxNQUFNLENBQUMsTUFBTSxJQUFJLEtBQUssS0FBSyxjQUFjLEVBQUU7QUFDM0MsUUFBUSxNQUFNLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0FBQ3pELE1BQU0sQ0FBQyxNQUFNLElBQUksS0FBSyxLQUFLLEtBQUssRUFBRTtBQUNsQyxRQUFRLE1BQU0sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2xELE1BQU07QUFDTixNQUFNLDJCQUEyQixHQUFHLFVBQVUsQ0FBQyxNQUFNO0FBQ3JELFFBQVEsZ0JBQWdCLEdBQUcsQ0FBQztBQUM1QixNQUFNLENBQUMsRUFBRSxJQUFJLENBQUM7QUFDZCxJQUFJLENBQUM7QUFDTCxJQUFJLE1BQU0sQ0FBQyxPQUFPLEdBQUcsS0FBSyxJQUFJO0FBQzlCLE1BQU0sWUFBWSxDQUFDLFdBQVcsQ0FBQztBQUMvQixNQUFNLFVBQVUsRUFBRTtBQUNsQixNQUFNLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQzlELFFBQVEsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDN0IsUUFBUSxRQUFRLENBQUMsT0FBTyxFQUFFO0FBQzFCLFVBQVUsT0FBTyxFQUFFO0FBQ25CLFNBQVMsQ0FBQztBQUNWLE1BQU0sQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDdEMsUUFBUSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ3JELFFBQVEsUUFBUSxDQUFDLE9BQU8sRUFBRTtBQUMxQixVQUFVLE9BQU8sRUFBRTtBQUNuQixTQUFTLENBQUM7QUFDVixNQUFNLENBQUMsTUFBTTtBQUNiLFFBQVEsWUFBWSxDQUFDLDJCQUEyQixDQUFDO0FBQ2pELFFBQVEsTUFBTSxLQUFLLEdBQUcsY0FBYyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDeEQsUUFBUSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsK0JBQStCLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2pFLFFBQVEsUUFBUSxDQUFDLFNBQVMsQ0FBQztBQUMzQixRQUFRLFVBQVUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDO0FBQ2xDLE1BQU07QUFDTixJQUFJLENBQUM7QUFDTCxJQUFJLFNBQVMsR0FBRyxLQUFLO0FBQ3JCLEVBQUU7QUFDRixFQUFFLFNBQVMsU0FBUyxDQUFDLE9BQU8sRUFBRTtBQUM5QixJQUFJLFdBQVcsR0FBRyxVQUFVLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQztBQUMvQyxJQUFJLE9BQU8sVUFBVSxLQUFLLEVBQUU7QUFDNUIsTUFBTSxJQUFJO0FBQ1YsUUFBUSxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztBQUMxQyxRQUFRLElBQUksR0FBRyxFQUFFO0FBQ2pCLFVBQVUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3JDLFlBQVksR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDakMsVUFBVSxDQUFDLE1BQU0sSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7QUFDakQsWUFBWSxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUNoQyxVQUFVLENBQUMsTUFBTSxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDM0U7QUFDQSxZQUFZLGFBQWEsQ0FBQyxNQUFNLENBQUM7QUFDakMsVUFBVSxDQUFDLE1BQU0sSUFBSSxNQUFNLEtBQUssS0FBSyxFQUFFO0FBQ3ZDO0FBQ0EsWUFBWSxXQUFXLEVBQUU7QUFDekIsVUFBVSxDQUFDLE1BQU0sSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO0FBQzNDLFlBQVksTUFBTSxDQUFDLHdDQUF3QyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3JFLFVBQVU7QUFDVixRQUFRLENBQUMsTUFBTTtBQUNmLFVBQVUsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3BFLFlBQVksYUFBYSxDQUFDLE1BQU0sQ0FBQztBQUNqQyxZQUFZLFlBQVksQ0FBQyxXQUFXLENBQUM7QUFDckMsVUFBVSxDQUFDLE1BQU0sSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO0FBQzNDLFlBQVksWUFBWSxDQUFDLFdBQVcsQ0FBQztBQUNyQyxZQUFZLFdBQVcsR0FBRyxVQUFVLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQztBQUN2RCxVQUFVLENBQUMsTUFBTTtBQUNqQixZQUFZLFlBQVksQ0FBQyxXQUFXLENBQUM7QUFDckMsWUFBWSxNQUFNLENBQUMsd0NBQXdDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDckUsVUFBVTtBQUNWLFFBQVE7QUFDUixNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNsQixRQUFRLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDdEIsUUFBUSxNQUFNLENBQUM7QUFDZixNQUFNO0FBQ04sSUFBSSxDQUFDO0FBQ0wsRUFBRTtBQUNGLEVBQUUsU0FBUyxhQUFhLENBQUMsS0FBSyxFQUFFO0FBQ2hDLElBQUksSUFBSTtBQUNSLE1BQU0sSUFBSTtBQUNWLE1BQU07QUFDTixLQUFLLEdBQUcsS0FBSztBQUNiLElBQUksTUFBTTtBQUNWLE1BQU0sSUFBSTtBQUNWLE1BQU0sSUFBSTtBQUNWLE1BQU07QUFDTixLQUFLLEdBQUcsSUFBSTtBQUNaLElBQUksTUFBTTtBQUNWLE1BQU0sSUFBSTtBQUNWLE1BQU07QUFDTixLQUFLLEdBQUcsSUFBSTtBQUNaLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFELElBQUksUUFBUSxDQUFDLFNBQVMsQ0FBQztBQUN2QixJQUFJLFVBQVUsRUFBRTtBQUNoQixJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sQ0FBQztBQUNuSCxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUM7QUFDbEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUU7QUFDdkIsSUFBSSxTQUFTLEdBQUcsSUFBSTtBQUNwQixJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO0FBQ2xDLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDekIsSUFBSTtBQUNKLEVBQUU7QUFDRixFQUFFLFNBQVMsV0FBVyxHQUFHO0FBQ3pCLElBQUksVUFBVSxFQUFFO0FBQ2hCLElBQUksSUFBSSxTQUFTLEVBQUU7QUFDbkIsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztBQUNqQyxNQUFNLFFBQVEsQ0FBQyxTQUFTLEVBQUU7QUFDMUIsUUFBUSxPQUFPLEVBQUU7QUFDakIsT0FBTyxDQUFDO0FBQ1IsSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7QUFDbkMsTUFBTSxRQUFRLENBQUMsU0FBUyxFQUFFO0FBQzFCLFFBQVEsT0FBTyxFQUFFO0FBQ2pCLE9BQU8sQ0FBQztBQUNSLElBQUk7QUFDSixJQUFJLEtBQUssR0FBRyxJQUFJLFNBQVMsRUFBRTtBQUMzQixFQUFFO0FBQ0YsRUFBRSxTQUFTLFVBQVUsR0FBRztBQUN4QixJQUFJLElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUU7QUFDdkIsSUFBSSxHQUFHLEdBQUcsSUFBSTtBQUNkLEVBQUU7QUFDRixFQUFFLE9BQU87QUFDVCxJQUFJLElBQUksRUFBRSxNQUFNO0FBQ2hCLE1BQU0sT0FBTyxFQUFFO0FBQ2YsSUFBSSxDQUFDO0FBQ0wsSUFBSSxJQUFJLEVBQUUsTUFBTTtBQUNoQixNQUFNLElBQUksR0FBRyxJQUFJO0FBQ2pCLE1BQU0sVUFBVSxFQUFFO0FBQ2xCLE1BQU0sSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDOUMsSUFBSSxDQUFDO0FBQ0wsSUFBSSxjQUFjLEVBQUUsTUFBTSxLQUFLLENBQUMsT0FBTztBQUN2QyxHQUFHO0FBQ0g7O0FBRUEsU0FBUyxXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNsQyxFQUFFLElBQUk7QUFDTixJQUFJLEdBQUc7QUFDUCxJQUFJLFVBQVU7QUFDZCxJQUFJO0FBQ0osR0FBRyxHQUFHLElBQUk7QUFDVixFQUFFLElBQUk7QUFDTixJQUFJLElBQUk7QUFDUixJQUFJLEtBQUs7QUFDVCxJQUFJLE1BQU07QUFDVixJQUFJLE9BQU87QUFDWCxJQUFJLFFBQVE7QUFDWixJQUFJLFFBQVE7QUFDWixJQUFJO0FBQ0osR0FBRyxHQUFHLEtBQUs7QUFDWCxFQUFFLE1BQU0sR0FBRyxJQUFJLGNBQWMsQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDO0FBQ3RELEVBQUUsSUFBSSxFQUFFO0FBQ1IsRUFBRSxJQUFJLEdBQUc7QUFDVCxFQUFFLElBQUksS0FBSyxHQUFHLElBQUksU0FBUyxFQUFFO0FBQzdCLEVBQUUsU0FBUyxVQUFVLENBQUMsY0FBYyxFQUFFO0FBQ3RDLElBQUksSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUU7QUFDckMsSUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUM7QUFDN0gsRUFBRTtBQUNGLEVBQUUsT0FBTztBQUNULElBQUksSUFBSSxFQUFFLE1BQU07QUFDaEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDO0FBQy9CLE1BQU0sRUFBRSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxNQUFNO0FBQ3hDLFFBQVEsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDN0IsUUFBUSxVQUFVLEVBQUU7QUFDcEIsTUFBTSxDQUFDLENBQUM7QUFDUixNQUFNLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJO0FBQ3hDLFFBQVEsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDOUIsUUFBUSxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQ3JCLFVBQVU7QUFDVixTQUFTLENBQUM7QUFDVixRQUFRLFFBQVEsQ0FBQyxTQUFTLENBQUM7QUFDM0IsTUFBTSxDQUFDLENBQUM7QUFDUixNQUFNLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxJQUFJO0FBQzlDLFFBQVEsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQ3hDLFFBQVEsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQzlCLFVBQVUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRTtBQUNsRSxVQUFVLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLEtBQUs7QUFDeEMsVUFBVSxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxNQUFNO0FBQ3pDLFVBQVUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRCxVQUFVLFFBQVEsQ0FBQyxTQUFTLENBQUM7QUFDN0IsVUFBVSxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUM1QixVQUFVLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDO0FBQ2hELFVBQVUsS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFO0FBQzdCLFVBQVUsSUFBSSxPQUFPLENBQUMsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO0FBQzFDLFlBQVksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ2pDLFVBQVU7QUFDVixRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO0FBQzFDLFVBQVUsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztBQUN2QyxVQUFVLFFBQVEsQ0FBQyxTQUFTLEVBQUU7QUFDOUIsWUFBWSxPQUFPLEVBQUU7QUFDckIsV0FBVyxDQUFDO0FBQ1osVUFBVSxLQUFLLEdBQUcsSUFBSSxTQUFTLEVBQUU7QUFDakMsUUFBUTtBQUNSLE1BQU0sQ0FBQyxDQUFDO0FBQ1IsTUFBTSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE1BQU07QUFDeEMsUUFBUSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUM3QixRQUFRLEVBQUUsQ0FBQyxLQUFLLEVBQUU7QUFDbEIsUUFBUSxRQUFRLENBQUMsT0FBTyxFQUFFO0FBQzFCLFVBQVUsT0FBTyxFQUFFO0FBQ25CLFNBQVMsQ0FBQztBQUNWLE1BQU0sQ0FBQyxDQUFDO0FBQ1IsSUFBSSxDQUFDO0FBQ0wsSUFBSSxJQUFJLEVBQUUsTUFBTTtBQUNoQixNQUFNLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFO0FBQ3ZDLE1BQU0sSUFBSSxFQUFFLEtBQUssU0FBUyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUU7QUFDdEMsSUFBSSxDQUFDO0FBQ0wsSUFBSSxjQUFjLEVBQUUsTUFBTSxLQUFLLENBQUMsT0FBTztBQUN2QyxHQUFHO0FBQ0g7O0FBRUEsZUFBZSxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRTtBQUN4QyxFQUFFLElBQUk7QUFDTixJQUFJO0FBQ0osR0FBRyxHQUFHLElBQUk7QUFDVixFQUFFLE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQztBQUMvQyxFQUFFLElBQUksSUFBSTtBQUNWLEVBQUUsSUFBSSxJQUFJO0FBQ1YsRUFBRSxJQUFJLE1BQU0sR0FBRyxDQUFDLE1BQU0sU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ25ILEVBQUUsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUM1QixJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0QsRUFBRTtBQUNGLEVBQUUsTUFBTSxNQUFNLEdBQUcsTUFBTSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFO0FBQ2pELEVBQUUsTUFBTSxLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDO0FBQ3RDLEVBQUUsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDOUQsRUFBRSxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ2xFLEVBQUUsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQywrQkFBK0IsQ0FBQztBQUNqRSxFQUFFLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtBQUMxQixJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUNyQyxJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUNyQyxFQUFFO0FBQ0YsRUFBRSxNQUFNLE1BQU0sR0FBRztBQUNqQixJQUFJLEtBQUs7QUFDVCxJQUFJLE1BQU0sRUFBRTtBQUNaLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxHQUFHLE1BQU07QUFDcEIsRUFBRSxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUU7QUFDbEMsSUFBSSxNQUFNLE1BQU0sR0FBRyxNQUFNLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUU7QUFDbkQsSUFBSSxNQUFNLEtBQUssR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUM7QUFDeEMsSUFBSSxLQUFLLEdBQUc7QUFDWixNQUFNLEtBQUs7QUFDWCxNQUFNLE1BQU0sRUFBRTtBQUNkLEtBQUs7QUFDTCxFQUFFO0FBQ0YsRUFBRSxNQUFNLE1BQU0sR0FBRyxFQUFFO0FBQ25CLEVBQUUsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUNkLEVBQUUsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUU7QUFDOUIsSUFBSSxJQUFJLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQyxJQUFJLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUMxQixNQUFNLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO0FBQzFDLE1BQU0sTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztBQUMvRSxNQUFNLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQzVDLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDcEMsTUFBTSxNQUFNLENBQUMsTUFBTSxJQUFJLEtBQUs7QUFDNUIsSUFBSSxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQ2pDLE1BQU0sTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDMUMsTUFBTSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0FBQzVFLE1BQU0sTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDNUMsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNwQyxNQUFNLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSztBQUMzQixJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLFVBQVUsRUFBRTtBQUM1RCxNQUFNLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUNsRCxNQUFNLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUNsRCxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRCxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsRUFBRTtBQUMzRCxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUNuQyxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN6RCxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUNuQyxJQUFJO0FBQ0osRUFBRTtBQUNGLEVBQUUsSUFBSSxH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QVMsQ0FBQyxRQUFRLEVBQUU7QUFDdEIsSUFBSSxJQUFJLElBQUksR0FBRyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFO0FBQ3JGLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRSxPQUFPLElBQUksQ0FBQyxLQUFLO0FBQ3RELElBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRO0FBQzdCLElBQUksSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO0FBQ2hDLE1BQU0sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUM7QUFDekMsSUFBSSxDQUFDLE1BQU0sSUFBSSxRQUFRLEtBQUssTUFBTSxFQUFFO0FBQ3BDLE1BQU0sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDakMsSUFBSSxDQUFDLE1BQU0sSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO0FBQ3ZDLE1BQU0sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUM7QUFDekMsSUFBSSxDQUFDLE1BQU0sSUFBSSxRQUFRLEtBQUssT0FBTyxFQUFFO0FBQ3JDLE1BQU0sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUM7QUFDdkMsSUFBSSxDQUFDLE1BQU0sSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO0FBQ3ZDLE1BQU0sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUM7QUFDekMsSUFBSSxDQUFDLE1BQU0sSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO0FBQ3ZDLE1BQU0sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUM7QUFDekMsSUFBSSxDQUFDLE1BQU07QUFDWCxNQUFNLE1BQU0sQ0FBQyxlQUFlLEVBQUUsUUFBUSxD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R0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sSUFBSTtBQUN0RCxFQUFFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMzQixJQUFJLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDbkQsU0FBUyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztBQUN0QixJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDakQsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNqQixNQUFNLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVM7QUFDakUsSUFBSTtBQUNKLEVBQUUsQ0FBQyxNQUFNO0FBQ1QsSUFBSSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQztBQUM3RCxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO0FBQ3RCLElBQUksTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDbEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQztBQUNuRCxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDakQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztB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LEVBQUUsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7QUFDcEMsSUFBSSxJQUFJO0FBQ1IsRUFBRSxLQUFLLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDO0FBQ2xFLEVBQUUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssR0FBRyxFQUFFO0FBQ3BELElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLEVBQUU7QUFDMUUsSUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDbEUsRUFBRTtBQUNGLEVBQUUsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLEVBQUU7QUFDbkM7QUFDQSxTQUFTLGNBQWMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFO0FBQ3RDLEVBQUUsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDakMsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzNDLElBQUksTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN2QixJQUFJLFdBQVcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN2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
