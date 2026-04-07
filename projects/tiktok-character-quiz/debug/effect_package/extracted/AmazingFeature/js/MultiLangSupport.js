// Amaz
const Amaz = effect.Amaz;
const ScriptNodeAPI_1 = require('../js/Graph/Lib/Utils/ScriptNodeAPI');
const {TranslationDataStorage} = require('./MultiLangSupport_DataStorage');
const JSAssetRuntimeManager = require('./JSAssetRuntimeManager');
const APJS = require('./amazingpro');

function isOnMobile() {
  return Amaz.Platform.name() !== 'Mac' && Amaz.Platform.name() !== 'Windows' && Amaz.Platform.name() !== 'Linux';
}

function pxToRefRatio(px, ref) {
  return px / ref;
}

class MultiLangSupport {
  constructor() {
    if (MultiLangSupport.instance) {
      return MultiLangSupport.instance;
    }
    this.name = 'MultiLangSupport';
    this.lastTextComp = null;
    MultiLangSupport.instance = this;
    this.timeUntilTranslate = 5;
    this.allComponentsNeedingToBeProcessed = [];
    this._loadedTextureMap = new Map();
    this.touchArabicButtonOffset = 0.1492537313;
    this.lowerX_wide = 0.0358974359;
    this.upperX_wide = 0.4666666667;
    this.lowerY_wide = 0.7622478386;
    this.upperY_wide = 0.8198847262;
    this.upperX_narrow = 0.1384615385;
    this.translationImageState = 1;
    this.timeUntilNarrow = 2;
    this.translationFailure = false;
    this.arabicButtonOffset = 0;
    this.translationButtonsEnabled = true;
  }

  static getInstance() {
    if (!MultiLangSupport.instance) {
      MultiLangSupport.instance = new MultiLangSupport();
    }
    return MultiLangSupport.instance;
  }

  onEnable() {}

  onStart() {
    if (isOnMobile() === false) {
      console.log('Not on mobile');
      this.translationFailure = true;
      return;
    } else {
      this.getLanguageCode();
    }

    // if not fall into our supported languages, do nothing as well as hide UI
    console.log(`multiLang lang code ${TranslationDataStorage.languageCode}`);
    const support_langs = ['en', 'es', 'id', 'ar', 'pt', 'ru', 'vi', 'th', 'tr', 'fr', 'bn'];
    if (support_langs.includes(TranslationDataStorage.languageCode) === false) {
      this.translationFailure = true;
      console.log(`multiLang failure due to unsupported lang code  ${TranslationDataStorage.languageCode}`);
      return;
    }
    this.readTranslationsIn();
    if (TranslationDataStorage.translationsLoaded === false) {
      this.translationFailure = true;
      return;
    }

    this.preload();
    this.createHighestSortOrderCamera();
    if (this.firstCam === null) {
      this.translationFailure = true;
      return;
    }

    // check if contains AIVideo, skip this feature if yes
    let hasAIVideo = false;
    const jsAssetMap = this.scene.assetMgr.getAllScriptCustomAssets();
    const keys = jsAssetMap.getVectorKeys();
    for (let i = 0; i < keys.size(); i++) {
      const k = keys.get(i);
      const obj = jsAssetMap.get(k);
      const imgAsset = JSAssetRuntimeManager.instance().getAsset(obj);
      if (imgAsset !== null) {
        const assetName = imgAsset.constructor.name;
        if (assetName !== null && assetName === 'JSAssetAIVideoTextureScript') {
          hasAIVideo = true;
        }
      }
    }
    if (hasAIVideo) {
      this.translationFailure = true;
      console.log(`disable multi language translation`);
      return;
    }

    // sending translation_btn_show event when button show
    this.analytics = Amaz.AmazingManager.getSingleton('AnalyticsManager');
    this.sendAnalyticalEvent('translation_btn_show');

    this.createUI();
    this.hideUIImages();
  }

