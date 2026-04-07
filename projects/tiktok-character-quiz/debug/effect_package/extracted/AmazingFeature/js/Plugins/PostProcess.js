"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostProcess = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, userPublicAPI, userPrivateAPI, hideAPIPrototype, EnterInternalScope, QuitInternalScope } = APJS;
const PostProcessRenderContext_1 = require("./PostProcessRenderContext");
const PostEffect_1 = require("./PostEffect");
const BokehBlur_1 = require("./BokehBlur");
const PostProcessTypeSet = new Set([
    'bloom',
    'fxaa',
    'chromaticAberration',
    'distort',
    'grain',
    'vignette',
    'lensFlare',
    'motionBlur',
    'bokehBlur',
    'custom',
]);
let PostProcess = class PostProcess extends APJS.DynamicComponent {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.bloom = null;
        this.bokehBlur = null;
        this.chromaticAberration = null;
        this.custom = null;
        this.distort = null;
        this.fxaa = null;
        this.grain = null;
        this.lensFlare = null;
        this.motionBlur = null;
        this.vignette = null;
        this.renderContext = new PostProcessRenderContext_1.PostProcessRenderContext();
        this.name = 'PostProcess';
        QuitInternalScope(this);
    }
    onStart() {
        const camera = this.getSceneObject().getComponent('Camera');
        if (camera && camera.renderTexture) {
            this.renderContext.setCamera(camera);
            this.renderContext.setSource(camera.renderTexture);
            this.renderContext.setDestination(camera.renderTexture);
            this.renderContext.setScreenWidth(camera.renderTexture.getWidth());
            this.renderContext.setScreenHeight(camera.renderTexture.getHeight());
            this.enabled = true;
            APJS.EventManager.getObjectEmitter(camera).on(APJS.CameraEvent.RENDER_IMAGE_EFFECTS, this.onRender, this);
        }
    }
    onRender() {
        const sceneObj = this.getSceneObject();
        if (!this.enabled || !sceneObj.enabled) {
            return;
        }
        this.updateRenderContext();
        PostProcessTypeSet.forEach((value) => {
            const effect = this[value];
            if (effect && effect instanceof PostEffect_1.PostEffect)
                effect.render(this.renderContext);
        });
    }
    onDestroy() {
        const camera = this.renderContext.getCamera();
        if (camera && camera.renderTexture) {
            APJS.EventManager.getObjectEmitter(camera).off(APJS.CameraEvent.RENDER_IMAGE_EFFECTS, this.onRender, this);
        }
    }
    updateRenderContext() {
        const camera = this.renderContext.getCamera();
        if (camera) {
            const screenWidth = camera.renderTexture.getWidth();
            const screenHeight = camera.renderTexture.getHeight();
            if (screenWidth !== this.renderContext.getScreenWidth() || screenHeight !== this.renderContext.getScreenHeight()) {
                this.renderContext.setScreenWidth(screenWidth);
                this.renderContext.setScreenHeight(screenHeight);
                PostProcessTypeSet.forEach((value) => {
                    const effect = this[value];
                    if (effect && effect instanceof PostEffect_1.PostEffect)
                        effect.dirty = true;
                });
            }
        }
    }
    get pBloomEnable() { var _a, _b; return (_b = (_a = this.bloom) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : true; }
    set pBloomEnable(val) { if (this.bloom)
        this.bloom.enabled = val; }
    get pBloomFastMode() { var _a, _b; return (_b = (_a = this.bloom) === null || _a === void 0 ? void 0 : _a.fastMode) !== null && _b !== void 0 ? _b : true; }
    set pBloomFastMode(val) { if (this.bloom)
        this.bloom.fastMode = val; }
    get pBloomThreshold() { var _a, _b; return (_b = (_a = this.bloom) === null || _a === void 0 ? void 0 : _a.threshold) !== null && _b !== void 0 ? _b : 0.8; }
    set pBloomThreshold(val) { if (this.bloom)
        this.bloom.threshold = val; }
    get pBloomColor() {
        var _a, _b;
        return ((_b = (_a = this.bloom) === null || _a === void 0 ? void 0 : _a.color) !== null && _b !== void 0 ? _b : new APJS.Color(1.0, 1.0, 1.0, 1.0));
    }
    set pBloomColor(val) { if (this.bloom)
        this.bloom.color = val; }
    get pBloomDiffuse() { var _a, _b; return (_b = (_a = this.bloom) === null || _a === void 0 ? void 0 : _a.diffuse) !== null && _b !== void 0 ? _b : 4.5; }
    set pBloomDiffuse(val) { if (this.bloom)
        this.bloom.diffuse = val; }
    get pBloomIntensity() { var _a, _b; return (_b = (_a = this.bloom) === null || _a === void 0 ? void 0 : _a.intensity) !== null && _b !== void 0 ? _b : 10.0; }
    set pBloomIntensity(val) { if (this.bloom)
        this.bloom.intensity = val; }
    get pBloomSoftknee() { var _a, _b; return (_b = (_a = this.bloom) === null || _a === void 0 ? void 0 : _a.softKnee) !== null && _b !== void 0 ? _b : 0.2; }
    set pBloomSoftknee(val) { if (this.bloom)
        this.bloom.softKnee = val; }
    get pBloomClamp() { var _a, _b; return (_b = (_a = this.bloom) === null || _a === void 0 ? void 0 : _a.clamp) !== null && _b !== void 0 ? _b : 65513; }
    set pBloomClamp(val) { if (this.bloom)
        this.bloom.clamp = val; }
    get pBloomAnamorphicRatio() { var _a, _b; return (_b = (_a = this.bloom) === null || _a === void 0 ? void 0 : _a.anamorphicRatio) !== null && _b !== void 0 ? _b : 0.0; }
    set pBloomAnamorphicRatio(val) { if (this.bloom)
        this.bloom.anamorphicRatio = val; }
    get pFxaaEnable() { var _a, _b; return (_b = (_a = this.fxaa) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : true; }
    set pFxaaEnable(val) { if (this.fxaa)
        this.fxaa.enabled = val; }
    get pChromaticAberrationEnable() { var _a, _b; return (_b = (_a = this.chromaticAberration) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : true; }
    set pChromaticAberrationEnable(val) { if (this.chromaticAberration)
        this.chromaticAberration.enabled = val; }
    get pSpectralLut() {
        var _a, _b;
        return (_b = (_a = this.chromaticAberration) === null || _a === void 0 ? void 0 : _a.spectralLUT) !== null && _b !== void 0 ? _b : null;
    }
    set pSpectralLut(val) { if (this.chromaticAberration)
        this.chromaticAberration.spectralLUT = val; }
    get pFastChromaticAberration() { var _a, _b; return (_b = (_a = this.chromaticAberration) === null || _a === void 0 ? void 0 : _a.fastMode) !== null && _b !== void 0 ? _b : false; }
    set pFastChromaticAberration(val) { if (this.chromaticAberration)
        this.chromaticAberration.fastMode = val; }
    get pChromaticAberrationIntensity() { var _a, _b; return (_b = (_a = this.chromaticAberration) === null || _a === void 0 ? void 0 : _a.intensity) !== null && _b !== void 0 ? _b : 1.0; }
    set pChromaticAberrationIntensity(val) { if (this.chromaticAberration)
        this.chromaticAberration.intensity = val; }
    get pDistortEnable() { var _a, _b; return (_b = (_a = this.distort) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : true; }
    set pDistortEnable(val) { if (this.distort)
        this.distort.enabled = val; }
    get pDistortBarrelPower() { var _a, _b; return (_b = (_a = this.distort) === null || _a === void 0 ? void 0 : _a.barrelPower) !== null && _b !== void 0 ? _b : -0.2; }
    set pDistortBarrelPower(val) { if (this.distort)
        this.distort.barrelPower = val; }
    get pDistortRotation() { var _a, _b; return (_b = (_a = this.distort) === null || _a === void 0 ? void 0 : _a.rotation) !== null && _b !== void 0 ? _b : 0.0; }
    set pDistortRotation(val) { if (this.distort)
        this.distort.rotation = val; }
    get pDistortZoom() { var _a, _b; return (_b = (_a = this.distort) === null || _a === void 0 ? void 0 : _a.zoom) !== null && _b !== void 0 ? _b : 0.2; }
    set pDistortZoom(val) { if (this.distort)
        this.distort.zoom = val; }
    get pDistortAmplitude() {
        var _a, _b;
        return ((_b = (_a = this.distort) === null || _a === void 0 ? void 0 : _a.amplitude) !== null && _b !== void 0 ? _b : new APJS.Vector2f(-0.1, 0.0));
    }
    set pDistortAmplitude(val) { if (this.distort)
        this.distort.amplitude = val; }
    get pDistortFrequency() {
        var _a, _b;
        return ((_b = (_a = this.distort) === null || _a === void 0 ? void 0 : _a.frequency) !== null && _b !== void 0 ? _b : new APJS.Vector2f(9.0, 0.0));
    }
    set pDistortFrequency(val) { if (this.distort)
        this.distort.frequency = val; }
    get pDistortSpeed() {
        var _a, _b;
        return ((_b = (_a = this.distort) === null || _a === void 0 ? void 0 : _a.speed) !== null && _b !== void 0 ? _b : new APJS.Vector2f(0.8, 0.0));
    }
    set pDistortSpeed(val) { if (this.distort)
        this.distort.speed = val; }
    get pDistortOffset() {
        var _a, _b;
        return ((_b = (_a = this.distort) === null || _a === void 0 ? void 0 : _a.offset) !== null && _b !== void 0 ? _b : new APJS.Vector2f(0.0, 0.0));
    }
    set pDistortOffset(val) { if (this.distort)
        this.distort.offset = val; }
    get pGrainEnable() { var _a, _b; return (_b = (_a = this.grain) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : true; }
    set pGrainEnable(val) { if (this.grain)
        this.grain.enabled = val; }
    get pGrainStrength() { var _a, _b; return (_b = (_a = this.grain) === null || _a === void 0 ? void 0 : _a.strength) !== null && _b !== void 0 ? _b : 0.5; }
    set pGrainStrength(val) { if (this.grain)
        this.grain.strength = val; }
    get pGrainColor() { var _a, _b; return (_b = (_a = this.grain) === null || _a === void 0 ? void 0 : _a.color) !== null && _b !== void 0 ? _b : 0.5; }
    set pGrainColor(val) { if (this.grain)
        this.grain.color = val; }
    get pGrainSpeed() { var _a, _b; return (_b = (_a = this.grain) === null || _a === void 0 ? void 0 : _a.speed) !== null && _b !== void 0 ? _b : 5.0; }
    set pGrainSpeed(val) { if (this.grain)
        this.grain.speed = val; }
    get pVignetteEnable() { var _a, _b; return (_b = (_a = this.vignette) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : true; }
    set pVignetteEnable(val) { if (this.vignette)
        this.vignette.enabled = val; }
    get pVignettePower() { var _a, _b; return (_b = (_a = this.vignette) === null || _a === void 0 ? void 0 : _a.power) !== null && _b !== void 0 ? _b : 1.0; }
    set pVignettePower(val) { if (this.vignette)
        this.vignette.power = val; }
    get pVignetteContrast() { var _a, _b; return (_b = (_a = this.vignette) === null || _a === void 0 ? void 0 : _a.contrast) !== null && _b !== void 0 ? _b : 1.5; }
    set pVignetteContrast(val) { if (this.vignette)
        this.vignette.contrast = val; }
    get pBokehBlurEnable() { var _a, _b; return (_b = (_a = this.bokehBlur) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : true; }
    set pBokehBlurEnable(val) { if (this.bokehBlur)
        this.bokehBlur.enabled = val; }
    get pBokehBlurSize() { var _a, _b; return (_b = (_a = this.bokehBlur) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 4.0; }
    set pBokehBlurSize(val) { if (this.bokehBlur)
        this.bokehBlur.size = val; }
    get pBokehBlurIteration() { var _a, _b; return (_b = (_a = this.bokehBlur) === null || _a === void 0 ? void 0 : _a.iterations) !== null && _b !== void 0 ? _b : 2; }
    set pBokehBlurIteration(val) { if (this.bokehBlur)
        this.bokehBlur.iterations = val; }
    get pBokehBlurShape() {
        var _a, _b;
        return ((_b = (_a = this.bokehBlur) === null || _a === void 0 ? void 0 : _a.shape) !== null && _b !== void 0 ? _b : BokehBlur_1.BokehBlurShapeType.Hexagon);
    }
    set pBokehBlurShape(val) { if (this.bokehBlur)
        this.bokehBlur.shape = val; }
    get pBokehBlurFastCircle() { var _a, _b; return (_b = (_a = this.bokehBlur) === null || _a === void 0 ? void 0 : _a.fastCircle) !== null && _b !== void 0 ? _b : false; }
    set pBokehBlurFastCircle(val) { if (this.bokehBlur)
        this.bokehBlur.fastCircle = val; }
    get pBokehBlurDownSample() { var _a, _b; return (_b = (_a = this.bokehBlur) === null || _a === void 0 ? void 0 : _a.downsample) !== null && _b !== void 0 ? _b : 2; }
    set pBokehBlurDownSample(val) { if (this.bokehBlur)
        this.bokehBlur.downsample = val; }
    get pLensFlareEnable() { var _a, _b; return (_b = (_a = this.lensFlare) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : true; }
    set pLensFlareEnable(val) { if (this.lensFlare)
        this.lensFlare.enabled = val; }
    get pLensFlareIntensity() { var _a, _b; return (_b = (_a = this.lensFlare) === null || _a === void 0 ? void 0 : _a.intensity) !== null && _b !== void 0 ? _b : 0.5; }
    set pLensFlareIntensity(val) { if (this.lensFlare)
        this.lensFlare.intensity = val; }
    get pLensFlarePosition() {
        var _a, _b;
        return ((_b = (_a = this.lensFlare) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : new APJS.Vector2f(0.7, 0.3));
    }
    set pLensFlarePosition(val) { if (this.lensFlare)
        this.lensFlare.position = val; }
    get pMotionBlurEnable() { var _a, _b; return (_b = (_a = this.motionBlur) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : true; }
    set pMotionBlurEnable(val) { if (this.motionBlur)
        this.motionBlur.enabled = val; }
    get pStrength() { var _a, _b; return (_b = (_a = this.motionBlur) === null || _a === void 0 ? void 0 : _a.intensity) !== null && _b !== void 0 ? _b : 0.9; }
    set pStrength(val) { if (this.motionBlur)
        this.motionBlur.intensity = val; }
    get pCustomEnable() { var _a, _b; return (_b = (_a = this.custom) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : true; }
    set pCustomEnable(val) { if (this.custom)
        this.custom.enabled = val; }
    get pCustomMaterial() {
        var _a, _b;
        return (_b = (_a = this.custom) === null || _a === void 0 ? void 0 : _a.material) !== null && _b !== void 0 ? _b : null;
    }
    set pCustomMaterial(val) { if (this.custom)
        this.custom.material = val; }
};
__decorate([
    userPublicAPI(),
    serialize
], PostProcess.prototype, "bloom", void 0);
__decorate([
    userPublicAPI(),
    serialize
], PostProcess.prototype, "bokehBlur", void 0);
__decorate([
    userPublicAPI(),
    serialize
], PostProcess.prototype, "chromaticAberration", void 0);
__decorate([
    userPublicAPI(),
    serialize
], PostProcess.prototype, "custom", void 0);
__decorate([
    userPublicAPI(),
    serialize
], PostProcess.prototype, "distort", void 0);
__decorate([
    userPublicAPI(),
    serialize
], PostProcess.prototype, "fxaa", void 0);
__decorate([
    userPublicAPI(),
    serialize
], PostProcess.prototype, "grain", void 0);
__decorate([
    userPublicAPI(),
    serialize
], PostProcess.prototype, "lensFlare", void 0);
__decorate([
    userPublicAPI(),
    serialize
], PostProcess.prototype, "motionBlur", void 0);
__decorate([
    userPublicAPI(),
    serialize
], PostProcess.prototype, "vignette", void 0);
__decorate([
    userPrivateAPI()
], PostProcess.prototype, "onStart", null);
__decorate([
    userPrivateAPI()
], PostProcess.prototype, "onRender", null);
__decorate([
    userPrivateAPI()
], PostProcess.prototype, "onDestroy", null);
__decorate([
    userPrivateAPI()
], PostProcess.prototype, "updateRenderContext", null);
PostProcess = __decorate([
    registerClass()
], PostProcess);
exports.PostProcess = PostProcess;
hideAPIPrototype(PostProcess);
