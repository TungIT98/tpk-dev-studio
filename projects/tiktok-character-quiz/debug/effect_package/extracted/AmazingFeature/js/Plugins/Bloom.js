"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bloom = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, PixelFormat, userPublicAPI, userPrivateAPI, hideAPIPrototype, EnterInternalScope, QuitInternalScope, dualInstanceProperty } = APJS;
const PostEffect_1 = require("./PostEffect");
const PostProcessUtils_1 = require("./PostProcessUtils");
const u_textureSize = 'u_texture_size';
const u_BloomColor = 'u_bloom_color';
const u_BloomIntensity = 'u_intensity';
const u_ExtractBrightThresholdHDR = 'u_threshold';
const u_ExtractBrightClampHDR = 'u_clamp';
const u_SampleScale = 'u_sample_scale';
const ExtractBright = 0;
const DownSample = 1;
const UpSample = 2;
const UpSampleFinal = 3;
const BloomPass = 4;
let Bloom = class Bloom extends PostEffect_1.PostEffect {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.mName = 'Bloom';
        this.pBloomColor = new APJS.Color(1.0, 1.0, 1.0, 1.0);
        this.pBloomIntensity = 6.5;
        this.pBloomThreshold = 0.8;
        this.pBloomSoftknee = 0.2;
        this.pBloomClamp = 65565;
        this.pBloomAnamorphicRatio = 0.0;
        this.pBloomFastMode = true;
        this.pBloomDiffuse = 10.0;
        QuitInternalScope(this);
    }
    get color() {
        return this.pBloomColor;
    }
    set color(value) {
        this.isEqual(value, this.pBloomColor);
        this.pBloomColor = value;
    }
    get intensity() {
        return this.pBloomIntensity;
    }
    set intensity(value) {
        this.isEqual(value, this.pBloomIntensity);
        this.pBloomIntensity = value;
    }
    get threshold() {
        return this.pBloomThreshold;
    }
    set threshold(value) {
        this.isEqual(value, this.pBloomThreshold);
        this.pBloomThreshold = value;
    }
    get softKnee() {
        return this.pBloomSoftknee;
    }
    set softKnee(value) {
        this.isEqual(value, this.pBloomSoftknee);
        this.pBloomSoftknee = value;
    }
    get clamp() {
        return this.pBloomClamp;
    }
    set clamp(value) {
        this.isEqual(value, this.pBloomClamp);
        this.pBloomClamp = value;
    }
    get anamorphicRatio() {
        return this.pBloomAnamorphicRatio;
    }
    set anamorphicRatio(value) {
        this.isEqual(value, this.pBloomAnamorphicRatio);
        this.pBloomAnamorphicRatio = value;
    }
    get fastMode() {
        return this.pBloomFastMode;
    }
    set fastMode(value) {
        if (effect.Amaz.EditorSDK === 1 && APJS.EngineState.isEditorEnv) {
            this.isEqual(value, this.pBloomFastMode);
            this.pBloomFastMode = value;
        }
        else {
            console.error('fast mode is deprecated, can not be used at runtime.');
        }
    }
    get diffuse() {
        return this.pBloomDiffuse;
    }
    set diffuse(value) {
        this.isEqual(value, this.pBloomDiffuse);
        this.pBloomDiffuse = value;
    }
    render(postProcessContext) {
        const mat = this._material;
        const src = postProcessContext.getSource();
        const dst = postProcessContext.getDestination();
        if (this.enabled && mat && src && dst) {
            const width = postProcessContext.getScreenWidth();
            const height = postProcessContext.getScreenHeight();
            const bloomMat = mat;
            let quality = 0;
            const lthresh = PostProcessUtils_1.PostProcessUtils.gammaToLinearSpace(this.pBloomThreshold);
            const knee = lthresh * this.pBloomSoftknee + 0.00001;
            const threshold = new APJS.Vector4f(lthresh, lthresh - knee, knee * 2.0, 0.25 / knee);
            const lclamp = PostProcessUtils_1.PostProcessUtils.gammaToLinearSpace(this.pBloomClamp);
            const bc = this.pBloomColor;
            const bloomColor = PostProcessUtils_1.PostProcessUtils.gammaToLinearSpaceColor(new APJS.Vector4f(bc.r, bc.g, bc.b, bc.a));
            let intensity = this.pBloomIntensity;
            intensity = Math.pow(2.4, intensity * 0.1) - 1.0;
            const ratio = this.pBloomAnamorphicRatio;
            let rw = 0;
            let rh = 0;
            if (ratio < 0)
                rw = -ratio;
            if (ratio > 0)
                rh = ratio;
            const tw = Math.floor(width / (2.0 - rw));
            const th = Math.floor(height / (2.0 - rh));
            const s = Math.max(tw, th);
            const logs = Math.log(s) / Math.log(2) + Math.min(10.0, this.pBloomDiffuse) - 10.0;
            const logs_i = Math.floor(logs);
            let iterations = Math.min(logs_i, 16);
            iterations = Math.max(iterations, 1);
            const sampleScale = 0.5 + logs - logs_i;
            let colorFormat = PixelFormat.RGBA8Unorm;
            bloomMat.setFloat(u_SampleScale, sampleScale);
            bloomMat.setVector(u_ExtractBrightThresholdHDR, threshold);
            bloomMat.setVector(u_ExtractBrightClampHDR, new APJS.Vector4f(lclamp, 0.0, 0.0, 0.0));
            bloomMat.setVector(u_BloomColor, new APJS.Vector4f(bloomColor.x, bloomColor.y, bloomColor.z, bloomColor.w));
            bloomMat.setVector(u_textureSize, new APJS.Vector2f(width, height));
            bloomMat.setFloat(u_BloomIntensity, intensity);
            if (this.dirty) {
                this.commands.clearAll();
                const rtConfig = postProcessContext.getRTConfig();
                let w = tw;
                let h = th;
                const extractLightRT = this.commands.propertyToID('_extractLightRT');
                PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, w, h, colorFormat);
                this.commands.getTemporaryRT(extractLightRT, rtConfig, true);
                this.commands.blitWithMaterial(src, extractLightRT, bloomMat, ExtractBright + quality, false);
                let samplerRT = extractLightRT;
                const downSampleRTs = [];
                const rtSizeMap = new Map();
                downSampleRTs.push(extractLightRT);
                rtSizeMap.set(extractLightRT, { width: w, height: h });
                for (let i = 1; i <= iterations - 1; ++i) {
                    const sheet = new APJS.MaterialPropertyBlock();
                    const vec2s = [];
                    vec2s.push(new APJS.Vector2f(w, h));
                    sheet.setVector2Array(u_textureSize, vec2s);
                    w = Math.floor(Math.max(1, w * 0.5));
                    h = Math.floor(Math.max(1, h * 0.5));
                    const downSamplerRT = this.commands.propertyToID('_downSamplerRT' + i);
                    PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, w, h, colorFormat);
                    rtSizeMap.set(downSamplerRT, { width: w, height: h });
                    this.commands.getTemporaryRT(downSamplerRT, rtConfig, true);
                    this.commands.blitWithMaterial(samplerRT, downSamplerRT, bloomMat, DownSample + quality, false, sheet);
                    samplerRT = downSamplerRT;
                    downSampleRTs.push(downSamplerRT);
                }
                samplerRT = downSampleRTs[iterations - 1];
                for (let i = iterations - 2; i >= 0; --i) {
                    const sheet = new APJS.MaterialPropertyBlock();
                    const vec2s = [];
                    let curRTSize = rtSizeMap.get(samplerRT);
                    vec2s.push(new APJS.Vector2f(curRTSize.width, curRTSize.height));
                    sheet.setVector2Array(u_textureSize, vec2s);
                    const downSampleRT = downSampleRTs[i];
                    this.commands.setGlobalTexture('_BloomTex', downSampleRT);
                    curRTSize = rtSizeMap.get(downSampleRT);
                    PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, curRTSize.width, curRTSize.height, colorFormat);
                    const upSamplerRT = this.commands.propertyToID('_upSamplerRT' + i);
                    rtSizeMap.set(upSamplerRT, { width: rtConfig.width, height: rtConfig.height });
                    this.commands.getTemporaryRT(upSamplerRT, rtConfig, true);
                    this.commands.blitWithMaterial(samplerRT, upSamplerRT, bloomMat, UpSample + quality, false, sheet);
                    samplerRT = upSamplerRT;
                }
                const sheet = new APJS.MaterialPropertyBlock();
                const vec2s = [];
                vec2s.push(new APJS.Vector2f(rtConfig.width, rtConfig.height));
                sheet.setVector2Array(u_textureSize, vec2s);
                const curRTSize = rtSizeMap.get(samplerRT);
                PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, curRTSize.width, curRTSize.height, colorFormat);
                const afterBloomRT = this.commands.propertyToID('_afterBloomRT');
                this.commands.getTemporaryRT(afterBloomRT, rtConfig, true);
                this.commands.blitWithMaterial(samplerRT, afterBloomRT, bloomMat, UpSampleFinal + quality, false, sheet);
                bloomMat.setTexture('_PreviewTex', src);
                const pingpong = this.commands.propertyToID('_pingpong');
                if (src.equals(dst)) {
                    PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, width, height, colorFormat);
                    this.commands.getTemporaryRT(pingpong, rtConfig, true);
                    this.commands.blitWithMaterial(afterBloomRT, pingpong, bloomMat, BloomPass, false);
                    this.commands.blit(pingpong, dst);
                }
                else {
                    this.commands.blitWithMaterial(afterBloomRT, dst, bloomMat, BloomPass, false);
                }
                postProcessContext.setSource(dst);
                this.dirty = false;
                rtSizeMap.forEach((value, key) => {
                    this.commands.releaseTemporaryRT(key);
                });
                this.commands.releaseTemporaryRT(afterBloomRT);
                this.commands.releaseTemporaryRT(pingpong);
                this.setupCommand = true;
            }
        }
        else if (this.dirty) {
            this.commands.clearAll();
            this.dirty = false;
        }
        if (this.setupCommand) {
            const cam = postProcessContext.getCamera();
            if (cam)
                cam.getSceneObject().scene.commitCommandBuffer(this.commands);
        }
    }
};
__decorate([
    serialize
], Bloom.prototype, "pBloomColor", void 0);
__decorate([
    serialize
], Bloom.prototype, "pBloomIntensity", void 0);
__decorate([
    serialize
], Bloom.prototype, "pBloomThreshold", void 0);
__decorate([
    serialize
], Bloom.prototype, "pBloomSoftknee", void 0);
__decorate([
    serialize
], Bloom.prototype, "pBloomClamp", void 0);
__decorate([
    serialize
], Bloom.prototype, "pBloomAnamorphicRatio", void 0);
__decorate([
    serialize
], Bloom.prototype, "pBloomFastMode", void 0);
__decorate([
    serialize
], Bloom.prototype, "pBloomDiffuse", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Bloom.prototype, "color", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Bloom.prototype, "intensity", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Bloom.prototype, "threshold", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Bloom.prototype, "softKnee", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Bloom.prototype, "clamp", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Bloom.prototype, "anamorphicRatio", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Bloom.prototype, "fastMode", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Bloom.prototype, "diffuse", null);
__decorate([
    userPrivateAPI()
], Bloom.prototype, "render", null);
Bloom = __decorate([
    registerClass()
], Bloom);
exports.Bloom = Bloom;
hideAPIPrototype(Bloom);
