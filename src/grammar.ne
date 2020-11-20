@preprocessor typescript

@{%
import { test } from "./nodes";
console.log(test);
%}

main -> (statement "\n"):+
statement -> "foo" | "bar"
