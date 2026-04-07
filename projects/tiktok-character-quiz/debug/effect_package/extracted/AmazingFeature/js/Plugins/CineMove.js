"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CineMove = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, CameraEvent, AppEventType } = APJS;
let CineMove = class CineMove extends APJS.DynamicComponent {
    constructor(rtti) {
        super(rtti);
        this.graphName = '';
        this.velocity = 0.5;
        this.scaling = 0.5;
        this.strength = 0.5;
        this.material = null;
        this.mesh = null;
        this._totalTime = 1.0;
        this._currentTime = 0.0;
        this._materialInstance = null;
        this._scene = null;
        this._camera = null;
        this._cb = new APJS.CommandBuffer();
        this._cameraEmitter = null;
        this._enableRender = false;
        this.name = 'CineMove';
    }
    onEnable() {
        this._enableRender = true;
    }
    onDisable() {
        this._enableRender = false;
    }
    onStart() {
        this._scene = this.getSceneObject().scene;
        this._materialInstance = this.createMaterialInstance('filterMat', this.material);
        const camera = this.getSceneObject().getComponent('Camera');
        if (camera !== null && camera.renderTexture !== null) {
            this._camera = camera;
            this._cameraEmitter = APJS.EventManager.getObjectEmitter(camera);
            this._cameraEmitter.on(CameraEvent.RENDER_IMAGE_EFFECTS, this.renderCineMoveEffects, this);
            this.setUpCommands(camera);
        }
        const globalEmitter = APJS.EventManager.getGlobalEmitter();
        globalEmitter.on(APJS.EventType.RecordStart, this.onReset, this);
        this._currentTime = 0;
    }
    onUpdate(deltaTime) {
        var _a;
        const graphNode = APJS.AlgorithmManager.getGraphNode(this.graphName, 'cine_move_0');
        const cineMoveInfo = graphNode.getInfo('cine_move', 0);
        if (!cineMoveInfo) {
            this._enableRender = false;
            return;
        }
        else {
            this._enableRender = true;
        }
        const width = cineMoveInfo.width;
        const height = cineMoveInfo.height;
        const affine_before = cineMoveInfo.affine;
        const affine = affine_before;
        affine.transpose();
        let mvp = new APJS.Matrix4x4f(affine.get(0, 0), affine.get(0, 1), 0, 0, affine.get(1, 0), affine.get(1, 1), 0, 0, 0, 0, 1, 0, affine.get(2, 0), affine.get(2, 1), 0, 1);
        mvp.multiply(new APJS.Matrix4x4f(width, 0, 0, 0, 0, height, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
        let progress = 1.0;
        this._currentTime = this._currentTime + deltaTime;
        if (this._currentTime > this._totalTime) {
            this._currentTime = this._totalTime;
            progress = 1.0;
        }
        else {
            progress = this._currentTime / this._totalTime;
        }
        mvp = this.lerp(width, height, mvp, progress);
        mvp = new APJS.Matrix4x4f(1.0 / width, 0, 0, 0, 0, 1.0 / height, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1).multiply(mvp);
        mvp = mvp.inverse();
        (_a = this._materialInstance) === null || _a === void 0 ? void 0 : _a.setMatrix('affine', mvp);
        const cm_params = 'velocity=' +
            this.checkValue(this.velocity) +
            ' & scaling=' +
            this.checkValue(1.0 - this.scaling) +
            ' & strength=' +
            this.checkValue(this.strength);
        graphNode.setString('cine_move_execute_args', cm_params);
    }
    onDestroy() {
        this._materialInstance = null;
        if (this._camera !== null) {
            this._cameraEmitter.off(CameraEvent.RENDER_IMAGE_EFFECTS, this.renderCineMoveEffects, this);
        }
        const globalEmitter = APJS.EventManager.getGlobalEmitter();
        globalEmitter.off(APJS.EventType.RecordStart, this.onReset, this);
    }
    setUpCommands(camera) {
        this._cb.clearAll();
        this._cb.setRenderTexture(camera.renderTexture);
        this._cb.drawMesh(this.mesh, new APJS.Matrix4x4f(), this._materialInstance, 0, 0, new APJS.MaterialPropertyBlock(), false);
    }
    renderCineMoveEffects(event) {
        if (this._enableRender &&
            this._camera.enabled &&
            this.isInheritedEnabled() &&
            event.type === CameraEvent.RENDER_IMAGE_EFFECTS) {
            this._scene.commitCommandBuffer(this._cb);
        }
    }
    recordReset() {
        this._currentTime = 0;
    }
    onReset(event) {
        this.recordReset();
    }
    createMaterialInstance(name, material) {
        let mat = new APJS.Material();
        if (material.xshader !== undefined)
            mat.xshader = material.xshader;
        else
            mat = material.instantiate();
        mat.name = name;
        return mat;
    }
    lerp(width, height, mvp, progress) {
        if (progress === 1.0) {
            return mvp;
        }
        const translate = new APJS.Vector3f();
        const scale = new APJS.Vector3f();
        const rotate = new APJS.Quaternionf();
        mvp.getDecompose(translate, rotate, scale);
        const toTranslate = translate.multiplyScalar(progress);
        const toScale = APJS.Vector3f.lerp(new APJS.Vector3f(width, height, 1), scale, progress);
        const toRotate = APJS.Quaternionf.slerp(APJS.Quaternionf.identity(), rotate, progress);
        const toMvp = new APJS.Matrix4x4f();
        toMvp.compose(new APJS.Vector3f(), toRotate, toScale);
        toMvp.set(0, 2, toTranslate.x);
        toMvp.set(1, 2, toTranslate.y);
        return toMvp;
    }
    checkValue(value) {
        return Math.max(0, Math.min(1, value));
    }
};
__decorate([
    serialize
], CineMove.prototype, "graphName", void 0);
__decorate([
    serialize
], CineMove.prototype, "velocity", void 0);
__decorate([
    serialize
], CineMove.prototype, "scaling", void 0);
__decorate([
    serialize
], CineMove.prototype, "strength", void 0);
__decorate([
    serialize
], CineMove.prototype, "material", void 0);
__decorate([
    serialize
], CineMove.prototype, "mesh", void 0);
CineMove = __decorate([
    registerClass()
], CineMove);
exports.CineMove = CineMove;
