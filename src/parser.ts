import * as nearley from "nearley";
import grammar from "./grammar";

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

parser.feed("123.4");
console.log(parser.results);
