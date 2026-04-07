"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eyelashes3D = exports.Eyelashes3DProperty = exports.GradientMode = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, userPublicAPI, userPrivateAPI, hideAPIPrototype, convertNativeVectorToJSArray, convertNativeFloatVectorToJSFloat32Array, convertNativeVec3VectorToJSFloat32Array } = APJS;
const algoManger = effect.Amaz.AmazingManager.getSingleton('Algorithm');
var GradientMode;
(function (GradientMode) {
    GradientMode[GradientMode["Horizontal"] = 0] = "Horizontal";
    GradientMode[GradientMode["Random"] = 1] = "Random";
})(GradientMode = exports.GradientMode || (exports.GradientMode = {}));
;
var LashSide;
(function (LashSide) {
    LashSide["Left"] = "left";
    LashSide["Right"] = "right";
})(LashSide || (LashSide = {}));
var LashPos;
(function (LashPos) {
    LashPos["Upper"] = "Upper";
    LashPos["Lower"] = "Lower";
})(LashPos || (LashPos = {}));
const LashAnchorKeys = [
    "Corner",
    "Center1",
    "Center2",
    "Center3",
    "Center4",
    "Center5",
    "Center6",
    "Tail",
];
const MorpherNamePrefixes = {
    [`${LashSide.Left}${LashPos.Upper}`]: "Upper_Lashes_L_",
    [`${LashSide.Left}${LashPos.Lower}`]: "Lower_Lashes_L_",
    [`${LashSide.Right}${LashPos.Upper}`]: "Upper_Lashes_R_",
    [`${LashSide.Right}${LashPos.Lower}`]: "Lower_Lashes_R_",
};
const MorpherNameSuffixes = {
    blinkChannels: ["Blink_Rotation"],
    curlChannels: ["Curl_Neg", "Curl_Pos", "Curl_Pos_Plus"],
    lengthChannels: ["Length_Neg", "Length_Pos"],
};
const EyeGapIndices = [813 * 3 + 1, 816 * 3 + 1, 80 * 3 + 1, 83 * 3 + 1];
const MinBufferSize = 1501 * 3;
const MaxEyeGap = 0.8;
const MinEyeGap = 0.1;
const MaxBlinkRotation = 30.0;
const DegreeToRadius = Math.PI / 180;
const NumberClamp = (num, min, max) => num < min ? min : num > max ? max : num;
const GetVec3FromBuffer = (buffer, index) => {
    const bufferIndex = index * 3;
    return [buffer[bufferIndex], buffer[bufferIndex + 1], buffer[bufferIndex + 2]];
};
const StdModelIndexMap = {
    [`${LashSide.Left}${LashPos.Upper}`]: [768, 764, [761, 812], 813, [754, 751], 755, 778, 759],
    [`${LashSide.Left}${LashPos.Lower}`]: [779, 773, [776, 815], 816, 770, 745, 744],
    [`${LashSide.Right}${LashPos.Upper}`]: [35, 31, [28, 79], 80, [21, 18], 22, 45, 26],
    [`${LashSide.Right}${LashPos.Lower}`]: [46, 40, [43, 82], 83, 37, 12, 11],
};
const AltModelIndexMap = {
    [`${LashSide.Left}${LashPos.Upper}`]: [768, [764, 761], 813, 755, 759],
    [`${LashSide.Left}${LashPos.Lower}`]: [779, 776, 816, [770, 806], 744],
    [`${LashSide.Right}${LashPos.Upper}`]: [35, [31, 28], 80, 22, 26],
    [`${LashSide.Right}${LashPos.Lower}`]: [46, 43, 83, [37, 73], 11],
};
const propertyTypeMap = {
    UpperOffset: APJS.Vector3f,
    LowerOffset: APJS.Vector3f,
    BlinkRotation: 'number',
    Length: 'number',
    Curl: 'number',
    Density: 'number',
    Texture: APJS.Texture,
    Color: APJS.Color,
    Opacity: 'number',
    GradientColor: APJS.Color,
    GradientMode: 'number',
    GradientFlip: 'boolean',
};
function isValueOfType(value, type) {
    if (typeof type === 'string') {
        return typeof value === type;
    }
    return value instanceof type;
}
let Eyelashes3DProperty = class Eyelashes3DProperty extends APJS.ScriptCustomObject {
    constructor(rtti) {
        super(rtti);
        this.upperOffset = new APJS.Vector3f();
        this.lowerOffset = new APJS.Vector3f();
        this.length = 0;
        this.curl = 0;
        this.density = 1;
        this.blinkRotation = 0;
        this.texture = undefined;
        this.opacity = 1;
        this.blendMode = undefined;
        this.color = new APJS.Color(1, 1, 1, 1);
        this.gradientEnabled = false;
        this.gradientColor = new APJS.Color(1, 1, 1, 1);
        this.gradientMode = 1;
        this.gradientTexture = undefined;
        this.gradientFlip = false;
    }
    copyFrom(other) {
        this.upperOffset = other.upperOffset.clone();
        this.lowerOffset = other.lowerOffset.clone();
        this.length = other.length;
        this.curl = other.curl;
        this.density = other.density;
        this.blinkRotation = other.blinkRotation;
        this.texture = other.texture;
        this.opacity = other.opacity;
        this.blendMode = other.blendMode;
        this.color = other.color.clone();
        this.gradientEnabled = other.gradientEnabled;
        this.gradientColor = other.gradientColor.clone();
        this.gradientMode = other.gradientMode;
        this.gradientFlip = other.gradientFlip;
    }
    hasDifferences(other, properties) {
        for (const prop of properties) {
            if ((prop === 'color' || prop === 'gradientColor')) {
                if (!this[prop].equals(other[prop])) {
                    return true;
                }
            }
            else if (this[prop] !== other[prop]) {
                return true;
            }
        }
        return false;
    }
};
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "upperOffset", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "lowerOffset", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "length", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "curl", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "density", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "blinkRotation", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "texture", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "opacity", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "blendMode", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "color", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "gradientEnabled", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "gradientColor", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "gradientMode", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "gradientTexture", void 0);
__decorate([
    serialize
], Eyelashes3DProperty.prototype, "gradientFlip", void 0);
__decorate([
    userPrivateAPI()
], Eyelashes3DProperty.prototype, "copyFrom", null);
__decorate([
    userPrivateAPI()
], Eyelashes3DProperty.prototype, "hasDifferences", null);
Eyelashes3DProperty = __decorate([
    registerClass()
], Eyelashes3DProperty);
exports.Eyelashes3DProperty = Eyelashes3DProperty;
let Eyelashes3D = class Eyelashes3D extends APJS.DynamicComponent {
    constructor(rtti) {
        super(rtti);
        this.leftProperty = new Eyelashes3DProperty();
        this.rightProperty = new Eyelashes3DProperty();
        this.graphName = '';
        this.targetMesh = null;
        this.leftUpperRoot = null;
        this.leftUpperRenderer = null;
        this.leftUpperCorner = null;
        this.leftUpperCenter1 = null;
        this.leftUpperCenter2 = null;
        this.leftUpperCenter3 = null;
        this.leftUpperCenter4 = null;
        this.leftUpperCenter5 = null;
        this.leftUpperCenter6 = null;
        this.leftUpperTail = null;
        this.leftLowerRoot = null;
        this.leftLowerRenderer = null;
        this.leftLowerCorner = null;
        this.leftLowerCenter1 = null;
        this.leftLowerCenter2 = null;
        this.leftLowerCenter3 = null;
        this.leftLowerCenter4 = null;
        this.leftLowerCenter5 = null;
        this.leftLowerTail = null;
        this.rightUpperRoot = null;
        this.rightUpperRenderer = null;
        this.rightUpperCorner = null;
        this.rightUpperCenter1 = null;
        this.rightUpperCenter2 = null;
        this.rightUpperCenter3 = null;
        this.rightUpperCenter4 = null;
        this.rightUpperCenter5 = null;
        this.rightUpperCenter6 = null;
        this.rightUpperTail = null;
        this.rightLowerRoot = null;
        this.rightLowerRenderer = null;
        this.rightLowerCorner = null;
        this.rightLowerCenter1 = null;
        this.rightLowerCenter2 = null;
        this.rightLowerCenter3 = null;
        this.rightLowerCenter4 = null;
        this.rightLowerCenter5 = null;
        this.rightLowerTail = null;
        this.leftMaterial = null;
        this.rightMaterial = null;
        this.transformDirty = true;
        this._initState = false;
        this._animationDirty = {
            [LashSide.Left]: true,
            [LashSide.Right]: true
        };
        this._uniformDirty = {
            [LashSide.Left]: true,
            [LashSide.Right]: true
        };
        this._propertyCache = {
            [LashSide.Left]: new Eyelashes3DProperty(),
            [LashSide.Right]: new Eyelashes3DProperty()
        };
        this._blinkRatio = {
            [LashSide.Left]: 0,
            [LashSide.Right]: 0
        };
        this._blinkCache = {
            [LashSide.Left]: 0,
            [LashSide.Right]: 0
        };
        this._faceIndex = 0;
        this._algoDataValid = false;
        this._meshDataValid = false;
        this._algoBuffer = null;
        this._prevBuffer = null;
        this._vertexBuffer = null;
        this._offsetBuffer = null;
        this._modelMap = {};
        this.name = 'Eyelashes3D';
    }
    onStart() {
        this._initState = false;
    }
    onUpdate() {
        const firstFrame = !this._initState || this.transformDirty;
        if (firstFrame) {
            this._initState = true;
            this.transformDirty = false;
            this.initModel();
        }
        this._algoDataValid = this.getAlgoData();
        if (this._algoDataValid || this._meshDataValid) {
            this.calcEyeBlink();
            this.checkSidePropertyChanges(LashSide.Left, this.leftProperty, firstFrame);
            this.checkSidePropertyChanges(LashSide.Right, this.rightProperty, firstFrame);
            this.updateModel();
        }
    }
    onLateUpdate() {
        this._meshDataValid = this.getMeshData();
    }
    initModel() {
        console.log(`[${this.name}] initModel() start...`);
        this._modelMap = {};
        Object.values(LashSide).forEach((modelSide) => {
            Object.values(LashPos).forEach((modelPos) => {
                const modelType = `${modelSide}${modelPos}`;
                const modelInfo = this.initModelInfo(modelSide, modelPos);
                if (!modelInfo)
                    return;
                this._modelMap[modelType] = modelInfo;
            });
        });
        const modelTypes = Object.keys(this._modelMap);
        console.log(`[${this.name}] initModel() finish with ${modelTypes.length} model infos: ${modelTypes}`);
    }
    initModelInfo(modelSide, modelPos) {
        var _a, _b;
        var _c;
        const modelType = `${modelSide}${modelPos}`;
        const modelTrans = this[`${modelType}Root`];
        const modelRoot = modelTrans === null || modelTrans === void 0 ? void 0 : modelTrans.getSceneObject().getNative();
        if (!modelRoot) {
            console.log(`[${this.name}] initModelInfo() not find modelRoot in ${modelType}`);
            return null;
        }
        modelTrans.localScale = new APJS.Vector3f(1.0, 1.0, 1.0);
        const rendererTrans = this[`${modelType}Renderer`];
        const rendererObj = rendererTrans === null || rendererTrans === void 0 ? void 0 : rendererTrans.getSceneObject().getNative();
        if (!rendererObj) {
            console.log(`[${this.name}] initModelInfo() not find rendererObj in ${modelType}`);
            return null;
        }
        const skinRenderer = rendererObj.getComponent("SkinMeshRenderer");
        const sideMaterial = modelSide === LashSide.Left ? this.leftMaterial : this.rightMaterial;
        if (sideMaterial) {
            skinRenderer.sharedMaterial = sideMaterial.getNative();
        }
        const morpherComp = rendererObj.getComponent("MorpherComponent");
        const modelInfo = {
            renderer: skinRenderer,
            morpher: morpherComp,
            jointMap: this.initJointMap(modelType, skinRenderer),
        };
        if (morpherComp) {
            const channels = (_a = morpherComp.getMorpher()) === null || _a === void 0 ? void 0 : _a.channels;
            if (channels) {
                const morpherInfos = convertNativeVectorToJSArray(channels);
                const channelPrefix = MorpherNamePrefixes[modelType];
                const channelPairs = Object.entries(MorpherNameSuffixes);
                for (const [channelType, channelSuffixes] of channelPairs) {
                    for (const channelSuffix of channelSuffixes) {
                        const channelName = `${channelPrefix}${channelSuffix}`;
                        const morpherInfo = morpherInfos.find((morpherInfo) => morpherInfo.name === channelName);
                        if (morpherInfo) {
                            ((_b = modelInfo[_c = channelType]) !== null && _b !== void 0 ? _b : (modelInfo[_c] = [])).push(morpherInfo.name);
                        }
                        else {
                            console.log(`[${this.name}] initModelInfo() not find ${channelName} in ${modelType}`);
                        }
                    }
                }
            }
        }
        else {
            console.log(`[${this.name}] initModelInfo() not find morpherComp in ${modelType}`);
        }
        return modelInfo;
    }
    initJointMap(modelType, skinRenderer) {
        const jointObjs = convertNativeVectorToJSArray(skinRenderer.skin.joints);
        const jointDatas = [];
        for (const anchorKey of LashAnchorKeys) {
            const jointTrans = this[`${modelType}${anchorKey}`];
            if (!jointTrans) {
                console.log(`[${this.name}] initJointMap() not find ${anchorKey} in ${modelType}`);
                continue;
            }
            const matchedJoint = jointObjs.find(jointObj => jointObj.jointTransform.name === jointTrans.name);
            if (!matchedJoint) {
                console.log(`[${this.name}] initJointMap() not match ${anchorKey} in ${modelType}`);
                continue;
            }
            const jointData = {
                index: -1,
                transform: jointTrans,
                position: jointTrans.localPosition,
                rotation: jointTrans.localRotation,
            };
            jointDatas.push(jointData);
        }
        const jointMap = {};
        const jointNum = jointDatas.length;
        const stdIndices = StdModelIndexMap[modelType];
        const altIndices = AltModelIndexMap[modelType];
        const bindIndices = jointNum === stdIndices.length ? stdIndices : altIndices;
        for (let i = 0; i < jointNum; i++) {
            const bindIndex = bindIndices[i];
            const jointData = jointDatas[i];
            const jointName = jointData.transform.name;
            jointData.index = bindIndex;
            jointMap[jointName] = jointData;
        }
        return jointMap;
    }
    updateModel() {
        Object.values(LashSide).forEach((modelSide) => {
            const sideProperty = modelSide === LashSide.Left ? this.leftProperty : this.rightProperty;
            const animationDirty = this._animationDirty[modelSide];
            const uniformDirty = this._uniformDirty[modelSide];
            const blinkAngle = this._blinkRatio[modelSide] * NumberClamp(sideProperty.blinkRotation, 0, MaxBlinkRotation);
            Object.values(LashPos).forEach((modelPos) => {
                const modelType = `${modelSide}${modelPos}`;
                const modelInfo = this._modelMap[modelType];
                if (!modelInfo)
                    return;
                if (uniformDirty) {
                    this.updateUniforms(modelInfo, sideProperty);
                }
                if (animationDirty) {
                    this.updateAnimations(modelInfo, sideProperty, blinkAngle);
                }
                const jointOffset = modelPos === LashPos.Upper ? sideProperty.upperOffset : sideProperty.lowerOffset;
                const jointDatas = Object.values(modelInfo.jointMap);
                jointDatas.forEach((jointData) => {
                    const jointTrans = jointData.transform;
                    const jointIndex = jointData.index;
                    const position = this.getIndexPosition(jointIndex);
                    jointTrans.localPosition = position.add(jointOffset);
                    if (modelPos === LashPos.Upper && !modelInfo.blinkChannels) {
                        const rotation = APJS.Quaternionf.makeFromEulerAngles(new APJS.Vector3f(blinkAngle * DegreeToRadius, 0, 0));
                        jointTrans.localRotation = rotation.multiply(jointData.rotation);
                    }
                });
            });
        });
    }
    getMeshData() {
        var _a, _b, _c;
        this._vertexBuffer = this._offsetBuffer = null;
        if (!this.targetMesh)
            return false;
        const targetObj = (_a = this.targetMesh.getSceneObject()) === null || _a === void 0 ? void 0 : _a.getNative();
        if (!targetObj) {
            console.log(`[${this.name}] getMeshData() target scene object is null`);
            return false;
        }
        const targetRenderer = ((_b = targetObj.getComponent('MeshRenderer')) !== null && _b !== void 0 ? _b : targetObj.getComponent('SkinMeshRenderer'));
        if (!targetRenderer || !targetRenderer.enabled || !((_c = targetRenderer.mesh) === null || _c === void 0 ? void 0 : _c.getVertexCount())) {
            console.log(`[${this.name}] getMeshData() target renderer or mesh is invalid`);
            return false;
        }
        const rendererMesh = targetRenderer.mesh;
        const targetMorpher = targetObj.getComponent('MorpherComponent');
        const morpherMesh = targetMorpher === null || targetMorpher === void 0 ? void 0 : targetMorpher.getMorphedMesh();
        const attachMesh = (targetMorpher === null || targetMorpher === void 0 ? void 0 : targetMorpher.enabled) && !!morpherMesh ? morpherMesh : rendererMesh;
        const vertexData = attachMesh.getVertexArray(0, 0);
        this._vertexBuffer = vertexData ? convertNativeVec3VectorToJSFloat32Array(vertexData) : null;
        const offsetData = attachMesh.getAttributeData(effect.Amaz.VertexAttribType.POSITION_OFFSET, 0, 0);
        this._offsetBuffer = offsetData ? convertNativeFloatVectorToJSFloat32Array(offsetData) : null;
        return this._vertexBuffer !== null && this._vertexBuffer.length >= MinBufferSize;
    }
    getAlgoData() {
        var _a, _b, _c;
        this._prevBuffer = this._algoBuffer;
        this._algoBuffer = null;
        const faceTrack = (_a = this.getSceneObject().parent) === null || _a === void 0 ? void 0 : _a.getComponent('JSScriptComponent');
        this._faceIndex = (_c = (_b = faceTrack === null || faceTrack === void 0 ? void 0 : faceTrack.properties) === null || _b === void 0 ? void 0 : _b.get('faceIdx')) !== null && _c !== void 0 ? _c : this._faceIndex;
        const algResult = algoManger.getAEAlgorithmResult();
        if (!algResult) {
            console.log(`[${this.name}] getMeshInfo() algResult object is null`);
            return false;
        }
        const facefittingCount = algResult.getAlgorithmInfoCount(this.graphName, 'facefitting_3d_0', 'facefitting_3d', 0);
        if (facefittingCount <= 0) {
            console.log(`[${this.name}] getMeshInfo() facefittingCount <= 0`);
            return false;
        }
        const faceMeshInfo = algResult.getAlgorithmInfo(this.graphName, 'facefitting_3d_0', 'facefitting_3d', this._faceIndex);
        if (!faceMeshInfo) {
            console.log(`[${this.name}] getMeshInfo() faceMeshInfo object is null`);
            return false;
        }
        const vertexData = faceMeshInfo.data.get('vertexes');
        this._algoBuffer = vertexData ? convertNativeVec3VectorToJSFloat32Array(vertexData) : null;
        return this._algoBuffer !== null && this._algoBuffer.length >= MinBufferSize;
    }
    calcEyeBlink() {
        var _a;
        const vertexBuffer = ((_a = this._algoBuffer) !== null && _a !== void 0 ? _a : this._vertexBuffer);
        const leftGap = vertexBuffer[EyeGapIndices[0]] - vertexBuffer[EyeGapIndices[1]];
        const rightGap = vertexBuffer[EyeGapIndices[2]] - vertexBuffer[EyeGapIndices[3]];
        const leftRatio = (MaxEyeGap - leftGap) / (MaxEyeGap - MinEyeGap);
        const rightRatio = (MaxEyeGap - rightGap) / (MaxEyeGap - MinEyeGap);
        this._blinkRatio[LashSide.Left] = Math.sqrt(NumberClamp(leftRatio, 0.0, 1.0));
        this._blinkRatio[LashSide.Right] = Math.sqrt(NumberClamp(rightRatio, 0.0, 1.0));
    }
    checkSidePropertyChanges(side, property, forceDirty) {
        const animationProps = [
            'blinkRotation',
            'curl',
            'length',
        ];
        const uniformProps = [
            'texture',
            'color',
            'density',
            'opacity',
            'blendMode',
            'gradientEnabled',
            'gradientColor',
            'gradientMode',
            'gradientFlip'
        ];
        const propertyCache = this._propertyCache[side];
        const isAnimationDirty = propertyCache.hasDifferences(property, animationProps) || forceDirty;
        const isUniformDirty = propertyCache.hasDifferences(property, uniformProps) || forceDirty;
        if (isUniformDirty || isAnimationDirty) {
            propertyCache.copyFrom(property);
        }
        const isBlinkDirty = this._blinkRatio[side] !== this._blinkCache[side];
        this._blinkCache[side] = this._blinkRatio[side];
        this._animationDirty[side] = isAnimationDirty || isBlinkDirty;
        this._uniformDirty[side] = isUniformDirty;
    }
    getIndexPosition(vertexIndex) {
        if (Array.isArray(vertexIndex)) {
            return APJS.Vector3f.lerp(this.getIndexPosition(vertexIndex[0]), this.getIndexPosition(vertexIndex[1]), 0.5);
        }
        const [algoPos, prevPos, vertexPos, offsetPos] = [
            this._algoBuffer && GetVec3FromBuffer(this._algoBuffer, vertexIndex),
            this._prevBuffer && GetVec3FromBuffer(this._prevBuffer, vertexIndex),
            this._vertexBuffer && GetVec3FromBuffer(this._vertexBuffer, vertexIndex),
            this._offsetBuffer && GetVec3FromBuffer(this._offsetBuffer, vertexIndex)
        ];
        if (!vertexPos)
            return new APJS.Vector3f(...algoPos);
        const [x, y, z] = algoPos && prevPos
            ? [
                algoPos[0] + vertexPos[0] + ((offsetPos === null || offsetPos === void 0 ? void 0 : offsetPos[0]) || 0) - prevPos[0],
                algoPos[1] + vertexPos[1] + ((offsetPos === null || offsetPos === void 0 ? void 0 : offsetPos[1]) || 0) - prevPos[1],
                algoPos[2] + vertexPos[2] + ((offsetPos === null || offsetPos === void 0 ? void 0 : offsetPos[2]) || 0) - prevPos[2]
            ]
            : [
                vertexPos[0] + ((offsetPos === null || offsetPos === void 0 ? void 0 : offsetPos[0]) || 0),
                vertexPos[1] + ((offsetPos === null || offsetPos === void 0 ? void 0 : offsetPos[1]) || 0),
                vertexPos[2] + ((offsetPos === null || offsetPos === void 0 ? void 0 : offsetPos[2]) || 0)
            ];
        return new APJS.Vector3f(x, y, z);
    }
    updateAnimations(info, property, blinkAngle) {
        var _a, _b, _c;
        const morpherComp = info.morpher;
        if (morpherComp) {
            const blinkWeight = blinkAngle / MaxBlinkRotation;
            const curlWeight = NumberClamp(property.curl, -1, 1);
            const lengthWeight = NumberClamp(property.length, -1, 1);
            (_a = info.blinkChannels) === null || _a === void 0 ? void 0 : _a.forEach(channel => morpherComp.setChannelWeight(channel, blinkWeight));
            const curlWeights = [-curlWeight, curlWeight, curlWeight * Math.max(0, lengthWeight)];
            (_b = info.curlChannels) === null || _b === void 0 ? void 0 : _b.forEach((channel, index) => morpherComp.setChannelWeight(channel, Math.max(0, curlWeights[index])));
            const lengthWeights = [-lengthWeight, lengthWeight];
            (_c = info.lengthChannels) === null || _c === void 0 ? void 0 : _c.forEach((channel, index) => morpherComp.setChannelWeight(channel, Math.max(0, lengthWeights[index])));
        }
    }
    covertColorToVec4(color) {
        return new effect.Amaz.Vector4f(color.r, color.g, color.b, color.a);
    }
    updateUniforms(info, property) {
        var _a;
        const props = (_a = info.renderer) === null || _a === void 0 ? void 0 : _a.props;
        if (!props) {
            console.log(`[${this.name}] updateUniforms() renderer or properties is null`);
            return;
        }
        props.setFloat("_Opacity", NumberClamp(property.opacity, 0, 1));
        props.setFloat("_Density", NumberClamp(property.density, -1, 1));
        if (property.gradientEnabled) {
            props.setFloat('_GradientMode', property.gradientMode + 1);
            props.setFloat('_GradientFlip', property.gradientFlip ? 1 : 0);
        }
        else {
            props.setFloat('_GradientMode', 0);
            props.setFloat('_GradientFlip', 0);
        }
        props.setVec4('_BaseColor', this.covertColorToVec4(property.color));
        props.setVec4('_GradientColor', this.covertColorToVec4(property.gradientColor));
        if (property.texture) {
            props.setTexture("_BaseTexture", property.texture.getNative());
        }
        if (property.gradientTexture) {
            props.setTexture("_GradientTexture", property.gradientTexture.getNative());
        }
    }
    onDestroy() {
        this._algoBuffer = null;
        this._prevBuffer = null;
        this._vertexBuffer = null;
        this._offsetBuffer = null;
        this._modelMap = {};
    }
    setProperty(type, scope, value) {
        if (type.length < 2) {
            return;
        }
        const key = type[0].toLowerCase() + type.slice(1);
        const propertyType = propertyTypeMap[type];
        if (scope === 'Both') {
            if (!Array.isArray(value) || value.length !== 2) {
                return;
            }
            const leftValue = value[0];
            const rightValue = value[1];
            if (!isValueOfType(leftValue, propertyType) || !isValueOfType(rightValue, propertyType)) {
                return;
            }
            this.leftProperty[key] = value[0];
            this.rightProperty[key] = value[1];
        }
        else if (scope === 'Left') {
            if (!isValueOfType(value, propertyType)) {
                return;
            }
            this.leftProperty[key] = value;
        }
        else if (scope === 'Right') {
            if (!isValueOfType(value, propertyType)) {
                return;
            }
            this.rightProperty[key] = value;
        }
    }
    getProperty(type, scope) {
        if (type.length < 2) {
            return;
        }
        const key = type[0].toLowerCase() + type.slice(1);
        if (scope === 'Both') {
            const leftValue = this.leftProperty[key];
            const rightValue = this.rightProperty[key];
            return [leftValue, rightValue];
        }
        else {
            let eyelashes3DProperty;
            if (scope === 'Left') {
                eyelashes3DProperty = this.leftProperty;
            }
            else if (scope === 'Right') {
                eyelashes3DProperty = this.rightProperty;
            }
            if (!eyelashes3DProperty) {
                return;
            }
            return eyelashes3DProperty[key];
        }
    }
    getLeftProperty() {
        return this.leftProperty;
    }
    getRightProperty() {
        return this.rightProperty;
    }
};
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftProperty", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightProperty", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "graphName", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "targetMesh", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftUpperRoot", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftUpperRenderer", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftUpperCorner", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftUpperCenter1", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftUpperCenter2", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftUpperCenter3", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftUpperCenter4", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftUpperCenter5", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftUpperCenter6", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftUpperTail", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftLowerRoot", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftLowerRenderer", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftLowerCorner", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftLowerCenter1", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftLowerCenter2", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftLowerCenter3", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftLowerCenter4", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftLowerCenter5", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftLowerTail", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightUpperRoot", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightUpperRenderer", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightUpperCorner", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightUpperCenter1", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightUpperCenter2", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightUpperCenter3", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightUpperCenter4", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightUpperCenter5", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightUpperCenter6", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightUpperTail", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightLowerRoot", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightLowerRenderer", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightLowerCorner", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightLowerCenter1", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightLowerCenter2", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightLowerCenter3", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightLowerCenter4", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightLowerCenter5", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightLowerTail", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "leftMaterial", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Eyelashes3D.prototype, "rightMaterial", void 0);
__decorate([
    userPrivateAPI(),
    APJS.dualInstanceProperty()
], Eyelashes3D.prototype, "transformDirty", void 0);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "onStart", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "onUpdate", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "onLateUpdate", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "initModel", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "initModelInfo", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "initJointMap", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "updateModel", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "getMeshData", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "getAlgoData", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "calcEyeBlink", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "checkSidePropertyChanges", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "getIndexPosition", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "updateAnimations", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "covertColorToVec4", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "updateUniforms", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "onDestroy", null);
__decorate([
    userPublicAPI()
], Eyelashes3D.prototype, "setProperty", null);
__decorate([
    userPublicAPI()
], Eyelashes3D.prototype, "getProperty", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "getLeftProperty", null);
__decorate([
    userPrivateAPI()
], Eyelashes3D.prototype, "getRightProperty", null);
Eyelashes3D = __decorate([
    registerClass()
], Eyelashes3D);
exports.Eyelashes3D = Eyelashes3D;
hideAPIPrototype(Eyelashes3D);
