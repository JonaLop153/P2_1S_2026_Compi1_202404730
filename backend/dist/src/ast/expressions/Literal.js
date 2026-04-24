"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Literal = void 0;
const Node_1 = require("../Node");
class Literal extends Node_1.Node {
    constructor(valueType, value, line, column) {
        super("Literal", line, column);
        this.valueType = valueType;
        this.value = value;
    }
    label() {
        return `Literal\\n${this.valueType}`;
    }
    children() {
        return [];
    }
}
exports.Literal = Literal;
