"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContinueInstruction = void 0;
const Node_1 = require("../Node");
class ContinueInstruction extends Node_1.Node {
    constructor(line, column) {
        super("Continue", line, column);
    }
    label() {
        return "Continue";
    }
    children() {
        return [];
    }
}
exports.ContinueInstruction = ContinueInstruction;
