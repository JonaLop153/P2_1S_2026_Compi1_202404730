"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwitchInstruction = void 0;
const Node_1 = require("../Node");
class SwitchInstruction extends Node_1.Node {
    constructor(expression, cases, defaultBody, line, column) {
        super("Switch", line, column);
        this.expression = expression;
        this.cases = cases;
        this.defaultBody = defaultBody;
    }
    label() {
        return "Switch";
    }
    children() {
        return [this.expression, ...this.cases.flatMap((item) => [item.match, item.body]), this.defaultBody];
    }
}
exports.SwitchInstruction = SwitchInstruction;
