import express from "express";
import cors from "cors";
import { parse } from "./analyzer/parser";
import { Interpreter } from "./interpreter/Interpreter";
import { ASTReport } from "./reports/ASTReport";
import { ErrorReport } from "./reports/ErrorReport";
import { SymbolReport } from "./reports/SymbolReport";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/analyze", (req, res) => {
  const source = String(req.body?.source ?? "");
  const parsed = parse(source);
  const interpreter = new Interpreter();
  const execution = parsed.errors.length ? { console: [], errors: [], symbols: [] } : interpreter.execute(parsed.ast);
  const allErrors = [...parsed.errors, ...execution.errors];

  res.json({
    console: execution.console,
    errors: ErrorReport.generate(allErrors),
    symbols: SymbolReport.generate(execution.symbols),
    astDot: ASTReport.generate(parsed.ast)
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});
