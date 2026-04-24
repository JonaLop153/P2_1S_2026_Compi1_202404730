"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Relational = void 0;
const Node_1 = require("../Node");
class Relational extends Node_1.Node {
    constructor(operator, left, right, line, column) {
        super("Relational", line, column);
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
    label() {
        return `Relational\\n${this.operator}`;
    }
    children() {
        return [this.left, this.right];
    }
}
exports.Relational = Relational;
