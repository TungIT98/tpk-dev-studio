"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotionBlur = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, userPublicAPI, userPrivateAPI, EnterInternalScope, QuitInternalScope, hideAPIPrototype, dualInstanceProperty } = APJS;
const PostEffect_1 = require("./PostEffect");
const PostProcessUtils_1 = require("./PostProcessUtils");
const MotionBlurPass = 0;
let MotionBlur = class MotionBlur extends PostEffect_1.PostEffect {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.mName = 'MotionBlur';
        this.pStrength = 0.5;
        this.accumulationTexture = null;
        QuitInternalScope(this);
    }
    get intensity() {
        return this.pStrength;
    }
    set intensity(value) {
        this.isEqual(value, this.pStrength);
        this.pStrength = value;
    }
    render(postProcessContext) {
        const mat = this._material;
        const src = postProcessContext.getSource();
        const dst = postProcessContext.getDestination();
        if (this.enabled && mat && src && dst) {
            const MotionBlurMat = mat;
            let tmp_alpha = this.pStrength;
            if (tmp_alpha > 0.99) {
                tmp_alpha = 0.99;
            }
            MotionBlurMat.setFloat('alpha', 1.0 - tmp_alpha);
            if (this.dirty) {
                this.commands.clearAll();
                this.dirty = false;
                const width = postProcessContext.getScreenWidth();
                const height = postProcessContext.getScreenHeight();
                if (this.accumulationTexture === null) {
                    this.accumulationTexture = PostProcessUtils_1.PostProcessUtils.createScreenTexture('', width, height);
                    this.commands.blit(src, this.accumulationTexture);
                    this.dirty = true;
                }
                else {
                    const rtConfig = postProcessContext.getRTConfig();
                    PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, width, height);
                    const tmp = this.commands.propertyToID('_tmp');
                    this.commands.getTemporaryRT(tmp, rtConfig, true);
                    MotionBlurMat.setTexture('prevTex', this.accumulationTexture);
                    this.commands.blitWithMaterial(src, tmp, MotionBlurMat, MotionBlurPass, false);
                    this.commands.blit(tmp, this.accumulationTexture);
                    this.commands.blit(tmp, dst);
                    this.accumulationTexture = null;
                    this.commands.releaseTemporaryRT(tmp);
                }
                this.setupCommand = true;
            }
        }
        else if (this.dirty) {
            this.commands.clearAll();
            this.dirty = false;
            this.accumulationTexture = null;
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
], MotionBlur.prototype, "pStrength", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], MotionBlur.prototype, "intensity", null);
__decorate([
    userPrivateAPI()
], MotionBlur.prototype, "render", null);
MotionBlur = __decorate([
    registerClass()
], MotionBlur);
exports.MotionBlur = MotionBlur;
hideAPIPrototype(MotionBlur);
