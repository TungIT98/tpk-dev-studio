"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TweenTransformFollow = void 0;
const APJS = require('../amazingpro.js')
const TweenAnimation_1 = require("./TweenAnimation");
const Tween_1 = require("./Tween");
const { registerClass, serialize, userPublicAPI, userPrivateAPI, hideAPIPrototype, dualInstanceProperty, EngineState } = APJS;
let TWEEN = undefined;
if (!EngineState.isEditorEnv) {
    TWEEN = require('../tween.cjs.js');
}
let TweenTransformFollow = class TweenTransformFollow extends TweenAnimation_1.TweenAnimation {
    constructor(rtti) {
        super(rtti);
        this._name = 'TweenTransformFollow';
        this.tweenType = Tween_1.TweenType.TransformFollow;
        this.tweenTransformFollowStartVector3 = new APJS.Vector3f();
        this.tweenTransformFollowStartVector2 = new APJS.Vector2f();
        this.tweenTransformFollowStartNumber = 0;
        this.tweenTransformFollowFollowTarget = null;
        this._tweenRot = null;
        this._tweenMove = null;
        this._tweenScale = null;
        this._startRot = null;
        this._startMove = null;
        this._startScale = null;
        this._initTransform = null;
        this._lastTargetTransform = null;
        this._followTargetTransform = null;
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
        return this.tweenTransformFollowStartVector3;
    }
    set startVector3(value) {
        this.tweenTransformFollowStartVector3 = value;
        this._dirty = true;
    }
    get startVector2() {
        return this.tweenTransformFollowStartVector2;
    }
    set startVector2(value) {
        this.tweenTransformFollowStartVector2 = value;
        this._dirty = true;
    }
    get startNumber() {
        return this.tweenTransformFollowStartNumber;
    }
    set startNumber(value) {
        this.tweenTransformFollowStartNumber = value;
        this._dirty = true;
    }
    get followTarget() {
        return this.tweenTransformFollowFollowTarget;
    }
    set followTarget(value) {
        this.tweenTransformFollowFollowTarget = value;
        this._followTargetTransform = value;
        this._dirty = true;
    }
    get transform3D() {
        if (this._objectTransform) {
            return this._objectTransform instanceof APJS.ScreenTransform ? false : true;
        }
        return false;
    }
    cacheData() {
        super.cacheData();
        this._followTargetTransform = this.tweenTransformFollowFollowTarget;
    }
    create(restartFromBegin = true) {
        if (!this.checkValid()) {
            return;
        }
        if (!this._followTargetTransform) {
            return;
        }
        if (!this.transform3D) {
            const sceneObjectTransform = this._objectTransform;
            const targetSceneObjectTransform = this._followTargetTransform;
            if (restartFromBegin) {
                this._initTransform = { rot: sceneObjectTransform.rotation, pos: sceneObjectTransform.anchoredPosition, scale: sceneObjectTransform.scale };
            }
            this._lastTargetTransform = { rot: targetSceneObjectTransform.rotation, pos: targetSceneObjectTransform.anchoredPosition, scale: targetSceneObjectTransform.scale };
            switch (this.tweenAnimationTargetType) {
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
            const sceneObjectTransform = this._objectTransform;
            const targetSceneObjectTransform = this._followTargetTransform;
            if (restartFromBegin) {
                this._initTransform = { rot: sceneObjectTransform.localEulerAngles, pos: sceneObjectTransform.localPosition, scale: sceneObjectTransform.localScale };
            }
            this._lastTargetTransform = { rot: targetSceneObjectTransform.localEulerAngles, pos: targetSceneObjectTransform.localPosition, scale: targetSceneObjectTransform.localScale };
            switch (this.tweenAnimationTargetType) {
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
        if (!this.checkValid()) {
            return;
        }
        if (this._tweenRot) {
            this._tweenRot.delay(this.tweenAnimationDelay * 1000);
            this._tweenRot.start();
            if (this._paused) {
                this._tweenRot.pause();
            }
        }
        if (this._tweenMove) {
            this._tweenMove.delay(this.tweenAnimationDelay * 1000);
            this._tweenMove.start();
            if (this._paused) {
                this._tweenMove.pause();
            }
        }
        if (this._tweenScale) {
            this._tweenScale.delay(this.tweenAnimationDelay * 1000);
            this._tweenScale.start();
            if (this._paused) {
                this._tweenScale.pause();
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
        this.updateNextTarget();
        this.updateInternal();
        this._dirty = false;
    }
    updateInternal() {
        if (!this.checkValid()) {
            return;
        }
        if (this._tweenRot) {
            this._tweenRot.update();
        }
        if (this._tweenMove) {
            this._tweenMove.update();
        }
        if (this._tweenScale) {
            this._tweenScale.update();
        }
    }
    stop() {
        if (!this.checkValid()) {
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
        if (!this.checkValid()) {
            return;
        }
        if (this._tweenRot && !this._tweenRot.isPaused()) {
            this._tweenRot.pause();
        }
        if (this._tweenMove && !this._tweenMove.isPaused()) {
            this._tweenMove.pause();
        }
        if (this._tweenScale && !this._tweenScale.isPaused()) {
            this._tweenScale.pause();
        }
    }
    resume() {
        this._paused = false;
        if (!this.checkValid()) {
            return;
        }
        if (this._tweenRot && this._tweenRot.isPaused()) {
            this._tweenRot.resume();
        }
        if (this._tweenMove && this._tweenMove.isPaused()) {
            this._tweenMove.resume();
        }
        if (this._tweenScale && this._tweenScale.isPaused()) {
            this._tweenScale.resume();
        }
    }
    clear(cleanUpAll = true) {
        if (!this.checkValid()) {
            return;
        }
        if (!this.transform3D) {
            const sceneObjectTransform = this._objectTransform;
            const initTransform = this._initTransform;
            if (this._tweenRot) {
                this._tweenRot.stop();
                TWEEN.remove(this._tweenRot);
                this._startRot = sceneObjectTransform.rotation;
                if (cleanUpAll && initTransform) {
                    sceneObjectTransform.rotation = initTransform.rot;
                }
            }
            if (this._tweenMove) {
                this._tweenMove.stop();
                TWEEN.remove(this._tweenMove);
                this._startMove = sceneObjectTransform.anchoredPosition;
                if (cleanUpAll && initTransform) {
                    sceneObjectTransform.anchoredPosition = initTransform.pos;
                }
            }
            if (this._tweenScale) {
                this._tweenScale.stop();
                TWEEN.remove(this._tweenScale);
                this._startScale = sceneObjectTransform.scale;
                if (cleanUpAll && initTransform) {
                    sceneObjectTransform.scale = initTransform.scale;
                }
            }
        }
        else {
            const sceneObjectTransform = this._objectTransform;
            if (this._tweenRot) {
                this._tweenRot.stop();
                TWEEN.remove(this._tweenRot);
                this._startRot = sceneObjectTransform.localEulerAngles;
                if (cleanUpAll && this._initTransform) {
                    sceneObjectTransform.localEulerAngles = this._initTransform.rot;
                }
            }
            else if (this._tweenMove) {
                this._tweenMove.stop();
                TWEEN.remove(this._tweenMove);
                this._startMove = sceneObjectTransform.localPosition;
                if (cleanUpAll && this._initTransform) {
                    sceneObjectTransform.localPosition = this._initTransform.pos;
                }
            }
            else if (this._tweenScale) {
                this._tweenScale.stop();
                TWEEN.remove(this._tweenScale);
                this._startScale = sceneObjectTransform.localScale;
                if (cleanUpAll && this._initTransform) {
                    sceneObjectTransform.localScale = this._initTransform.scale;
                }
            }
        }
        if (cleanUpAll) {
            this._initTransform = null;
            this._startRot = null;
            this._startMove = null;
            this._startScale = null;
        }
        this._tweenRot = null;
        this._tweenMove = null;
        this._tweenScale = null;
        this._lastTargetTransform = null;
    }
    checkValid() {
        if (!this._objectTransform)
            return false;
        if (!this._followTargetTransform)
            return false;
        if (this.transform3D && this._followTargetTransform instanceof APJS.ScreenTransform)
            return false;
        if (!this.transform3D && !(this._followTargetTransform instanceof APJS.ScreenTransform))
            return false;
        return true;
    }
    createTweenRot() {
        if (!this.checkValid()) {
            return;
        }
        if (!this.transform3D) {
            const sceneObjectTransform = this._objectTransform;
            const targetSceneObjectTransform = this._followTargetTransform;
            console.log('Create Rotate2D Tween!');
            if (this._startRot !== null)
                this._tweenRot = new TWEEN.Tween({ x: this._startRot });
            else if (this.motionType === TweenAnimation_1.TweenMotionType.FromTo) {
                this._tweenRot = new TWEEN.Tween({ x: this.tweenTransformFollowStartNumber });
            }
            else if (this.motionType === TweenAnimation_1.TweenMotionType.To) {
                this._tweenRot = new TWEEN.Tween({ x: sceneObjectTransform.rotation });
            }
            this._tweenRot.follow(true);
            this._tweenRot.to({ x: targetSceneObjectTransform.rotation }, this.tweenAnimationDuration * 1000);
            const objectTransform = sceneObjectTransform;
            this._tweenRot.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
            this._tweenRot.repeat(0);
            this._tweenRot.yoyo(false);
            this._tweenRot.onUpdate((object) => {
                objectTransform.rotation = object.x;
            });
        }
        else {
            console.log('Create Rotate3D Tween!');
            const sceneObjectTransform = this._objectTransform;
            const targetSceneObjectTransform = this._followTargetTransform;
            if (this._startRot !== null) {
                this._tweenRot = new TWEEN.Tween(this._startRot);
            }
            else if (this.tweenAnimationMotionType === TweenAnimation_1.TweenMotionType.FromTo) {
                this._tweenRot = new TWEEN.Tween(this.tweenTransformFollowStartVector3);
            }
            else if (this.tweenAnimationMotionType === TweenAnimation_1.TweenMotionType.To) {
                this._tweenRot = new TWEEN.Tween(sceneObjectTransform.localEulerAngles);
            }
            this._tweenRot.follow(true);
            this._tweenRot.to({
                x: targetSceneObjectTransform.localEulerAngles.x,
                y: targetSceneObjectTransform.localEulerAngles.y,
                z: targetSceneObjectTransform.localEulerAngles.z,
            }, this.tweenAnimationDuration * 1000);
            const objectTransform = sceneObjectTransform;
            this._tweenRot.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
            this._tweenRot.repeat(0);
            this._tweenRot.yoyo(false);
            this._tweenRot.onUpdate((object) => {
                objectTransform.localEulerAngles = object;
            });
        }
    }
    createTweenMov() {
        if (!this.checkValid()) {
            return;
        }
        if (!this.transform3D) {
            console.log('Create Move2D Tween!');
            const sceneObjectTransform = this._objectTransform;
            const targetSceneObjectTransform = this._followTargetTransform;
            if (this._startMove !== null)
                this._tweenMove = new TWEEN.Tween(this._startMove);
            else if (this.tweenAnimationMotionType === TweenAnimation_1.TweenMotionType.FromTo) {
                this._tweenMove = new TWEEN.Tween(this.tweenTransformFollowStartVector2);
            }
            else if (this.tweenAnimationMotionType === TweenAnimation_1.TweenMotionType.To) {
                this._tweenMove = new TWEEN.Tween(sceneObjectTransform.anchoredPosition);
            }
            this._tweenMove.follow(true);
            this._tweenMove.to({ x: targetSceneObjectTransform.anchoredPosition.x, y: targetSceneObjectTransform.anchoredPosition.y }, this.tweenAnimationDuration * 1000);
            const objectTransform = sceneObjectTransform;
            this._tweenMove.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
            this._tweenMove.repeat(0);
            this._tweenMove.yoyo(false);
            this._tweenMove.onUpdate((object) => {
                objectTransform.anchoredPosition = object;
            });
        }
        else {
            console.log('Create Move3D Tween!');
            const sceneObjectTransform = this._objectTransform;
            const targetSceneObjectTransform = this._followTargetTransform;
            if (this._startMove !== null)
                this._tweenMove = new TWEEN.Tween(this._startMove);
            else if (this.tweenAnimationMotionType === TweenAnimation_1.TweenMotionType.FromTo) {
                this._tweenMove = new TWEEN.Tween(this.tweenTransformFollowStartVector3);
            }
            else if (this.tweenAnimationMotionType === TweenAnimation_1.TweenMotionType.To) {
                this._tweenMove = new TWEEN.Tween(sceneObjectTransform.localPosition);
            }
            this._tweenMove.follow(true);
            this._tweenMove.to({
                x: targetSceneObjectTransform.localPosition.x,
                y: targetSceneObjectTransform.localPosition.y,
                z: targetSceneObjectTransform.localPosition.z,
            }, this.tweenAnimationDuration * 1000);
            const objectTransform = sceneObjectTransform;
            this._tweenMove.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
            this._tweenMove.repeat(0);
            this._tweenMove.yoyo(false);
            this._tweenMove.onUpdate((object) => {
                objectTransform.localPosition = object;
            });
        }
    }
    createTweenScale() {
        if (!this.checkValid()) {
            return;
        }
        if (!this.transform3D) {
            console.log('Create Scale2D Tween!');
            const sceneObjectTransform = this._objectTransform;
            const targetSceneObjectTransform = this._followTargetTransform;
            if (this._startScale !== null)
                this._tweenScale = new TWEEN.Tween(this._startScale);
            else if (this.tweenAnimationMotionType === TweenAnimation_1.TweenMotionType.FromTo) {
                this._tweenScale = new TWEEN.Tween(this.tweenTransformFollowStartVector2);
            }
            else if (this.tweenAnimationMotionType === TweenAnimation_1.TweenMotionType.To) {
                this._tweenScale = new TWEEN.Tween(sceneObjectTransform.scale);
            }
            this._tweenScale.follow(true);
            this._tweenScale.to({ x: targetSceneObjectTransform.scale.x, y: targetSceneObjectTransform.scale.y }, this.tweenAnimationDuration * 1000);
            const objectTransform = sceneObjectTransform;
            this._tweenScale.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
            this._tweenScale.repeat(0);
            this._tweenScale.yoyo(false);
            this._tweenScale.onUpdate((object) => {
                objectTransform.scale = object;
            });
        }
        else {
            console.log('Create Scale3D Tween!');
            const sceneObjectTransform = this._objectTransform;
            const targetSceneObjectTransform = this._followTargetTransform;
            if (this._startScale !== null)
                this._tweenScale = new TWEEN.Tween(this._startScale);
            else if (this.tweenAnimationMotionType === TweenAnimation_1.TweenMotionType.FromTo) {
                this._tweenScale = new TWEEN.Tween(this.tweenTransformFollowStartVector3);
            }
            else if (this.tweenAnimationMotionType === TweenAnimation_1.TweenMotionType.To) {
                this._tweenScale = new TWEEN.Tween(sceneObjectTransform.localScale);
            }
            this._tweenScale.follow(true);
            this._tweenScale.to({
                x: targetSceneObjectTransform.localScale.x,
                y: targetSceneObjectTransform.localScale.y,
                z: targetSceneObjectTransform.localScale.z,
            }, this.tweenAnimationDuration * 1000);
            const objectTransform = sceneObjectTransform;
            this._tweenScale.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
            this._tweenScale.repeat(0);
            this._tweenScale.yoyo(false);
            this._tweenScale.onUpdate((object) => {
                objectTransform.localScale = object;
            });
        }
    }
    updateNextTarget() {
        if (!this.checkValid()) {
            return;
        }
        if (!this._lastTargetTransform) {
            return;
        }
        if (this.transform3D) {
            const targetSceneObjectTransform = this._followTargetTransform;
            switch (this.tweenAnimationTargetType) {
                case TweenAnimation_1.TweenTargetType.Rotation: {
                    const newTarget = targetSceneObjectTransform.localEulerAngles;
                    let diffX = Math.abs(this._lastTargetTransform.rot.x - newTarget.x);
                    let diffY = Math.abs(this._lastTargetTransform.rot.y - newTarget.y);
                    let diffZ = Math.abs(this._lastTargetTransform.rot.z - newTarget.z);
                    if (diffX > 0.0001 || diffY > 0.0001 || diffZ > 0.0001) {
                        if (this._tweenRot && !this._tweenRot.isPlaying()) {
                            this.clear(false);
                            this.create(false);
                            this.start();
                        }
                        else if (this._tweenRot && this._tweenRot.isPlaying()) {
                            this._tweenRot.nextTarget({
                                x: newTarget.x,
                                y: newTarget.y,
                                z: newTarget.z,
                            });
                        }
                        this._lastTargetTransform.rot.set(newTarget.x, newTarget.y, newTarget.z);
                    }
                    break;
                }
                case TweenAnimation_1.TweenTargetType.Position: {
                    const newTarget = targetSceneObjectTransform.localPosition;
                    if (this._lastTargetTransform.pos.x !== newTarget.x ||
                        this._lastTargetTransform.pos.y !== newTarget.y ||
                        this._lastTargetTransform.pos.z !== newTarget.z) {
                        if (this._tweenMove && !this._tweenMove.isPlaying()) {
                            this.clear(false);
                            this.create(false);
                            this.start();
                        }
                        else if (this._tweenMove && this._tweenMove.isPlaying()) {
                            this._tweenMove.nextTarget({
                                x: newTarget.x,
                                y: newTarget.y,
                                z: newTarget.z,
                            });
                        }
                        this._lastTargetTransform.pos.set(newTarget.x, newTarget.y, newTarget.z);
                    }
                    break;
                }
                case TweenAnimation_1.TweenTargetType.Scale: {
                    const newTarget = targetSceneObjectTransform.localScale;
                    if (this._lastTargetTransform.scale.x !== newTarget.x ||
                        this._lastTargetTransform.scale.y !== newTarget.y ||
                        this._lastTargetTransform.scale.z !== newTarget.z) {
                        if (this._tweenScale && !this._tweenScale.isPlaying()) {
                            this.clear(false);
                            this.create(false);
                            this.start();
                        }
                        else if (this._tweenScale && this._tweenScale.isPlaying()) {
                            this._tweenScale.nextTarget({
                                x: newTarget.x,
                                y: newTarget.y,
                                z: newTarget.z,
                            });
                        }
                        this._lastTargetTransform.scale.set(newTarget.x, newTarget.y, newTarget.z);
                    }
                    break;
                }
            }
        }
        else {
            const targetSceneObjectTransform = this._followTargetTransform;
            const lastTargetTransform = this._lastTargetTransform;
            switch (this.tweenAnimationTargetType) {
                case TweenAnimation_1.TweenTargetType.Rotation: {
                    const newTarget = targetSceneObjectTransform.rotation;
                    if (Math.abs(lastTargetTransform.rot - newTarget) > 0.0001 ||
                        0.0001) {
                        if (this._tweenRot && !this._tweenRot.isPlaying()) {
                            this.clear(false);
                            this.create(false);
                            this.start();
                        }
                        else if (this._tweenRot && this._tweenRot.isPlaying()) {
                            this._tweenRot.nextTarget({ x: newTarget });
                        }
                        this._lastTargetTransform.rot = newTarget;
                    }
                    break;
                }
                case TweenAnimation_1.TweenTargetType.Position: {
                    const newTarget = targetSceneObjectTransform.anchoredPosition;
                    if (lastTargetTransform.pos.x !== newTarget.x ||
                        lastTargetTransform.pos.y !== newTarget.y) {
                        if (this._tweenMove && !this._tweenMove.isPlaying()) {
                            this.clear(false);
                            this.create(false);
                            this.start();
                        }
                        else if (this._tweenMove && this._tweenMove.isPlaying()) {
                            this._tweenMove.nextTarget({
                                x: newTarget.x,
                                y: newTarget.y,
                            });
                        }
                        this._lastTargetTransform.pos.set(newTarget.x, newTarget.y);
                    }
                    break;
                }
                case TweenAnimation_1.TweenTargetType.Scale: {
                    const newTarget = targetSceneObjectTransform.scale;
                    if (lastTargetTransform.scale.x !== newTarget.x ||
                        lastTargetTransform.scale.y !== newTarget.y) {
                        if (this._tweenScale && !this._tweenScale.isPlaying()) {
                            this.clear(false);
                            this.create(false);
                            this.start();
                        }
                        else if (this._tweenScale && this._tweenScale.isPlaying()) {
                            this._tweenScale.nextTarget({
                                x: newTarget.x,
                                y: newTarget.y,
                            });
                        }
                        this._lastTargetTransform.scale.set(newTarget.x, newTarget.y);
                    }
                    break;
                }
            }
        }
    }
};
__decorate([
    serialize
], TweenTransformFollow.prototype, "tweenTransformFollowStartVector3", void 0);
__decorate([
    serialize
], TweenTransformFollow.prototype, "tweenTransformFollowStartVector2", void 0);
__decorate([
    serialize
], TweenTransformFollow.prototype, "tweenTransformFollowStartNumber", void 0);
__decorate([
    serialize
], TweenTransformFollow.prototype, "tweenTransformFollowFollowTarget", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransformFollow.prototype, "targetType", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransformFollow.prototype, "startVector3", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransformFollow.prototype, "startVector2", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransformFollow.prototype, "startNumber", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransformFollow.prototype, "followTarget", null);
__decorate([
    userPrivateAPI()
], TweenTransformFollow.prototype, "cacheData", null);
__decorate([
    userPrivateAPI()
], TweenTransformFollow.prototype, "create", null);
__decorate([
    userPublicAPI()
], TweenTransformFollow.prototype, "start", null);
__decorate([
    userPrivateAPI()
], TweenTransformFollow.prototype, "update", null);
__decorate([
    userPublicAPI()
], TweenTransformFollow.prototype, "stop", null);
__decorate([
    userPublicAPI()
], TweenTransformFollow.prototype, "pause", null);
__decorate([
    userPublicAPI()
], TweenTransformFollow.prototype, "resume", null);
TweenTransformFollow = __decorate([
    registerClass()
], TweenTransformFollow);
exports.TweenTransformFollow = TweenTransformFollow;
hideAPIPrototype(TweenTransformFollow);
