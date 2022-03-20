import typescript from '@rollup/plugin-typescript';
import {terser} from "rollup-plugin-terser";
import commonjs from '@rollup/plugin-commonjs';
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    resolve({
      preferBuiltins: true
    }),
    commonjs(),
    typescript({

    }),
    terser({
      compress: true,
    })
  ]
};
