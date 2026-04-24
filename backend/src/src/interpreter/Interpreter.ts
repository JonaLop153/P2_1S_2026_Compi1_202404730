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
import { SemanticError } from "../errors/SemanticError";
import { ErrorList } from "../errors/ErrorList";
import { SymbolTable } from "../symbol/SymbolTable";
import { Environment } from "./Environment";
import { RuntimeValue, StructValue, cloneValue, coerceAssignable, defaultValue, makeValue, runtimeTypeName, stringifyValue } from "./runtime/Value";
import { TypeName, isNumericType, isSliceType, sliceInnerType } from "./runtime/Type";

class BreakSignal {}
class ContinueSignal {}
class ReturnSignal {
  constructor(public readonly value: RuntimeValue | null) {}
}

export interface ExecutionResult {
  console: string[];
  errors: ReturnType<ErrorList["all"]>;
  symbols: ReturnType<SymbolTable["all"]>;
}

export class Interpreter {
  private readonly consoleLines: string[] = [];
  private readonly errors = new ErrorList();
  private readonly symbols = new SymbolTable();

  execute(ast: Node[]): ExecutionResult {
    this.consoleLines.length = 0;
    this.errors.clear();
    this.symbols.clear();

    const global = new Environment("Global", this.symbols);

    try {
      for (const node of ast) {
        if (node instanceof StructInstruction) global.defineStruct(node);
      }
      for (const node of ast) {
        if (node instanceof FunctionInstruction || node instanceof MainInstruction) global.defineFunction(node as FunctionInstruction);
      }

      const main = global.getFunction("main");
      if (!main) throw new SemanticError("No se encontró la función main", 0, 0);
      this.invokeFunction(main, [], global, "main");
    } catch (error) {
      if (error instanceof SemanticError) this.errors.add(error);
      else throw error;
    }

    return {
      console: [...this.consoleLines],
      errors: this.errors.all(),
      symbols: this.symbols.all()
    };
  }

  private executeBlock(nodes: Node[], env: Environment): RuntimeValue | null {
    for (const node of nodes) {
      this.executeNode(node, env);
    }
    return null;
  }

  private executeNode(node: Node, env: Environment): RuntimeValue | null {
    try {
      if (node instanceof Declaration) return this.executeDeclaration(node, env);
      if (node instanceof Assignment) return this.executeAssignment(node, env);
      if (node instanceof BlockInstruction) return this.executeBlock(node.body, env.child("block"));
      if (node instanceof PrintInstruction) return this.executePrint(node, env);
      if (node instanceof IfInstruction) return this.executeIf(node, env);
      if (node instanceof SwitchInstruction) return this.executeSwitch(node, env);
      if (node instanceof ForInstruction) return this.executeFor(node, env);
      if (node instanceof BreakInstruction) throw new BreakSignal();
      if (node instanceof ContinueInstruction) throw new ContinueSignal();
      if (node instanceof ReturnInstruction) throw new ReturnSignal(node.expression ? this.evaluate(node.expression, env) : null);
      if (node instanceof ExpressionStatement) return this.evaluate(node.expression, env);
      if (node instanceof FunctionInstruction || node instanceof MainInstruction || node instanceof StructInstruction) return null;
      throw new SemanticError(`Nodo no soportado: ${node.kind}`, node.line, node.column);
    } catch (error) {
      if (error instanceof SemanticError) {
        this.errors.add(error);
        return null;
      }
      throw error;
    }
  }

  private executeDeclaration(node: Declaration, env: Environment): RuntimeValue | null {
    const value = node.expression ? this.evaluate(node.expression, env) : defaultValue(node.declaredType ?? "nil");
    const declaredType = node.mode === "infer" ? value.type : (node.declaredType as TypeName);
    env.declareVariable(node.name, declaredType, value, node.line, node.column);
    return null;
  }

