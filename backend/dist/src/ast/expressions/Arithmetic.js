"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Arithmetic = void 0;
const Node_1 = require("../Node");
class Arithmetic extends Node_1.Node {
    constructor(operator, left, right, line, column) {
        super("Arithmetic", line, column);
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
    label() {
        return `Arithmetic\\n${this.operator}`;
    }
    children() {
        return [this.left, this.right];
    }
}
exports.Arithmetic = Arithmetic;