  sendAnalyticalEvent(eventType) {
    const data = new Amaz.Map();
    data.set('effect_source', 'TTEH');
    data.set('effect_type', eventType);
    data.set('effect_stage', TranslationDataStorage.useUserText ? 'original' : 'translated');
    data.set('extra', TranslationDataStorage.languageCode);
    this.analytics.reportEvent('effect_custom_event', data);
    console.log(`multiLang report event ${eventType} ${data.get('effect_stage')} ${data.get('extra')}`);
  }

  getLanguageCode() {
    const veConfig = new Amaz.VEConfig();
    TranslationDataStorage.languageCode = veConfig.getConfig('languageCode');
    switch (TranslationDataStorage.languageCode) {
      case 'id-ID':
        TranslationDataStorage.languageCode = 'id';
        break;
      case 'vi-VN':
        TranslationDataStorage.languageCode = 'vi';
        break;
      case 'th-TH':
        TranslationDataStorage.languageCode = 'th';
        break;
      case 'tr-TR':
        TranslationDataStorage.languageCode = 'tr';
        break;
      case 'bn-IN':
        TranslationDataStorage.languageCode = 'bn';
        break;
      default:
        break;
    }
  }

  readTranslationsIn() {
    // Read the file with the name comp.guid + .json
    const ugcFolderPath = `${this.scene.assetMgr.rootDir.split('/').slice(0, -2).join('/')}`;
    const jsonPath = ugcFolderPath + '/Translations/TranslationFileInfo.json';
    if (!fs.accessSync(jsonPath, 0)) {
      console.log(`json file doesn't exist: ${jsonPath}`);
      return;
    }

    const jsonStr = this.ab2str(fs.readFileSync(jsonPath));
    if (!jsonStr) {
      console.log(`json file is empty: ${jsonPath}`);
      return;
    }
    const jsonObj = JSON.parse(jsonStr);
    if (!jsonObj) {
      console.log(`json file not parsable: ${jsonPath}`);
      return;
    }
    TranslationDataStorage.translationsLoaded = false;
    // Log all keys
    Object.keys(jsonObj).forEach(key => {
      const translationJsonData = jsonObj[key];

      TranslationDataStorage.translationByUserText.set(
        translationJsonData['userText'],
        translationJsonData[TranslationDataStorage.languageCode]
      );
      TranslationDataStorage.translationsLoaded = true;
    });
  }

  onUpdate(deltaTime) {
    if (this.translationFailure) return;
    if (TranslationDataStorage.translationsLoaded === true && this.allComponentsNeedingToBeProcessed.length !== 0) {
      this.processAllAddedComponents();
    }

    if (!this.translationButtonsEnabled) {
      return;
    }

    this.timeUntilNarrow -= deltaTime;
    if (this.timeUntilNarrow < 0) {
      if (this.translationImageState === 1) {
        this.translationImageState = 2;
        this.hideUIImages();
      } else if (this.translationImageState === 3) {
        this.translationImageState = 4;
        this.hideUIImages();
      }
    }
  }

  preload() {
    this.translated_wide_tex = this.loadTexture('image/translated_wide.png');
    this.translated_narrow_tex = this.loadTexture('image/translated_narrow.png');
    this.userText_wide_tex = this.loadTexture('image/userText_wide.png');
    this.userText_narrow_tex = this.loadTexture('image/userText_narrow.png');
    this.imageRendererMaterial = this.scene.assetMgr.SyncLoad('material/translation.material');
  }

  loadTexture(path) {
    if (this.scene && this.scene.assetMgr) {
      const pngMeta = new Amaz.PngMeta();
      pngMeta.needFlipY = true;
      pngMeta.innerAlphaPremul = false;
      pngMeta.outerAlphaPremul = false;
      return this.scene.assetMgr.SyncLoadWithMeta(path, pngMeta);
    }
  }

