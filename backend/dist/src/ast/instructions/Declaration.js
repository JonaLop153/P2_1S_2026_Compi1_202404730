"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Declaration = void 0;
const Node_1 = require("../Node");
class Declaration extends Node_1.Node {
    constructor(name, declaredType, expression, mode, line, column) {
        super("Declaration", line, column);
        this.name = name;
        this.declaredType = declaredType;
        this.expression = expression;
        this.mode = mode;
    }
    label() {
        return `Declaration\\n${this.name}`;
    }
    children() {
        return [this.expression];
    }
}
exports.Declaration = Declaration;
