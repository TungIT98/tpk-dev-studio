const JSAssetRuntimeManager = require('./JSAssetRuntimeManager');
const APJS = require('./amazingpro.js');

class JSAssetSystem {
    onInit() {
        JSAssetRuntimeManager.initInstance(this.scene, this);
        this.manager = JSAssetRuntimeManager.instance();
    }

    onStart() {
        this.manager.onStart();
    }

    onUpdate(dt) {
        this.manager.onUpdate(dt);
    }

    onLateUpdate(dt) {
        this.manager.onLateUpdate(dt);
    }

    onComponentAdded(comp) {
        this.manager.onComponentAdded(APJS.transferToAPJSObj(comp));
    }

    onComponentRemoved(comp) {
        this.manager.onComponentRemoved(APJS.transferToAPJSObj(comp));
    }

    onEvent(event) {
        this.manager.onEvent(APJS.transferToAPJSObj(event));
    }

    onRelease() {
        this.manager.onRelease();
    }

    onDestroy() {
        this.manager.onDestroy();
    }
}

exports.JSAssetSystem = JSAssetSystem;