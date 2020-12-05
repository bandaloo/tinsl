import * as nearley from "nearley";
import grammar from "./grammar";
import util from "util";

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

//parser.feed("1 + 2 / 3 * 4 - (5 * 6)");
parser.feed("1->loop 3 once{\n1 + ~ ~~2 + 3\n3 + 4  \n \n 5}->0");
console.log(
  util.inspect(parser.results, {
    showHidden: false,
    depth: null,
    colors: true,
  })
);
