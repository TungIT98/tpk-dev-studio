"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vignette = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, userPublicAPI, userPrivateAPI, EnterInternalScope, QuitInternalScope, hideAPIPrototype, dualInstanceProperty } = APJS;
const PostEffect_1 = require("./PostEffect");
const PostProcessUtils_1 = require("./PostProcessUtils");
const u_power = 'u_power';
const u_contrast = 'u_contrast';
const u_ScreenParams = 'u_ScreenParams';
const VignettePass = 0;
let Vignette = class Vignette extends PostEffect_1.PostEffect {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.mName = 'Vignette';
        this.pVignettePower = 0.0;
        this.pVignetteContrast = 1.0;
        QuitInternalScope(this);
    }
    get power() {
        return this.pVignettePower;
    }
    set power(value) {
        this.isEqual(value, this.pVignettePower);
        this.pVignettePower = value;
    }
    get contrast() {
        return this.pVignetteContrast;
    }
    set contrast(value) {
        this.isEqual(value, this.pVignetteContrast);
        this.pVignetteContrast = value;
    }
    render(postProcessContext) {
        const enable = this.enabled;
        const power = this.pVignettePower;
        const contrast = this.pVignetteContrast;
        const width = postProcessContext.getScreenWidth();
        const height = postProcessContext.getScreenHeight();
        const src = postProcessContext.getSource();
        const dst = postProcessContext.getDestination();
        const mat = this._material;
        if (enable && mat && src && dst) {
            const VignetteMat = mat;
            VignetteMat.setFloat(u_power, power);
            VignetteMat.setFloat(u_contrast, contrast);
            VignetteMat.setVector(u_ScreenParams, new APJS.Vector4f(width, height, 1.0 / width, 1.0 / height));
            if (this.dirty) {
                this.commands.clearAll();
                const rtConfig = postProcessContext.getRTConfig();
                const w = width;
                const h = height;
                if (src && src.equals(dst)) {
                    const pingpong = this.commands.propertyToID('_pingpong');
                    PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, width, height);
                    this.commands.getTemporaryRT(pingpong, rtConfig, true);
                    this.commands.blitWithMaterial(src, pingpong, VignetteMat, VignettePass, false);
                    this.commands.blit(pingpong, dst);
                    this.commands.releaseTemporaryRT(pingpong);
                }
                else {
                    this.commands.blitWithMaterial(src, dst, VignetteMat, VignettePass, false);
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
        const cam = postProcessContext.getCamera();
        if (cam)
            cam.getSceneObject().scene.commitCommandBuffer(this.commands);
    }
};
__decorate([
    serialize
], Vignette.prototype, "pVignettePower", void 0);
__decorate([
    serialize
], Vignette.prototype, "pVignetteContrast", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Vignette.prototype, "power", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Vignette.prototype, "contrast", null);
__decorate([
    userPrivateAPI()
], Vignette.prototype, "render", null);
Vignette = __decorate([
    registerClass()
], Vignette);
exports.Vignette = Vignette;
hideAPIPrototype(Vignette);
