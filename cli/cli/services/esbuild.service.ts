import path from 'path'
import fs from 'fs'
import * as esbuild from 'esbuild';

/**
 * Service for running esbuild
 * Docs: https://esbuild.github.io/api/
 */
export class ESBuild {
  // Relative path to the entry point
  private entryPoint: string;

  // Relative path to the output file
  private outfile: string;

  constructor(
    private readonly NODE_ENV: string
  ) {
    this.entryPoint = 'src/__generated__/client/pages.generated.js';
    this.outfile = 'dist/static/pages.js';
  }

  /**
   * Run ESBuild
   */
  async run(): Promise<void> {
    if (!fs.existsSync(path.resolve(this.entryPoint))) {
      console.log(`The file ${this.entryPoint} does not exist. Skipping ESBuild.`);
      return;
    }

    try {
      await esbuild.build({
        entryPoints: [this.entryPoint],
        outfile: this.outfile,
        bundle: true,
        minify: false,
        format: 'esm',
        target: 'es2018',
        external: ['react', 'react-dom', 'react/jsx-runtime', '@kottster/react'],
        define: {
          'process.env.NODE_ENV': `"${this.NODE_ENV}"`
        },
        alias: {
          'react': 'https://esm.sh/react@18.3.1',
          'react-dom': 'https://esm.sh/react-dom@18.3.1',
          'react/jsx-runtime': 'https://esm.sh/react@18.3.1/jsx-runtime',
        },
        treeShaking: true,
        minifyIdentifiers: false,
        minifySyntax: false,
        minifyWhitespace: true,
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment',
        jsx: 'automatic',
      });
      console.log('ESBuild completed successfully.');
    } catch(e) {
      console.error('ESBuild error:', e);
    }
  }
}

