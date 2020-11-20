// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }

import {test} from "./nodes";
console.log(test);

interface NearleyToken {  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: NearleyToken) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: undefined,
  ParserRules: [
    {"name": "main$ebnf$1$subexpression$1", "symbols": ["statement", {"literal":"\n"}]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1$subexpression$1"]},
    {"name": "main$ebnf$1$subexpression$2", "symbols": ["statement", {"literal":"\n"}]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1", "main$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "main", "symbols": ["main$ebnf$1"]},
    {"name": "statement$string$1", "symbols": [{"literal":"f"}, {"literal":"o"}, {"literal":"o"}], "postprocess": (d) => d.join('')},
    {"name": "statement", "symbols": ["statement$string$1"]},
    {"name": "statement$string$2", "symbols": [{"literal":"b"}, {"literal":"a"}, {"literal":"r"}], "postprocess": (d) => d.join('')},
    {"name": "statement", "symbols": ["statement$string$2"]}
  ],
  ParserStart: "main",
};

export default grammar;
