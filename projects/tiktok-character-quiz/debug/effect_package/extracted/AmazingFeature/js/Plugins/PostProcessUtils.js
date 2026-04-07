"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostProcessUtils = void 0;
const APJS = require('../amazingpro.js')
const { BuiltInTextureType, DataType, InternalFormat, FilterMipmapMode, FilterMode, WrapMode, registerClass } = APJS;
const kEplison = 0.00005;
let PostProcessUtils = class PostProcessUtils {
    static gammaToLinearSpace(value) {
        if (value <= 0.04045) {
            return value / 12.92;
        }
        else if (value < 1.0) {
            return Math.pow((value + 0.055) / 1.055, 2.4);
        }
        else {
            return Math.pow(value, 2.4);
        }
    }
    static gammaToLinearSpaceColor(color) {
        const lr = this.gammaToLinearSpace(color.x);
        const lg = this.gammaToLinearSpace(color.y);
        const lb = this.gammaToLinearSpace(color.z);
        return new APJS.Vector4f(lr, lg, lb, color.w);
    }
    static getSTConfig(name) {
        const rtConfig = new APJS.ScreenTextureCreateDesc();
        rtConfig.name = name;
        rtConfig.builtinType = BuiltInTextureType.NORAML;
        rtConfig.internalFormat = InternalFormat.RGBA8;
        rtConfig.dataType = DataType.U8norm;
        rtConfig.filterMag = FilterMode.Linear;
        rtConfig.filterMin = FilterMode.Linear;
        rtConfig.filterMipmap = FilterMipmapMode.None;
        rtConfig.colorFormat = APJS.PixelFormat.RGBA8Unorm;
        return rtConfig;
    }
    static createScreenTexture(name, width, height) {
        const inputWidth = APJS.AmazingManager.getSingleton('BuiltinObject').getInputTextureWidth();
        const inputHeight = APJS.AmazingManager.getSingleton('BuiltinObject').getInputTextureHeight();
        const st = APJS.TextureUtils.createScreenTexture(this.getSTConfig(name));
        const stProvider = st.getControl();
        stProvider.pecentX = width / inputWidth;
        stProvider.pecentY = height / inputHeight;
        return st;
    }
    static setupRTConfig(rtConfig, width, height, colorFormat) {
        rtConfig.width = width;
        rtConfig.height = height;
        rtConfig.colorFormat = colorFormat || APJS.PixelFormat.RGBA8Unorm;
    }
    static getRTConfig(width, height) {
        const rtConfig = new APJS.RenderTextureCreateDesc();
        rtConfig.builtinType = BuiltInTextureType.NORAML;
        rtConfig.internalFormat = InternalFormat.RGBA8;
        rtConfig.dataType = DataType.U8norm;
        rtConfig.filterMag = FilterMode.Nearest;
        rtConfig.filterMin = FilterMode.Nearest;
        rtConfig.wrapModeS = WrapMode.Clamp;
        rtConfig.wrapModeT = WrapMode.Clamp;
        rtConfig.filterMipmap = FilterMipmapMode.None;
        rtConfig.width = width;
        rtConfig.height = height;
        return rtConfig;
    }
    static createLUT(width, height) {
        return APJS.TextureUtils.createRenderTexture(this.getRTConfig(width, height));
    }
};
PostProcessUtils = __decorate([
    registerClass()
], PostProcessUtils);
exports.PostProcessUtils = PostProcessUtils;
