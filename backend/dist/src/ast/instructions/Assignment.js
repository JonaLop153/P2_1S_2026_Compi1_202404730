"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assignment = void 0;
const Node_1 = require("../Node");
class Assignment extends Node_1.Node {
    constructor(target, operator, expression, line, column) {
        super("Assignment", line, column);
        this.target = target;
        this.operator = operator;
        this.expression = expression;
    }
    label() {
        return `Assignment\\n${this.operator}`;
    }
    children() {
        return [this.target, this.expression];
    }
}
exports.Assignment = Assignment;
