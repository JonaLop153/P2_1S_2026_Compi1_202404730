"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SliceLiteral = void 0;
const Node_1 = require("../Node");
class SliceLiteral extends Node_1.Node {
    constructor(valueType, values, line, column) {
        super("SliceLiteral", line, column);
        this.valueType = valueType;
        this.values = values;
    }
    label() {
        return `Slice\\n${this.valueType}`;
    }
    children() {
        return [this.values];
    }
}
exports.SliceLiteral = SliceLiteral;
