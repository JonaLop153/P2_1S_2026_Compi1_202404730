"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticError = void 0;
const BaseProjectError_1 = require("./BaseProjectError");
class SemanticError extends BaseProjectError_1.BaseProjectError {
    constructor(description, line, column) {
        super("Semántico", description, line, column);
    }
}
exports.SemanticError = SemanticError;
