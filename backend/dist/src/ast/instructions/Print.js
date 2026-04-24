"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintInstruction = void 0;
const Node_1 = require("../Node");
class PrintInstruction extends Node_1.Node {
    constructor(args, line, column) {
        super("Print", line, column);
        this.args = args;
    }
    label() {
        return "Print";
    }
    children() {
        return [this.args];
    }
}
exports.PrintInstruction = PrintInstruction;
