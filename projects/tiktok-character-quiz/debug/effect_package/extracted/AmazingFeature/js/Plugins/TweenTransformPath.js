"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TweenTransformPath = void 0;
const APJS = require('../amazingpro.js')
const TweenAnimation_1 = require("./TweenAnimation");
const Tween_1 = require("./Tween");
const { registerClass, serialize, userPublicAPI, userPrivateAPI, hideAPIPrototype, dualInstanceProperty, EngineState } = APJS;
let TWEEN = undefined;
if (!EngineState.isEditorEnv) {
    TWEEN = require('../tween.cjs.js');
}
let TweenTransformPath = class TweenTransformPath extends TweenAnimation_1.TweenAnimation {
    constructor(rtti) {
        super(rtti);
        this._name = 'TweenTransformPath';
        this.tweenType = Tween_1.TweenType.TransformPath;
        this.tweenTransformPathPointsPathVector3 = [];
        this.tweenTransformPathPointsPathVector2 = [];
        this.tweenTransformPathPointsPathNumber = [];
        this.tweenTransformPathFixedDuration = false;
        this.tweenTransformPathDurations = [];
        this.tweenTransformPathDelays = [];
        this.tweenTransformPathOrientation = TweenAnimation_1.TweenOrientation.Fixed;
        this.tweenTransformPathPathType = TweenAnimation_1.TweenPathType.Curve;
        this._initTransform = null;
        this._tweenRotArray = [];
        this._tweenMoveArray = [];
        this._tweenScaleArray = [];
        this._tweenRotHead = null;
        this._tweenMoveHead = null;
        this._tweenScaleHead = null;
        this._objectAim = null;
        this._objectUp = null;
        this._prevPathUp3D = null;
        this._prevPathForward3D = null;
        this._prevPos = null;
        this._objectPos = new APJS.Vector3f();
        this._forward = new APJS.Vector3f();
        this._midForward = new APJS.Vector3f();
        this._pathOutward = new APJS.Vector3f();
        this._pathUp = new APJS.Vector3f();
        this._orientation = TweenAnimation_1.TweenOrientation.Fixed;
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
    get pointsPathVector3() {
        return this.tweenTransformPathPointsPathVector3;
    }
    set pointsPathVector3(value) {
        this.tweenTransformPathPointsPathVector3 = value;
        this._dirty = true;
    }
    get pointsPathVector2() {
        return this.tweenTransformPathPointsPathVector2;
    }
    set pointsPathVector2(value) {
        this.tweenTransformPathPointsPathVector2 = value;
        this._dirty = true;
    }
    get pointsPathNumber() {
        return this.tweenTransformPathPointsPathNumber;
    }
    set pointsPathNumber(value) {
        this.tweenTransformPathPointsPathNumber = value;
        this._dirty = true;
    }
    get fixedDuration() {
        return this.tweenTransformPathFixedDuration;
    }
    set fixedDuration(value) {
        this.tweenTransformPathFixedDuration = value;
        this._dirty = true;
    }
    get durations() {
        return this.tweenTransformPathDurations;
    }
    set durations(value) {
        this.tweenTransformPathDurations = value;
        this._dirty = true;
    }
    get delays() {
        return this.tweenTransformPathDelays;
    }
    set delays(value) {
        this.tweenTransformPathDelays = value;
        this._dirty = true;
    }
    get orientation() {
        return this.tweenTransformPathOrientation;
    }
    set orientation(value) {
        this.tweenTransformPathOrientation = value;
        this._orientation = value;
        this._dirty = true;
    }
    get pathType() {
        return this.tweenTransformPathPathType;
    }
    set pathType(value) {
        this.tweenTransformPathPathType = value;
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
        this._orientation = this.tweenTransformPathOrientation;
    }
    create(restartFromBegin = true) {
        if (!this._objectTransform)
            return;
        if (this.transform3D) {
            if (!this.tweenTransformPathPointsPathVector3 || (this.tweenTransformPathPointsPathVector3 && this.tweenTransformPathPointsPathVector3.length < 2))
                return;
            this._initTransform = {
                pos: this._objectTransform.localPosition,
                rot: this._objectTransform.localEulerAngles,
                scale: this._objectTransform.localScale,
            };
            switch (this.tweenAnimationTargetType) {
                case TweenAnimation_1.TweenTargetType.Rotation:
                    this.createTweenRots();
                    break;
                case TweenAnimation_1.TweenTargetType.Position:
                    this.createTweenMoves();
                    break;
                case TweenAnimation_1.TweenTargetType.Scale:
                    this.createTweenScales();
                    break;
            }
        }
        else {
            if (this.tweenAnimationTargetType === TweenAnimation_1.TweenTargetType.Scale || this.tweenAnimationTargetType === TweenAnimation_1.TweenTargetType.Position) {
                if (!this.tweenTransformPathPointsPathVector2 || (this.tweenTransformPathPointsPathVector2 && this.tweenTransformPathPointsPathVector2.length < 2))
                    return;
            }
            else {
                if (!this.tweenTransformPathPointsPathNumber || (this.tweenTransformPathPointsPathNumber && this.tweenTransformPathPointsPathNumber.length < 2))
                    return;
            }
            const sceneObjectTransform = this._objectTransform;
            this._initTransform = {
                rot: sceneObjectTransform.rotation,
                pos: sceneObjectTransform.anchoredPosition,
                scale: sceneObjectTransform.scale
            };
            switch (this.tweenAnimationTargetType) {
                case TweenAnimation_1.TweenTargetType.Rotation:
                    this.createTweenRots();
                    break;
                case TweenAnimation_1.TweenTargetType.Position:
                    this.createTweenMoves();
                    break;
                case TweenAnimation_1.TweenTargetType.Scale:
                    this.createTweenScales();
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
    start() {
        if (!this._objectTransform)
            return;
        if (this._tweenRotHead) {
            this._tweenRotHead.start();
            if (this._paused) {
                this._tweenRotHead.pause();
            }
        }
        if (this._tweenMoveHead) {
            this._tweenMoveHead.start();
            if (this._paused) {
                this._tweenMoveHead.pause();
            }
        }
        if (this._tweenScaleHead) {
            this._tweenScaleHead.start();
            if (this._paused) {
                this._tweenScaleHead.pause();
            }
        }
    }
    stop() {
        if (!this._objectTransform)
            return;
        if (this._tweenRotHead) {
            this._tweenRotHead.stop();
            for (const tweenRot of this._tweenRotArray) {
                if (tweenRot) {
                    tweenRot.stop();
                }
            }
        }
        if (this._tweenMoveHead) {
            this._tweenMoveHead.stop();
            for (const tweenMov of this._tweenMoveArray) {
                if (tweenMov) {
                    tweenMov.stop();
                }
            }
        }
        if (this._tweenScaleHead) {
            this._tweenScaleHead.stop();
            for (const tweenScal of this._tweenScaleArray) {
                if (tweenScal) {
                    tweenScal.stop();
                }
            }
        }
    }
    pause() {
        this._paused = true;
        this.tweenAnimationPaused = true;
        if (!this._objectTransform)
            return;
        for (const tweenRot of this._tweenRotArray) {
            tweenRot.pause();
        }
        for (const tweenMov of this._tweenMoveArray) {
            tweenMov.pause();
        }
        for (const tweenScal of this._tweenScaleArray) {
            tweenScal.pause();
        }
    }
    resume() {
        this._paused = false;
        if (!this._objectTransform)
            return;
        for (const tweenRot of this._tweenRotArray) {
            if (tweenRot && tweenRot.isPaused()) {
                tweenRot.resume();
            }
        }
        for (const tweenMov of this._tweenMoveArray) {
            if (tweenMov && tweenMov.isPaused()) {
                tweenMov.resume();
            }
        }
        for (const tweenScal of this._tweenScaleArray) {
            if (tweenScal && tweenScal.isPaused()) {
                tweenScal.resume();
            }
        }
    }
    updateInternal() {
        if (!this._objectTransform) {
            return;
        }
        if (this._tweenRotHead) {
            for (const tweenRot of this._tweenRotArray) {
                if (tweenRot) {
                    tweenRot.update();
                }
            }
        }
        if (this._tweenMoveHead) {
            for (const tweenMov of this._tweenMoveArray) {
                if (tweenMov) {
                    tweenMov.update();
                }
            }
            if (this._orientation === TweenAnimation_1.TweenOrientation.Path) {
                this.updateTweenMovOrient();
            }
        }
        if (this._tweenScaleHead) {
            for (const tweenScale of this._tweenScaleArray) {
                if (tweenScale) {
                    tweenScale.update();
                }
            }
        }
    }
    clear() {
        if (!this._objectTransform)
            return;
        if (this._tweenRotHead) {
            this._tweenRotHead.stop();
            TWEEN.remove(this._tweenRotHead);
            this._tweenRotHead = null;
            for (let tweenRot of this._tweenRotArray) {
                if (tweenRot) {
                    tweenRot.stop();
                    TWEEN.remove(tweenRot);
                    tweenRot = null;
                }
            }
            this._tweenRotArray = [];
            if (this.transform3D && this._initTransform)
                this._objectTransform.localEulerAngles = this._initTransform.rot;
            else if (this._initTransform)
                this._objectTransform.rotation = this._initTransform.rot;
        }
        if (this._tweenMoveHead) {
            this._tweenMoveHead.stop();
            TWEEN.remove(this._tweenMoveHead);
            this._tweenMoveHead = null;
            for (let tweenMov of this._tweenMoveArray) {
                if (tweenMov) {
                    tweenMov.stop();
                    TWEEN.remove(tweenMov);
                    tweenMov = null;
                }
            }
            this._tweenMoveArray = [];
            this._prevPathUp3D = null;
            this._prevPathForward3D = null;
            if (this.transform3D && this._initTransform) {
                this._objectTransform.localEulerAngles = this._initTransform.rot;
                this._objectTransform.localPosition = this._initTransform.pos;
            }
            else if (this._initTransform) {
                this._objectTransform.rotation = this._initTransform.rot;
                this._objectTransform.anchoredPosition = this._initTransform.pos;
            }
        }
        if (this._tweenScaleHead) {
            this._tweenScaleHead.stop();
            TWEEN.remove(this._tweenScaleHead);
            this._tweenScaleHead = null;
            for (let tweenScal of this._tweenScaleArray) {
                if (tweenScal) {
                    tweenScal.stop();
                    TWEEN.remove(tweenScal);
                    tweenScal = null;
                }
            }
            this._tweenScaleArray = [];
            if (this.transform3D && this._initTransform)
                this._objectTransform.localScale = this._initTransform.scale;
            else if (this._initTransform)
                this._objectTransform.scale = this._initTransform.scale;
        }
    }
    updateTweenMovOrient() {
        var _a, _b, _c;
        const isZeroVector = (v) => {
            if (v.x === 0 && v.y === 0 && v.z === 0)
                return true;
            return false;
        };
        if (!this._prevPos || !this._objectTransform)
            return;
        if (this.transform3D) {
            if (!this._prevPathUp3D || !this._objectAim || !this._objectUp) {
                return;
            }
            if (isZeroVector(this._prevPathUp3D))
                return;
            this._objectPos = this._objectTransform.getWorldPosition();
            this._forward.set(this._objectPos.x, this._objectPos.y, this._objectPos.z).subtract(this._prevPos).normalize();
            if (isZeroVector(this._forward))
                return;
            if (this._forward.dot(this._prevPathUp3D) === 0)
                this._pathUp.set(this._prevPathUp3D.x, this._prevPathUp3D.y, this._prevPathUp3D.z);
            else {
                if (!this._prevPathForward3D)
                    this._prevPathForward3D = this._forward.clone();
                const forwardShiftAngle = this._forward.dot(this._prevPathForward3D);
                if (forwardShiftAngle < 0)
                    this._pathOutward.set(this._prevPathUp3D.x, this._prevPathUp3D.y, this._prevPathUp3D.z).cross(this._forward);
                else if (forwardShiftAngle > 0)
                    this._pathOutward.set(this._forward.x, this._forward.y, this._forward.z).cross(this._prevPathUp3D);
                else {
                    this._midForward.set(-this._prevPathForward3D.x, -this._prevPathForward3D.y, -this._prevPathForward3D.z).add(this._forward).normalize();
                    const dir = this._forward.dot(this._prevPathUp3D);
                    if (dir === 1)
                        this._pathOutward.set(this._forward.x, this._forward.y, this._forward.z).cross(this._midForward);
                    else
                        this._pathOutward.set(this._midForward.x, this._midForward.y, this._midForward.z).cross(this._forward);
                }
                this._pathUp.set(this._pathOutward.x, this._pathOutward.y, this._pathOutward.z).cross(this._forward).normalize();
            }
            const worldRot = APJS.Quaternionf.lookAt(this._forward, this._pathUp);
            const localRot = APJS.Quaternionf.lookAt(this._objectAim, this._objectUp);
            this._objectTransform.setWorldRotation(worldRot.multiply(localRot));
            this._prevPathUp3D.set(this._pathUp.x, this._pathUp.y, this._pathUp.z);
            (_a = this._prevPathForward3D) === null || _a === void 0 ? void 0 : _a.set(this._forward.x, this._forward.y, this._forward.z);
        }
        else {
            const sceneObjectTransform = this._objectTransform;
            const orientDir = sceneObjectTransform.anchoredPosition.subtract(this._prevPos).normalize();
            const theta = (Math.acos(orientDir.y) * 180.0) / Math.PI;
            if (orientDir.x >= 0) {
                sceneObjectTransform.rotation = -theta + ((_b = this._initTransform) === null || _b === void 0 ? void 0 : _b.rot);
            }
            else {
                sceneObjectTransform.rotation = theta + ((_c = this._initTransform) === null || _c === void 0 ? void 0 : _c.rot);
            }
        }
    }
    createTweenRot(startIndex, endIndex, firstNode = false) {
        if (!this._objectTransform)
            return null;
        let startPoint;
        let endPoint;
        if (this.transform3D) {
            startPoint = this.tweenTransformPathPointsPathVector3[startIndex];
            endPoint = this.tweenTransformPathPointsPathVector3[endIndex];
        }
        else {
            startPoint = { x: this.tweenTransformPathPointsPathNumber[startIndex] };
            endPoint = { x: this.tweenTransformPathPointsPathNumber[endIndex] };
        }
        if (this.transform3D && firstNode)
            this._objectTransform.localEulerAngles = startPoint;
        if (!this.transform3D && firstNode)
            this._objectTransform.rotation = startPoint.x;
        const singleTweenRot = new TWEEN.Tween(startPoint);
        if (this.transform3D)
            singleTweenRot.to({ x: endPoint.x, y: endPoint.y, z: endPoint.z }, this.tweenAnimationDuration * 1000);
        else
            singleTweenRot.to(endPoint, this.tweenAnimationDuration * 1000);
        singleTweenRot.delay(this.tweenAnimationDelay * 1000);
        if (!this.fixedDuration) {
            if (startIndex < this.tweenTransformPathDurations.length) {
                singleTweenRot.duration(this.tweenTransformPathDurations[startIndex] * 1000);
            }
            if (startIndex < this.tweenTransformPathDelays.length) {
                singleTweenRot.delay(this.tweenTransformPathDelays[startIndex] * 1000);
            }
        }
        singleTweenRot.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
        const objectTransform = this._objectTransform;
        if (this.transform3D) {
            singleTweenRot.onUpdate((object) => {
                objectTransform.localEulerAngles = object;
            });
        }
        else {
            singleTweenRot.onUpdate((object) => {
                objectTransform.rotation = object.x;
            });
        }
        return singleTweenRot;
    }
    generatePt(p0, p1, theta = 15) {
        const Deg2Rad = (deg) => {
            return (deg / 360.0) * 2.0 * Math.PI;
        };
        const points = [];
        let controlPointUp;
        let controlPointDown;
        if (this.transform3D) {
            const p03f = p0;
            const p13f = p1;
            const extendLength = (Math.tan(Deg2Rad(theta)) * new APJS.Vector3f(p03f.x - p13f.x, p03f.y - p13f.y, p03f.z - p13f.z).magnitude()) / 2.0;
            const midPoint = new APJS.Vector3f((p03f.x + p13f.x) / 2.0, (p03f.y + p13f.y) / 2.0, (p03f.z + p13f.z) / 2.0);
            const lineDir = new APJS.Vector3f(p03f.x - p13f.x, p03f.y - p13f.y, p03f.z - p13f.z).normalize();
            let dir = new APJS.Vector3f(0.0, 1.0, 0.0);
            if ((lineDir.x === dir.x && lineDir.y === dir.y && lineDir.z === dir.z) ||
                (lineDir.x === -dir.x && lineDir.y === -dir.y && lineDir.z === -dir.z)) {
                dir = new APJS.Vector3f(1.0, 0.0, 0.0);
            }
            controlPointUp = new APJS.Vector3f(midPoint.x + extendLength * dir.x, midPoint.y + extendLength * dir.y, midPoint.z + extendLength * dir.z);
            controlPointDown = new APJS.Vector3f(midPoint.x - extendLength * dir.x, midPoint.y - extendLength * dir.y, midPoint.z - extendLength * dir.z);
        }
        else {
            const extendLength = (Math.tan(Deg2Rad(theta)) * new APJS.Vector3f(p0.x - p1.x, p0.y - p1.y, 0.0).magnitude()) / 2.0;
            const midPoint = new APJS.Vector3f((p0.x + p1.x) / 2.0, (p0.y + p1.y) / 2.0, 0.0);
            const lineDir = new APJS.Vector3f(p0.x - p1.x, p0.y - p1.y, 0.0).normalize();
            let dir = new APJS.Vector3f(0.0, 1.0, 0.0);
            if ((lineDir.x === dir.x && lineDir.y === dir.y && lineDir.z === dir.z) ||
                (lineDir.x === -dir.x && lineDir.y === -dir.y && lineDir.z === -dir.z)) {
                dir = new APJS.Vector3f(1.0, 0.0, 0.0);
            }
            controlPointUp = new APJS.Vector2f(midPoint.x + extendLength * dir.x, midPoint.y + extendLength * dir.y);
            controlPointDown = new APJS.Vector2f(midPoint.x - extendLength * dir.x, midPoint.y - extendLength * dir.y);
        }
        points.push(p0);
        points.push(controlPointUp);
        points.push(p1);
        points.push(controlPointDown);
        return points;
    }
    calInitPlaneN3D(pointPath) {
        if (!this.transform3D)
            return null;
        const constrainDir = (n) => {
            if (n.y < 0)
                return new APJS.Vector3f(-n.x, -n.y, -n.z);
            else if (n.y > 0)
                return new APJS.Vector3f(n.x, n.y, n.z);
            else {
                if (n.z < 0)
                    return new APJS.Vector3f(-n.x, -n.y, -n.z);
                else if (n.z > 0)
                    return new APJS.Vector3f(n.x, n.y, n.z);
                else {
                    if (n.x < 0)
                        return new APJS.Vector3f(-n.x, -n.y, -n.z);
                    else if (n.x > 0)
                        return new APJS.Vector3f(n.x, n.y, n.z);
                    else
                        return new APJS.Vector3f(0.0, 0.0, 0.0);
                }
            }
        };
        const calN = (ptPath, p0, index) => {
            const size = ptPath.length;
            if (index === size - 1)
                return new APJS.Vector3f(0.0, 0.0, 0.0);
            for (let i = index; i < size; i++) {
                const p1 = ptPath[i];
                if (i + 1 === size)
                    return new APJS.Vector3f(0.0, 0.0, 0.0);
                const p2 = ptPath[i + 1];
                const v1 = p0.clone().subtract(p1);
                const v2 = p0.clone().subtract(p2);
                if (v1.dot(v2) === 0)
                    continue;
                const n = v1.cross(v2).normalize();
                return constrainDir(n);
            }
            return new APJS.Vector3f(0.0, 0.0, 0.0);
        };
        let ptPath = pointPath;
        if (ptPath.length === 2) {
            if (ptPath[0].x === ptPath[1].x &&
                ptPath[0].y === ptPath[1].y &&
                ptPath[0].z === ptPath[1].z) {
                return new APJS.Vector3f(0.0, 0.0, 0.0);
            }
            ptPath = this.generatePt(ptPath[0], ptPath[1]);
            const p0 = ptPath[0];
            const p1 = ptPath[1];
            const p2 = ptPath[2];
            let dir;
            if (this.tweenTransformPathPathType === TweenAnimation_1.TweenPathType.Curve) {
                dir = new APJS.Vector3f(p0.x - p1.x, p0.y - p1.y, p0.z - p1.z);
            }
            else {
                dir = new APJS.Vector3f(p0.x - p2.x, p0.y - p2.y, p0.z - p2.z);
            }
            this._prevPos = new APJS.Vector3f(p0.x + dir.x, p0.y + dir.y, p0.z + dir.z);
            return calN(ptPath, p0, 1);
        }
        else {
            const p0 = ptPath[0];
            let index = 1;
            for (let i = 1; i < ptPath.length; i++) {
                const currPt = ptPath[i];
                if (currPt.x !== p0.x || currPt.y !== p0.y || currPt.z !== p0.z) {
                    index = i;
                    break;
                }
                index++;
            }
            if (index >= ptPath.length)
                return new APJS.Vector3f(0.0, 0.0, 0.0);
            const p1 = ptPath[index];
            const dir = new APJS.Vector3f(p0.x - p1.x, p0.y - p1.y, p0.z - p1.z);
            this._prevPos = new APJS.Vector3f(p0.x + dir.x, p0.y + dir.y, p0.z + dir.z);
            const N = calN(ptPath, p0, index);
            if (N.x === 0 && N.y === 0 && N.z === 0) {
                ptPath = this.generatePt(p0, p1);
                return calN(ptPath, ptPath[0], 1);
            }
            return N;
        }
    }
    getFlippedLoopPoints(points, index, reverse = false) {
        const length = points.length;
        const mapIndex = reverse ? index + length + 1 : index + length - 1;
        const p0 = points[mapIndex % length];
        const p1 = reverse ? points[(mapIndex - 1) % length] : points[(mapIndex + 1) % length];
        const p2 = reverse ? points[(mapIndex - 2) % length] : points[(mapIndex + 2) % length];
        const p3 = reverse ? points[(mapIndex - 3) % length] : points[(mapIndex + 3) % length];
        if (this.transform3D) {
            return { x: [p0.x, p1.x, p2.x, p3.x], y: [p0.y, p1.y, p2.y, p3.y], z: [p0.z, p1.z, p2.z, p3.z] };
        }
        return { x: [p0.x, p1.x, p2.x, p3.x], y: [p0.y, p1.y, p2.y, p3.y] };
    }
    createTweenMove(startIndex, endIndex, firstNode = false, reverse = false) {
        if (!this._objectTransform)
            return null;
        if (this.transform3D) {
            this._objectAim = this._objectTransform.getWorldRotation().multiplyVector(new APJS.Vector3f(0, 1, 0)).normalize();
            this._objectUp = this._objectTransform.getWorldRotation().multiplyVector(new APJS.Vector3f(0, 1, 0)).normalize();
        }
        let startPoint;
        let endPoint;
        if (this.transform3D) {
            startPoint = this.tweenTransformPathPointsPathVector3[startIndex];
            endPoint = this.tweenTransformPathPointsPathVector3[endIndex];
        }
        else {
            startPoint = this.tweenTransformPathPointsPathVector2[startIndex];
            endPoint = this.tweenTransformPathPointsPathVector2[endIndex];
        }
        if (this.transform3D && firstNode)
            this._objectTransform.localPosition = startPoint;
        if (!this.transform3D && firstNode)
            this._objectTransform.anchoredPosition = startPoint;
        const singleTweenMov = new TWEEN.Tween(startPoint);
        singleTweenMov.ClosedLoopInterpolate(false);
        if (firstNode) {
            this._prevPathUp3D = this.calInitPlaneN3D(this.pointsPathVector3);
        }
        if (this.tweenTransformPathPathType === TweenAnimation_1.TweenPathType.Curve) {
            singleTweenMov.ClosedLoopInterpolate(true);
            let currPoints = [];
            if (this.transform3D) {
                for (let i = 0; i < this.tweenTransformPathPointsPathVector3.length; i++) {
                    const pt = this.tweenTransformPathPointsPathVector3[i].clone();
                    currPoints.push(pt);
                }
            }
            else {
                for (let i = 0; i < this.tweenTransformPathPointsPathVector2.length; i++) {
                    const pt = this.tweenTransformPathPointsPathVector2[i].clone();
                    currPoints.push(pt);
                }
            }
            if (currPoints.length === 2) {
                if (this.transform3D) {
                    currPoints = this.generatePt(this.tweenTransformPathPointsPathVector3[0], this.tweenTransformPathPointsPathVector3[1]);
                }
                else {
                    currPoints = this.generatePt(this.tweenTransformPathPointsPathVector2[0], this.tweenTransformPathPointsPathVector2[1]);
                }
                singleTweenMov.closedLoopTo(this.getFlippedLoopPoints(currPoints, startIndex * 2, reverse));
                singleTweenMov.interpolation(TWEEN.Interpolation.CatmullRomClosedLoop2Pt);
            }
            else {
                singleTweenMov.closedLoopTo(this.getFlippedLoopPoints(currPoints, startIndex, reverse));
                singleTweenMov.interpolation(TWEEN.Interpolation.CatmullRomClosedLoop);
            }
        }
        if (this.transform3D) {
            singleTweenMov.to({ x: endPoint.x, y: endPoint.y, z: endPoint.z }, this.tweenAnimationDuration * 1000);
        }
        else {
            singleTweenMov.to({ x: endPoint.x, y: endPoint.y }, this.tweenAnimationDuration * 1000);
        }
        singleTweenMov.delay(this.tweenAnimationDelay * 1000);
        if (!this.tweenTransformPathFixedDuration) {
            if (startIndex < this.tweenTransformPathDurations.length) {
                singleTweenMov.duration(this.tweenTransformPathDurations[startIndex] * 1000);
            }
            if (startIndex < this.tweenTransformPathDelays.length) {
                singleTweenMov.delay(this.tweenTransformPathDelays[startIndex] * 1000);
            }
        }
        singleTweenMov.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
        const objectTransform = this._objectTransform;
        if (this.transform3D) {
            singleTweenMov.onUpdate((object) => {
                if (this._orientation === TweenAnimation_1.TweenOrientation.Path) {
                    this._prevPos = objectTransform.localPosition;
                }
                objectTransform.localPosition = object;
            });
        }
        else {
            singleTweenMov.onUpdate((object) => {
                if (this._orientation === TweenAnimation_1.TweenOrientation.Path) {
                    this._prevPos = objectTransform.anchoredPosition;
                }
                objectTransform.anchoredPosition = object;
            });
        }
        return singleTweenMov;
    }
    createTweenScale(startIndex, endIndex, firstNode = false) {
        if (!this._objectTransform)
            return null;
        let startPoint;
        let endPoint;
        if (this.transform3D) {
            startPoint = this.tweenTransformPathPointsPathVector3[startIndex];
            endPoint = this.tweenTransformPathPointsPathVector3[endIndex];
        }
        else {
            startPoint = this.tweenTransformPathPointsPathVector2[startIndex];
            endPoint = this.tweenTransformPathPointsPathVector2[endIndex];
        }
        if (this.transform3D && firstNode)
            this._objectTransform.localScale = startPoint;
        if (!this.transform3D && firstNode)
            this._objectTransform.scale = startPoint;
        const singleTweenScal = new TWEEN.Tween(startPoint);
        if (this.transform3D)
            singleTweenScal.to({ x: endPoint.x, y: endPoint.y, z: endPoint.z }, this.tweenAnimationDuration * 1000);
        if (!this.transform3D)
            singleTweenScal.to({ x: endPoint.x, y: endPoint.y }, this.tweenAnimationDuration * 1000);
        singleTweenScal.delay(this.tweenAnimationDelay * 1000);
        if (!this.tweenTransformPathFixedDuration) {
            if (startIndex < this.tweenTransformPathDurations.length) {
                singleTweenScal.duration(this.tweenTransformPathDurations[startIndex] * 1000);
            }
            if (startIndex < this.tweenTransformPathDelays.length) {
                singleTweenScal.delay(this.tweenTransformPathDelays[startIndex] * 1000);
            }
        }
        singleTweenScal.easing(TWEEN.Easing[this.tweenAnimationEasingFunction][this.tweenAnimationEasingType]);
        const objectTransform = this._objectTransform;
        if (this.transform3D) {
            singleTweenScal.onUpdate((object) => {
                objectTransform.localScale = object;
            });
        }
        else {
            singleTweenScal.onUpdate((object) => {
                objectTransform.scale = object;
            });
        }
        return singleTweenScal;
    }
    createTweenRots() {
        let startIndex = 0;
        let endIndex = 0;
        if (this.transform3D) {
            for (let i = 0; i < this.pointsPathVector3.length; i++) {
                startIndex = i;
                endIndex = i + 1 < this.pointsPathVector3.length ? i + 1 : 0;
                let currRot;
                if (i === 0) {
                    currRot = this.createTweenRot(startIndex, endIndex, true);
                }
                else {
                    currRot = this.createTweenRot(startIndex, endIndex);
                }
                this._tweenRotArray.push(currRot);
            }
        }
        else {
            for (let i = 0; i < this.tweenTransformPathPointsPathNumber.length; i++) {
                startIndex = i;
                endIndex = i + 1 < this.tweenTransformPathPointsPathNumber.length ? i + 1 : 0;
                let currRot;
                if (i === 0) {
                    currRot = this.createTweenRot(startIndex, endIndex, true);
                }
                else {
                    currRot = this.createTweenRot(startIndex, endIndex);
                }
                this._tweenRotArray.push(currRot);
            }
        }
        if (this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPong || this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPongOnce) {
            if (this.transform3D) {
                for (let i = this.tweenTransformPathPointsPathVector3.length; i > 0; i--) {
                    startIndex = i === this.tweenTransformPathPointsPathVector3.length ? 0 : i;
                    endIndex = i - 1;
                    const currRot = this.createTweenRot(startIndex, endIndex);
                    this._tweenRotArray.push(currRot);
                }
            }
            else {
                for (let i = this.tweenTransformPathPointsPathNumber.length; i > 0; i--) {
                    startIndex = i === this.tweenTransformPathPointsPathNumber.length ? 0 : i;
                    endIndex = i - 1;
                    const currRot = this.createTweenRot(startIndex, endIndex);
                    this._tweenRotArray.push(currRot);
                }
            }
        }
        if (this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.Loop || this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPong) {
            for (let i = 0; i < this._tweenRotArray.length - 1; i++) {
                this._tweenRotArray[i].chain(this._tweenRotArray[i + 1]);
            }
            this._tweenRotArray[this._tweenRotArray.length - 1].chain(this._tweenRotArray[0]);
            this._tweenRotHead = this._tweenRotArray[0];
        }
        else if (this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.LoopOnce || this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPongOnce) {
            for (let i = 0; i < this._tweenRotArray.length - 1; i++) {
                this._tweenRotArray[i].chain(this._tweenRotArray[i + 1]);
            }
            this._tweenRotHead = this._tweenRotArray[0];
        }
    }
    createTweenMoves() {
        let startIndex = 0;
        let endIndex = 0;
        if (this.transform3D) {
            for (let i = 0; i < this.tweenTransformPathPointsPathVector3.length; i++) {
                startIndex = i;
                endIndex = i + 1 < this.tweenTransformPathPointsPathVector3.length ? i + 1 : 0;
                let currMov;
                if (i === 0) {
                    currMov = this.createTweenMove(startIndex, endIndex, true);
                }
                else {
                    currMov = this.createTweenMove(startIndex, endIndex);
                }
                this._tweenMoveArray.push(currMov);
            }
        }
        else {
            for (let i = 0; i < this.tweenTransformPathPointsPathVector2.length; i++) {
                startIndex = i;
                endIndex = i + 1 < this.tweenTransformPathPointsPathVector2.length ? i + 1 : 0;
                let currMov;
                if (i === 0) {
                    currMov = this.createTweenMove(startIndex, endIndex, true);
                }
                else {
                    currMov = this.createTweenMove(startIndex, endIndex);
                }
                this._tweenMoveArray.push(currMov);
            }
        }
        if (this.transform3D) {
            if (this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPong || this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPongOnce) {
                for (let i = this.tweenTransformPathPointsPathVector3.length; i > 0; i--) {
                    startIndex = i === this.tweenTransformPathPointsPathVector3.length ? 0 : i;
                    endIndex = i - 1;
                    const currMov = this.createTweenMove(startIndex, endIndex, false, true);
                    this._tweenMoveArray.push(currMov);
                }
            }
        }
        else {
            if (this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPong || this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPongOnce) {
                for (let i = this.tweenTransformPathPointsPathVector2.length; i > 0; i--) {
                    startIndex = i === this.tweenTransformPathPointsPathVector2.length ? 0 : i;
                    endIndex = i - 1;
                    const currMov = this.createTweenMove(startIndex, endIndex, false, true);
                    this._tweenMoveArray.push(currMov);
                }
            }
        }
        if (this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.Loop || this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPong) {
            for (let i = 0; i < this._tweenMoveArray.length - 1; i++) {
                this._tweenMoveArray[i].chain(this._tweenMoveArray[i + 1]);
            }
            this._tweenMoveArray[this._tweenMoveArray.length - 1].chain(this._tweenMoveArray[0]);
            this._tweenMoveHead = this._tweenMoveArray[0];
        }
        else if (this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.LoopOnce || this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPongOnce) {
            for (let i = 0; i < this._tweenMoveArray.length - 1; i++) {
                this._tweenMoveArray[i].chain(this._tweenMoveArray[i + 1]);
            }
            this._tweenMoveHead = this._tweenMoveArray[0];
        }
    }
    createTweenScales() {
        let startIndex = 0;
        let endIndex = 0;
        if (this.transform3D) {
            for (let i = 0; i < this.tweenTransformPathPointsPathVector3.length; i++) {
                startIndex = i;
                endIndex = i + 1 < this.tweenTransformPathPointsPathVector3.length ? i + 1 : 0;
                let currScal;
                if (i === 0) {
                    currScal = this.createTweenScale(startIndex, endIndex, true);
                }
                else {
                    currScal = this.createTweenScale(startIndex, endIndex);
                }
                this._tweenScaleArray.push(currScal);
            }
        }
        else {
            for (let i = 0; i < this.tweenTransformPathPointsPathVector2.length; i++) {
                startIndex = i;
                endIndex = i + 1 < this.tweenTransformPathPointsPathVector2.length ? i + 1 : 0;
                let currScal;
                if (i === 0) {
                    currScal = this.createTweenScale(startIndex, endIndex, true);
                }
                else {
                    currScal = this.createTweenScale(startIndex, endIndex);
                }
                this._tweenScaleArray.push(currScal);
            }
        }
        if (this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPong || this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPongOnce) {
            if (this.transform3D) {
                for (let i = this.tweenTransformPathPointsPathVector3.length; i > 0; i--) {
                    startIndex = i === this.tweenTransformPathPointsPathVector3.length ? 0 : i;
                    endIndex = i - 1;
                    const currScal = this.createTweenScale(startIndex, endIndex);
                    this._tweenScaleArray.push(currScal);
                }
            }
            else {
                for (let i = this.tweenTransformPathPointsPathVector2.length; i > 0; i--) {
                    startIndex = i === this.tweenTransformPathPointsPathVector2.length ? 0 : i;
                    endIndex = i - 1;
                    const currScal = this.createTweenScale(startIndex, endIndex);
                    this._tweenScaleArray.push(currScal);
                }
            }
        }
        if (this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.Loop || this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPong) {
            for (let i = 0; i < this._tweenScaleArray.length - 1; i++) {
                this._tweenScaleArray[i].chain(this._tweenScaleArray[i + 1]);
            }
            this._tweenScaleArray[this._tweenScaleArray.length - 1].chain(this._tweenScaleArray[0]);
            this._tweenScaleHead = this._tweenScaleArray[0];
        }
        else if (this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.LoopOnce || this.tweenAnimationPlayMode === TweenAnimation_1.TweenPlayMode.PingPongOnce) {
            for (let i = 0; i < this._tweenScaleArray.length - 1; i++) {
                this._tweenScaleArray[i].chain(this._tweenScaleArray[i + 1]);
            }
            this._tweenScaleHead = this._tweenScaleArray[0];
        }
    }
};
__decorate([
    serialize
], TweenTransformPath.prototype, "tweenTransformPathPointsPathVector3", void 0);
__decorate([
    serialize
], TweenTransformPath.prototype, "tweenTransformPathPointsPathVector2", void 0);
__decorate([
    serialize
], TweenTransformPath.prototype, "tweenTransformPathPointsPathNumber", void 0);
__decorate([
    serialize
], TweenTransformPath.prototype, "tweenTransformPathFixedDuration", void 0);
__decorate([
    serialize
], TweenTransformPath.prototype, "tweenTransformPathDurations", void 0);
__decorate([
    serialize
], TweenTransformPath.prototype, "tweenTransformPathDelays", void 0);
__decorate([
    serialize
], TweenTransformPath.prototype, "tweenTransformPathOrientation", void 0);
__decorate([
    serialize
], TweenTransformPath.prototype, "tweenTransformPathPathType", void 0);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransformPath.prototype, "targetType", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty(Array)
], TweenTransformPath.prototype, "pointsPathVector3", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty(Array)
], TweenTransformPath.prototype, "pointsPathVector2", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty(Array)
], TweenTransformPath.prototype, "pointsPathNumber", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransformPath.prototype, "fixedDuration", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty(Array)
], TweenTransformPath.prototype, "durations", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty(Array)
], TweenTransformPath.prototype, "delays", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransformPath.prototype, "orientation", null);
__decorate([
    userPublicAPI(),
    dualInstanceProperty()
], TweenTransformPath.prototype, "pathType", null);
__decorate([
    userPrivateAPI()
], TweenTransformPath.prototype, "cacheData", null);
__decorate([
    userPrivateAPI()
], TweenTransformPath.prototype, "create", null);
__decorate([
    userPrivateAPI()
], TweenTransformPath.prototype, "update", null);
__decorate([
    userPublicAPI()
], TweenTransformPath.prototype, "start", null);
__decorate([
    userPublicAPI()
], TweenTransformPath.prototype, "stop", null);
__decorate([
    userPublicAPI()
], TweenTransformPath.prototype, "pause", null);
__decorate([
    userPublicAPI()
], TweenTransformPath.prototype, "resume", null);
TweenTransformPath = __decorate([
    registerClass()
], TweenTransformPath);
exports.TweenTransformPath = TweenTransformPath;
hideAPIPrototype(TweenTransformPath);
