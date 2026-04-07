"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioComponent = void 0;
const APJS = require('../amazingpro.js')
const { registerClass, serialize, userPublicAPI, userPrivateAPI, EnterInternalScope, QuitInternalScope, hideAPIPrototype, } = APJS;
const Amaz = effect.Amaz;
/**
 * @class AudioComponent
 * @extends DynamicComponent
 * @description Audio component. Component that plays back audio.
 * @apjs_protected_constructor
 */
let AudioComponent = class AudioComponent extends APJS.DynamicComponent {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        // =================serialized props begin=================
        this.isMobilePreview = false;
        this.volume = 100;
        this.mute = false;
        this.autoPlay = false;
        this.playMode = 'Once';
        this.loopCount = 1;
        this.resourcePath = '';
        // =================serialized props end=================
        this.audioClipPlayer = null;
        this.audioPlayMode = '';
        this.internalLoopCount = 1;
        this.currentLoop = 0;
        this.playState = undefined;
        this.audioMute = undefined;
        this.audioVolume = undefined;
        this.isAutoPlay = undefined;
        this.audioFilePath = '';
        this.audioDuration = 0;
        this.dirty = false;
        this.prevEntityVisibleState = true;
        this.entityVisible = true;
        this.isFinished = false;
        this.previewPaused = false;
        this.audioGraphAssembler = APJS.AudioGraphAssembler.getInstance();
        this.confirmProgress = false;
        this.onInitFlag = false;
        this.internalEnabled = true;
        this.name = 'AudioComponent';
        const sceneObject = this.getSceneObject();
        if (sceneObject) {
            const nativeEntity = sceneObject.getNative();
            if (nativeEntity) {
                const scene = nativeEntity.scene;
                if (scene) {
                    if (scene.getLaunchMode() === 'EDIT') {
                        return;
                    }
                }
            }
        }
        this.internalEnabled = this.enabled;
        this.audioGraphAssembler.registerAudioUser();
        QuitInternalScope(this);
    }
    /**
     * @readonly
     * @description Get audio duration.
     * @type: number
     */
    get duration() {
        var _a, _b;
        return (_b = (_a = this.audioClipPlayer) === null || _a === void 0 ? void 0 : _a.duration) !== null && _b !== void 0 ? _b : 0;
    }
    /**
     * @description Audio position in seconds.
     * @type: number
     */
    get position() {
        var _a, _b;
        return (_b = (_a = this.audioClipPlayer) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : 0;
    }
    set position(value) {
        if (this.audioClipPlayer) {
            this.audioClipPlayer.position = value;
        }
    }
    /**
     * @description Stop audio playback.
     */
    stop() {
        if (this.audioClipPlayer) {
            this.audioClipPlayer.stop();
            this.playState = 'stop';
        }
    }
    /**
     * @description Start audio playback.
     */
    play() {
        if (this.audioClipPlayer) {
            this.audioClipPlayer.play();
            this.playState = 'readyPlay';
            this.isFinished = false;
            this.confirmProgress = false;
        }
    }
    /**
     * @description Pause audio playback.
     */
    pause() {
        if (this.audioClipPlayer) {
            this.audioClipPlayer.pause();
            this.playState = 'pause';
        }
    }
    /**
     * @description Resume audio playback.
     */
    resume() {
        if (this.audioClipPlayer) {
            this.audioClipPlayer.resume();
            this.playState = 'resume';
        }
    }
    /**
     * @description Set audio resource.
     */
    setAudioAsset(audioClip) {
        this.resourcePath = audioClip.source;
    }
    onStart() {
        this.audioGraphAssembler.startProxy();
        if (this.autoPlay === true && this.playState === undefined && this.internalEnabled) {
            this.play();
        }
        //@ts-ignore
        const globalEmitter = APJS.EventManager.getGlobalEmitter();
        globalEmitter.on(APJS.EventType.RecordStart, this.handleReset, this);
        console.log('AudioComponent onStart');
    }
    onEnable() {
        this.internalEnabled = true;
        if (!this.onInitFlag) {
            this.currentLoop = 0;
            if (this.internalEnabled === true &&
                this.getSceneObject().getNative() &&
                this.getSceneObject().getNative().visible === true &&
                this.isAutoPlay === true) {
                this.play();
            }
        }
        else {
            //first enable come ,do not need play
            this.onInitFlag = false;
        }
    }
    onDisable() {
        this.internalEnabled = false;
        this.stopAndReset();
    }
    onUpdate(deltaTime) {
        var _a, _b;
        this.audioGraphAssembler.updateDelayAEC();
        if (deltaTime === 0 && this.previewPaused === false && (this.playState === 'play' || this.playState === 'resume')) {
            this.pause();
            this.previewPaused = true;
        }
        else if (deltaTime !== 0 && this.previewPaused === true) {
            if (this.playState === 'pause') {
                this.resume();
            }
            this.previewPaused = false;
        }
        if (this.getSceneObject().getNative() &&
            this.getSceneObject().getNative().visible === false &&
            this.prevEntityVisibleState === true) {
            this.stopAndReset();
            this.prevEntityVisibleState = false;
            this.internalEnabled = false;
            return;
        }
        if (this.getSceneObject().getNative() &&
            this.getSceneObject().getNative().visible === true &&
            this.prevEntityVisibleState === false) {
            this.resetToPlay();
            this.prevEntityVisibleState = true;
            this.internalEnabled = true;
        }
        if (this.internalEnabled === false || this.previewPaused === true) {
            return;
        }
        this.updateProperties();
        if (this.dirty) {
            this.stop();
            this.resetRecordData();
            this.dirty = false;
            if (this.isAutoPlay === true) {
                this.play();
            }
            else {
                return;
            }
        }
        if (this.playState === 'play' || this.playState === 'resume') {
            const audioProgress = (_b = (_a = this.audioClipPlayer) === null || _a === void 0 ? void 0 : _a.progress) !== null && _b !== void 0 ? _b : 0;
            if (audioProgress > 0 && audioProgress !== 1) {
                // FIXME: when audio is playing, set confirmProgress
                this.confirmProgress = true;
            }
            if (audioProgress >= 1 || audioProgress === 0) {
                if (!this.confirmProgress) {
                    return;
                }
                this.confirmProgress = false;
                if (this.audioPlayMode === 'Loop' || this.audioPlayMode === 'Once') {
                    this.currentLoop += 1;
                }
                else {
                    this.currentLoop = -1;
                }
                this.play();
                if (this.currentLoop >= this.internalLoopCount) {
                    this.stop();
                    this.isFinished = true;
                }
            }
        }
        else if (this.playState === 'readyPlay') {
            this.playState = 'play';
        }
    }
    onInit() {
        this.audioGraphAssembler.isMobilePreview = this.isMobilePreview;
        const resPath = this.getSceneObject().getNative().scene.assetMgr.rootDir + this.audioFilePath;
        this.audioClipPlayer = this.audioGraphAssembler.createPlayerFromPath(resPath);
        this.updateProperties(true);
        this.dirty = false;
        if (this.internalEnabled === true) {
            this.onInitFlag = true;
        }
        this.audioGraphAssembler.audioUserInited();
    }
    updateVolomeProperty() {
        if (this.volume !== this.audioVolume) {
            this.audioVolume = this.volume;
            if (this.audioVolume > 100) {
                this.audioVolume = 100;
            }
            else if (this.audioVolume < 0) {
                this.audioVolume = 0;
            }
            if (this.mute === true) {
                if (this.audioClipPlayer) {
                    this.audioClipPlayer.volume = 0;
                }
            }
            else {
                if (this.audioClipPlayer) {
                    this.audioClipPlayer.volume = this.audioVolume / 100.0;
                }
            }
        }
    }
    updateMuteProperty() {
        if (this.audioMute !== this.mute) {
            if (this.mute === true) {
                if (this.audioClipPlayer) {
                    this.audioClipPlayer.volume = 0;
                }
            }
            else {
                if (this.audioClipPlayer) {
                    this.audioClipPlayer.volume = this.audioVolume / 100.0;
                }
            }
            this.audioMute = this.mute;
        }
    }
    updateProperties(isOnInit = false) {
        //for component control
        this.updateVolomeProperty();
        this.updateMuteProperty();
        if (this.isAutoPlay !== this.autoPlay ||
            this.audioPlayMode !== this.playMode ||
            this.internalLoopCount !== this.loopCount) {
            this.isAutoPlay = this.autoPlay;
            this.audioPlayMode = this.playMode;
            this.internalLoopCount = this.loopCount;
            if (this.audioPlayMode === 'Once') {
                this.internalLoopCount = 1;
            }
            this.dirty = true;
        }
        if (this.resourcePath !== this.audioFilePath) {
            if (isOnInit !== true) {
                this.stop();
            }
            this.audioFilePath = this.resourcePath;
            if (this.audioFilePath === '') {
                this.internalEnabled = false;
            }
            else {
                this.internalEnabled = true;
            }
            const resPath = this.getSceneObject().getNative().scene.assetMgr.rootDir + this.audioFilePath;
            if (this.audioClipPlayer) {
                this.audioClipPlayer.resourcePath = resPath;
                this.audioDuration = this.audioClipPlayer.duration * 1000;
            }
            this.dirty = true;
        }
    }
    resetRecordData() {
        this.currentLoop = 0;
    }
    resetToPlay() {
        this.currentLoop = 0;
        if (this.internalEnabled === true &&
            this.getSceneObject().getNative() &&
            this.getSceneObject().getNative().visible === true) {
            this.play();
        }
    }
    stopAndReset() {
        this.stop();
        this.currentLoop = 0;
    }
    handleReset(event) {
        console.log('reset:', 'received record msg.');
        if (this.getSceneObject().getNative().scene.getSettings !== undefined) {
            // < 1490 sdk getSettings === undefined
            const settings = this.getSceneObject().getNative().scene.getSettings();
            const auto_reset = settings.get('auto_reset_effect');
            if (auto_reset !== true) {
                console.log('reset:', 'auto_reset is closed.');
                return;
            }
            console.log('reset:', 'auto_reset is opened.');
            // do reset...
            this.resetToOnStart();
        }
    }
    resetToOnStart() {
        console.log('reset:', 'reset audio.');
        this.confirmProgress = false;
        this.stopAndReset();
        this.playState = undefined;
        this.onStart();
    }
    onDestroy() {
        //@ts-ignore
        const globalEmitter = APJS.EventManager.getGlobalEmitter();
        globalEmitter.off(APJS.EventType.RecordStart, this.handleReset, this);
        this.audioGraphAssembler.audioUserDestroyed();
        this.audioGraphAssembler.releaseProxy();
    }
};
__decorate([
    userPrivateAPI(),
    serialize
], AudioComponent.prototype, "isMobilePreview", void 0);
__decorate([
    userPublicAPI(),
    serialize
], AudioComponent.prototype, "volume", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], AudioComponent.prototype, "mute", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], AudioComponent.prototype, "autoPlay", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], AudioComponent.prototype, "playMode", void 0);
__decorate([
    userPublicAPI(),
    serialize
], AudioComponent.prototype, "loopCount", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], AudioComponent.prototype, "resourcePath", void 0);
__decorate([
    userPublicAPI()
], AudioComponent.prototype, "duration", null);
__decorate([
    userPrivateAPI()
], AudioComponent.prototype, "position", null);
__decorate([
    userPublicAPI()
], AudioComponent.prototype, "stop", null);
__decorate([
    userPublicAPI()
], AudioComponent.prototype, "play", null);
__decorate([
    userPublicAPI()
], AudioComponent.prototype, "pause", null);
__decorate([
    userPublicAPI()
], AudioComponent.prototype, "resume", null);
__decorate([
    userPublicAPI()
], AudioComponent.prototype, "setAudioAsset", null);
AudioComponent = __decorate([
    registerClass()
], AudioComponent);
exports.AudioComponent = AudioComponent;
hideAPIPrototype(AudioComponent);
//# sourceMappingURL=AudioComponent.js.map