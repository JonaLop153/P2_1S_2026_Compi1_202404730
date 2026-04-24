"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTReport = void 0;
const Graphviz_1 = require("../utils/Graphviz");
class ASTReport {
    static generate(nodes) {
        return Graphviz_1.Graphviz.build(nodes);
    }
}
exports.ASTReport = ASTReport;
