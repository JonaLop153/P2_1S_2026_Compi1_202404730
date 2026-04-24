"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorList = void 0;
class ErrorList {
    constructor() {
        this.items = [];
    }
    add(error) {
        this.items.push(error);
    }
    all() {
        return [...this.items];
    }
    hasErrors() {
        return this.items.length > 0;
    }
    clear() {
        this.items.length = 0;
    }
}
exports.ErrorList = ErrorList;
