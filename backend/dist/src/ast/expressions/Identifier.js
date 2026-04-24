"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Identifier = void 0;
const Node_1 = require("../Node");
class Identifier extends Node_1.Node {
    constructor(name, line, column) {
        super("Identifier", line, column);
        this.name = name;
    }
    label() {
        return `Id\\n${this.name}`;
    }
    children() {
        return [];
    }
}
exports.Identifier = Identifier;
