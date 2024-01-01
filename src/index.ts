import { Compilation, Compiler } from 'webpack';
import fs from 'node:fs';
import path from 'node:path';

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
class WebpackGenAssetsPlugin {
  private options: IOptions;
  private previousSnapshot: Map<string, number>;
  constructor(options: IOptions = {}) {
    this.options = {
      include: options.include || /\.(png|jpe?g|gif|webp|svg)$/i,
      assetsDir: options.assetsDir || path.resolve(process.cwd(), 'src/assets'),
      outputFilePath: options.outputFilePath || path.resolve(process.cwd(), 'src/assets/assets.ts'),
    };
    this.previousSnapshot = new Map();
  }

  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap('WebpackGenAssetsPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'WebpackGenAssetsPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          this.generateAssetsEnum();
        }
      );
    });
  }

  toPascalCaseWithoutSpecialChars(str: string) {
    return str
      .replace(/\.[^.]+$/, '')
      .split(/[-@\s]/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  generateImportName(filePath: string, relativeToAssetsDir: string) {
    const relativePath = path.relative(relativeToAssetsDir, filePath);
    // const importName = relativePath.replace(/\.[^.]+$/, '')
    //   .replace(/[^a-zA-Z0-9]/g, '_') // 将非字母数字字符替换为下划线
    // // .replace(/^_|_$/g, ''); // 移除前后的下划线（如果有）
    // return `_${importName}`; // 以下划线开始以避免数字开头的情况
    return this.toPascalCaseWithoutSpecialChars(relativePath).replace(/\/(.?)/g, (_, group1) => group1.toUpperCase());
  }

  generateAssetsMap(dir: string, nestedPath = '', relativeToAssetsDir?: string) {
    const files = fs.readdirSync(dir);
    let assets = '';
    let imports = '';
    let hasChanged = false;

    for (const file of files) {
      const filePath = path.join(dir, file);
      const fileInfo = fs.statSync(filePath);

      if (fileInfo.isFile() && this.options.include?.test(file)) {
        const lastModified = fileInfo.mtimeMs;
        const prevModified = this.previousSnapshot.get(filePath);
        if (lastModified !== prevModified) {
          hasChanged = true;
          this.previousSnapshot.set(filePath, lastModified);
        }
        if (hasChanged) {
          const importName = this.generateImportName(filePath, relativeToAssetsDir || this.options.assetsDir!);
          const relativePath = `./${path.relative(this.options.assetsDir!, filePath).replace(/\\/g, '/')}`;
          imports += `export { default as ${importName} } from '${relativePath}';\n`;
          // const key = this.toPascalCaseWithoutSpecialChars(file);
          // assets += `  ${key}: ${importName},\n`;
        }
      } else if (fileInfo.isDirectory()) {
        const nestedImportsAndAssets = this.generateAssetsMap(filePath, `${nestedPath}${file}.`, relativeToAssetsDir);
        if (nestedImportsAndAssets.hasChanged) {
          hasChanged = true;
        }
        if (hasChanged) {
          // const dirKey = this.toPascalCaseWithoutSpecialChars(file);
          // assets += `  ${dirKey}: {\n`;
          imports += nestedImportsAndAssets.imports;
          // assets += nestedImportsAndAssets.assets;
          // assets += `  },\n`;
        }
      }
    }

    return { imports, assets, hasChanged };
  }

  generateAssetsEnum() {
    const { imports, hasChanged } = this.generateAssetsMap(this.options.assetsDir!);
    if (hasChanged) {
      const code = `/* eslint-disable */\n${imports}\n`;

      fs.writeFileSync(this.options.outputFilePath!, code);
    }
  }
}

export default WebpackGenAssetsPlugin;
