# getting started with tinsl 

tinsl is a language for creating post-processing effects that can run in real
time. It would be helpful to know a little bit about fragment shaders for this
tutorial, however, if you are completely new to this, that is okay too. If you
want to learn more about fragment shaders, [The Book of
Shaders](https://thebookofshaders.com/) is a fun way to get started.

Follow along in this tutorial with the [tinsl
playground](https://bandaloo.fun/playground). Chrome is the recommended browser
for this. Firefox should also work, but use Chrome if you have the option.
Resize your window to make it wide enough so that nothing is cut off. You can
enable your webcam and microphone for this. The microphone is used for
audio-reactive components that are not required for this tutorial. However, if
you do not have a webcam or you do not want to give permission to use it, that
is okay too. You will get a test image that you can use to complete the
tutorial.

What separates tinsl from a shading language? (After all, the acronym for tinsl
claims that it's not one.) tinsl allows you to specify a rendering pipeline
using special semantics to render to off-screen textures. This is not as
complicated as it sounds. Let's see how that works:

```c
{ vec4(1., 0., 0., 1.); } -> 0 // render to texture 0 (red)
{ vec4(0., 0., 1., 1.); } -> 1 // render to texture 1 (blue)
{ frag0 + frag1; } // add texture 0 and texture 1, render to screen (magenta) 
```

What you see in the previous code example is a series of three "render blocks".
Render blocks are a series of expressions that evaluate to a `vec4` (a four
component floating point vector) separated by semicolons, enclosed by curly
brackets. In this particular example, we only have one such expression statement
in each block. Each component of the `vec4` corresponds to red, green, blue and
alpha (transparency) in that order. In the first line, we create a vector to
represent solid red, with an instruction to render the final output of that
block to texture 0.

In the next line, we do the same thing, but we make texture 1 blue. In the final
render block, we sample from the two textures we wrote to and add them together.
Red and blue make magenta, so that's what we see.

(Note: in the playground, the lowest texture number used in the program is the
texture that the video feed is on. We'll use zero for all these examples, but if
you ignore texture 0 by commenting out a line of code, the video feed will be on
the next lowest texture number. Keep this in mind! We're overwriting the video
texture in this example because we don't care about it.)

Perhaps you don't find a pink screen particularly compelling. Tough, but fair.
Let's create a feedback effect that simulates motion blur. We do this by using
an extra texture texture for color accumulation. Delete everything and paste
this in:

```c
once { frag0; } -> 1 // prime our color accumulation texture just once!
{ frag0 * 0.03 + frag1 * 0.97; } -> 1 // accumulate colors
{ frag1; } // render to the screen
```

Run this program in the playground and wave your hand around. Many video games
use this kind of effect to simulate drunkenness and I think it's pretty apparent
why. (Motion blur in modern video games is not often done with color
accumulation anymore. Instead, objects are blurred based on their velocity; this
method allows camera movement to be removed from the motion blur equation, which
is just way nicer for actual gameplay.)

The first line is a bit of a nitpick. If you got rid of it, the image would
slowly fade in, but with this small addition we can copy the contents of our
video stream texture on the first draw call. `once` lets us do this, well, once.
If we left off the `once`, we'd be overwriting our accumulation texture each
draw call, which we don't want! This would result in no blur at all.

The next line blends a bit of our video stream (3% of it) with a lot of our
accumulation texture (97% of it). You can bump these coefficients around to see
how this changes the final effect. (If they don't add up to 1 the feedback loop
might blow up and go to white!) The values give us a very pronounced effect.

The last line renders the accumulation texture to the screen. If we forgot this
line (try it, comment it out) we'll still see an image but we don't get a motion
blur. This is because the last render block in a tinsl program always goes to
the screen. The `-> 1` of the previous block is ignored, and texture 1 never
gets used as an accumulation texture. Keep this in mind! If you think this is a
footgun and overall design flaw, I'm inclined to agree. However, this is how it
is for now.

Okay, let's do another effect. Delete everything! In Tinsl, we can have
functions that look like GLSL. In fact, (nearly) all of the builtin functions
and operators of GLSL 3.00 can be used in tinsl function definitions. Paste this
in:

```c
fn luma(vec4 color) {
  v := vec3(0.299, 0.587, 0.114); // coefficients for each color channel
  return dot(color.rgb, v);
}
```

You can think of this function as taking in a color and returning how bright it
is. Notice that we can declare variables with `:=` to get static type inference,
and we don't need to specify the return type of a function either. tinsl takes
care of that. We could have been explicit and written this function in the GLSL
compatible way. This is helpful if you're just pasting in GLSL functions you
find on the internet:

```c
float luma(vec4 color) {
  vec3 v = vec3(0.299, 0.587, 0.114);
  return dot(color.rgb, v);
}
```

But, the first way is nicer, don't you think? (Truthfully, there are arguments
to be made for either style.) Moving on, let's use this function to turn our
camera feed into a bespoke black-and-white. We'll write a simple function to do
this:

```c
fn black_and_white() {
  gray := vec3(luma(frag)); // grayscale rgb value
  return vec4(gray, 1.); // return a gray color with an alpha of 1.
}
```

You'll notice we left off the number after `frag`. When there's no number, tinsl
will sample from the "in number" of the enclosing render block. We do that by
including an arrow before the render block:

```c
0 -> { black_and_white(); }
```

Run the program now to check that everything's in black and white. Let's do
something that maps the domain of the image to a different coordinate space. In
other words, let's turn the image upside down. Delete the render block we just
wrote and replace it with this:

```c
0 -> { frag(vec2(0., 1.) - npos); }
```

Run it, and you'll see that you're now upside down (and in full color again). I
mentioned earlier that you could have multiple `vec4` expression statements.
Let's do that, and add back in our black and white filter. Augment the existing
render block to look like this:

```c
0 -> {
  frag(vec2(0., 1.) - npos);
  black_and_white();
}
```

If we call `frag` like a function and pass in a `vec2`, we can sample from
off-center. The `npos` keyword is the normalized pixel position. We invert the y
component to flip the image.

Run this, and wait...what happened? You're in black and white again, but you're
now right side up. The issue here is that we want the color of the previous
operation; we don't want to sample from the original image again, like
`black_and_white` does with `frag`. The `prev` keyword lets us do this. To fix
our issue, let's make `black_and_white` take in an argument. Update the function
definition, and while we're at it let's just inline the luma part: 

```c
fn black_and_white(vec4 color) {
  return vec4(vec3(luma(color)), 1.);
}
```

Now, update the call to `black_and_white` and pass in `prev`:

```c
0 -> {
  frag(vec2(0., 1.) - npos);
  black_and_white(prev);
}
```

To summarize, we can use `frag` like a function and pass in a `vec2` to sample
from a different position. This is useful in conjunction with `npos`, which
allows you to transform the coordinate space. `prev` lets us chain together
steps without breaking up a render block. As an aside, if we _really_ wanted to
break these into separate steps, we could have broken this into two render
blocks:

```c
0 -> { frag(vec2(0., 1.) - npos); } -> 0
0 -> { black_and_white(frag); } // renders to screen
// don't do this if you don't have to!!!
```

This works because the `black_and_white` call is in a separate render block, and
`frag` has access to a fresh new texture 0. As the code comment indicates, don't
do this if you don't have to! The single render block version from earlier is
more efficient. However, there are cases where breaking an operation into two
passes is the most efficient option (see: Gaussian blur, which is a
mathematically separable image processing filter.) We can do the same thing with
the `refresh` keyword:

```c
0 -> {
  frag(vec2(0., 1.) - npos);
  refresh; // now `frag` has access to the updated fragments
  black_and_white(frag);
} 
```

## survey code 

Take a look at the following block of code. It may contain syntax you are
unfamiliar with, so you are not expected to accurately predict what it will do.
Even so, please try to guess at the effect it will produce. Once you have made
your guess, run the following code. Take a note of whether your intuition was
correct; it will be asked on the survey. 

```c
// the same luma function in the tutorial previously 
fn luma(vec4 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}

{ mix('red'4, 'blue'4, luma(frag)); }
```

Thank you for going through the tutorial! Please fill out this short survey at
the following link: [click here](https://forms.gle/uusT8cGXhjZNupC1A).