  hideUIWhenRecording(event) {
    const EVENT_CODE_RECORD_START = 1; // Event code triggered with recording start event
    const EVENT_CODE_RECORD_END = 2;
    if (event.type !== Amaz.AppEventType.COMPAT_BEF || event.args.size() < 2) {
      return;
    }
    const eventType = event.args.get(0);
    const eventCode = event.args.get(1);
    if (eventType !== Amaz.BEFEventType.BET_RECORD_VIDEO) {
      return;
    }
    if (eventCode === EVENT_CODE_RECORD_START) {
      this.translated_wide.visible = false;
      this.translated_narrow.visible = false;
      this.userText_wide.visible = false;
      this.userText_narrow.visible = false;
      this.translationButtonsEnabled = false;
    } else if (eventCode === EVENT_CODE_RECORD_END) {
      this.translationButtonsEnabled = true;
      this.hideUIImages();
    }
  }

  onEvent(event) {
    if (this.translationFailure) return;

    if (TranslationDataStorage.translationsLoaded === false || this.firstCam === null) {
      return;
    }

    this.hideUIWhenRecording(event);

    if (!this.translationButtonsEnabled) {
      return;
    }

    if (!event.args || event.args.size() === 0) {
      return;
    }
    const touch = event.args.get(0);

    if (touch.type === Amaz.TouchType.TOUCH_BEGAN) {
      const tapPos = new APJS.Vector2f();
      tapPos.set(touch.x, 1 - touch.y);

      if (this.translationImageState === 1 || this.translationImageState === 3) {
        if (
          tapPos.x > this.lowerX_wide &&
          tapPos.x < this.upperX_wide &&
          tapPos.y > this.lowerY_wide &&
          tapPos.y < this.upperY_wide
        ) {
          if (this.translationImageState === 1) {
            this.translationImageState = 3;
            TranslationDataStorage.useUserText = true;
            this.updateAllTranslationOnComponents();
          } else {
            this.translationImageState = 1;
            TranslationDataStorage.useUserText = false;
            this.updateAllTranslationOnComponents();
          }
          this.sendAnalyticalEvent('translation_btn_click');
          this.hideUIImages();
        }
      } else {
        if (
          tapPos.x > this.lowerX_wide &&
          tapPos.x < this.upperX_narrow &&
          tapPos.y > this.lowerY_wide &&
          tapPos.y < this.upperY_wide
        ) {
          if (this.translationImageState === 2) {
            this.translationImageState = 3;
            TranslationDataStorage.useUserText = true;
            this.updateAllTranslationOnComponents();
          } else {
            this.translationImageState = 1;
            TranslationDataStorage.useUserText = false;
            this.updateAllTranslationOnComponents();
          }
          this.sendAnalyticalEvent('translation_btn_click');
          this.hideUIImages();
        }
      }
    }
  }

  hideUIImages() {
    this.timeUntilNarrow = 2;
    this.translated_wide.visible = false;
    this.translated_narrow.visible = false;
    this.userText_wide.visible = false;
    this.userText_narrow.visible = false;
    switch (this.translationImageState) {
      case 1:
        this.translated_wide.visible = true;
        break;
      case 2:
        this.translated_narrow.visible = true;
        break;
      case 3:
        this.userText_wide.visible = true;
        break;
      case 4:
        this.userText_narrow.visible = true;
        break;
    }
  }

  onDestroy(sys) {}

  onComponentAdded(comp) {
    if (this.translationFailure) return;
    //const supportComps = ['Text3D', 'Text'];
    const supportComps = ['Text'];
    if (supportComps.includes(comp.constructor.name)) {
      this.allComponentsNeedingToBeProcessed.push(comp);
    }
  }

  processAllAddedComponents() {
    for (let i = 0; i < this.allComponentsNeedingToBeProcessed.length; i++) {
      this.processAddedComponent(this.allComponentsNeedingToBeProcessed[i]);
    }
    this.allComponentsNeedingToBeProcessed = [];
  }

