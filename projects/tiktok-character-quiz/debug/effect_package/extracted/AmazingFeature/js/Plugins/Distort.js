"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Distort = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, userPublicAPI, userPrivateAPI, EnterInternalScope, QuitInternalScope, hideAPIPrototype, dualInstanceProperty } = APJS;
const PostEffect_1 = require("./PostEffect");
const PostProcessUtils_1 = require("./PostProcessUtils");
const u_barrelPower = "u_barrelPower";
const u_rotation = "u_rotation";
const u_zoom = "u_zoom";
const u_maskTiles = "u_maskTiles";
const u_amplitude = "u_amplitude";
const u_frequency = "u_frequency";
const u_speed = "u_speed";
const u_offset = "u_offset";
const DistortPass = 0;
let Distort = class Distort extends PostEffect_1.PostEffect {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.mName = 'Distort';
        this.pDistortBarrelPower = 0.0;
        this.pDistortRotation = 0.0;
        this.pDistortZoom = 0.0;
        this.pDistortMaskTiles = 1.0;
        this.pDistortAmplitude = new APJS.Vector2f(0.0, 0.0);
        this.pDistortFrequency = new APJS.Vector2f(0.0, 0.0);
        this.pDistortSpeed = new APJS.Vector2f(0.0, 0.0);
        this.pDistortOffset = new APJS.Vector2f(0.0, 0.0);
        QuitInternalScope(this);
    }
    get barrelPower() {
        return this.pDistortBarrelPower;
    }
    set barrelPower(value) {
        this.isEqual(value, this.pDistortBarrelPower);
        this.pDistortBarrelPower = value;
    }
    get rotation() {
        return this.pDistortRotation;
    }
    set rotation(value) {
        this.isEqual(value, this.pDistortRotation);
        this.pDistortRotation = value;
    }
    get zoom() {
        return this.pDistortZoom;
    }
    set zoom(value) {
        this.isEqual(value, this.pDistortZoom);
        this.pDistortZoom = value;
    }
    get amplitude() {
        return this.pDistortAmplitude;
    }
    set amplitude(value) {
        this.isEqual(value, this.pDistortAmplitude);
        this.pDistortAmplitude = value;
    }
    get frequency() {
        return this.pDistortFrequency;
    }
    set frequency(value) {
        this.isEqual(value, this.pDistortFrequency);
        this.pDistortFrequency = value;
    }
    get speed() {
        return this.pDistortSpeed;
    }
    set speed(value) {
        this.isEqual(value, this.pDistortSpeed);
        this.pDistortSpeed = value;
    }
    get offset() {
        return this.pDistortOffset;
    }
    set offset(value) {
        this.isEqual(value, this.pDistortOffset);
        this.pDistortOffset = value;
    }
    render(postProcessContext) {
        const enable = this.enabled;
        const barrelPower = this.pDistortBarrelPower;
        const rotation = this.pDistortRotation;
        const zoom = this.pDistortZoom;
        const maskTiles = this.pDistortMaskTiles;
        const amplitude = this.pDistortAmplitude;
        const frequency = this.pDistortFrequency;
        const speed = this.pDistortSpeed;
        const offset = this.pDistortOffset;
        const width = postProcessContext.getScreenWidth();
        const height = postProcessContext.getScreenHeight();
        speed.set(Math.max(Math.min(speed.x, 999), -999), Math.max(Math.min(speed.y, 999), -999));
        const mat = this._material;
        const src = postProcessContext.getSource();
        const dst = postProcessContext.getDestination();
        if (enable && mat && src && dst) {
            const DistortMat = mat;
            DistortMat.setFloat(u_barrelPower, barrelPower);
            DistortMat.setFloat(u_rotation, rotation);
            DistortMat.setFloat(u_zoom, zoom);
            DistortMat.setFloat(u_maskTiles, maskTiles);
            DistortMat.setVector(u_amplitude, amplitude);
            DistortMat.setVector(u_frequency, frequency);
            DistortMat.setVector(u_speed, speed);
            DistortMat.setVector(u_offset, offset);
            if (this.dirty) {
                this.commands.clearAll();
                const rtConfig = postProcessContext.getRTConfig();
                if (src.equals(dst)) {
                    const pingpong = this.commands.propertyToID('_pingpong');
                    PostProcessUtils_1.PostProcessUtils.setupRTConfig(rtConfig, width, height);
                    this.commands.getTemporaryRT(pingpong, rtConfig, true);
                    this.commands.blitWithMaterial(src, pingpong, DistortMat, DistortPass, false);
                    this.commands.blit(pingpong, dst);
                    this.commands.releaseTemporaryRT(pingpong);
                }
                else {
                    this.commands.blitWithMaterial(src, dst, DistortMat, DistortPass, false);
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
], Distort.prototype, "pDistortBarrelPower", void 0);
__decorate([
    serialize
], Distort.prototype, "pDistortRotation", void 0);
__decorate([
    serialize
], Distort.prototype, "pDistortZoom", void 0);
__decorate([
    serialize
], Distort.prototype, "pDistortAmplitude", void 0);
__decorate([
    serialize
], Distort.prototype, "pDistortFrequency", void 0);
__decorate([
    serialize
], Distort.prototype, "pDistortSpeed", void 0);
__decorate([
    serialize
], Distort.prototype, "pDistortOffset", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Distort.prototype, "barrelPower", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Distort.prototype, "rotation", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Distort.prototype, "zoom", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Distort.prototype, "amplitude", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Distort.prototype, "frequency", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Distort.prototype, "speed", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Distort.prototype, "offset", null);
__decorate([
    userPrivateAPI()
], Distort.prototype, "render", null);
Distort = __decorate([
    registerClass()
], Distort);
exports.Distort = Distort;
hideAPIPrototype(Distort);
