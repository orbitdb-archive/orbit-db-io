const CID = require('cids')
const dagPB = require('ipld-dag-pb')
const pify = require('pify')

const createPbDagNode = pify(dagPB.DAGNode.create)

const cidToCborLink = (cid) => {
  if (!cid) {
    return cid
  }

  if (Array.isArray(cid)) {
    return cid.map(cidToCborLink)
  }

  return { '/': cid }
}

const stringifyCid = (cid) => {
  if (!cid) {
    return cid
  }

  if (Array.isArray(cid)) {
    return cid.map(stringifyCid)
  }

  return cid.toBaseEncodedString()
}

const writePb = async (ipfs, obj) => {
  const buffer = Buffer.from(JSON.stringify(obj))
  const dagNode = await createPbDagNode(buffer)

  const cid = await ipfs.dag.put(dagNode, {
    format: 'dag-pb',
    hashAlg: 'sha2-256'
  })

  return cid.toV0().toBaseEncodedString()
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
    dagNode[prop] = cidToCborLink(dagNode[prop])
  })
  const onlyHash = options.onlyHash || false
  const cid = await ipfs.dag.put(dagNode, { onlyHash })

  return cid.toBaseEncodedString()
}

const readCbor = async (ipfs, cid, options) => {
  const result = await ipfs.dag.get(cid)
  const obj = result.value
  const links = options.links || []
  links.forEach((prop) => {
    obj[prop] = stringifyCid(obj[prop])
  })

  return obj
}

const writeObj = async (ipfs, obj, options) => {
  const onlyHash = options.onlyHash || false
  const opts = Object.assign({}, { onlyHash: onlyHash }, options.format ? { format: options.format, hashAlg: 'sha2-256' } : {})
  if (opts.format === 'dag-pb') {
    obj = await createPbDagNode(obj)
  }

  const cid = await ipfs.dag.put(obj, opts)
  return cid.toBaseEncodedString()
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
