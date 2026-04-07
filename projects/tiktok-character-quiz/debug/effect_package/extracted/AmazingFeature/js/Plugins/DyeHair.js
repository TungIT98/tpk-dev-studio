"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DyeHair = exports.CustomTextureModeProperties = exports.StreaksModeProperties = exports.TwoToneModeProperties = exports.FullModeProperties = exports.GradientType = exports.DyeHairMode = void 0;
const APJS = require('../amazingpro.js')
const { dualInstanceMethod, registerClass, serialize, userPublicAPI, userPrivateAPI, hideAPIPrototype, EnterInternalScope, QuitInternalScope, } = APJS;
var DyeHairMode;
(function (DyeHairMode) {
    DyeHairMode["Full"] = "Full";
    DyeHairMode["TwoTone"] = "TwoTone";
    DyeHairMode["Streaks"] = "Streaks";
    DyeHairMode["CustomTexture"] = "CustomTexture";
})(DyeHairMode = exports.DyeHairMode || (exports.DyeHairMode = {}));
var GradientType;
(function (GradientType) {
    GradientType["Horizontal"] = "Horizontal";
    GradientType["Vertical"] = "Vertical";
})(GradientType = exports.GradientType || (exports.GradientType = {}));
const DEFAULT_FACE_INDEX = 0;
const BLEACH_NODE_NAME = "bleachhair";
const GAN_TEXTURE_UNIFORM = "ganTexture";
const MASK_TEXTURE_UNIFORM = "maskTexture";
const GAN_TRANSFORM_UNIFORM = "mvpMat";
const ENABLE_UNIFORM = "enable";
const STREAKS_MASK_UNIFORMS = [
    'tiaoRanMask0',
    'tiaoRanMask1',
    'tiaoRanMask2',
    'tiaoRanMask3',
    'tiaoRanMask4'
];
const STREAKS_REFLECTOR_UNIFORMS = [
    'reflector0',
    'reflector1',
    'reflector2',
    'reflector3',
    'reflector4'
];
const propertyTypeMap = {
    Mode: 'string',
    Bleach: 'boolean',
    BleachIntensity: 'number',
    Coverage: 'number',
    Color: APJS.Color,
    Color1: APJS.Color,
    Color2: APJS.Color,
    Color3: APJS.Color,
    Color4: APJS.Color,
    GradientType: 'string',
    GradientArea: 'number',
    Flip: 'boolean',
    Texture: APJS.Texture,
    Opacity: 'number',
};
function isValidValueForType(type, value) {
    const propertyType = propertyTypeMap[type];
    if (type === 'Mode') {
        return Object.values(DyeHairMode).includes(value);
    }
    if (type === 'GradientType') {
        return Object.values(GradientType).includes(value);
    }
    if (typeof propertyType === 'string') {
        return typeof value === propertyType;
    }
    return value instanceof propertyType;
}
const propertyConfig = {
    [DyeHairMode.Full]: {
        'Bleach': 'isBleachEnabled',
        'BleachIntensity': 'bleachIntensity',
        'Color': 'color'
    },
    [DyeHairMode.TwoTone]: {
        'Bleach': 'isBleachEnabled',
        'BleachIntensity': 'bleachIntensity',
        'Color1': 'color1',
        'Color2': 'color2',
        'GradientType': 'gradientType',
        'GradientArea': 'gradientArea',
        'Flip': 'isFlip'
    },
    [DyeHairMode.Streaks]: {
        'Color1': 'color1',
        'Color2': 'color2',
        'Color3': 'color3',
        'Color4': 'color4'
    },
    [DyeHairMode.CustomTexture]: {
        'Bleach': 'isBleachEnabled',
        'BleachIntensity': 'bleachIntensity',
        'Texture': 'texture',
        'Opacity': 'opacity'
    }
};
const algoManager = effect.Amaz.AmazingManager.getSingleton('Algorithm');
let FullModeProperties = class FullModeProperties extends APJS.ScriptCustomObject {
    constructor() {
        super(...arguments);
        this.mode = DyeHairMode.Full;
        this.color = new APJS.Color(1, 1, 1, 0.7);
        this.isBleachEnabledInFullMode = false;
        this.bleachIntensityInFullMode = 1.0;
        this.coverageInFullMode = 1.0;
    }
    get isBleachEnabled() {
        return this.isBleachEnabledInFullMode;
    }
    set isBleachEnabled(value) {
        this.isBleachEnabledInFullMode = value;
    }
    get bleachIntensity() {
        return this.bleachIntensityInFullMode;
    }
    set bleachIntensity(value) {
        this.bleachIntensityInFullMode = value;
    }
    get coverage() {
        return this.coverageInFullMode;
    }
    set coverage(value) {
        this.coverageInFullMode = value;
    }
};
__decorate([
    serialize
], FullModeProperties.prototype, "mode", void 0);
__decorate([
    serialize
], FullModeProperties.prototype, "color", void 0);
__decorate([
    serialize
], FullModeProperties.prototype, "isBleachEnabledInFullMode", void 0);
__decorate([
    serialize
], FullModeProperties.prototype, "bleachIntensityInFullMode", void 0);
__decorate([
    serialize
], FullModeProperties.prototype, "coverageInFullMode", void 0);
FullModeProperties = __decorate([
    registerClass()
], FullModeProperties);
exports.FullModeProperties = FullModeProperties;
let TwoToneModeProperties = class TwoToneModeProperties extends APJS.ScriptCustomObject {
    constructor() {
        super(...arguments);
        this.mode = DyeHairMode.TwoTone;
        this.startColor = new APJS.Color(1, 0, 0, 0.7);
        this.endColor = new APJS.Color(0, 0, 1, 0.7);
        this.gradientType = GradientType.Horizontal;
        this.gradientArea = 0.5;
        this.isFlip = false;
        this.isBleachEnabledInTwoToneMode = false;
        this.bleachIntensityInTwoToneMode = 1.0;
        this.coverageInTwoToneMode = 1.0;
    }
    get color1() {
        return this.startColor;
    }
    set color1(value) {
        this.startColor = value;
    }
    get color2() {
        return this.endColor;
    }
    set color2(value) {
        this.endColor = value;
    }
    get isBleachEnabled() {
        return this.isBleachEnabledInTwoToneMode;
    }
    set isBleachEnabled(value) {
        this.isBleachEnabledInTwoToneMode = value;
    }
    get bleachIntensity() {
        return this.bleachIntensityInTwoToneMode;
    }
    set bleachIntensity(value) {
        this.bleachIntensityInTwoToneMode = value;
    }
    get coverage() {
        return this.coverageInTwoToneMode;
    }
    set coverage(value) {
        this.coverageInTwoToneMode = value;
    }
};
__decorate([
    serialize
], TwoToneModeProperties.prototype, "mode", void 0);
__decorate([
    serialize
], TwoToneModeProperties.prototype, "startColor", void 0);
__decorate([
    serialize
], TwoToneModeProperties.prototype, "endColor", void 0);
__decorate([
    serialize
], TwoToneModeProperties.prototype, "gradientType", void 0);
__decorate([
    serialize
], TwoToneModeProperties.prototype, "gradientArea", void 0);
__decorate([
    serialize
], TwoToneModeProperties.prototype, "isFlip", void 0);
__decorate([
    serialize
], TwoToneModeProperties.prototype, "isBleachEnabledInTwoToneMode", void 0);
__decorate([
    serialize
], TwoToneModeProperties.prototype, "bleachIntensityInTwoToneMode", void 0);
__decorate([
    serialize
], TwoToneModeProperties.prototype, "coverageInTwoToneMode", void 0);
TwoToneModeProperties = __decorate([
    registerClass()
], TwoToneModeProperties);
exports.TwoToneModeProperties = TwoToneModeProperties;
let StreaksModeProperties = class StreaksModeProperties extends APJS.ScriptCustomObject {
    constructor() {
        super(...arguments);
        this.mode = DyeHairMode.Streaks;
        this.color1 = new APJS.Color(1, 0, 0, 1);
        this.color2 = new APJS.Color(0, 1, 0, 1);
        this.color3 = new APJS.Color(0, 0, 1, 1);
        this.color4 = new APJS.Color(1, 1, 1, 1);
        this.isBleachEnabledInStreaksMode = false;
        this.bleachIntensityInStreaksMode = 1.0;
        this.coverageInStreaksMode = 1.0;
    }
    get isBleachEnabled() {
        return this.isBleachEnabledInStreaksMode;
    }
    set isBleachEnabled(value) {
        this.isBleachEnabledInStreaksMode = value;
    }
    get bleachIntensity() {
        return this.bleachIntensityInStreaksMode;
    }
    set bleachIntensity(value) {
        this.bleachIntensityInStreaksMode = value;
    }
    get coverage() {
        return this.coverageInStreaksMode;
    }
    set coverage(value) {
        this.coverageInStreaksMode = value;
    }
};
__decorate([
    serialize
], StreaksModeProperties.prototype, "mode", void 0);
__decorate([
    serialize
], StreaksModeProperties.prototype, "color1", void 0);
__decorate([
    serialize
], StreaksModeProperties.prototype, "color2", void 0);
__decorate([
    serialize
], StreaksModeProperties.prototype, "color3", void 0);
__decorate([
    serialize
], StreaksModeProperties.prototype, "color4", void 0);
__decorate([
    serialize
], StreaksModeProperties.prototype, "isBleachEnabledInStreaksMode", void 0);
__decorate([
    serialize
], StreaksModeProperties.prototype, "bleachIntensityInStreaksMode", void 0);
__decorate([
    serialize
], StreaksModeProperties.prototype, "coverageInStreaksMode", void 0);
StreaksModeProperties = __decorate([
    registerClass()
], StreaksModeProperties);
exports.StreaksModeProperties = StreaksModeProperties;
let CustomTextureModeProperties = class CustomTextureModeProperties extends APJS.ScriptCustomObject {
    constructor() {
        super(...arguments);
        this.mode = DyeHairMode.CustomTexture;
        this.texture = APJS.TextureUtils.createTexture2D();
        this.opacity = 0.7;
        this.isBleachEnabledInCustomTextureMode = false;
        this.bleachIntensityInCustomTextureMode = 1.0;
        this.coverageInCustomTextureMode = 1.0;
    }
    get isBleachEnabled() {
        return this.isBleachEnabledInCustomTextureMode;
    }
    set isBleachEnabled(value) {
        this.isBleachEnabledInCustomTextureMode = value;
    }
    get bleachIntensity() {
        return this.bleachIntensityInCustomTextureMode;
    }
    set bleachIntensity(value) {
        this.bleachIntensityInCustomTextureMode = value;
    }
    get coverage() {
        return this.coverageInCustomTextureMode;
    }
    set coverage(value) {
        this.coverageInCustomTextureMode = value;
    }
};
__decorate([
    serialize
], CustomTextureModeProperties.prototype, "mode", void 0);
__decorate([
    serialize
], CustomTextureModeProperties.prototype, "texture", void 0);
__decorate([
    serialize
], CustomTextureModeProperties.prototype, "opacity", void 0);
__decorate([
    serialize
], CustomTextureModeProperties.prototype, "isBleachEnabledInCustomTextureMode", void 0);
__decorate([
    serialize
], CustomTextureModeProperties.prototype, "bleachIntensityInCustomTextureMode", void 0);
__decorate([
    serialize
], CustomTextureModeProperties.prototype, "coverageInCustomTextureMode", void 0);
CustomTextureModeProperties = __decorate([
    registerClass()
], CustomTextureModeProperties);
exports.CustomTextureModeProperties = CustomTextureModeProperties;
let DyeHair = class DyeHair extends APJS.DynamicComponent {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.dyeHairProperties = new FullModeProperties();
        this.graphName = "";
        this.material = new APJS.Material();
        this.bleachMask = null;
        this.autoSortingOrder = true;
        this.sortingOrder = 0;
        this.quadMesh = this.createQuadMesh();
        this.dyeHairMeshRender = null;
        this.materialInstance = null;
        this.entityTransform = null;
        this.oriPosition = new effect.Amaz.Vector3f(0, 0, 0);
        this.oriScale = new effect.Amaz.Vector3f(1, 1, 1);
        this.oriRotation = new effect.Amaz.Quaternionf(0, 0, 0, 1);
        this.testerResult_isHair = false;
        this.testerResult_isHair_streaks = false;
        this.inited = false;
        this.name = "DyeHair";
        QuitInternalScope(this);
    }
    dualInstanceSetProperty(key, value) {
        if (key.endsWith('.opacity')) {
            const originalKey = key.split('.')[0];
            if (originalKey in this.dyeHairProperties) {
                const oldColor = this.dyeHairProperties[originalKey];
                const newColor = new APJS.Color(oldColor.r, oldColor.g, oldColor.b, value);
                this.dyeHairProperties[originalKey] = newColor;
            }
        }
        if (key in this.dyeHairProperties) {
            this.dyeHairProperties[key] = value;
        }
    }
    onEnable() {
        this.dynamicSetAlgorithmEnable(true);
    }
    onDisable() {
        if (this.dyeHairMeshRender) {
            this.dyeHairMeshRender.enabled = false;
        }
        this.dynamicSetAlgorithmEnable(false);
    }
    dynamicSetAlgorithmEnable(enable) {
        if (!this.inited) {
            return;
        }
        const algoList = ["blit_0", "hair_0"];
        const _isGAN = this.dyeHairProperties.isBleachEnabled;
        if (enable) {
            for (let i = 0; i < algoList.length; ++i) {
                algoManager.setAlgorithmEnable(this.graphName, algoList[i], true);
            }
            if (_isGAN)
                algoManager.setAlgorithmEnable(this.graphName, "bleachhair", true);
        }
        else {
            for (let i = algoList.length - 1; i >= 0; --i) {
                algoManager.setAlgorithmEnable(this.graphName, algoList[i], false);
            }
            if (_isGAN)
                algoManager.setAlgorithmEnable(this.graphName, "bleachhair", false);
        }
    }
    onInit() {
        this.inited = true;
    }
    onStart() {
    }
    createMeshRender() {
        this.dyeHairMeshRender = this.getSceneObject().getNative().addComponent("MeshRenderer");
        this.dyeHairMeshRender.autoSortingOrder = this.autoSortingOrder;
        this.dyeHairMeshRender.sortingOrder = this.sortingOrder;
        this.initMaterial();
        this.dyeHairMeshRender.mesh = this.quadMesh;
        if (this.materialInstance) {
            this.dyeHairMeshRender.material = this.materialInstance;
        }
        this.initTransform();
    }
    initMaterial() {
        if (this.material) {
            this.materialInstance = this.material.getNative().instantiate();
            switch (this.dyeHairProperties.mode) {
                case DyeHairMode.Full:
                    this.materialInstance.enableMacro("AE_isAll", 1);
                    this.materialInstance.setTex(MASK_TEXTURE_UNIFORM, new effect.Amaz.Texture2D());
                    break;
                case DyeHairMode.TwoTone:
                    this.materialInstance.enableMacro("AE_isGradient", 1);
                    if (this.dyeHairProperties.gradientType == GradientType.Horizontal) {
                        this.materialInstance.enableMacro("AE_Horizontal", 1);
                    }
                    else {
                        this.materialInstance.disableMacro("AE_Horizontal");
                    }
                    this.materialInstance.setTex(MASK_TEXTURE_UNIFORM, new effect.Amaz.Texture2D());
                    break;
                case DyeHairMode.Streaks:
                    this.materialInstance.enableMacro("AE_isHighlight", 1);
                    STREAKS_MASK_UNIFORMS.forEach(uniform => {
                        this.materialInstance.setTex(uniform, new effect.Amaz.Texture2D());
                    });
                    STREAKS_REFLECTOR_UNIFORMS.forEach(uniform => {
                        this.materialInstance.setFloat(uniform, 0);
                    });
                    break;
                case DyeHairMode.CustomTexture:
                    if (this.dyeHairProperties.isBleachEnabled)
                        this.materialInstance.enableMacro("AE_isPicture", 1);
                    this.materialInstance.setTex(MASK_TEXTURE_UNIFORM, new effect.Amaz.Texture2D());
                    break;
            }
            if (this.dyeHairProperties.isBleachEnabled) {
                this.materialInstance.setTex(GAN_TEXTURE_UNIFORM, new effect.Amaz.Texture2D());
                this.materialInstance.setTex(MASK_TEXTURE_UNIFORM, new effect.Amaz.Texture2D());
                if (this.bleachMask) {
                    this.materialInstance.setTex("GANmaskTexture", this.bleachMask.getNative());
                }
                this.materialInstance.setFloat(ENABLE_UNIFORM, 0.0);
            }
        }
    }
    initTransform() {
        this.entityTransform = this.getSceneObject().getNative().getComponent("Transform");
        this.oriPosition = new effect.Amaz.Vector3f(0, 0, 0);
        this.oriScale = new effect.Amaz.Vector3f(0, 0, 0);
        const quat = new effect.Amaz.Quaternionf();
        const newRot = new effect.Amaz.Vector3f(0, 0, 0);
        this.oriRotation = quat.eulerToQuaternion(newRot);
    }
    setTransform() {
        if (this.entityTransform) {
            this.entityTransform.setWorldPosition(this.oriPosition);
            this.entityTransform.setWorldScale(this.oriScale);
            this.entityTransform.setWorldOrientation(this.oriRotation);
        }
    }
    onUpdate(deltaTime) {
        if (!this.dyeHairMeshRender) {
            this.createMeshRender();
        }
        this.setTransform();
        const isHair = this.activeAlgoTester();
        if (!isHair)
            return;
        this.dyeHairMeshRender.enabled = false;
        switch (this.dyeHairProperties.mode) {
            case DyeHairMode.Full:
                this.showAll();
                break;
            case DyeHairMode.TwoTone:
                this.showTwoTone();
                break;
            case DyeHairMode.Streaks:
                this.showStreaks();
                break;
            case DyeHairMode.CustomTexture:
                this.showCustomTexture();
                break;
            default:
        }
        this.showBleach();
    }
    activeAlgoTester() {
        const algoResult = algoManager.getAEAlgorithmResult();
        let isHair = false;
        let isHair_streaks = false;
        if (!algoResult)
            return false;
        const hairInfo = algoResult.getHairInfo();
        if (hairInfo)
            isHair = true;
        const hairGerCnt = algoResult.getHairGerInfoCount();
        if (hairGerCnt) {
            if (hairGerCnt > 0)
                isHair_streaks = true;
        }
        this.testerResult_isHair = isHair;
        this.testerResult_isHair_streaks = isHair_streaks;
        return true;
    }
    showAll() {
        const hairmaskImage = this.getHairMaskImage();
        const material = this.dyeHairMeshRender.material;
        if (hairmaskImage) {
            material.getTex(MASK_TEXTURE_UNIFORM).storage(hairmaskImage);
            material.setVec4("_Color", this.colorToVec4(this.dyeHairProperties.color));
            material.setFloat("_smoothness", 0.9 * (1.0 - this.dyeHairProperties.coverage));
            this.dyeHairMeshRender.enabled = true;
        }
        ;
    }
    colorToVec4(color) {
        return new effect.Amaz.Vector4f(color.r, color.g, color.b, color.a);
    }
    showTwoTone() {
        const hairmaskImage = this.getHairMaskImage();
        const material = this.dyeHairMeshRender.material;
        if (hairmaskImage) {
            if (this.dyeHairProperties.gradientType == GradientType.Horizontal) {
                material.enableMacro("AE_Horizontal", 1);
            }
            else {
                material.disableMacro("AE_Horizontal");
            }
            material.getTex(MASK_TEXTURE_UNIFORM).storage(hairmaskImage);
            material.setVec4("_FirstColor", this.colorToVec4(this.dyeHairProperties.color1));
            material.setVec4("_SecondColor", this.colorToVec4(this.dyeHairProperties.color2));
            material.setFloat("_smoothness", 0.9 * (1.0 - this.dyeHairProperties.coverage));
            material.setFloat("_RampRatio", this.lerp(this.dyeHairProperties.gradientArea));
            if (this.dyeHairProperties.isFlip) {
                material.setFloat("isFlip", 0.0);
            }
            else {
                material.setFloat("isFlip", 1.0);
            }
            this.dyeHairMeshRender.enabled = true;
        }
    }
    lerp(input) {
        const inputStart = 0;
        const inputEnd = 1;
        const outputStart = 0.2;
        const outputEnd = 3;
        const inputRange = inputEnd - inputStart;
        const outputRange = outputEnd - outputStart;
        if (input < inputStart || input > inputEnd) {
            return 0;
        }
        const normalizedInput = (input - inputStart) / inputRange;
        const lerpValue = normalizedInput * outputRange + outputStart;
        return lerpValue;
    }
    getHairMaskImage() {
        if (this.testerResult_isHair) {
            const algoResult = algoManager.getAEAlgorithmResult();
            if (!algoResult) {
                return null;
            }
            const hairInfo = algoResult.getHairInfo();
            if (!hairInfo) {
                return null;
            }
            return hairInfo.mask;
        }
        else if (this.testerResult_isHair_streaks) {
            const algoResult = algoManager.getAEAlgorithmResult();
            const hairGerCnt = algoResult.getHairGerInfoCount();
            if (hairGerCnt > 0) {
                const hairGerInfo = algoResult.getHairGerInfo(4);
                if (hairGerInfo)
                    return hairGerInfo.image;
                else
                    return null;
            }
        }
        return null;
    }
    showStreaks() {
        const algoResult = algoManager.getAEAlgorithmResult();
        const hairGerCnt = algoResult.getHairGerInfoCount();
        const material = this.dyeHairMeshRender.material;
        if (hairGerCnt > 0) {
            for (let i = 0; i < hairGerCnt; i++) {
                const hairGerInfo = algoResult.getHairGerInfo(i);
                material.getTex(STREAKS_MASK_UNIFORMS[i]).storage(hairGerInfo.image);
                material.setFloat(STREAKS_REFLECTOR_UNIFORMS[i], hairGerInfo.reflector);
            }
            material.setVec4("color_tiaoran_1", this.colorToVec4(this.dyeHairProperties.color1));
            material.setVec4("color_tiaoran_2", this.colorToVec4(this.dyeHairProperties.color2));
            material.setVec4("color_tiaoran_3", this.colorToVec4(this.dyeHairProperties.color3));
            material.setVec4("color_tiaoran_4", this.colorToVec4(this.dyeHairProperties.color4));
            material.setFloat("_smoothness", (1.0 - this.dyeHairProperties.coverage));
            this.dyeHairMeshRender.enabled = true;
        }
    }
    showCustomTexture() {
        const hairmaskImage = this.getHairMaskImage();
        const material = this.dyeHairMeshRender.material;
        if (hairmaskImage) {
            material.getTex(MASK_TEXTURE_UNIFORM).storage(hairmaskImage);
            material.setTex("inputTexture", this.dyeHairProperties.texture.getNative());
            material.setFloat("opacity", this.dyeHairProperties.opacity);
            material.setFloat("_smoothness", 0.9 * (1.0 - this.dyeHairProperties.coverage));
            this.dyeHairMeshRender.enabled = true;
        }
    }
    showBleach() {
        const material = this.dyeHairMeshRender.material;
        material.setFloat(ENABLE_UNIFORM, 0.0);
        if (!this.dyeHairProperties.isBleachEnabled || this.dyeHairProperties.mode === DyeHairMode.Streaks) {
            return;
        }
        let transform = this.getSceneObject().getNative().getComponent("Transform");
        if (transform) {
            transform.worldOrientation = new effect.Amaz.Quaternionf(0, 0, 0, 1);
            transform.worldPosition = new effect.Amaz.Vector3f(0, 0, 0);
            transform.worldScale = new effect.Amaz.Vector3f(1, 1, 1);
        }
        const algoResult = algoManager.getAEAlgorithmResult();
        if (!algoResult)
            return;
        let nodeInfo = algoResult.getAlgorithmInfo(this.graphName, BLEACH_NODE_NAME, "", DEFAULT_FACE_INDEX);
        if (!nodeInfo)
            nodeInfo = algoResult.getAlgorithmInfo("orion_default_graph_name", BLEACH_NODE_NAME, "", DEFAULT_FACE_INDEX);
        const faceCount = algoResult.getFaceCount();
        if (nodeInfo && faceCount > 0.001) {
            let data = nodeInfo.outputMap;
            let matrix = data.get("mvpMat");
            let image0 = data.get("image");
            material.setMat4(GAN_TRANSFORM_UNIFORM, matrix);
            material.getTex(GAN_TEXTURE_UNIFORM).storage(image0);
            if (this.dyeHairProperties.gradientType == GradientType.Horizontal) {
                material.enableMacro("AE_Horizontal", 1);
            }
            else {
                material.disableMacro("AE_Horizontal");
            }
            this.setSharpenContrast();
            material.setFloat(ENABLE_UNIFORM, 1.0);
        }
        else {
            material.setFloat(ENABLE_UNIFORM, 0.0);
        }
    }
    setSharpenContrast() {
        const material = this.dyeHairMeshRender.material;
        material.setFloat("_contrast", 0);
        material.setFloat("_midtone", this.dyeHairProperties.bleachIntensity);
    }
    beforeEditorSave() {
        this.removeMeshRenderer();
    }
    onRelease() {
        this.removeMeshRenderer();
    }
    removeMeshRenderer() {
        if (this.dyeHairMeshRender) {
            this.getSceneObject().getNative().removeComponentCom(this.dyeHairMeshRender);
            this.dyeHairMeshRender = null;
        }
    }
    createQuadMesh() {
        const mesh = new effect.Amaz.Mesh();
        const boundingBox = new effect.Amaz.AABB(new effect.Amaz.Vector3f(-4, -4, 0), new effect.Amaz.Vector3f(4, 4, 0));
        mesh.boundingBox = boundingBox;
        const pos = new effect.Amaz.VertexAttribDesc();
        pos.semantic = effect.Amaz.VertexAttribType.POSITION;
        const normal = new effect.Amaz.VertexAttribDesc();
        normal.semantic = effect.Amaz.VertexAttribType.NORMAL;
        const tangent = new effect.Amaz.VertexAttribDesc();
        tangent.semantic = effect.Amaz.VertexAttribType.TANGENT;
        const uv = new effect.Amaz.VertexAttribDesc();
        uv.semantic = effect.Amaz.VertexAttribType.TEXCOORD0;
        const vads = new effect.Amaz.Vector();
        vads.insert(0, pos);
        vads.insert(1, normal);
        vads.insert(2, tangent);
        vads.insert(3, uv);
        mesh.vertexAttribs = vads;
        const vertexData = [
            -1, 1, 0, 0, 0, 1, 1, 0, 0, -1, 0, 1,
            -1, -1, 0, 0, 0, 1, 1, 0, 0, -1, 0, 0,
            1, 1, 0, 0, 0, 1, 1, 0, 0, -1, 1, 1,
            1, -1, 0, 0, 0, 1, 1, 0, 0, -1, 1, 0,
        ];
        const fv = new effect.Amaz.FloatVector();
        for (let i = 0; i < vertexData.length; ++i) {
            fv.insert(i, vertexData[i]);
        }
        mesh.vertices = fv;
        const subMesh = new effect.Amaz.SubMesh();
        const subBoundingBox = new effect.Amaz.AABB(new effect.Amaz.Vector3f(-4, -4, 0), new effect.Amaz.Vector3f(4, 4, 0));
        subMesh.boundingBox = subBoundingBox;
        subMesh.primitive = effect.Amaz.Primitive.TRIANGLES;
        const indexData = [0, 1, 2, 3, 2, 1];
        const indices = new effect.Amaz.UInt16Vector();
        for (let i = 0; i < indexData.length; ++i) {
            indices.insert(i, indexData[i]);
        }
        subMesh.indices16 = indices;
        subMesh.mesh = mesh;
        mesh.addSubMesh(subMesh);
        return mesh;
    }
    setProperty(type, value) {
        if (!isValidValueForType(type, value)) {
            effect.Amaz.LOGE("DyeHair", "setProperty: wrong type for property " + type);
            return false;
        }
        switch (type) {
            case 'Mode':
                effect.Amaz.LOGE("DyeHair", "setProperty: mode can not be set");
                return false;
            case 'Bleach':
                effect.Amaz.LOGE("DyeHair", "setProperty: bleach can not be set");
                return false;
            case 'Coverage':
                this.dyeHairProperties.coverage = value;
                return true;
        }
        const mode = this.dyeHairProperties.mode;
        const mappings = propertyConfig[mode];
        if (mappings && type in mappings) {
            const propertyName = mappings[type];
            this.dyeHairProperties[propertyName] = value;
            return true;
        }
        effect.Amaz.LOGW("DyeHair", `setProperty: property ${type} not supported in ${this.dyeHairProperties.mode} mode`);
        return false;
    }
    getProperty(type) {
        switch (type) {
            case 'Mode':
                return this.dyeHairProperties.mode;
            case 'Coverage':
                return this.dyeHairProperties.coverage;
        }
        const mode = this.dyeHairProperties.mode;
        const mappings = propertyConfig[mode];
        if (mappings && type in mappings) {
            const propertyName = mappings[type];
            return this.dyeHairProperties[propertyName];
        }
        effect.Amaz.LOGW("DyeHair", `getProperty: property ${type} not supported in ${mode} mode`);
        return null;
    }
};
__decorate([
    userPrivateAPI(),
    serialize
], DyeHair.prototype, "dyeHairProperties", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], DyeHair.prototype, "graphName", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], DyeHair.prototype, "material", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], DyeHair.prototype, "bleachMask", void 0);
__decorate([
    userPrivateAPI(),
    dualInstanceMethod()
], DyeHair.prototype, "dualInstanceSetProperty", null);
__decorate([
    userPrivateAPI()
], DyeHair.prototype, "onEnable", null);
__decorate([
    userPrivateAPI()
], DyeHair.prototype, "onDisable", null);
__decorate([
    userPrivateAPI()
], DyeHair.prototype, "onInit", null);
__decorate([
    userPrivateAPI()
], DyeHair.prototype, "onStart", null);
__decorate([
    userPrivateAPI()
], DyeHair.prototype, "onUpdate", null);
__decorate([
    userPrivateAPI()
], DyeHair.prototype, "beforeEditorSave", null);
__decorate([
    userPrivateAPI()
], DyeHair.prototype, "onRelease", null);
__decorate([
    userPublicAPI()
], DyeHair.prototype, "setProperty", null);
__decorate([
    userPublicAPI()
], DyeHair.prototype, "getProperty", null);
DyeHair = __decorate([
    registerClass()
], DyeHair);
exports.DyeHair = DyeHair;
hideAPIPrototype(DyeHair);
