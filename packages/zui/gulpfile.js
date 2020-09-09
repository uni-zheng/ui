const _ = require('lodash');
const rollup = require('rollup');
const { series, src, dest, watch } = require('gulp');
const jeditor = require('gulp-json-editor');
const babel = require('@rollup/plugin-babel').default;
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const del = require('del');

function clean() {
  return del(['dist/*', '!dist/node_modules']);
}

function copyPublic() {
  return (
    src(['public/**/*'])
    .pipe(dest('dist/public'))
  );
}

async function build() {
  const bundle = await rollup.rollup({
    input: './es/index.js',
    external: [
      'lodash',
      'react',
      'react-is',
      'prop-types',
    ],
    plugins: [
      babel({
        exclude: '**/node_modules/**',
      }),
      nodeResolve(),
      commonjs({
        transformMixedEsModules: true,
      }),
    ],
  });

  await bundle.write({
    file: './dist/index.min.js',
    format: 'umd',
    name: 'Zui', // 设置名字
    exports: 'named',
    globals: {
      lodash: '_',
      react: 'React',
      'prop-types': 'PropTypes',
    },
  });

  await bundle.write({
    file: './dist/index.esm.js',
    format: 'esm',
    globals: {
      lodash: '_',
      react: 'React',
      'prop-types': 'PropTypes',
    },
  });
}

function makePackageJson() {
  return (
    src('./package.json')
    .pipe(jeditor(json => {

      return _.merge(json, {
        main: 'index.min.js',
      });
    }))
    .pipe(dest('dist'))
  );
}

const tasks = series(clean, copyPublic, build, makePackageJson);

exports.build = tasks;
exports.default = function () {
  tasks();

  watch([
    'es/**/*',
    'gulpfile.js',
  ], tasks);
};
