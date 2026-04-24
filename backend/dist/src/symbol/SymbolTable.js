"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolTable = void 0;
class SymbolTable {
    constructor() {
        this.symbols = [];
    }
    add(record) {
        this.symbols.push(record);
    }
    all() {
        return [...this.symbols];
    }
    clear() {
        this.symbols.length = 0;
    }
}
exports.SymbolTable = SymbolTable;
