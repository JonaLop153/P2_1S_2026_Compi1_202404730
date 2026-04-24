"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
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
const SemanticError_1 = require("../errors/SemanticError");
const ErrorList_1 = require("../errors/ErrorList");
const SymbolTable_1 = require("../symbol/SymbolTable");
const Environment_1 = require("./Environment");
const Value_1 = require("./runtime/Value");
const Type_1 = require("./runtime/Type");
class BreakSignal {
}
class ContinueSignal {
}
class ReturnSignal {
    constructor(value) {
        this.value = value;
    }
}
class Interpreter {
    constructor() {
        this.consoleLines = [];
        this.errors = new ErrorList_1.ErrorList();
        this.symbols = new SymbolTable_1.SymbolTable();
    }
    execute(ast) {
        this.consoleLines.length = 0;
        this.errors.clear();
        this.symbols.clear();
        const global = new Environment_1.Environment("Global", this.symbols);
        try {
            for (const node of ast) {
                if (node instanceof Struct_1.StructInstruction)
                    global.defineStruct(node);
            }
            for (const node of ast) {
                if (node instanceof Function_1.FunctionInstruction || node instanceof Main_1.MainInstruction)
                    global.defineFunction(node);
            }
            const main = global.getFunction("main");
            if (!main)
                throw new SemanticError_1.SemanticError("No se encontró la función main", 0, 0);
            this.invokeFunction(main, [], global, "main");
        }
        catch (error) {
            if (error instanceof SemanticError_1.SemanticError)
                this.errors.add(error);
            else
                throw error;
        }
        return {
            console: [...this.consoleLines],
            errors: this.errors.all(),
            symbols: this.symbols.all()
        };
    }
    executeBlock(nodes, env) {
        for (const node of nodes) {
            this.executeNode(node, env);
        }
        return null;
    }
    executeNode(node, env) {
        try {
            if (node instanceof Declaration_1.Declaration)
                return this.executeDeclaration(node, env);
            if (node instanceof Assignment_1.Assignment)
                return this.executeAssignment(node, env);
            if (node instanceof Block_1.BlockInstruction)
                return this.executeBlock(node.body, env.child("block"));
            if (node instanceof Print_1.PrintInstruction)
                return this.executePrint(node, env);
            if (node instanceof If_1.IfInstruction)
                return this.executeIf(node, env);
            if (node instanceof Switch_1.SwitchInstruction)
                return this.executeSwitch(node, env);
            if (node instanceof For_1.ForInstruction)
                return this.executeFor(node, env);
            if (node instanceof Break_1.BreakInstruction)
                throw new BreakSignal();
            if (node instanceof Continue_1.ContinueInstruction)
                throw new ContinueSignal();
            if (node instanceof Return_1.ReturnInstruction)
                throw new ReturnSignal(node.expression ? this.evaluate(node.expression, env) : null);
            if (node instanceof ExpressionStatement_1.ExpressionStatement)
                return this.evaluate(node.expression, env);
            if (node instanceof Function_1.FunctionInstruction || node instanceof Main_1.MainInstruction || node instanceof Struct_1.StructInstruction)
                return null;
            throw new SemanticError_1.SemanticError(`Nodo no soportado: ${node.kind}`, node.line, node.column);
        }
        catch (error) {
            if (error instanceof SemanticError_1.SemanticError) {
                this.errors.add(error);
                return null;
            }
            throw error;
        }
    }
    executeDeclaration(node, env) {
        const value = node.expression ? this.evaluate(node.expression, env) : (0, Value_1.defaultValue)(node.declaredType ?? "nil");
        const declaredType = node.mode === "infer" ? value.type : node.declaredType;
        env.declareVariable(node.name, declaredType, value, node.line, node.column);
        return null;
    }
    executeAssignment(node, env) {
        const targetInfo = this.resolveAssignable(node.target, env);
        let next = this.evaluate(node.expression, env);
        if (node.operator !== "=") {
            const baseOperator = node.operator === "+=" ? "+" : node.operator === "-=" ? "-" : node.operator === "++" ? "+" : "-";
            const right = node.operator === "++" || node.operator === "--" ? (0, Value_1.makeValue)("int", 1) : next;
            next = this.applyArithmetic(baseOperator, targetInfo.getter(), right, node.line, node.column);
        }
        targetInfo.setter(next);
        return null;
    }
    executePrint(node, env) {
        const rendered = node.args.map((arg) => (0, Value_1.stringifyValue)(this.evaluate(arg, env))).join(" ");
        this.consoleLines.push(rendered);
        return null;
    }
    executeIf(node, env) {
        if (this.asBoolean(this.evaluate(node.condition, env), node.line, node.column)) {
            this.executeBlock(node.thenBody, env.child("if"));
            return null;
        }
        for (const branch of node.elseIfs) {
            if (this.asBoolean(this.evaluate(branch.condition, env), node.line, node.column)) {
                this.executeBlock(branch.body, env.child("elseif"));
                return null;
            }
        }
        if (node.elseBody)
            this.executeBlock(node.elseBody, env.child("else"));
        return null;
    }
    executeSwitch(node, env) {
        const pivot = this.evaluate(node.expression, env);
        for (const item of node.cases) {
            const compare = this.evaluate(item.match, env);
            const result = this.applyRelational("==", pivot, compare, node.line, node.column);
            if (this.asBoolean(result, node.line, node.column)) {
                this.executeBlock(item.body, env.child("switch"));
                return null;
            }
        }
        if (node.defaultBody)
            this.executeBlock(node.defaultBody, env.child("default"));
        return null;
    }
    executeFor(node, env) {
        if (node.mode === "while") {
            const loopEnv = env.child("for");
            while (this.asBoolean(this.evaluate(node.condition, loopEnv), node.line, node.column)) {
                try {
                    this.executeBlock(node.body, loopEnv.child("body"));
                }
                catch (signal) {
                    if (signal instanceof ContinueSignal)
                        continue;
                    if (signal instanceof BreakSignal)
                        break;
                    throw signal;
                }
            }
            return null;
        }
        if (node.mode === "classic") {
            const loopEnv = env.child("for");
            if (node.initializer)
                this.executeNode(node.initializer, loopEnv);
            while (node.condition ? this.asBoolean(this.evaluate(node.condition, loopEnv), node.line, node.column) : true) {
                try {
                    this.executeBlock(node.body, loopEnv.child("body"));
                }
                catch (signal) {
                    if (signal instanceof ContinueSignal) {
                        if (node.update)
                            this.executeNode(node.update, loopEnv);
                        continue;
                    }
                    if (signal instanceof BreakSignal)
                        break;
                    throw signal;
                }
                if (node.update)
                    this.executeNode(node.update, loopEnv);
            }
            return null;
        }
        const source = this.evaluate(node.rangeSource, env);
        if (!(0, Type_1.isSliceType)(source.type) || !Array.isArray(source.value)) {
            throw new SemanticError_1.SemanticError("range solo puede aplicarse sobre slices", node.line, node.column);
        }
        const items = source.value;
        for (let index = 0; index < items.length; index += 1) {
            const loopEnv = env.child("range");
            loopEnv.declareVariable(node.rangeIndex, "int", (0, Value_1.makeValue)("int", index), node.line, node.column);
            loopEnv.declareVariable(node.rangeValue, items[index].type, items[index], node.line, node.column);
            try {
                this.executeBlock(node.body, loopEnv);
            }
            catch (signal) {
                if (signal instanceof ContinueSignal)
                    continue;
                if (signal instanceof BreakSignal)
                    break;
                throw signal;
            }
        }
        return null;
    }
    evaluate(node, env) {
        if (node instanceof Literal_1.Literal)
            return this.literalToValue(node);
        if (node instanceof Identifier_1.Identifier)
            return env.getVariable(node.name, node.line, node.column).value;
        if (node instanceof Arithmetic_1.Arithmetic) {
            const left = this.evaluate(node.left, env);
            const right = node.right ? this.evaluate(node.right, env) : null;
            if (!right) {
                const value = this.toNumber(left);
                return (0, Value_1.makeValue)(left.type === "float64" ? "float64" : "int", -value);
            }
            return this.applyArithmetic(node.operator, left, right, node.line, node.column);
        }
        if (node instanceof Relational_1.Relational)
            return this.applyRelational(node.operator, this.evaluate(node.left, env), this.evaluate(node.right, env), node.line, node.column);
        if (node instanceof Logical_1.Logical)
            return this.applyLogical(node.operator, this.evaluate(node.left, env), node.right ? this.evaluate(node.right, env) : null, node.line, node.column);
        if (node instanceof CallFunction_1.CallFunction)
            return this.call(node, env);
        if (node instanceof SliceLiteral_1.SliceLiteral) {
            if (node.valueType === "__inner__") {
                // Anonymous inner slice {v1, v2, ...} — evaluate as array of values, type resolved by parent
                const values = node.values.map((item) => this.evaluate(item, env));
                const innerType = values.length > 0 ? values[0].type : "nil";
                return (0, Value_1.makeValue)(`[]${innerType}`, values);
            }
            const values = node.values.map((item) => (0, Value_1.coerceAssignable)(this.evaluate(item, env), node.valueType.slice(2)));
            return (0, Value_1.makeValue)(node.valueType, values);
        }
        if (node instanceof StructLiteral_1.StructLiteral) {
            const definition = env.getStruct(node.structName);
            if (!definition)
                throw new SemanticError_1.SemanticError(`Struct "${node.structName}" no encontrado`, node.line, node.column);
            const fields = {};
            for (const field of definition.fields) {
                const found = node.fields.find((item) => item.name === field.name);
                fields[field.name] = found ? (0, Value_1.coerceAssignable)(this.evaluate(found.expression, env), field.type) : (0, Value_1.defaultValue)(field.type);
            }
            const value = { structName: node.structName, fields };
            return (0, Value_1.makeValue)(node.structName, value);
        }
        if (node instanceof Access_1.Access)
            return this.readAccess(node, env);
        throw new SemanticError_1.SemanticError(`Expresión no soportada: ${node.kind}`, node.line, node.column);
    }
    literalToValue(node) {
        if (node.valueType === "nil")
            return (0, Value_1.makeValue)("nil", null);
        if (node.valueType === "rune" && typeof node.value === "string")
            return (0, Value_1.makeValue)("rune", node.value.codePointAt(0) ?? 0);
        return (0, Value_1.makeValue)(node.valueType, node.value);
    }
    call(node, env) {
        const args = node.args.map((item) => this.evaluate(item, env));
        switch (node.callee) {
            case "fmt.Println":
                this.consoleLines.push(args.map((item) => (0, Value_1.stringifyValue)(item)).join(" "));
                return (0, Value_1.makeValue)("nil", null);
            case "len":
                if (!args[0] || !(0, Type_1.isSliceType)(args[0].type))
                    throw new SemanticError_1.SemanticError("len espera un slice", node.line, node.column);
                return (0, Value_1.makeValue)("int", Array.isArray(args[0].value) ? args[0].value.length : 0);
            case "append": {
                const slice = args[0];
                if (!slice || !(0, Type_1.isSliceType)(slice.type))
                    throw new SemanticError_1.SemanticError("append espera un slice", node.line, node.column);
                const innerType = (0, Type_1.sliceInnerType)(slice.type);
                const base = Array.isArray(slice.value) ? [...slice.value] : [];
                for (const arg of args.slice(1))
                    base.push((0, Value_1.coerceAssignable)(arg, innerType));
                return (0, Value_1.makeValue)(slice.type, base);
            }
            case "slices.Index": {
                const slice = args[0];
                if (!slice || !(0, Type_1.isSliceType)(slice.type) || !Array.isArray(slice.value))
                    throw new SemanticError_1.SemanticError("slices.Index espera un slice", node.line, node.column);
                const target = args[1];
                const index = slice.value.findIndex((item) => (0, Value_1.stringifyValue)(item) === (0, Value_1.stringifyValue)(target));
                return (0, Value_1.makeValue)("int", index);
            }
            case "strings.Join": {
                const slice = args[0];
                const separator = args[1];
                if (!slice || slice.type !== "[]string" || !Array.isArray(slice.value))
                    throw new SemanticError_1.SemanticError("strings.Join solo acepta []string", node.line, node.column);
                return (0, Value_1.makeValue)("string", slice.value.map((item) => String(item.value)).join(String(separator?.value ?? "")));
            }
            case "strconv.Atoi": {
                const parsed = Number.parseInt(String(args[0]?.value ?? ""), 10);
                if (Number.isNaN(parsed))
                    throw new SemanticError_1.SemanticError("strconv.Atoi recibió una cadena inválida", node.line, node.column);
                return (0, Value_1.makeValue)("int", parsed);
            }
            case "strconv.ParseFloat": {
                const parsed = Number.parseFloat(String(args[0]?.value ?? ""));
                if (Number.isNaN(parsed))
                    throw new SemanticError_1.SemanticError("strconv.ParseFloat recibió una cadena inválida", node.line, node.column);
                return (0, Value_1.makeValue)("float64", parsed);
            }
            case "reflect.TypeOf":
                return (0, Value_1.makeValue)("string", (0, Value_1.runtimeTypeName)(args[0]));
            default: {
                const fn = env.getFunction(node.callee);
                if (!fn)
                    throw new SemanticError_1.SemanticError(`Función "${node.callee}" no encontrada`, node.line, node.column);
                return this.invokeFunction(fn, args, env, fn.name);
            }
        }
    }
    invokeFunction(fn, args, env, scopeName) {
        const local = env.child(scopeName);
        if (fn.params.length !== args.length) {
            throw new SemanticError_1.SemanticError(`La función "${fn.name}" esperaba ${fn.params.length} parámetros`, fn.line, fn.column);
        }
        fn.params.forEach((param, index) => {
            const incoming = (0, Type_1.isSliceType)(param.type) || env.getStruct(param.type) ? args[index] : (0, Value_1.cloneValue)(args[index]);
            local.declareVariable(param.name, param.type, incoming, fn.line, fn.column);
        });
        try {
            this.executeBlock(fn.body, local);
            return fn.returnType ? (0, Value_1.defaultValue)(fn.returnType) : (0, Value_1.makeValue)("nil", null);
        }
        catch (signal) {
            if (signal instanceof ReturnSignal) {
                if (!fn.returnType)
                    return (0, Value_1.makeValue)("nil", null);
                return (0, Value_1.coerceAssignable)(signal.value ?? (0, Value_1.makeValue)("nil", null), fn.returnType);
            }
            throw signal;
        }
    }
    resolveAssignable(node, env) {
        if (node instanceof Identifier_1.Identifier) {
            return {
                getter: () => env.getVariable(node.name, node.line, node.column).value,
                setter: (value) => env.assignVariable(node.name, value, node.line, node.column)
            };
        }
        if (node instanceof Access_1.Access) {
            return this.resolveAccess(node, env);
        }
        throw new SemanticError_1.SemanticError("El objetivo de asignación no es válido", node.line, node.column);
    }
    readAccess(node, env) {
        return this.resolveAccess(node, env).getter();
    }
    resolveAccess(node, env) {
        const root = node.target instanceof Identifier_1.Identifier ? env.getVariableRef(node.target.name, node.line, node.column) : null;
        if (!root)
            throw new SemanticError_1.SemanticError("Acceso inválido", node.line, node.column);
        const navigate = () => {
            let current = root.value;
            let container = null;
            let last = null;
            for (const part of node.parts) {
                container = current;
                last = part;
                if (part.kind === "property") {
                    const value = current.value;
                    current = value.fields[part.name];
                }
                else {
                    const index = Number(this.evaluate(part.expression, env).value);
                    const slice = current.value;
                    if (!Array.isArray(slice) || index < 0 || index >= slice.length) {
                        throw new SemanticError_1.SemanticError("Índice fuera de rango", node.line, node.column);
                    }
                    current = slice[index];
                }
            }
            return { container, last, current };
        };
        return {
            getter: () => navigate().current,
            setter: (value) => {
                const result = navigate();
                if (!result.last || !result.container)
                    throw new SemanticError_1.SemanticError("Asignación inválida", node.line, node.column);
                if (result.last.kind === "property") {
                    const container = result.container.value;
                    container.fields[result.last.name] = (0, Value_1.coerceAssignable)(value, container.fields[result.last.name].type);
                }
                else {
                    const index = Number(this.evaluate(result.last.expression, env).value);
                    const container = result.container.value;
                    container[index] = (0, Value_1.coerceAssignable)(value, container[index].type);
                }
            }
        };
    }
    applyArithmetic(operator, left, right, line, column) {
        if (operator === "+" && (left.type === "string" || right.type === "string")) {
            return (0, Value_1.makeValue)("string", (0, Value_1.stringifyValue)(left) + (0, Value_1.stringifyValue)(right));
        }
        if (operator === "*" && left.type === "int" && right.type === "string") {
            return (0, Value_1.makeValue)("string", String(right.value).repeat(Number(left.value)));
        }
        if (operator === "*" && left.type === "string" && right.type === "int") {
            return (0, Value_1.makeValue)("string", String(left.value).repeat(Number(right.value)));
        }
        const leftNumber = this.toNumber(left);
        const rightNumber = this.toNumber(right);
        const resultType = left.type === "float64" || right.type === "float64" ? "float64" : (left.type === "bool" && right.type === "bool" ? "bool" : "int");
        switch (operator) {
            case "+":
                if (left.type === "bool" && right.type === "bool")
                    return (0, Value_1.makeValue)("bool", Boolean(left.value) || Boolean(right.value));
                return (0, Value_1.makeValue)(resultType, leftNumber + rightNumber);
            case "-":
                if (left.type === "bool" && right.type === "bool")
                    return (0, Value_1.makeValue)("bool", Boolean(left.value) && !Boolean(right.value));
                return (0, Value_1.makeValue)(resultType, leftNumber - rightNumber);
            case "*":
                if (left.type === "bool" && right.type === "bool")
                    return (0, Value_1.makeValue)("bool", Boolean(left.value) && Boolean(right.value));
                return (0, Value_1.makeValue)(resultType, leftNumber * rightNumber);
            case "/":
                if (rightNumber === 0)
                    throw new SemanticError_1.SemanticError("División entre 0", line, column);
                if (resultType === "int")
                    return (0, Value_1.makeValue)("int", Math.trunc(leftNumber / rightNumber));
                return (0, Value_1.makeValue)("float64", leftNumber / rightNumber);
            case "%":
                return (0, Value_1.makeValue)("int", Math.trunc(leftNumber) % Math.trunc(rightNumber));
            default:
                throw new SemanticError_1.SemanticError(`Operador aritmético no soportado: ${operator}`, line, column);
        }
    }
    applyRelational(operator, left, right, line, column) {
        const compare = (a, b) => {
            switch (operator) {
                case "==": return a === b;
                case "!=": return a !== b;
                case ">": return a > b;
                case ">=": return a >= b;
                case "<": return a < b;
                case "<=": return a <= b;
                default: throw new SemanticError_1.SemanticError(`Operador relacional no soportado: ${operator}`, line, column);
            }
        };
        if ((0, Type_1.isNumericType)(left.type) && (0, Type_1.isNumericType)(right.type))
            return (0, Value_1.makeValue)("bool", compare(this.toNumber(left), this.toNumber(right)));
        if (left.type === "string" && right.type === "string")
            return (0, Value_1.makeValue)("bool", compare(String(left.value), String(right.value)));
        if (left.type === "bool" && right.type === "bool")
            return (0, Value_1.makeValue)("bool", compare(Boolean(left.value), Boolean(right.value)));
        if (left.type === "rune" && right.type === "rune")
            return (0, Value_1.makeValue)("bool", compare(this.toNumber(left), this.toNumber(right)));
        throw new SemanticError_1.SemanticError("Comparación inválida entre tipos incompatibles", line, column);
    }
    applyLogical(operator, left, right, line, column) {
        const l = this.asBoolean(left, line, column);
        switch (operator) {
            case "!": return (0, Value_1.makeValue)("bool", !l);
            case "&&": return (0, Value_1.makeValue)("bool", l && this.asBoolean(right, line, column));
            case "||": return (0, Value_1.makeValue)("bool", l || this.asBoolean(right, line, column));
            default: throw new SemanticError_1.SemanticError(`Operador lógico no soportado: ${operator}`, line, column);
        }
    }
    asBoolean(value, line, column) {
        if (value.type !== "bool")
            throw new SemanticError_1.SemanticError("Se esperaba una expresión booleana", line, column);
        return Boolean(value.value);
    }
    toNumber(value) {
        if (!(0, Type_1.isNumericType)(value.type))
            throw new SemanticError_1.SemanticError(`El tipo ${value.type} no es numérico`, 0, 0);
        if (value.type === "bool")
            return value.value ? 1 : 0;
        return Number(value.value);
    }
}
exports.Interpreter = Interpreter;
