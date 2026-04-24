"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IfInstruction = void 0;
const Node_1 = require("../Node");
class IfInstruction extends Node_1.Node {
    constructor(condition, thenBody, elseIfs, elseBody, line, column) {
        super("If", line, column);
        this.condition = condition;
        this.thenBody = thenBody;
        this.elseIfs = elseIfs;
        this.elseBody = elseBody;
    }
    label() {
        return "If";
    }
    children() {
        return [this.condition, this.thenBody, ...this.elseIfs.flatMap((branch) => [branch.condition, branch.body]), this.elseBody];
    }
}
exports.IfInstruction = IfInstruction;
