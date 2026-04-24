"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const parser_1 = require("./analyzer/parser");
const Interpreter_1 = require("./interpreter/Interpreter");
const ASTReport_1 = require("./reports/ASTReport");
const ErrorReport_1 = require("./reports/ErrorReport");
const SymbolReport_1 = require("./reports/SymbolReport");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "2mb" }));
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
app.post("/analyze", (req, res) => {
    const source = String(req.body?.source ?? "");
    const parsed = (0, parser_1.parse)(source);
    const interpreter = new Interpreter_1.Interpreter();
    const execution = parsed.errors.length ? { console: [], errors: [], symbols: [] } : interpreter.execute(parsed.ast);
    const allErrors = [...parsed.errors, ...execution.errors];
    res.json({
        console: execution.console,
        errors: ErrorReport_1.ErrorReport.generate(allErrors),
        symbols: SymbolReport_1.SymbolReport.generate(execution.symbols),
        astDot: ASTReport_1.ASTReport.generate(parsed.ast)
    });
});
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor backend escuchando en http://localhost:${port}`);
});
