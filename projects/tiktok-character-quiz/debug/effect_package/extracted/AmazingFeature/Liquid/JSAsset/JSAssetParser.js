"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LiquidUtils_1 = require("../Utils/LiquidUtils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const liquidjs_1 = require("liquidjs");
const path_1 = __importDefault(require("path"));
let templateStr = '';
try {
    let resPath = path_1.default.join(__dirname, 'JSAssetProvider.liquid');
    let ret = fs_extra_1.default.readFileSync(resPath);
    templateStr = ret.toString();
}
catch (err) {
    if (err instanceof Error) {
        console.error(err.message);
    }
}
try {
    const metaData = JSON.parse(fs_extra_1.default.readFileSync(path_1.default.resolve(__dirname, 'JSAssetMetaData.json')).toString('utf-8'));
    const validMetaData = LiquidUtils_1.LiquidUtils.generateValidMetaData(metaData);
    const engine = new liquidjs_1.Liquid({
        extname: '.liquid',
        jsTruthy: true,
        trimTagRight: true,
        trimTagLeft: true,
        greedy: false,
        cache: 1024 * 1024 * 1024,
    });
    engine.registerFilter('valid', LiquidUtils_1.LiquidUtils.validType);
    const sysScript = engine.parseAndRenderSync(templateStr, validMetaData);
    fs_extra_1.default.writeFileSync(path_1.default.resolve(__dirname, 'JSAssetProvider.js'), sysScript);
}
catch (err) {
    if (err instanceof Error) {
        console.error(err.message);
    }
}
