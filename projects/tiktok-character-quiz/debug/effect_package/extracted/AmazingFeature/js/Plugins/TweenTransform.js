"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TweenTransform = void 0;
const APJS = require('../amazingpro.js')
const TweenAnimation_1 = require("./TweenAnimation");
const Tween_1 = require("./Tween");
const { registerClass, serialize, userPublicAPI, userPrivateAPI, hideAPIPrototype, dualInstanceProperty, EngineState } = APJS;
let TWEEN = undefined;
if (!EngineState.isEditorEnv) {
    TWEEN = require('../tween.cjs.js');
}
let TweenTransform = class TweenTransform extends TweenAnimation_1.TweenAnimation {
    constructor(rtti) {
        super(rtti);
        this._name = 'TweenTransform';
        this.tweenType = Tween_1.TweenType.Transform;
        this.tweenTransformStartVector3 = new APJS.Vector3f();
        this.tweenTransformStartVector2 = new APJS.Vector2f();
        this.tweenTransformStartNumber = 0;
        this.tweenTransformEndVector3 = new APJS.Vector3f();
        this.tweenTransformEndVector2 = new APJS.Vector2f();
        this.tweenTransformEndNumber = 0;
        this.tweenTransformOffsetVector3 = new APJS.Vector3f();
        this.tweenTransformOffsetVector2 = new APJS.Vector2f();
        this.tweenTransformOffsetNumber = 0;
        this._initTransform = null;
        this._tweenRot = null;
        this._tweenMove = null;
        this._tweenScale = null;
    }
    set targetType(value) {
        if (value !== TweenAnimation_1.TweenTargetType.Position && value !== TweenAnimation_1.TweenTargetType.Rotation && value !== TweenAnimation_1.TweenTargetType.Scale) {
            return;
        }
        this.tweenAnimationTargetType = value;
        this._dirty = true;
    }
    get targetType() {
        return this.tweenAnimationTargetType;
    }
    get startVector3() {
        return this.tweenTransformStartVector3;
    }
    set startVector3(value) {
        this.tweenTransformStartVector3 = value;
        this._dirty = true;
    }
    get startVector2() {
        return this.tweenTransformStartVector2;
    }
    set startVector2(value) {
        this.tweenTransformStartVector2 = value;
        this._dirty = true;
    }
    get startNumber() {
        return this.tweenTransformStartNumber;
    }
    set startNumber(value) {
        this.tweenTransformStartNumber = value;
        this._dirty = true;
    }
    get endVector3() {
        return this.tweenTransformEndVector3;
    }
    set endVector3(value) {
        this.tweenTransformEndVector3 = value;
        this._dirty = true;
    }
    get endVector2() {
        return this.tweenTransformEndVector2;
    }
    set endVector2(value) {
        this.tweenTransformEndVector2 = value;
        this._dirty = true;
    }
    get endNumber() {
        return this.tweenTransformEndNumber;
    }
    set endNumber(value) {
        this.tweenTransformEndNumber = value;
        this._dirty = true;
    }
    get offsetVector3() {
        return this.tweenTransformOffsetVector3;
    }
    set offsetVector3(value) {
        this.tweenTransformOffsetVector3 = value;
        this._dirty = true;
    }
    get offsetVector2() {
        return this.tweenTransformOffsetVector2;
    }
    set offsetVector2(value) {
        this.tweenTransformOffsetVector2 = value;
        this._dirty = true;
    }
    get offsetNumber() {
        return this.tweenTransformOffsetNumber;
    }
    set offsetNumber(value) {
        this.tweenTransformOffsetNumber = value;
        this._dirty = true;
    }
    get transform3D() {
        if (this._objectTransform) {
            return this._objectTransform instanceof APJS.ScreenTransform ? false : true;
        }
        return false;
    }
    create(restartFromBegin = true) {
        if (!this._objectTransform) {
            return;
        }
        if (!this.transform3D) {
            const sceneObjectTransform = this._objectTransform;
            this._initTransform = {
                pos: sceneObjectTransform.anchoredPosition,
                rot: sceneObjectTransform.rotation,
                scale: sceneObjectTransform.scale,
            };
            switch (this.targetType) {
                case TweenAnimation_1.TweenTargetType.Rotation:
                    this.createTweenRot();
                    break;
                case TweenAnimation_1.TweenTargetType.Position:
                    this.createTweenMov();
                    break;
                case TweenAnimation_1.TweenTargetType.Scale:
                    this.createTweenScale();
                    break;
            }
        }
        else {
            this._initTransform = {
                pos: this._objectTransform.localPosition,
                rot: this._objectTransform.localEulerAngles,
                scale: this._objectTransform.localScale,
            };
            switch (this.targetType) {
                case TweenAnimation_1.TweenTargetType.Rotation:
                    this.createTweenRot();
                    break;
                case TweenAnimation_1.TweenTargetType.Position:
                    this.createTweenMov();
                    break;
                case TweenAnimation_1.TweenTargetType.Scale:
                    this.createTweenScale();
                    break;
            }
        }
    }
    start() {
        if (!this._objectTransform) {
            return;
        }
        switch (this.targetType) {
            case TweenAnimation_1.TweenTargetType.Rotation:
                if (this._tweenRot) {
                    this._tweenRot.delay(this.tweenAnimationDelay * 1000);
                    this._tweenRot.start();
                    if (this._paused) {
                        this._tweenRot.pause();
                    }
                }
                break;
            case TweenAnimation_1.TweenTargetType.Position:
                if (this._tweenMove) {
                    this._tweenMove.delay(this.tweenAnimationDelay * 1000);
                    this._tweenMove.start();
                    if (this._paused) {
                        this._tweenMove.pause();
                    }
                }
                break;
            case TweenAnimation_1.TweenTargetType.Scale:
                if (this._tweenScale) {
                    this._tweenScale.delay(this.tweenAnimationDelay * 1000);
                    this._tweenScale.start();
                    if (this._paused) {
                        this._tweenScale.pause();
                    }
                }
                break;
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
        if (!this._objectTransform) {
            return;
        }
        switch (this.tweenAnimationTargetType) {
            case TweenAnimation_1.TweenTargetType.Rotation:
                if (this._tweenRot) {
                    this._tweenRot.update();
                }
                break;
            case TweenAnimation_1.TweenTargetType.Position:
                if (this._tweenMove) {
                    this._tweenMove.update();
                }
                break;
            case TweenAnimation_1.TweenTargetType.Scale:
                if (this._tweenScale) {
                    this._tweenScale.update();
                }
                break;
        }
    }
    stop() {
        if (!this._objectTransform) {
            return;
        }
        if (this._tweenRot) {
            this._tweenRot.stop();
        }
        if (this._tweenMove) {
            this._tweenMove.stop();
        }
        if (this._tweenScale) {
            this._tweenScale.stop();
        }
    }
    pause() {
        this._paused = true;
        this.tweenAnimationPaused = true;
        if (!this._objectTransform) {
            return;
        }
        switch (this.tweenAnimationTargetType) {
            case TweenAnimation_1.TweenTargetType.Rotation:
                if (this._tweenRot && !this._tweenRot.isPaused()) {
                    this._tweenRot.pause();
                }
                break;
            case TweenAnimation_1.TweenTargetType.Position:
                if (this._tweenMove && !this._tweenMove.isPaused()) {
                    this._tweenMove.pause();
                }
                break;
            case TweenAnimation_1.TweenTargetType.Scale:
                if (this._tweenScale && !this._tweenScale.isPaused()) {
                    this._tweenScale.pause();
                }
                break;
        }
    }
    resume() {
        this._paused = false;
        if (!this._objectTransform) {
            return;
        }
        switch (this.tweenAnimationTargetType) {
            case TweenAnimation_1.TweenTargetType.Rotation:
                if (this._tweenRot && this._tweenRot.isPaused()) {
                    this._tweenRot.resume();
                }
                break;
            case TweenAnimation_1.TweenTargetType.Position:
                if (this._tweenMove && this._tweenMove.isPaused()) {
                    this._tweenMove.resume();
                }
                break;
            case TweenAnimation_1.TweenTargetType.Scale:
                if (this._tweenScale && this._tweenScale.isPaused()) {
                    this._tweenScale.resume();
                }
                break;
        }
    }
    clear() {
        if (!this._objectTransform) {
            return;
        }
        if (!this.transform3D) {
            const sceneObjectTransform = this._objectTransform;
            const initTransform = this._initTransform;
            if (this._tweenRot) {
                this._tweenRot.stop();
                TWEEN.remove(this._tweenRot);
                if (initTransform) {
                    sceneObjectTransform.rotation = initTransform.rot;
                }
            }
            if (this._tweenMove) {
                this._tweenMove.stop();
                TWEEN.remove(this._tweenMove);
                if (initTransform) {
                    sceneObjectTransform.anchoredPosition = initTransform.pos;
                }
            }
            if (this._tweenScale) {
                this._tweenScale.stop();
                TWEEN.remove(this._tweenScale);
                if (initTransform) {
                    sceneObjectTransform.scale = initTransform.scale;
                }
            }
        }
        else if (this.transform3D) {
            if (this._tweenRot) {
                this._tweenRot.stop();
                TWEEN.remove(this._tweenRot);
                if (this._initTransform) {
                    this._objectTransform.localEulerAngles = this._initTransform.rot;
                }
            }
            else if (this._tweenMove) {
                this._tweenMove.stop();
                TWEEN.remove(this._tweenMove);
                if (this._initTransform) {
                    this._objectTransform.localPosition = this._initTransform.pos;
                }
            }
            else if (this._tweenScale) {
                this._tweenScale.stop();
                TWEEN.remove(this._tweenScale);
                if (this._initTransform) {
                    this._objectTransform.localScale = this._initTransform.scale;
                }
            }
        }
        this._initTransform = null;
        this._tweenRot = null;
        this._tweenMove = null;
        this._tweenScale = null;
    }
    createTweenRot() {
        if (!this._objectTransform) {
            return;
        }
        if (!this.transform3D) {
            console.log('Create Rotate2D Tween!');
            const sceneObjectTransform = this._objectTransform;
            const rotValue = { x: sceneObjectTransform.rotation };
            switch (this.tweenAnimationMotionType) {
                case TweenAnimation_1.TweenMotionType.FromTo: {
                    sceneObjectTransform.rotation = this.tweenTransformStartNumber;
                    rotValue.x = sceneObjectTransform.rotation;
                    this._tweenRot = new TWEEN.Tween(rotValue);
                    this._tweenRot.to({ x: this.tweenTransformEndNumber }, this.tweenAnimationDuration * 1000);
                    break;
                }
                case 'To': {
                    this._tweenRot = new TWEEN.Tween(rotValue);
                    this._tweenRot.to({ x: this.tweenTransformEndNumber }, this.tweenAnimationDuration * 1000);
                    break;
                }
                case 'Offset': {
                    this._tweenRot = new TWEEN.Tween(rotValue);
                    const offsetRes = sceneObjectTransform.rotation + this.tweenTransformOffsetNumber;
                    this._tweenRot.to({ x: offsetRes }, this.tweenAnimationDuration * 1000);
                    break;
                }
            }
            const objectTransform2D = this._objectTransform;
            this._tweenRot.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
            switch (this.tweenAnimationPlayMode) {
                case TweenAnimation_1.TweenPlayMode.Loop:
                    this._tweenRot.repeat(Infinity);
                    this._tweenRot.yoyo(false);
                    break;
                case TweenAnimation_1.TweenPlayMode.LoopOnce:
                    this._tweenRot.repeat(0);
                    this._tweenRot.yoyo(false);
                    break;
                case TweenAnimation_1.TweenPlayMode.PingPong:
                    this._tweenRot.repeat(Infinity);
                    this._tweenRot.yoyo(true);
                    break;
                case TweenAnimation_1.TweenPlayMode.PingPongOnce:
                    this._tweenRot.repeat(1);
                    this._tweenRot.yoyo(true);
                    break;
            }
            this._tweenRot.onUpdate((object) => {
                objectTransform2D.rotation = object.x;
            });
        }
        else if (this.transform3D) {
            console.log('Create Rotate3D Tween!');
            switch (this.tweenAnimationMotionType) {
                case TweenAnimation_1.TweenMotionType.FromTo: {
                    this._objectTransform.localEulerAngles = this.tweenTransformStartVector3;
                    this._tweenRot = new TWEEN.Tween(this._objectTransform.localEulerAngles);
                    this._tweenRot.to({ x: this.tweenTransformEndVector3.x, y: this.tweenTransformEndVector3.y, z: this.tweenTransformEndVector3.z }, this.tweenAnimationDuration * 1000);
                    break;
                }
                case 'To': {
                    this._tweenRot = new TWEEN.Tween(this._objectTransform.localEulerAngles);
                    this._tweenRot.to({ x: this.tweenTransformEndVector3.x, y: this.tweenTransformEndVector3.y, z: this.tweenTransformEndVector3.z }, this.tweenAnimationDuration * 1000);
                    break;
                }
                case 'Offset': {
                    this._tweenRot = new TWEEN.Tween(this._objectTransform.localEulerAngles);
                    const offsetRes = {
                        x: this._objectTransform.localEulerAngles.x + this.tweenTransformOffsetVector3.x,
                        y: this._objectTransform.localEulerAngles.y + this.tweenTransformOffsetVector3.y,
                        z: this._objectTransform.localEulerAngles.z + this.tweenTransformOffsetVector3.z,
                    };
                    this._tweenRot.to(offsetRes, this.tweenAnimationDuration * 1000);
                    break;
                }
            }
            const objectTransform = this._objectTransform;
            this._tweenRot.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
            switch (this.tweenAnimationPlayMode) {
                case TweenAnimation_1.TweenPlayMode.Loop:
                    this._tweenRot.repeat(Infinity);
                    this._tweenRot.yoyo(false);
                    break;
                case 'LoopOnce':
                    this._tweenRot.repeat(0);
                    this._tweenRot.yoyo(false);
                    break;
                case 'PingPong':
                    this._tweenRot.repeat(Infinity);
                    this._tweenRot.yoyo(true);
                    break;
                case 'PingPongOnce':
                    this._tweenRot.repeat(1);
                    this._tweenRot.yoyo(true);
                    break;
            }
            this._tweenRot.onUpdate((object) => {
                objectTransform.localEulerAngles = object;
            });
        }
    }
    createTweenMov() {
        if (!this._objectTransform) {
            return;
        }
        if (!this.transform3D) {
            console.log('Create Move2D Tween!');
            const sceneObjectTransform = this._objectTransform;
            switch (this.tweenAnimationMotionType) {
                case TweenAnimation_1.TweenMotionType.FromTo: {
                    sceneObjectTransform.anchoredPosition = this.tweenTransformStartVector2;
                    this._tweenMove = new TWEEN.Tween(sceneObjectTransform.anchoredPosition);
                    this._tweenMove.to({ x: this.tweenTransformEndVector2.x, y: this.tweenTransformEndVector2.y }, this.tweenAnimationDuration * 1000);
                    break;
                }
                case TweenAnimation_1.TweenMotionType.To: {
                    this._tweenMove = new TWEEN.Tween(sceneObjectTransform.anchoredPosition);
                    this._tweenMove.to({ x: this.tweenTransformEndVector2.x, y: this.tweenTransformEndVector2.y }, this.tweenAnimationDuration * 1000);
                    break;
                }
                case 'Offset': {
                    this._tweenMove = new TWEEN.Tween(sceneObjectTransform.anchoredPosition);
                    const offsetRes = {
                        x: sceneObjectTransform.anchoredPosition.x + this.tweenTransformOffsetVector2.x,
                        y: sceneObjectTransform.anchoredPosition.y + this.tweenTransformOffsetVector2.y,
                    };
                    this._tweenMove.to(offsetRes, this.tweenAnimationDuration * 1000);
                    break;
                }
            }
            const objectTransform2D = this._objectTransform;
            this._tweenMove.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
            switch (this.tweenAnimationPlayMode) {
                case TweenAnimation_1.TweenPlayMode.Loop:
                    this._tweenMove.repeat(Infinity);
                    this._tweenMove.yoyo(false);
                    break;
                case 'LoopOnce':
                    this._tweenMove.repeat(0);
                    this._tweenMove.yoyo(false);
                    break;
                case 'PingPong':
                    this._tweenMove.repeat(Infinity);
                    this._tweenMove.yoyo(true);
                    break;
                case 'PingPongOnce':
                    this._tweenMove.repeat(1);
                    this._tweenMove.yoyo(true);
                    break;
            }
            this._tweenMove.onUpdate((object) => {
                objectTransform2D.anchoredPosition = object;
            });
        }
        else {
            console.log('Create Move3D Tween!');
            switch (this.tweenAnimationMotionType) {
                case TweenAnimation_1.TweenMotionType.FromTo: {
                    this._objectTransform.localPosition = this.tweenTransformStartVector3;
                    this._tweenMove = new TWEEN.Tween(this._objectTransform.localPosition);
                    this._tweenMove.to({ x: this.tweenTransformEndVector3.x, y: this.tweenTransformEndVector3.y, z: this.tweenTransformEndVector3.z }, this.tweenAnimationDuration * 1000);
                    break;
                }
                case 'To': {
                    this._tweenMove = new TWEEN.Tween(this._objectTransform.localPosition);
                    this._tweenMove.to({ x: this.tweenTransformEndVector3.x, y: this.tweenTransformEndVector3.y, z: this.tweenTransformEndVector3.z }, this.tweenAnimationDuration * 1000);
                    break;
                }
                case 'Offset': {
                    this._tweenMove = new TWEEN.Tween(this._objectTransform.localPosition);
                    const offsetRes = {
                        x: this._objectTransform.localPosition.x + this.tweenTransformOffsetVector3.x,
                        y: this._objectTransform.localPosition.y + this.tweenTransformOffsetVector3.y,
                        z: this._objectTransform.localPosition.z + this.tweenTransformOffsetVector3.z,
                    };
                    this._tweenMove.to(offsetRes, this.tweenAnimationDuration * 1000);
                    break;
                }
            }
            const objectTransform = this._objectTransform;
            this._tweenMove.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
            switch (this.tweenAnimationPlayMode) {
                case TweenAnimation_1.TweenPlayMode.Loop:
                    this._tweenMove.repeat(Infinity);
                    this._tweenMove.yoyo(false);
                    break;
                case 'LoopOnce':
                    this._tweenMove.repeat(0);
                    this._tweenMove.yoyo(false);
                    break;
                case 'PingPong':
                    this._tweenMove.repeat(Infinity);
                    this._tweenMove.yoyo(true);
                    break;
                case 'PingPongOnce':
                    this._tweenMove.repeat(1);
                    this._tweenMove.yoyo(true);
                    break;
            }
            this._tweenMove.onUpdate((object) => {
                objectTransform.localPosition = object;
            });
        }
    }
    createTweenScale() {
        if (!this._objectTransform) {
            return;
        }
        if (!this.transform3D) {
            console.log('Create Scale2D Tween!');
            const sceneObjectTransform = this._objectTransform;
            switch (this.tweenAnimationMotionType) {
                case TweenAnimation_1.TweenMotionType.FromTo: {
                    sceneObjectTransform.scale = this.tweenTransformStartVector2;
                    this._tweenScale = new TWEEN.Tween(sceneObjectTransform.scale);
                    this._tweenScale.to({ x: this.tweenTransformEndVector2.x, y: this.tweenTransformEndVector2.y }, this.tweenAnimationDuration * 1000);
                    break;
                }
                case TweenAnimation_1.TweenMotionType.To: {
                    this._tweenScale = new TWEEN.Tween(sceneObjectTransform.scale);
                    this._tweenScale.to({ x: this.tweenTransformEndVector2.x, y: this.tweenTransformEndVector2.y }, this.tweenAnimationDuration * 1000);
                    break;
                }
                case TweenAnimation_1.TweenMotionType.Offset: {
                    this._tweenScale = new TWEEN.Tween(sceneObjectTransform.scale);
                    const offsetRes = {
                        x: sceneObjectTransform.scale.x + this.tweenTransformOffsetVector2.x,
                        y: sceneObjectTransform.scale.y + this.tweenTransformOffsetVector2.y,
                    };
                    this._tweenScale.to(offsetRes, this.tweenAnimationDuration * 1000);
                    break;
                }
            }
            const objectTransform2D = this._objectTransform;
            this._tweenScale.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
            switch (this.tweenAnimationPlayMode) {
                case TweenAnimation_1.TweenPlayMode.Loop:
                    this._tweenScale.repeat(Infinity);
                    this._tweenScale.yoyo(false);
                    break;
                case TweenAnimation_1.TweenPlayMode.LoopOnce:
                    this._tweenScale.repeat(0);
                    this._tweenScale.yoyo(false);
                    break;
                case TweenAnimation_1.TweenPlayMode.PingPong:
                    this._tweenScale.repeat(Infinity);
                    this._tweenScale.yoyo(true);
                    break;
                case TweenAnimation_1.TweenPlayMode.PingPongOnce:
                    this._tweenScale.repeat(1);
                    this._tweenScale.yoyo(true);
                    break;
            }
            this._tweenScale.onUpdate((object) => {
                objectTransform2D.scale = object;
            });
        }
        else {
            console.log('Create Scale3D Tween!');
            switch (this.tweenAnimationMotionType) {
                case TweenAnimation_1.TweenMotionType.FromTo: {
                    this._objectTransform.localScale = this.tweenTransformStartVector3;
                    this._tweenScale = new TWEEN.Tween(this._objectTransform.localScale);
                    this._tweenScale.to({ x: this.tweenTransformEndVector3.x, y: this.tweenTransformEndVector3.y, z: this.tweenTransformEndVector3.z }, this.tweenAnimationDuration * 1000);
                    break;
                }
                case TweenAnimation_1.TweenMotionType.To: {
                    this._tweenScale = new TWEEN.Tween(this._objectTransform.localScale);
                    this._tweenScale.to({ x: this.tweenTransformEndVector3.x, y: this.tweenTransformEndVector3.y, z: this.tweenTransformEndVector3.z }, this.tweenAnimationDuration * 1000);
                    break;
                }
                case TweenAnimation_1.TweenMotionType.Offset: {
                    this._tweenScale = new TWEEN.Tween(this._objectTransform.localScale);
                    const offsetRes = {
                        x: this._objectTransform.localScale.x + this.tweenTransformOffsetVector3.x,
                        y: this._objectTransform.localScale.y + this.tweenTransformOffsetVector3.y,
                        z: this._objectTransform.localScale.z + this.tweenTransformOffsetVector3.z,
                    };
                    this._tweenScale.to(offsetRes, this.tweenAnimationDuration * 1000);
                    break;
                }
            }
            const objectTransform = this._objectTransform;
            this._tweenScale.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
            switch (this.tweenAnimationPlayMode) {
                case TweenAnimation_1.TweenPlayMode.Loop:
                    this._tweenScale.repeat(Infinity);
                    this._tweenScale.yoyo(false);
                    break;
                case TweenAnimation_1.TweenPlayMode.LoopOnce:
                    this._tweenScale.repeat(0);
                    this._tweenScale.yoyo(false);
                    break;
                case TweenAnimation_1.TweenPlayMode.PingPong:
                    this._tweenScale.repeat(Infinity);
                    this._tweenScale.yoyo(true);
                    break;
                case TweenAnimation_1.TweenPlayMode.PingPongOnce:
                    this._tweenScale.repeat(1);
                    this._tweenScale.yoyo(true);
                    break;
            }
            this._tweenScale.onUpdate((object) => {
                objectTransform.localScale = object;
            });
        }
    }
};
__decorate([
    serialize
], TweenTransform.prototype, "tweenTransformStartVector3", void 0);
__decorate([
    serialize
], TweenTransform.prototype, "tweenTransformStartVector2", void 0);
__decorate([
    serialize
], TweenTransform.prototype, "tweenTransformStartNumber", void 0);
__decorate([
    serialize
], TweenTransform.prototype, "tweenTransformEndVector3", void 0);
__decorate([
    serialize
], TweenTransform.prototype, "tweenTransformEndVector2", void 0);
__decorate([
    serialize
], TweenTransform.prototype, "tweenTransformEndNumber", void 0);
__decorate([
    serialize
], TweenTransform.prototype, "tweenTransformOffsetVector3", void 0);
__decorate([
    serialize
], TweenTransform.prototype, "tweenTransformOffsetVector2", void 0);
__decorate([
    serialize
], TweenTransform.prototype, "tweenTransformOffsetNumber", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransform.prototype, "targetType", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransform.prototype, "startVector3", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransform.prototype, "startVector2", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransform.prototype, "startNumber", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransform.prototype, "endVector3", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransform.prototype, "endVector2", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransform.prototype, "endNumber", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransform.prototype, "offsetVector3", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransform.prototype, "offsetVector2", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransform.prototype, "offsetNumber", null);
__decorate([
    userPrivateAPI()
], TweenTransform.prototype, "create", null);
__decorate([
    userPublicAPI()
], TweenTransform.prototype, "start", null);
__decorate([
    userPrivateAPI()
], TweenTransform.prototype, "update", null);
__decorate([
    userPublicAPI()
], TweenTransform.prototype, "stop", null);
__decorate([
    userPublicAPI()
], TweenTransform.prototype, "pause", null);
__decorate([
    userPublicAPI()
], TweenTransform.prototype, "resume", null);
TweenTransform = __decorate([
    registerClass()
], TweenTransform);
exports.TweenTransform = TweenTransform;
hideAPIPrototype(TweenTransform);
