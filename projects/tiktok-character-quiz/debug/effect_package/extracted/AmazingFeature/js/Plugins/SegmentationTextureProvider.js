"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentationTextureProvider = exports.PetType = void 0;
const APJS = require('../amazingpro.js')
const Segmentation_1 = require("./Segmentation");
const { registerClass, serialize, userPublicAPI } = APJS;
var PetType;
(function (PetType) {
    PetType[PetType["Cat"] = 1] = "Cat";
    PetType[PetType["Dog"] = 2] = "Dog";
})(PetType = exports.PetType || (exports.PetType = {}));
let SegmentationTextureProvider = class SegmentationTextureProvider extends APJS.ScreenTextureProvider {
    constructor(rtti) {
        APJS.EnterInternalScope();
        super(rtti ? rtti : new effect.Amaz.ScreenRenderTexture());
        this._tex = APJS.TextureUtils.createTexture2D();
        this._isSingleMask = true;
        this._segScreenMesh = APJS.MeshUtils.createQuadMesh(-1, 1, -1, 1);
        this._skinDeley = false;
        this._segProvider = undefined;
        this._cmdBufferHelper = undefined;
        this._screenMesh = undefined;
        this._captureOrder = 0;
        this._graphName = '';
        this._segmentationType = -1;
        this._invertMask = false;
        this._smoothness = 1;
        this._headseg_whichface = [0];
        this._handseg_whichface = [0, 1];
        this._petseg_whichface = [1];
        this._earseg_whichface = [0, 1];
        this._lipseg_whichface = [0];
        this._teethseg_whichface = [0];
        this._comp_faceSeg_whichFace = [0, 1];
        this._eyeseg_whichface = [0];
        this._screenMat = undefined;
        this._screenMat2Mask = undefined;
        this._attachedMaterialPaths = [];
        this._centerAlign = false;
        this.isStarted = false;
        APJS.QuitInternalScope(this);
    }
    get uuid() {
        var _a;
        return (_a = this.m__rttiTex) === null || _a === void 0 ? void 0 : _a.guid.toString();
    }
    get captureOrder() {
        return this._captureOrder;
    }
    set captureOrder(value) {
        this._captureOrder = value;
    }
    get graphName() {
        return this._graphName;
    }
    set graphName(newValue) {
        this._graphName = newValue;
    }
    get segmentationType() {
        return this._segmentationType;
    }
    set segmentationType(value) {
        this._segmentationType = value;
    }
    get invertMask() {
        return this._invertMask;
    }
    set invertMask(value) {
        this._invertMask = value;
    }
    get smoothness() {
        return this._smoothness;
    }
    set smoothness(value) {
        this._smoothness = value;
    }
    get trackIndex() {
        switch (this.segmentationType) {
            case Segmentation_1.SegmentationType.Head:
                return this.headseg_whichface;
            case Segmentation_1.SegmentationType.Hand:
                return this.handseg_whichface;
            case Segmentation_1.SegmentationType.Pet:
                return this.petseg_whichface;
            case Segmentation_1.SegmentationType.Ear:
                return this.earseg_whichface;
            case Segmentation_1.SegmentationType.Lip:
                return this.lipseg_whichface;
            case Segmentation_1.SegmentationType.Teeth:
                return this.teethseg_whichface;
            case Segmentation_1.SegmentationType.Face:
                return this.comp_faceSeg_whichFace;
            case Segmentation_1.SegmentationType.Eye:
                return this.eyeseg_whichface;
        }
        return [];
    }
    set trackIndex(value) {
        switch (this.segmentationType) {
            case Segmentation_1.SegmentationType.Head:
                this.headseg_whichface = value;
                return;
            case Segmentation_1.SegmentationType.Hand:
                this.handseg_whichface = value;
                return;
            case Segmentation_1.SegmentationType.Pet:
                this.petseg_whichface = value;
                return;
            case Segmentation_1.SegmentationType.Ear:
                this.earseg_whichface = value;
                return;
            case Segmentation_1.SegmentationType.Lip:
                this.lipseg_whichface = value;
                return;
            case Segmentation_1.SegmentationType.Teeth:
                this.teethseg_whichface = value;
                return;
            case Segmentation_1.SegmentationType.Face:
                this.comp_faceSeg_whichFace = value;
                return;
            case Segmentation_1.SegmentationType.Eye:
                this.eyeseg_whichface = value;
                return;
        }
    }
    get petType() {
        return this.petseg_whichface;
    }
    set petType(value) {
        this.petseg_whichface = value;
    }
    get headseg_whichface() {
        return this._headseg_whichface;
    }
    set headseg_whichface(value) {
        var _a, _b, _c, _d, _e;
        if (value === null || value === undefined || value.length < 1) {
            return;
        }
        this._headseg_whichface = value;
        this._segProvider = Segmentation_1.Segmentation.getInstance().segProviderMap.get(this._segmentationType);
        if (value.length > 1) {
            const materials = (_a = this._segProvider) === null || _a === void 0 ? void 0 : _a.attachedMaterials.get(this.uuid);
            materials === null || materials === void 0 ? void 0 : materials.forEach((material) => {
                material.setVector('u_Translation', new APJS.Vector4f(0.0, 0.0, 0.0, 0.0));
                material.setVector('u_Scale', new APJS.Vector4f(1.0, 1.0, 1.0, 1.0));
            });
            (_c = (_b = this._segProvider) === null || _b === void 0 ? void 0 : _b.attachedMaterials) === null || _c === void 0 ? void 0 : _c.delete(this.uuid);
            (_e = (_d = this._segProvider) === null || _d === void 0 ? void 0 : _d.whichFaceMap) === null || _e === void 0 ? void 0 : _e.delete(this.uuid);
            this._centerAlign = false;
        }
    }
    get handseg_whichface() {
        return this._handseg_whichface;
    }
    set handseg_whichface(value) {
        if (value === null || value === undefined || value.length < 1) {
            return;
        }
        this._handseg_whichface = value;
    }
    get petseg_whichface() {
        return this._petseg_whichface;
    }
    set petseg_whichface(value) {
        if (value === null || value === undefined || value.length < 1) {
            return;
        }
        this._petseg_whichface = value;
    }
    get earseg_whichface() {
        return this._earseg_whichface;
    }
    set earseg_whichface(value) {
        if (value === null || value === undefined || value.length < 1) {
            return;
        }
        this._earseg_whichface = value;
    }
    get lipseg_whichface() {
        return this._lipseg_whichface;
    }
    set lipseg_whichface(value) {
        if (value === null || value === undefined || value.length < 1) {
            return;
        }
        this._lipseg_whichface = value;
    }
    get teethseg_whichface() {
        return this._teethseg_whichface;
    }
    set teethseg_whichface(value) {
        if (value === null || value === undefined || value.length < 1) {
            return;
        }
        this._teethseg_whichface = value;
    }
    get comp_faceSeg_whichFace() {
        return this._comp_faceSeg_whichFace;
    }
    set comp_faceSeg_whichFace(value) {
        if (value === null || value === undefined || value.length < 1) {
            return;
        }
        this._comp_faceSeg_whichFace = value;
    }
    get eyeseg_whichface() {
        return this._eyeseg_whichface;
    }
    set eyeseg_whichface(value) {
        if (value === null || value === undefined || value.length < 1) {
            return;
        }
        this._eyeseg_whichface = value;
    }
    set screenMat(value) {
        this._screenMat = value;
    }
    get screenMat() {
        return this._screenMat;
    }
    set screenMat2Mask(value) {
        this._screenMat2Mask = value;
    }
    get screenMat2Mask() {
        return this._screenMat2Mask;
    }
    get attachedMaterialPaths() {
        if (this._attachedMaterialPaths === undefined || this._attachedMaterialPaths === null) {
            this._attachedMaterialPaths = [];
        }
        return this._attachedMaterialPaths;
    }
    set attachedMaterialPaths(value) {
        this._attachedMaterialPaths = value;
    }
    get centerAlign() {
        return this._centerAlign;
    }
    set centerAlign(value) {
        this._centerAlign = value;
    }
    get manager() {
        var _a;
        if (!this._dynamicAssetMgr) {
            this._dynamicAssetMgr = (_a = APJS.getDynamicAssetRuntimeManager()) !== null && _a !== void 0 ? _a : undefined;
        }
        return this._dynamicAssetMgr;
    }
    get cmdBufferHelper() {
        var _a;
        if (!this._cmdBufferHelper) {
            this._cmdBufferHelper = (_a = this.manager) === null || _a === void 0 ? void 0 : _a.getCmdBufferHelper();
        }
        return this._cmdBufferHelper;
    }
    get screenMesh() {
        var _a, _b;
        if (!this._screenMesh) {
            this._screenMesh = (_a = this.manager) === null || _a === void 0 ? void 0 : _a.getScreenMesh();
            if (!this._screenMesh) {
                this._screenMesh = APJS.MeshUtils.createQuadMesh(-1, 1, -1, 1);
                (_b = this.manager) === null || _b === void 0 ? void 0 : _b.setScreenMesh(this._screenMesh);
            }
        }
        return this._screenMesh;
    }
    updateScreenMaterial() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40;
        (_a = this._screenMatInstance) === null || _a === void 0 ? void 0 : _a.setFloat('_SegGetAlpha', 0.0);
        (_b = this._screenMatInstance) === null || _b === void 0 ? void 0 : _b.setFloat('_SegFlipY', 0.0);
        if (this.segmentationType === Segmentation_1.SegmentationType.Hand) {
            if (this.handseg_whichface === null || this.handseg_whichface === undefined) {
                console.log('return');
                return;
            }
            (_c = this._screenMatInstance) === null || _c === void 0 ? void 0 : _c.setFloat('_SegMask_enable', 0.0);
            (_d = this._screenMatInstance) === null || _d === void 0 ? void 0 : _d.setFloat('_SegMask2_enable', 0.0);
            const stringified_handseg_whichface = this.handseg_whichface.toString();
            if (stringified_handseg_whichface.includes('0')) {
                (_e = this._screenMatInstance) === null || _e === void 0 ? void 0 : _e.setFloat('_SegMask_enable', 1.0);
            }
            if (stringified_handseg_whichface.includes('1')) {
                (_f = this._screenMatInstance) === null || _f === void 0 ? void 0 : _f.setFloat('_SegMask2_enable', 1.0);
            }
            (_g = this._screenMatInstance) === null || _g === void 0 ? void 0 : _g.setFloat('_SegMask3_enable', 0.0);
            (_h = this._screenMatInstance) === null || _h === void 0 ? void 0 : _h.setFloat('_SegMask4_enable', 0.0);
        }
        else if (this.segmentationType === Segmentation_1.SegmentationType.Head) {
            if (this.headseg_whichface === null || this.headseg_whichface === undefined) {
                console.log('return');
                return;
            }
            (_j = this._screenMatInstance) === null || _j === void 0 ? void 0 : _j.setFloat('_SegMask_enable', 0.0);
            (_k = this._screenMatInstance) === null || _k === void 0 ? void 0 : _k.setFloat('_SegMask2_enable', 0.0);
            const stringified_headseg_whichface = this.headseg_whichface.toString();
            if (stringified_headseg_whichface.includes('0')) {
                (_l = this._screenMatInstance) === null || _l === void 0 ? void 0 : _l.setFloat('_SegMask_enable', 1.0);
            }
            if (stringified_headseg_whichface.includes('1')) {
                (_m = this._screenMatInstance) === null || _m === void 0 ? void 0 : _m.setFloat('_SegMask2_enable', 1.0);
            }
            (_o = this._screenMatInstance) === null || _o === void 0 ? void 0 : _o.setFloat('_SegMask3_enable', 0.0);
            (_p = this._screenMatInstance) === null || _p === void 0 ? void 0 : _p.setFloat('_SegMask4_enable', 0.0);
        }
        else if (this.segmentationType === Segmentation_1.SegmentationType.Pet) {
            if (this.petseg_whichface === null || this.petseg_whichface === undefined) {
                console.log('return');
                return;
            }
            if (this.petseg_whichface === null || this.petseg_whichface === undefined) {
                this.petseg_whichface = this._petseg_whichface;
            }
            const stringified_petseg_whichface = this.petseg_whichface.toString();
            const graphNode = APJS.AlgorithmManager.getGraphNode(this.graphName, 'pet_matting_0');
            if (stringified_petseg_whichface.includes('1') && stringified_petseg_whichface.includes('2')) {
                graphNode.setInt('output_type', 1);
            }
            else if (stringified_petseg_whichface.includes('1')) {
                graphNode.setInt('output_type', 3);
            }
            else if (stringified_petseg_whichface.includes('2')) {
                graphNode.setInt('output_type', 4);
            }
            (_q = this._screenMatInstance) === null || _q === void 0 ? void 0 : _q.setFloat('_SegMask_enable', 1.0);
            (_r = this._screenMatInstance) === null || _r === void 0 ? void 0 : _r.setFloat('_SegMask2_enable', 0.0);
            (_s = this._screenMatInstance) === null || _s === void 0 ? void 0 : _s.setFloat('_SegFlipY', 0.0);
        }
        else if (this.segmentationType === Segmentation_1.SegmentationType.Ear) {
            if (this.earseg_whichface === null || this.earseg_whichface === undefined) {
                console.log('earseg_whichface null return');
                return;
            }
            if (this.earseg_whichface === null || this.earseg_whichface === undefined) {
                this.earseg_whichface = this._earseg_whichface;
            }
            (_t = this._screenMatInstance) === null || _t === void 0 ? void 0 : _t.setFloat('_SegMask_enable', 0.0);
            (_u = this._screenMatInstance) === null || _u === void 0 ? void 0 : _u.setFloat('_SegMask2_enable', 0.0);
            (_v = this._screenMatInstance) === null || _v === void 0 ? void 0 : _v.setFloat('_SegMask3_enable', 0.0);
            (_w = this._screenMatInstance) === null || _w === void 0 ? void 0 : _w.setFloat('_SegMask4_enable', 0.0);
            (_x = this._screenMatInstance) === null || _x === void 0 ? void 0 : _x.setFloat('_SegFlipY', 1.0);
            const stringified_earseg_whichface = this.earseg_whichface.toString();
            if (stringified_earseg_whichface.includes('0')) {
                (_y = this._screenMatInstance) === null || _y === void 0 ? void 0 : _y.setFloat('_SegMask_enable', 1.0);
                (_z = this._screenMatInstance) === null || _z === void 0 ? void 0 : _z.setFloat('_SegMask2_enable', 1.0);
            }
            if (stringified_earseg_whichface.includes('1')) {
                (_0 = this._screenMatInstance) === null || _0 === void 0 ? void 0 : _0.setFloat('_SegMask3_enable', 1.0);
                (_1 = this._screenMatInstance) === null || _1 === void 0 ? void 0 : _1.setFloat('_SegMask4_enable', 1.0);
            }
        }
        else if (this.segmentationType === Segmentation_1.SegmentationType.Lip) {
            if (this.lipseg_whichface === null || this.lipseg_whichface === undefined) {
                console.log('return');
                return;
            }
            if (this.lipseg_whichface === null || this.lipseg_whichface === undefined) {
                this.lipseg_whichface = this._lipseg_whichface;
            }
            (_2 = this._screenMatInstance) === null || _2 === void 0 ? void 0 : _2.setFloat('_SegMask_enable', 0.0);
            (_3 = this._screenMatInstance) === null || _3 === void 0 ? void 0 : _3.setFloat('_SegMask2_enable', 0.0);
            const stringified_lipseg_whichface = this.lipseg_whichface.toString();
            if (stringified_lipseg_whichface.includes('0')) {
                (_4 = this._screenMatInstance) === null || _4 === void 0 ? void 0 : _4.setFloat('_SegMask_enable', 1.0);
            }
            if (stringified_lipseg_whichface.includes('1')) {
                (_5 = this._screenMatInstance) === null || _5 === void 0 ? void 0 : _5.setFloat('_SegMask2_enable', 1.0);
            }
            (_6 = this._screenMatInstance) === null || _6 === void 0 ? void 0 : _6.setFloat('_SegMask3_enable', 0.0);
            (_7 = this._screenMatInstance) === null || _7 === void 0 ? void 0 : _7.setFloat('_SegMask4_enable', 0.0);
        }
        else if (this.segmentationType === Segmentation_1.SegmentationType.Teeth) {
            if (this.teethseg_whichface === null || this.teethseg_whichface === undefined) {
                console.log('return');
                return;
            }
            if (this.teethseg_whichface === null || this.teethseg_whichface === undefined) {
                this.teethseg_whichface = this._teethseg_whichface;
            }
            (_8 = this._screenMatInstance) === null || _8 === void 0 ? void 0 : _8.setFloat('_SegMask_enable', 0.0);
            (_9 = this._screenMatInstance) === null || _9 === void 0 ? void 0 : _9.setFloat('_SegMask2_enable', 0.0);
            const stringified_teethseg_whichface = this.teethseg_whichface.toString();
            if (stringified_teethseg_whichface.includes('0')) {
                (_10 = this._screenMatInstance) === null || _10 === void 0 ? void 0 : _10.setFloat('_SegMask_enable', 1.0);
            }
            if (stringified_teethseg_whichface.includes('1')) {
                (_11 = this._screenMatInstance) === null || _11 === void 0 ? void 0 : _11.setFloat('_SegMask2_enable', 1.0);
            }
            (_12 = this._screenMatInstance) === null || _12 === void 0 ? void 0 : _12.setFloat('_SegMask3_enable', 0.0);
            (_13 = this._screenMatInstance) === null || _13 === void 0 ? void 0 : _13.setFloat('_SegMask4_enable', 0.0);
        }
        else if (this.segmentationType === Segmentation_1.SegmentationType.Face) {
            if (this.comp_faceSeg_whichFace === null || this.comp_faceSeg_whichFace === undefined) {
                console.log('return');
                return;
            }
            if (this.comp_faceSeg_whichFace === null || this.comp_faceSeg_whichFace === undefined) {
                this.comp_faceSeg_whichFace = this._comp_faceSeg_whichFace;
            }
            (_14 = this._screenMatInstance) === null || _14 === void 0 ? void 0 : _14.setFloat('_SegMask_enable', 0.0);
            (_15 = this._screenMatInstance) === null || _15 === void 0 ? void 0 : _15.setFloat('_SegMask2_enable', 0.0);
            const stringified_comp_faceSeg_whichFace = this.comp_faceSeg_whichFace.toString();
            if (stringified_comp_faceSeg_whichFace.includes('0')) {
                (_16 = this._screenMatInstance) === null || _16 === void 0 ? void 0 : _16.setFloat('_SegMask_enable', 1.0);
            }
            if (stringified_comp_faceSeg_whichFace.includes('1')) {
                (_17 = this._screenMatInstance) === null || _17 === void 0 ? void 0 : _17.setFloat('_SegMask2_enable', 1.0);
            }
            (_18 = this._screenMatInstance) === null || _18 === void 0 ? void 0 : _18.setFloat('_SegMask3_enable', 0.0);
            (_19 = this._screenMatInstance) === null || _19 === void 0 ? void 0 : _19.setFloat('_SegMask4_enable', 0.0);
        }
        else if (this.segmentationType === Segmentation_1.SegmentationType.Eye) {
            if (this.eyeseg_whichface === null || this.eyeseg_whichface === undefined) {
                console.log('return');
                return;
            }
            if (this.eyeseg_whichface === null || this.eyeseg_whichface === undefined) {
                this.eyeseg_whichface = this._eyeseg_whichface;
            }
            (_20 = this._screenMatInstance) === null || _20 === void 0 ? void 0 : _20.setFloat('_SegMask_enable', 0.0);
            (_21 = this._screenMatInstance) === null || _21 === void 0 ? void 0 : _21.setFloat('_SegMask2_enable', 0.0);
            const stringified_eyeseg_whichface = this.eyeseg_whichface.toString();
            if (stringified_eyeseg_whichface.includes('0')) {
                (_22 = this._screenMatInstance) === null || _22 === void 0 ? void 0 : _22.setFloat('_SegMask_enable', 1.0);
            }
            if (stringified_eyeseg_whichface.includes('1')) {
                (_23 = this._screenMatInstance) === null || _23 === void 0 ? void 0 : _23.setFloat('_SegMask2_enable', 1.0);
            }
            (_24 = this._screenMatInstance) === null || _24 === void 0 ? void 0 : _24.setFloat('_SegMask3_enable', 0.0);
            (_25 = this._screenMatInstance) === null || _25 === void 0 ? void 0 : _25.setFloat('_SegMask4_enable', 0.0);
            (_26 = this._screenMatInstance) === null || _26 === void 0 ? void 0 : _26.setFloat('_SegFlipY', 1.0);
        }
        else if (this.segmentationType === Segmentation_1.SegmentationType.Skin) {
            if (this._skinDeley === false) {
                this._skinDeley = true;
            }
            else {
                (_27 = this._screenMatInstance) === null || _27 === void 0 ? void 0 : _27.setFloat('_SegGetAlpha', 1.0);
            }
        }
        if (this._isSingleMask === true) {
            (_28 = this._screenMatInstance) === null || _28 === void 0 ? void 0 : _28.setTexture('_SegMask', Segmentation_1.Segmentation.getMask(this.segmentationType));
            (_29 = this._screenMatInstance) === null || _29 === void 0 ? void 0 : _29.setFloat('_SegSmoothness', 0.9 * (1.0 - this.smoothness));
            (_30 = this._screenMatInstance) === null || _30 === void 0 ? void 0 : _30.setFloat('_SegInvertMask', this.invertMask === true ? 1.0 : 0.0);
        }
        else if (this._isSingleMask === false) {
            if (this.segmentationType === Segmentation_1.SegmentationType.Ear) {
                (_31 = this._screenMatInstance) === null || _31 === void 0 ? void 0 : _31.setTexture('_SegMask', Segmentation_1.Segmentation.getMask(this.segmentationType, 0, 0));
                (_32 = this._screenMatInstance) === null || _32 === void 0 ? void 0 : _32.setTexture('_SegMask2', Segmentation_1.Segmentation.getMask(this.segmentationType, 0, 1));
                (_33 = this._screenMatInstance) === null || _33 === void 0 ? void 0 : _33.setTexture('_SegMask3', Segmentation_1.Segmentation.getMask(this.segmentationType, 1, 0));
                (_34 = this._screenMatInstance) === null || _34 === void 0 ? void 0 : _34.setTexture('_SegMask4', Segmentation_1.Segmentation.getMask(this.segmentationType, 1, 1));
                (_35 = this._screenMatInstance) === null || _35 === void 0 ? void 0 : _35.setFloat('_SegSmoothness', 0.9 * (1.0 - this.smoothness));
                (_36 = this._screenMatInstance) === null || _36 === void 0 ? void 0 : _36.setFloat('_SegInvertMask', this.invertMask === true ? 1.0 : 0.0);
            }
            else {
                (_37 = this._screenMatInstance) === null || _37 === void 0 ? void 0 : _37.setTexture('_SegMask', Segmentation_1.Segmentation.getMask(this.segmentationType));
                (_38 = this._screenMatInstance) === null || _38 === void 0 ? void 0 : _38.setFloat('_SegSmoothness', 0.9 * (1.0 - this.smoothness));
                (_39 = this._screenMatInstance) === null || _39 === void 0 ? void 0 : _39.setFloat('_SegInvertMask', this.invertMask === true ? 1.0 : 0.0);
                (_40 = this._screenMatInstance) === null || _40 === void 0 ? void 0 : _40.setTexture('_SegMask2', Segmentation_1.Segmentation.getMask(this.segmentationType, 1));
            }
        }
    }
    onStart() {
        var _a, _b, _c, _d, _e;
        if (this.isStarted)
            return;
        this.isStarted = true;
        Segmentation_1.Segmentation.getInstance().scene = this.scene;
        Segmentation_1.Segmentation.getInstance().cmdBufferHelper = this.cmdBufferHelper;
        Segmentation_1.Segmentation.getInstance().screenMesh = this.screenMesh;
        Segmentation_1.Segmentation.getInstance().addProvider(this._segmentationType);
        (_a = this.manager) === null || _a === void 0 ? void 0 : _a.registerSingletonUpdateHandler(Segmentation_1.Segmentation.getInstance(), Segmentation_1.Segmentation.getInstance().onUpdate);
        if (this._segmentationType === Segmentation_1.SegmentationType.Hand ||
            this._segmentationType === Segmentation_1.SegmentationType.Head ||
            this._segmentationType === Segmentation_1.SegmentationType.Ear ||
            this._segmentationType === Segmentation_1.SegmentationType.Lip ||
            this._segmentationType === Segmentation_1.SegmentationType.Teeth ||
            this._segmentationType === Segmentation_1.SegmentationType.Eye ||
            this._segmentationType === Segmentation_1.SegmentationType.Face) {
            this._isSingleMask = false;
        }
        if (this._isSingleMask === true && this._screenMat !== undefined) {
            this._screenMatInstance = (_b = this._screenMat) === null || _b === void 0 ? void 0 : _b.instantiate();
        }
        else if (this._isSingleMask === false && this._screenMat2Mask !== undefined) {
            this._screenMatInstance = (_c = this._screenMat2Mask) === null || _c === void 0 ? void 0 : _c.instantiate();
        }
        this.setDepth(1);
        this.filterMag = APJS.FilterMode.Linear;
        this.filterMin = APJS.FilterMode.Linear;
        this.filterMipmap = APJS.FilterMipmapMode.None;
        this.setAttachment(APJS.RenderTextureAttachment.NONE);
        this._tex.filterMin = APJS.FilterMode.Linear;
        this._tex.filterMag = APJS.FilterMode.Linear;
        this._skinDeley = false;
        if (this._segmentationType === Segmentation_1.SegmentationType.Eye) {
            Segmentation_1.Segmentation.getInstance().graphNameEye = this.graphName;
        }
        else if (this._segmentationType === Segmentation_1.SegmentationType.Ear) {
            Segmentation_1.Segmentation.getInstance().graphNameEar = this.graphName;
        }
        if (this._segProvider === undefined || this._segProvider === null) {
            this._segProvider = Segmentation_1.Segmentation.getInstance().segProviderMap.get(this._segmentationType);
        }
        if (this._centerAlign && this.headseg_whichface.length < 2) {
            const materialSet = new Set();
            this.attachedMaterialPaths.forEach(materialPath => {
                var _a;
                const material = (_a = this.scene) === null || _a === void 0 ? void 0 : _a.assetManager.load(materialPath);
                if (material) {
                    materialSet.add(material);
                }
            });
            (_d = this._segProvider) === null || _d === void 0 ? void 0 : _d.attachedMaterials.set(this.uuid, materialSet);
            if (this._segmentationType === Segmentation_1.SegmentationType.Head) {
                (_e = this._segProvider) === null || _e === void 0 ? void 0 : _e.whichFaceMap.set(this.uuid, this.headseg_whichface[0]);
            }
        }
    }
    onUpdate(dt) {
        var _a, _b;
        if (this._screenMatInstance !== undefined) {
            this.updateScreenMaterial();
            (_a = this.cmdBufferHelper) === null || _a === void 0 ? void 0 : _a.setRenderTexture(APJS.transferToAPJSObj(this.m__rttiTex));
            (_b = this.cmdBufferHelper) === null || _b === void 0 ? void 0 : _b.drawMesh(this._segScreenMesh, new APJS.Matrix4x4f(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this._screenMatInstance, 0, 0, new APJS.MaterialPropertyBlock(), false);
        }
    }
    onDestroy() {
        this._tex = null;
    }
};
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_captureOrder", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_graphName", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_segmentationType", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_invertMask", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_smoothness", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_headseg_whichface", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_handseg_whichface", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_petseg_whichface", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_earseg_whichface", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_lipseg_whichface", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_teethseg_whichface", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_comp_faceSeg_whichFace", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_eyeseg_whichface", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_screenMat", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_screenMat2Mask", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_attachedMaterialPaths", void 0);
__decorate([
    serialize
], SegmentationTextureProvider.prototype, "_centerAlign", void 0);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "uuid", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "captureOrder", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "graphName", null);
__decorate([
    userPublicAPI()
], SegmentationTextureProvider.prototype, "segmentationType", null);
__decorate([
    userPublicAPI()
], SegmentationTextureProvider.prototype, "invertMask", null);
__decorate([
    userPublicAPI()
], SegmentationTextureProvider.prototype, "smoothness", null);
__decorate([
    userPublicAPI()
], SegmentationTextureProvider.prototype, "trackIndex", null);
__decorate([
    userPublicAPI()
], SegmentationTextureProvider.prototype, "petType", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "headseg_whichface", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "handseg_whichface", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "petseg_whichface", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "earseg_whichface", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "lipseg_whichface", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "teethseg_whichface", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "comp_faceSeg_whichFace", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "eyeseg_whichface", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "screenMat", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "screenMat2Mask", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "attachedMaterialPaths", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "centerAlign", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "manager", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "cmdBufferHelper", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "screenMesh", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "updateScreenMaterial", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "onStart", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "onUpdate", null);
__decorate([
    APJS.userPrivateAPI()
], SegmentationTextureProvider.prototype, "onDestroy", null);
SegmentationTextureProvider = __decorate([
    registerClass()
], SegmentationTextureProvider);
exports.SegmentationTextureProvider = SegmentationTextureProvider;
APJS.hideAPIPrototype(SegmentationTextureProvider);
