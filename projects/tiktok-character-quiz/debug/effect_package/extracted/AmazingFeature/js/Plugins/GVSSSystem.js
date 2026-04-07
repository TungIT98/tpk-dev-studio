"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var GVSSNetworkHandler_1, GVSSRequestHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.getUserInfo = exports.getEffectInfo = exports.EffectInfoRequest = exports.GVSSSystem = void 0;
const APJS = require('../amazingpro.js')
const GVSSDataStorage_1 = require("./GVSSDataStorage");
const { registerClass, systemScript } = APJS;
const GVSSDS = GVSSDataStorage_1.GVSSDataStorage.instance;
const Amaz = effect.Amaz;
const NETWORK_TIMEOUT = 5000;
let TimeoutError = class TimeoutError extends Error {
};
TimeoutError = __decorate([
    registerClass()
], TimeoutError);
var NetworkMethod;
(function (NetworkMethod) {
    NetworkMethod[NetworkMethod["GET"] = 0] = "GET";
    NetworkMethod[NetworkMethod["POST"] = 1] = "POST";
    NetworkMethod[NetworkMethod["PUT"] = 2] = "PUT";
    NetworkMethod[NetworkMethod["PATCH"] = 3] = "PATCH";
    NetworkMethod[NetworkMethod["DELETE"] = 4] = "DELETE";
})(NetworkMethod || (NetworkMethod = {}));
var NetworkStatus;
(function (NetworkStatus) {
    NetworkStatus[NetworkStatus["Default"] = 0] = "Default";
    NetworkStatus[NetworkStatus["Initialized"] = 1] = "Initialized";
    NetworkStatus[NetworkStatus["Waiting"] = 2] = "Waiting";
    NetworkStatus[NetworkStatus["Requesting"] = 3] = "Requesting";
    NetworkStatus[NetworkStatus["Completed"] = 4] = "Completed";
    NetworkStatus[NetworkStatus["Destroyed"] = 5] = "Destroyed";
})(NetworkStatus || (NetworkStatus = {}));
let curTaskId = 10000 + Math.floor(Math.random() * 1000);
function requireNewTaskId() {
    return curTaskId++;
}
function utf8ByteToUnicodeStr(utf8Bytes) {
    let unicodeStr = '';
    for (let pos = 0; pos < utf8Bytes.length;) {
        const flag = utf8Bytes[pos];
        let unicode = 0;
        if (flag >>> 7 === 0) {
            unicodeStr += String.fromCharCode(utf8Bytes[pos]);
            pos += 1;
        }
        else if ((flag & 0xfc) === 0xfc) {
            unicode = (utf8Bytes[pos] & 0x3) << 30;
            unicode |= (utf8Bytes[pos + 1] & 0x3f) << 24;
            unicode |= (utf8Bytes[pos + 2] & 0x3f) << 18;
            unicode |= (utf8Bytes[pos + 3] & 0x3f) << 12;
            unicode |= (utf8Bytes[pos + 4] & 0x3f) << 6;
            unicode |= utf8Bytes[pos + 5] & 0x3f;
            unicodeStr += String.fromCharCode(unicode);
            pos += 6;
        }
        else if ((flag & 0xf8) === 0xf8) {
            unicode = (utf8Bytes[pos] & 0x7) << 24;
            unicode |= (utf8Bytes[pos + 1] & 0x3f) << 18;
            unicode |= (utf8Bytes[pos + 2] & 0x3f) << 12;
            unicode |= (utf8Bytes[pos + 3] & 0x3f) << 6;
            unicode |= utf8Bytes[pos + 4] & 0x3f;
            unicodeStr += String.fromCharCode(unicode);
            pos += 5;
        }
        else if ((flag & 0xf0) === 0xf0) {
            unicode = (utf8Bytes[pos] & 0xf) << 18;
            unicode |= (utf8Bytes[pos + 1] & 0x3f) << 12;
            unicode |= (utf8Bytes[pos + 2] & 0x3f) << 6;
            unicode |= utf8Bytes[pos + 3] & 0x3f;
            unicodeStr += String.fromCharCode(unicode);
            pos += 4;
        }
        else if ((flag & 0xe0) === 0xe0) {
            unicode = (utf8Bytes[pos] & 0x1f) << 12;
            unicode |= (utf8Bytes[pos + 1] & 0x3f) << 6;
            unicode |= utf8Bytes[pos + 2] & 0x3f;
            unicodeStr += String.fromCharCode(unicode);
            pos += 3;
        }
        else if ((flag & 0xc0) === 0xc0) {
            unicode = (utf8Bytes[pos] & 0x3f) << 6;
            unicode |= utf8Bytes[pos + 1] & 0x3f;
            unicodeStr += String.fromCharCode(unicode);
            pos += 2;
        }
        else {
            unicodeStr += String.fromCharCode(utf8Bytes[pos]);
            pos += 1;
        }
    }
    return unicodeStr;
}
/** Converts ArrayBuffer to string using UTF-8 decoder above. */
function ab2str(buf) {
    const array = new Uint8Array(buf);
    return utf8ByteToUnicodeStr(array);
}
function isOnMobile() {
    return Amaz.Platform.name() !== 'Mac' && Amaz.Platform.name() !== 'Windows' && Amaz.Platform.name() !== 'Linux';
}
let GVSSSystem = class GVSSSystem {
    constructor() {
        this.jsScript = new effect.Amaz.JSScript();
        this.updateOrder = 20;
        this._gvssEditorFolderPath = '';
        this._gvssEditorJsonFileName = 'GVSSData.json';
        this._initialized = false;
        this._userData_RequestStatus = NetworkStatus.Default;
        this.effectId = '3310274189';
        /////////////////////////////////////
        // Editor Local Functions End
        /////////////////////////////////////
    }
    /////////////////////////////////////
    // System Script Functions Beginning
    /////////////////////////////////////
    onInit() { }
    onStart() {
        this.gvssSystemInitialize();
    }
    /** One-time setup of network handler, listeners, and platform flow. */
    gvssSystemInitialize() {
        if (this._initialized) {
            return;
        }
        this._initialized = true;
        GVSSNetworkHandler.instance.initialize();
        GVSSNetworkHandler.instance.addListener(this.jsScript, this);
        // Dynamically add gvssNetworkCallBack function to jsScript object
        const apjsSystemScript = this.jsScript;
        if (apjsSystemScript.ref) {
            apjsSystemScript.ref['gvssNetworkCallBack'] = this.gvssNetworkCallBack.bind(this);
        }
        GVSSDS.isMobile = isOnMobile();
        if (GVSSDS.isMobile) {
            this.mobileOnInit();
        }
        else {
            this.editorOnInit();
        }
    }
    /** NetworkCenter callback handler; routes events and resolves pending requests. */
    gvssNetworkCallBack(userData, networkResponse, eventType) {
        const Amaz = effect.Amaz;
        if (eventType === Amaz.NetworkStatus.NETWORK_SUCCESS) {
            console.log('networkCallback response success, status code: ' + networkResponse.statusCode);
            console.log('network response body: ' + networkResponse.body);
            if (networkResponse.requestId) {
                const requestHandled = GVSSNetworkHandler.instance.handleResponse(networkResponse.requestId, networkResponse, eventType);
                if (requestHandled === false) {
                    console.error(`networkCallBack issue ${networkResponse.requestId}  ${userData}`);
                }
            }
        }
        else if (eventType === Amaz.NetworkStatus.NETWORK_FAIL) {
            console.error('network response error: ' + networkResponse.errorDesc);
            GVSSDS.setNetworkFailure(true);
        }
        else if (eventType === Amaz.NetworkStatus.NETWORK_CANCEL) {
            console.error('networkCallback response cancel' + networkResponse.body);
            GVSSDS.setNetworkFailure(true);
        }
        else if (eventType === Amaz.NetworkStatus.NETWORK_START) {
            console.log('networkCallback response NETWORK_START' + networkResponse.body);
        }
        else if (eventType === Amaz.NetworkStatus.NETWORK_UPDATE) {
            console.log('networkCallback response NETWORK_UPDATE' + networkResponse.body);
        }
        else {
            console.log('networkCallback response else ' + networkResponse.body);
            console.log('networkCallback response else event ' + eventType);
        }
    }
    onUpdate(deltaTime) {
        if (GVSSDS.getGVSSDataDirty()) {
            GVSSDS.setGVSSDataDirty(false);
            if (GVSSDS.isMobile) {
                this.sendDataToClient();
            }
            else {
                this.saveGraphDataToDisk();
            }
        }
    }
    onLateUpdate(deltaTime) {
        GVSSNetworkHandler.instance.update();
    }
    onEvent(event) {
        this.requestHandlerEvent(event);
    }
    requestHandlerEvent(event) {
        const msgID = event.args.get(0);
        const arg1 = event.args.get(1);
        const Amaz = effect.Amaz;
        if (msgID === 0x29 || (msgID === 34952 && arg1 === 0x29)) {
            const taskId = event.args.get(2);
            const key = event.args.get(3);
            const info = Amaz.AmazingManager.getSingleton('BuiltinObject').getUserStringValue(key);
            const obj = JSON.parse(info);
            const requestHandled = GVSSRequestHandler.instance.handleResponse(taskId, obj);
            if (!requestHandled) {
                console.error(`onEvent issue ${taskId} `);
            }
            else {
                console.log(`request ${taskId} handled`);
            }
        }
    }
    onComponentAdded(comp) { }
    onComponentRemoved(comp) { }
    onDestroy() {
        GVSSNetworkHandler.instance.removeListener(this);
        const apjsSystemScript = this.jsScript;
        if (apjsSystemScript.ref) {
            apjsSystemScript.ref['gvssNetworkCallBack'] = undefined;
        }
    }
    /////////////////////////////////////
    // System Script Functions End
    /////////////////////////////////////
    /////////////////////////////////////
    // Mobile Network Functions Beginning
    /////////////////////////////////////
    mobileOnInit() {
        if (this.scene) {
            this.getClientData(this.scene);
        }
    }
    getClientData(scene) {
        var _a;
        const effectSettings = (_a = this.scene) === null || _a === void 0 ? void 0 : _a.getSettings();
        const isQRPreview = effectSettings === null || effectSettings === void 0 ? void 0 : effectSettings.get('is_qr_preview');
        if (isQRPreview) {
            GVSSDS.isMobile = false;
            this.editorOnInit();
            return;
        }
        const basicInfoPromises = [(0, exports.getEffectInfo)(scene)];
        this._userData_RequestStatus = NetworkStatus.Requesting;
        Promise.all(basicInfoPromises)
            .then(([effectInfo]) => {
            const effectInfo_Data = effectInfo;
            this.effectId = effectInfo_Data.effect_id;
            const effect_id_isValid = /^\d+$/.test(this.effectId) && this.effectId !== '123456';
            if (!effect_id_isValid) {
                //QR Code Preview
                GVSSDS.isMobile = false;
                this.editorOnInit();
                return;
            }
            this._userData_RequestStatus = NetworkStatus.Completed;
            this.postGetStats();
            //Request data storage
        })
            .catch(err => {
            console.warn(`Failed to receive data from server, reason: ${err.message}`);
            GVSSDS.setNetworkFailure(true);
        });
    }
    sendDataToClient() {
        var _a;
        const arg = {
            interface: 'params_pass_through',
            action: {
                GVSS: 3,
            },
            params: {
                GVSSData: JSON.stringify(GVSSDS.getGVSSDataWithoutPublishData()),
            },
        };
        (_a = this.scene) === null || _a === void 0 ? void 0 : _a.postMessage(0x00006001, 0x00006001, 0, JSON.stringify(arg));
    }
    postGetStats() {
        try {
            const url = 'https://api.tiktokv.com/tiktok/v2/effect/api/ttapp/effect/streak/stats?effect_id=' + this.effectId;
            const urlRequest = new GVSSUrlRequest(url);
            GVSSNetworkHandler.instance.sendRequest(urlRequest).then((response) => {
                try {
                    GVSSDS.setGVSSDataFromNetworkMessage(response.body);
                }
                catch (e) {
                    console.error('Failed to parse GVSS network response:', e);
                }
            }, (error) => {
                console.error(error.message);
                GVSSDS.setNetworkFailure(true);
            });
        }
        catch (e) {
            console.error(`set GVSSData failed: ${e}`);
        }
    }
    /////////////////////////////////////
    // Mobile Network Functions End
    /////////////////////////////////////
    /////////////////////////////////////
    // Editor Local Functions Beginning
    /////////////////////////////////////
    editorOnInit() {
        if (this.scene && this.scene.assetMgr) {
            this._gvssEditorFolderPath = `${this.scene.assetMgr.rootDir}`;
            this.loadGraphDataFromDisk();
        }
    }
    loadGraphDataFromDisk() {
        // read json from disk
        const jsonPath = this._gvssEditorFolderPath + this._gvssEditorJsonFileName;
        try {
            if (fs.accessSync(jsonPath, 0)) {
                this.readJSONFile(jsonPath);
            }
            else {
                console.error(`json file doesn't exist: ${jsonPath}`);
                GVSSDS.setFakeInitialPublishData();
                return;
            }
        }
        catch (e) {
            console.error(`access json file failed: ${e}`);
            GVSSDS.setFakeInitialPublishData();
            return;
        }
    }
    readJSONFile(jsonPath) {
        try {
            const fileBuffer = fs.readFileSync(jsonPath);
            if (fileBuffer) {
                const jsonStr = ab2str(fileBuffer);
                console.error(`read json file content: ${jsonStr}`);
                if (jsonStr) {
                    this.parseGraphDataJson(jsonStr);
                }
            }
        }
        catch (e) {
            console.error(`read json file failed: ${e}`);
            GVSSDS.setFakeInitialPublishData();
            return;
        }
    }
    parseGraphDataJson(jsonStr) {
        try {
            const gvssGraphData = JSON.parse(jsonStr);
            GVSSDS.setGVSSData(gvssGraphData);
            GVSSDS.setGVSSDataLoaded(true);
        }
        catch (e) {
            console.error(`parse json file failed: ${e}`);
            GVSSDS.setFakeInitialPublishData();
            return;
        }
    }
    saveGraphDataToDisk() {
        const gvssGraphData = GVSSDS.getGVSSDataWithoutPublishData();
        if (gvssGraphData) {
            const gvssGraphDataStr = JSON.stringify(gvssGraphData);
            try {
                const jsonPath = this._gvssEditorFolderPath + this._gvssEditorJsonFileName;
                // @ts-ignore
                fs.writeFileSync(jsonPath, gvssGraphDataStr);
            }
            catch (e) {
                console.error(`set GVSSData failed: ${e}`);
            }
        }
    }
};
GVSSSystem = __decorate([
    registerClass(),
    systemScript
], GVSSSystem);
exports.GVSSSystem = GVSSSystem;
let GVSSUrlRequest = class GVSSUrlRequest {
    constructor(url) {
        this.networkStatus = NetworkStatus.Default;
        this.url = url;
    }
    getUrl() {
        return this.url;
    }
};
GVSSUrlRequest = __decorate([
    registerClass()
], GVSSUrlRequest);
let GVSSNetworkHandler = GVSSNetworkHandler_1 = class GVSSNetworkHandler {
    constructor() {
        this.pendings = new Map();
        this.networkRequestID = -1;
        this.networkRequestTime = -1;
        this.networkResponse = null;
        this.eventType = null;
        this.networkResult = {};
        this.scriptsMap = new Map();
        this.networkCenter = null;
        this.networkListener = null;
        this.initialized = false;
    }
    static get instance() {
        if (!GVSSNetworkHandler_1._instance) {
            GVSSNetworkHandler_1._instance = new GVSSNetworkHandler_1();
        }
        return GVSSNetworkHandler_1._instance;
    }
    initialize() {
        if (this.initialized === true) {
            console.error('NetworkHandler already initialized');
            return;
        }
        this.networkCenter = Amaz.AmazingManager.getSingleton('NetworkCenter');
        this.networkCenter.initClient();
        this.networkListener = new Amaz.NetworkListener();
        this.initialized = true;
    }
    addListener(scriptToAdd, scriptKey) {
        if (this.scriptsMap.has(scriptKey)) {
            return;
        }
        this.scriptsMap.set(scriptKey, scriptToAdd);
        if (scriptToAdd && this.networkListener) {
            scriptToAdd.addScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_START, 'gvssNetworkCallBack', scriptToAdd);
            scriptToAdd.addScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_UPDATE, 'gvssNetworkCallBack', scriptToAdd);
            scriptToAdd.addScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_SUCCESS, 'gvssNetworkCallBack', scriptToAdd);
            scriptToAdd.addScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_FAIL, 'gvssNetworkCallBack', scriptToAdd);
            scriptToAdd.addScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_CANCEL, 'gvssNetworkCallBack', scriptToAdd);
        }
    }
    removeListener(scriptKey) {
        if (!this.scriptsMap.has(scriptKey)) {
            console.error('NetworkHandler::no listener for ' + scriptKey);
            return;
        }
        else {
            console.log('NetworkHandler::removeListener for ' + scriptKey);
        }
        const scriptToRemove = this.scriptsMap.get(scriptKey);
        if (scriptToRemove && this.networkListener) {
            scriptToRemove.removeScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_START, 'gvssNetworkCallBack', scriptToRemove);
            scriptToRemove.removeScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_UPDATE, 'gvssNetworkCallBack', scriptToRemove);
            scriptToRemove.removeScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_SUCCESS, 'gvssNetworkCallBack', scriptToRemove);
            scriptToRemove.removeScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_FAIL, 'gvssNetworkCallBack', scriptToRemove);
            scriptToRemove.removeScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_CANCEL, 'gvssNetworkCallBack', scriptToRemove);
        }
        this.scriptsMap.delete(scriptKey);
    }
    update() {
        if (this.networkCenter) {
            this.networkCenter.update();
        }
    }
    sendRequest(networkReq, timeout = NETWORK_TIMEOUT) {
        let resolveCallback;
        let rejectCallback;
        const promise = new Promise((resolve, reject) => {
            resolveCallback = resolve;
            rejectCallback = reject;
        });
        if (this.networkCenter && this.networkListener) {
            const request = new Object();
            const headerMap = new Amaz.Map();
            headerMap.insert('Content-Type', 'application/octet-stream');
            request.method = NetworkMethod.GET;
            request.binary = true;
            request.url = networkReq.getUrl();
            request.headerMap = headerMap;
            const taskId = this.networkCenter.get(this.networkListener, request.url, request.headerMap);
            networkReq.networkStatus = NetworkStatus.Requesting;
            let timer;
            if (timeout > 0) {
                timer = setTimeout(() => {
                    const task = this.pendings.get(taskId);
                    if (task) {
                        task.reject(new TimeoutError(`request ${networkReq.constructor.name}: ${taskId} timeout`));
                    }
                    this.pendings.delete(taskId);
                }, timeout);
            }
            this.pendings.set(taskId, {
                resolve: resolveCallback,
                reject: rejectCallback,
                networkReq: networkReq,
                promise: promise,
                timer: timer,
            });
        }
        else {
            const rejectRequest = Promise.reject(new Error(`request ${networkReq.constructor.name} is not initialized`));
            rejectRequest.catch(err => {
                console.error(err);
            });
            return rejectRequest;
        }
        return promise;
    }
    /** Resolves or rejects a pending task based on NetworkCenter event and response. */
    handleResponse(taskId, response, eventType) {
        const task = this.pendings.get(taskId);
        if (task) {
            const networkReq = task.networkReq;
            if (networkReq && networkReq.networkStatus === NetworkStatus.Requesting) {
                if (eventType === Amaz.NetworkStatus.NETWORK_SUCCESS) {
                    task.resolve(response);
                }
                else if (eventType === Amaz.NetworkStatus.NETWORK_FAIL) {
                    task.reject(new Error(response.errorDesc));
                }
                else if (eventType === Amaz.NetworkStatus.NETWORK_CANCEL) {
                    task.reject(new Error(`request ${networkReq.constructor.name} canceled`));
                }
                else {
                    return false;
                }
                networkReq.networkStatus = NetworkStatus.Completed;
                clearTimeout(task.timer);
                this.pendings.delete(taskId);
                return true;
            }
            else {
                task.reject(new Error(`request ${networkReq.constructor.name} wrong status`));
            }
        }
        else {
            console.error(`NetworkHandler task ${taskId} is not found`);
        }
        return false;
    }
};
GVSSNetworkHandler = GVSSNetworkHandler_1 = __decorate([
    registerClass()
], GVSSNetworkHandler);
let GVSSRequestHandler = GVSSRequestHandler_1 = class GVSSRequestHandler {
    constructor() {
        this.pendings = new Map();
    }
    static get instance() {
        if (!this._instance) {
            this._instance = new GVSSRequestHandler_1();
        }
        return this._instance;
    }
    sendRequest(req, scene, timeout = 2000) {
        let resolveCallback;
        let rejectCallback;
        const promise = new Promise((resolve, reject) => {
            resolveCallback = resolve;
            rejectCallback = reject;
        });
        const taskId = requireNewTaskId();
        const arg3 = {
            interface: req.getInterface(),
        };
        Object.assign(arg3, req.getSendParams());
        scene.postMessage(0x29, 0x29, taskId, JSON.stringify(arg3));
        let timer;
        if (timeout > 0) {
            timer = setTimeout(() => {
                const task = this.pendings.get(taskId);
                if (task) {
                    task.reject(new TimeoutError(`request ${req.constructor.name}: ${taskId} timeout`));
                }
                this.pendings.delete(taskId);
            }, timeout);
        }
        this.pendings.set(taskId, {
            resolve: resolveCallback,
            reject: rejectCallback,
            promise: promise,
            request: req,
            timer: timer,
        });
        return promise;
    }
    handleResponse(taskId, json) {
        const task = this.pendings.get(taskId);
        if (task) {
            if (json && json.interface === task.request.getResponseInterface()) {
                const res = task.request.getResponse(json);
                if (res instanceof Error) {
                    task.reject(res);
                }
                else {
                    task.resolve(res);
                }
                clearTimeout(task.timer);
                this.pendings.delete(taskId);
                return true;
            }
            else {
                console.warn(`received event(${taskId}) whose interface ${json ? json.interface : '*unknown*'} does not match ${task.request.getResponseInterface()}`);
            }
        }
        else {
            console.warn(`task ${taskId} is not found`);
        }
        return false;
    }
};
GVSSRequestHandler = GVSSRequestHandler_1 = __decorate([
    registerClass()
], GVSSRequestHandler);
let EffectInfoRequest = class EffectInfoRequest {
    getInterface() {
        return 'requestEffectInfo';
    }
    getResponseInterface() {
        return 'requestEffectInfo';
    }
    getSendParams() {
        return {};
    }
    getResponse(json) {
        if (json.status === 0) {
            return json.body;
        }
        else {
            return new Error(`get effect info failed with code: ${json.status}`);
        }
    }
};
EffectInfoRequest = __decorate([
    registerClass()
], EffectInfoRequest);
exports.EffectInfoRequest = EffectInfoRequest;
let effectInfoPromise;
const getEffectInfo = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    if (!effectInfoPromise) {
        const req = new EffectInfoRequest();
        effectInfoPromise = GVSSRequestHandler.instance.sendRequest(req, scene, 2000).catch(err => {
            console.warn(`failed to get effect info, reason ${err.message}`);
            throw err;
        });
    }
    return effectInfoPromise;
});
exports.getEffectInfo = getEffectInfo;
let UserInfoRequest = class UserInfoRequest {
    getInterface() {
        return 'requestUserInformation';
    }
    getResponseInterface() {
        return 'requestUserInformation';
    }
    getSendParams() {
        return {};
    }
    getResponse(json) {
        if (json.status === 0) {
            return json.body;
        }
        else {
            return new Error(`get user info failed with code: ${json.status}`);
        }
    }
};
UserInfoRequest = __decorate([
    registerClass()
], UserInfoRequest);
let userInfoPromise;
const getUserInfo = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userInfoPromise) {
        const req = new UserInfoRequest();
        userInfoPromise = GVSSRequestHandler.instance.sendRequest(req, scene, 2000).catch(err => {
            throw err;
        });
    }
    return userInfoPromise;
});
exports.getUserInfo = getUserInfo;
let UserProfileRequest = class UserProfileRequest {
    getInterface() {
        return 'NICK';
    }
    getResponseInterface() {
        return 'NICK';
    }
    getSendParams() {
        return {};
    }
    getResponse(json) {
        if (json.status === 0) {
            return json.body;
        }
        else {
            return new Error(`get user info failed with code: ${json.status}`);
        }
    }
};
UserProfileRequest = __decorate([
    registerClass()
], UserProfileRequest);
let userProfilePromise;
const getUserProfile = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userProfilePromise) {
        const req = new UserProfileRequest();
        userProfilePromise = GVSSRequestHandler.instance.sendRequest(req, scene, 2000).catch(err => {
            throw err;
        });
    }
    return userProfilePromise;
});
exports.getUserProfile = getUserProfile;
//# sourceMappingURL=GVSSSystem.js.map