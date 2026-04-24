"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LexicalError = void 0;
const BaseProjectError_1 = require("./BaseProjectError");
class LexicalError extends BaseProjectError_1.BaseProjectError {
    constructor(description, line, column) {
        super("Léxico", description, line, column);
    }
}
exports.LexicalError = LexicalError;
