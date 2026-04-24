"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Access_1 = require("../ast/expressions/Access");
const Arithmetic_1 = require("../ast/expressions/Arithmetic");
const CallFunction_1 = require("../ast/expressions/CallFunction");
const Identifier_1 = require("../ast/expressions/Identifier");
const Literal_1 = require("../ast/expressions/Literal");
const Logical_1 = require("../ast/expressions/Logical");
const Relational_1 = require("../ast/expressions/Relational");
const SliceLiteral_1 = require("../ast/expressions/SliceLiteral");
const StructLiteral_1 = require("../ast/expressions/StructLiteral");
const Assignment_1 = require("../ast/instructions/Assignment");
const Block_1 = require("../ast/instructions/Block");
const Break_1 = require("../ast/instructions/Break");
const Continue_1 = require("../ast/instructions/Continue");
const Declaration_1 = require("../ast/instructions/Declaration");
const ExpressionStatement_1 = require("../ast/instructions/ExpressionStatement");
const For_1 = require("../ast/instructions/For");
const Function_1 = require("../ast/instructions/Function");
const If_1 = require("../ast/instructions/If");
const Main_1 = require("../ast/instructions/Main");
const Print_1 = require("../ast/instructions/Print");
const Return_1 = require("../ast/instructions/Return");
const Struct_1 = require("../ast/instructions/Struct");
const Switch_1 = require("../ast/instructions/Switch");
const LexicalError_1 = require("../errors/LexicalError");
const SyntaxError_1 = require("../errors/SyntaxError");
const ErrorList_1 = require("../errors/ErrorList");
const { Parser } = require("jison");
function buildParser() {
    const localGrammar = path_1.default.join(__dirname, "grammar.jison");
    const sourceGrammar = path_1.default.resolve(__dirname, "../../src/analyzer/grammar.jison");
    const grammarPath = fs_1.default.existsSync(localGrammar) ? localGrammar : sourceGrammar;
    const grammar = fs_1.default.readFileSync(grammarPath, "utf8");
    const originalWarn = console.warn;
    const originalLog = console.log;
    const originalError = console.error;
    console.warn = () => undefined;
    console.log = () => undefined;
    console.error = () => undefined;
    try {
        return new Parser(grammar);
    }
    finally {
        console.warn = originalWarn;
        console.log = originalLog;
        console.error = originalError;
    }
}
function transform(raw) {
    switch (raw.kind) {
        case "Literal": return new Literal_1.Literal(raw.valueType, raw.value, raw.line, raw.column);
        case "Identifier": return new Identifier_1.Identifier(raw.name, raw.line, raw.column);
        case "Arithmetic": return new Arithmetic_1.Arithmetic(raw.operator, transform(raw.left), raw.right ? transform(raw.right) : null, raw.line, raw.column);
        case "Relational": return new Relational_1.Relational(raw.operator, transform(raw.left), transform(raw.right), raw.line, raw.column);
        case "Logical": return new Logical_1.Logical(raw.operator, transform(raw.left), raw.right ? transform(raw.right) : null, raw.line, raw.column);
        case "CallFunction": return new CallFunction_1.CallFunction(raw.callee, raw.args.map(transform), raw.line, raw.column);
        case "Access": return new Access_1.Access(transform(raw.target), raw.parts.map((part) => (part.kind === "index" ? { kind: "index", expression: transform(part.expression) } : { kind: "property", name: part.name })), raw.line, raw.column);
        case "SliceLiteral": return new SliceLiteral_1.SliceLiteral(raw.valueType, raw.values.map(transform), raw.line, raw.column);
        case "InnerSlice": return new SliceLiteral_1.SliceLiteral("__inner__", raw.values.map(transform), raw.line, raw.column);
        case "StructLiteral": return new StructLiteral_1.StructLiteral(raw.structName, raw.fields.map((field) => ({ name: field.name, expression: transform(field.expression) })), raw.line, raw.column);
        case "Declaration": return new Declaration_1.Declaration(raw.name, raw.declaredType, raw.expression ? transform(raw.expression) : null, raw.mode, raw.line, raw.column);
        case "Assignment": return new Assignment_1.Assignment(transform(raw.target), raw.operator, transform(raw.expression), raw.line, raw.column);
        case "If": return new If_1.IfInstruction(transform(raw.condition), raw.thenBody.map(transform), raw.elseIfs.map((branch) => ({ condition: transform(branch.condition), body: branch.body.map(transform) })), raw.elseBody ? raw.elseBody.map(transform) : null, raw.line, raw.column);
        case "Switch": return new Switch_1.SwitchInstruction(transform(raw.expression), raw.cases.map((item) => ({ match: transform(item.match), body: item.body.map(transform) })), raw.defaultBody ? raw.defaultBody.map(transform) : null, raw.line, raw.column);
        case "For": return new For_1.ForInstruction(raw.mode, raw.initializer ? transform(raw.initializer) : null, raw.condition ? transform(raw.condition) : null, raw.update ? transform(raw.update) : null, raw.rangeIndex, raw.rangeValue, raw.rangeSource ? transform(raw.rangeSource) : null, raw.body.map(transform), raw.line, raw.column);
        case "Break": return new Break_1.BreakInstruction(raw.line, raw.column);
        case "Continue": return new Continue_1.ContinueInstruction(raw.line, raw.column);
        case "Return": return new Return_1.ReturnInstruction(raw.expression ? transform(raw.expression) : null, raw.line, raw.column);
        case "Function": return new Function_1.FunctionInstruction(raw.name, raw.params, raw.returnType, raw.body.map(transform), raw.line, raw.column);
        case "Main": return new Main_1.MainInstruction(raw.body.map(transform), raw.line, raw.column);
        case "Print": return new Print_1.PrintInstruction(raw.args.map(transform), raw.line, raw.column);
        case "Struct": return new Struct_1.StructInstruction(raw.name, raw.fields, raw.line, raw.column);
        case "ExpressionStatement": return new ExpressionStatement_1.ExpressionStatement(transform(raw.expression), raw.line, raw.column);
        case "Block": return new Block_1.BlockInstruction(raw.body.map(transform), raw.line, raw.column);
        default: throw new Error(`Nodo crudo no soportado: ${raw.kind}`);
    }
}
function parse(source) {
    const parser = buildParser();
    const errors = new ErrorList_1.ErrorList();
    parser.yy.parseError = (message, hash) => {
        errors.add(new SyntaxError_1.SyntaxError(message, hash.loc?.first_line ?? 0, (hash.loc?.first_column ?? 0) + 1));
    };
    try {
        const result = parser.parse(source);
        const ast = result.map(transform);
        return { ast, errors: errors.all() };
    }
    catch (error) {
        if (error?.hash?.text) {
            errors.add(new LexicalError_1.LexicalError(`Símbolo no reconocido: ${error.hash.text}`, error.hash.loc?.first_line ?? 0, (error.hash.loc?.first_column ?? 0) + 1));
        }
        else if (error instanceof Error) {
            errors.add(new SyntaxError_1.SyntaxError(error.message, 0, 0));
        }
        return { ast: [], errors: errors.all() };
    }
}
