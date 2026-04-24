import { SemanticError } from "../errors/SemanticError";
import { SymbolTable } from "../symbol/SymbolTable";
import { RuntimeValue, cloneValue, coerceAssignable } from "./runtime/Value";
import { FunctionInstruction } from "../ast/instructions/Function";
import { StructInstruction } from "../ast/instructions/Struct";
import { RESERVED_WORDS, TypeName } from "./runtime/Type";

interface VariableEntry {
  name: string;
  type: TypeName;
  value: RuntimeValue;
  line: number;
  column: number;
}

export class Environment {
  private readonly variables = new Map<string, VariableEntry>();
  private readonly functions = new Map<string, FunctionInstruction>();
  private readonly structs = new Map<string, StructInstruction>();

  constructor(
    public readonly name: string,
    public readonly symbolTable: SymbolTable,
    public readonly parent: Environment | null = null
  ) {}

  child(name: string): Environment {
    return new Environment(name, this.symbolTable, this);
  }

  declareVariable(name: string, type: TypeName, value: RuntimeValue, line: number, column: number): void {
    if (RESERVED_WORDS.has(name)) {
      throw new SemanticError(`"${name}" es una palabra reservada`, line, column);
    }
    if (this.variables.has(name) || this.functions.has(name) || this.structs.has(name)) {
      throw new SemanticError(`"${name}" ya existe en el ámbito ${this.name}`, line, column);
    }
    const assigned = coerceAssignable(value, type);
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

  assignVariable(name: string, value: RuntimeValue, line: number, column: number): void {
    const env = this.resolveVariableEnv(name);
    if (!env) throw new SemanticError(`Variable "${name}" no encontrada`, line, column);
    const current = env.variables.get(name)!;
    current.value = coerceAssignable(value, current.type);
  }

  getVariable(name: string, line: number, column: number): VariableEntry {
    const env = this.resolveVariableEnv(name);
    if (!env) throw new SemanticError(`Variable "${name}" no encontrada`, line, column);
    const entry = env.variables.get(name)!;
    return { ...entry, value: cloneValue(entry.value) };
  }

  getVariableRef(name: string, line: number, column: number): VariableEntry {
    const env = this.resolveVariableEnv(name);
    if (!env) throw new SemanticError(`Variable "${name}" no encontrada`, line, column);
    return env.variables.get(name)!;
  }

  defineFunction(fn: FunctionInstruction): void {
    if (this.functions.has(fn.name) || this.variables.has(fn.name) || this.structs.has(fn.name)) {
      throw new SemanticError(`"${fn.name}" ya fue declarado en el ámbito global`, fn.line, fn.column);
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

  getFunction(name: string): FunctionInstruction | null {
    return this.functions.get(name) ?? this.parent?.getFunction(name) ?? null;
  }

  defineStruct(structNode: StructInstruction): void {
    if (this.structs.has(structNode.name) || this.variables.has(structNode.name) || this.functions.has(structNode.name)) {
      throw new SemanticError(`"${structNode.name}" ya fue declarado en el ámbito global`, structNode.line, structNode.column);
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

  getStruct(name: string): StructInstruction | null {
    return this.structs.get(name) ?? this.parent?.getStruct(name) ?? null;
  }

  private resolveVariableEnv(name: string): Environment | null {
    if (this.variables.has(name)) return this;
    return this.parent?.resolveVariableEnv(name) ?? null;
  }
}
