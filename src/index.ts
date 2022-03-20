import {IPFS} from "ipfs-core";
import { CID } from 'multiformats';
import {code as dagPbCode} from '@ipld/dag-pb';
import {code as dagCborCode} from '@ipld/dag-cbor';
import {dagCborRead} from "./dag-cbor";
import {rawWrite} from "./dag-cbor";
import {dagCborWrite} from "./dag-cbor";
import {dagPbRead} from "./dag-pb";
import {dagPbWrite} from "./dag-pb";
import {OrbitDBIOOptions} from "./options";
import { toCID } from "./common";


export async function read<T = any>(ipfs: IPFS, _cid: string | CID, options: OrbitDBIOOptions = {}): Promise<T> {
  let cid: CID = toCID(_cid);

  if (cid.code === dagPbCode) {
    return dagPbRead(ipfs, cid, options);
  } else if (cid.code === dagCborCode) {
    return dagCborRead(ipfs, cid, options);
  }

  throw new Error(`codec with code ${cid.code} is not supported on read`)
}

export async function write<T = {}>(ipfs: IPFS, format: OrbitDBIOOptions['format'], value: T, options: OrbitDBIOOptions = {}): Promise<string> {
  if (format === 'dag-pb' || options.format === 'dag-pb') {
    return dagPbWrite<T>(ipfs, value, options)
  } else if (format === 'dag-cbor') {
    return dagCborWrite<T>(ipfs, value, options)
  } else if (format === 'raw') {
    return rawWrite(ipfs, value, options)
  }

  throw new Error(`codec with format ${format} is not supported`)
}
