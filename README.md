# tinsl

language for multi-pass texture-to-texture effects

## [live coding environment!](https://bandaloo.fun/playground)

## overview of the language

If you know GLSL, you know a lot of tinsl already. We'll go over some of the
things that tinsl has that GLSL doesn't. (The opposite is true too; tinsl lacks
or restricts things you can do with GLSL fragment shaders. We'll also cover
that.)

### type inference

tinsl can infer function return types and variable declaration types.

```c
// the GLSL way with no type inference (also valid tinsl)
vec2 glsl_style_rotate2d(vec2 v, float angle) {
  mat2 m = mat2(cos(angle), -sin(angle),
            sin(angle), cos(angle));
  return m * v;
}

// with type inference
fn tinsl_rotate2d(vec2 v, float angle) {
  m := mat2(cos(angle), -sin(angle),
            sin(angle), cos(angle));
  return m * v; // tinsl knows that a mat2 * vec2 -> vec2
}
```

Variable declarations have a few differences from GLSL:

- When you declare a variable, you must also give it an initial value. This is
  the case with both styles. Instead of `int x;` you must be explicit and write
  `int x = 0;`. Using `:=` makes this a little bit easier to remember.
- You cannot use assignments like expressions. They are only statements, like in
  Go and Python (well, before Python 3.8).
- You cannot declare multiple variables in the same statement with a comma.
  Separate each declaration by semicolons. The `:=` operator makes declaration
  succinct enough that multiple related declarations can fit on one line, e.g.
  `x := 1; y := 2; z := 3;`.
- Variable declarations must be inside function bodies. Because of this
  restriction, all functions are naturally "pure" functions; they cannot have
  side effects. This means that a `void` return type is meaningless, so it's not
  in tinsl.
- Variables declared with `:=` are "final" by default. If you want the variable
  to be mutable, you must write `mut x := 42;`. If you want a variable declared
  with the GLSL-style syntax to be "final", you can write `final x = 42;`. (GLSL
  lacks this; `const` can only be used for compile time constants.)
- Precision qualifiers are not in tinsl.

### default arguments and named arguments

tinsl allows for default arguments by putting an expression after `=` in a
function definition, similar to JavaScript.

```c
fn godrays (
  vec4 col = frag, // we haven't talked about frag yet
  float exposure = 1.,
  float decay = 1.,
  float density = 1.,
  float weight = 0.01,
  vec2 light_pos = vec2(.5, .5),
  int num_samples = 100,
  int channel = -1
) {
  // imagine a function body here that returns a vec4
}
```

If you have a lot of parameters like the above function, it is mighty convenient
to call the function with named arguments, and let all the other arguments
default. Say you just wanted to change `weight` and `num_samples`. You could
call the function like this:

```c
// we also haven't talked about what this arrow syntax is.
0 -> { godrays(num_samples: 50, weight: 0.02); } -> 0
```

There are a few things to note about named and default arguments:

- An implication of adding in optional arguments is that it that the best way to
  handle function overloads becomes a bit unclear. For now, function overloads
  are not allowed in tinsl.
- Default arguments must be trailing (e.g. `fn foo (int x = 1, int y)` is not
  allowed but `fn foo (int x, int y = 2)` is fine.
- You cannot mix the syntax for named arguments and ordered arguments in a
  function call.
- For now, you need an explicit parameter type even if you provide a default
  value. (The plan is to get rid of the need for this.)
- You cannot have `in`, `out` or `inout` parameters like in GLSL.
- Function parameters are immutable.

### color strings

tinsl provides some syntactic sugar for specifying colors. The expression
`"cornflower blue"` is syntactic sugar for `vec4(0.392, 0.584, 0.929)`. The 140
HTML5 named colors are included, and are insensitive to white space and casing.
You can use single quotes if you prefer. To include an alpha value, you can type
`"cornflower blue"4`. You can also use hex numbers for colors of length 3, 4, 6
or 8, e.g., `#f00`, `#f00f`, `#C0FFEE` or `#DEADBEEF`. Hex codes that include an
alpha value, like `#f00f` or `#ff0000ff`, will evaluate to a `vec4`, while hex
codes of length 3 or 6 will evaluate to a `vec3`. You could also do `"#ff0000"4`
to make the alpha value 1.

### render-to-texture

The best way to demonstrate what "render blocks" in tinsl are is through
example. This is the simplest tinsl program:

```c
0 -> { frag; }
```

It's essentially a tinsl no-op. It samples from the first texture (the one the
video is on in the playground), and renders out to the screen since it's the
last render block in the program. We could have also written it like this:

```c
{ frag0; }
```

This makes it more explicit that we're sampling from texture 0. We could have
also written it like this:

```c
{ frag(0); }
```

