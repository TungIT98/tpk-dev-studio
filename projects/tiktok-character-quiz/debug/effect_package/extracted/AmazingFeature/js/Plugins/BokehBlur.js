"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BokehBlur = exports.BokehBlurShapeType = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, userPublicAPI, userPrivateAPI, EnterInternalScope, QuitInternalScope, hideAPIPrototype, dualInstanceProperty } = APJS;
const PostEffect_1 = require("./PostEffect");
const PostProcessUtils_1 = require("./PostProcessUtils");
var BokehBlurShapeType;
(function (BokehBlurShapeType) {
    BokehBlurShapeType[BokehBlurShapeType["Hexagon"] = 0] = "Hexagon";
    BokehBlurShapeType[BokehBlurShapeType["Circle"] = 1] = "Circle";
})(BokehBlurShapeType = exports.BokehBlurShapeType || (exports.BokehBlurShapeType = {}));
let BokehBlur = class BokehBlur extends PostEffect_1.PostEffect {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.mName = 'BokehBlur';
        this.pBokehBlurSize = 5.0;
        this.pBokehBlurIteration = 1;
        this.pBokehBlurShape = BokehBlurShapeType.Hexagon;
        this.pBokehBlurFastCircle = false;
        this.pBokehBlurDownSample = 2;
        this.cosGol = Math.cos(2.399);
        this.sinGol = Math.sin(2.399);
        QuitInternalScope(this);
    }
    get size() {
        return this.pBokehBlurSize;
    }
    set size(value) {
        this.isEqual(value, this.pBokehBlurSize);
        this.pBokehBlurSize = value;
    }
    get iterations() {
        return this.pBokehBlurIteration;
    }
    set iterations(value) {
        this.isEqual(value, this.pBokehBlurIteration);
        this.pBokehBlurIteration = value;
    }
    get shape() {
        return this.pBokehBlurShape;
    }
    set shape(value) {
        if (effect.Amaz.EditorSDK === 1 && APJS.EngineState.isEditorEnv) {
            this.isEqual(value, this.pBokehBlurShape);
            this.pBokehBlurShape = value;
        }
        else {
            console.error('shape is deprecated, can not be used at runtime.');
        }
    }
    get fastCircle() {
        return this.pBokehBlurFastCircle;
    }
    set fastCircle(value) {
        if (effect.Amaz.EditorSDK === 1 && APJS.EngineState.isEditorEnv) {
            this.isEqual(value, this.pBokehBlurFastCircle);
            this.pBokehBlurFastCircle = value;
        }
        else {
            console.error('fast circle is deprecated, can not be used at runtime.');
        }
    }
    get downsample() {
        return this.pBokehBlurDownSample;
    }
    set downsample(value) {
        this.isEqual(value, this.pBokehBlurDownSample);
        this.pBokehBlurDownSample = value;
    }
    render(postProcessContext) {
        const enable = this.enabled;
        const blurSize = this.pBokehBlurSize;
        const blurIteration = this.pBokehBlurIteration;
        const bokehShape = this.pBokehBlurShape;
        const fastCircle = this.pBokehBlurFastCircle;
        const downSample = this.pBokehBlurDownSample;
        const width = postProcessContext.getScreenWidth();
        const height = postProcessContext.getScreenHeight();
        const cam = postProcessContext.getCamera();
        const mat = this._material;
        const src = postProcessContext.getSource();
        const dst = postProcessContext.getDestination();
        if (enable && mat && src && dst) {
            if (this.dirty) {
                this.commands.clearAll();
                const BokehBlurMat = mat;
                const downWidth = width / downSample;
                const downHeight = height / downSample;
                BokehBlurMat.setVector('_Params', new APJS.Vector4f(blurIteration, blurSize, Math.cos(0.5), Math.sin(0.5)));
                const rtConfig = postProcessContext.getRTConfig();
                PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, downWidth, downHeight);
                if (bokehShape === BokehBlurShapeType.Hexagon) {
                    const downRT = this.commands.propertyToID('_downRT');
                    const downRT2 = this.commands.propertyToID('_downRT2');
                    const downRT1 = this.commands.propertyToID('_downRT1');
                    this.commands.getTemporaryRT(downRT, rtConfig, true);
                    this.commands.getTemporaryRT(downRT2, rtConfig, true);
                    this.commands.getTemporaryRT(downRT1, rtConfig, true);
                    BokehBlurMat.setVector('_MainTex_TexelSize', new APJS.Vector4f(1.0 / downWidth, 1.0 / downHeight, downWidth, downHeight));
                    this.commands.blit(src, downRT);
                    this.commands.blitWithMaterial(downRT, downRT1, BokehBlurMat, 0, false);
                    this.commands.blitWithMaterial(downRT, downRT2, BokehBlurMat, 1, false);
                    this.commands.setGlobalTexture('_DownLeftTex', downRT2);
                    this.commands.blitWithMaterial(downRT1, dst, BokehBlurMat, 2, false);
                    this.commands.releaseTemporaryRT(downRT);
                    this.commands.releaseTemporaryRT(downRT2);
                    this.commands.releaseTemporaryRT(downRT1);
                }
                else {
                    const downRT = this.commands.propertyToID('_downRT');
                    const downRT1 = this.commands.propertyToID('_downRT1');
                    this.commands.getTemporaryRT(downRT, rtConfig, true);
                    this.commands.getTemporaryRT(downRT1, rtConfig, true);
                    this.commands.blit(src, downRT);
                    if (fastCircle) {
                        BokehBlurMat.setVector('_GoldenRot', new APJS.Vector4f(this.cosGol, this.sinGol, -this.sinGol, this.cosGol));
                        BokehBlurMat.setVector('_Params', new APJS.Vector4f(blurIteration, blurSize, 0.5 / width, 0.5 / height));
                        this.commands.blitWithMaterial(downRT, dst, BokehBlurMat, 0, false);
                    }
                    else {
                        BokehBlurMat.setVector('_MainTex_TexelSize', new APJS.Vector4f(1.0 / downWidth, 1.0 / downHeight, downWidth, downHeight));
                        BokehBlurMat.setVector('_Params', new APJS.Vector4f(blurIteration * 2.0, blurSize, Math.cos(0.5), Math.sin(0.5)));
                        this.commands.blitWithMaterial(downRT, downRT1, BokehBlurMat, 0, false);
                        this.commands.blitWithMaterial(downRT1, dst, BokehBlurMat, 1, false);
                    }
                    this.commands.releaseTemporaryRT(downRT);
                    this.commands.releaseTemporaryRT(downRT1);
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
], BokehBlur.prototype, "pBokehBlurSize", void 0);
__decorate([
    serialize
], BokehBlur.prototype, "pBokehBlurIteration", void 0);
__decorate([
    serialize
], BokehBlur.prototype, "pBokehBlurShape", void 0);
__decorate([
    serialize
], BokehBlur.prototype, "pBokehBlurFastCircle", void 0);
__decorate([
    serialize
], BokehBlur.prototype, "pBokehBlurDownSample", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], BokehBlur.prototype, "size", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], BokehBlur.prototype, "iterations", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], BokehBlur.prototype, "shape", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], BokehBlur.prototype, "fastCircle", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], BokehBlur.prototype, "downsample", null);
__decorate([
    userPrivateAPI()
], BokehBlur.prototype, "render", null);
BokehBlur = __decorate([
    registerClass()
], BokehBlur);
exports.BokehBlur = BokehBlur;
hideAPIPrototype(BokehBlur);
