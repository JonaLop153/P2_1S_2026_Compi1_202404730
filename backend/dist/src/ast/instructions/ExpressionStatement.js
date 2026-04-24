"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionStatement = void 0;
const Node_1 = require("../Node");
class ExpressionStatement extends Node_1.Node {
    constructor(expression, line, column) {
        super("ExpressionStatement", line, column);
        this.expression = expression;
    }
    label() {
        return "ExprStmt";
    }
    children() {
        return [this.expression];
    }
}
exports.ExpressionStatement = ExpressionStatement;