  processAddedComponent(comp) {
    if (comp.constructor.name === 'Text3D') {
      
      const formattedGUID = comp.guid.toString().replace(/Guid\((\d+),\s*(\d+)\)/, '$1_$2');
      TranslationDataStorage.textComponentsToTranslate.set(formattedGUID, comp);
      const translatedText = TranslationDataStorage.translateText(comp.str, formattedGUID);
      comp.str = translatedText;
      return;
    } else if (comp.constructor.name === 'Text') {
      const jsScriptComps = comp.entity.getComponents('JSScriptComponent');
      for (let i = 0; i < jsScriptComps.size(); i++) {
        const jsScriptComp = jsScriptComps.get(i);
        const className = jsScriptComp.getScript().className;

        if (className === 'Text') {
          const formattedGUID = jsScriptComp.guid.toString().replace(/Guid\((\d+),\s*(\d+)\)/, '$1_$2');
          TranslationDataStorage.textComponentsToTranslate.set(formattedGUID, comp);
          const translatedText = TranslationDataStorage.translateText(
            jsScriptComp.getScript().ref.input,
            formattedGUID
          );
          jsScriptComp.getScript().ref.input = translatedText;
          return;
        }
      }
    }
  }

  updateAllTranslationOnComponents() {
    TranslationDataStorage.textComponentsToTranslate.forEach((value, key) => {
      this.updateTranslationOnComponent(key, value);
    });
  }

  updateTranslationOnComponent(formattedGUID, comp) {
    if (comp.constructor.name === 'Text3D') {
      const translatedText = TranslationDataStorage.translateButtonAction(comp.str, formattedGUID);
      comp.str = translatedText;
      return;
    } else if (comp.constructor.name === 'Text') {
      const jsScriptComps = comp.entity.getComponents('JSScriptComponent');
      for (let i = 0; i < jsScriptComps.size(); i++) {
        const jsScriptComp = jsScriptComps.get(i);
        const className = jsScriptComp.getScript().className;

        if (className === 'Text') {
          const translatedText = TranslationDataStorage.translateButtonAction(jsScriptComp.getScript().ref.input, formattedGUID);
          jsScriptComp.getScript().ref.input = translatedText;
          return;
        }
      }
    }
  }

  onComponentRemoved(comp) {
    let formattedGUID = '';
    if (comp.constructor.name === 'Text3D') {
      formattedGUID = comp.guid.toString().replace(/Guid\((\d+),\s*(\d+)\)/, '$1_$2');
    } else if (comp.constructor.name === 'Text') {
      const jsScriptComps = comp.entity.getComponents('JSScriptComponent');
      for (let i = 0; i < jsScriptComps.size(); i++) {
        const jsScriptComp = jsScriptComps.get(i);
        const className = jsScriptComp.getScript().className;

        if (className === 'Text') {
          formattedGUID = jsScriptComp.guid.toString().replace(/Guid\((\d+),\s*(\d+)\)/, '$1_$2');
          break;
        }
      }
    }
    if (formattedGUID === '') return;
    if (TranslationDataStorage.textComponentsToTranslate.has(formattedGUID)) {
      TranslationDataStorage.textComponentsToTranslate.delete(formattedGUID);
    }
  }

  createHighestSortOrderCamera() {
    let renderOrder = 0;
    const entities = this.scene.entities;
    this.firstCam = null;
    for (let i = 0; i < entities.size(); i++) {
      const cams = entities.get(i).getComponents('Camera');
      for (let j = 0; j < cams.size(); ++j) {
        const cam = cams.get(j);
        if (this.firstCam === null && cam.entity.visible === true) {
          this.firstCam = cam.entity.getComponent('Transform');
        }
        if (cam.renderOrder > renderOrder) {
          renderOrder = cam.renderOrder;
        }
      }
    }
    if (this.firstCam === null) return;
    this.addCameraEntityToNativeScene(renderOrder + 1);
  }

