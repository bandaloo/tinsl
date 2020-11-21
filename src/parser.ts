import * as nearley from "nearley";
import grammar from "./grammar";
import util from "util";

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

parser.feed("1 + 2 / 3 * 4 - (5 * 6)");
console.log(
  util.inspect(parser.results, {
    showHidden: false,
    depth: null,
    colors: true,
  })
);
