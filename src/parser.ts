import * as nearley from "nearley";
import grammar from "./grammar";
import util from "util";

console.log("running");
const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

//parser.feed("1 + 2 / 3 * 4 - (5 * 6)");
//parser.feed( "1->loop 3 once{\n1 + ~ ~~(2 + 3)\n3 + !4  \n \n 5<<1 < 3 != 4}->0");

//parser.feed("{-1||0&&1|2^3&4+-(5)*6}->0");
//parser.feed("{ something()++\narr[1] }->0");
//parser.feed("{true && false}->0");
//parser.feed("{-1||0&&1&2^3|4}->0");
//parser.feed("float foo (float bar) { test }");
parser.feed("float foo (float bar, float baz) { test }");
//parser.feed("{1}->0");
console.log(
  util.inspect(parser.results, {
    showHidden: false,
    depth: null,
    colors: true,
  })
);
