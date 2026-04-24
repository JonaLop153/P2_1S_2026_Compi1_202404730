"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockInstruction = void 0;
const Node_1 = require("../Node");
class BlockInstruction extends Node_1.Node {
    constructor(body, line, column) {
        super("Block", line, column);
        this.body = body;
    }
    label() {
        return "Block";
    }
    children() {
        return [this.body];
    }
}
exports.BlockInstruction = BlockInstruction;
