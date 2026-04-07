"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GVSSDataStorage_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GVSSDataStorage = void 0;
const APJS = require('../amazingpro.js')
const { registerClass } = APJS;
let GVSSDataStorage = GVSSDataStorage_1 = class GVSSDataStorage {
    constructor() {
        this.isMobile = false;
        this.PublishUserCount = 0;
        this.PublishCount = 0;
        this.CurrentUserPublishCount = 0;
        this.CurrentUserPublishDays = 0;
        this.CurrentUserConsecutivePublishDays = 0;
        this._gvssGraphData = {};
        this._gvssDataDirty = false;
        this._gvssDataLoaded = false;
        this._gvssNetworkFailure = false;
    }
    static get instance() {
        if (!this._instance) {
            this._instance = new GVSSDataStorage_1();
        }
        return this._instance;
    }
    setGraphGVSSData(graphName, data) {
        this._gvssGraphData[graphName] = data;
        this._gvssDataDirty = true;
    }
    getGraphGVSSData(graphName) {
        return this._gvssGraphData[graphName];
    }
    setGVSSData(data) {
        this._gvssGraphData = data;
        this.PublishUserCount = data['PublishUserCount'];
        this.PublishCount = data['PublishCount'];
        this.CurrentUserPublishCount = data['CurrentUserPublishCount'];
        this.CurrentUserPublishDays = data['CurrentUserPublishDays'];
        this.CurrentUserConsecutivePublishDays = data['CurrentUserConsecutivePublishDays'];
        if (!this.isMobile) {
            this._gvssGraphData['PublishUserCount'] = this.PublishUserCount + 1;
            this._gvssGraphData['PublishCount'] = this.PublishCount + 1;
            this._gvssGraphData['CurrentUserPublishCount'] = this.CurrentUserPublishCount + 1;
            this._gvssGraphData['CurrentUserPublishDays'] = this.CurrentUserPublishDays + 1;
            this._gvssGraphData['CurrentUserConsecutivePublishDays'] = this.CurrentUserConsecutivePublishDays + 1;
            this.PublishUserCount = data['PublishUserCount'];
            this.PublishCount = data['PublishCount'];
            this.CurrentUserPublishCount = data['CurrentUserPublishCount'];
            this.CurrentUserPublishDays = data['CurrentUserPublishDays'];
            this.CurrentUserConsecutivePublishDays = data['CurrentUserConsecutivePublishDays'];
            this._gvssDataDirty = true;
        }
    }
    getGVSSDataWithoutPublishData() {
        if (this.isMobile) {
            const gvssGraphDataWithoutPublishData = Object.assign({}, this._gvssGraphData);
            delete gvssGraphDataWithoutPublishData['PublishUserCount'];
            delete gvssGraphDataWithoutPublishData['PublishCount'];
            delete gvssGraphDataWithoutPublishData['CurrentUserPublishCount'];
            delete gvssGraphDataWithoutPublishData['CurrentUserPublishDays'];
            delete gvssGraphDataWithoutPublishData['CurrentUserConsecutivePublishDays'];
            return gvssGraphDataWithoutPublishData;
        }
        return this._gvssGraphData;
    }
    setGVSSDataDirty(dirty) {
        this._gvssDataDirty = dirty;
    }
    getGVSSDataDirty() {
        return this._gvssDataDirty;
    }
    setGVSSDataLoaded(loaded) {
        this._gvssDataLoaded = loaded;
    }
    getGVSSDataLoaded() {
        return this._gvssDataLoaded;
    }
    setNetworkFailure(failure) {
        this._gvssNetworkFailure = failure;
    }
    getNetworkFailure() {
        return this._gvssNetworkFailure;
    }
    setFakeInitialPublishData() {
        this.PublishUserCount = 0;
        this.PublishCount = 0;
        this.CurrentUserPublishCount = 0;
        this.CurrentUserPublishDays = 0;
        this.CurrentUserConsecutivePublishDays = 0;
        this._gvssGraphData['PublishUserCount'] = this.PublishUserCount;
        this._gvssGraphData['PublishCount'] = this.PublishCount;
        this._gvssGraphData['CurrentUserPublishCount'] = this.CurrentUserPublishCount;
        this._gvssGraphData['CurrentUserPublishDays'] = this.CurrentUserPublishDays;
        this._gvssGraphData['CurrentUserConsecutivePublishDays'] = this.CurrentUserConsecutivePublishDays;
        this.setGVSSDataLoaded(true);
        this.setGVSSDataDirty(true);
    }
    setGVSSDataFromNetworkMessage(respBody) {
        this._gvssGraphData = {};
        const respParsed = JSON.parse(respBody);
        if (!respParsed || typeof respParsed !== 'object') {
            console.error('Failed to parse respParsed because it is empty or unavailable');
            this.setGVSSDataLoaded(true);
            return;
        }
        if (!respParsed['effect_stats'] || typeof respParsed['effect_stats'] !== 'object') {
            console.error('Failed to parse effect_stats because it is empty or unavailable');
            this.setGVSSDataLoaded(true);
            return;
        }
        const effect_stats = respParsed['effect_stats'];
        this.PublishUserCount = effect_stats['total_entity'];
        this.PublishCount = effect_stats['total_count'];
        this.CurrentUserPublishCount = effect_stats['entity_post_count'];
        this.CurrentUserPublishDays = effect_stats['entity_post_days'];
        this.CurrentUserConsecutivePublishDays = effect_stats['entity_consecutive_post_days'];
        const pass_through_data = effect_stats['pass_through_data'];
        try {
            if (typeof pass_through_data === 'string' && pass_through_data !== '') {
                const parsedPassThrough = JSON.parse(pass_through_data);
                this._gvssGraphData = parsedPassThrough;
            }
            else {
                console.error('Failed to parse pass_through_data because it is empty or unavailable');
            }
        }
        catch (e) {
            console.error('Failed to parse pass_through_data:', e);
        }
        this._gvssGraphData['PublishUserCount'] = this.PublishUserCount;
        this._gvssGraphData['PublishCount'] = this.PublishCount;
        this._gvssGraphData['CurrentUserPublishCount'] = this.CurrentUserPublishCount;
        this._gvssGraphData['CurrentUserPublishDays'] = this.CurrentUserPublishDays;
        this._gvssGraphData['CurrentUserConsecutivePublishDays'] = this.CurrentUserConsecutivePublishDays;
        this.setGVSSDataLoaded(true);
    }
};
GVSSDataStorage = GVSSDataStorage_1 = __decorate([
    registerClass()
], GVSSDataStorage);
exports.GVSSDataStorage = GVSSDataStorage;
//# sourceMappingURL=GVSSDataStorage.js.map