This is useful inside a function (or procedure, which we'll get to later) since
you can pass in an argument into frag.

```c
fn foo(int channel) { return frag(channel); }

{ foo(0); }
```

Let's create an effect that requires texture-to-texture rendering. A good
example of this is a pixel-accumulation motion blur.

```c
{ frag0 * 0.1 + frag1 * 0.9; } -> 1
{ frag1; }
```

That's the whole program. Run it in the playground and move your head around.
Some games use this to simulate drunkenness and it makes a lot of sense why.
Let's go all the way and add double vision:

```c
{ frag0 * 0.1 + frag1 * 0.9; } -> 1
// how many fingers am i holding up?
{ 0.5 * (frag1(npos + vec2(0.05, 0.)) + frag1(npos + vec2(-0.05, 0.)));
```

As you can see, we can pass in a `vec2` to choose where to sample from. In this
case, we sample twice by a constant offset from `npos` which is how you get the
current normalized position in tinsl.

This inebriation simulator became a convenient segue into blurriness. The
fastest way to perform a gaussian blur is to first blur horizontally, and then
take that blurred image and perform the same operation vertically. This is
something that cannot be done in a single fragment shader normally; we'll see
how tinsl lets us do this in a concise way.

This is an efficient function that lets us do a linear blur. Paste this in at
the top of your file.

```c
fn blur(vec2 dir, int channel = -1) {
  uv := pos / res;
  mut col := vec4(0.);
  off1 := vec2(1.411764705882353) * dir;
  off2 := vec2(3.2941176470588234) * dir;
  off3 := vec2(5.176470588235294) * dir;
  col += frag(channel, npos) * 0.1964825501511404;
  col += frag(channel, npos + (off1 / res)) * 0.2969069646728344;
  col += frag(channel, npos - (off1 / res)) * 0.2969069646728344;
  col += frag(channel, npos + (off2 / res)) * 0.09447039785044732;
  col += frag(channel, npos - (off2 / res)) * 0.09447039785044732;
  col += frag(channel, npos + (off3 / res)) * 0.010381362401148057;
  col += frag(channel, npos - (off3 / res)) * 0.010381362401148057;
  return col;
}
```

We set the default value for `channel` to `-1`. In tinsl, this means use the "in
number" of the surrounding render block. The "in number" is the number to the
left of the first arrow. We could explicitly pass in `0` since we'll be doing
the blur on the `0` texture, but this makes things a little nicer.

```c
0 -> loop 3 {
  blur(vec2(1., 0.));
  refresh;
  blur(vec2(0., 1.));
} -> 0
```

We can loop an operation by typing `loop <some positive int>` right before a
render block. We need to do this in two passes; if we did not have `refresh`,
the vertical blur would overwrite the horizontal blur. Before the next blur, we
must render out to a texture. We could have also written it like this by
creating nested render blocks:

```c
0 -> loop 3 {
  0 -> { blur(vec2(1., 0.)); } -> 0
  0 -> { blur(vec2(0., 1.)); } -> 0
} -> 0
```

You might notice there are a lot of zeros. This is redundant. We can leave off
the zeros in the inner render blocks; it will use the "in number" and "out
number" of the outer render block, which are both zero.

```c
0 -> loop 3 {
  { blur(vec2(1., 0.)); } // implicit 0 -> { ... } -> 0
  { blur(vec2(0., 1.)); } // implicit 0 -> { ... } -> 0
} -> 0
```

In fact, when you leave off the "in number" and "out number" on a render block
at the top level, it defaults to zero, so we could have left the outer numbers
off too.

Look at the 'club' example in the playground to see many of these techniques
in action.

### some notes about types, operators and built-ins

For completion's sake, tinsl includes `bvec`s, `ivec`s, `uvec`s and `uint`s, on
top of the more familiar `vec` and `mat` types. You can make arrays of all the
included types. The way you call constructors is the same as GLSL, although it
has _just_ come to my attention that you can construct a `mat2x3` with
`mat2x3(vec2, float, vec2, float)`. (This just seems confusing in my opinion.)
As it stands in tinsl, you have to choose all floats or all column vectors.
Additionally, the constructors for `vec`s and `mat`s do not accept `int` types
--- only floats. One note about array constructors is that, while in GLSL you
have some choice about where the square brackets go, in tinsl they always go
right after the type name. Using `:=` means you don't have to think about this
though.

```c
// (these statements are valid in a function body)
// BAD!! doesn't work in tinsl
float a[3] = float[3](1., 2., 3.); // BAD!! doesn't compile
float b[] = float[](1., 2., 3.); // BAD!! doesn't compile

// okay! works in tinsl
float[3] c = float[3](1., 2., 3.);
float[] d = float[](1., 2., 3.);
e := float[](1., 2., 3.);
```

tinsl also includes every operator down to `^=` (did you know that existed?)
except for `,`, the "sequence" or "comma" operator. There is no sampler type;
this is handled by `frag`.

Every builtin function in GLSL ES 300 is included, except for `modf` because one
of its parameters is an `out` parameter. All of these are listed in section 8,
printed page 84, PDF page 91, of this
[beach read](https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf).

tinsl does not include structs like GLSL does. There is no particular reason
for this other than it would have been more work and this is the first time
I've written anything you could almost call a compiler. Similarly, `for` is
the only looping construct.

### errors

If you manage to write a tinsl program that generates invalid GLSL,
congratulations! This is supposed to be impossible, so please copy paste your
program into a [new issue](https://github.com/bandaloo/tinsl). This is really a
big help.

tinsl syntax and compiler errors will show up directly in the playground editor.
The line that the error is on is underlined in red, and the character at the
reported column will have a dark red background. The exact column the error is
on might be slightly inaccurate.
