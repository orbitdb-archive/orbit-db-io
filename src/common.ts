import {CID} from "multiformats";
import { base58btc } from "multiformats/bases/base58";
import {OrbitDBIOOptions} from "./options";

const defaultBase = base58btc

function isArrayString(value: unknown): value is string[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return !value.some((v) => typeof v !== "string");
}

export function cidifyString<T extends string|string[]>(src: T): T extends string ? CID : CID[] {
  if (typeof src === 'string') {
    return (CID.parse(src) as any);
  }

  if (isArrayString(src)) {
    return (src.map(s => CID.parse(s)) as any);
  }

  throw Error('src have unknown type')
}

export function toCID(src: CID | string): CID {
  if (typeof src === 'string') return cidifyString(src);

  return src;
}

export const stringifyCid = <T extends CID|CID[]>(cid: CID, options: OrbitDBIOOptions = {}): T extends CID ? string : string[] => {
  if (Array.isArray(cid)) {
    return (cid.map(c => stringifyCid(c, options)) as any)
  }

  const base = options.base || defaultBase
  return (cid.toString(base) as any)
}
