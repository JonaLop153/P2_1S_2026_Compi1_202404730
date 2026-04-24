import fs from "fs";
import path from "path";
import { Node } from "../ast/Node";
import { Access, AccessPart } from "../ast/expressions/Access";
import { Arithmetic } from "../ast/expressions/Arithmetic";
import { CallFunction } from "../ast/expressions/CallFunction";
import { Identifier } from "../ast/expressions/Identifier";
import { Literal } from "../ast/expressions/Literal";
import { Logical } from "../ast/expressions/Logical";
import { Relational } from "../ast/expressions/Relational";
import { SliceLiteral } from "../ast/expressions/SliceLiteral";
import { StructLiteral } from "../ast/expressions/StructLiteral";
import { Assignment } from "../ast/instructions/Assignment";
import { BlockInstruction } from "../ast/instructions/Block";
import { BreakInstruction } from "../ast/instructions/Break";
import { ContinueInstruction } from "../ast/instructions/Continue";
import { Declaration } from "../ast/instructions/Declaration";
import { ExpressionStatement } from "../ast/instructions/ExpressionStatement";
import { ForInstruction } from "../ast/instructions/For";
import { FunctionInstruction } from "../ast/instructions/Function";
import { IfInstruction } from "../ast/instructions/If";
import { MainInstruction } from "../ast/instructions/Main";
import { PrintInstruction } from "../ast/instructions/Print";
import { ReturnInstruction } from "../ast/instructions/Return";
import { StructInstruction } from "../ast/instructions/Struct";
import { SwitchInstruction } from "../ast/instructions/Switch";
import { LexicalError } from "../errors/LexicalError";
import { SyntaxError } from "../errors/SyntaxError";
import { ErrorList } from "../errors/ErrorList";

const { Parser } = require("jison");

function buildParser() {
  const localGrammar = path.join(__dirname, "grammar.jison");
  const sourceGrammar = path.resolve(__dirname, "../../src/analyzer/grammar.jison");
  const grammarPath = fs.existsSync(localGrammar) ? localGrammar : sourceGrammar;
  const grammar = fs.readFileSync(grammarPath, "utf8");
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalError = console.error;
  console.warn = () => undefined;
  console.log = () => undefined;
  console.error = () => undefined;
  try {
    return new Parser(grammar);
  } finally {
    console.warn = originalWarn;
    console.log = originalLog;
    console.error = originalError;
  }
}

function transform(raw: any): Node {
  switch (raw.kind) {
    case "Literal": return new Literal(raw.valueType, raw.value, raw.line, raw.column);
    case "Identifier": return new Identifier(raw.name, raw.line, raw.column);
    case "Arithmetic": return new Arithmetic(raw.operator, transform(raw.left), raw.right ? transform(raw.right) : null, raw.line, raw.column);
    case "Relational": return new Relational(raw.operator, transform(raw.left), transform(raw.right), raw.line, raw.column);
    case "Logical": return new Logical(raw.operator, transform(raw.left), raw.right ? transform(raw.right) : null, raw.line, raw.column);
    case "CallFunction": return new CallFunction(raw.callee, raw.args.map(transform), raw.line, raw.column);
    case "Access": return new Access(transform(raw.target), raw.parts.map((part: any): AccessPart => (part.kind === "index" ? { kind: "index", expression: transform(part.expression) } : { kind: "property", name: part.name })), raw.line, raw.column);
    case "SliceLiteral": return new SliceLiteral(raw.valueType, raw.values.map(transform), raw.line, raw.column);
    case "InnerSlice": return new SliceLiteral("__inner__", raw.values.map(transform), raw.line, raw.column);
    case "StructLiteral": return new StructLiteral(raw.structName, raw.fields.map((field: any) => ({ name: field.name, expression: transform(field.expression) })), raw.line, raw.column);
    case "Declaration": return new Declaration(raw.name, raw.declaredType, raw.expression ? transform(raw.expression) : null, raw.mode, raw.line, raw.column);
    case "Assignment": return new Assignment(transform(raw.target), raw.operator, transform(raw.expression), raw.line, raw.column);
    case "If": return new IfInstruction(transform(raw.condition), raw.thenBody.map(transform), raw.elseIfs.map((branch: any) => ({ condition: transform(branch.condition), body: branch.body.map(transform) })), raw.elseBody ? raw.elseBody.map(transform) : null, raw.line, raw.column);
    case "Switch": return new SwitchInstruction(transform(raw.expression), raw.cases.map((item: any) => ({ match: transform(item.match), body: item.body.map(transform) })), raw.defaultBody ? raw.defaultBody.map(transform) : null, raw.line, raw.column);
    case "For": return new ForInstruction(raw.mode, raw.initializer ? transform(raw.initializer) : null, raw.condition ? transform(raw.condition) : null, raw.update ? transform(raw.update) : null, raw.rangeIndex, raw.rangeValue, raw.rangeSource ? transform(raw.rangeSource) : null, raw.body.map(transform), raw.line, raw.column);
    case "Break": return new BreakInstruction(raw.line, raw.column);
    case "Continue": return new ContinueInstruction(raw.line, raw.column);
    case "Return": return new ReturnInstruction(raw.expression ? transform(raw.expression) : null, raw.line, raw.column);
    case "Function": return new FunctionInstruction(raw.name, raw.params, raw.returnType, raw.body.map(transform), raw.line, raw.column);
    case "Main": return new MainInstruction(raw.body.map(transform), raw.line, raw.column);
    case "Print": return new PrintInstruction(raw.args.map(transform), raw.line, raw.column);
    case "Struct": return new StructInstruction(raw.name, raw.fields, raw.line, raw.column);
    case "ExpressionStatement": return new ExpressionStatement(transform(raw.expression), raw.line, raw.column);
    case "Block": return new BlockInstruction(raw.body.map(transform), raw.line, raw.column);
    default: throw new Error(`Nodo crudo no soportado: ${raw.kind}`);
  }
}

export function parse(source: string): { ast: Node[]; errors: ReturnType<ErrorList["all"]> } {
  const parser = buildParser();
  const errors = new ErrorList();
  parser.yy.parseError = (message: string, hash: any) => {
    errors.add(new SyntaxError(message, hash.loc?.first_line ?? 0, (hash.loc?.first_column ?? 0) + 1));
  };

  try {
    const result = parser.parse(source);
    const ast = (result as any[]).map(transform);
    return { ast, errors: errors.all() };
  } catch (error: any) {
    if (error?.hash?.text) {
      errors.add(new LexicalError(`Símbolo no reconocido: ${error.hash.text}`, error.hash.loc?.first_line ?? 0, (error.hash.loc?.first_column ?? 0) + 1));
    } else if (error instanceof Error) {
      errors.add(new SyntaxError(error.message, 0, 0));
    }
    return { ast: [], errors: errors.all() };
  }
}
