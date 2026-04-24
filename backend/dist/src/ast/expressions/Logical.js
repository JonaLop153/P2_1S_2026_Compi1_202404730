"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logical = void 0;
const Node_1 = require("../Node");
class Logical extends Node_1.Node {
    constructor(operator, left, right, line, column) {
        super("Logical", line, column);
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
    label() {
        return `Logical\\n${this.operator}`;
    }
    children() {
        return [this.left, this.right];
    }
}
exports.Logical = Logical;