  private executeAssignment(node: Assignment, env: Environment): RuntimeValue | null {
    const targetInfo = this.resolveAssignable(node.target, env);
    let next = this.evaluate(node.expression, env);

    if (node.operator !== "=") {
      const baseOperator = node.operator === "+=" ? "+" : node.operator === "-=" ? "-" : node.operator === "++" ? "+" : "-";
      const right = node.operator === "++" || node.operator === "--" ? makeValue("int", 1) : next;
      next = this.applyArithmetic(baseOperator, targetInfo.getter(), right, node.line, node.column);
    }

    targetInfo.setter(next);
    return null;
  }

  private executePrint(node: PrintInstruction, env: Environment): RuntimeValue | null {
    const rendered = node.args.map((arg) => stringifyValue(this.evaluate(arg, env))).join(" ");
    this.consoleLines.push(rendered);
    return null;
  }

  private executeIf(node: IfInstruction, env: Environment): RuntimeValue | null {
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

    if (node.elseBody) this.executeBlock(node.elseBody, env.child("else"));
    return null;
  }

  private executeSwitch(node: SwitchInstruction, env: Environment): RuntimeValue | null {
    const pivot = this.evaluate(node.expression, env);
    for (const item of node.cases) {
      const compare = this.evaluate(item.match, env);
      const result = this.applyRelational("==", pivot, compare, node.line, node.column);
      if (this.asBoolean(result, node.line, node.column)) {
        this.executeBlock(item.body, env.child("switch"));
        return null;
      }
    }
    if (node.defaultBody) this.executeBlock(node.defaultBody, env.child("default"));
    return null;
  }

  private executeFor(node: ForInstruction, env: Environment): RuntimeValue | null {
    if (node.mode === "while") {
      const loopEnv = env.child("for");
      while (this.asBoolean(this.evaluate(node.condition!, loopEnv), node.line, node.column)) {
        try {
          this.executeBlock(node.body, loopEnv.child("body"));
        } catch (signal) {
          if (signal instanceof ContinueSignal) continue;
          if (signal instanceof BreakSignal) break;
          throw signal;
        }
      }
      return null;
    }

    if (node.mode === "classic") {
      const loopEnv = env.child("for");
      if (node.initializer) this.executeNode(node.initializer, loopEnv);
      while (node.condition ? this.asBoolean(this.evaluate(node.condition, loopEnv), node.line, node.column) : true) {
        try {
          this.executeBlock(node.body, loopEnv.child("body"));
        } catch (signal) {
          if (signal instanceof ContinueSignal) {
            if (node.update) this.executeNode(node.update, loopEnv);
            continue;
          }
          if (signal instanceof BreakSignal) break;
          throw signal;
        }
        if (node.update) this.executeNode(node.update, loopEnv);
      }
      return null;
    }

    const source = this.evaluate(node.rangeSource!, env);
    if (!isSliceType(source.type) || !Array.isArray(source.value)) {
      throw new SemanticError("range solo puede aplicarse sobre slices", node.line, node.column);
    }
    const items = source.value as RuntimeValue[];
    for (let index = 0; index < items.length; index += 1) {
      const loopEnv = env.child("range");
      loopEnv.declareVariable(node.rangeIndex!, "int", makeValue("int", index), node.line, node.column);
      loopEnv.declareVariable(node.rangeValue!, items[index].type, items[index], node.line, node.column);
      try {
        this.executeBlock(node.body, loopEnv);
      } catch (signal) {
        if (signal instanceof ContinueSignal) continue;
        if (signal instanceof BreakSignal) break;
        throw signal;
      }
    }
    return null;
  }

