"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LensFlare = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, userPublicAPI, userPrivateAPI, EnterInternalScope, QuitInternalScope, hideAPIPrototype, dualInstanceProperty } = APJS;
const PostEffect_1 = require("./PostEffect");
const PostProcessUtils_1 = require("./PostProcessUtils");
const u_pos = 'touchPos';
const u_noise = 'u_noise';
const u_intensity = 'u_intensity';
const u_ScreenParams = 'u_ScreenParams';
const LensFlarePass = 0;
let LensFlare = class LensFlare extends PostEffect_1.PostEffect {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.mName = 'LensFlare';
        this.pLensFlareIntensity = 0.5;
        this.pLensFlarePosition = new APJS.Vector2f(0.7, 0.3);
        this.lensFlareNoiseTex = null;
        QuitInternalScope(this);
    }
    get intensity() {
        return this.pLensFlareIntensity;
    }
    set intensity(value) {
        this.isEqual(value, this.pLensFlareIntensity);
        this.pLensFlareIntensity = value;
    }
    get position() {
        return this.pLensFlarePosition;
    }
    set position(value) {
        this.isEqual(value, this.pLensFlarePosition);
        this.pLensFlarePosition = value;
    }
    render(postProcessContext) {
        const enable = this.enabled;
        const tmp_pos = this.pLensFlarePosition;
        const pos = new APJS.Vector2f(tmp_pos.x - 0.5, tmp_pos.y - 0.5);
        const intensity = this.pLensFlareIntensity;
        const cam = postProcessContext.getCamera();
        const width = postProcessContext.getScreenWidth();
        const height = postProcessContext.getScreenHeight();
        const mat = this._material;
        const src = postProcessContext.getSource();
        const dst = postProcessContext.getDestination();
        if (enable && mat && cam && src && dst) {
            const lensFlareMat = mat;
            const assetMgr = cam.getSceneObject().scene.assetManager;
            if (this.lensFlareNoiseTex === null)
                this.lensFlareNoiseTex = assetMgr.load('image/lensflarenoise.png');
            lensFlareMat.setVector(u_pos, pos);
            lensFlareMat.setTexture(u_noise, this.lensFlareNoiseTex);
            lensFlareMat.setFloat(u_intensity, intensity);
            lensFlareMat.setVector(u_ScreenParams, new APJS.Vector4f(width, height, 1.0 / width, 1.0 / height));
            if (this.dirty) {
                this.commands.clearAll();
                const rtConfig = postProcessContext.getRTConfig();
                if (src && src.equals(dst)) {
                    const pingpong = this.commands.propertyToID('_pingpong');
                    PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, width, height);
                    this.commands.getTemporaryRT(pingpong, rtConfig, true);
                    this.commands.blitWithMaterial(src, pingpong, lensFlareMat, LensFlarePass, false);
                    this.commands.blit(pingpong, dst);
                    this.commands.releaseTemporaryRT(pingpong);
                }
                else {
                    this.commands.blitWithMaterial(src, dst, lensFlareMat, LensFlarePass, false);
                }
                this.dirty = false;
            }
        }
        else {
            if (this.dirty) {
                this.commands.clearAll();
                this.dirty = false;
            }
        }
        if (cam)
            cam.getSceneObject().scene.commitCommandBuffer(this.commands);
    }
};
__decorate([
    serialize
], LensFlare.prototype, "pLensFlareIntensity", void 0);
__decorate([
    serialize
], LensFlare.prototype, "pLensFlarePosition", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], LensFlare.prototype, "intensity", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], LensFlare.prototype, "position", null);
__decorate([
    userPrivateAPI()
], LensFlare.prototype, "render", null);
LensFlare = __decorate([
    registerClass()
], LensFlare);
exports.LensFlare = LensFlare;
hideAPIPrototype(LensFlare);
