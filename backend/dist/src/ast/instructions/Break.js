"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakInstruction = void 0;
const Node_1 = require("../Node");
class BreakInstruction extends Node_1.Node {
    constructor(line, column) {
        super("Break", line, column);
    }
    label() {
        return "Break";
    }
    children() {
        return [];
    }
}
exports.BreakInstruction = BreakInstruction;
