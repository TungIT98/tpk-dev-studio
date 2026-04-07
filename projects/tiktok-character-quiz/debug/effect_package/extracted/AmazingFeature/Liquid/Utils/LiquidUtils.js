"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidUtils = exports.unEscapeString = exports.escapeString = void 0;
const zod_1 = __importStar(require("zod"));
const escapeMap = new Map([
    ['\\', '\\\\'],
    ['"', '\\"'],
    ['\n', '\\n'],
    ['\t', '\\t'],
    ['\r', '\\r'],
    ['\v', '\\v'],
    ["'", "\\'"],
]);
const unEscapeMap = new Map([
    ['\\\\', '\\'],
    ['\\"', '"'],
    ['\\n', '\n'],
    ['\\t', '\t'],
    ['\\r', '\r'],
    ['\\v', '\v'],
    ["\\'", "'"],
]);
const escapeRegExp = new RegExp('(' +
    Array.from(escapeMap.keys())
        .map(it => '\\' + it)
        .join('|') +
    ')', 'g');
const unEscapeRegExp = new RegExp('(' +
    Array.from(unEscapeMap.keys())
        .map(it => it.replace(/\\/g, '\\\\'))
        .join('|') +
    ')', 'g');
function escapeString(string) {
    if (typeof string !== 'string') {
        throw new TypeError('Expected a string');
    }
    return string.replace(escapeRegExp, (str) => {
        var _a;
        return (_a = escapeMap.get(str)) !== null && _a !== void 0 ? _a : str;
    });
}
exports.escapeString = escapeString;
function unEscapeString(string) {
    if (typeof string !== 'string') {
        throw new TypeError('Expected a string');
    }
    return string.replace(unEscapeRegExp, (str) => {
        var _a;
        return (_a = unEscapeMap.get(str)) !== null && _a !== void 0 ? _a : str;
    });
}
exports.unEscapeString = unEscapeString;
class LiquidUtils {
    static generateValidMetaData(metaData) {
        const newMetaData = JSON.parse(JSON.stringify(metaData));
        const vaildMetaData = (data) => {
            try {
                if (data === undefined || data === null) {
                    return;
                }
                Object.entries(data).forEach(([key, value]) => {
                    switch (typeof value) {
                        case 'object': {
                            vaildMetaData(value);
                            break;
                        }
                        case 'string': {
                            data[key] = escapeString(value);
                            break;
                        }
                        default:
                            vaildMetaData(value);
                            break;
                    }
                });
            }
            catch (e) {
                console.error(e);
            }
        };
        vaildMetaData(newMetaData);
        return newMetaData;
    }
    static validType(obj, type) {
        var _a;
        let value = obj;
        try {
            if (value === null) {
                return 'null';
            }
            if (value === undefined) {
                return 'undefined';
            }
            switch (type) {
                case 'string': {
                    const schema = zod_1.default.string();
                    schema.parse(value);
                    break;
                }
                case 'boolean': {
                    const schema = zod_1.default.boolean();
                    schema.parse(value);
                    break;
                }
                case 'number': {
                    const schema = zod_1.default.number();
                    const transNum = Number(value);
                    schema.parse(transNum);
                    break;
                }
                case 'number array': {
                    const array = JSON.parse(value);
                    const schema = zod_1.default.array(zod_1.default.number());
                    schema.parse(array);
                    break;
                }
                case 'name': {
                    const schema = zod_1.default.string();
                    schema.parse(value);
                    const reg = new RegExp('^[a-zA-Z_][a-zA-Z0-9_]+$');
                    if (!reg.test(value)) {
                        throw Error(value + 'is not valid name!');
                    }
                    break;
                }
                default: {
                    throw Error('valid check error!');
                }
            }
        }
        catch (e) {
            if (e instanceof zod_1.ZodError) {
                throw Error((_a = e === null || e === void 0 ? void 0 : e.errors.map(err => err === null || err === void 0 ? void 0 : err.message).toString()) !== null && _a !== void 0 ? _a : e.message);
            }
            else {
                throw e;
            }
        }
        return value;
    }
}
exports.LiquidUtils = LiquidUtils;
