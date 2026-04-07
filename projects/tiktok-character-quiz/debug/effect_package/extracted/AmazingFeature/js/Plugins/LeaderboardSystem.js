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
exports.LeaderboardSystem = void 0;
const APJS = require('../amazingpro.js')
const LeaderboardDataService = __importStar(require("./LeaderboardDataService"));
const LeaderboardDataStore_1 = require("./LeaderboardDataStore");
const Forge = __importStar(require("../forge.min.js"));
const { registerClass, systemScript } = APJS;
const LBSDS = LeaderboardDataStore_1.LeaderboardDataStore.instance;
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["NoInit"] = "NoInit";
    RequestStatus["Requested"] = "Requested";
    RequestStatus["Received"] = "Received";
    RequestStatus["Cancelled"] = "Cancelled";
    RequestStatus["Error"] = "Error";
    RequestStatus["Completed"] = "Completed";
})(RequestStatus || (RequestStatus = {}));
let LeaderboardSystem = class LeaderboardSystem {
    constructor() {
        this.userData_RequestStatus = RequestStatus.NoInit;
        this.leaderboard_RequestStatus = RequestStatus.NoInit;
        this.fetchDataDone = false;
        this.isRecordingVideo = false;
        this.videoRecordStartTime = 0;
        this.jsScript = new effect.Amaz.JSScript();
        this.updateOrder = 20;
        this.ImageResources = [
            {
                name: 'Crown1combine.png',
                prop: 'Crown1combine',
            },
            {
                name: 'Crown2combine.png',
                prop: 'Crown2combine',
            },
            {
                name: 'Crown3combine.png',
                prop: 'Crown3combine',
            },
            {
                name: 'iconCircle1.png',
                prop: 'iconCircle1',
            },
            {
                name: 'iconCircle2.png',
                prop: 'iconCircle2',
            },
            {
                name: 'iconCircle3.png',
                prop: 'iconCircle3',
            },
            {
                name: 'iconCircleGray.png',
                prop: 'iconCircleGray',
            },
            {
                name: 'starsBronze.png',
                prop: 'starsBronze',
            },
            {
                name: 'starsGold.png',
                prop: 'starsGold',
            },
            {
                name: 'starsSilver.png',
                prop: 'starsSilver',
            },
            {
                name: 'demoIcon1.jpg',
                prop: 'demoIcon1',
            },
            {
                name: 'demoIcon2.jpg',
                prop: 'demoIcon2',
            },
            {
                name: 'demoIcon3.jpg',
                prop: 'demoIcon3',
            },
            {
                name: 'demoIcon4.jpg',
                prop: 'demoIcon4',
            },
            {
                name: 'demoIcon5.jpg',
                prop: 'demoIcon5',
            },
            {
                name: 'demoIcon6.jpg',
                prop: 'demoIcon6',
            },
        ];
        this.componentImageResources = [
            {
                name: 'union.png',
                prop: 'union',
            },
            {
                name: 'unionShort.png',
                prop: 'unionShort',
            },
            {
                name: 'unionEmpty.png',
                prop: 'unionEmpty',
            },
            {
                name: 'bar.png',
                prop: 'bar',
            },
            {
                name: 'highlight1.png',
                prop: 'highlight1',
            },
            {
                name: 'highlight2.png',
                prop: 'highlight2',
            },
            {
                name: 'highlight3.png',
                prop: 'highlight3',
            },
        ];
        this._loadedTextureMap = new Map();
        this.needsInitSetup = true;
    }
    onInit() {
        this.InitLBSystem();
        if (LBSDS.LBSystem !== this)
            return;
        this.preload();
    }
    onStart() { }
    recordEventHandler(event) {
        const Amaz = effect.Amaz;
        if (event.type === Amaz.AppEventType.COMPAT_BEF) {
            if (event.args.size() > 1) {
                const eventResult = event.args.get(0);
                if (eventResult === Amaz.BEFEventType.BET_RECORD_VIDEO) {
                    const eventCode = event.args.get(1);
                    if (eventCode === Amaz.BEF_RECODE_VEDIO_EVENT_CODE.RECODE_VEDIO_START) {
                        // Event code triggered with recording start event
                        LBSDS.scoreSet = false;
                        LBSDS.currentScore = 'null';
                        LBSDS.currentRank_friends = -1;
                        LBSDS.currentRank_national = -1;
                        LBSDS.currentRank_global = -1;
                        this.isRecordingVideo = true;
                        this.videoRecordStartTime = Date.now();
                        console.error('startRecordVideo');
                    }
                    else if (eventCode === Amaz.BEF_RECODE_VEDIO_EVENT_CODE.RECODE_VEDIO_END) {
                        this.isRecordingVideo = false;
                        this.videoRecordStartTime = 0;
                        console.error('stopRecordVideo');
                    }
                }
            }
        }
    }
    onUpdate(deltaTime) { }
    onLateUpdate(deltaTime) {
        if (LBSDS.LBSystem !== this)
            return;
        LeaderboardDataService.LBNetworkHandler.instance.update();
    }
    onEvent(event) {
        if (LBSDS.LBSystem !== this)
            return;
        this.recordEventHandler(event);
        const msgID = event.args.get(0);
        const arg1 = event.args.get(1);
        const Amaz = effect.Amaz;
        if (msgID === 0x29 || (msgID === 34952 && arg1 === 0x29)) {
            const taskId = event.args.get(2);
            const key = event.args.get(3);
            const info = Amaz.AmazingManager.getSingleton('BuiltinObject').getUserStringValue(key);
            const obj = JSON.parse(info);
            const requestHandled = LeaderboardDataService.LBRequestHandler.instance.handleResponse(taskId, obj);
            if (!requestHandled) {
                console.error(`onEvent issue ${taskId} `);
            }
            else {
                console.log(`request ${taskId} handled`);
            }
        }
    }
    leaderboardNetworkCallBack(userData, networkResponse, eventType) {
        if (LBSDS.LBSystem !== this)
            return;
        const Amaz = effect.Amaz;
        if (eventType === Amaz.NetworkStatus.NETWORK_SUCCESS) {
            console.log('networkCallback response success, status code: ' + networkResponse.statusCode);
            console.log('network response body: ' + networkResponse.body);
            if (networkResponse.requestId) {
                const requestHandled = LeaderboardDataService.LBNetworkHandler.instance.handleResponse(networkResponse.requestId, networkResponse, eventType);
                if (requestHandled === false) {
                    console.error(`networkCallBack issue ${networkResponse.requestId}  ${userData}`);
                }
            }
        }
        else if (eventType === Amaz.NetworkStatus.NETWORK_FAIL) {
            console.error('networkCallback response error');
            console.error('network response error: ' + networkResponse.errorDesc);
        }
        else if (eventType === Amaz.NetworkStatus.NETWORK_CANCEL) {
            console.error('networkCallback response cancel');
            console.error('networkCallback response cancel' + networkResponse.body);
        }
        else if (eventType === Amaz.NetworkStatus.NETWORK_START) {
            console.log('networkCallback response NETWORK_START');
            console.log('networkCallback response NETWORK_START' + networkResponse.body);
        }
        else if (eventType === Amaz.NetworkStatus.NETWORK_UPDATE) {
            console.log('networkCallback response NETWORK_UPDATE');
            console.log('networkCallback response NETWORK_UPDATE' + networkResponse.body);
        }
        else {
            console.log('networkCallback response else');
            console.log('networkCallback response else ' + networkResponse.body);
            console.log('networkCallback response else event ' + eventType);
        }
    }
    InitLBSystem() {
        this.userData_RequestStatus = RequestStatus.NoInit;
        this.leaderboard_RequestStatus = RequestStatus.NoInit;
        // Check the APJS main system
        if (this.jsScript.className !== 'AmazingProRuntime') {
            return;
        }
        if (LBSDS.LBSystem === null) {
            LBSDS.LBSystem = this;
            LeaderboardDataService.LBNetworkHandler.instance.initialize();
            LeaderboardDataService.LBNetworkHandler.instance.addListener(this.jsScript, this);
            // Dynamically add leaderboardNetworkCallBack function to jsScript object
            const apjsSystemScript = this.jsScript;
            if (apjsSystemScript.ref) {
                apjsSystemScript.ref['leaderboardNetworkCallBack'] = this.leaderboardNetworkCallBack.bind(this);
            }
            this.scene && this.initializeData(this.scene);
        }
    }
    initializeData(scene) {
        const basicInfoPromises = [
            LeaderboardDataService.getUserInfo(scene),
            LeaderboardDataService.getEffectInfo(scene),
            LeaderboardDataService.getUserProfile(scene),
        ];
        this.userData_RequestStatus = RequestStatus.Requested;
        this.requestFriendsList();
        Promise.all(basicInfoPromises)
            .then(([userInfo, effectInfo, userProfile]) => {
            this.userData_RequestStatus = RequestStatus.Received;
            LBSDS.userProfile_Data = userProfile;
            LBSDS.userInfo_Data = userInfo;
            LBSDS.effectInfo_Data = effectInfo;
            const effectId = LBSDS.effectInfo_Data.effect_id;
            LBSDS.effectInfo_Data.effect_id_isValid = /^\d+$/.test(effectId) && effectId !== '123456';
            if (!LBSDS.effectInfo_Data.effect_id_isValid) {
                this.userData_RequestStatus = RequestStatus.Error;
                throw new Error('Invalid effect id.');
            }
            if (LBSDS.getImage(LBSDS.userProfile_Data.avatar_path, null) === null) {
                console.error('avatar_image: failed to load');
            }
            this.userData_RequestStatus = RequestStatus.Completed;
            this.encryptionKeyRequestFunction();
        })
            .catch(err => {
            console.warn(`Failed to receive data from server, reason: ${err.message}`);
            LBSDS.networkFailure = 1;
        });
    }
    requestFriendsList() {
        const friendsListRequest = new LeaderboardDataService.LBFriendsListRequest();
        LeaderboardDataService.LBNetworkHandler.instance.sendRequest(friendsListRequest).then((response) => {
            if (response.body) {
                const friendsListBody = JSON.parse(response.body);
                LBSDS.standardFriends = friendsListBody.friends;
                if (friendsListBody.friends && typeof friendsListBody.friends.length === 'number') {
                    LBSDS.standardFriendCount = friendsListBody.friends.length;
                    LBSDS.standardFriendsListReady = true;
                }
                else {
                    LBSDS.standardFriendCount = 0;
                }
            }
        }, (error) => {
            console.error(error.message);
        });
    }
    encryptionKeyRequestFunction() {
        this.leaderboard_RequestStatus = RequestStatus.Requested;
        const leaderboardRequest = new LeaderboardDataService.LBLeaderboardRequest(LBSDS.effectInfo_Data.effect_id, LBSDS.leaderboardOrder);
        const encryptionKeyRequest = new LeaderboardDataService.LBEncryptionKeyRequest();
        LeaderboardDataService.LBNetworkHandler.instance
            .sendRequest(encryptionKeyRequest)
            .then((response) => {
            if (response.body) {
                const encBody = JSON.parse(response.body);
                if (encBody && encBody.asymmetric_public_key && encBody.key_version !== undefined) {
                    LBSDS.apk = encBody.asymmetric_public_key;
                    LBSDS.lockerVersion = encBody.key_version;
                    return LeaderboardDataService.LBNetworkHandler.instance.sendRequest(leaderboardRequest);
                }
            }
            this.leaderboard_RequestStatus = RequestStatus.Error;
            throw new Error('Failed to obtain a valid encryption key from server');
        })
            .then((networkResponse) => {
            this.leaderboard_RequestStatus = RequestStatus.Received;
            this.handleNetworkResult(networkResponse);
        })
            .catch((error) => {
            this.leaderboard_RequestStatus = RequestStatus.Error;
            LBSDS.networkFailure = 2;
        });
    }
    handleNetworkResult(networkResponse) {
        LBSDS.networkResponse = networkResponse;
        const success = networkResponse.succeed;
        const result = {
            response: networkResponse,
        };
        if (success) {
            const statusCode = networkResponse.statusCode;
            if (statusCode < 200 || statusCode > 299) {
                this.leaderboard_RequestStatus = RequestStatus.Error;
            }
            else {
                result.body = networkResponse.body;
                this.onNetworkResponseSuccess(result);
            }
        }
        else {
            this.leaderboard_RequestStatus = RequestStatus.Error;
            LBSDS.networkFailure = 3;
            result.error = networkResponse.errorDesc;
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
                this.leaderboard_RequestStatus = RequestStatus.Completed;
                LBSDS.leaderboard_Data = obj;
                LBSDS.leaderboardReady = true;
                this.processLeaderboards(obj);
            }
            else {
                if (statusCode !== 0) {
                    this.leaderboard_RequestStatus = RequestStatus.Error;
                    console.error('Error status code:', statusCode);
                    LBSDS.networkFailure = 4;
                }
                else {
                    this.leaderboard_RequestStatus = RequestStatus.Error;
                    console.error('Leaderboards Missing.');
                    LBSDS.networkFailure = 5;
                }
            }
        }
        catch (e) {
            this.leaderboard_RequestStatus = RequestStatus.Error;
            console.error('Error:', e.message);
            LBSDS.networkFailure = 6;
        }
    }
    processLeaderboards(obj) {
        obj.leaderboards.forEach((leaderboard) => {
            this.processLeaderboardEntry(leaderboard);
        });
    }
    processLeaderboardEntry(leaderboard) {
        const boardType = leaderboard.leaderboard_type;
        const self_rank = leaderboard.self_rank;
        LBSDS.hasScore = self_rank.has_score;
        if (LBSDS.hasScore) {
            LBSDS.bestScore = leaderboard.self_rank.score;
        }
        this.handleBoardType(boardType, self_rank, leaderboard);
    }
    handleBoardType(boardType, self_rank, leaderboard) {
        switch (boardType) {
            case 1:
                LBSDS.friends_leaderboard = leaderboard;
                LBSDS.friends_rank = -1;
                if (self_rank.rank) {
                    LBSDS.friends_rank = self_rank.rank;
                    let offsetFriend = 0;
                    for (let i = 0; i < 6; i++) {
                        if (i === LBSDS.friends_rank - 1) {
                            offsetFriend = -1;
                        }
                        else {
                            if (!LBSDS.friends_leaderboard.leaderboard[i])
                                continue;
                            LBSDS.friends_leaderboard_minusBest[i + offsetFriend] = LBSDS.friends_leaderboard.leaderboard[i];
                        }
                    }
                }
                else {
                    LBSDS.friends_leaderboard_minusBest = LBSDS.friends_leaderboard.leaderboard;
                }
                if (leaderboard.overall_leaderboard) {
                    LBSDS.has_overall_friends_scores = true;
                    LBSDS.overall_friends_scores = leaderboard.overall_leaderboard;
                }
                break;
            case 2:
                LBSDS.national_leaderboard = leaderboard;
                LBSDS.national_rank = -1;
                if (self_rank.rank) {
                    LBSDS.national_rank = self_rank.rank;
                    let offsetNational = 0;
                    for (let i = 0; i < 6; i++) {
                        if (i === LBSDS.national_rank - 1) {
                            offsetNational = -1;
                        }
                        else {
                            if (!LBSDS.national_leaderboard.leaderboard[i])
                                continue;
                            LBSDS.national_leaderboard_minusBest[i + offsetNational] = LBSDS.national_leaderboard.leaderboard[i];
                        }
                    }
                }
                else {
                    LBSDS.national_leaderboard_minusBest = LBSDS.national_leaderboard.leaderboard;
                }
                if (leaderboard.overall_leaderboard) {
                    LBSDS.has_overall_national_scores = true;
                    LBSDS.overall_national_scores = leaderboard.overall_leaderboard;
                }
                break;
            case 3:
                LBSDS.global_leaderboard = leaderboard;
                LBSDS.global_rank = -1;
                if (self_rank.rank) {
                    LBSDS.global_rank = self_rank.rank;
                    let offsetGlobal = 0;
                    for (let i = 0; i < 6; i++) {
                        if (i === LBSDS.global_rank - 1) {
                            offsetGlobal = -1;
                        }
                        else {
                            if (!LBSDS.global_leaderboard.leaderboard[i])
                                continue;
                            LBSDS.global_leaderboard_minusBest[i + offsetGlobal] = LBSDS.global_leaderboard.leaderboard[i];
                        }
                    }
                }
                else {
                    LBSDS.global_leaderboard_minusBest = LBSDS.global_leaderboard.leaderboard;
                }
                if (leaderboard.overall_leaderboard) {
                    LBSDS.has_overall_global_scores = true;
                    LBSDS.overall_global_scores = leaderboard.overall_leaderboard;
                }
                break;
            default:
        }
    }
    onDestroy() {
        if (LBSDS.LBSystem !== this)
            return;
        LeaderboardDataService.LBNetworkHandler.instance.removeListener(this);
        const apjsSystemScript = this.jsScript;
        if (apjsSystemScript.ref) {
            apjsSystemScript.ref['leaderboardNetworkCallBack'] = undefined;
        }
    }
    /**
     * Called from LBSDS Post Score
     **/
    postScore() {
        var _a;
        if (LBSDS.userInfo_Data.safeMode) {
            return;
        }
        if (LBSDS.currentScore === 'null') {
            return;
        }
        const [lbVal, iv, locker] = this.lockV(LBSDS.currentScore);
        if (lbVal && iv && locker) {
            const messageBody = [
                {
                    leaderboard_id: 1,
                    effect_id: parseInt(LBSDS.effectInfo_Data.effect_id),
                    order: LBSDS.leaderboardOrder,
                    lb_val: lbVal,
                    iv: iv,
                    locker: locker,
                    locker_version: LBSDS.lockerVersion,
                    is_gaming_effect: true,
                },
            ];
            const arg = {
                interface: 'params_pass_through',
                action: 0,
                params: {
                    tt_leaderboard: messageBody,
                },
            };
            (_a = this.scene) === null || _a === void 0 ? void 0 : _a.postMessage(0x00006001, 0x00006001, 0, JSON.stringify(arg));
        }
    }
    lockV(v) {
        if (!LBSDS.apk || LBSDS.lockerVersion === null) {
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
        const publicKey = forge.pki.publicKeyFromPem(LBSDS.apk);
        const locker = publicKey.encrypt(key, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: forge.mgf.mgf1.create(forge.md.sha256.create()),
        });
        const locker64 = forge.util.encode64(locker);
        return [lbVal, iv64, locker64];
    }
    /**
     * Called from LBSDS Set Score
     **/
    UpdateCurrentRanking() {
        if (LBSDS.leaderboardOrder === 0) {
            this.updateCurrentRanks_HigherBetter();
        }
        else {
            this.updateCurrentRanks_LowerBetter();
        }
    }
    updateCurrentRanks_HigherBetter() {
        if (LBSDS.overall_friends_scores && LBSDS.overall_friends_scores.length > 0) {
            LBSDS.currentRank_friends = LBSDS.overall_friends_scores.length + 1;
            for (let i = 0; i < LBSDS.overall_friends_scores.length; i++) {
                const tempScore = LBSDS.overall_friends_scores[i];
                if (tempScore <= LBSDS.currentScore) {
                    const index = i + 1;
                    LBSDS.currentRank_friends = index;
                    break;
                }
            }
        }
        else {
            LBSDS.currentRank_friends = 1;
        }
        if (LBSDS.overall_national_scores && LBSDS.overall_national_scores.length > 0) {
            LBSDS.currentRank_national = LBSDS.overall_national_scores.length + 1;
            for (let i = 0; i < LBSDS.overall_national_scores.length; i++) {
                const tempScore = LBSDS.overall_national_scores[i];
                if (tempScore <= LBSDS.currentScore) {
                    const index = i + 1;
                    LBSDS.currentRank_national = index;
                    break;
                }
            }
        }
        else {
            LBSDS.currentRank_national = 1;
        }
        if (LBSDS.overall_global_scores && LBSDS.overall_global_scores.length > 0) {
            LBSDS.currentRank_global = LBSDS.overall_global_scores.length + 1;
            for (let i = 0; i < LBSDS.overall_global_scores.length; i++) {
                const tempScore = LBSDS.overall_global_scores[i];
                if (tempScore <= LBSDS.currentScore) {
                    const index = i + 1;
                    LBSDS.currentRank_global = index;
                    break;
                }
            }
        }
        else {
            LBSDS.currentRank_global = 1;
        }
    }
    updateCurrentRanks_LowerBetter() {
        if (LBSDS.overall_friends_scores && LBSDS.overall_friends_scores.length > 0) {
            LBSDS.currentRank_friends = LBSDS.overall_friends_scores.length + 1;
            for (let i = 0; i < LBSDS.overall_friends_scores.length; i++) {
                const tempScore = LBSDS.overall_friends_scores[i];
                if (tempScore >= LBSDS.currentScore) {
                    const index = i + 1;
                    LBSDS.currentRank_friends = index;
                    break;
                }
            }
        }
        else {
            LBSDS.currentRank_friends = 1;
        }
        if (LBSDS.overall_national_scores && LBSDS.overall_national_scores.length > 0) {
            LBSDS.currentRank_national = LBSDS.overall_national_scores.length + 1;
            for (let i = 0; i < LBSDS.overall_national_scores.length; i++) {
                const tempScore = LBSDS.overall_national_scores[i];
                if (tempScore >= LBSDS.currentScore) {
                    const index = i + 1;
                    LBSDS.currentRank_national = index;
                    break;
                }
            }
        }
        else {
            LBSDS.currentRank_national = 1;
        }
        if (LBSDS.overall_global_scores && LBSDS.overall_global_scores.length > 0) {
            LBSDS.currentRank_global = LBSDS.overall_global_scores.length + 1;
            for (let i = 0; i < LBSDS.overall_global_scores.length; i++) {
                const tempScore = LBSDS.overall_global_scores[i];
                if (tempScore >= LBSDS.currentScore) {
                    const index = i + 1;
                    LBSDS.currentRank_global = index;
                    break;
                }
            }
        }
        else {
            LBSDS.currentRank_global = 1;
        }
    }
    getOtherRanking(otherScore, leaderboardType) {
        if (LBSDS.leaderboardOrder === 0) {
            return this.getOtherRanking_HigherBetter(otherScore, leaderboardType);
        }
        else {
            return this.getOtherRanking_LowerBetter(otherScore, leaderboardType);
        }
    }
    getOtherRanking_HigherBetter(otherScore, leaderboardType) {
        let returnRank = -1;
        switch (leaderboardType) {
            case 'Friend':
                if (LBSDS.overall_friends_scores && LBSDS.overall_friends_scores.length > 0) {
                    returnRank = LBSDS.overall_friends_scores.length + 1;
                    for (let i = 0; i < LBSDS.overall_friends_scores.length; i++) {
                        const tempScore = LBSDS.overall_friends_scores[i];
                        if (tempScore <= otherScore) {
                            const index = i + 1;
                            return index;
                        }
                    }
                }
                return returnRank;
            case 'National':
                if (LBSDS.overall_national_scores && LBSDS.overall_national_scores.length > 0) {
                    returnRank = LBSDS.overall_national_scores.length + 1;
                    for (let i = 0; i < LBSDS.overall_national_scores.length; i++) {
                        const tempScore = LBSDS.overall_national_scores[i];
                        if (tempScore <= otherScore) {
                            const index = i + 1;
                            return index;
                        }
                    }
                }
                return returnRank;
            case 'Global':
                if (LBSDS.overall_global_scores && LBSDS.overall_global_scores.length > 0) {
                    returnRank = LBSDS.overall_global_scores.length + 1;
                    for (let i = 0; i < LBSDS.overall_global_scores.length; i++) {
                        const tempScore = LBSDS.overall_global_scores[i];
                        if (tempScore <= otherScore) {
                            const index = i + 1;
                            return index;
                        }
                    }
                }
                return returnRank;
        }
        return returnRank;
    }
    getOtherRanking_LowerBetter(otherScore, leaderboardType) {
        let returnRank = -1;
        switch (leaderboardType) {
            case 'Friend':
                if (LBSDS.overall_friends_scores && LBSDS.overall_friends_scores.length > 0) {
                    returnRank = LBSDS.overall_friends_scores.length + 1;
                    for (let i = 0; i < LBSDS.overall_friends_scores.length; i++) {
                        const tempScore = LBSDS.overall_friends_scores[i];
                        if (tempScore >= otherScore) {
                            const index = i + 1;
                            return index;
                        }
                    }
                }
                return returnRank;
            case 'National':
                if (LBSDS.overall_national_scores && LBSDS.overall_national_scores.length > 0) {
                    returnRank = LBSDS.overall_national_scores.length + 1;
                    for (let i = 0; i < LBSDS.overall_national_scores.length; i++) {
                        const tempScore = LBSDS.overall_national_scores[i];
                        if (tempScore >= otherScore) {
                            const index = i + 1;
                            return index;
                        }
                    }
                }
                return returnRank;
            case 'Global':
                if (LBSDS.overall_global_scores && LBSDS.overall_global_scores.length > 0) {
                    returnRank = LBSDS.overall_global_scores.length + 1;
                    for (let i = 0; i < LBSDS.overall_global_scores.length; i++) {
                        const tempScore = LBSDS.overall_global_scores[i];
                        if (tempScore >= otherScore) {
                            const index = i + 1;
                            return index;
                        }
                    }
                }
                return returnRank;
        }
        return returnRank;
    }
    onComponentAdded(comp) {
        if (comp instanceof effect.Amaz.DynamicComponent && comp.className === 'Leaderboard') {
            const apjsComp = APJS.transferToAPJSObj(comp);
            if (!apjsComp.scene) {
                const apjsScene = APJS.transferToAPJSObj(this.scene);
                apjsComp.scene = apjsScene;
            }
            this._loadedTextureMap.forEach((tex, key) => {
                apjsComp[key] = tex;
            });
            // Load component specific images respectively for each component.
            this.componentImageResources.forEach((item) => {
                const colorFolder = apjsComp.colorFolder;
                if (colorFolder) {
                    const path = `image/${colorFolder}/${item.name}`;
                    const tex = this.loadTexture(path);
                    if (!tex) {
                        console.error(`preload image: ${path} failed`);
                    }
                    apjsComp[item.prop] = tex;
                }
            });
        }
    }
    onComponentRemoved(comp) { }
    preload() {
        this.ImageResources.forEach((item) => {
            if (this._loadedTextureMap.has(item.prop)) {
                return;
            }
            const path = `image/${item.name}`;
            const tex = this.loadTexture(path);
            if (!tex) {
                console.error(`preload image: ${path} failed`);
            }
            this._loadedTextureMap.set(item.prop, tex);
        });
    }
    loadTexture(path) {
        if (this.scene && this.scene.assetMgr) {
            const pngMeta = new effect.Amaz.PngMeta();
            pngMeta.needFlipY = true;
            pngMeta.innerAlphaPremul = false;
            pngMeta.outerAlphaPremul = false;
            return this.scene.assetMgr.SyncLoadWithMeta(path, pngMeta);
        }
        return null;
    }
};
LeaderboardSystem = __decorate([
    registerClass(),
    systemScript
], LeaderboardSystem);
exports.LeaderboardSystem = LeaderboardSystem;
//# sourceMappingURL=LeaderboardSystem.js.map