"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForInstruction = void 0;
const Node_1 = require("../Node");
class ForInstruction extends Node_1.Node {
    constructor(mode, initializer, condition, update, rangeIndex, rangeValue, rangeSource, body, line, column) {
        super("For", line, column);
        this.mode = mode;
        this.initializer = initializer;
        this.condition = condition;
        this.update = update;
        this.rangeIndex = rangeIndex;
        this.rangeValue = rangeValue;
        this.rangeSource = rangeSource;
        this.body = body;
    }
    label() {
        return `For\\n${this.mode}`;
    }
    children() {
        return [this.initializer, this.condition, this.update, this.rangeSource, this.body];
    }
}
exports.ForInstruction = ForInstruction;
