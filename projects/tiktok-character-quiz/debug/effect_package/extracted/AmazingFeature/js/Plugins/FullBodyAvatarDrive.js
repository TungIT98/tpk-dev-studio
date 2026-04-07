"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FullBodyAvatarDrive_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullBodyAvatarDrive = exports.FullBodyBoneName = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, userPublicAPI, userPrivateAPI, hideAPIPrototype } = APJS;
var FullBodyBoneName;
(function (FullBodyBoneName) {
    FullBodyBoneName["Pelvis"] = "Pelvis";
    FullBodyBoneName["Spine1"] = "Spine1";
    FullBodyBoneName["Spine2"] = "Spine2";
    FullBodyBoneName["Spine3"] = "Spine3";
    FullBodyBoneName["Neck"] = "Neck";
    FullBodyBoneName["Head"] = "Head";
    FullBodyBoneName["LeftShoulder"] = "L_Shoulder";
    FullBodyBoneName["LeftUpperArm"] = "L_UpperArm";
    FullBodyBoneName["LeftForeArm"] = "L_ForeArm";
    FullBodyBoneName["LeftHand"] = "L_Hand";
    FullBodyBoneName["RightShoulder"] = "R_Shoulder";
    FullBodyBoneName["RightUpperArm"] = "R_UpperArm";
    FullBodyBoneName["RightForeArm"] = "R_ForeArm";
    FullBodyBoneName["RightHand"] = "R_Hand";
    FullBodyBoneName["LeftThigh"] = "L_Thigh";
    FullBodyBoneName["LeftShin"] = "L_Shin";
    FullBodyBoneName["LeftFoot"] = "L_Foot";
    FullBodyBoneName["RightThigh"] = "R_Thigh";
    FullBodyBoneName["RightShin"] = "R_Shin";
    FullBodyBoneName["RightFoot"] = "R_Foot";
})(FullBodyBoneName = exports.FullBodyBoneName || (exports.FullBodyBoneName = {}));
let FullBodyAvatarDrive = FullBodyAvatarDrive_1 = class FullBodyAvatarDrive extends APJS.DynamicComponent {
    constructor(rtti) {
        super(rtti);
        this.sceneObject = null;
        this.scene = null;
        this.cameraTransform = null;
        this.cameraComponent = null;
        this.orgCameraFOV = 60;
        this.boneTransform = {};
        this.boneInitRotation = {};
        this.currBoneRotation = {};
        this.modelRatio = 1.0;
        this.pelvisScale = new APJS.Vector3f(1, 1, 1);
        this.useModelScale = true;
        this.renderers = [];
        this.renderersInitEnabled = [];
        this.rendererEntities = new Set();
        this.frameIndex = 0;
        this.frameNumber = 50;
        this.step = 0.02;
        this.running = true;
        this.horizontalOffset = 0.0;
        this.verticalOffset = 0.0;
        this.m_isReady = false;
        this.isVisible = true;
        this.followBody = true;
        this.Head = null;
        this.L_Foot = null;
        this.L_ForeArm = null;
        this.L_Hand = null;
        this.L_Shin = null;
        this.L_Shoulder = null;
        this.L_Thigh = null;
        this.L_UpperArm = null;
        this.Neck = null;
        this.Pelvis = null;
        this.R_Foot = null;
        this.R_ForeArm = null;
        this.R_Hand = null;
        this.R_Shin = null;
        this.R_Shoulder = null;
        this.R_Thigh = null;
        this.R_UpperArm = null;
        this.Spine1 = null;
        this.Spine2 = null;
        this.Spine3 = null;
        this.name = 'FullBodyAvatarDrive';
    }
    getBone(boneName) {
        var _a;
        const transform = this[boneName];
        if (transform && transform instanceof APJS.Transform) {
            return (_a = transform.getSceneObject()) !== null && _a !== void 0 ? _a : null;
        }
        return null;
    }
    get isReady() {
        return this.m_isReady;
    }
    validQuat(quat) {
        if (!quat) {
            return false;
        }
        const value = quat.x * quat.x + quat.y * quat.y + quat.z * quat.z + quat.w * quat.w;
        return Math.abs(value - 1.0) < 0.2;
    }
    resetBones() {
        if (this.frameIndex < this.frameNumber) {
            this.frameIndex = this.frameIndex + 1;
        }
        const percent = this.frameIndex * this.step;
        const temp = new APJS.Quaternionf();
        for (const boneId in FullBodyAvatarDrive_1.kBoneNameMap) {
            const boneTransform = this.boneTransform[boneId];
            if (boneTransform && !this.currBoneRotation[boneId]) {
                boneTransform.setWorldRotation(this.boneInitRotation[boneId]);
            }
            else {
                if (boneTransform) {
                    let currQua = this.currBoneRotation[boneId];
                    const initRotation = this.boneInitRotation[boneId];
                    const beginRotation = temp
                        .set(currQua.x, currQua.y, currQua.z, currQua.w)
                        .multiply(initRotation);
                    const endRotation = initRotation;
                    currQua = APJS.Quaternionf.slerp(beginRotation, endRotation, percent);
                    boneTransform.setWorldRotation(currQua);
                }
            }
        }
    }
    prepareCamera() {
        var _a, _b;
        const sceneObjects = (_a = this.scene) === null || _a === void 0 ? void 0 : _a.getAllSceneObjects();
        const length = (_b = sceneObjects === null || sceneObjects === void 0 ? void 0 : sceneObjects.length) !== null && _b !== void 0 ? _b : 0;
        for (let i = 0; i < length; i++) {
            const childObject = sceneObjects[i];
            const cameras = childObject.getComponentsRecursive('Camera');
            for (let j = 0; j < cameras.length; ++j) {
                const camera = cameras[j];
                const cameraSceneObject = camera.getSceneObject();
                for (const rendererEnt of this.rendererEntities) {
                    if (cameraSceneObject.isEnabledInHierarchy() && camera.isSceneObjectVisible(rendererEnt)) {
                        this.cameraComponent = camera;
                        this.orgCameraFOV = camera.fov;
                        this.cameraTransform = cameraSceneObject.getTransform();
                        return;
                    }
                }
            }
        }
    }
    onInit() {
        this.sceneObject = this.getSceneObject();
        this.scene = this.sceneObject.scene;
        const rootTransform = this.sceneObject.getTransform();
        const identityRotation = new APJS.Quaternionf(0.0, 0.0, 0.0, 1.0);
        const identityScale = new APJS.Vector3f(1.0, 1.0, 1.0);
        let rootTransformRotation = identityRotation;
        let rootTransformScale = identityScale;
        if (rootTransform && typeof rootTransform !== 'undefined') {
            rootTransformRotation = rootTransform.getWorldRotation();
            rootTransformScale = rootTransform.getWorldScale();
            rootTransform.setWorldRotation(identityRotation);
            rootTransform.setWorldScale(identityScale);
        }
        for (const boneId in FullBodyAvatarDrive_1.kBoneNameMap) {
            const boneTran = this[FullBodyAvatarDrive_1.kBoneNameMap[boneId]];
            if (boneTran && typeof boneTran !== 'undefined') {
                this.boneInitRotation[boneId] = boneTran.getWorldRotation();
                this.boneTransform[boneId] = boneTran;
            }
            else {
                console.warn('full skeleton does not match');
            }
        }
        if (this.boneTransform['eSpine'] && this.boneTransform['ePelvis'] && this.boneTransform['eHead']) {
            const algoHeadPos = new APJS.Vector3f(0.00498956, 0.3525724, 0.03653179);
            const algoPelvisPos = new APJS.Vector3f(-0.00179506, -0.22333343, 0.02821913);
            const algoDist = algoHeadPos.distance(algoPelvisPos);
            const avatarHeadPos = this.boneTransform['eHead'].getWorldPosition();
            const avatarPelvisPos = this.boneTransform['ePelvis'].getWorldPosition();
            const avatarDist = avatarHeadPos.distance(avatarPelvisPos);
            this.modelRatio = algoDist / avatarDist;
            this.pelvisScale = this.boneTransform['ePelvis'].getWorldScale();
        }
        else {
            this.useModelScale = false;
        }
        if (rootTransform && typeof rootTransform !== 'undefined') {
            rootTransform.setWorldRotation(rootTransformRotation);
            rootTransform.setWorldScale(rootTransformScale);
        }
        this.renderers = this.sceneObject.getComponentsRecursive('Renderer');
        for (let i = 0; i < this.renderers.length; i++) {
            const renderer = this.renderers[i];
            this.renderersInitEnabled.push(renderer.enabled);
            this.rendererEntities.add(renderer.getSceneObject());
        }
        this.prepareCamera();
        this.resetBones();
    }
    onUpdate() {
        var _a;
        if (this.cameraComponent === null) {
            this.prepareCamera();
        }
        if (!this.running || !this.cameraComponent) {
            this.frameIndex = this.frameNumber;
            this.resetBones();
            return;
        }
        let validTracking = true;
        let avatarInfo = null;
        const result = APJS.AlgorithmManager.getResult();
        const body3D = {
            trackingMode: false,
            count: 0,
            bodies: [],
        };
        body3D.trackingMode = result.getAvatar3DInfoTracking();
        body3D.count = result.getAvatar3DInfoCount();
        for (let i = 0; i < body3D.count; ++i) {
            const body = result.getAvatar3DInfo(i);
            if (body) {
                body3D.bodies.push(body);
            }
        }
        while (true) {
            if (!this.cameraTransform) {
                validTracking = false;
                break;
            }
            const graphNode = APJS.AlgorithmManager.getGraphNode('', 'skeleton_0');
            if (!body3D.trackingMode) {
                graphNode.setInt('base_skip_frames', 0);
                graphNode.setInt('skeleton_image_mode', 1);
                graphNode.setInt('skeleton_body_max_count', 2);
            }
            else {
                graphNode.setInt('base_skip_frames', -1);
            }
            const avatarCount = body3D.bodies.length;
            if (avatarCount < 1) {
                validTracking = false;
                break;
            }
            avatarInfo = body3D.bodies[0];
            break;
        }
        const followBody = this.followBody;
        const isDetected = 0 < body3D.bodies.length;
        const isVisible = this.isVisible;
        for (let i = 0; i < this.renderers.length; i++) {
            const renderer = this.renderers[i];
            if (!isDetected && followBody) {
                renderer.enabled = false;
            }
            else {
                renderer.enabled = this.renderersInitEnabled[i] && isVisible;
            }
        }
        if (!validTracking) {
            return;
        }
        if (avatarInfo && avatarInfo.focalLength !== 0) {
            const tanAlgoHalfFov = (0.5 * avatarInfo.imageHeight) / avatarInfo.focalLength;
            this.cameraComponent.fov = (Math.atan(tanAlgoHalfFov) * 360) / Math.PI;
            const tanRealHalfFov = Math.tan((this.cameraComponent.fov * Math.PI) / 360);
            const factor = tanRealHalfFov / tanAlgoHalfFov;
            const cameraMatrix = this.cameraTransform.getWorldMatrix();
            const cameraPosition = this.cameraTransform.getWorldPosition();
            const cameraRotation = this.cameraTransform.getWorldRotation();
            const rootTransform = this.sceneObject.getTransform();
            const quaternions = avatarInfo.quaternion;
            const quaternionsCount = quaternions.length / 4;
            const joints = avatarInfo.joints;
            if (followBody) {
                const identity = APJS.Matrix4x4f.identity();
                const modelScale = this.modelRatio * factor;
                if (rootTransform && typeof rootTransform !== 'undefined') {
                    rootTransform.setWorldMatrix(identity);
                }
                if (this.boneTransform['ePelvis']) {
                    const parentTransform = (_a = this.boneTransform['ePelvis'].getSceneObject().parent) === null || _a === void 0 ? void 0 : _a.getTransform();
                    if (parentTransform && typeof rootTransform !== 'undefined') {
                        parentTransform.setWorldMatrix(identity);
                    }
                    if (this.useModelScale) {
                        this.boneTransform['ePelvis'].localScale = new APJS.Vector3f(modelScale * this.pelvisScale.x, modelScale * this.pelvisScale.y, modelScale * this.pelvisScale.z);
                    }
                }
            }
            for (let i = 0; i < FullBodyAvatarDrive_1.kBoneIds.length - 1; i++) {
                const boneId = FullBodyAvatarDrive_1.kBoneIds[i];
                const parentId = FullBodyAvatarDrive_1.kParentMap[boneId];
                if (parentId && typeof parentId !== 'undefined') {
                    if (i > 0 && i < quaternionsCount - 1) {
                        const qua = new APJS.Quaternionf(quaternions[i * 4], quaternions[i * 4 + 1], quaternions[i * 4 + 2], quaternions[i * 4 + 3]);
                        let quatParent = this.currBoneRotation[parentId];
                        if (!quatParent) {
                            quatParent = new APJS.Quaternionf(0.0, 0.0, 0.0, 1.0);
                            this.currBoneRotation[parentId] = quatParent;
                        }
                        if (!this.currBoneRotation[boneId]) {
                            this.currBoneRotation[boneId] = new APJS.Quaternionf(quatParent.x, quatParent.y, quatParent.z, quatParent.w);
                        }
                        else {
                            this.currBoneRotation[boneId].set(quatParent.x, quatParent.y, quatParent.z, quatParent.w);
                        }
                        this.currBoneRotation[boneId].multiply(qua);
                    }
                }
                else {
                    this.currBoneRotation[boneId] = new APJS.Quaternionf(quaternions[i * 4], quaternions[i * 4 + 1], quaternions[i * 4 + 2], quaternions[i * 4 + 3]);
                }
                const boneTransform = this.boneTransform[boneId];
                if (boneTransform && typeof boneTransform !== 'undefined') {
                    const qua = this.currBoneRotation[boneId];
                    if (this.validQuat(qua)) {
                        const worldori = cameraRotation.clone().multiply(qua);
                        let fworldori = worldori.multiply(this.boneInitRotation[boneId]);
                        if (!followBody) {
                            fworldori = rootTransform.getWorldRotation().multiply(fworldori);
                        }
                        boneTransform.setWorldRotation(fworldori);
                    }
                }
            }
            if (followBody) {
                const localOffset = new APJS.Quaternionf(quaternions[0], quaternions[1], quaternions[2], quaternions[3]).multiplyVector(new APJS.Vector3f(this.horizontalOffset, this.verticalOffset, -0.03));
                const pelvisJoint = new APJS.Vector3f(joints[0], joints[1], joints[2]);
                if (this.useModelScale) {
                    pelvisJoint.multiply(new APJS.Vector3f(factor, factor, 1.0));
                }
                pelvisJoint.add(localOffset);
                const multiedJoint = cameraMatrix.multiplyDirection(pelvisJoint);
                pelvisJoint.set(multiedJoint.x, multiedJoint.y, multiedJoint.z);
                pelvisJoint.add(cameraPosition);
                if (this.boneTransform['ePelvis']) {
                    this.boneTransform['ePelvis'].localPosition = pelvisJoint;
                }
            }
            this.m_isReady = true;
        }
    }
    onDestroy() {
        for (let i = 0; i < this.renderers.length; i++) {
            const renderer = this.renderers[i];
            renderer.enabled = this.renderersInitEnabled[i];
        }
        if (this.cameraComponent) {
            this.cameraComponent.fov = this.orgCameraFOV;
        }
        this.currBoneRotation = {};
        this.resetBones();
        this.m_isReady = false;
    }
};
FullBodyAvatarDrive.kBoneNameMap = {
    ePelvis: 'Pelvis',
    eSpine: 'Spine1',
    eSpine1: 'Spine2',
    eSpine2: 'Spine3',
    eNeck: 'Neck',
    eHead: 'Head',
    eLeftCollar: 'L_Shoulder',
    eLeftUpperArm: 'L_UpperArm',
    eLeftForeArm: 'L_ForeArm',
    eLeftWrist: 'L_Hand',
    eRightCollar: 'R_Shoulder',
    eRightUpperArm: 'R_UpperArm',
    eRightForeArm: 'R_ForeArm',
    eRightWrist: 'R_Hand',
    eLeftHip: 'L_Thigh',
    eLeftKnee: 'L_Shin',
    eLeftAnkle: 'L_Foot',
    eRightHip: 'R_Thigh',
    eRightKnee: 'R_Shin',
    eRightAnkle: 'R_Foot',
};
FullBodyAvatarDrive.kBoneIds = [
    'ePelvis',
    'eLeftHip',
    'eRightHip',
    'eSpine',
    'eLeftKnee',
    'eRightKnee',
    'eSpine1',
    'eLeftAnkle',
    'eRightAnkle',
    'eSpine2',
    'eLeftFoot',
    'eRightFoot',
    'eNeck',
    'eLeftCollar',
    'eRightCollar',
    'eHead',
    'eLeftUpperArm',
    'eRightUpperArm',
    'eLeftForeArm',
    'eRightForeArm',
    'eLeftWrist',
    'eRightWrist',
    'eLeftHand',
    'eRightHand',
];
FullBodyAvatarDrive.kParentMap = {
    eLeftHip: 'ePelvis',
    eLeftKnee: 'eLeftHip',
    eLeftAnkle: 'eLeftKnee',
    eRightHip: 'ePelvis',
    eRightKnee: 'eRightHip',
    eRightAnkle: 'eRightKnee',
    eSpine: 'ePelvis',
    eSpine1: 'eSpine',
    eSpine2: 'eSpine1',
    eNeck: 'eSpine2',
    eHead: 'eNeck',
    eLeftCollar: 'eSpine2',
    eLeftUpperArm: 'eLeftCollar',
    eLeftForeArm: 'eLeftUpperArm',
    eLeftWrist: 'eLeftForeArm',
    eLeftHand: 'eLeftWrist',
    eRightCollar: 'eSpine2',
    eRightUpperArm: 'eRightCollar',
    eRightForeArm: 'eRightUpperArm',
    eRightWrist: 'eRightForeArm',
    eRightHand: 'eRightWrist',
};
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "sceneObject", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "scene", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "cameraTransform", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "cameraComponent", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "orgCameraFOV", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "boneTransform", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "boneInitRotation", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "currBoneRotation", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "modelRatio", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "pelvisScale", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "useModelScale", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "renderers", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "renderersInitEnabled", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "rendererEntities", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "frameIndex", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "frameNumber", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "step", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "running", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "horizontalOffset", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "verticalOffset", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "m_isReady", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "isVisible", void 0);
__decorate([
    userPublicAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "followBody", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "Head", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "L_Foot", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "L_ForeArm", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "L_Hand", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "L_Shin", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "L_Shoulder", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "L_Thigh", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "L_UpperArm", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "Neck", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "Pelvis", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "R_Foot", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "R_ForeArm", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "R_Hand", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "R_Shin", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "R_Shoulder", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "R_Thigh", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "R_UpperArm", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "Spine1", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "Spine2", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], FullBodyAvatarDrive.prototype, "Spine3", void 0);
__decorate([
    userPublicAPI()
], FullBodyAvatarDrive.prototype, "getBone", null);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "isReady", null);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "validQuat", null);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "resetBones", null);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "prepareCamera", null);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "onInit", null);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "onUpdate", null);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive.prototype, "onDestroy", null);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive, "kBoneNameMap", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive, "kBoneIds", void 0);
__decorate([
    userPrivateAPI()
], FullBodyAvatarDrive, "kParentMap", void 0);
FullBodyAvatarDrive = FullBodyAvatarDrive_1 = __decorate([
    registerClass()
], FullBodyAvatarDrive);
exports.FullBodyAvatarDrive = FullBodyAvatarDrive;
hideAPIPrototype(FullBodyAvatarDrive);
