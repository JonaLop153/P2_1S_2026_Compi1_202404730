"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
const SemanticError_1 = require("../errors/SemanticError");
const Value_1 = require("./runtime/Value");
const Type_1 = require("./runtime/Type");
class Environment {
    constructor(name, symbolTable, parent = null) {
        this.name = name;
        this.symbolTable = symbolTable;
        this.parent = parent;
        this.variables = new Map();
        this.functions = new Map();
        this.structs = new Map();
    }
    child(name) {
        return new Environment(name, this.symbolTable, this);
    }
    declareVariable(name, type, value, line, column) {
        if (Type_1.RESERVED_WORDS.has(name)) {
            throw new SemanticError_1.SemanticError(`"${name}" es una palabra reservada`, line, column);
        }
        if (this.variables.has(name) || this.functions.has(name) || this.structs.has(name)) {
            throw new SemanticError_1.SemanticError(`"${name}" ya existe en el ámbito ${this.name}`, line, column);
        }
        const assigned = (0, Value_1.coerceAssignable)(value, type);
        this.variables.set(name, { name, type, value: assigned, line, column });
        this.symbolTable.add({
            id: name,
            symbolType: "Variable",
            dataType: String(type),
            scope: this.name,
            line,
            column
        });
    }
    assignVariable(name, value, line, column) {
        const env = this.resolveVariableEnv(name);
        if (!env)
            throw new SemanticError_1.SemanticError(`Variable "${name}" no encontrada`, line, column);
        const current = env.variables.get(name);
        current.value = (0, Value_1.coerceAssignable)(value, current.type);
    }
    getVariable(name, line, column) {
        const env = this.resolveVariableEnv(name);
        if (!env)
            throw new SemanticError_1.SemanticError(`Variable "${name}" no encontrada`, line, column);
        const entry = env.variables.get(name);
        return { ...entry, value: (0, Value_1.cloneValue)(entry.value) };
    }
    getVariableRef(name, line, column) {
        const env = this.resolveVariableEnv(name);
        if (!env)
            throw new SemanticError_1.SemanticError(`Variable "${name}" no encontrada`, line, column);
        return env.variables.get(name);
    }
    defineFunction(fn) {
        if (this.functions.has(fn.name) || this.variables.has(fn.name) || this.structs.has(fn.name)) {
            throw new SemanticError_1.SemanticError(`"${fn.name}" ya fue declarado en el ámbito global`, fn.line, fn.column);
        }
        this.functions.set(fn.name, fn);
        this.symbolTable.add({
            id: fn.name,
            symbolType: "Función",
            dataType: fn.returnType ?? "void",
            scope: this.name,
            line: fn.line,
            column: fn.column
        });
    }
    getFunction(name) {
        return this.functions.get(name) ?? this.parent?.getFunction(name) ?? null;
    }
    defineStruct(structNode) {
        if (this.structs.has(structNode.name) || this.variables.has(structNode.name) || this.functions.has(structNode.name)) {
            throw new SemanticError_1.SemanticError(`"${structNode.name}" ya fue declarado en el ámbito global`, structNode.line, structNode.column);
        }
        this.structs.set(structNode.name, structNode);
        this.symbolTable.add({
            id: structNode.name,
            symbolType: "Struct",
            dataType: structNode.name,
            scope: this.name,
            line: structNode.line,
            column: structNode.column
        });
    }
    getStruct(name) {
        return this.structs.get(name) ?? this.parent?.getStruct(name) ?? null;
    }
    resolveVariableEnv(name) {
        if (this.variables.has(name))
            return this;
        return this.parent?.resolveVariableEnv(name) ?? null;
    }
}
exports.Environment = Environment;
