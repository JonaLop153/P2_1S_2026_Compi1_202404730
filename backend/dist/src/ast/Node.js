"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
class Node {
    constructor(kind, line, column) {
        this.kind = kind;
        this.line = line;
        this.column = column;
    }
}
exports.Node = Node;
