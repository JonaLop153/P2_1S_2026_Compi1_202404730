"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructLiteral = void 0;
const Node_1 = require("../Node");
class StructLiteral extends Node_1.Node {
    constructor(structName, fields, line, column) {
        super("StructLiteral", line, column);
        this.structName = structName;
        this.fields = fields;
    }
    label() {
        return `StructLiteral\\n${this.structName}`;
    }
    children() {
        return [this.fields.map((item) => item.expression)];
    }
}
exports.StructLiteral = StructLiteral;
