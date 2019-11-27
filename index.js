const CID = require('cids')
const dagPB = require('ipld-dag-pb')
const defaultBase = 'base58btc'

const cidifyString = (str) => {
  if (!str) {
    return str
  }

  if (Array.isArray(str)) {
    return str.map(cidifyString)
  }

  return new CID(str)
}

const stringifyCid = (cid, options) => {
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
  return cid.toBaseEncodedString(base)
}

const writePb = async (ipfs, obj, options) => {
  const buffer = Buffer.from(JSON.stringify(obj))
  const dagNode = new dagPB.DAGNode(buffer)
  const cid = await ipfs.dag.put(dagNode, {
    format: 'dag-pb',
    hashAlg: 'sha2-256'
  })

  const res = cid.toV0().toBaseEncodedString()
  const pin = options.pin || false
  if (pin) {
    await ipfs.pin.add(res)
  }

  return res
}

const readPb = async (ipfs, cid) => {
  const result = await ipfs.dag.get(cid)
  const dagNode = result.value

  return JSON.parse(dagNode.toJSON().data)
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
  const res = cid.toBaseEncodedString(base)
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
  const opts = Object.assign({}, { onlyHash: onlyHash }, options.format ? { format: options.format, hashAlg: 'sha2-256' } : {})
  if (opts.format === 'dag-pb') {
    obj = new dagPB.DAGNode(obj)
  }

  const cid = await ipfs.dag.put(obj, opts)
  const res = cid.toBaseEncodedString(base)
  const pin = options.pin || false
  if (pin) {
    await ipfs.pin.add(res)
  }
  return res
}

const formats = {
  'dag-pb': { read: readPb, write: writePb },
  'dag-cbor': { write: writeCbor, read: readCbor },
  'raw': { write: writeObj }
}

const write = (ipfs, codec, obj, options = {}) => {
  const format = formats[codec]
  if (!format) throw new Error('Unsupported codec')

  return format.write(ipfs, obj, options)
}

const read = (ipfs, cid, options = {}) => {
  cid = new CID(cid)
  const format = formats[cid.codec]

  if (!format) throw new Error('Unsupported codec')

  return format.read(ipfs, cid, options)
}

module.exports = {
  read,
  write
}
