"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grain = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, userPublicAPI, userPrivateAPI, EnterInternalScope, QuitInternalScope, hideAPIPrototype, dualInstanceProperty } = APJS;
const PostEffect_1 = require("./PostEffect");
const PostProcessUtils_1 = require("./PostProcessUtils");
const u_strength = 'u_strength';
const u_color = 'u_color';
const u_speed = 'u_speed';
const u_ScreenParams = 'u_ScreenParams';
const GrainPass = 0;
let Grain = class Grain extends PostEffect_1.PostEffect {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.mName = 'Grain';
        this.pGrainStrength = 0.0;
        this.pGrainColor = 0.0;
        this.pGrainSpeed = 0.0;
        QuitInternalScope(this);
    }
    get strength() {
        return this.pGrainStrength;
    }
    set strength(value) {
        this.isEqual(value, this.pGrainStrength);
        this.pGrainStrength = value;
    }
    get color() {
        return this.pGrainColor;
    }
    set color(value) {
        this.isEqual(value, this.pGrainColor);
        this.pGrainColor = value;
    }
    get speed() {
        return this.pGrainSpeed;
    }
    set speed(value) {
        this.isEqual(value, this.pGrainSpeed);
        this.pGrainSpeed = value;
    }
    render(postProcessContext) {
        const enable = this.enabled;
        const strength = this.pGrainStrength;
        const color = this.pGrainColor;
        const speed = this.pGrainSpeed;
        const width = postProcessContext.getScreenWidth();
        const height = postProcessContext.getScreenHeight();
        const mat = this._material;
        const src = postProcessContext.getSource();
        const dst = postProcessContext.getDestination();
        if (enable && mat && src && dst) {
            const GrainMat = mat;
            GrainMat.setFloat(u_strength, strength);
            GrainMat.setFloat(u_color, color);
            GrainMat.setFloat(u_speed, speed);
            GrainMat.setVector(u_ScreenParams, new APJS.Vector4f(width, height, 1.0 / width, 1.0 / height));
            if (this.dirty) {
                this.commands.clearAll();
                const w = width;
                const h = height;
                if (src && src.equals(dst)) {
                    const pingpong = this.commands.propertyToID('_pingpong');
                    const rtConfig = postProcessContext.getRTConfig();
                    PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, width, height);
                    this.commands.getTemporaryRT(pingpong, rtConfig, true);
                    this.commands.blitWithMaterial(src, pingpong, GrainMat, GrainPass, false);
                    this.commands.blit(pingpong, dst);
                    this.commands.releaseTemporaryRT(pingpong);
                }
                else {
                    this.commands.blitWithMaterial(src, dst, GrainMat, GrainPass, false);
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
], Grain.prototype, "pGrainStrength", void 0);
__decorate([
    serialize
], Grain.prototype, "pGrainColor", void 0);
__decorate([
    serialize
], Grain.prototype, "pGrainSpeed", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Grain.prototype, "strength", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Grain.prototype, "color", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Grain.prototype, "speed", null);
__decorate([
    userPrivateAPI()
], Grain.prototype, "render", null);
Grain = __decorate([
    registerClass()
], Grain);
exports.Grain = Grain;
hideAPIPrototype(Grain);