  addCameraEntityToNativeScene(renderOrder) {
    const effectNodeEntity = this.scene.createEntity('MultiLangSupport_EffectNode');
    effectNodeEntity.layer = 0; // set effectNodeEntity's layer to 0
    const effectNodeTrans = effectNodeEntity.addComponent('Transform');
    const effectNodeComponent = effectNodeEntity.addComponent('EffectNode');
    effectNodeComponent.outputTextures = new Amaz.Vector();
    const rt = new Amaz.SceneOutputRT();
    effectNodeComponent.outputTextures.pushBack(rt);
    effectNodeComponent.renderOrder = 888888;
    effectNodeComponent.minorOrder = 0;
    effectNodeComponent.rendererType = Amaz.RendererType.OpenGLES30;
    effectNodeComponent.version = 2;
    effectNodeComponent.type = Amaz.EffectNodeTag.Other;

    this.newCam = this.scene.createEntity('Translation_UI_Camera');
    const trans = this.newCam.addComponent('Transform');
    const ca = this.newCam.addComponent('Camera');
    effectNodeTrans.addTransform(trans);
    trans.localPosition = new Amaz.Vector3f(0.0, 0.0, 10.0);
    trans.localEulerAngle = new Amaz.Vector3f(0.0, 0.0, 0.0);
    trans.localScale = new Amaz.Vector3f(1.0, 1.0, 1.0);
    ca.type = Amaz.CameraType.ORTHO;
    ca.clearType = Amaz.CameraClearType.DEPTH;
    ca.clearColor = new Amaz.Color(0, 0, 0, 1);
    ca.alwaysClear = true;
    ca.fovy = 60.0;
    ca.zNear = 0.1;
    ca.zFar = 1000.0;
    ca.orthoScale = 1.0;
    ca.renderOrder = renderOrder;
    const layerObj = new Amaz.DynamicBitset(65, 0);
    layerObj.set(64);
    ca.layerVisibleMask = layerObj;
    ca.renderTexture = rt;
  }

  createUI() {
    const parentWidth = 335;
    const parentHeight = 357;
    if (TranslationDataStorage.languageCode === 'ar') {
      this.arabicButtonOffset = 50;
      this.lowerX_wide = this.lowerX_wide + this.touchArabicButtonOffset;
      this.upperX_wide = this.upperX_wide + this.touchArabicButtonOffset;
      this.upperX_narrow = this.upperX_narrow + this.touchArabicButtonOffset;
    }

    this.translated_wide = this.createImageEntity(
      'translated_wide',
      this.translated_wide_tex,
      14 + this.arabicButtonOffset,
      125,
      168,
      40,
      this.newCam,
      parentWidth,
      parentHeight,
      true
    );
    this.translated_narrow = this.createImageEntity(
      'translated_narrow',
      this.translated_narrow_tex,
      14 + this.arabicButtonOffset,
      125,
      40,
      40,
      this.newCam,
      parentWidth,
      parentHeight,
      true
    );
    this.userText_wide = this.createImageEntity(
      'userText_wide',
      this.userText_wide_tex,
      14 + this.arabicButtonOffset,
      125,
      146,
      40,
      this.newCam,
      parentWidth,
      parentHeight,
      true
    );
    this.userText_narrow = this.createImageEntity(
      'userText_narrow',
      this.userText_narrow_tex,
      14 + this.arabicButtonOffset,
      125,
      40,
      40,
      this.newCam,
      parentWidth,
      parentHeight,
      true
    );
  }

  createImageEntity(
    name,
    tex,
    left,
    top,
    width,
    height,
    parent,
    parentWidth,
    parentHeight,
    visible = true,
    imageMaterial
  ) {
    imageMaterial = imageMaterial || this.imageRendererMaterial;
    const entity = this.createContainerEntity(
      name,
      left,
      top,
      width,
      height,
      parent,
      parentWidth,
      parentHeight,
      visible
    );
    const imageRenderer = entity.addComponent('ImageRenderer');

    imageRenderer.sharedMaterial = imageMaterial;
    imageRenderer.stretchMode = Amaz.ImageStretchMode.Stretch;
    // imageRenderer.material.setTexture('_MainTex', tex);
    imageRenderer.texture = tex;
    imageRenderer.sortingOrder = 0;
    entity.layer = 64;

    return entity;
  }

