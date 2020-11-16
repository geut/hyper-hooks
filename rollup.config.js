import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

import pkg from './package.json'

const isDevelopment = process.env.NODE_ENV === 'development'

const plugins = [
  resolve({
    preferBuiltins: true
  }),

  babel({
    babelHelpers: 'runtime'
  }),

  commonjs(),

  !isDevelopment && terser()
].filter(Boolean)

export default [
  {
    input: 'src/index.js',
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true }
    ],
    plugins,
    external (id) { return !/^[./]/.test(id) }
  }
]
