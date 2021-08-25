const { CID } = require('multiformats/cid')
const { base58btc } = require('multiformats/bases/base58')
const defaultBase = base58btc

const cidifyString = (str) => {
  if (!str) {
    return str
  }

  if (Array.isArray(str)) {
    return str.map(cidifyString)
  }

  return CID.parse(str)
}

const stringifyCid = (cid, options = {}) => {
  if (!cid || typeof cid === 'string') {
    return cid
  }

  if (Array.isArray(cid)) {
    return cid.map(stringifyCid)
  }

  if (cid['/']) {
    return cid['/']
  }

  const base = options.base || defaultBase
  return cid.toString(base)
}

const writePb = async (ipfs, payload, options) => {
  const dagNode = {
    Data: new TextEncoder().encode(JSON.stringify(payload)),
    Links: []
  }

  const cid = await ipfs.dag.put(dagNode, {
    format: 'dag-pb',
    hashAlg: 'sha2-256'
  })

  const res = cid.toV0().toString()
  const pin = options.pin || false
  if (pin) {
    await ipfs.pin.add(res)
  }

  return res
}

const readPb = async (ipfs, cid) => {
  const result = await ipfs.dag.get(cid)
  const dagNode = result.value

  return JSON.parse(Buffer.from(dagNode.Data).toString())
}

const writeCbor = async (ipfs, obj, options) => {
  const dagNode = Object.assign({}, obj)
  const links = options.links || []
  links.forEach((prop) => {
    if (dagNode[prop]) {
      dagNode[prop] = cidifyString(dagNode[prop])
    }
  })

  const base = options.base || defaultBase
  const onlyHash = options.onlyHash || false
  const cid = await ipfs.dag.put(dagNode, { onlyHash })
  const res = cid.toString(base)
  const pin = options.pin || false
  if (pin) {
    await ipfs.pin.add(res)
  }

  return res
}

const readCbor = async (ipfs, cid, options) => {
  const result = await ipfs.dag.get(cid)
  const obj = result.value
  const links = options.links || []
  links.forEach((prop) => {
    if (obj[prop]) {
      obj[prop] = stringifyCid(obj[prop], options)
    }
  })

  return obj
}

const writeObj = async (ipfs, obj, options) => {
  const onlyHash = options.onlyHash || false
  const base = options.base || defaultBase
  const opts = Object.assign({}, { onlyHash: onlyHash },
    options.format ? { format: options.format, hashAlg: 'sha2-256' } : {})
  if (opts.format === 'dag-pb') {
    obj = {
      Data: new TextEncoder().encode(JSON.stringify(obj)),
      Links: []
    }
  }

  const cid = await ipfs.dag.put(obj, opts)
  const res = cid.toString(base)
  const pin = options.pin || false
  if (pin) {
    await ipfs.pin.add(res)
  }

  return res
}

const formats = {
  0x70: { read: readPb, write: writePb },
  0x71: { write: writeCbor, read: readCbor },
  0x55: { write: writeObj }
}

const write = (ipfs, codec, obj, options = {}) => {
  const codecMap = {
    'dag-pb': 0x70,
    'dag-cbor': 0x71,
    raw: 0x55
  }

  const format = formats[codecMap[codec]]
  if (!format) throw new Error('Unsupported codec')

  return format.write(ipfs, obj, options)
}

const read = (ipfs, cid, options = {}) => {
  cid = cidifyString(stringifyCid(cid))
  const format = formats[cid.code]

  if (!format) throw new Error('Unsupported codec')

  return format.read(ipfs, cid, options)
}

module.exports = {
  read,
  write
}
