import * as nearley from "nearley";
import grammar from "./grammar";
import util from "util";

console.log("running");
const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

//parser.feed("{(true ? true ? 1 : 2 : false) ? 3 : 4;}->0");
parser.feed("float foo (float bar) { for(float i = 1; i < 3; i++) a+=1; }");

console.log(
  util.inspect(parser.results, {
    showHidden: false,
    depth: null,
    colors: true,
  })
);

console.log(
  util.inspect(
    parser.results[0].map((e: any) => e.toJson()),
    {
      showHidden: false,
      depth: null,
      colors: true,
    }
  )
);
