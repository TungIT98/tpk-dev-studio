"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TweenAnimation = exports.TweenEasingType = exports.TweenEasingFunction = exports.TweenPathType = exports.TweenOrientation = exports.TweenTargetType = exports.TweenMotionType = exports.TweenPlayMode = void 0;
const APJS = require('../amazingpro.js')
const Tween_1 = require("./Tween");
const { registerClass, serialize, userPublicAPI, userPrivateAPI, hideAPIPrototype, dualInstanceProperty } = APJS;
var TweenPlayMode;
(function (TweenPlayMode) {
    TweenPlayMode["Loop"] = "Loop";
    TweenPlayMode["LoopOnce"] = "LoopOnce";
    TweenPlayMode["PingPong"] = "PingPong";
    TweenPlayMode["PingPongOnce"] = "PingPongOnce";
})(TweenPlayMode = exports.TweenPlayMode || (exports.TweenPlayMode = {}));
var TweenMotionType;
(function (TweenMotionType) {
    TweenMotionType["FromTo"] = "FromTo";
    TweenMotionType["To"] = "To";
    TweenMotionType["Offset"] = "Offset";
})(TweenMotionType = exports.TweenMotionType || (exports.TweenMotionType = {}));
var TweenTargetType;
(function (TweenTargetType) {
    TweenTargetType["Position"] = "Position";
    TweenTargetType["Rotation"] = "Rotation";
    TweenTargetType["Scale"] = "Scale";
    TweenTargetType["AlbedoColor"] = "AlbedoColor";
    TweenTargetType["EmissionColor"] = "EmissionColor";
    TweenTargetType["UV"] = "UV";
})(TweenTargetType = exports.TweenTargetType || (exports.TweenTargetType = {}));
var TweenOrientation;
(function (TweenOrientation) {
    TweenOrientation["Fixed"] = "Fixed";
    TweenOrientation["Path"] = "Path";
})(TweenOrientation = exports.TweenOrientation || (exports.TweenOrientation = {}));
var TweenPathType;
(function (TweenPathType) {
    TweenPathType["Curve"] = "Curve";
    TweenPathType["Straight"] = "Straight";
})(TweenPathType = exports.TweenPathType || (exports.TweenPathType = {}));
var TweenEasingFunction;
(function (TweenEasingFunction) {
    TweenEasingFunction["Linear"] = "Linear";
    TweenEasingFunction["Quadratic"] = "Quadratic";
    TweenEasingFunction["Cubic"] = "Cubic";
    TweenEasingFunction["Quartic"] = "Quartic";
    TweenEasingFunction["Quintic"] = "Quintic";
    TweenEasingFunction["Sinusoidal"] = "Sinusoidal";
    TweenEasingFunction["Exponential"] = "Exponential";
    TweenEasingFunction["Circular"] = "Circular";
    TweenEasingFunction["Elastic"] = "Elastic";
    TweenEasingFunction["Back"] = "Back";
    TweenEasingFunction["Bounce"] = "Bounce";
    TweenEasingFunction["GeneratePow"] = "generatePow";
})(TweenEasingFunction = exports.TweenEasingFunction || (exports.TweenEasingFunction = {}));
var TweenEasingType;
(function (TweenEasingType) {
    TweenEasingType["None"] = "None";
    TweenEasingType["In"] = "In";
    TweenEasingType["Out"] = "Out";
    TweenEasingType["InOut"] = "InOut";
})(TweenEasingType = exports.TweenEasingType || (exports.TweenEasingType = {}));
let TweenAnimation = class TweenAnimation extends APJS.ScriptCustomObject {
    constructor(rtti) {
        super(rtti);
        this._name = 'TweenAnimation';
        this.tweenType = Tween_1.TweenType.None;
        this.tweenAnimationObjectTransform = null;
        this.tweenAnimationPaused = false;
        this.tweenAnimationPlayMode = TweenPlayMode.Loop;
        this.tweenAnimationTargetType = TweenTargetType.Position;
        this.tweenAnimationMotionType = TweenMotionType.FromTo;
        this.tweenAnimationEasingFunction = TweenEasingFunction.Linear;
        this.tweenAnimationEasingType = TweenEasingType.Out;
        this.tweenAnimationDuration = 1;
        this.tweenAnimationDelay = 0;
        this._dirty = false;
        this._paused = false;
        this._objectTransform = null;
    }
    setDirty() {
        this._dirty = true;
    }
    get name() {
        return this._name;
    }
    get object() {
        if (!this.tweenAnimationObjectTransform) {
            return null;
        }
        return this.tweenAnimationObjectTransform.getSceneObject();
    }
    set object(value) {
        if (!value) {
            this.tweenAnimationObjectTransform = null;
            return;
        }
        this.tweenAnimationObjectTransform = value.getTransform();
        this._objectTransform = this.tweenAnimationObjectTransform;
        this._dirty = true;
    }
    get paused() {
        return this.tweenAnimationPaused;
    }
    set paused(value) {
        if (this.tweenAnimationPaused === value) {
            return;
        }
        if (value === true) {
            this.pause();
        }
        else {
            this.resume();
        }
        this.tweenAnimationPaused = value;
        this._paused = value;
    }
    get playMode() {
        return this.tweenAnimationPlayMode;
    }
    set playMode(value) {
        this.tweenAnimationPlayMode = value;
        this._dirty = true;
    }
    get targetType() {
        return this.tweenAnimationTargetType;
    }
    set targetType(value) {
        this.tweenAnimationTargetType = value;
        this._dirty = true;
    }
    get motionType() {
        return this.tweenAnimationMotionType;
    }
    set motionType(value) {
        this.tweenAnimationMotionType = value;
        this._dirty = true;
    }
    get easingFunction() {
        return this.tweenAnimationEasingFunction;
    }
    set easingFunction(value) {
        if (value !== TweenEasingFunction.Linear && this.tweenAnimationEasingType === TweenEasingType.None) {
            this.tweenAnimationEasingType = TweenEasingType.Out;
        }
        this.tweenAnimationEasingFunction = value;
        this._dirty = true;
    }
    get easingType() {
        return this.tweenAnimationEasingType;
    }
    set easingType(value) {
        if (value === TweenEasingType.None && this.tweenAnimationEasingFunction !== TweenEasingFunction.Linear) {
            console.log('easingType can only be None when easingFunction is Linear');
            return;
        }
        this.tweenAnimationEasingType = value;
        this._dirty = true;
    }
    get duration() {
        return this.tweenAnimationDuration;
    }
    set duration(value) {
        this.tweenAnimationDuration = value;
        this._dirty = true;
    }
    get delay() {
        return this.tweenAnimationDelay;
    }
    set delay(value) {
        this.tweenAnimationDelay = value;
        this._dirty = true;
    }
    cacheData() {
        this._objectTransform = this.tweenAnimationObjectTransform;
        this._paused = this.tweenAnimationPaused;
    }
    start() {
    }
    stop() {
    }
    pause() {
    }
    resume() {
    }
    create(restartFromBegin = true) {
    }
    update() {
    }
};
__decorate([
    serialize
], TweenAnimation.prototype, "tweenAnimationObjectTransform", void 0);
__decorate([
    serialize
], TweenAnimation.prototype, "tweenAnimationPaused", void 0);
__decorate([
    serialize
], TweenAnimation.prototype, "tweenAnimationPlayMode", void 0);
__decorate([
    serialize
], TweenAnimation.prototype, "tweenAnimationTargetType", void 0);
__decorate([
    serialize
], TweenAnimation.prototype, "tweenAnimationMotionType", void 0);
__decorate([
    serialize
], TweenAnimation.prototype, "tweenAnimationEasingFunction", void 0);
__decorate([
    serialize
], TweenAnimation.prototype, "tweenAnimationEasingType", void 0);
__decorate([
    serialize
], TweenAnimation.prototype, "tweenAnimationDuration", void 0);
__decorate([
    serialize
], TweenAnimation.prototype, "tweenAnimationDelay", void 0);
__decorate([
    userPrivateAPI()
], TweenAnimation.prototype, "name", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenAnimation.prototype, "object", null);
__decorate([
    userPrivateAPI(),
    dualInstanceProperty()
], TweenAnimation.prototype, "paused", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenAnimation.prototype, "playMode", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenAnimation.prototype, "targetType", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenAnimation.prototype, "motionType", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenAnimation.prototype, "easingFunction", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenAnimation.prototype, "easingType", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenAnimation.prototype, "duration", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenAnimation.prototype, "delay", null);
__decorate([
    userPrivateAPI()
], TweenAnimation.prototype, "cacheData", null);
__decorate([
    userPublicAPI()
], TweenAnimation.prototype, "start", null);
__decorate([
    userPublicAPI()
], TweenAnimation.prototype, "stop", null);
__decorate([
    userPublicAPI()
], TweenAnimation.prototype, "pause", null);
__decorate([
    userPublicAPI()
], TweenAnimation.prototype, "resume", null);
__decorate([
    userPrivateAPI()
], TweenAnimation.prototype, "create", null);
__decorate([
    userPrivateAPI()
], TweenAnimation.prototype, "update", null);
TweenAnimation = __decorate([
    registerClass()
], TweenAnimation);
exports.TweenAnimation = TweenAnimation;
hideAPIPrototype(TweenAnimation);
