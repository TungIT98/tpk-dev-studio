"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fxaa = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, userPrivateAPI, EnterInternalScope, QuitInternalScope, hideAPIPrototype } = APJS;
const PostEffect_1 = require("./PostEffect");
const PostProcessUtils_1 = require("./PostProcessUtils");
const u_ScreenParams = 'u_ScreenParams';
const FxaaPass = 0;
let Fxaa = class Fxaa extends PostEffect_1.PostEffect {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.mName = 'Fxaa';
        QuitInternalScope(this);
    }
    render(postProcessContext) {
        const enable = this.enabled;
        const width = postProcessContext.getScreenWidth();
        const height = postProcessContext.getScreenHeight();
        const mat = this._material;
        const src = postProcessContext.getSource();
        const dst = postProcessContext.getDestination();
        if (enable && mat && src && dst) {
            mat.setVector(u_ScreenParams, new APJS.Vector4f(width, height, 1.0 / width, 1.0 / height));
            if (this.dirty) {
                this.commands.clearAll();
                if (src && src.equals(dst)) {
                    const pingpong = this.commands.propertyToID('_pingpong');
                    const rtConfig = postProcessContext.getRTConfig();
                    PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, width, height);
                    this.commands.getTemporaryRT(pingpong, rtConfig, true);
                    this.commands.blitWithMaterial(src, pingpong, mat, FxaaPass, false);
                    this.commands.blit(pingpong, dst);
                    this.commands.releaseTemporaryRT(pingpong);
                }
                else {
                    this.commands.blitWithMaterial(src, dst, mat, FxaaPass, false);
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
};
__decorate([
    userPrivateAPI()
], Fxaa.prototype, "render", null);
Fxaa = __decorate([
    registerClass()
], Fxaa);
exports.Fxaa = Fxaa;
hideAPIPrototype(Fxaa);
