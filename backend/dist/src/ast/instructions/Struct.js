"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructInstruction = void 0;
const Node_1 = require("../Node");
class StructInstruction extends Node_1.Node {
    constructor(name, fields, line, column) {
        super("Struct", line, column);
        this.name = name;
        this.fields = fields;
    }
    label() {
        return `Struct\\n${this.name}`;
    }
    children() {
        return [];
    }
}
exports.StructInstruction = StructInstruction;
