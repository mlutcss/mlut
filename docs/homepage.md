# My Little UI Toolkit #

<img alt="Logo" src="kss-assets/logo-full.png" style="display:block; margin:16px 0; max-width:350px"/>

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/mlutcss/mlut/test.yml?branch=master)](https://github.com/mlutcss/mlut/actions/workflows/test.yml)
[![](https://img.shields.io/npm/v/@mlut/core.svg)](https://www.npmjs.com/package/@mlut/core)
[![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/mlutcss)](https://x.com/mlutcss)

Atomic CSS toolkit with Sass and ergonomics for creating styles of any complexity. <br> Make CSS exciting again!

<img class="D Mb4gg" alt="GIF animation with usage example" src="kss-assets/jit-demo.gif"/>

## Features

<section class="Mb4gg">

### Strong naming convention
❌ **Tailwindcss**:
- `.justify-*`: content, items or self?
- `.flex` => `display: flex`, but `.flex-auto` => `flex: 1 1 auto;`
- `.bg-none` - reset all background? Nope, only `background-image`

❌ **Tachyons**:
- `.br-0` => `border-right-width: 0`, but `.br1` => `border-radius:.125rem`
- `.normal`: line-height, font-weight or letter-spacing?
- `.b`: bottom, border or `display: block`? Nope, it is `font-weight:bold`!

✅ **mlut**:
- `.Jc-c` => `justify-content: center`, `.Js-c` => `justify-self: center`
- `.Bdr` => `border-right: 1px solid`, `.Bdrd1` => `border-radius: 1px`

[One algorithm](https://mlutcss.github.io/mlut/section-concepts.html#kssref-concepts-naming) for all. If you know CSS, you almost know mlut.
</section>

<section class="Mb4gg">

### Almost arbitrary by design
- [values](https://mlutcss.github.io/mlut/section-concepts.html#kssref-concepts-values): `.Ml-1/7` => `margin-left: -14.3%`
- [states](https://mlutcss.github.io/mlut/section-concepts.html#kssref-concepts-states): `Bgc-red200_h,f` => `.Bgc-red200_h\,f:hover, .Bgc-red200_h\,f:focus {...}`
- [at-rules](https://mlutcss.github.io/mlut/section-concepts.html#kssref-concepts-at_rules): `@:p-c,w>=80r_D-f` => `@media (pointer: coarse), (min-width: 90rem) {...}`

</section>

<section class="Mb4gg">

### Great ergonomics
Shorter class names:
```html
<!-- Tailwindcss -->
<div class="relative -bottom-px col-span-full col-start-1 row-start-2 h-px bg-(--cardBg)"></div>

<!-- mlut -->
<div class="Ps B-1 Gc1/-1 Gcs1 Grs2 H1 Bgc-$cardBg"></div>
```
Convenient syntax for complex values, states and at-rules. It is like Vim for CSS.

**❌ Tailwindcss:**

- `[@media(any-hover:hover){&:hover}]:opacity-100`
- `text-[length:var(--myVar,1.3rem)]`
- `supports-[margin:1svw]:ml-[1svw]`

**✅ mlut:**
- `@:ah_O1_h` => `@media (any-hover) { .\@\:ah_O1_h:hover { opacity: 1 } }`
- `Fns-$myVar?1.3` => `font-size: var(--ml-myVar, 1.3rem);`
- `@s_Ml1svw` => `@supports (margin-left: 1svw) { .\@s_Ml1svw { margin-left: 1svw } }`

</section>

<section class="Mb4gg">

### Handy extension
Add utilities, states and custom at-rules with few lines of code
```scss
@use 'mlut' as ml with (
  // add utilities
  $utils-data: (
    'utils': (
      'registry': (
        'Mil': margin-inline,
        'Ir': (
          'properties': image-rendering,
          'keywords': (
            'p': pixelated,
          ),
        ),
      ),
    ),
  ),

  // add states
  $utils-config: (
    'states': (
      'custom': (
        'are': '[aria-expanded=“true”]',
      ),
    ),
  ),
);

@include ml.apply('Mil-15_-are Ir-p');

// CSS

.Mil-15_-are[aria-expanded=“true”] {
  margin-inline: -15px;
}

.Ir-p {
  image-rendering: pixelated;
}
```

</section>

<section class="Mb4gg">

### And also...
- 💅️ Written in [Sass](https://www.sass-lang.com/) and includes all its benefits
- ⚡ JIT (on-demand) and AOT mods are available
- 🔧 **Fully customizable**: change tokens, utilities names and any settings
- ✨ **Easy to integrate** in existing project. No name collisions with your CSS in the most projects. Increasing specificity in [one line](https://mlutcss.github.io/mlut/section-settings.html#kssref-settings-utils-other-up_specificity) or for [one](https://mlutcss.github.io/mlut/section-concepts.html#kssref-concepts-states-special-tu) utility.

</section>

<section class="Mb3gg">

## Structure ##
- Sass tools
- opt-in CSS library
- Sass addons
- JIT engine

### Library ###
The library part of toolkit consists of:

- base styles - variables and generic CSS like reset, normalize etc.
- helpers - similar to utilities: the same universal, but more complex and can consist of several CSS rules

The library is **modular** and you can include only what you need

### Tools ###
Sass tools include:

- settings based on which the everything works 
- mixins and functions with which you can generate utilities and write styles

### Addons ###
Addons may contains any tools, settings and styles. Addons now at the **preview** stage and in the future be moved to separate packages
</section>

<section class="Mb3gg kss-description">

## Packages ##

<div class="Mt6u">

| Package | Description |
| ---  | --- |
| [mlut](https://github.com/mlutcss/mlut/blob/master/packages/mlut) | The main package for working with CLI |
| [@mlut/core](https://github.com/mlutcss/mlut/blob/master/packages/core) | The mlut core that contains Sass tools, CSS library and JIT engine |
| [@mlut/plugins](https://github.com/mlutcss/mlut/blob/master/packages/plugins) | The mlut plugins for Rollup, Vite and Webpack |

</div>
</section>

<section class="Mb4gg">

## Articles ##
- Atomic CSS Deep Dive: [EN](https://dev.to/mr150/atomic-css-deep-dive-1hee), [RU](https://habr.com/ru/articles/833712/)
- [mlut - a new word in the Utility-First CSS approach](https://dev.to/mr150/mlut-a-new-word-in-the-utility-first-css-approach-gbl)
- How to make one plugin for all frontend bundlers at once: [RU](https://habr.com/ru/articles/856028/)
- Interactive lesson: [EN](https://htmlacademy.org/tutorials/17), [RU](https://htmlacademy.ru/demos/183/step/17)
- I hired a junior dev for my open source project. This is what happened: [RU](https://habr.com/ru/articles/962468/)

</section>

<section class="Mb4gg">

## What next? ##
- first-class pseudoselectors with arguments like `has()`
- performance optimization
- plugins for editors and IDEs with hints and autocompletion
- and much more!

</section>

<section class="Mb4gg">

## Acknowledgement ##
- [CSS](https://www.w3.org/Style/CSS/)
- [Emmet](https://github.com/emmetio)
- [ACSS](https://acss.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tachyons](https://tachyons.io/)

</section>

## License ##
MIT
