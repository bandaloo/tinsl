import { expect } from "chai";
import { parseAndCheck } from "./gen";
import { bloom, errBloom, godrays } from "./test.programs";

describe("complex program tests", () => {
  it("parses a bloom effect program", () => {
    expect(() => parseAndCheck(bloom)).to.not.throw();
  });

  it("parses a bloom effect program with multiple errors", () => {
    expect(() => parseAndCheck(errBloom)).to.throw("8 errors");
  });

  it("parses godrays effect", () => {
    expect(() => parseAndCheck(godrays)).to.not.throw();
  });
});

// TODO move to their own test file
describe("aggregate error tests", () => {
  it("reports multiple errors in function body alone", () => {
    expect(() =>
      parseAndCheck(`
fn multiple_errors () {
  int a = 1.;
  float b = 2;
  return 1;
}`)
    ).to.throw("2 errors");
  });

  it("reports multiple errors in function params and body", () => {
    expect(() =>
      parseAndCheck(`
fn multiple_errors (int c = 1.) {
  int a = 1.;
  float b = 2;
  return 1;
}`)
    ).to.throw("3 errors");
  });

  it("reports multiple errors in procedure body alone", () => {
    expect(() =>
      parseAndCheck(`
pr multiple_errors () {
  vec2(1., 1.);
  vec3(1., 1., 3.);
}`)
    ).to.throw("2 errors");
  });

  it("doesn't use plural 'error' when reporting a single error", () => {
    expect(() =>
      parseAndCheck("pr multiple_errors () { vec2(1., 1.); }")
    ).to.throw("1 error ");
  });

  it("reports multiple errors in procedure definition", () => {
    expect(() =>
      parseAndCheck(`
pr multiple_errors () {
  "green"3;
  { "blue"3; "red"3; } -> 1
}`)
    ).to.throw("3 errors");
  });

  it("reports multiple errors in condition and body of if", () => {
    expect(() =>
      parseAndCheck(`
fn foo () {
  mut a := 1;
  if (1 + 2) {
    a += "purple";
  }
  return a;
}`)
    ).to.throw("2 errors");
  });

  it("throws one error for broken function and not another for use", () => {
    expect(() =>
      parseAndCheck(`
fn foo () {
  if (false) { return 1u; }
  return 2;
}
{ foo(); }
`)
    ).to.throw("1 error");
  });

  it("throws only one error when performing binary op on undecided", () => {
    expect(() =>
      parseAndCheck(`
fn foo () {
  if (false) { return 1u; }
  return 2;
}
{ foo() / 2.; }
`)
    ).to.throw("1 error");
  });

  it("throws only one error when chained nested undecided functions", () => {
    expect(() =>
      parseAndCheck(`
fn foo () {
  if (false) { return 1u; }
  return 2;
}
fn bar () { return foo(); }
{ bar(); }
`)
    ).to.throw("1 error");
  });

  it("undecided type params don't throw an extra error", () => {
    expect(() =>
      parseAndCheck(`
fn foo () {
  if (false) { return 1u; }
  return 2;
}
fn bar (int a) { return "blue"4; }

{ bar(foo()); }
`)
    ).to.throw("1 error");
  });

  it("undecided default values don't throw an extra error", () => {
    expect(() =>
      parseAndCheck(`
fn foo () {
  if (false) { return 1u; }
  return 2;
}

fn bar (int a = foo()) { return "blue"4; }

{ bar(); }
`)
    ).to.throw("1 error");
  });
});

describe("testing pure params", () => {
  it("parses and checks two levels of pure params", () => {
    expect(() =>
      parseAndCheck(`
pr foo (int x) { x -> { "blue"4; } -> x }

pr bar (int y) { @foo(y); }

{ @bar(0); }
{ @bar(1); }`)
    ).to.not.throw();
  });

  it("parses and checks two levels of pure rb params", () => {
    expect(() =>
      parseAndCheck(`
pr foo (int x) { x -> { "blue"4; } -> x }

pr bar (int y) { @foo(y); }

{ @bar(0); }
{ @bar(1 + 1); }`)
    ).to.throw("atomic");
  });

  it("parses and checks two levels of pure frag params", () => {
    expect(() =>
      parseAndCheck(`
pr foo (int x) { frag(x); }

pr bar (int y) { @foo(y); }

{ @bar(0); }
{ @bar(1 + 1); }`)
    ).to.throw("atomic");
  });

  it("parses and checks two levels of pure rb params with default", () => {
    expect(() =>
      parseAndCheck(`
pr foo (int x) { x -> { "blue"4; } -> x }

pr bar (int y = 1 + 1) { @foo(y); }

{ @bar(); }`)
    ).to.throw("atomic");
  });
});
// TODO what about continued error reporting for functions where return type
// cannot be determined?

// TODO undecided tests for top def
// TODO undecided tests for var decls
