"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromaticAberration = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, getNativeFromObj, userPublicAPI, userPrivateAPI, EnterInternalScope, QuitInternalScope, hideAPIPrototype, dualInstanceProperty } = APJS;
const PostEffect_1 = require("./PostEffect");
const PostProcessUtils_1 = require("./PostProcessUtils");
let ChromaticAberration = class ChromaticAberration extends PostEffect_1.PostEffect {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.mName = 'ChromaticAberration';
        this.pFastChromaticAberration = false;
        this.pChromaticAberrationIntensity = 0.7;
        this.pSpectralLut = null;
        this.chromaticAberrationSpectralLut = null;
        this.pingPongRT = null;
        this.fastModeAndIntensityAndRTSize = new APJS.Vector4f(0.0, 0.0, 1.0, 1.0);
        QuitInternalScope(this);
    }
    get fastMode() {
        return this.pFastChromaticAberration;
    }
    set fastMode(value) {
        this.isEqual(value, this.pFastChromaticAberration);
        this.pFastChromaticAberration = value;
    }
    get intensity() {
        return this.pChromaticAberrationIntensity;
    }
    set intensity(value) {
        this.isEqual(value, this.pChromaticAberrationIntensity);
        this.pChromaticAberrationIntensity = value;
    }
    get spectralLUT() {
        return this.pSpectralLut;
    }
    set spectralLUT(value) {
        if (effect.Amaz.EditorSDK === 1 && APJS.EngineState.isEditorEnv) {
            this.isEqual(value, this.pSpectralLut);
            this.pSpectralLut = value;
        }
        else {
            console.error('spectralLUT is deprecated, can not be used at runtime.');
        }
    }
    render(postProcessContext) {
        const enable = this.enabled;
        const width = postProcessContext.getScreenWidth();
        const height = postProcessContext.getScreenHeight();
        const src = postProcessContext.getSource();
        const dst = postProcessContext.getDestination();
        if (this.pFastChromaticAberration !== null) {
            this.fastModeAndIntensityAndRTSize.x = (this.pFastChromaticAberration && 1.0) || 0.0;
        }
        if (this.pChromaticAberrationIntensity !== null) {
            this.fastModeAndIntensityAndRTSize.y = this.pChromaticAberrationIntensity * 0.05;
        }
        this.fastModeAndIntensityAndRTSize.z = width;
        this.fastModeAndIntensityAndRTSize.w = height;
        const mat = this._material;
        if (enable && mat && src && dst) {
            const material = mat;
            material.setVector('u_FastModeAndIntensityAndRTSize', this.fastModeAndIntensityAndRTSize);
            if (this.dirty) {
                this.commands.clearAll();
                const rtConfig = postProcessContext.getRTConfig();
                if (this.pSpectralLut === null || getNativeFromObj(this.pSpectralLut) === 'None') {
                    if (this.chromaticAberrationSpectralLut === null) {
                        this.chromaticAberrationSpectralLut = PostProcessUtils_1.PostProcessUtils.createLUT(width, height);
                        this.commands.blitWithMaterial(src, this.chromaticAberrationSpectralLut, material, 0, false);
                    }
                    material.setTexture('u_SpectralLUT', this.chromaticAberrationSpectralLut);
                }
                else {
                    material.setTexture('u_SpectralLUT', this.pSpectralLut);
                }
                this.pingPongRT = this.commands.propertyToID('_pingPongRT');
                PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, width, height);
                this.commands.getTemporaryRT(this.pingPongRT, rtConfig, true);
                if (this.pSpectralLut === null || getNativeFromObj(this.pSpectralLut) === 'None') {
                    this.commands.blitWithMaterial(src, this.pingPongRT, material, 1, false);
                }
                else {
                    this.commands.blitWithMaterial(src, this.pingPongRT, material, 0, false);
                }
                this.commands.blit(this.pingPongRT, dst);
                this.commands.releaseTemporaryRT(this.pingPongRT);
                this.dirty = false;
            }
        }
        else {
            if (this.dirty) {
                this.commands.clearAll();
                this.dirty = false;
            }
        }
        const cam = postProcessContext.getCamera();
        if (cam)
            cam.getSceneObject().scene.commitCommandBuffer(this.commands);
    }
};
__decorate([
    serialize
], ChromaticAberration.prototype, "pFastChromaticAberration", void 0);
__decorate([
    serialize
], ChromaticAberration.prototype, "pChromaticAberrationIntensity", void 0);
__decorate([
    serialize
], ChromaticAberration.prototype, "pSpectralLut", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], ChromaticAberration.prototype, "fastMode", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], ChromaticAberration.prototype, "intensity", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], ChromaticAberration.prototype, "spectralLUT", null);
__decorate([
    userPrivateAPI()
], ChromaticAberration.prototype, "render", null);
ChromaticAberration = __decorate([
    registerClass()
], ChromaticAberration);
exports.ChromaticAberration = ChromaticAberration;
hideAPIPrototype(ChromaticAberration);
