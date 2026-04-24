"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnInstruction = void 0;
const Node_1 = require("../Node");
class ReturnInstruction extends Node_1.Node {
    constructor(expression, line, column) {
        super("Return", line, column);
        this.expression = expression;
    }
    label() {
        return "Return";
    }
    children() {
        return [this.expression];
    }
}
exports.ReturnInstruction = ReturnInstruction;
