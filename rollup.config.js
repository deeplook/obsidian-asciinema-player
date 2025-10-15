import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import url from '@rollup/plugin-url';

// Rewrites asciinema-player template helpers to avoid injecting HTML strings unsafely.
const sanitizeAsciinemaTemplates = () => {
  const replacement = [
    'const t = document.createElement("template");',
    'const range = document.createRange();',
    'const fragment = range.createContextualFragment(html);',
    'const firstChild = fragment.firstChild;',
    't.content.append(fragment);',
    'return firstChild;'
  ].join('\n    ');

  return {
    name: 'sanitize-asciinema-templates',
    transform(code, id) {
      if (!id.includes('asciinema-player')) {
        return null;
      }

      const pattern = /const t = document\.createElement\("template"\);\s*t\.innerHTML = html;\s*return t\.content\.firstChild;/g;
      const updated = code.replace(pattern, replacement);

      if (updated === code) {
        return null;
      }

      return {
        code: updated,
        map: null,
      };
    },
  };
};

const isProd = (process.env.BUILD === 'production');

export default {
  input: 'src/main.ts',
  output: {
    dir: '.',
    sourcemap: 'inline',
    sourcemapExcludeSources: isProd,
    format: 'cjs',
    exports: 'default',
  },
  external: ['obsidian'],
  plugins: [
    typescript(),
    nodeResolve({ browser: true }),
    commonjs(),
    postcss({
      extract: false,
      inject: true,
      use: ['sass'],
    }),
    url({
      include: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.gif', '**/*.woff', '**/*.woff2'],
      limit: Infinity,
      emitFiles: false,
    }),
    sanitizeAsciinemaTemplates(),
  ],
};