  private evaluate(node: Node, env: Environment): RuntimeValue {
    if (node instanceof Literal) return this.literalToValue(node);
    if (node instanceof Identifier) return env.getVariable(node.name, node.line, node.column).value;
    if (node instanceof Arithmetic) {
      const left = this.evaluate(node.left, env);
      const right = node.right ? this.evaluate(node.right, env) : null;
      if (!right) {
        const value = this.toNumber(left);
        return makeValue(left.type === "float64" ? "float64" : "int", -value);
      }
      return this.applyArithmetic(node.operator, left, right, node.line, node.column);
    }
    if (node instanceof Relational) return this.applyRelational(node.operator, this.evaluate(node.left, env), this.evaluate(node.right, env), node.line, node.column);
    if (node instanceof Logical) return this.applyLogical(node.operator, this.evaluate(node.left, env), node.right ? this.evaluate(node.right, env) : null, node.line, node.column);
    if (node instanceof CallFunction) return this.call(node, env);
    if (node instanceof SliceLiteral) {
      if (node.valueType === "__inner__") {
        // Anonymous inner slice {v1, v2, ...} — evaluate as array of values, type resolved by parent
        const values = node.values.map((item) => this.evaluate(item, env));
        const innerType = values.length > 0 ? values[0].type : "nil";
        return makeValue(`[]${innerType}`, values);
      }
      const values = node.values.map((item) => coerceAssignable(this.evaluate(item, env), node.valueType.slice(2)));
      return makeValue(node.valueType, values);
    }
    if (node instanceof StructLiteral) {
      const definition = env.getStruct(node.structName);
      if (!definition) throw new SemanticError(`Struct "${node.structName}" no encontrado`, node.line, node.column);
      const fields: Record<string, RuntimeValue> = {};
      for (const field of definition.fields) {
        const found = node.fields.find((item) => item.name === field.name);
        fields[field.name] = found ? coerceAssignable(this.evaluate(found.expression, env), field.type) : defaultValue(field.type);
      }
      const value: StructValue = { structName: node.structName, fields };
      return makeValue(node.structName, value);
    }
    if (node instanceof Access) return this.readAccess(node, env);
    throw new SemanticError(`Expresión no soportada: ${node.kind}`, node.line, node.column);
  }

  private literalToValue(node: Literal): RuntimeValue {
    if (node.valueType === "nil") return makeValue("nil", null);
    if (node.valueType === "rune" && typeof node.value === "string") return makeValue("rune", node.value.codePointAt(0) ?? 0);
    return makeValue(node.valueType as TypeName, node.value);
  }

  private call(node: CallFunction, env: Environment): RuntimeValue {
    const args = node.args.map((item) => this.evaluate(item, env));
    switch (node.callee) {
      case "fmt.Println":
        this.consoleLines.push(args.map((item) => stringifyValue(item)).join(" "));
        return makeValue("nil", null);
      case "len":
        if (!args[0] || !isSliceType(args[0].type)) throw new SemanticError("len espera un slice", node.line, node.column);
        return makeValue("int", Array.isArray(args[0].value) ? args[0].value.length : 0);
      case "append": {
        const slice = args[0];
        if (!slice || !isSliceType(slice.type)) throw new SemanticError("append espera un slice", node.line, node.column);
        const innerType = sliceInnerType(slice.type);
        const base = Array.isArray(slice.value) ? [...slice.value] : [];
        for (const arg of args.slice(1)) base.push(coerceAssignable(arg, innerType));
        return makeValue(slice.type, base);
      }
      case "slices.Index": {
        const slice = args[0];
        if (!slice || !isSliceType(slice.type) || !Array.isArray(slice.value)) throw new SemanticError("slices.Index espera un slice", node.line, node.column);
        const target = args[1];
        const index = slice.value.findIndex((item) => stringifyValue(item) === stringifyValue(target));
        return makeValue("int", index);
      }
      case "strings.Join": {
        const slice = args[0];
        const separator = args[1];
        if (!slice || slice.type !== "[]string" || !Array.isArray(slice.value)) throw new SemanticError("strings.Join solo acepta []string", node.line, node.column);
        return makeValue("string", slice.value.map((item) => String(item.value)).join(String(separator?.value ?? "")));
      }
      case "strconv.Atoi": {
        const parsed = Number.parseInt(String(args[0]?.value ?? ""), 10);
        if (Number.isNaN(parsed)) throw new SemanticError("strconv.Atoi recibió una cadena inválida", node.line, node.column);
        return makeValue("int", parsed);
      }
      case "strconv.ParseFloat": {
        const parsed = Number.parseFloat(String(args[0]?.value ?? ""));
        if (Number.isNaN(parsed)) throw new SemanticError("strconv.ParseFloat recibió una cadena inválida", node.line, node.column);
        return makeValue("float64", parsed);
      }
      case "reflect.TypeOf":
        return makeValue("string", runtimeTypeName(args[0]));
      default: {
        const fn = env.getFunction(node.callee);
        if (!fn) throw new SemanticError(`Función "${node.callee}" no encontrada`, node.line, node.column);
        return this.invokeFunction(fn, args, env, fn.name);
      }
    }
  }

