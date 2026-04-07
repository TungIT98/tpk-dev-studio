"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tween = exports.TweenType = void 0;
const APJS = require('../amazingpro.js')
const TweenAnimation_1 = require("./TweenAnimation");
const TweenTransform_1 = require("./TweenTransform");
const TweenTransformFollow_1 = require("./TweenTransformFollow");
const TweenTransformPath_1 = require("./TweenTransformPath");
const TweenMaterial_1 = require("./TweenMaterial");
const { registerClass, serialize, userPublicAPI, userPrivateAPI, hideAPIPrototype, dualInstanceProperty } = APJS;
var TweenType;
(function (TweenType) {
    TweenType[TweenType["None"] = 0] = "None";
    TweenType[TweenType["Transform"] = 1] = "Transform";
    TweenType[TweenType["TransformPath"] = 2] = "TransformPath";
    TweenType[TweenType["TransformFollow"] = 3] = "TransformFollow";
    TweenType[TweenType["Material"] = 4] = "Material";
})(TweenType = exports.TweenType || (exports.TweenType = {}));
let Tween = class Tween extends APJS.DynamicComponent {
    constructor(rtti) {
        super(rtti);
        this._tweenAnimation = new TweenTransformPath_1.TweenTransformPath();
        this._tweenAnimationCache = null;
        this.name = 'Tween';
    }
    cacheData() {
        this._tweenAnimationCache = this._tweenAnimation;
    }
    get tweenType() {
        return this._tweenAnimation.tweenType;
    }
    set tweenType(value) {
        if (value !== this.tweenType) {
            this._tweenAnimation = this.createTweenAnimation(value);
            this._tweenAnimationCache = this._tweenAnimation;
        }
    }
    get tweenAnimation() {
        return this._tweenAnimation;
    }
    set tweenAnimation(value) {
        this._tweenAnimation = value;
        this._tweenAnimationCache = value;
        value.cacheData();
        value.setDirty();
    }
    onEnable() {
        var _a;
        (_a = this._tweenAnimationCache) === null || _a === void 0 ? void 0 : _a.start();
    }
    onDisable() {
        var _a;
        (_a = this._tweenAnimationCache) === null || _a === void 0 ? void 0 : _a.stop();
    }
    onStart() {
        var _a, _b, _c;
        this.cacheData();
        (_a = this._tweenAnimationCache) === null || _a === void 0 ? void 0 : _a.cacheData();
        (_b = this._tweenAnimationCache) === null || _b === void 0 ? void 0 : _b.create();
        (_c = this._tweenAnimationCache) === null || _c === void 0 ? void 0 : _c.start();
    }
    onUpdate(deltaTime) {
        var _a;
        (_a = this._tweenAnimationCache) === null || _a === void 0 ? void 0 : _a.update();
    }
    onRelease() {
    }
    onDestroy() {
    }
    onEvent(event) {
        if (!this._tweenAnimationCache) {
            return;
        }
        const scene = this.getSceneObject().scene;
        const eventArgs = event.args;
        let autoResetEffect = false;
        if (scene && scene.getSettings !== undefined) {
            const settings = scene.getSettings();
            autoResetEffect = settings.get('auto_reset_effect');
        }
        if (autoResetEffect) {
            if (event.type === APJS.AppEventType.COMPAT_BEF) {
                const eventResult = eventArgs[0];
                if (eventResult === APJS.BEFEventType.BET_RECORD_VIDEO) {
                    const eventType = eventArgs[1];
                    if (eventType === APJS.BEF_RECODE_VEDIO_EVENT_CODE.RECODE_VEDIO_START) {
                        this._tweenAnimationCache.stop();
                        this._tweenAnimationCache.start();
                    }
                }
            }
        }
    }
    createTweenAnimation(type) {
        switch (type) {
            case TweenType.Transform:
                return new TweenTransform_1.TweenTransform();
            case TweenType.TransformPath:
                return new TweenTransformPath_1.TweenTransformPath();
            case TweenType.TransformFollow:
                return new TweenTransformFollow_1.TweenTransformFollow();
            case TweenType.Material:
                return new TweenMaterial_1.TweenMaterial();
            default:
                return new TweenAnimation_1.TweenAnimation();
        }
    }
};
__decorate([
    serialize
], Tween.prototype, "_tweenAnimation", void 0);
__decorate([
    userPrivateAPI()
], Tween.prototype, "cacheData", null);
__decorate([
    userPublicAPI()
], Tween.prototype, "tweenType", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], Tween.prototype, "tweenAnimation", null);
__decorate([
    userPrivateAPI()
], Tween.prototype, "onEnable", null);
__decorate([
    userPrivateAPI()
], Tween.prototype, "onDisable", null);
__decorate([
    userPrivateAPI()
], Tween.prototype, "onStart", null);
__decorate([
    userPrivateAPI()
], Tween.prototype, "onUpdate", null);
__decorate([
    userPrivateAPI()
], Tween.prototype, "onRelease", null);
__decorate([
    userPrivateAPI()
], Tween.prototype, "onDestroy", null);
__decorate([
    userPrivateAPI()
], Tween.prototype, "onEvent", null);
Tween = __decorate([
    registerClass()
], Tween);
exports.Tween = Tween;
hideAPIPrototype(Tween);
