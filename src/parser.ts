import * as nearley from "nearley";
import grammar from "./grammar";
import util from "util";

console.log("running");
const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

//parser.feed("{(true ? true ? 1 : 2 : false) ? 3 : 4;}->0");
//parser.feed("float foo (float bar) {for(int i=0;i<3;i++)j++;;}");
//parser.feed("float foo (float bar) {if (1 < 2) {3; 4;} else 5}");
//parser.feed("{@some_proc(1, 2);}");
parser.feed(`
fn foo (int a) { return a; }
fn bar() { return foo(a: 2); }`);
if (parser.results.length > 1) {
  console.error("ambiguous grammar!");
}

/*
console.log(
  util.inspect(constructors, {
    showHidden: false,
    depth: null,
    colors: true,
  })
);
*/

for (let i = 0; i < parser.results.length; i++) {
  console.log(
    util.inspect(
      parser.results[i].map((e: any) => e.toJson()),
      {
        showHidden: false,
        depth: null,
        colors: true,
      }
    )
  );
}
console.log("done " + parser.results.length);
