# webpack-gen-assets-plugin

## Install
```shell
pnpm add webpack-gen-assets-plugin -D
```

## Usage
```ts
// webpack.conf.js
const WebpackGenAssetsPlugin = require('webpack-gen-assets-plugin');

module.exports = {
  plugins: [
    new WebpackGenAssetsPlugin()
  ]
}
```

## Options
```ts
interface IOptions {
  /**
   * Resource matching rules
   * default: /\.(png|jpe?g|gif|webp|svg)$/i
   */
  include?: RegExp;
  /**
   * Resource directory
   * default: src/assets
   */
  assetsDir?: string;
  /**
   * Output path
   *default: src/assets/assets.ts
   */
  outputFilePath?: string;
}
```

## Demo
```
./src/assets
├── farm
│   ├── add-steps.png
│   ├── add.png
├── item_selected.jpeg
├── pet
│   ├── icon-bg.jpg
```

```ts
export { default as ImagesAddSteps } from './farm/add-steps.png';
export { default as ImagesAdd } from './farm/add.png';
export { default as ImagesItem_selected } from './item_selected.jpeg';
export { default as ImagesPetIconBg } from './pet/icon-bg.jpg';
```