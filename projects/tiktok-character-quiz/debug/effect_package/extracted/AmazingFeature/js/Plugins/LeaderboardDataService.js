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
var LBNetworkHandler_1, LBRequestHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.getUserInfo = exports.getEffectInfo = exports.LBEffectInfoRequest = exports.LBRequestHandler = exports.LBFriendsListRequest = exports.LBEncryptionKeyRequest = exports.LBLeaderboardRequest = exports.LBNetworkHandler = exports.TimeoutError = exports.LBDownloadImageRequest = exports.LBDownloadRequest = void 0;
const APJS = require('../amazingpro.js')
const { registerClass } = APJS;
const Amaz = effect.Amaz;
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
    NetworkStatus[NetworkStatus["Destoryed"] = 5] = "Destoryed";
})(NetworkStatus || (NetworkStatus = {}));
let curTaskId = 10000 + Math.floor(Math.random() * 1000);
function requireNewTaskId() {
    return curTaskId++;
}
let LBDownloadRequest = class LBDownloadRequest {
    constructor(url) {
        this.url = url;
    }
    getInterface() {
        return 'download';
    }
    getResponseInterface() {
        return this.getInterface();
    }
    getSendParams() {
        return {
            data: [
                {
                    needUpzip: 0,
                    url: [this.url],
                },
            ],
        };
    }
    getResponse(json) {
        if (json.file_paths && json.file_paths[0]) {
            if (json.file_paths[0].success === 1) {
                return json.file_paths[0].path;
            }
            else {
                return new Error(`failed with error code: ${json.file_paths[0].success}`);
            }
        }
        else {
            return new Error('unknown');
        }
    }
};
LBDownloadRequest = __decorate([
    registerClass()
], LBDownloadRequest);
exports.LBDownloadRequest = LBDownloadRequest;
let LBDownloadImageRequest = class LBDownloadImageRequest {
    constructor(url) {
        this.networkStatus = NetworkStatus.Default;
        this.url = url;
    }
    getUrl() {
        return this.url;
    }
};
LBDownloadImageRequest = __decorate([
    registerClass()
], LBDownloadImageRequest);
exports.LBDownloadImageRequest = LBDownloadImageRequest;
const NETWORK_TIMEOUT = 5000;
class TimeoutError extends Error {
}
exports.TimeoutError = TimeoutError;
let LBNetworkHandler = LBNetworkHandler_1 = class LBNetworkHandler {
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
        if (!LBNetworkHandler_1._instance) {
            LBNetworkHandler_1._instance = new LBNetworkHandler_1();
        }
        return LBNetworkHandler_1._instance;
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
            scriptToAdd.addScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_START, 'leaderboardNetworkCallBack', scriptToAdd);
            scriptToAdd.addScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_UPDATE, 'leaderboardNetworkCallBack', scriptToAdd);
            scriptToAdd.addScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_SUCCESS, 'leaderboardNetworkCallBack', scriptToAdd);
            scriptToAdd.addScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_FAIL, 'leaderboardNetworkCallBack', scriptToAdd);
            scriptToAdd.addScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_CANCEL, 'leaderboardNetworkCallBack', scriptToAdd);
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
            scriptToRemove.removeScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_START, 'leaderboardNetworkCallBack', scriptToRemove);
            scriptToRemove.removeScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_UPDATE, 'leaderboardNetworkCallBack', scriptToRemove);
            scriptToRemove.removeScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_SUCCESS, 'leaderboardNetworkCallBack', scriptToRemove);
            scriptToRemove.removeScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_FAIL, 'leaderboardNetworkCallBack', scriptToRemove);
            scriptToRemove.removeScriptListener(this.networkListener, Amaz.NetworkStatus.NETWORK_CANCEL, 'leaderboardNetworkCallBack', scriptToRemove);
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
LBNetworkHandler = LBNetworkHandler_1 = __decorate([
    registerClass()
], LBNetworkHandler);
exports.LBNetworkHandler = LBNetworkHandler;
let LBLeaderboardRequest = class LBLeaderboardRequest {
    constructor(effectId, sortType) {
        this.effectId = effectId;
        this.sortType = sortType;
        this.networkStatus = NetworkStatus.Default;
    }
    getUrl() {
        let url = 'https://api.tiktokv.com/tiktok/v1/api/effect/leaderboard/retrieve?';
        url += 'leaderboard_type=1&leaderboard_type=2&leaderboard_type=3';
        url += '&limit=6';
        url += `&order=${this.sortType}`;
        url += `&effect_id=${this.effectId}`;
        url += '&leaderboard_id=1';
        return url;
    }
};
LBLeaderboardRequest = __decorate([
    registerClass()
], LBLeaderboardRequest);
exports.LBLeaderboardRequest = LBLeaderboardRequest;
let LBEncryptionKeyRequest = class LBEncryptionKeyRequest {
    constructor() {
        this.networkStatus = NetworkStatus.Default;
    }
    getUrl() {
        return 'https://api.tiktokv.com/tiktok/v1/api/effect/leaderboard/encrypt_key/retrieve';
    }
};
LBEncryptionKeyRequest = __decorate([
    registerClass()
], LBEncryptionKeyRequest);
exports.LBEncryptionKeyRequest = LBEncryptionKeyRequest;
let LBFriendsListRequest = class LBFriendsListRequest {
    constructor() {
        this.networkStatus = NetworkStatus.Default;
    }
    getUrl() {
        return `https://api.tiktokv.com/tiktok/user/relation/mutual_friends/list/v1?scene=3&count=50`;
    }
};
LBFriendsListRequest = __decorate([
    registerClass()
], LBFriendsListRequest);
exports.LBFriendsListRequest = LBFriendsListRequest;
let LBRequestHandler = LBRequestHandler_1 = class LBRequestHandler {
    constructor() {
        this.pendings = new Map();
    }
    static get instance() {
        if (!this._instance) {
            this._instance = new LBRequestHandler_1();
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
LBRequestHandler = LBRequestHandler_1 = __decorate([
    registerClass()
], LBRequestHandler);
exports.LBRequestHandler = LBRequestHandler;
let LBEffectInfoRequest = class LBEffectInfoRequest {
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
LBEffectInfoRequest = __decorate([
    registerClass()
], LBEffectInfoRequest);
exports.LBEffectInfoRequest = LBEffectInfoRequest;
let effectInfoPromise;
const getEffectInfo = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    if (!effectInfoPromise) {
        const req = new LBEffectInfoRequest();
        effectInfoPromise = LBRequestHandler.instance.sendRequest(req, scene, 2000).catch(err => {
            console.warn(`failed to get effect info, reason ${err.message}`);
            throw err;
        });
    }
    return effectInfoPromise;
});
exports.getEffectInfo = getEffectInfo;
let LBUserInfoRequest = class LBUserInfoRequest {
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
LBUserInfoRequest = __decorate([
    registerClass()
], LBUserInfoRequest);
let userInfoPromise;
const getUserInfo = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userInfoPromise) {
        const req = new LBUserInfoRequest();
        userInfoPromise = LBRequestHandler.instance.sendRequest(req, scene, 2000).catch(err => {
            throw err;
        });
    }
    return userInfoPromise;
});
exports.getUserInfo = getUserInfo;
let LBUserProfileRequest = class LBUserProfileRequest {
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
LBUserProfileRequest = __decorate([
    registerClass()
], LBUserProfileRequest);
let userProfilePromise;
const getUserProfile = (scene) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userProfilePromise) {
        const req = new LBUserProfileRequest();
        userProfilePromise = LBRequestHandler.instance.sendRequest(req, scene, 2000).catch(err => {
            throw err;
        });
    }
    return userProfilePromise;
});
exports.getUserProfile = getUserProfile;
//# sourceMappingURL=LeaderboardDataService.js.map