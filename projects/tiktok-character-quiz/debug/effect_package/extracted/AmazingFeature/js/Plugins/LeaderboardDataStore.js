"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var LeaderboardDataStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardDataStore = void 0;
const APJS = require('../amazingpro.js')
const fs_extra_1 = __importDefault(require("fs-extra"));
const LeaderboardDataService = __importStar(require("./LeaderboardDataService"));
const { registerClass } = APJS;
let LeaderboardDataStore = LeaderboardDataStore_1 = class LeaderboardDataStore {
    constructor() {
        this.userProfile_Data = {};
        this.userInfo_Data = {};
        this.effectInfo_Data = {};
        this.leaderboard_Data = {};
        this.leaderboardReady = false;
        this.networkFailure = 0;
        this.LBSystem = null;
        this.networkResponse = {};
        this.hasScore = false;
        this.bestScore = 0;
        this.currentScore = 'null';
        this.profileImageReady = false;
        this.friends_rank = -1;
        this.national_rank = -1;
        this.global_rank = -1;
        this.currentRank_friends = -1;
        this.currentRank_national = -1;
        this.currentRank_global = -1;
        this.friends_leaderboard = {};
        this.national_leaderboard = {};
        this.global_leaderboard = {};
        this.friends_leaderboard_minusBest = new Array(6).fill(null);
        this.national_leaderboard_minusBest = new Array(6).fill(null);
        this.global_leaderboard_minusBest = new Array(6).fill(null);
        this.has_overall_friends_scores = false;
        this.has_overall_national_scores = false;
        this.has_overall_global_scores = false;
        this.overall_friends_scores = {};
        this.overall_national_scores = {};
        this.overall_global_scores = {};
        this.standardFriends = {};
        this.standardFriendCount = -1;
        this.standardFriendsListReady = false;
        this.scoreSet = false;
        this.imageMap = {};
        this.defaultIcon = {};
        this.leaderboardOrder = 0;
        this.apk = '';
        this.lockerVersion = '';
        this.downloadIndex = 0;
    }
    static get instance() {
        if (!this._instance) {
            this._instance = new LeaderboardDataStore_1();
        }
        return this._instance;
    }
    setLeaderboardOrder(value) {
        this.leaderboardOrder = value;
    }
    postScore() {
        this.LBSystem.postScore();
    }
    setScore(newScore) {
        this.scoreSet = true;
        if (newScore !== this.currentScore) {
            this.currentScore = newScore;
            this.LBSystem.UpdateCurrentRanking();
        }
    }
    getOtherRank(otherScore, leaderboardType) {
        return this.LBSystem.getOtherRanking(otherScore, leaderboardType);
    }
    getBestURL(ius, trimURL) {
        // Check for a JPEG image and use that if it exists
        for (let i = ius.length - 1; i >= 0; --i) {
            const url = ius[i];
            if (url.indexOf('.jpeg') !== -1) {
                console.log('processFriendsListInformation jpeg url: ' + url);
                return trimURL ? url.substring(0, url.indexOf('.jpeg')) + '.jpeg' : url;
            }
        }
        // Check for a WEBP image and use that if it exists
        for (let i = ius.length - 1; i >= 0; --i) {
            const url = ius[i];
            if (url.indexOf('.webp') !== -1) {
                console.log('processFriendsListInformation webp url: ' + url);
                return trimURL ? url.substring(0, url.indexOf('.webp')) + '.webp' : url;
            }
        }
        // If neither JPEG nor WEBP image is found, use the default icon
        return null;
    }
    getImageAsync(iconUrl, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            let returnIcon;
            if (this.defaultIcon) {
                returnIcon = this.defaultIcon;
            }
            if (!iconUrl) {
                return returnIcon;
            }
            if (this.imageMap[iconUrl]) {
                returnIcon = this.imageMap[iconUrl];
                if (callback !== null) {
                    callback(returnIcon);
                }
                return returnIcon;
            }
            else {
                return this.downloadImageAsync(iconUrl, callback);
            }
        });
    }
    downloadImageAsync(iconUrl, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const downloadRequest = new LeaderboardDataService.LBDownloadRequest(iconUrl);
            const path = yield LeaderboardDataService.LBRequestHandler.instance.sendRequest(downloadRequest, this.LBSystem.scene, 5000);
            let valid = false;
            if (typeof path === 'string' && path.endsWith('.webp'))
                valid = true;
            if (path && path !== null && typeof path === 'string' && valid) {
                return this.successfulClientRequest(path, callback, iconUrl);
            }
            else {
                return this.networkRequestAttempt(iconUrl, callback);
            }
        });
    }
    networkRequestAttempt(iconUrl, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            // Note: These classes would need to be imported or defined elsewhere
            const response = yield LeaderboardDataService.LBNetworkHandler.instance.sendRequest(new LeaderboardDataService.LBDownloadImageRequest(iconUrl));
            let returnIcon;
            if (response.binaryBody) {
                const filepath = `${this.LBSystem.scene.assetMgr.rootDir}friendprofile${this.downloadIndex}.webp`;
                this.downloadIndex = this.downloadIndex + 1;
                const databuf = effect.Amaz.AmazingUtil.getArrayBuffer(response.binaryBody);
                fs_extra_1.default.writeFileSync(filepath, new Uint8Array(databuf !== null && databuf !== void 0 ? databuf : new ArrayBuffer(0)));
                const pngMeta = new effect.Amaz.PngMeta();
                pngMeta.needFlipY = true;
                pngMeta.innerAlphaPremul = false;
                pngMeta.outerAlphaPremul = false;
                this.imageMap[iconUrl] = this.LBSystem.scene.assetMgr.SyncLoadWithMeta(filepath, pngMeta);
                returnIcon = this.imageMap[iconUrl];
                if (callback)
                    callback(returnIcon);
                return returnIcon;
            }
            return returnIcon;
        });
    }
    successfulClientRequest(path, callback, iconUrl) {
        const iconPath = path;
        const pngMeta = new effect.Amaz.PngMeta();
        pngMeta.needFlipY = true;
        pngMeta.innerAlphaPremul = false;
        pngMeta.outerAlphaPremul = false;
        this.imageMap[iconUrl] = this.LBSystem.scene.assetMgr.SyncLoadWithMeta(iconPath, pngMeta);
        const returnIcon = this.imageMap[iconUrl];
        if (callback)
            callback(returnIcon);
        return returnIcon;
    }
    getImage(iconUrl, callback) {
        let returnIcon;
        if (this.defaultIcon) {
            returnIcon = this.defaultIcon;
        }
        if (iconUrl) {
            if (this.imageMap[iconUrl]) {
                returnIcon = this.imageMap[iconUrl];
                if (callback !== null) {
                    callback(returnIcon);
                }
                return returnIcon;
            }
            else {
                // Note: These classes would need to be imported or defined elsewhere
                const downloadRequest = new LeaderboardDataService.LBDownloadRequest(iconUrl);
                LeaderboardDataService.LBRequestHandler.instance
                    .sendRequest(downloadRequest, this.LBSystem.scene, 5000)
                    .then((path) => {
                    const iconPath = path;
                    if (!iconPath) {
                        return returnIcon;
                    }
                    const pngMeta = new effect.Amaz.PngMeta();
                    pngMeta.needFlipY = true;
                    pngMeta.innerAlphaPremul = false;
                    pngMeta.outerAlphaPremul = false;
                    this.imageMap[iconUrl] = this.LBSystem.scene.assetMgr.SyncLoadWithMeta(iconPath, pngMeta);
                    returnIcon = this.imageMap[iconUrl];
                    return returnIcon;
                }, (err) => {
                    console.error(`Failed to download file: ${iconUrl}, reason: ${err && err.message}`);
                    return returnIcon;
                })
                    .then((path) => {
                    if (callback !== null) {
                        callback(this.imageMap[iconUrl]);
                    }
                });
            }
        }
        return returnIcon;
    }
};
LeaderboardDataStore = LeaderboardDataStore_1 = __decorate([
    registerClass()
], LeaderboardDataStore);
exports.LeaderboardDataStore = LeaderboardDataStore;
//# sourceMappingURL=LeaderboardDataStore.js.map