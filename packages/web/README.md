# mlut web #

<img alt="Logo" src="https://github.com/mlutcss/mlut/raw/master/docs/img/logo-full.png" width="350"/>

The [mlut](https://github.com/mlutcss/mlut) package that can be used on a web page.

## Usage ##

Add the script to your page:
```html
<script src="https://unpkg.com/@mlut/web@latest/dist/script.js" type="module"></script>
```

And just use classes in the markup:
```html
<div class="D-g Gtc-t3">
  <div class="Bd P2u">
    <h3>Simple text</h3>
```
You can also use Sass config with the special `style` tag
```html
<style type="text/scss">
  @use "@mlut/core/tools" with (
    $breakpoints: (
      'xxl': 1600px,
    ),
  );
</style>
```

## Documentation ##
Full documentation available [here](https://docs.mlut.style/)

## License ##
MIT
