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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Leaderboard = exports.LeaderBoardBuiltInAsset = exports.defaultFont = exports.TextFonts = void 0;
const APJS = require('../amazingpro.js')
const LeaderboardDataService = __importStar(require("./LeaderboardDataService"));
const LeaderboardDataStore_1 = require("./LeaderboardDataStore");
const Forge = __importStar(require("../forge.min.js"));
const FriendUtils_1 = require("./FriendUtils");
const { registerClass, systemList, serialize, userPublicAPI, userPrivateAPI, EnterInternalScope, QuitInternalScope, hideAPIPrototype, } = APJS;
const LBSDS = LeaderboardDataStore_1.LeaderboardDataStore.instance;
// Constants from original JavaScript
const NO_RANKING = -1;
const RANKING_EXCEEDS_LIMIT = -2;
const maxRankingNum = {
    1: 100,
    2: 999,
    3: 999,
};
var SortingType;
(function (SortingType) {
    SortingType[SortingType["HIGH_TO_LOW"] = 0] = "HIGH_TO_LOW";
    SortingType[SortingType["LOW_TO_HIGH"] = 1] = "LOW_TO_HIGH";
})(SortingType || (SortingType = {}));
// Constants
const RootEntityName = 'GameRankingListRoot';
// Demo Data for Placeholders
const demoData = [
    {
        v: 10000,
        cu: false,
        un: 'NetName1',
        r: 1, // ranking
    },
    {
        v: 9000,
        cu: false,
        un: 'NetName2',
        r: 2,
    },
    {
        v: 8000,
        cu: false,
        un: 'NetName3',
        r: 3,
    },
    {
        v: 7000,
        cu: false,
        un: 'NetName4',
        r: 4,
    },
    {
        v: 6000,
        cu: true,
        un: 'NetName5',
        r: 5,
    },
    {
        v: 5000,
        cu: false,
        un: 'NetName6',
        r: 6,
    },
];
var HAlign;
(function (HAlign) {
    HAlign[HAlign["LEFT"] = 0] = "LEFT";
    HAlign[HAlign["CENTER"] = 1] = "CENTER";
    HAlign[HAlign["RIGHT"] = 2] = "RIGHT";
})(HAlign || (HAlign = {}));
var HRef;
(function (HRef) {
    HRef[HRef["LEFT"] = 0] = "LEFT";
    HRef[HRef["CENTER"] = 1] = "CENTER";
    HRef[HRef["RIGHT"] = 2] = "RIGHT";
})(HRef || (HRef = {}));
const parentWidth = 335;
const parentHeight = 357;
// Color constants
const normalTextColor = new effect.Amaz.Color(0.404, 0.404, 0.404, 1);
const hightlightedTextColor = new effect.Amaz.Color(0, 0, 0, 1);
const whiteTextColor = new effect.Amaz.Color(1, 1, 1, 1);
// Utility functions
function pxToRefRatio(px, ref) {
    return px / ref;
}
function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}
function textRectPxToRealPx(px) {
    return px * (72 / 300) /* to pt */ * (72 / 300) /* to real px */;
}
var RankingType;
(function (RankingType) {
    RankingType[RankingType["FRIEND"] = 1] = "FRIEND";
    RankingType[RankingType["NATIONAL"] = 2] = "NATIONAL";
    RankingType[RankingType["GLOBAL"] = 3] = "GLOBAL";
})(RankingType || (RankingType = {}));
var TextFonts;
(function (TextFonts) {
    TextFonts["DisplayBlack"] = "TikTokSansDisplay-Black.ttf";
    TextFonts["Classic"] = "Classic.ttf";
    TextFonts["Elegance"] = "Elegance.ttf";
    TextFonts["Vintage"] = "Vintage.ttf";
    TextFonts["ComicSans"] = "ComicSans.ttf";
    TextFonts["Serif"] = "Serif.ttf";
    TextFonts["Freehand"] = "Freehand.ttf";
    TextFonts["Luxury"] = "Luxury.ttf";
})(TextFonts = exports.TextFonts || (exports.TextFonts = {}));
exports.defaultFont = TextFonts.DisplayBlack;
exports.LeaderBoardBuiltInAsset = {
    //https://bytedance.feishu.cn/sheets/shtcncUpBTr8Tt7lpQd0Bx6Bw6g
    //To avoid using same asset key or id in different Orion branches(OrionEditor/TTEH),
    //please visit this URL make sure your id is unique and fill in the form with yourid.
    //Duplicated cells' background will be red
    Thumbnail_Material: {
        guid: '00000000-0000-0000-0000-000020004001',
        path: './material/Thumbnail_Material.omtl',
        name: 'asset_game_ranking_list_thumbnail_material',
        nameKey: 'asset_game_ranking_list_thumbnail_material',
    },
    ImageDefaultMaterial: {
        guid: '00000000-0000-0000-0000-f00000000132',
        path: './material/Image_Default_Material.omtl',
        name: 'asset_omtl_image',
        nameKey: 'asset_omtl_image',
    },
    SceneEditMaterial: {
        guid: '00000000-0000-0000-0000-f00000000133',
        path: './material/Scene_Edit_Material.omtl',
        name: 'asset_omtl_image',
        nameKey: 'asset_omtl_image',
    },
    DefaultIcon: {
        guid: '00000000-0000-0000-0000-000000004007',
        path: './image/iconCircle1.png',
        name: 'iconCircle1',
        nameKey: 'iconCircle1',
    },
};
let leaderboardIdCounter = 0;
let Leaderboard = class Leaderboard extends APJS.DynamicComponent {
    constructor(rtti) {
        EnterInternalScope();
        super(rtti);
        // =================serialized props begin=================
        this.scene = null;
        this.rankingType = 0;
        this.LeaderboardJSVersion = 1;
        this.sortingType = SortingType.HIGH_TO_LOW;
        this.autoSortingOrder = true;
        this.sortingOrderCount = 0;
        this.nationalRankingText = '';
        this.globalRankingText = '';
        this.friendRankingText = '';
        this.imageRendererMaterial = null;
        this.thumbnailMaterial = null;
        this.highlight1 = null;
        this.highlight2 = null;
        this.highlight3 = null;
        this.iconCircle1 = null;
        this.iconCircle2 = null;
        this.iconCircle3 = null;
        this.iconCircleGray = null;
        this.starsGold = null;
        this.starsSilver = null;
        this.starsBronze = null;
        this.Crown1combine = null;
        this.Crown2combine = null;
        this.Crown3combine = null;
        this.messageNoFriends = '';
        this.messageNotEnoughFriends = '';
        this.errorMessageCantConnect = '';
        this.errorMessageUnderage = '';
        this.MAX_V = 500000000000; // 500B
        this.un = ''; // username
        this.iu = ''; // icon url
        this.userId = '';
        this.leaderboardSortingOrder = 0;
        this.safeMode = 0;
        this.leaderboardId = 0;
        this.camera = null;
        this.leaderboardScreenVisible = false;
        this.friendUtils = new FriendUtils_1.FriendUtils();
        this.name = 'Leaderboard';
        this.frame = 0;
        this.effectId = -1;
        this.v = 0; // score
        this.lastV = 0;
        this.vd = false;
        this.hs = 0; // high score
        this.apk = '';
        this.lockerVersion = null;
        this.fc = -1; // friend count
        this.fetchDataDone = false;
        this.uiInitialized = false;
        this.uiUpdateQueue = [];
        this.needsRefresh = false;
        this.ranking = NO_RANKING;
        this.hasV = false;
        this.v6 = null;
        this.sendScore = false;
        this.lastSendScore = false;
        this.sendScoreFromAPI = false;
        this.boardList = [];
        this.usingDemoData = false;
        this.boardListInit = [];
        this.iconEntityList = [];
        this.userNameEntityList = [];
        this.hightlightEntityList = [];
        this.crownEntityList = [];
        this.otherRankingInfoMap = new Map();
        this.otherRankingInfoMap.set(RankingType.FRIEND, {});
        this.otherRankingInfoMap.set(RankingType.NATIONAL, {});
        this.otherRankingInfoMap.set(RankingType.GLOBAL, {});
        this.boardTran2D = null;
        this.boardInitHeight = 1;
        this.boardLastHeight = 1;
        this.boardTextTransList = [];
        this.builtinFonts = {
            DisplayBlack: 'font/TikTokSansDisplay-Black.ttf',
            DisplayBold: 'font/TikTokSansDisplay-Bold.ttf',
            TextRegular: 'font/TikTokSansText-Regular.ttf',
            TextMedium: 'font/TikTokSansText-Medium.ttf',
            TextBold: 'font/TikTokSansText-Bold.ttf',
        };
        this.titleColor = new APJS.Color(1, 1, 1, 1);
        this.leaderboardFailure = false;
        this.leaderboardRead = false;
        this.leaderboardImagesRequested = false;
        this.timeStampText = '';
        this.unionEmpty = null;
        this.union = null;
        this.titleFont = exports.defaultFont;
        this.colorFolder = '';
        QuitInternalScope();
        this.leaderboardId = leaderboardIdCounter++;
    }
    onStart() {
        if (!LBSDS.LBSystem.isRecordingVideo) {
            this.leaderboardScreenVisible = false;
        }
    }
    downloadIcons() {
        this.boardList.forEach((boardEntry, idx) => {
            boardEntry.icon = this.iconCircle1;
            if (boardEntry.cu && this.icon) {
                boardEntry.icon = this.icon;
            }
            if (boardEntry.iconUrl) {
                if (!LBSDS.imageMap[boardEntry.iconUrl]) {
                    this.downloadIcon(boardEntry, idx);
                }
                else {
                    boardEntry.icon = LBSDS.getImage(boardEntry.iconUrl, null);
                    this.addUiUpdateTask(this.updateIcon, idx);
                }
            }
        });
    }
    reuseIcon(boardEntry, idx) {
        boardEntry.icon = LBSDS.getImage(boardEntry.iconUrl, null);
        this.addUiUpdateTask(this.updateIcon, idx);
    }
    downloadIcon(boardEntry, idx) {
        var _a;
        const downloadRequest = new LeaderboardDataService.LBDownloadRequest(boardEntry.iconUrl);
        const nativeScene = (_a = this.scene) === null || _a === void 0 ? void 0 : _a.getNative();
        if (!nativeScene) {
            console.error(`Failed to download file: ${boardEntry.iconUrl}, reason: scene is null`);
            return;
        }
        LeaderboardDataService.LBRequestHandler.instance.sendRequest(downloadRequest, nativeScene, 5000).then((path) => {
            boardEntry.iconPath = path;
            const pngMeta = new effect.Amaz.PngMeta();
            pngMeta.needFlipY = true;
            pngMeta.innerAlphaPremul = false;
            pngMeta.outerAlphaPremul = false;
            boardEntry.icon = nativeScene.assetMgr.SyncLoadWithMeta(boardEntry.iconPath, pngMeta);
            LBSDS.imageMap[boardEntry.iconUrl] = boardEntry.icon;
            this.addUiUpdateTask(this.updateIcon, idx);
        }, (err) => {
            console.error(`Failed to download file: ${boardEntry.iconUrl}, reason: ${err && err.message}`);
        });
    }
    addUiUpdateTask(task, ...args) {
        const boundFn = task.bind(this, ...args);
        if (this.uiInitialized) {
            boundFn();
        }
        else {
            this.uiUpdateQueue.push(boundFn);
        }
    }
    updateIcon(idx) {
        const boardEntry = this.boardList[idx];
        if (boardEntry.icon && this.iconEntityList.length > idx) {
            const imageRenderer = this.iconEntityList[idx].getComponent('ImageRenderer');
            imageRenderer.material.setTex('_MainTex', boardEntry.icon);
            imageRenderer.texture = boardEntry.icon;
            this.iconEntityList[idx].visible = true;
            if (this.crownEntityList.length > idx) {
                this.crownEntityList[idx].visible = true;
            }
        }
    }
    // Keep 5 digits after decimal
    cutV5(number) {
        const numStr = number.toString();
        const decimalIndex = numStr.indexOf('.');
        if (decimalIndex === -1 || numStr.length - decimalIndex <= 6) {
            return number;
        }
        return parseFloat(numStr.slice(0, decimalIndex + 6));
    }
    // format the score
    vDis(num) {
        const isNeg = num < 0;
        num = Math.abs(num);
        let formattedNum;
        if (num > this.MAX_V) {
            formattedNum = '500B+';
        }
        else if (num >= 1e9) {
            // Check for billions
            formattedNum = this.cutV5(num / 1e9) + 'B';
        }
        else if (num >= 1e6) {
            // Check for millions
            formattedNum = this.cutV5(num / 1e6) + 'M';
        }
        else if (num >= 1e3) {
            // Check for thousands
            formattedNum = this.cutV5(num / 1e3) + 'K';
        }
        else {
            formattedNum = this.cutV5(num) + '';
        }
        // Trim any trailing zeros after the decimal point
        return isNeg ? '-' + formattedNum : formattedNum;
    }
    refreshUI() {
        const nonTopData = this.processAllBoardEntries();
        this.processNonTopEntries(nonTopData);
        this.showUIElements();
    }
    processAllBoardEntries() {
        const nonTopRanking = [];
        const nonTopName = [];
        const nonTopScore = [];
        let currentUserEntry = 0;
        for (let i = 0; i < this.boardList.length; i++) {
            const boardEntry = this.boardList[i];
            if (boardEntry.cu)
                currentUserEntry = i;
            this.processIconForEntry(boardEntry, i);
            this.processHighlightForEntry(boardEntry, i);
            const userName = this.getFormattedUserName(boardEntry.un);
            const formattedScore = this.vDis(boardEntry.v);
            if (i < 3) {
                this.processTop3Entry(i, userName, formattedScore, boardEntry.cu);
            }
            else {
                nonTopRanking.push(this.obtainRankingText(boardEntry.r));
                nonTopName.push(userName || '');
                nonTopScore.push(formattedScore);
            }
        }
        return {
            ranking: nonTopRanking,
            names: nonTopName,
            scores: nonTopScore,
            currentUserEntry,
        };
    }
    processIconForEntry(boardEntry, index) {
        if (boardEntry.icon && this.iconEntityList.length > index) {
            const imageRenderer = this.iconEntityList[index].getComponent('ImageRenderer');
            imageRenderer.material.setTex('_MainTex', boardEntry.icon);
            imageRenderer.texture = boardEntry.icon;
            this.iconEntityList[index].visible = true;
            if (this.crownEntityList.length > index) {
                this.crownEntityList[index].visible = true;
            }
        }
    }
    processHighlightForEntry(boardEntry, index) {
        if (this.hightlightEntityList.length > index) {
            this.hightlightEntityList[index].forEach((entity) => {
                entity.visible = boardEntry.cu;
            });
        }
    }
    getFormattedUserName(username) {
        if (!this.rankingTextMerge) {
            return '';
        }
        const textcomp = this.rankingTextMerge.getComponent('Text');
        const maxLength = 10;
        this.updateTextStr(textcomp, username, maxLength);
        return textcomp.str;
    }
    processTop3Entry(index, userName, formattedScore, isCurrentUser) {
        const textComp = this.userNameEntityList[index].getComponent('Text');
        textComp.str = userName + '\n' + formattedScore;
        textComp.typeSettingParam.lineSpacing = 0.53;
        textComp.activeTextStyle.letterColorRGBA = isCurrentUser ? hightlightedTextColor : normalTextColor;
    }
    processNonTopEntries(data) {
        this.rankingTextMerge &&
            this.processNonTopTextComponent(this.rankingTextMerge.getComponent('Text'), data.ranking, data.currentUserEntry);
        this.nameTextMerge &&
            this.processNonTopTextComponent(this.nameTextMerge.getComponent('Text'), data.names, data.currentUserEntry);
        this.scoreTextMerge &&
            this.processNonTopTextComponent(this.scoreTextMerge.getComponent('Text'), data.scores, data.currentUserEntry);
    }
    processNonTopTextComponent(textcomp, strlist, currentUserEntry) {
        const strContent = strlist.join('\n');
        textcomp.str = strContent;
        textcomp.forceTypeSetting();
        textcomp.typeSettingParam.lineSpacing = 2.0;
        textcomp.activeTextStyle.letterColorRGBA = whiteTextColor;
        this.updateLetterColors(textcomp, currentUserEntry);
        this.updateTextContainerPosition(textcomp, strlist.length);
    }
    updateLetterColors(textcomp, currentUserEntry) {
        const letters = textcomp.letters;
        for (let i = 0; i < letters.size(); ++i) {
            const letter = letters.get(i);
            if (letter.rowth + 3 === currentUserEntry) {
                letter.instanceColor = hightlightedTextColor;
            }
            else {
                letter.instanceColor = normalTextColor;
            }
        }
    }
    updateTextContainerPosition(textcomp, listLength) {
        const updateContainerPos = (textEnt, top, height, parentHeight) => {
            const trans = textEnt.getComponent('ScreenTransform')
                .parent;
            if (!trans) {
                return;
            }
            const leftRatio = trans.anchors.x;
            const rightRatio = trans.anchors.y;
            const bottomRatio = pxToRefRatio(parentHeight - top - height, parentHeight);
            const topRatio = pxToRefRatio(parentHeight - top, parentHeight);
            trans.anchors = new effect.Amaz.Vector4f(leftRatio, rightRatio, bottomRatio, topRatio);
        };
        switch (listLength) {
            case 1:
                updateContainerPos(textcomp.entity, 214, 18, parentHeight);
                break;
            case 2:
                updateContainerPos(textcomp.entity, 214, 18 + 43, parentHeight);
                break;
            case 3:
                updateContainerPos(textcomp.entity, 214, 18 + 43 * 2, parentHeight);
                break;
            default:
                break;
        }
    }
    showUIElements() {
        if (!this.titleText || !this.backgroundEntity) {
            return;
        }
        this.backgroundEntity.visible = true;
        const titleTrans = this.titleText.getComponent('ScreenTransform');
        titleTrans.parent.entity.visible = true;
        this.titleText.visible = true;
    }
    adjustPosAndSize(trans, left, top, width, height, parentWidth, parentHeight) {
        trans.sizeDelta = new effect.Amaz.Vector2f(0, 0);
        const leftRatio = left / parentWidth;
        const rightRatio = (left + width) / parentWidth;
        const bottomRatio = (parentHeight - top - height) / parentHeight;
        const topRatio = (parentHeight - top) / parentHeight;
        trans.anchors = new effect.Amaz.Vector4f(leftRatio, rightRatio, bottomRatio, topRatio);
    }
    updateTextStr(textComp, text, maxStrLength) {
        text = text || ' ';
        textComp.str = text;
        textComp.forceTypeSetting();
        if (maxStrLength && textComp.letters.size() > maxStrLength) {
            let str = '';
            for (let i = 1; i <= maxStrLength; i++) {
                str = str + textComp.letters.get(i - 1).utf8;
            }
            str = str + '...';
            textComp.str = ''; // XXX: new text system have bug when directly modify str, this line can be removed after future sdk fixes.
            textComp.str = str;
        }
    }
    resetIcons() {
        if (this.usingDemoData === true) {
            for (let i = 0; i < this.boardList.length; i++) {
                this.boardList[i].icon = this['demoIcon' + (i + 1)];
            }
        }
        else {
            this.boardList.forEach((boardEntry, idx) => {
                boardEntry.icon = this.iconCircle1;
                if (boardEntry.iconUrl && LBSDS.imageMap[boardEntry.iconUrl]) {
                    boardEntry.icon = LBSDS.imageMap[boardEntry.iconUrl];
                }
                if (boardEntry.cu && this.icon) {
                    boardEntry.icon = this.icon;
                }
                this.addUiUpdateTask(this.updateIcon, idx);
            });
        }
    }
    handleNetworkResult(networkResponse) {
        const result = {};
        const success = networkResponse.succeed;
        result.response = networkResponse;
        if (success) {
            const statusCode = networkResponse.statusCode;
            if (statusCode < 200 || statusCode > 299) {
                this.addUiUpdateTask(this.displayErrorMessage, this.errorMessageCantConnect, 0);
            }
            else {
                result.body = networkResponse.body;
                this.onNetworkResponseSuccess(result);
            }
        }
        else {
            result.error = networkResponse.errorDesc;
            this.addUiUpdateTask(this.displayErrorMessage, this.errorMessageCantConnect, 0);
        }
        result.success = success;
    }
    onNetworkResponseSuccess(response) {
        try {
            const obj = JSON.parse(response.body);
            const statusCode = obj.status_code;
            response.status_code = statusCode;
            this.fetchDataDone = true;
            if (statusCode === 0 && obj.leaderboards) {
                obj.leaderboards.forEach((leaderboard) => {
                    const boardType = leaderboard.leaderboard_type;
                    const self_rank = leaderboard.self_rank;
                    const ranking = self_rank.has_score ? (self_rank.rank ? self_rank.rank : RANKING_EXCEEDS_LIMIT) : NO_RANKING;
                    this.hasV = self_rank.has_score;
                    const sc = leaderboard.self_rank.score; // selfScore
                    this.hs = sc;
                    if (boardType === this.rankingType) {
                        this.ranking = ranking;
                        this.boardList = [];
                        let topNumber = 6;
                        if (ranking <= 6 && ranking !== RANKING_EXCEEDS_LIMIT) {
                            topNumber = 6;
                        }
                        else {
                            const currentUser = {};
                            currentUser.un = this.un;
                            currentUser.v = sc;
                            currentUser.cu = true;
                            currentUser.r = ranking;
                            currentUser.iu = this.iu;
                            if (ranking !== RANKING_EXCEEDS_LIMIT) {
                                topNumber = 3;
                                const prevUser = {};
                                const prevEntry = leaderboard.predecessor_entry;
                                if (prevEntry) {
                                    prevUser.un = prevEntry.username;
                                    prevUser.v = prevEntry.score;
                                    prevUser.cu = false;
                                    prevUser.r = ranking - 1;
                                    const ius = prevEntry.icon_url.url_list;
                                    prevUser.iu = LBSDS.getBestURL(ius, false);
                                    this.boardList[3] = prevUser;
                                }
                                this.boardList[4] = currentUser;
                                const nextUser = {};
                                const nextEntry = leaderboard.successor_entry;
                                if (nextEntry) {
                                    nextUser.un = nextEntry.username;
                                    nextUser.v = nextEntry.score;
                                    nextUser.cu = false;
                                    nextUser.r = ranking + 1;
                                    const ius = nextEntry.icon_url.url_list;
                                    nextUser.iu = LBSDS.getBestURL(ius, false);
                                    this.boardList[5] = nextUser;
                                }
                            }
                            else {
                                topNumber = 5;
                                this.boardList[5] = currentUser;
                            }
                        }
                        const leaderboardData = leaderboard.leaderboard;
                        if (!leaderboardData) {
                            return;
                        }
                        leaderboardData.forEach((boardEntry, index) => {
                            if (index >= topNumber) {
                                return;
                            }
                            const singleUser = {};
                            singleUser.un = boardEntry.username;
                            singleUser.v = boardEntry.score;
                            singleUser.cu = boardEntry.uid_str === this.userId;
                            singleUser.r = index + 1;
                            singleUser.uid = boardEntry.uid_str;
                            const ius = boardEntry.icon_url.url_list;
                            singleUser.iconUrl = LBSDS.getBestURL(ius, false);
                            this.boardList[index] = singleUser;
                        });
                    }
                    else {
                        if (boardType > 0 && boardType <= 3) {
                            const otherRanking = this.otherRankingInfoMap.get(boardType);
                            if (otherRanking) {
                                otherRanking.ranking = ranking;
                            }
                        }
                    }
                });
                if (!this.hasV) {
                    if (this.boardList.length < 6) {
                        this.boardList.push({
                            v: this.v,
                            cu: true,
                            un: this.un,
                            icon: this.icon,
                            r: this.boardList.length + 1,
                        });
                    }
                    else {
                        this.v6 = this.boardList[5].v;
                        this.boardList[5] = {
                            v: this.v,
                            cu: true,
                            un: this.un,
                            icon: this.icon,
                            r: RANKING_EXCEEDS_LIMIT,
                        };
                    }
                }
                this.boardListInit = JSON.parse(JSON.stringify(this.boardList));
                if (this.boardList.length < 6 && this.ranking < 6) {
                    const pos = Math.max(0, this.boardList.length - 3);
                    const message = LBSDS.standardFriendCount >= 0 && LBSDS.standardFriendCount < 6
                        ? this.messageNoFriends
                        : this.messageNotEnoughFriends;
                    this.addUiUpdateTask(this.displayErrorMessage, message, pos);
                }
                this.downloadIcons();
                this.updateCurrentTimeString();
                this.requireUIRefresh();
            }
            else {
                this.addUiUpdateTask(this.displayErrorMessage, this.errorMessageCantConnect, 0);
            }
        }
        catch (e) {
            console.error('Error parsing the network response:', e.message);
            this.addUiUpdateTask(this.displayErrorMessage, this.errorMessageCantConnect, 0);
        }
    }
    updateCurrentTimeString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const milliseconds = now.getMilliseconds().toString().padStart(3, '0'); // Ensure 3 digits for milliseconds
        const offset = now.getTimezoneOffset();
        const hourOffset = Math.floor(offset / 60);
        const minuteOffset = offset % 60;
        const timezoneOffset = `UTC${offset < 0 ? '+' : '-'}${Math.abs(hourOffset).toString().padStart(2, '0')}:${Math.abs(minuteOffset)
            .toString()
            .padStart(2, '0')}`;
        this.timeStampText = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}:${milliseconds}(${timezoneOffset})`;
    }
    displayErrorMessage(message, position) {
        const parentWidth = 335;
        const parentHeight = 357;
        const BackgroundType = {
            EMPTY: 0,
            SHORT: 1,
            NORMAL: 2,
        };
        let bgTexture = null;
        let bgHeight = 0;
        switch (position) {
            case BackgroundType.EMPTY:
                bgTexture = this.unionEmpty;
                bgHeight = 272;
                break;
            case BackgroundType.SHORT:
                bgTexture = this.union;
                bgHeight = 303;
                break;
            case BackgroundType.NORMAL:
                bgTexture = this.union;
                bgHeight = 303;
        }
        if (bgTexture && this.backgroundEntity) {
            const imageRenderer = this.backgroundEntity.getComponent('ImageRenderer');
            imageRenderer.material.setTex('_MainTex', bgTexture);
            imageRenderer.texture = bgTexture;
            this.adjustPosAndSize(this.backgroundEntity.getComponent('ScreenTransform'), 0, 54, 335, bgHeight, parentWidth, parentHeight);
            if (this.boardList.length === 0 && this.un) {
                this.boardList.push({
                    cu: true,
                    un: this.un,
                    icon: this.icon,
                    r: 1,
                });
                this.requireUIRefresh();
            }
        }
        if (this.errorEntity) {
            const textComp = this.errorEntity.getComponent('Text');
            this.updateTextStr(textComp, message);
            const parentTrans = this.errorEntity.getComponent('ScreenTransform')
                .parent;
            if (parentTrans) {
                parentTrans.entity.visible = true;
                this.errorEntity.visible = true;
                this.adjustPosAndSize(parentTrans, 0, 210 + position * 43, 335, 36, parentWidth, parentHeight);
            }
        }
    }
    requireUIRefresh() {
        if (this.uiInitialized) {
            this.refreshUI();
        }
        else {
            this.needsRefresh = true;
        }
    }
    // Compare scores based on sorting type
    compareScore(v1, v2) {
        if (v1 === v2) {
            return 0;
        }
        return this.sortingType === SortingType.HIGH_TO_LOW ? v1 - v2 : v2 - v1;
    }
    // Update user score and reorder board if necessary
    updateUserScore(newScore) {
        const userIndex = this.findCurrentUserIndex();
        if (userIndex === -1)
            return;
        const boardEntry = this.boardList[userIndex];
        if (newScore === boardEntry.v)
            return;
        this.updateRankingIfNeeded(boardEntry, newScore);
        boardEntry.v = newScore;
        const direction = this.calculateSortDirection(userIndex, newScore);
        if (direction !== 0) {
            this.reorderBoardList(userIndex, direction);
        }
        this.requireUIRefresh();
    }
    findCurrentUserIndex() {
        return this.boardList.findIndex(entry => entry.cu);
    }
    updateRankingIfNeeded(boardEntry, newScore) {
        if (this.v6 !== null && boardEntry.r === RANKING_EXCEEDS_LIMIT && this.compareScore(newScore, this.v6) >= 0) {
            boardEntry.r = 6;
        }
    }
    calculateSortDirection(userIndex, newScore) {
        let direction = 0;
        if (userIndex > 0) {
            const prevScore = this.boardList[userIndex - 1].v;
            if (this.compareScore(newScore, prevScore) >= 0) {
                direction = -1;
            }
        }
        if (userIndex < this.boardList.length - 1) {
            const nextScore = this.boardList[userIndex + 1].v;
            if (this.compareScore(newScore, nextScore) <= 0) {
                direction = 1;
            }
        }
        return direction;
    }
    reorderBoardList(startIndex, direction) {
        const count = direction > 0 ? this.boardList.length - startIndex - 1 : startIndex;
        for (let j = 0; j < count; j++) {
            const idx0 = startIndex + j * direction;
            const idx1 = startIndex + (j + 1) * direction;
            if (!this.shouldSwapEntries(idx0, idx1, direction)) {
                break;
            }
            this.swapBoardEntries(idx0, idx1, direction);
        }
    }
    shouldSwapEntries(idx0, idx1, direction) {
        let greater = this.compareScore(this.boardList[idx0].v, this.boardList[idx1].v) >= 0;
        if (direction > 0) {
            greater = !greater;
        }
        return greater;
    }
    swapBoardEntries(idx0, idx1, direction) {
        const tempEntry = this.boardList[idx0];
        this.boardList[idx0] = this.boardList[idx1];
        this.boardList[idx1] = tempEntry;
        this.boardList[idx1].r = this.boardList[idx0].r;
        this.boardList[idx0].r = this.boardList[idx1].r - direction;
    }
    // Get ranking text based on ranking value and type
    obtainRankingText(ranking, rankingType = this.rankingType) {
        if (ranking === undefined || ranking === null) {
            return '-';
        }
        switch (ranking) {
            case NO_RANKING:
                return '-';
            case RANKING_EXCEEDS_LIMIT:
                return maxRankingNum[rankingType] + '+';
            default:
                return ranking.toString();
        }
    }
    // Get or create root entity for the leaderboard
    getOrCreateRootEntity() {
        const transform = this.getSceneObject().getComponent('Transform').getNative();
        const children = transform.children;
        let rootNativeEntity;
        for (let i = 0, len = children.size(); i < len; i++) {
            const curEntity = children.get(i);
            if (curEntity.name === RootEntityName) {
                console.log('reuse existing new root entity.');
                rootNativeEntity = curEntity;
                break;
            }
        }
        if (!rootNativeEntity && this.scene) {
            console.log('create new root entity');
            rootNativeEntity = this.scene.getNative().createEntity(RootEntityName);
            const rootTransform = rootNativeEntity.addComponent('ScreenTransform');
            transform.addTransform(rootTransform);
            rootTransform.anchors = new effect.Amaz.Vector4f(0, 1, 0, 1);
            rootTransform.sizeDelta = new effect.Amaz.Vector2f(0, 0);
        }
        return rootNativeEntity;
    }
    // Convert real pixels to size delta pixels
    realPxToSizeDeltaPx(realPx) {
        const obj = APJS.AmazingManager.getSingleton('BuiltinObject');
        const h = obj.getOutputTextureHeight();
        return (realPx * 1280) / h;
    }
    // Create container entity with positioning
    createContainerEntity(name, left, top, width, height, parent, parentWidth, parentHeight, visible = true) {
        if (!this.scene) {
            return undefined;
        }
        const entity = this.scene.getNative().createEntity(name);
        const trans = entity.addComponent('ScreenTransform');
        trans.sizeDelta = new effect.Amaz.Vector2f(0, 0);
        const leftRatio = pxToRefRatio(left, parentWidth);
        const rightRatio = pxToRefRatio(left + width, parentWidth);
        const bottomRatio = pxToRefRatio(parentHeight - top - height, parentHeight);
        const topRatio = pxToRefRatio(parentHeight - top, parentHeight);
        trans.anchors = new effect.Amaz.Vector4f(leftRatio, rightRatio, bottomRatio, topRatio);
        const parentTrans = parent.getComponent('Transform');
        parentTrans.addTransform(trans);
        entity.visible = visible;
        return entity;
    }
    // Create image entity with texture and positioning
    createImageEntity(name, tex, left, top, width, height, parent, parentWidth, parentHeight, visible = true, imageMaterial = null) {
        imageMaterial = imageMaterial || this.imageRendererMaterial;
        const entity = this.createContainerEntity(name, left, top, width, height, parent, parentWidth, parentHeight, visible);
        if (!entity || !tex) {
            return undefined;
        }
        const imageRenderer = entity.addComponent('ImageRenderer');
        if (imageMaterial) {
            imageRenderer.sharedMaterial = imageMaterial.getNative();
        }
        imageRenderer.stretchMode = effect.Amaz.ImageStretchMode.Stretch;
        if (tex instanceof APJS.Texture) {
            imageRenderer.material.setTex('_MainTex', tex.getNative());
            imageRenderer.texture = tex.getNative();
        }
        else {
            imageRenderer.material.setTex('_MainTex', tex);
            imageRenderer.texture = tex;
        }
        imageRenderer.sortingOrder = this.leaderboardSortingOrder;
        return entity;
    }
    // Find camera in parent hierarchy
    findCameraInParentRecursively() {
        const cameras = this.getCamera();
        if (cameras.length > 0) {
            return cameras[0].getNative();
        }
        else {
            return null;
        }
    }
    // Get all visible cameras that can see this entity
    getCamera() {
        var _a;
        const rets = [];
        const entities = (_a = this.scene) === null || _a === void 0 ? void 0 : _a.getAllSceneObjects();
        if (!entities) {
            return rets;
        }
        for (let i = 0; i < entities.length; i++) {
            const cams = entities[i].getComponents('Camera');
            for (let j = 0; j < cams.length; ++j) {
                const cam = cams[j];
                if (!cam.getSceneObject().enabled || !cam.isSceneObjectVisible(this.getSceneObject())) {
                    continue;
                }
                rets.push(cam);
            }
        }
        return rets;
    }
    // Get screen transform rectangle
    getScreenTransformRect(transform, camComp) {
        let parentRect = new effect.Amaz.Rect(-0.5625, -1.0, 1.125, 2.0);
        camComp = camComp || this.findCameraInParentRecursively();
        if (transform && transform.parent && transform.parent instanceof effect.Amaz.ScreenTransform) {
            parentRect = this.getScreenTransformRect(transform.parent, camComp);
        }
        else {
            if (!camComp) {
                console.warn('GameRankingList.getScreenTransformRect: no camComp found');
            }
            else {
                const obj = APJS.AmazingManager.getSingleton('BuiltinObject');
                const w = obj.getOutputTextureWidth();
                const h = obj.getOutputTextureHeight();
                const orthoScale = camComp.orthoScale;
                const ratioWH = w / h;
                parentRect.x = -ratioWH * orthoScale;
                parentRect.y = -orthoScale;
                parentRect.width = ratioWH * 2 * orthoScale;
                parentRect.height = 2 * orthoScale;
            }
        }
        if (!transform || !(transform instanceof effect.Amaz.ScreenTransform)) {
            return parentRect;
        }
        const ppu = transform.pixelsPerUnit;
        const unitSizeDeltaX = transform.sizeDelta.x / ppu;
        const unitSizeDeltaY = transform.sizeDelta.y / ppu;
        const parentAnchorsLeft = lerp(parentRect.x, parentRect.x + parentRect.width, transform.anchors.x);
        const parentAnchorsRight = lerp(parentRect.x, parentRect.x + parentRect.width, transform.anchors.y);
        const parentAnchorsBottom = lerp(parentRect.y, parentRect.y + parentRect.height, transform.anchors.z);
        const parentAnchorsTop = lerp(parentRect.y, parentRect.y + parentRect.height, transform.anchors.w);
        const width = parentAnchorsRight - parentAnchorsLeft + unitSizeDeltaX;
        const height = parentAnchorsTop - parentAnchorsBottom + unitSizeDeltaY;
        return new effect.Amaz.Rect(-width / 2, -height / 2, width, height);
    }
    // Get board scale for responsive sizing
    getBoardScale() {
        const transform = this.getSceneObject().getComponent('ScreenTransform').getNative();
        const parentRect = this.getScreenTransformRect(transform.parent);
        const ppu = transform.pixelsPerUnit;
        const sizeDeltaInRealPx = transform.sizeDelta.x / ppu;
        const originalSizeDelta = 359 / ppu;
        const left = lerp(parentRect.x, parentRect.x + parentRect.width, transform.anchors.x);
        const right = lerp(parentRect.x, parentRect.x + parentRect.width, transform.anchors.y);
        const width = right - left + sizeDeltaInRealPx;
        const scale = width / originalSizeDelta;
        return scale;
    }
    // Set word wrap width for text component
    setWordWrapWidth(textComp, scale, wrapWidth = -1) {
        const typeSettingParam = textComp.typeSettingParam;
        const defaultWrapWidth = wrapWidth < 0 ? typeSettingParam.wordWrapWidth : wrapWidth;
        typeSettingParam.wordWrapWidth = defaultWrapWidth * scale;
        typeSettingParam.typeSettingAlign = APJS.TypesettingAlign.CENTER;
        textComp.typeSettingParam = typeSettingParam;
    }
    // Convert real pixels to font size
    realPxToFontSize(px) {
        return (px * 300) / 72;
    }
    // Convert pixels to real pixels
    pxToRealPx(px) {
        const obj = APJS.AmazingManager.getSingleton('BuiltinObject');
        const textureWidth = obj.getOutputTextureWidth();
        return (px / 720) * textureWidth;
    }
    // Convert real pixels to engine units
    realPxToEngineUnit(px, camComp) {
        camComp = camComp || this.findCameraInParentRecursively();
        if (!camComp) {
            console.warn('GameRankingList.realPxToEngineUnit: no camComp found');
            return 0;
        }
        if (camComp.type !== effect.Amaz.CameraType.ORTHO) {
            console.warn('GameRankingList.realPxToEngineUnit: only orthogonal camera is supported');
            return 0;
        }
        const orthoScale = camComp.orthoScale;
        const textureHeight = APJS.AmazingManager.getSingleton('BuiltinObject').getOutputTextureHeight();
        return (px * orthoScale * 2) / textureHeight;
    }
    // Convert pixels to engine units
    pxToEngineUnit(px, camComp) {
        return this.realPxToEngineUnit(this.pxToRealPx(px), camComp);
    }
    // Adjust text position with horizontal alignment
    adjustTextWithAlignH(textComp, basePosInPx, baseRef, textHAlign) {
        const textRect = textComp.getCanvasCustomizedExpanded();
        const textTrans = textComp.entity.getComponent('ScreenTransform');
        const currentPosition = textTrans.localPosition;
        const parent = textComp.entity.getComponent('ScreenTransform').parent;
        const rootTransformRect = this.getScreenTransformRect(parent);
        const basePosX = this.pxToEngineUnit(basePosInPx);
        if (baseRef === HRef.CENTER) {
            currentPosition.x = basePosX;
        }
        else if (baseRef === HRef.LEFT) {
            currentPosition.x = rootTransformRect.x + basePosX;
        }
        else if (baseRef === HRef.RIGHT) {
            currentPosition.x = rootTransformRect.x + rootTransformRect.width - basePosX;
        }
        if (textHAlign === HAlign.LEFT) {
            const offsetInX = this.realPxToEngineUnit(textRectPxToRealPx(textRect.x));
            currentPosition.x -= offsetInX;
        }
        else if (textHAlign === HAlign.RIGHT) {
            const offsetInX = this.realPxToEngineUnit(textRectPxToRealPx(textRect.x + textRect.width));
            currentPosition.x -= offsetInX;
        }
        textTrans.localPosition = currentPosition;
    }
    // Create text entity with styling and positioning
    createTextEntity(name, text, fontSize, color, bold, left, top, width, height, parent, parentWidth, parentHeight, fontpath, visible = true, wordWrapWidth = -1) {
        const containerEntity = this.createContainerEntity(name + 'Container', left, top, width, height, parent, parentWidth, parentHeight, visible);
        if (!containerEntity || !this.scene) {
            return undefined;
        }
        const boardScale = this.getBoardScale();
        const textEntity = this.scene.getNative().createEntity(name);
        textEntity.visible = visible;
        const textTrans = textEntity.addComponent('ScreenTransform');
        this.boardTextTransList.push(textTrans);
        const textComp = textEntity.addComponent('Text');
        this.setWordWrapWidth(textComp, boardScale * this.pxToRealPx(1.0), wordWrapWidth);
        this.updateTextStr(textComp, text, undefined);
        textComp.activeTextStyle.letterColorRGBA = color;
        const builtInObj = APJS.AmazingManager.getSingleton('BuiltinObject');
        const w = builtInObj.getOutputTextureWidth();
        const h = builtInObj.getOutputTextureHeight();
        const ratioWH = w / h;
        textComp.activeTextStyle.fontSize =
            ((boardScale / ratioWH) * this.realPxToFontSize(this.pxToRealPx(fontSize))) / 1.78;
        if (bold > 0) {
            textComp.activeTextStyle.fontStyle = APJS.FontStyle.BOLD;
            textComp.activeTextStyle.boldValue = bold;
        }
        else {
            textComp.activeTextStyle.fontStyle = APJS.FontStyle.NORMAL;
            textComp.activeTextStyle.boldValue = 0;
        }
        textComp.activeTextStyle.fontfamily = fontpath;
        const textRenderer = textComp.getRenderer();
        textRenderer.sortingOrder = this.leaderboardSortingOrder + 1;
        textComp.forceTypeSetting();
        const parentTrans = containerEntity.getComponent('ScreenTransform');
        parentTrans.addTransform(textTrans);
        // adjust text position
        this.adjustTextWithAlignH(textComp, 0, HRef.CENTER, HAlign.CENTER);
        return textEntity;
    }
    findHighestSortingOrder() {
        let renderOrder = 0;
        if (!this.scene) {
            return renderOrder;
        }
        const entities = this.scene.getAllSceneObjects();
        for (let i = 0; i < entities.length; i++) {
            const renderer = entities[i].getNative().getComponent('Renderer');
            if (renderer && renderer instanceof effect.Amaz.Renderer && renderer.sortingOrder > renderOrder) {
                renderOrder = renderer.sortingOrder;
            }
        }
        return renderOrder;
    }
    // Lifecycle method: Initialize component
    onInit() {
        this.uiUpdateQueue = [];
        LBSDS.setLeaderboardOrder(this.sortingType);
        this.leaderboardSortingOrder = this.findHighestSortingOrder() + 1;
    }
    loadTexture(path) {
        const Amaz = effect.Amaz;
        if (this.scene && this.scene.getNative().assetMgr) {
            const pngMeta = new Amaz.PngMeta();
            pngMeta.needFlipY = true;
            pngMeta.innerAlphaPremul = false;
            pngMeta.outerAlphaPremul = false;
            return this.scene.getNative().assetMgr.SyncLoadWithMeta(path, pngMeta);
        }
        return null;
    }
    // Initialize UI components and layout
    initializeUI() {
        if (this.uiInitialized) {
            return;
        }
        if (!Object.values(RankingType).includes(this.rankingType)) {
            console.error(`invalid Leaderboard type ${this.rankingType}`);
            return;
        }
        this.boardTran2D = this.getSceneObject().getComponent('ScreenTransform');
        this.boardInitHeight = this.boardLastHeight = this.boardTran2D.sizeDelta.y;
        this._rootEntity = this.getOrCreateRootEntity();
        if (!this._rootEntity) {
            return;
        }
        this.backgroundEntity = this.createImageEntity('background', this.union, 0, 54, 335, 303, this._rootEntity, parentWidth, parentHeight, false);
        this.iconEntityList = [];
        this.userNameEntityList = [];
        this.hightlightEntityList = [];
        this.crownEntityList = [];
        const rankingTypeMap = {
            2: {
                type: RankingType.NATIONAL,
                text: this.nationalRankingText,
                defaultRanking: 50,
            },
            3: {
                type: RankingType.GLOBAL,
                text: this.globalRankingText,
                defaultRanking: 999,
            },
            1: {
                type: RankingType.FRIEND,
                text: this.friendRankingText,
                defaultRanking: 3,
            },
        };
        const currentTypeData = rankingTypeMap[this.rankingType];
        this.titleText = this.createTextEntity('titleText', currentTypeData.text, 35, this.titleColor.getNative(), 0, 0, 0, 335, 50, this._rootEntity, parentWidth, parentHeight, this.builtinFonts.DisplayBold, true);
        if (!this.titleText) {
            return;
        }
        const titleTextComp = this.titleText.getComponent('Text');
        titleTextComp.activeTextStyle.outlineEnabled = false;
        titleTextComp.activeTextStyle.outlineColorRGBA = new effect.Amaz.Color(1, 1, 1, 1);
        titleTextComp.activeTextStyle.outlineWidth = 0.087;
        titleTextComp.activeTextStyle.fontfamily = 'font/' + this.titleFont;
        const highl1 = this.createImageEntity('highlight1', this.highlight1, 108, 54, 120, 123, this._rootEntity, parentWidth, parentHeight, false);
        const starsG = this.createImageEntity('starsGold', this.starsGold, 114, 47, 100, 84, this._rootEntity, parentWidth, parentHeight, false);
        highl1 && starsG && this.hightlightEntityList.push([highl1, starsG]);
        const iconC1 = this.createImageEntity('iconCircle1', this.iconCircle1, 134, 58, 67, 67, this._rootEntity, parentWidth, parentHeight, false, this.thumbnailMaterial);
        iconC1 && this.iconEntityList.push(iconC1);
        const crown1 = this.createImageEntity('crown1', this.Crown1combine, 134, 42, 67, 84, this._rootEntity, parentWidth, parentHeight, false);
        crown1 && this.crownEntityList.push(crown1);
        const highl2 = this.createImageEntity('highlight2', this.highlight2, 0, 69, 112, 123, this._rootEntity, parentWidth, parentHeight, false);
        const starsS = this.createImageEntity('starsSilver', this.starsSilver, 22.11, 63.5, 76.79, 64.5, this._rootEntity, parentWidth, parentHeight, false);
        highl2 && starsS && this.hightlightEntityList.push([highl2, starsS]);
        const iconC2 = this.createImageEntity('iconCircle2', this.iconCircle2, 36, 71, 53, 53, this._rootEntity, parentWidth, parentHeight, false, this.thumbnailMaterial);
        iconC2 && this.iconEntityList.push(iconC2);
        const crown2 = this.createImageEntity('crown2', this.Crown2combine, 36, 61, 53, 63, this._rootEntity, parentWidth, parentHeight, false);
        crown2 && this.crownEntityList.push(crown2);
        const highl3 = this.createImageEntity('highlight3', this.highlight3, 223, 69, 112, 123, this._rootEntity, parentWidth, parentHeight, false);
        const starsB = this.createImageEntity('starsBronze', this.starsBronze, 233.57, 63.5, 76.19, 64, this._rootEntity, parentWidth, parentHeight, false);
        highl3 && starsB && this.hightlightEntityList.push([highl3, starsB]);
        const iconC3 = this.createImageEntity('iconCircle3', this.iconCircle3, 248, 71, 53, 53, this._rootEntity, parentWidth, parentHeight, false, this.thumbnailMaterial);
        iconC3 && this.iconEntityList.push(iconC3);
        const crown3 = this.createImageEntity('crown3', this.Crown3combine, 248, 61, 53, 63, this._rootEntity, parentWidth, parentHeight, false);
        crown3 && this.crownEntityList.push(crown3);
        for (let i = 0; i < 3; i++) {
            const posIdx = i === 0 ? 1 : i === 1 ? 0 : 2;
            const left = 23 + 106 * posIdx;
            const userNameTop = this.createTextEntity('userNameTop' + i, '', 17, normalTextColor, 0, left, 141, 80, 39, this._rootEntity, parentWidth, parentHeight, this.builtinFonts.TextBold);
            userNameTop && this.userNameEntityList.push(userNameTop);
        }
        const bar0 = this.createImageEntity('bar' + 0, this.bar, -12, 202, 358, 42, this._rootEntity, parentWidth, parentHeight, false);
        const bar1 = this.createImageEntity('bar' + 1, this.bar, -12, 245, 358, 42, this._rootEntity, parentWidth, parentHeight, false);
        const bar2 = this.createImageEntity('bar' + 2, this.bar, -12, 288, 358, 42, this._rootEntity, parentWidth, parentHeight, false);
        bar0 && this.hightlightEntityList.push([bar0]);
        bar1 && this.hightlightEntityList.push([bar1]);
        bar2 && this.hightlightEntityList.push([bar2]);
        this.rankingTextMerge = this.createTextEntity('rankingTextMerge', '', 17, normalTextColor, 0, 36, 214, 21, 18, this._rootEntity, parentWidth, parentHeight, this.builtinFonts.TextBold);
        this.nameTextMerge = this.createTextEntity('nameTextMerge', '', 17, normalTextColor, 0, 121, 214, 104, 18, this._rootEntity, parentWidth, parentHeight, this.builtinFonts.TextBold);
        this.scoreTextMerge = this.createTextEntity('scoreTextMerge', '', 17, normalTextColor, 0, 246, 214, 81, 18, this._rootEntity, parentWidth, parentHeight, this.builtinFonts.TextMedium);
        for (let i = 0; i < 3; i++) {
            const top = 43 * i + 210;
            const iconCG = this.createImageEntity('iconCircleGray' + i, this.iconCircleGray, 76, top, 26, 26, this._rootEntity, parentWidth, parentHeight, false, this.thumbnailMaterial);
            iconCG && this.iconEntityList.push(iconCG);
        }
        this.errorEntity = this.createTextEntity('errorMessage', '', 20, new effect.Amaz.Color(0.404, 0.404, 0.404, 1), 0, 0, 200, 335, 42, this._rootEntity, parentWidth, parentHeight, this.builtinFonts.TextRegular, false, 6000);
        this.uiInitialized = true;
        while (this.uiUpdateQueue.length > 0) {
            const updateFunction = this.uiUpdateQueue.shift();
            updateFunction === null || updateFunction === void 0 ? void 0 : updateFunction();
        }
        if (this.needsRefresh) {
            this.refreshUI();
            this.needsRefresh = false;
        }
    }
    // Display demo data for testing
    displayDemoData() {
        this.fetchDataDone = true;
        if (this.sortingType === SortingType.HIGH_TO_LOW) {
            this.boardList = JSON.parse(JSON.stringify(demoData));
        }
        else {
            this.boardList = JSON.parse(JSON.stringify(demoData)).reverse();
            this.boardList.forEach((entry, index) => {
                entry.r = index + 1;
            });
        }
        for (let i = 0; i < this.boardList.length; i++) {
            this.boardList[i].icon = this['demoIcon' + (i + 1)];
            this.boardList[i].uid = 'demoUid' + (i + 1);
        }
        this.boardListInit = JSON.parse(JSON.stringify(this.boardList));
        Object.values(RankingType).forEach((rankingType) => {
            if (rankingType !== this.rankingType) {
                const rankingInfo = this.otherRankingInfoMap.get(rankingType);
                if (rankingInfo) {
                    rankingInfo.ranking = 50; // Default ranking
                }
            }
        });
        this.updateCurrentTimeString();
        this.requireUIRefresh();
    }
    lockV(v) {
        if (!this.apk || this.lockerVersion === null) {
            return ['', '', ''];
        }
        const forge = Forge.forge;
        const key = forge.random.getBytesSync(16);
        const iv = forge.random.getBytesSync(12);
        const cipher = forge.cipher.createCipher('AES-GCM', key);
        cipher.start({ iv: iv });
        cipher.update(forge.util.createBuffer(v.toString()));
        cipher.finish();
        const enVal = cipher.output.getBytes();
        const tag = cipher.mode.tag.getBytes();
        const enValT = enVal + tag;
        const lbVal = forge.util.encode64(enValT);
        const iv64 = forge.util.encode64(iv);
        const publicKey = forge.pki.publicKeyFromPem(this.apk);
        const locker = publicKey.encrypt(key, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: forge.mgf.mgf1.create(forge.md.sha256.create()),
        });
        const locker64 = forge.util.encode64(locker);
        return [lbVal, iv64, locker64];
    }
    // Handle events
    onEvent(event) {
        var _a;
        const EVENT_CODE_RECORD_START = 1;
        if (event.type !== APJS.AppEventType.COMPAT_BEF || event.args.length < 2) {
            return;
        }
        const eventType = event.args[0];
        const eventCode = event.args[1];
        if (eventType !== APJS.BEFEventType.BET_RECORD_VIDEO || eventCode !== EVENT_CODE_RECORD_START) {
            return;
        }
        if (((_a = this.scene) === null || _a === void 0 ? void 0 : _a.getNative().getSettings) !== undefined) {
            const settings = this.scene.getNative().getSettings();
            const auto_reset = settings.get('auto_reset_effect');
            if (auto_reset !== true) {
                return;
            }
            this.vd = false;
            this.v = 0;
            this.updateUserScore(this.hs);
            this.boardList = JSON.parse(JSON.stringify(this.boardListInit));
            this.resetIcons();
            this.requireUIRefresh();
        }
    }
    // Update loop
    onUpdate(deltaTime) {
        if (LBSDS.leaderboardReady === true && this.leaderboardRead === false) {
            this.processLeaderboardInformation();
            this.initializeUI();
            this.leaderboardRead = true;
        }
        if (LBSDS.networkFailure !== 0 && this.leaderboardFailure === false) {
            this.processLeaderboardFailure();
            this.initializeUI();
            this.leaderboardRead = true;
            this.leaderboardFailure = true;
        }
        if (this.leaderboardRead === false) {
            return;
        }
        // Refresh text scale when ScreenTransform size changes
        const boardCurHeight = this.boardTran2D.sizeDelta.y;
        if (boardCurHeight !== this.boardLastHeight) {
            this.boardLastHeight = boardCurHeight;
            const curTextScale = this.boardLastHeight / this.boardInitHeight;
            this.boardTextTransList.forEach(tran => {
                tran.localScale = new effect.Amaz.Vector3f(curTextScale, curTextScale, curTextScale);
            });
        }
        this.checkV(); // check v change
        if (this.vd === true) {
            if (!this.fetchDataDone) {
                return;
            }
            this.updateUserScore(this.v);
        }
        if (this.LeaderboardJSVersion === 2) {
            this.postScoreV2();
        }
        else {
            this.postScoreV1();
        }
        this.vd = false;
        this.checkPostScoreFromAPI();
    }
    checkV() {
        if (this.v === this.lastV) {
            return;
        }
        if (!isFinite(this.v)) {
            this.v = this.lastV; // recover v to last value
            return;
        }
        this.vd = true;
        LBSDS.setScore(this.v);
        this.lastV = this.v;
    }
    // Process leaderboard information from data store
    processLeaderboardInformation() {
        this.effectId = LBSDS.effectInfo_Data.effect_id;
        this.un = LBSDS.userProfile_Data.nickname;
        this.iu = LBSDS.userProfile_Data.avatar_path;
        this.icon = LBSDS.getImage(this.iu, null);
        for (let i = 0; i < this.boardList.length; i++) {
            const boardEntry = this.boardList[i];
            if (boardEntry.cu) {
                boardEntry.icon = this.icon;
                this.addUiUpdateTask(this.updateIcon, i);
            }
        }
        this.userId = LBSDS.userInfo_Data.userID;
        const safeMode = Number(LBSDS.userInfo_Data.safeMode);
        if (safeMode) {
            this.addUiUpdateTask(this.displayErrorMessage, this.errorMessageCantConnect, 0);
            return;
        }
        this.apk = LBSDS.apk;
        this.lockerVersion = LBSDS.lockerVersion;
        // Handle network result
        if (Object.keys(LBSDS.networkResponse).length > 0) {
            this.handleNetworkResult(LBSDS.networkResponse);
        }
    }
    // Process leaderboard failure
    processLeaderboardFailure() {
        if (LBSDS.networkFailure !== 1) {
            this.addUiUpdateTask(this.displayErrorMessage, this.errorMessageCantConnect, 0);
        }
        else {
            // Failed network connection, use demo data
            this.usingDemoData = true;
            this.displayDemoData();
        }
    }
    // Post score version 1
    postScoreV1() {
        if (!this.fetchDataDone) {
            return;
        }
        if (this.vd === false) {
            return;
        }
        if (this.safeMode) {
            return;
        }
        LBSDS.postScore();
    }
    // Post score version 2
    postScoreV2() {
        if (this.sendScore === true && this.lastSendScore === false) {
            if (!this.fetchDataDone) {
                return;
            }
            if (this.safeMode) {
                return;
            }
            LBSDS.postScore();
            this.lastSendScore = true;
        }
        else {
            if (this.sendScore === false && this.lastSendScore === true) {
                this.lastSendScore = false;
            }
        }
    }
    checkPostScoreFromAPI() {
        if (this.sendScoreFromAPI === true) {
            if (!this.fetchDataDone) {
                return;
            }
            if (this.safeMode) {
                return;
            }
            LBSDS.postScore();
            this.sendScoreFromAPI = false;
        }
    }
    // Public APIs
    /**
     * @description Get current score.
     * @returns {number}
     */
    getScore() {
        return this.v;
    }
    /**
     * @description Set current score.
     * @param {number} score - New score to set to
     */
    setScore(score) {
        this.v = score;
    }
    /**
     * @description Post current final score.
     */
    postFinalScore() {
        this.sendScoreFromAPI = true;
    }
    // Enable component
    onEnable() {
        this._rootEntity && (this._rootEntity.visible = true);
        this.checkLeaderboardSocialEntity();
    }
    // Disable component
    onDisable() {
        this._rootEntity && (this._rootEntity.visible = false);
        this.checkLeaderboardSocialEntity();
    }
    // Destroy component and cleanup
    onDestroy() {
        var _a;
        this._rootEntity && ((_a = this.scene) === null || _a === void 0 ? void 0 : _a.getNative().removeEntity(this._rootEntity));
        this._rootEntity = undefined;
        this.iconEntityList = [];
        this.userNameEntityList = [];
        this.hightlightEntityList = [];
        this.otherRankingInfoMap.clear();
        this.boardTextTransList = [];
        this.boardTran2D = null;
    }
    onLateUpdate() {
        this.checkLeaderboardSocialEntity();
    }
    checkLeaderboardSocialEntity() {
        if (!LBSDS.userInfo_Data.appVersion) {
            // lower version app does not pass appVersion, and does not need to execute the visibility check logic
            return;
        }
        if (LBSDS && LBSDS.LBSystem && !LBSDS.LBSystem.isRecordingVideo) {
            this.leaderboardScreenVisible = false;
            return;
        }
        // render done
        if (this.boardList.length > 0 &&
            LBSDS.leaderboardReady &&
            this.leaderboardRead &&
            this.rankingType === RankingType.FRIEND) {
            this.checkSocialEntityAndSendNoticeMessage();
        }
    }
    checkSocialEntityAndSendNoticeMessage() {
        const entityEnabled = this.getSceneObject().enabled && this.enabled;
        if (this.leaderboardScreenVisible !== entityEnabled) {
            const friendsInfo = [];
            for (let i = 0; i < this.boardList.length; i++) {
                const boardData = this.boardList[i];
                if (!boardData.cu && boardData.uid) {
                    friendsInfo.push({
                        uid: boardData.uid,
                        visible: entityEnabled,
                        ts: Date.now() - LBSDS.LBSystem.videoRecordStartTime,
                        id: '03:' + this.leaderboardId + ':' + boardData.uid,
                    });
                }
            }
            if (!this.scene) {
                return;
            }
            if (friendsInfo.length > 0) {
                this.friendUtils.sendFriendsPassThroughMessage(this.scene, friendsInfo, LBSDS.LBSystem.isRecordingVideo);
            }
            this.leaderboardScreenVisible = entityEnabled;
        }
    }
};
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "scene", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "rankingType", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "LeaderboardJSVersion", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "sortingType", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "autoSortingOrder", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "sortingOrderCount", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "titleFont", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "titleColor", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "colorFolder", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "sendScore", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "v", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "nationalRankingText", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "globalRankingText", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "friendRankingText", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "imageRendererMaterial", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "thumbnailMaterial", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "highlight1", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "highlight2", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "highlight3", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "iconCircle1", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "iconCircle2", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "iconCircle3", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "iconCircleGray", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "starsGold", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "starsSilver", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "starsBronze", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "Crown1combine", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "Crown2combine", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "Crown3combine", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "messageNoFriends", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "messageNotEnoughFriends", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "errorMessageCantConnect", void 0);
__decorate([
    userPrivateAPI(),
    serialize
], Leaderboard.prototype, "errorMessageUnderage", void 0);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "downloadIcons", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "reuseIcon", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "downloadIcon", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "addUiUpdateTask", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "updateIcon", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "cutV5", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "vDis", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "refreshUI", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "processAllBoardEntries", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "processIconForEntry", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "processHighlightForEntry", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "getFormattedUserName", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "processTop3Entry", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "processNonTopEntries", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "processNonTopTextComponent", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "updateLetterColors", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "updateTextContainerPosition", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "showUIElements", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "adjustPosAndSize", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "updateTextStr", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "resetIcons", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "handleNetworkResult", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "onNetworkResponseSuccess", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "updateCurrentTimeString", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "displayErrorMessage", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "requireUIRefresh", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "compareScore", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "updateUserScore", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "findCurrentUserIndex", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "updateRankingIfNeeded", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "calculateSortDirection", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "reorderBoardList", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "shouldSwapEntries", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "swapBoardEntries", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "getOrCreateRootEntity", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "realPxToSizeDeltaPx", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "createContainerEntity", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "createImageEntity", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "findCameraInParentRecursively", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "getCamera", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "getScreenTransformRect", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "getBoardScale", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "setWordWrapWidth", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "realPxToFontSize", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "pxToRealPx", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "realPxToEngineUnit", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "pxToEngineUnit", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "adjustTextWithAlignH", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "createTextEntity", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "loadTexture", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "initializeUI", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "displayDemoData", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "lockV", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "checkV", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "processLeaderboardInformation", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "processLeaderboardFailure", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "postScoreV1", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "postScoreV2", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "checkPostScoreFromAPI", null);
__decorate([
    userPublicAPI()
], Leaderboard.prototype, "getScore", null);
__decorate([
    userPublicAPI()
], Leaderboard.prototype, "setScore", null);
__decorate([
    userPublicAPI()
], Leaderboard.prototype, "postFinalScore", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "checkLeaderboardSocialEntity", null);
__decorate([
    userPrivateAPI()
], Leaderboard.prototype, "checkSocialEntityAndSendNoticeMessage", null);
Leaderboard = __decorate([
    registerClass(),
    systemList(['LeaderboardSystem'])
], Leaderboard);
exports.Leaderboard = Leaderboard;
hideAPIPrototype(Leaderboard);
//# sourceMappingURL=Leaderboard.js.map