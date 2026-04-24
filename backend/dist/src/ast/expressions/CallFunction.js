"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallFunction = void 0;
const Node_1 = require("../Node");
class CallFunction extends Node_1.Node {
    constructor(callee, args, line, column) {
        super("CallFunction", line, column);
        this.callee = callee;
        this.args = args;
    }
    label() {
        return `Call\\n${this.callee}`;
    }
    children() {
        return [this.args];
    }
}
exports.CallFunction = CallFunction;
