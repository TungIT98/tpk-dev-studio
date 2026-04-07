"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostProcessRenderContext = void 0;
const APJS = require('../amazingpro.js')
const { FilterMipmapMode, FilterMode, BuiltInTextureType, DataType, InternalFormat, registerClass } = APJS;
let PostProcessRenderContext = class PostProcessRenderContext {
    constructor() {
        this.camera = null;
        this.source = null;
        this.destination = null;
        this.commands = null;
        this.width = 720;
        this.height = 1280;
        this.rtConfig = new APJS.RenderTextureCreateDesc();
        this.rtConfig.builtinType = BuiltInTextureType.NORAML;
        this.rtConfig.internalFormat = InternalFormat.RGBA8;
        this.rtConfig.dataType = DataType.U8norm;
        this.rtConfig.filterMag = FilterMode.Linear;
        this.rtConfig.filterMin = FilterMode.Linear;
        this.rtConfig.filterMipmap = FilterMipmapMode.None;
    }
    setCamera(camera) {
        this.camera = camera;
    }
    getCamera() {
        return this.camera;
    }
    setSource(renderTexture) {
        this.source = renderTexture;
    }
    getSource() {
        return this.source;
    }
    setDestination(renderTexture) {
        this.destination = renderTexture;
    }
    getDestination() {
        return this.destination;
    }
    setScreenWidth(width) {
        this.width = width;
    }
    getScreenWidth() {
        return this.width;
    }
    setScreenHeight(height) {
        this.height = height;
    }
    getScreenHeight() {
        return this.height;
    }
    setCommandBuffer(commands) {
        this.commands = commands;
    }
    getCommandBuffer() {
        return this.commands;
    }
    getHeight() {
        if (this.camera) {
            return this.camera.viewport.height * this.camera.renderTexture.getHeight();
        }
        return undefined;
    }
    getWidth() {
        if (this.camera) {
            return this.camera.viewport.width * this.camera.renderTexture.getWidth();
        }
        return undefined;
    }
    getRTConfig() {
        return this.rtConfig;
    }
};
PostProcessRenderContext = __decorate([
    registerClass()
], PostProcessRenderContext);
exports.PostProcessRenderContext = PostProcessRenderContext;
