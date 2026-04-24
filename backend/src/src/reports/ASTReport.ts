import { Node } from "../ast/Node";
import { Graphviz } from "../utils/Graphviz";

export class ASTReport {
  static generate(nodes: Node[]): string {
    return Graphviz.build(nodes);
  }
}
