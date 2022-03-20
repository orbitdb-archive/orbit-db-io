import {PBNode} from "@ipld/dag-pb";
import * as pbCodec from "@ipld/dag-pb";
import {IPFS} from "ipfs-core";
import {PutOptions} from "ipfs-core-types/dist/src/block";
import {PreloadOptions} from "ipfs-core-types/dist/src/utils";
import {AbortOptions} from "ipfs-core-types/dist/src/utils";
import {CID} from "multiformats";
import {base58btc} from "multiformats/bases/base58";
import * as Block from "multiformats/block";
import {BlockCodec} from "multiformats/types/src/codecs/interface";
import {TextDecoder} from "util";
import {TextEncoder} from "util";
import {OrbitDBIOOptions} from "./options";
import { sha256 } from 'multiformats/hashes/sha2'

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const mhtype = 'sha2-256'
const defaultBase = base58btc

const codec: BlockCodec<112, PBNode> = {
  name: pbCodec.name,
  code: pbCodec.code,
  decode: pbCodec.decode,
  encode: pbCodec.encode
}

export async function dagPbRead<T = {}>(ipfs: IPFS, cid: CID, options: OrbitDBIOOptions): Promise<T> {
  const getOptions: AbortOptions = {
    timeout: options.timeout
  };
  const bytes = await ipfs.block.get(cid, getOptions);
  const block = await Block.decode({bytes, codec, hasher: sha256})
  return JSON.parse(txtDecode(block.value.Data))
}

export async function dagPbWrite<T = {}>(ipfs: IPFS, data: T, options: OrbitDBIOOptions): Promise<string> {
  const json  = JSON.stringify(data)
  const value: PBNode = { Data: txtEncode(json), Links: [] }
  const block = await Block.encode({value, codec, hasher: sha256})

  const putOptions: PutOptions = {
    version: block.cid.version,
    format: 'dag-pb',
    mhtype,
    pin: options.pin,
    timeout: options.timeout
  }
  const cid = await ipfs.block.put(block.bytes, putOptions);
  return cid.toV0().toString(options.base || defaultBase)
}

function txtEncode(str: string): Uint8Array {
  return textEncoder.encode(str)
}

function txtDecode(bytes: Uint8Array): string {
  return textDecoder.decode(bytes);
}
