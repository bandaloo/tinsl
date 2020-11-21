@preprocessor typescript

@{%
import { test } from "./nodes";
import { lexer } from "./lexer";
// cast the moo lexer to the nearley lexer
const nearleyLexer = (lexer as unknown) as NearleyLexer;
console.log(test);
%}

@lexer nearleyLexer

#main -> _ add_sub _ {% function(d) {return d[1]; } %}

number -> %float | %int {% id %}