  private invokeFunction(fn: FunctionInstruction, args: RuntimeValue[], env: Environment, scopeName: string): RuntimeValue {
    const local = env.child(scopeName);
    if (fn.params.length !== args.length) {
      throw new SemanticError(`La función "${fn.name}" esperaba ${fn.params.length} parámetros`, fn.line, fn.column);
    }
    fn.params.forEach((param, index) => {
      const incoming = isSliceType(param.type) || env.getStruct(param.type) ? args[index] : cloneValue(args[index]);
      local.declareVariable(param.name, param.type, incoming, fn.line, fn.column);
    });
    try {
      this.executeBlock(fn.body, local);
      return fn.returnType ? defaultValue(fn.returnType) : makeValue("nil", null);
    } catch (signal) {
      if (signal instanceof ReturnSignal) {
        if (!fn.returnType) return makeValue("nil", null);
        return coerceAssignable(signal.value ?? makeValue("nil", null), fn.returnType);
      }
      throw signal;
    }
  }

  private resolveAssignable(node: Node, env: Environment): { getter: () => RuntimeValue; setter: (value: RuntimeValue) => void } {
    if (node instanceof Identifier) {
      return {
        getter: () => env.getVariable(node.name, node.line, node.column).value,
        setter: (value) => env.assignVariable(node.name, value, node.line, node.column)
      };
    }

    if (node instanceof Access) {
      return this.resolveAccess(node, env);
    }

    throw new SemanticError("El objetivo de asignación no es válido", node.line, node.column);
  }

  private readAccess(node: Access, env: Environment): RuntimeValue {
    return this.resolveAccess(node, env).getter();
  }

