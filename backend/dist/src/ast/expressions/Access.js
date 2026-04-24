"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Access = void 0;
const Node_1 = require("../Node");
class Access extends Node_1.Node {
    constructor(target, parts, line, column) {
        super("Access", line, column);
        this.target = target;
        this.parts = parts;
    }
    label() {
        return "Access";
    }
    children() {
        return [this.target, ...this.parts.map((part) => (part.kind === "index" ? part.expression : null))];
    }
}
exports.Access = Access;
