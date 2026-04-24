import { SymbolRecord } from "./Symbol";

export class SymbolTable {
  private readonly symbols: SymbolRecord[] = [];

  add(record: SymbolRecord): void {
    this.symbols.push(record);
  }

  all(): SymbolRecord[] {
    return [...this.symbols];
  }

  clear(): void {
    this.symbols.length = 0;
  }
}
