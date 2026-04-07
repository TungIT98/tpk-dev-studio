const TranslationDataStorage = {
  translationByUserText: new Map(),
  translationMap: new Map(),
  textComponentsToTranslate: new Map(),
  translationOriginalTextMap: new Map(),
  languageCode: 'userText',
  useUserText: false,
  translationsLoaded: false,
  translateText(text, formattedGUID = undefined) {
    if (formattedGUID) {
      this.translationOriginalTextMap.set(formattedGUID, text);
    }
    if (this.useUserText) {
      return text;
    } else {
      const translation = this.translationByUserText.get(text);
      if (translation) {
        return translation;
      }
      return text;
    }
  },
  translateButtonAction(text, formattedGUID) {
    if (this.useUserText) {
      return this.translationOriginalTextMap.get(formattedGUID);
    } else {
      const translation = this.translationByUserText.get(text);
      if (translation) {
        return translation;
      }
      return text;
    }
  },
};
exports.TranslationDataStorage = TranslationDataStorage;
