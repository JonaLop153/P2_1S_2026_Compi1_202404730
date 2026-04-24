"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntaxError = void 0;
const BaseProjectError_1 = require("./BaseProjectError");
class SyntaxError extends BaseProjectError_1.BaseProjectError {
    constructor(description, line, column) {
        super("Sintáctico", description, line, column);
    }
}
exports.SyntaxError = SyntaxError;
