import {MultibaseEncoder} from "multiformats/types/src/bases/base";


export interface OrbitDBIOOptions {
  base?: MultibaseEncoder<any>
  timeout?: number
  links?: string[]
  format?: 'dag-pb' | 'dag-cbor' | 'raw'
  pin?: boolean
}
