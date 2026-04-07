"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostEffect = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, userPublicAPI, userPrivateAPI, EnterInternalScope, QuitInternalScope, hideAPIPrototype } = APJS;
let PostEffect = class PostEffect extends APJS.ScriptCustomObject {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        this.mName = '';
        this.commands = new APJS.CommandBuffer();
        this.dirty = true;
        this.enabled = false;
        this._material = null;
        this.setupCommand = false;
        QuitInternalScope(this);
    }
    render(postProcessContext) { }
    isEqual(value, oldValue) {
        if (typeof oldValue !== 'object') {
            if (value !== oldValue) {
                this.dirty = true;
            }
        }
        else if (typeof oldValue === 'object') {
            if ((value !== null && value.equals(oldValue) === false) ||
                (oldValue !== null && oldValue.equals(value) === false)) {
                this.dirty = true;
            }
        }
    }
};
__decorate([
    userPublicAPI(),
    serialize
], PostEffect.prototype, "enabled", void 0);
__decorate([
    serialize
], PostEffect.prototype, "_material", void 0);
__decorate([
    userPrivateAPI()
], PostEffect.prototype, "render", null);
__decorate([
    userPrivateAPI()
], PostEffect.prototype, "isEqual", null);
PostEffect = __decorate([
    registerClass()
], PostEffect);
exports.PostEffect = PostEffect;
hideAPIPrototype(PostEffect);
