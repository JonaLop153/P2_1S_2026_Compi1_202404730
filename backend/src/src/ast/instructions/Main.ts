import { FunctionInstruction } from "./Function";
import { Node } from "../Node";

export class MainInstruction extends FunctionInstruction {
  constructor(body: Node[], line: number, column: number) {
    super("main", [], null, body, line, column);
  }
}
