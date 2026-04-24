"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionInstruction = void 0;
const Node_1 = require("../Node");
class FunctionInstruction extends Node_1.Node {
    constructor(name, params, returnType, body, line, column) {
        super("Function", line, column);
        this.name = name;
        this.params = params;
        this.returnType = returnType;
        this.body = body;
    }
    label() {
        return `Function\\n${this.name}`;
    }
    children() {
        return [this.body];
    }
}
exports.FunctionInstruction = FunctionInstruction;
