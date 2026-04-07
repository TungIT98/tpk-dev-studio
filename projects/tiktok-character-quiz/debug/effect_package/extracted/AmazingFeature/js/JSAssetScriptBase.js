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
exports.JSAssetScriptBase = exports.RenderingUtil = exports.IsRenderChainEventSupported = exports.JSAssetType = exports.MeshUtil = void 0;
const APJS = require('amazingpro.js');
class MeshUtil {
    static createQuadMesh() {
        return APJS.MeshUtils.createQuadMesh(-1, 1, -1, 1);
    }
}
exports.MeshUtil = MeshUtil;
var JSAssetType;
(function (JSAssetType) {
    JSAssetType[JSAssetType["UNDEFINED"] = 0] = "UNDEFINED";
    JSAssetType[JSAssetType["ExampleJSAssetTexture"] = 1] = "ExampleJSAssetTexture";
})(JSAssetType = exports.JSAssetType || (exports.JSAssetType = {}));
let isRenderChainEventSupportedFlag = undefined;
function IsRenderChainEventSupported() {
    if (isRenderChainEventSupportedFlag !== undefined) {
        return isRenderChainEventSupportedFlag;
    }
    let sdkVersion = APJS.getEngineVersion();
    sdkVersion = sdkVersion.replace(/\./g, '');
    console.log(sdkVersion);
    const renderChainStandardVersion = '1400';
    const sdkVersionToNum = parseInt(sdkVersion);
    const standardVersionToNum = parseInt(renderChainStandardVersion);
    console.log(sdkVersionToNum);
    console.log(standardVersionToNum);
    isRenderChainEventSupportedFlag = sdkVersionToNum >= standardVersionToNum;
    if (isRenderChainEventSupportedFlag) {
        console.log('true');
    }
    else {
        console.log('false');
    }
    return isRenderChainEventSupportedFlag;
}
exports.IsRenderChainEventSupported = IsRenderChainEventSupported;
class RenderingUtil {
    static createShaderPass(shaders) {
        const pass = new APJS.Pass();
        pass.shaders = shaders;
        const sem = new APJS.Map();
        sem.insert('inPosition', APJS.VertexAttribType.POSITION);
        sem.insert('inTexCoord', APJS.VertexAttribType.TEXCOORD0);
        pass.semantics = sem;
        return pass;
    }
    static createScreenMaterial(shaders) {
        const pass = this.createShaderPass(shaders);
        pass.viewportRect = new APJS.Rect(0, 0, 1, 1);
        return this.createMaterial(pass);
    }
    static createMaterial(pass) {
        const material = new APJS.Material();
        material.mainPass = pass;
        return material;
    }
    static createRenderTexture() {
        const rt = new APJS.RenderTextureCreateDesc();
        rt.depth = 1;
        rt.width = 640;
        rt.height = 360;
        rt.filterMag = APJS.FilterMode.Linear;
        rt.filterMin = APJS.FilterMode.Linear;
        rt.filterMipmap = APJS.FilterMipmapMode.None;
        rt.attachment = APJS.RenderTextureAttachment.NONE;
        return APJS.TextureUtils.createRenderTexture(rt);
    }
    static createRenderTexturePlus(width, height, colorFormat, filterMode) {
        const rt = new APJS.RenderTextureCreateDesc();
        rt.builtinType = APJS.BuiltInTextureType.NORAML;
        rt.internalFormat = APJS.InternalFormat.RGBA8;
        rt.dataType = APJS.DataType.U8norm;
        rt.depth = 1;
        rt.attachment = APJS.RenderTextureAttachment.DEPTH24;
        rt.filterMag = filterMode;
        rt.filterMin = filterMode;
        rt.filterMipmap = APJS.FilterMipmapMode.None;
        rt.width = width;
        rt.height = height;
        rt.colorFormat = colorFormat;
        return APJS.TextureUtils.createRenderTexture(rt);
    }
    static createScreenRenderTexture() {
        const rt = new APJS.ScreenTextureCreateDesc();
        rt.builtinType = APJS.BuiltInTextureType.NORAML;
        rt.internalFormat = APJS.InternalFormat.RGBA8;
        rt.dataType = APJS.DataType.U8norm;
        rt.depth = 1;
        rt.attachment = APJS.RenderTextureAttachment.DEPTH24;
        rt.filterMag = APJS.FilterMode.Linear;
        rt.filterMin = APJS.FilterMode.Linear;
        rt.filterMipmap = APJS.FilterMipmapMode.None;
        rt.pecentX = 1.0;
        rt.pecentY = 1.0;
        rt.colorFormat = APJS.PixelFormat.RGBA8Unorm;
        return APJS.TextureUtils.createScreenTexture(rt);
    }
    static createTexture2D() {
        const tex = new APJS.Texture2DCreateDesc();
        tex.filterMin = APJS.FilterMode.Linear;
        tex.filterMag = APJS.FilterMode.Linear;
        return APJS.TextureUtils.createTexture2D(tex);
    }
    static createShaders(shaders) {
        const shaderMap = new APJS.Map();
        for (const backend in shaders) {
            const vs = new APJS.Shader();
            vs.type = APJS.ShaderType.Vertex;
            vs.source = shaders[backend].vs;
            const ps = new APJS.Shader();
            ps.type = APJS.ShaderType.Fragment;
            ps.source = shaders[backend].fs;
            const shaderList = new APJS.Vector();
            shaderList.insert(0, vs);
            shaderList.insert(1, ps);
            shaderMap.insert(backend, shaderList);
        }
        return shaderMap;
    }
    static createEmptyMaterial() {
        const emptyMaterial = new APJS.Material();
        return emptyMaterial;
    }
    static addPassToMaterial(material, shaders, stencilMasked, blending = false) {
        const newPass = new APJS.Pass();
        const shaderMap = new APJS.Map();
        for (const backend in shaders) {
            const vs = new APJS.Shader();
            vs.type = APJS.ShaderType.Vertex;
            vs.source = shaders[backend].vs;
            const fs = new APJS.Shader();
            fs.type = APJS.ShaderType.Fragment;
            fs.source = shaders[backend].fs;
            const shaderVec = new APJS.Vector();
            shaderVec.pushBack(vs);
            shaderVec.pushBack(fs);
            shaderMap.insert(backend, shaderVec);
        }
        newPass.shaders = shaderMap;
        const semantics = new APJS.Map();
        semantics.insert('inPosition', APJS.VertexAttribType.POSITION);
        semantics.insert('inTexCoord', APJS.VertexAttribType.TEXCOORD0);
        newPass.semantics = semantics;
        const stencilState = new APJS.StencilState();
        newPass.depthTest = false;
        newPass.stencilState = stencilState;
        if (stencilMasked) {
            stencilState.enable = true;
            stencilState.compareFunction = APJS.StencilFunction.Equal;
            stencilState.referenceValue = 42;
            stencilState.writeMask = 0;
        }
        if (blending) {
            newPass.blendState = new APJS.BlendState();
            const colorBlend = newPass.blendState;
            colorBlend.enabled = blending;
            colorBlend.srcColorFactor = APJS.BlendFactor.SrcAlpha;
            colorBlend.dstColorFactor = APJS.BlendFactor.OneMinusSrcAlpha;
            colorBlend.srcAlphaFactor = APJS.BlendFactor.SrcAlpha;
            colorBlend.dstAlphaFactor = APJS.BlendFactor.OneMinusSrcAlpha;
            colorBlend.colorBlendOperation = APJS.BlendOperation.Add;
            colorBlend.alphaBlendOperation = APJS.BlendOperation.Add;
        }
        const passes = material.passes;
        passes.push(newPass);
        material.passes = passes;
        return newPass;
    }
}
exports.RenderingUtil = RenderingUtil;
function deserializeJsonObject(json) {
    if (json && json.x !== undefined && json.y !== undefined) {
        if (json.width !== undefined && json.height !== undefined) {
            return new APJS.Rect(json.x, json.y, json.width, json.height);
        }
        return new APJS.Vector2f(json.x, json.y);
    }
    return json;
}
class JSAssetScriptBase {
    get screenMesh() {
        if (!this._screenMesh && this.getMgrInstanceFunc) {
            const mgr = this.getMgrInstanceFunc();
            this._screenMesh = mgr === null || mgr === void 0 ? void 0 : mgr.getDefaultScreenMesh();
        }
        return this._screenMesh;
    }
    get cmdBufferHelper() {
        if (!this._cmdBufferHelper && this.getMgrInstanceFunc) {
            const mgr = this.getMgrInstanceFunc();
            this._cmdBufferHelper = mgr === null || mgr === void 0 ? void 0 : mgr.getDefaultCmdBufferHelper();
        }
        return this._cmdBufferHelper;
    }
    constructor() {
        this._isRunTime = false;
        this.getMgrInstanceFunc = undefined;
        this._instantiatedObjectsNum = 0;
        this._canBeRemovedDynamically = false;
        this._uuid = undefined;
    }
    get uuid() {
        return this._uuid;
    }
    set uuid(value) {
        this._uuid = value;
    }
    get isRunTime() {
        return this._isRunTime;
    }
    set isRunTime(value) {
        this._isRunTime = value;
    }
    get canBeRemovedDynamically() {
        return this._canBeRemovedDynamically;
    }
    set canBeRemovedDynamically(value) {
        this._canBeRemovedDynamically = value;
    }
    get scene() {
        return this._scene;
    }
    set scene(value) {
        this._scene = value;
    }
    get mainObject() {
        return this._mainObject;
    }
    set mainObject(value) {
        this._mainObject = value;
    }
    get instantiatedObjectsNum() {
        return this._instantiatedObjectsNum;
    }
    init(reg) { }
    loadFromConfig(config) {
        var _a;
        const assetMgr = (_a = this.scene) === null || _a === void 0 ? void 0 : _a.assetManager;
        const properties = config.properties;
        const preloadProperties = config.preloadProperties;
        let preloadLength = 0;
        if (preloadProperties !== undefined) {
            preloadLength = preloadProperties.length;
        }
        if (properties && assetMgr) {
            for (const key in properties) {
                let propertyIsPreloaded = false;
                for (let i = 0; i < preloadLength; i++) {
                    const preloadKey = preloadProperties[i];
                    if (key === preloadKey) {
                        propertyIsPreloaded = true;
                        break;
                    }
                }
                const value = deserializeJsonObject(properties[key]);
                if (typeof value === 'string') {
                    const fullpath = assetMgr.rootDir + value;
                    if (fs.accessSync(fullpath, 0)) {
                        let engineObject = null;
                        if (propertyIsPreloaded === false) {
                            engineObject = assetMgr.load(value);
                        }
                        else {
                            if (assetMgr.getCustomAssetsPreloadProperty !== undefined) {
                                engineObject = assetMgr.getCustomAssetsPreloadProperty(config.uuid, key);
                            }
                        }
                        if (engineObject) {
                            this[key] = engineObject;
                        }
                        continue;
                    }
                }
                this[key] = value;
            }
        }
        this._uuid = config.uuid ? config.uuid : 'undefined';
        this.init();
    }
    instantiate() {
        return undefined;
    }
    isEditorEnv() {
        var _a, _b, _c, _d;
        return (((_d = (_c = (_b = (_a = this.scene) === null || _a === void 0 ? void 0 : _a.assetManager) === null || _b === void 0 ? void 0 : _b.getAllCustomAssetsProperty()) === null || _c === void 0 ? void 0 : _c.get(this.uuid)) === null || _d === void 0 ? void 0 : _d.get('EditorEnv')) === true);
    }
    onStart() { }
    onUpdate(delta, obj = undefined) { }
    onLateUpdate(delta) { }
    onEvent(event) { }
    onRelease() { }
    onDestroy() { }
}
exports.JSAssetScriptBase = JSAssetScriptBase;
