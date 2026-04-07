"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendUtils = void 0;
const APJS = require('../amazingpro.js')
const { registerClass } = APJS;
let FriendUtils = class FriendUtils {
    /**
     * Sends a passthrough message with friends list information.
     * @param scene - The scene object to post message to
     * @param friendList - List of friends to include in the message
     * @param isRecordingVideo - Indicates whether video recording is in progress
     */
    sendFriendsPassThroughMessage(scene, friendList, isRecordingVideo) {
        const arg = {
            interface: 'params_pass_through',
            action: {
                tt_social_friends: 2,
            },
            params: {
                tt_social_friends: friendList,
            },
        };
        if (isRecordingVideo) {
            scene.postMessage(0x00006001, 0x00006001, 0, JSON.stringify(arg));
        }
    }
};
FriendUtils = __decorate([
    registerClass()
], FriendUtils);
exports.FriendUtils = FriendUtils;
//# sourceMappingURL=FriendUtils.js.map