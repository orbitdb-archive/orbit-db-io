import * as dagCbor from "@ipld/dag-cbor";
import {IPFS} from "ipfs-core";
import {PutOptions} from "ipfs-core-types/dist/src/block";
import {AbortOptions} from "ipfs-core-types/dist/src/utils";
import {CID} from "multiformats";
import {base58btc} from "multiformats/bases/base58";
import * as Block from "multiformats/block";
import {BlockCodec} from "multiformats/types/src/codecs/interface";
import {cidifyString} from "./common";
import {stringifyCid} from "./common";
import {OrbitDBIOOptions} from "./options";
import { sha256 } from 'multiformats/hashes/sha2'

const mhtype = 'sha2-256';

const codec: BlockCodec<113, any> = {
  name: dagCbor.name,
  code: dagCbor.code,
  decode: dagCbor.decode,
  encode: dagCbor.encode,
}

export async function dagCborRead<T = {}>(ipfs: IPFS, cid: CID, options: OrbitDBIOOptions): Promise<T> {
  const getOptions: AbortOptions = {
    timeout: options.timeout
  };
  const bytes = await ipfs.block.get(cid, getOptions);
  const block = await Block.decode({bytes, codec, hasher: sha256});

  let out = {};
  for (let key of (options.links||[])) {
    const link = stringifyCid(block.value[key], options);
    out = {...out, [key]: link};
  }
  return {...block.value, ...out}
}

function prepareValue(data: any, links: string[]): any {
  let out = data;
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    out[link] = cidifyString(out[link])
  }
  return out;
}

export async function dagCborWrite<T = {}>(ipfs: IPFS, data: T, options?: OrbitDBIOOptions): Promise<string> {
  const value = prepareValue(data, options.links||[]);

  return rawWrite(ipfs, value, options);
}

export async function rawWrite<T=any>(ipfs: IPFS, data: T, options: OrbitDBIOOptions): Promise<string> {
  const value = data;
  const block = await Block.encode({value, codec, hasher: sha256})
  const putOptions: PutOptions = {
    version: block.cid.version,
    format: options.format || "dag-cbor",
    mhtype,
    pin: options.pin,
    timeout: options.timeout
  }

  const cid = await ipfs.block.put(block.bytes, putOptions)

  return cid.toString(options.base || base58btc)
}
