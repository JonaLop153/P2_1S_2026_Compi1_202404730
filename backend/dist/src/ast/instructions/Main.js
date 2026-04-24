"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainInstruction = void 0;
const Function_1 = require("./Function");
class MainInstruction extends Function_1.FunctionInstruction {
    constructor(body, line, column) {
        super("main", [], null, body, line, column);
    }
}
exports.MainInstruction = MainInstruction;