  private resolveAccess(node: Access, env: Environment): { getter: () => RuntimeValue; setter: (value: RuntimeValue) => void } {
    const root = node.target instanceof Identifier ? env.getVariableRef(node.target.name, node.line, node.column) : null;
    if (!root) throw new SemanticError("Acceso inválido", node.line, node.column);

    const navigate = (): { container: unknown; last: AccessPart | null; current: RuntimeValue } => {
      let current = root.value;
      let container: unknown = null;
      let last: AccessPart | null = null;
      for (const part of node.parts) {
        container = current;
        last = part;
        if (part.kind === "property") {
          const value = current.value as StructValue;
          current = value.fields[part.name];
        } else {
          const index = Number(this.evaluate(part.expression, env).value);
          const slice = current.value as RuntimeValue[];
          if (!Array.isArray(slice) || index < 0 || index >= slice.length) {
            throw new SemanticError("Índice fuera de rango", node.line, node.column);
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
        if (!result.last || !result.container) throw new SemanticError("Asignación inválida", node.line, node.column);
        if (result.last.kind === "property") {
          const container = (result.container as RuntimeValue).value as StructValue;
          container.fields[result.last.name] = coerceAssignable(value, container.fields[result.last.name].type);
        } else {
          const index = Number(this.evaluate(result.last.expression, env).value);
          const container = (result.container as RuntimeValue).value as RuntimeValue[];
          container[index] = coerceAssignable(value, container[index].type);
        }
      }
    };
  }

  private applyArithmetic(operator: string, left: RuntimeValue, right: RuntimeValue, line: number, column: number): RuntimeValue {
    if (operator === "+" && (left.type === "string" || right.type === "string")) {
      return makeValue("string", stringifyValue(left) + stringifyValue(right));
    }
    if (operator === "*" && left.type === "int" && right.type === "string") {
      return makeValue("string", String(right.value).repeat(Number(left.value)));
    }
    if (operator === "*" && left.type === "string" && right.type === "int") {
      return makeValue("string", String(left.value).repeat(Number(right.value)));
    }

    const leftNumber = this.toNumber(left);
    const rightNumber = this.toNumber(right);
    const resultType: TypeName = left.type === "float64" || right.type === "float64" ? "float64" : (left.type === "bool" && right.type === "bool" ? "bool" : "int");

    switch (operator) {
      case "+":
        if (left.type === "bool" && right.type === "bool") return makeValue("bool", Boolean(left.value) || Boolean(right.value));
        return makeValue(resultType, leftNumber + rightNumber);
      case "-":
        if (left.type === "bool" && right.type === "bool") return makeValue("bool", Boolean(left.value) && !Boolean(right.value));
        return makeValue(resultType, leftNumber - rightNumber);
      case "*":
        if (left.type === "bool" && right.type === "bool") return makeValue("bool", Boolean(left.value) && Boolean(right.value));
        return makeValue(resultType, leftNumber * rightNumber);
      case "/":
        if (rightNumber === 0) throw new SemanticError("División entre 0", line, column);
        if (resultType === "int") return makeValue("int", Math.trunc(leftNumber / rightNumber));
        return makeValue("float64", leftNumber / rightNumber);
      case "%":
        return makeValue("int", Math.trunc(leftNumber) % Math.trunc(rightNumber));
      default:
        throw new SemanticError(`Operador aritmético no soportado: ${operator}`, line, column);
    }
  }

  private applyRelational(operator: string, left: RuntimeValue, right: RuntimeValue, line: number, column: number): RuntimeValue {
    const compare = (a: number | string | boolean, b: number | string | boolean): boolean => {
      switch (operator) {
        case "==": return a === b;
        case "!=": return a !== b;
        case ">": return a > b;
        case ">=": return a >= b;
        case "<": return a < b;
        case "<=": return a <= b;
        default: throw new SemanticError(`Operador relacional no soportado: ${operator}`, line, column);
      }
    };

    if (isNumericType(left.type) && isNumericType(right.type)) return makeValue("bool", compare(this.toNumber(left), this.toNumber(right)));
    if (left.type === "string" && right.type === "string") return makeValue("bool", compare(String(left.value), String(right.value)));
    if (left.type === "bool" && right.type === "bool") return makeValue("bool", compare(Boolean(left.value), Boolean(right.value)));
    if (left.type === "rune" && right.type === "rune") return makeValue("bool", compare(this.toNumber(left), this.toNumber(right)));
    throw new SemanticError("Comparación inválida entre tipos incompatibles", line, column);
  }

  private applyLogical(operator: string, left: RuntimeValue, right: RuntimeValue | null, line: number, column: number): RuntimeValue {
    const l = this.asBoolean(left, line, column);
    switch (operator) {
      case "!": return makeValue("bool", !l);
      case "&&": return makeValue("bool", l && this.asBoolean(right!, line, column));
      case "||": return makeValue("bool", l || this.asBoolean(right!, line, column));
      default: throw new SemanticError(`Operador lógico no soportado: ${operator}`, line, column);
    }
  }

  private asBoolean(value: RuntimeValue, line: number, column: number): boolean {
    if (value.type !== "bool") throw new SemanticError("Se esperaba una expresión booleana", line, column);
    return Boolean(value.value);
  }

  private toNumber(value: RuntimeValue): number {
    if (!isNumericType(value.type)) throw new SemanticError(`El tipo ${value.type} no es numérico`, 0, 0);
    if (value.type === "bool") return value.value ? 1 : 0;
    return Number(value.value);
  }
}
