# mlut plugins #

<img alt="Logo" src="https://github.com/mlutcss/mlut/raw/master/docs/img/logo-full.png" width="350"/>

The [mlut](https://github.com/mlutcss/mlut) plugins for Rollup, Vite and Webpack. Based on [unplugin](https://unplugin.unjs.io/).

## Installation ##

```
npm i -D @mlut/plugins sass-embedded
```

When using this package, you will need to install Sass separately. We recommend [sass-embedded](https://www.npmjs.com/package/sass-embedded), but regular [sass](https://www.npmjs.com/package/sass) is also suitable.

This allows you to control the versions of all your dependencies, and to choose which Sass implementation to use.

## Usage ##

Import the plugin for the appropriate bundler from the `@mlut/plugins` package as in one of the examples below. You can find more detailed examples using dev-server and livereload in the plugin tests [directory](https://github.com/mlutcss/mlut/tree/master/test/plugins)

### Rollup ###

```js
// rollup.config.js
import { rollup } from '@mlut/plugins';

const mlut = rollup({
  output: 'dist/style.css',
  // other options...
});

export default {
  // rollup config...
  plugins: [mlut],
};
```

### Vite ###

```js
// vite.config.js
import { vite } from '@mlut/plugins';

const mlut = vite({
  output: 'dist/assets/style.css',
  // other options...
});

export default defineConfig(() => {
  return {
    // vite config...
    plugins: [mlut],
  }
});
```

### Webpack ###

```js
// webpack.config.js
import { webpack } from '@mlut/plugins';

const mlut = webpack({
  output: 'dist/style.css',
  // other options...
});

export default {
  // webpack config...
  plugins: [mlut],
};
```

## Options ##

The plugin options are similar to the mlut CLI options

```ts
interface Options {
  output: string,
  input?: string,
  minify?: boolean,
  autoprefixer?: boolean,
  noMergeMq?: boolean,
}
```

- `output` - output CSS file
- `input` - input Sass file when you import mlut, configure it and write other CSS
- `minify` - generate minified CSS. For this option to work, you need 1 of the following minifiers: [csso](https://github.com/css/csso), [lightningcss](https://github.com/parcel-bundler/lightningcss), [clean-css](https://github.com/clean-css/clean-css), [cssnano](https://github.com/cssnano/cssnano) or [esbuild](https://github.com/evanw/esbuild). You may already have it installed. When using `lightningcss`, you will also need to install [browserslist](https://github.com/browserslist/browserslist)
- `autoprefixer` - whether to add vendor prefixes to CSS properties. You need the [autoprefixer](https://github.com/postcss/autoprefixer) package or [lightningcss](https://github.com/parcel-bundler/lightningcss) for this option to work
- `noMergeMq` - prevent merging of CSS media queries during minification. Relevant only when using the csso minifier

You can add the options in your input Sass file too. Options must be a **valid JSON**, but single quotes is allowed. Paths will be resolved relative to the JIT engine working directory
```scss
@use '@mlut/core' with (
  $jit: (
    'output': 'dist/assets/style.css',
    'minify': true,
    'autoprefixer': true
  ),
);
```

## Documentation ##
Full documentation available [here](https://docs.mlut.style/section-start.html#kssref-start-integrations)

## License ##
MIT
