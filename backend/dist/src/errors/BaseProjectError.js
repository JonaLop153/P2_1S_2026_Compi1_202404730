"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProjectError = void 0;
class BaseProjectError extends Error {
    constructor(kind, description, line, column) {
        super(description);
        this.kind = kind;
        this.description = description;
        this.line = line;
        this.column = column;
    }
}
exports.BaseProjectError = BaseProjectError;
