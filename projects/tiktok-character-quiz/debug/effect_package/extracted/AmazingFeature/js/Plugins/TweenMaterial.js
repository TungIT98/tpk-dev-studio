"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TweenMaterial = void 0;
const APJS = require('../amazingpro.js')
const TweenAnimation_1 = require("./TweenAnimation");
const Tween_1 = require("./Tween");
const { registerClass, serialize, userPublicAPI, userPrivateAPI, hideAPIPrototype, dualInstanceProperty, EngineState } = APJS;
let TWEEN = undefined;
if (!EngineState.isEditorEnv) {
    TWEEN = require('../tween.cjs.js');
}
let TweenMaterial = class TweenMaterial extends TweenAnimation_1.TweenAnimation {
    constructor(rtti) {
        super(rtti);
        this._name = 'TweenMaterial';
        this.tweenType = Tween_1.TweenType.Material;
        this.tweenMaterialStartColor = new APJS.Color(1, 1, 1, 1);
        this.tweenMaterialStartVector2 = new APJS.Vector2f(0, 0);
        this.tweenMaterialEndColor = new APJS.Color(1, 0, 0, 1);
        this.tweenMaterialEndVector2 = new APJS.Vector2f(1, 1);
        this.tweenMaterialNeedUpdateBlendFactor = false;
        this._meshRenderer = null;
        this._instancedMaterial = null;
        this._initValues = null;
        this._tweenColor = null;
        this._tweenEmission = null;
        this._tweenUV = null;
    }
    set targetType(value) {
        if (value !== TweenAnimation_1.TweenTargetType.UV && value !== TweenAnimation_1.TweenTargetType.AlbedoColor && value !== TweenAnimation_1.TweenTargetType.EmissionColor) {
            return;
        }
        this.tweenAnimationTargetType = value;
        this._dirty = true;
    }
    get targetType() {
        return this.tweenAnimationTargetType;
    }
    get startColor() {
        return this.tweenMaterialStartColor;
    }
    set startColor(value) {
        this.tweenMaterialStartColor = value;
        this._dirty = true;
    }
    get startVector2() {
        return this.tweenMaterialStartVector2;
    }
    set startVector2(value) {
        this.tweenMaterialStartVector2 = value;
        this._dirty = true;
    }
    get endColor() {
        return this.tweenMaterialEndColor;
    }
    set endColor(value) {
        this.tweenMaterialEndColor = value;
        this._dirty = true;
    }
    get endVector2() {
        return this.tweenMaterialEndVector2;
    }
    set endVector2(value) {
        this.tweenMaterialEndVector2 = value;
        this._dirty = true;
    }
    get needUpdateBlendFactor() {
        return this.tweenMaterialNeedUpdateBlendFactor;
    }
    set needUpdateBlendFactor(value) {
        this.tweenMaterialNeedUpdateBlendFactor = value;
    }
    create(restartFromBegin = true) {
        if (!this.checkMeshRenderer())
            return;
        switch (this.tweenAnimationTargetType) {
            case TweenAnimation_1.TweenTargetType.AlbedoColor:
                this.createTweenColor();
                break;
            case TweenAnimation_1.TweenTargetType.EmissionColor:
                this.createTweenEmission();
                break;
            case TweenAnimation_1.TweenTargetType.UV:
                this.createTweenUV();
                break;
        }
    }
    start() {
        if (!this._meshRenderer) {
            return;
        }
        if (this._tweenColor) {
            this._tweenColor.delay(this.tweenAnimationDelay * 1000);
            this._tweenColor.start();
            if (this._paused) {
                this._tweenColor.pause();
            }
        }
        if (this._tweenEmission) {
            this._tweenEmission.delay(this.tweenAnimationDelay * 1000);
            this._tweenEmission.start();
            if (this._paused) {
                this._tweenEmission.pause();
            }
        }
        if (this._tweenUV) {
            this._tweenUV.delay(this.tweenAnimationDelay * 1000);
            this._tweenUV.start();
            if (this._paused) {
                this._tweenUV.pause();
            }
        }
    }
    update() {
        if (this._paused)
            return;
        if (this._dirty) {
            this.clear();
            this.create();
            this.start();
        }
        this.updateInternal();
        this._dirty = false;
    }
    updateInternal() {
        if (!this._meshRenderer) {
            return;
        }
        if (this._tweenColor) {
            this._tweenColor.update();
        }
        if (this._tweenEmission) {
            this._tweenEmission.update();
        }
        if (this._tweenUV) {
            this._tweenUV.update();
        }
    }
    stop() {
        if (!this._meshRenderer) {
            return;
        }
        if (this._tweenColor) {
            this._tweenColor.stop();
        }
        if (this._tweenEmission) {
            this._tweenEmission.stop();
        }
        if (this._tweenUV) {
            this._tweenUV.stop();
        }
    }
    pause() {
        this._paused = true;
        this.tweenAnimationPaused = true;
        if (!this._meshRenderer) {
            return;
        }
        if (this._tweenColor && !this._tweenColor.isPaused()) {
            this._tweenColor.pause();
        }
        if (this._tweenEmission && !this._tweenEmission.isPaused()) {
            this._tweenEmission.pause();
        }
        if (this._tweenUV && !this._tweenUV.isPaused()) {
            this._tweenUV.pause();
        }
    }
    resume() {
        this._paused = false;
        if (!this._meshRenderer) {
            return;
        }
        if (this._tweenColor && this._tweenColor.isPaused()) {
            this._tweenColor.resume();
        }
        if (this._tweenEmission && this._tweenEmission.isPaused()) {
            this._tweenEmission.resume();
        }
        if (this._tweenUV && this._tweenUV.isPaused()) {
            this._tweenUV.resume();
        }
    }
    checkMeshRenderer() {
        if (!this.object) {
            return false;
        }
        this._meshRenderer = this.object.getComponent('MeshRenderer');
        if (!this._meshRenderer) {
            return false;
        }
        this._instancedMaterial = this._meshRenderer.instancedMaterial;
        if (!this._instancedMaterial) {
            return false;
        }
        return true;
    }
    createTweenColor() {
        var _a;
        console.log('Create TweenColor!');
        this._initValues = new APJS.Color();
        if (!this._meshRenderer || !this._instancedMaterial) {
            return;
        }
        this._initValues = (_a = this._instancedMaterial) === null || _a === void 0 ? void 0 : _a.getColor('_AlbedoColor');
        if (!this._initValues) {
            return;
        }
        switch (this.tweenAnimationMotionType) {
            case TweenAnimation_1.TweenMotionType.FromTo: {
                this._tweenColor = new TWEEN.Tween({
                    r: this.startColor.r,
                    g: this.startColor.g,
                    b: this.startColor.b,
                    a: this.startColor.a,
                });
                break;
            }
            case TweenAnimation_1.TweenMotionType.To: {
                this._tweenColor = new TWEEN.Tween({
                    r: this._initValues.r,
                    g: this._initValues.g,
                    b: this._initValues.b,
                    a: this._initValues.a,
                });
                break;
            }
        }
        this._tweenColor.to({ r: this.endColor.r, g: this.endColor.g, b: this.endColor.b, a: this.endColor.a }, this.tweenAnimationDuration * 1000);
        const mat = this._instancedMaterial;
        if (!mat) {
            return;
        }
        if (this.tweenMaterialNeedUpdateBlendFactor) {
            console.log('Update BlendMode');
            const passes = mat.passes;
            if (passes && passes.length > 0) {
                for (let passNum = 0; passNum < passes.length; passNum++) {
                    const colorBlendState = mat.passes[passNum].blendState;
                    colorBlendState.enabled = true;
                    colorBlendState.srcColorFactor = APJS.BlendFactor.SrcAlpha;
                    colorBlendState.dstColorFactor = APJS.BlendFactor.OneMinusSrcAlpha;
                    colorBlendState.srcAlphaFactor = APJS.BlendFactor.One;
                    colorBlendState.dstAlphaFactor = APJS.BlendFactor.OneMinusSrcAlpha;
                }
            }
        }
        this._tweenColor.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
        switch (this.tweenAnimationPlayMode) {
            case TweenAnimation_1.TweenPlayMode.Loop:
                this._tweenColor.repeat(Infinity);
                this._tweenColor.yoyo(false);
                break;
            case TweenAnimation_1.TweenPlayMode.LoopOnce:
                this._tweenColor.repeat(0);
                this._tweenColor.yoyo(false);
                break;
            case 'PingPong':
                this._tweenColor.repeat(Infinity);
                this._tweenColor.yoyo(true);
                break;
            case 'PingPongOnce':
                this._tweenColor.repeat(1);
                this._tweenColor.yoyo(true);
                break;
        }
        this._tweenColor.onUpdate((object) => {
            if (!mat) {
                return;
            }
            mat.setColor('_AlbedoColor', new APJS.Color(object.r, object.g, object.b, object.a));
        });
    }
    createTweenEmission() {
        var _a;
        console.log('Create TweenEmission!');
        this._initValues = new APJS.Color();
        if (!this._instancedMaterial || !this._meshRenderer) {
            return;
        }
        this._initValues = (_a = this._instancedMaterial) === null || _a === void 0 ? void 0 : _a.getColor('_EmissiveColor');
        if (!this._initValues) {
            return;
        }
        switch (this.tweenAnimationMotionType) {
            case TweenAnimation_1.TweenMotionType.FromTo: {
                this._tweenEmission = new TWEEN.Tween({
                    r: this.startColor.r,
                    g: this.startColor.g,
                    b: this.startColor.b,
                    a: this.startColor.a,
                });
                break;
            }
            case TweenAnimation_1.TweenMotionType.To: {
                this._tweenEmission = new TWEEN.Tween({
                    r: this._initValues.r,
                    g: this._initValues.g,
                    b: this._initValues.b,
                    a: this._initValues.a,
                });
                break;
            }
        }
        this._tweenEmission.to({ r: this.endColor.r, g: this.endColor.g, b: this.endColor.b, a: this.endColor.a }, this.tweenAnimationDuration * 1000);
        const mat = this._instancedMaterial;
        if (!mat) {
            return;
        }
        this._tweenEmission.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
        switch (this.tweenAnimationPlayMode) {
            case TweenAnimation_1.TweenPlayMode.Loop:
                this._tweenEmission.repeat(Infinity);
                this._tweenEmission.yoyo(false);
                break;
            case TweenAnimation_1.TweenPlayMode.LoopOnce:
                this._tweenEmission.repeat(0);
                this._tweenEmission.yoyo(false);
                break;
            case 'PingPong':
                this._tweenEmission.repeat(Infinity);
                this._tweenEmission.yoyo(true);
                break;
            case 'PingPongOnce':
                this._tweenEmission.repeat(1);
                this._tweenEmission.yoyo(true);
                break;
        }
        this._tweenEmission.onUpdate((object) => {
            if (!mat) {
                return;
            }
            mat.setColor('_EmissiveColor', new APJS.Color(object.r, object.g, object.b, object.a));
        });
    }
    createTweenUV() {
        var _a;
        console.log('Create TweenUV!');
        this._initValues = new APJS.Vector2f();
        if (!this._instancedMaterial || !this._meshRenderer) {
            return;
        }
        const uv = (_a = this._instancedMaterial) === null || _a === void 0 ? void 0 : _a.getVector('_Offset');
        if (uv) {
            this._initValues.x = uv.x;
            this._initValues.y = uv.y;
        }
        switch (this.tweenAnimationMotionType) {
            case TweenAnimation_1.TweenMotionType.FromTo: {
                this._tweenUV = new TWEEN.Tween({
                    x: this.startVector2.x,
                    y: this.startVector2.y,
                });
                break;
            }
            case TweenAnimation_1.TweenMotionType.To: {
                this._tweenUV = new TWEEN.Tween({
                    x: this._initValues.x,
                    y: this._initValues.y,
                });
                break;
            }
        }
        this._tweenUV.to({ x: this.endVector2.x, y: this.endVector2.y }, this.tweenAnimationDuration * 1000);
        const mat = this._instancedMaterial;
        if (!mat) {
            return;
        }
        this._tweenUV.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
        switch (this.tweenAnimationPlayMode) {
            case TweenAnimation_1.TweenPlayMode.Loop:
                this._tweenUV.repeat(Infinity);
                this._tweenUV.yoyo(false);
                break;
            case TweenAnimation_1.TweenPlayMode.LoopOnce:
                this._tweenUV.repeat(0);
                this._tweenUV.yoyo(false);
                break;
            case 'PingPong':
                this._tweenUV.repeat(Infinity);
                this._tweenUV.yoyo(true);
                break;
            case 'PingPongOnce':
                this._tweenUV.repeat(1);
                this._tweenUV.yoyo(true);
                break;
        }
        this._tweenUV.onUpdate((object) => {
            if (!mat) {
                return;
            }
            mat.setVector('_Offset', new APJS.Vector2f(object.x, object.y));
        });
    }
    clear() {
        var _a, _b, _c;
        if (!this._instancedMaterial || !this._meshRenderer) {
            return;
        }
        if (this._tweenColor) {
            this._tweenColor.stop();
            TWEEN.remove(this._tweenColor);
            (_a = this._instancedMaterial) === null || _a === void 0 ? void 0 : _a.setColor('_AlbedoColor', this._initValues);
        }
        if (this._tweenEmission) {
            this._tweenEmission.stop();
            TWEEN.remove(this._tweenEmission);
            (_b = this._instancedMaterial) === null || _b === void 0 ? void 0 : _b.setColor('_EmissiveColor', this._initValues);
        }
        if (this._tweenUV) {
            this._tweenUV.stop();
            TWEEN.remove(this._tweenUV);
            (_c = this._instancedMaterial) === null || _c === void 0 ? void 0 : _c.setVector('_Offset', this._initValues);
        }
        this._initValues = null;
        this._tweenColor = null;
        this._tweenEmission = null;
        this._tweenUV = null;
    }
};
__decorate([
    serialize
], TweenMaterial.prototype, "tweenMaterialStartColor", void 0);
__decorate([
    serialize
], TweenMaterial.prototype, "tweenMaterialStartVector2", void 0);
__decorate([
    serialize
], TweenMaterial.prototype, "tweenMaterialEndColor", void 0);
__decorate([
    serialize
], TweenMaterial.prototype, "tweenMaterialEndVector2", void 0);
__decorate([
    serialize
], TweenMaterial.prototype, "tweenMaterialNeedUpdateBlendFactor", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenMaterial.prototype, "targetType", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenMaterial.prototype, "startColor", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenMaterial.prototype, "startVector2", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenMaterial.prototype, "endColor", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenMaterial.prototype, "endVector2", null);
__decorate([
    userPrivateAPI(),
    dualInstanceProperty()
], TweenMaterial.prototype, "needUpdateBlendFactor", null);
__decorate([
    userPrivateAPI()
], TweenMaterial.prototype, "create", null);
__decorate([
    userPublicAPI()
], TweenMaterial.prototype, "start", null);
__decorate([
    userPrivateAPI()
], TweenMaterial.prototype, "update", null);
__decorate([
    userPublicAPI()
], TweenMaterial.prototype, "stop", null);
__decorate([
    userPublicAPI()
], TweenMaterial.prototype, "pause", null);
__decorate([
    userPublicAPI()
], TweenMaterial.prototype, "resume", null);
TweenMaterial = __decorate([
    registerClass()
], TweenMaterial);
exports.TweenMaterial = TweenMaterial;
hideAPIPrototype(TweenMaterial);
