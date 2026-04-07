"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Custom = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, userPublicAPI, userPrivateAPI, EnterInternalScope, QuitInternalScope, hideAPIPrototype, dualInstanceProperty } = APJS;
const PostEffect_1 = require("./PostEffect");
const PostProcessUtils_1 = require("./PostProcessUtils");
let Custom = class Custom extends PostEffect_1.PostEffect {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.mName = 'Custom';
        this.pCustomMesh = null;
        this.mat = new APJS.Material();
        QuitInternalScope(this);
    }
    get material() {
        return this._material;
    }
    set material(value) {
        this.isEqual(value, this._material);
        this._material = value;
    }
    render(postProcessContext) {
        if (this.enabled) {
            const camera = postProcessContext.getCamera();
            const src = postProcessContext.getSource();
            const dst = postProcessContext.getDestination();
            if (this._material && this.pCustomMesh && camera && src && dst) {
                const customMat = this._material;
                const customMesh = this.pCustomMesh;
                const w = postProcessContext.getScreenWidth();
                const h = postProcessContext.getScreenHeight();
                this.updateMatKeys(customMat);
                if (this.dirty) {
                    this.createMaterialInstance(customMat, camera, w, h);
                    const rtConfig = postProcessContext.getRTConfig();
                    const colorFormat = APJS.PixelFormat.RGBA8Unorm;
                    this.commands.clearAll();
                    let passes = this.mat.passes;
                    if (passes && passes.length > 0) {
                        const pingpong1 = this.commands.propertyToID("_pingpong1");
                        const pingpong2 = this.commands.propertyToID("_pingpong2");
                        const pingpong = this.commands.propertyToID("_pingpong");
                        PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, w, h, colorFormat);
                        this.commands.getTemporaryRT(pingpong1, rtConfig, true);
                        this.commands.getTemporaryRT(pingpong2, rtConfig, true);
                        this.commands.getTemporaryRT(pingpong, rtConfig, true);
                        this.commands.blit(src, pingpong);
                        this.commands.setGlobalTexture("u_FBOTexture", pingpong);
                        this.commands.setGlobalTexture("_MainTex", pingpong);
                        this.commands.setGlobalTexture("u_CameraRT", pingpong);
                        for (let passNum = 0; passNum < passes.length; passNum++) {
                            if (passNum === passes.length - 1) {
                                this.commands.setRenderTexture(dst);
                                this.commands.drawMesh(customMesh, new APJS.Matrix4x4f(), this.mat, 0, passNum);
                            }
                            else {
                                this.commands.setRenderTexture(pingpong1);
                                this.commands.drawMesh(customMesh, new APJS.Matrix4x4f(), this.mat, 0, passNum);
                                this.commands.blit(pingpong1, pingpong2);
                                this.commands.setGlobalTexture("u_FBOTexture", pingpong2);
                            }
                        }
                        this.commands.releaseTemporaryRT(pingpong1);
                        this.commands.releaseTemporaryRT(pingpong2);
                        this.commands.releaseTemporaryRT(pingpong);
                    }
                    this.dirty = false;
                }
            }
            else if (this.dirty) {
                this.commands.clearAll();
                this.dirty = false;
            }
            const cam = postProcessContext.getCamera();
            if (cam)
                cam.getSceneObject().scene.commitCommandBuffer(this.commands);
        }
    }
    updateMatKeys(oldMat) {
        let floatKeys = oldMat.getFloatMapKeys();
        for (let i = 0; i < floatKeys.length; i++) {
            this.mat.setFloat(floatKeys[i], oldMat.getFloat(floatKeys[i]));
        }
        let vec2Keys = oldMat.getVector2MapKeys();
        for (let i = 0; i < vec2Keys.length; i++) {
            this.mat.setVector(vec2Keys[i], oldMat.getVector(vec2Keys[i]));
        }
        let vec3Keys = oldMat.getVector3MapKeys();
        for (let i = 0; i < vec3Keys.length; i++) {
            this.mat.setVector(vec3Keys[i], oldMat.getVector(vec3Keys[i]));
        }
        let vec4Keys = oldMat.getVector4MapKeys();
        for (let i = 0; i < vec4Keys.length; i++) {
            this.mat.setVector(vec4Keys[i], oldMat.getVector(vec4Keys[i]));
        }
        let intKeys = oldMat.getIntMapKeys();
        for (let i = 0; i < intKeys.length; i++) {
            this.mat.setInt(intKeys[i], oldMat.getInt(intKeys[i]));
        }
        let texKeys = oldMat.getTextureMapKeys();
        for (let i = 0; i < texKeys.length; i++) {
            this.mat.setTexture(texKeys[i], oldMat.getTexture(texKeys[i]));
        }
        let mat4Keys = oldMat.getMatrixMapKeys();
        for (let i = 0; i < mat4Keys.length; i++) {
            this.mat.setMatrix(mat4Keys[i], oldMat.getMatrix(mat4Keys[i]));
        }
        this.mat.copyMarcosFrom(oldMat);
    }
    createMaterialInstance(oldMat, camera, width, height) {
        this.mat.xshader = new APJS.XShader();
        this.mat = oldMat.instantiate();
        let passes = this.mat.passes;
        if (passes && passes.length > 0) {
            for (let passNum = 0; passNum < passes.length; passNum++) {
                this.mat.passes[passNum].depthTest = false;
                this.mat.passes[passNum].depthWrite = false;
            }
        }
        this.mat.setVector('u_WorldSpaceCameraPos', new APJS.Vector4f(1.0, 1.0, 1.0, 1.0));
        this.mat.setVector('u_ScreenParams', new APJS.Vector4f(width, height, 1.0 + 1.0 / width, 1.0 + 1.0 / height));
        let matrixList = ['u_MVP', 'u_MV', 'u_View', 'u_InvView', 'u_Projection', 'u_VP',
            'u_TransposeMV', 'u_InvTransposeMV', 'u_Model', 'u_InvModel',
            'u_TransposeInvModel', 'u_CameraInvProjection'];
        const trans = new APJS.Matrix4x4f();
        for (let matrixName of matrixList) {
            this.mat.setMatrix(matrixName, trans);
        }
        let macroList = ['AE_AMAZING_USE_BONES'];
        for (let macro of macroList) {
            this.mat.disableMacro(macro);
        }
        this.mat.enableMacro('AE_DirLightNum', 1);
        this.mat.setFloat('u_DirLightNum', 1);
        this.mat.setFloat('u_PointLightNum', 0);
        this.mat.setFloat('u_SpotLightNum', 0);
        const dirLightsEnabled = [1];
        this.mat.setMultiValue('u_DirLightsEnabled', dirLightsEnabled, 1, 1, dirLightsEnabled.length);
        let floatArryBuf = [0.0, 1.0, 0.0];
        this.mat.setMultiValue('u_DirLightsDirection', floatArryBuf, 1, 3, floatArryBuf.length / 3);
        floatArryBuf = [1.0, 1.0, 1.0];
        this.mat.setMultiValue('u_DirLightsColor', floatArryBuf, 1, 3, floatArryBuf.length / 3);
        const dirLightsIntensity = [1.0];
        this.mat.setMultiValue('u_DirLightsIntensity', dirLightsIntensity, 1, 1, dirLightsIntensity.length);
        const entities = camera.getSceneObject().scene.getAllSceneObjects();
        for (let i = 0; i < entities.length; i++) {
            let currEntity = entities[i];
            let component = currEntity.getComponent("EnvironmentLight");
            if (component) {
                this.mat.setTexture("_RadianceTexture", component.environmentMap);
                this.mat.setFloat("_EnvironmentIntensity", component.intensity);
                this.mat.setFloat("_EnvironmentRotation", component.rotation);
                this.mat.setFloatArray("_Coefficients", component.environmentMap.getControl().coefficients);
                this.mat.setColor("_EnvironmentTintColor", component.color);
            }
        }
    }
};
__decorate([
    serialize
], Custom.prototype, "pCustomMesh", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Custom.prototype, "material", null);
__decorate([
    userPrivateAPI()
], Custom.prototype, "render", null);
Custom = __decorate([
    registerClass()
], Custom);
exports.Custom = Custom;
hideAPIPrototype(Custom);
