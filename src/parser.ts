import * as nearley from "nearley";
import grammar from "./grammar";
import util from "util";

console.log("running");
const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

// TODO what about casting?
//parser.feed("1 + 2 / 3 * 4 - (5 * 6)");
//parser.feed( "1->loop 3 once{\n1 + ~ ~~(2 + 3)\n3 + !4  \n \n 5<<1 < 3 != 4}->0");

//parser.feed("{1|2^3&4}->0");
parser.feed("{1&2^3|4}->0");
console.log(
  util.inspect(parser.results, {
    showHidden: false,
    depth: null,
    colors: true,
  })
);