  createContainerEntity(name, left, top, width, height, parent, parentWidth, parentHeight, visible = true) {
    const entity = this.scene.createEntity(name);
    const trans = entity.addComponent('ScreenTransform');
    // trans.localScale = new Amaz.Vector3f(0.25, 0.25, 0.25);
    trans.localPosition = new Amaz.Vector3f(0, 0, -20);
    trans.sizeDelta = new Amaz.Vector2f(0, 0);
    const leftRatio = pxToRefRatio(left, 390);
    const rightRatio = pxToRefRatio(left + width, 390);
    const bottomRatio = pxToRefRatio(694 - top - height, 694);
    const topRatio = pxToRefRatio(694 - top, 694);
    trans.anchors = new Amaz.Vector4f(leftRatio, rightRatio, bottomRatio, topRatio);

    const parentTrans = parent.getComponent('Transform');
    parentTrans.addTransform(trans);

    entity.visible = visible;
    return entity;
  }

  utf8ByteToUnicodeStr(utf8Bytes) {
    let unicodeStr = '';
    for (let pos = 0; pos < utf8Bytes.length; ) {
      const flag = utf8Bytes[pos];
      let unicode = 0;
      if (flag >>> 7 === 0) {
        unicodeStr += String.fromCharCode(utf8Bytes[pos]);
        pos += 1;
      } else if ((flag & 0xfc) === 0xfc) {
        unicode = (utf8Bytes[pos] & 0x3) << 30;
        unicode |= (utf8Bytes[pos + 1] & 0x3f) << 24;
        unicode |= (utf8Bytes[pos + 2] & 0x3f) << 18;
        unicode |= (utf8Bytes[pos + 3] & 0x3f) << 12;
        unicode |= (utf8Bytes[pos + 4] & 0x3f) << 6;
        unicode |= utf8Bytes[pos + 5] & 0x3f;
        unicodeStr += String.fromCharCode(unicode);
        pos += 6;
      } else if ((flag & 0xf8) === 0xf8) {
        unicode = (utf8Bytes[pos] & 0x7) << 24;
        unicode |= (utf8Bytes[pos + 1] & 0x3f) << 18;
        unicode |= (utf8Bytes[pos + 2] & 0x3f) << 12;
        unicode |= (utf8Bytes[pos + 3] & 0x3f) << 6;
        unicode |= utf8Bytes[pos + 4] & 0x3f;
        unicodeStr += String.fromCharCode(unicode);
        pos += 5;
      } else if ((flag & 0xf0) === 0xf0) {
        unicode = (utf8Bytes[pos] & 0xf) << 18;
        unicode |= (utf8Bytes[pos + 1] & 0x3f) << 12;
        unicode |= (utf8Bytes[pos + 2] & 0x3f) << 6;
        unicode |= utf8Bytes[pos + 3] & 0x3f;
        unicodeStr += String.fromCharCode(unicode);
        pos += 4;
      } else if ((flag & 0xe0) === 0xe0) {
        unicode = (utf8Bytes[pos] & 0x1f) << 12;
        unicode |= (utf8Bytes[pos + 1] & 0x3f) << 6;
        unicode |= utf8Bytes[pos + 2] & 0x3f;
        unicodeStr += String.fromCharCode(unicode);
        pos += 3;
      } else if ((flag & 0xc0) === 0xc0) {
        unicode = (utf8Bytes[pos] & 0x3f) << 6;
        unicode |= utf8Bytes[pos + 1] & 0x3f;
        unicodeStr += String.fromCharCode(unicode);
        pos += 2;
      } else {
        unicodeStr += String.fromCharCode(utf8Bytes[pos]);
        pos += 1;
      }
    }
    return unicodeStr;
  }
  ab2str(buf) {
    const array = new Uint8Array(buf);
    return this.utf8ByteToUnicodeStr(array);
  }
}

MultiLangSupport.instance = null;

exports.MultiLangSupport = MultiLangSupport;
