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
exports.regJSAsset = exports.instance = exports.initInstance = exports.JSAssetRuntimeManager = void 0;
const JSAssetScriptBase_1 = require("./JSAssetScriptBase");
const JSAssetScriptBase_2 = require("./JSAssetScriptBase");
const JSAssetProvider = __importStar(require("./JSAssetProvider"));
const APJS = require('amazingpro.js');
class EventHandler {
    constructor() {
        this._callbacks = {};
        this._callbackActive = {};
    }
    _addCallback(name, callback, scope, once = false) {
        if (!name || typeof name !== 'string' || !callback) {
            return;
        }
        if (!this._callbacks[name]) {
            this._callbacks[name] = [];
        }
        if (this._callbackActive[name] &&
            this._callbackActive[name] === this._callbacks[name]) {
            this._callbackActive[name] = this._callbackActive[name].slice();
        }
        this._callbacks[name].push({
            callback: callback,
            scope: scope || this,
            once: once,
        });
    }
    on(name, callback, scope) {
        this._addCallback(name, callback, scope, false);
        return this;
    }
    off(name, callback, scope) {
        if (name) {
            if (this._callbackActive[name] &&
                this._callbackActive[name] === this._callbacks[name]) {
                this._callbackActive[name] = this._callbackActive[name].slice();
            }
        }
        else {
            for (const key in this._callbackActive) {
                if (!this._callbacks[key]) {
                    continue;
                }
                if (this._callbacks[key] !== this._callbackActive[key]) {
                    continue;
                }
                this._callbackActive[key] = this._callbackActive[key].slice();
            }
        }
        if (!name) {
            this._callbacks = {};
        }
        else if (!callback) {
            if (this._callbacks[name]) {
                this._callbacks[name] = [];
            }
        }
        else {
            const events = this._callbacks[name];
            if (!events) {
                return this;
            }
            let count = events.length;
            for (let i = 0; i < count; i++) {
                if (events[i].callback !== callback) {
                    continue;
                }
                if (scope && events[i].scope !== scope) {
                    continue;
                }
                events[i--] = events[--count];
            }
            events.length = count;
        }
        return this;
    }
    fire(name, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        if (!name || !this._callbacks[name]) {
            return this;
        }
        let callbacks;
        if (!this._callbackActive[name]) {
            this._callbackActive[name] = this._callbacks[name];
        }
        else {
            if (this._callbackActive[name] === this._callbacks[name]) {
                this._callbackActive[name] = this._callbackActive[name].slice();
            }
            callbacks = this._callbacks[name].slice();
        }
        for (let i = 0; (callbacks || this._callbackActive[name]) &&
            i < (callbacks || this._callbackActive[name]).length; i++) {
            const evt = (callbacks || this._callbackActive[name])[i];
            evt.callback.call(evt.scope, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
            if (evt.once) {
                const ind = this._callbacks[name].indexOf(evt);
                if (ind !== -1) {
                    if (this._callbackActive[name] === this._callbacks[name]) {
                        this._callbackActive[name] = this._callbackActive[name].slice();
                    }
                    this._callbacks[name].splice(ind, 1);
                }
            }
        }
        if (!callbacks) {
            this._callbackActive[name] = undefined;
        }
        return this;
    }
    once(name, callback, scope) {
        this._addCallback(name, callback, scope, true);
        return this;
    }
    hasEvent(name) {
        return ((this._callbacks[name] && this._callbacks[name].length !== 0) || false);
    }
}
exports.default = EventHandler;
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
function ab2str(buf) {
    const array = new Uint8Array(buf);
    return utf8ByteToUnicodeStr(array);
}
class JSAssetRuntimeManager extends EventHandler {
    registerSingleInsUpdateFn(caller, updateFn) {
        const ins = JSAssetRuntimeManager.instance;
        if (!ins) {
            return;
        }
        if (!ins._singleInstanceUpdatetFn.has(updateFn)) {
            ins._singleInstanceUpdatetFn.set(updateFn, caller);
        }
    }
    static get instance() {
        return this._instance;
    }
    static get systemScript() {
        return this._instance._systemScript;
    }
    getDefaultCmdBufferHelper() {
        if (!this._cmdBufHelper) {
            this._cmdBufHelper = new APJS.CommandBuffer();
        }
        return this._cmdBufHelper;
    }
    getDefaultScreenMesh() {
        if (!this._screenMesh) {
            this._screenMesh = JSAssetScriptBase_2.MeshUtil.createQuadMesh();
        }
        return this._screenMesh;
    }
    static regJSAsset(constructor, extName, engineType, projectDir, tickInEditor = false) {
        const config = {
            extName: extName,
            engineType: engineType,
            projectDir: projectDir,
            tickInEditor: tickInEditor,
            constructor: constructor,
        };
        if (!JSAssetRuntimeManager._mapExtNameToAssetConfig.has(extName.toLowerCase())) {
            JSAssetRuntimeManager._mapExtNameToAssetConfig.set(extName.toLowerCase(), config);
        }
    }
    static addNativeListener(native, eventType, callback, scope) {
        var _a, _b;
        const event = JSAssetRuntimeManager.getObjectEvent(native, eventType);
        if (!((_a = JSAssetRuntimeManager.instance) === null || _a === void 0 ? void 0 : _a.hasEvent(event)) && this.systemScript) {
            this.systemScript.addScriptListener(native, eventType, '_onObjectEvent', native);
        }
        (_b = JSAssetRuntimeManager.instance) === null || _b === void 0 ? void 0 : _b.on(event, callback, scope);
    }
    static removeNativeListener(native, eventType, callback, scope) {
        var _a, _b;
        const event = JSAssetRuntimeManager.getObjectEvent(native, eventType);
        if (((_a = JSAssetRuntimeManager.instance) === null || _a === void 0 ? void 0 : _a.hasEvent(event)) && this.systemScript) {
            this.systemScript.removeScriptListener(native, eventType, '_onObjectEvent', native);
        }
        (_b = JSAssetRuntimeManager.instance) === null || _b === void 0 ? void 0 : _b.off(event, callback, scope);
    }
    getFirstEffectNodeLargerOrEqualOrder(renderOrder) {
        let ret = undefined;
        let lastNode = undefined;
        let maxOrder = Number.MIN_VALUE;
        let currOrder = Number.MAX_VALUE;
        for (const component of this._listenedComponents) {
            if (component instanceof APJS.EffectNode) {
                if (component.renderOrder >= renderOrder &&
                    component.renderOrder < currOrder) {
                    currOrder = component.renderOrder;
                    ret = component;
                }
                if (maxOrder < component.renderOrder) {
                    maxOrder = component.renderOrder;
                    lastNode = component;
                }
            }
        }
        return ret !== undefined ? ret : lastNode;
    }
    addListener(scene, renderOrder) {
        const effectNodeComp = this.getFirstEffectNodeLargerOrEqualOrder(renderOrder);
        const assetInfo = this._renderOrderToInfo.get(renderOrder);
        const func = assetInfo === null || assetInfo === void 0 ? void 0 : assetInfo.updateFunction;
        if (assetInfo && effectNodeComp && func) {
            JSAssetRuntimeManager.addNativeListener(effectNodeComp, APJS.EffectNodeEvent.BEFORE_RENDER, func, this);
            assetInfo.effectNodeComponent = effectNodeComp;
            this._renderOrderToInfo.set(renderOrder, assetInfo);
            return true;
        }
        return false;
    }
    removeListener(renderOrder) {
        var _a;
        if (renderOrder === 0) {
            return true;
        }
        const assetInfo = this._renderOrderToInfo.get(renderOrder);
        const effectNodeComp = assetInfo === null || assetInfo === void 0 ? void 0 : assetInfo.effectNodeComponent;
        const func = (_a = this._renderOrderToInfo.get(renderOrder)) === null || _a === void 0 ? void 0 : _a.updateFunction;
        if (assetInfo && effectNodeComp && func !== undefined) {
            JSAssetRuntimeManager.removeNativeListener(effectNodeComp, APJS.EffectNodeEvent.BEFORE_RENDER, func, this);
            assetInfo.effectNodeComponent = undefined;
            this._renderOrderToInfo.set(renderOrder, assetInfo);
            return true;
        }
        return false;
    }
    constructor() {
        super();
        this._scene = undefined;
        this._originAssetUUIDS = new Set();
        this._nativeObjMap = undefined;
        this._cmdBufHelper = undefined;
        this._deltaTime = 0;
        this._curRenderTime = 0;
        this._epsilon = 30;
        this._screenMesh = undefined;
        this._singleInstanceUpdatetFn = new Map();
        this._currentFrame = 0;
        this.updateSingletons = () => {
            this._singleInstanceUpdatetFn.forEach((caller, updateFn) => {
                updateFn.call(caller, this._deltaTime);
            });
        };
        this._scene = undefined;
        this._resEntryMap = new Map();
        this._assets = new Array();
        this._assetMap = new Map();
        this._renderOrderToInfo = new Map();
        this._renderOrders = new Map();
        this._renderOrderSet = new Set([]);
        this._listenedCompTypeSet = new Set([]);
        this._listenedComponents = new Array();
    }
    static initInstance(scene, systemScriptObj) {
        if (this._instance !== undefined) {
            console.warn('Engine already initialized');
            return;
        }
        if (!scene) {
            throw new Error();
        }
        this._instance = new JSAssetRuntimeManager();
        scene = APJS.transferToAPJSObj(scene);
        if (!(scene instanceof APJS.Scene)) {
            throw new Error('JSAssetRuntimeManager:initInstance, transfer to APJS.Scene failed!');
        }
        this._instance.init(scene, systemScriptObj);
    }
    static getObjectEvent(native, eventType) {
        if (eventType === undefined) {
            return '';
        }
        return native.handle.toString() + ':' + eventType.toString();
    }
    _onObjectEvent(userData, senderData, eventType) {
        var _a;
        const event = JSAssetRuntimeManager.getObjectEvent(userData, eventType);
        (_a = JSAssetRuntimeManager.instance) === null || _a === void 0 ? void 0 : _a.fire(event, senderData, eventType);
    }
    initSystemScript(systemScriptObj) {
        let mainSystemScript = systemScriptObj['script'];
        mainSystemScript = APJS.transferToAPJSObj(mainSystemScript);
        if (!(mainSystemScript instanceof APJS.JSScript)) {
            throw new Error('JSAssetRuntimeManager:initSystemScript, transfer to APJS.JSScript failed!');
        }
        if (mainSystemScript instanceof APJS.JSScript) {
            this._systemScript = mainSystemScript;
            const jsSystemScript = this._systemScript.ref;
            jsSystemScript._onObjectEvent = this._onObjectEvent;
        }
        else {
            throw new Error('Incorrect/ missing system script is not passed in amg.Engine.init(). Please pass this as second argument');
        }
    }
    getConfigFromFilePath(filePath) {
        const hasConfig = fs.accessSync(filePath, 0);
        if (!hasConfig) {
            console.log('No customAssets.json found');
            return;
        }
        const f = fs.readFileSync(filePath);
        const parseRes = JSON.parse(ab2str(f));
        if (parseRes === null) {
            console.error('customAssets.json parse failed');
            return;
        }
        return parseRes;
    }
    registerRenderChain(renderOrder, asset) {
        var _a;
        if (renderOrder !== undefined && asset) {
            if (this._renderOrderToInfo.has(renderOrder)) {
                (_a = this._renderOrderToInfo.get(renderOrder)) === null || _a === void 0 ? void 0 : _a.assets.push(asset);
            }
            else {
                this._renderOrderToInfo.set(renderOrder, {
                    assets: [asset],
                    updateFunction: () => {
                        const info = this._renderOrderToInfo.get(renderOrder);
                        if (info && info.lastRenderTime !== this._currentFrame) {
                            info.lastRenderTime = this._currentFrame;
                            this.render(renderOrder, this._deltaTime);
                        }
                    },
                    effectNodeComponent: undefined,
                    lastRenderTime: 0,
                });
            }
        }
        this._listenedCompTypeSet.add('EffectNode');
        this._renderOrderSet.add(renderOrder);
    }
    addListenerOnStart() {
        if ((0, JSAssetScriptBase_2.IsRenderChainEventSupported)()) {
            const effectNodeComp = this.getFirstEffectNodeLargerOrEqualOrder(0);
            if (effectNodeComp) {
                JSAssetRuntimeManager.addNativeListener(effectNodeComp, APJS.EffectNodeEvent.BEFORE_RENDER, this.updateSingletons, this);
            }
            for (const renderOrder of this._renderOrderSet) {
                if (renderOrder !== 0) {
                    const suc = this.addListener(this._scene, renderOrder);
                    if (!suc) {
                        console.error('Custom-asset of renderOrder: ' +
                            renderOrder +
                            ' failed to be added');
                    }
                }
            }
        }
    }
    initJSAssetInstances(updateOrder, nativeObjMap) {
        var _a, _b;
        for (const uuid of updateOrder) {
            const config = this._resEntryMap.get(uuid);
            if (config.path.endsWith('.jsasset') || this._assetMap.has(uuid)) {
                continue;
            }
            console.log('initializing JSAsset with uuid', uuid);
            const asset = this.createJSAsset(config);
            if (asset) {
                asset.mainObject = nativeObjMap.get(uuid);
                if (asset.mainObject instanceof APJS.Texture) {
                    if (APJS.TextureUtils.hasTextureProvider(asset.mainObject, APJS.ScreenTextureProvider)) {
                        asset.mainObject.getControl().needInitData = true;
                    }
                }
                this._assets.push(asset);
                this._assetMap.set(uuid, asset);
                const renderOrder = this._renderOrders.get(config.uuid);
                if (renderOrder !== undefined) {
                    this.registerRenderChain(renderOrder, asset);
                }
                const properties = config.properties;
                if (properties) {
                    for (const key in properties) {
                        const value = properties[key];
                        if (typeof value === 'string' && value.startsWith('custom://')) {
                            const refUUID = value.substring(value.lastIndexOf('/') + 1, value.length);
                            const refObj = (_a = this._assetMap.get(refUUID)) === null || _a === void 0 ? void 0 : _a.mainObject;
                            if (refObj) {
                                asset[key] = refObj;
                            }
                        }
                        else if (typeof value === 'string' &&
                            value.startsWith('share://')) {
                            const refObj = (_b = this._scene) === null || _b === void 0 ? void 0 : _b.assetManager.load(value);
                            asset[key] = refObj;
                        }
                    }
                }
            }
        }
    }
    restoreInstantiatedObjects(nativeObjMap) {
        const allObjKeys = nativeObjMap.getAllKeys();
        if (allObjKeys.length === 0) {
            return;
        }
        for (let i = 0; i < allObjKeys.length; i++) {
            const uuid = allObjKeys[i].toString();
            const nativeObj = nativeObjMap.get(uuid);
            if (this._assetMap.has(uuid)) {
                continue;
            }
            const original_id = uuid.substring(0, uuid.lastIndexOf('-'));
            if (!this._assetMap.has(original_id)) {
                console.error('JSAssetSystem restoreInstantiatedObjects original_id not exist:', original_id);
                continue;
            }
            const originScript = this._assetMap.get(original_id);
            const newScript = originScript.instantiate();
            if (newScript === undefined) {
                continue;
            }
            newScript.mainObject = APJS.transferToAPJSObj(nativeObj);
            this.setupInstantiatedJSAsset(newScript, uuid, original_id);
        }
    }
    setupInstantiatedJSAsset(script, uuid, original_id) {
        var _a, _b;
        const newConfig = Object.assign({}, this._resEntryMap.get(original_id));
        newConfig.uuid = uuid;
        this._resEntryMap.set(uuid, newConfig);
        (_b = (_a = this._scene) === null || _a === void 0 ? void 0 : _a.assetManager.getAllCustomAssetsProperty()) === null || _b === void 0 ? void 0 : _b.set(uuid, newConfig.properties);
        script.uuid = uuid;
        this._assets.push(script);
        this._assetMap.set(uuid, script);
        const renderOrder = this._renderOrders.get(original_id);
        if (renderOrder !== undefined) {
            this._renderOrders.set(newConfig.uuid, renderOrder);
            this.registerRenderChain(renderOrder, script);
        }
    }
    init(scene, systemScriptObj) {
        var _a, _b;
        this._scene = scene;
        this.initSystemScript(systemScriptObj);
        const configPath = scene.assetManager.rootDir + 'customAssets.json';
        this._assetsConfig = this.getConfigFromFilePath(configPath);
        this._nativeObjMap = scene.assetManager.getAllScriptCustomAssets();
        for (const config of this._assetsConfig) {
            this._resEntryMap.set(config.uuid, config);
            this._renderOrders.set(config.uuid, (_b = (_a = config.properties) === null || _a === void 0 ? void 0 : _a.captureOrder) !== null && _b !== void 0 ? _b : 0);
            this._originAssetUUIDS.add(config.uuid);
        }
        const updateOrder = this.analyzeAssetsDependency();
        this.initJSAssetInstances(updateOrder, this._nativeObjMap);
        this.restoreInstantiatedObjects(this._nativeObjMap);
    }
    hasOnLateUpdateAsset() {
        const hasOnLateUpdate = false;
        for (const asset of this._assets) {
            if (Object.getPrototypeOf(asset).onLateUpdate !==
                JSAssetScriptBase_1.JSAssetScriptBase.prototype.onLateUpdate) {
                return true;
            }
        }
        return hasOnLateUpdate;
    }
    onInit() {
        var _a, _b, _c, _d, _e, _f, _g;
        this._assets.forEach((asset) => {
            asset.init(this.registerSingleInsUpdateFn);
        });
        if (!this.hasOnLateUpdateAsset()) {
            (_a = this._systemScript) === null || _a === void 0 ? void 0 : _a.registerIgnoreLifeCycleCallback('onLateUpdate');
        }
        if (this._listenedCompTypeSet.size > 0) {
            for (const compType of this._listenedCompTypeSet) {
                (_b = this._systemScript) === null || _b === void 0 ? void 0 : _b.handleComponentName(compType);
            }
        }
        else {
            (_c = this._systemScript) === null || _c === void 0 ? void 0 : _c.handleNoComponent();
        }
        (_d = this._systemScript) === null || _d === void 0 ? void 0 : _d.addEventType(APJS.AppEventType.COMPAT_BEF);
        (_e = this._systemScript) === null || _e === void 0 ? void 0 : _e.addEventType(APJS.EventType.RCVALUE_CHANGE);
        (_f = this._systemScript) === null || _f === void 0 ? void 0 : _f.addEventType(APJS.EventType.Touch);
        if (APJS.EventType.DUAL_INSTANCE) {
            (_g = this._systemScript) === null || _g === void 0 ? void 0 : _g.addEventType(APJS.EventType.DUAL_INSTANCE);
        }
    }
    onStart() {
        this.addListenerOnStart();
        for (const assetInfos of this._renderOrderToInfo) {
            const assetArr = assetInfos[1].assets;
            for (const asset of assetArr) {
                asset.onStart();
            }
        }
    }
    onUpdate(dt) {
        this._currentFrame %= Number.MAX_SAFE_INTEGER;
        this._currentFrame++;
        this._deltaTime = dt;
        this.render(0, dt);
    }
    render(renderOrder, dt) {
        var _a, _b;
        if (this._scene) {
            (_a = this._cmdBufHelper) === null || _a === void 0 ? void 0 : _a.clearAll();
            const assetArr = (_b = this._renderOrderToInfo.get(renderOrder)) === null || _b === void 0 ? void 0 : _b.assets;
            if (assetArr) {
                for (const asset of assetArr) {
                    asset === null || asset === void 0 ? void 0 : asset.onUpdate(dt);
                }
            }
            if (this._cmdBufHelper) {
                this._scene.commitCommandBuffer(this._cmdBufHelper);
            }
        }
    }
    onLateUpdate(dt) {
        for (const assetInfos of this._renderOrderToInfo) {
            const assetArr = assetInfos[1].assets;
            for (const asset of assetArr) {
                if (typeof asset.onLateUpdate === 'function') {
                    asset.onLateUpdate(dt);
                }
            }
        }
    }
    onRelease() {
        for (const assetInfos of this._renderOrderToInfo) {
            const assetArr = assetInfos[1].assets;
            for (const asset of assetArr) {
                asset.onRelease();
            }
        }
    }
    onDestroy() {
        if ((0, JSAssetScriptBase_2.IsRenderChainEventSupported)()) {
            const effectNodeComp = this.getFirstEffectNodeLargerOrEqualOrder(0);
            if (effectNodeComp) {
                JSAssetRuntimeManager.removeNativeListener(effectNodeComp, APJS.EffectNodeEvent.BEFORE_RENDER, this.updateSingletons, this);
            }
            for (const renderOrder of this._renderOrderSet) {
                const suc = this.removeListener(renderOrder);
                if (!suc) {
                    console.error('Custom-asset of renderOrder: ' +
                        renderOrder +
                        ' failed to be removed');
                }
            }
        }
        for (const assetInfos of this._renderOrderToInfo) {
            const assetArr = assetInfos[1].assets;
            for (const asset of assetArr) {
                asset.onDestroy();
            }
        }
        this._listenedComponents = [];
    }
    onEvent(event) {
        for (const asset of this._assets) {
            asset.onEvent(event);
        }
    }
    onComponentAdded(comp) {
        this._listenedComponents.push(comp);
    }
    onComponentRemoved(comp) {
        let index = -1;
        for (let i = 0; i < this._listenedComponents.length; i++) {
            if (this._listenedComponents[i].handle === comp.handle) {
                index = i;
                break;
            }
        }
        if (index !== -1) {
            this._listenedComponents.splice(index, 1);
        }
    }
    addListenCompType(type) {
        this._listenedCompTypeSet.add(type);
    }
    getListenedComponents(type) {
        return this._listenedComponents;
    }
    getAsset(object) {
        var _a, _b;
        const objectAPJS = APJS.isAPJSType(object)
            ? object
            : APJS.transferToAPJSObj(object);
        if (objectAPJS && APJS.isDynamicAsset(objectAPJS)) {
            return objectAPJS.getControl();
        }
        const objectRTTI = object && object instanceof APJS.AObject ? object.getNative() : object;
        const keys = (_a = this._nativeObjMap) === null || _a === void 0 ? void 0 : _a.getAllKeys();
        if (keys) {
            for (let i = 0; i < keys.length; ++i) {
                const uuid = keys[i];
                const nativeObj = (_b = this._nativeObjMap) === null || _b === void 0 ? void 0 : _b.get(uuid);
                const nativeObjRTTI = nativeObj && nativeObj instanceof APJS.AObject
                    ? nativeObj.getNative()
                    : nativeObj;
                if (objectRTTI && nativeObjRTTI && nativeObjRTTI.eq(objectRTTI)) {
                    return this._assetMap.get(uuid);
                }
            }
        }
        return undefined;
    }
    instantiateAsset(script) {
        var _a, _b, _c;
        if (script === undefined || script.uuid === undefined) {
            return undefined;
        }
        const newScript = script.instantiate();
        if (newScript === undefined) {
            return undefined;
        }
        const uuid = script.uuid + '-' + script.instantiatedObjectsNum.toString();
        let newTexture = undefined;
        if ((_a = script.mainObject) === null || _a === void 0 ? void 0 : _a.isInstanceOf('Texture2D')) {
            newTexture = APJS.TextureUtils.createTexture2D();
        }
        else if ((_b = script.mainObject) === null || _b === void 0 ? void 0 : _b.isInstanceOf('TextureDelegate')) {
            newTexture = APJS.TextureUtils.createTextureDelegate();
        }
        if (newTexture) {
            (_c = this._nativeObjMap) === null || _c === void 0 ? void 0 : _c.set(uuid, newTexture);
            newScript.mainObject = newTexture;
        }
        this.setupInstantiatedJSAsset(newScript, uuid, script.uuid);
        return newTexture;
    }
    removeAsset(script) {
        var _a, _b, _c;
        if (script === undefined ||
            script.uuid === undefined ||
            script.canBeRemovedDynamically === false) {
            console.error('removeAsset: script or uuid undefined or canBeRemovedDynamically is false');
            return false;
        }
        const uuid = script.uuid;
        if (this._originAssetUUIDS.has(uuid) === false) {
            (_a = this._nativeObjMap) === null || _a === void 0 ? void 0 : _a.remove(uuid);
            (_c = (_b = this._scene) === null || _b === void 0 ? void 0 : _b.assetManager.getAllCustomAssetsProperty()) === null || _c === void 0 ? void 0 : _c.remove(uuid);
        }
        this._resEntryMap.delete(uuid);
        this._assetMap.delete(uuid);
        this._assets = this._assets.filter((asset) => asset.uuid !== uuid);
        const renderOrder = this._renderOrders.get(uuid);
        if (renderOrder !== undefined) {
            const assetInfo = this._renderOrderToInfo.get(renderOrder);
            if (assetInfo === undefined) {
                console.error('removeAsset: not found assetInfo');
                return false;
            }
            assetInfo.assets = assetInfo.assets.filter((asset) => asset.uuid !== uuid);
            this._renderOrders.delete(uuid);
        }
        else {
            console.error('removeAsset: not found renderorder');
            return false;
        }
        return true;
    }
    restoreToOriginalAssets() {
        var _a, _b;
        this.removeInstantiatedAssets();
        for (const config of this._assetsConfig) {
            this._resEntryMap.set(config.uuid, config);
            this._renderOrders.set(config.uuid, (_b = (_a = config.properties) === null || _a === void 0 ? void 0 : _a.captureOrder) !== null && _b !== void 0 ? _b : 0);
        }
        const updateOrder = this.analyzeAssetsDependency();
        const restoredUUIDSet = new Array();
        for (const uuid of updateOrder) {
            if (!this._assetMap.has(uuid)) {
                restoredUUIDSet.push(uuid);
            }
        }
        this.initJSAssetInstances(updateOrder, this._nativeObjMap);
        for (const uuid of restoredUUIDSet) {
            const asset = this._assetMap.get(uuid);
            if (asset) {
                asset.onStart();
            }
        }
    }
    removeInstantiatedAssets() {
        for (const uuid of this._assetMap.keys()) {
            if (!this._originAssetUUIDS.has(uuid)) {
                const asset = this._assetMap.get(uuid);
                if (asset) {
                    this.removeAsset(asset);
                }
            }
        }
    }
    getAssetByUUID(uuid) {
        return this._assetMap.get(uuid);
    }
    getAllJSAssets() {
        return this._assets;
    }
    createJSAsset(config) {
        if (typeof (config === null || config === void 0 ? void 0 : config.path) === 'string') {
            const extName = config.path
                .substring(config.path.lastIndexOf('.'))
                .toLowerCase();
            const ctr = JSAssetProvider.JSAssetExtNameToCtrMap.get(extName.toLowerCase());
            if (!ctr) {
                console.error(`JSAsset doesn't support asset extName: [${extName}]`);
                return null;
            }
            const asset = new ctr();
            asset.scene = this._scene;
            asset.loadFromConfig(config);
            asset.isRunTime = true;
            asset.getMgrInstanceFunc = instance;
            return asset;
        }
        return null;
    }
    analyzeAssetsDependency() {
        let order = new Array();
        const adjList = new Map();
        const inDeg = new Map();
        const customAssetHeader = 'custom://';
        let assetCnt = 0;
        for (const config of this._assetsConfig) {
            assetCnt += 1;
            inDeg.set(config.uuid, 0);
        }
        for (const config of this._assetsConfig) {
            const from = config.uuid;
            if (config.properties) {
                for (const k in config.properties) {
                    const property = config.properties[k];
                    if (typeof property === 'string' &&
                        property.startsWith(customAssetHeader)) {
                        const to = property.substr(customAssetHeader.length);
                        console.log(`custom assets: [${from}] depends on [${to}]`);
                        inDeg.set(to, inDeg.get(to) + 1);
                        if (!adjList.has(from)) {
                            adjList.set(from, new Array());
                        }
                        adjList.get(from).push(to);
                    }
                }
            }
        }
        const q = new Array();
        for (const id of inDeg.keys()) {
            if (inDeg.get(id) === 0) {
                q.push(id);
            }
        }
        while (q.length > 0) {
            const top = q.shift();
            order.push(top);
            if (adjList.has(top)) {
                for (const id of adjList.get(top)) {
                    inDeg.set(id, inDeg.get(id) - 1);
                    if (inDeg.get(id) === 0) {
                        q.push(id);
                    }
                }
            }
        }
        if (order.length === assetCnt) {
            order.reverse();
        }
        else {
            console.error('Found circular dependency in custom assets');
            order = new Array();
            for (const config of this._assetsConfig) {
                order.push(config.uuid);
            }
        }
        if ((0, JSAssetScriptBase_2.IsRenderChainEventSupported)()) {
            for (const fromId of order) {
                const deps = adjList.get(fromId);
                deps === null || deps === void 0 ? void 0 : deps.forEach((toID) => {
                    var _a, _b;
                    this._renderOrders.set(fromId, Math.max((_a = this._renderOrders.get(fromId)) !== null && _a !== void 0 ? _a : 0, (_b = this._renderOrders.get(toID)) !== null && _b !== void 0 ? _b : 0));
                });
            }
        }
        return order;
    }
}
exports.JSAssetRuntimeManager = JSAssetRuntimeManager;
JSAssetRuntimeManager._instance = undefined;
JSAssetRuntimeManager._mapExtNameToAssetConfig = new Map();
let managerIns = null;
function initInstance(scene, systemScriptObj) {
    JSAssetRuntimeManager.initInstance(scene, systemScriptObj);
    managerIns = JSAssetRuntimeManager.instance;
    managerIns.onInit();
}
exports.initInstance = initInstance;
function instance() {
    return managerIns;
}
exports.instance = instance;
function regJSAsset(extName, engineType, projectDir, tickInEditor = false) {
    return (constructor) => {
        JSAssetRuntimeManager.regJSAsset(constructor, extName, engineType, projectDir, tickInEditor);
    };
}
exports.regJSAsset = regJSAsset;
