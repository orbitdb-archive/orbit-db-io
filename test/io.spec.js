const assert = require('assert')
const io = require('../index')
const timeoutCode = 'ERR_TIMEOUT'

// Test utils
const {
  config,
  testAPIs,
  startIpfs,
  stopIpfs
} = require('orbit-db-test-utils')

Object.keys(testAPIs).forEach((IPFS) => {
  describe(`IO tests (${IPFS})`, function () {
    this.timeout(10000)

    let ipfs, ipfsd

    before(async () => {
      ipfsd = await startIpfs(IPFS, config)
      ipfs = ipfsd.api
    })

    after(async () => {
      await stopIpfs(ipfsd)
    })

    describe('dag-cbor', () => {
      let cid1, cid2, err
      const data = { test: 'object' }

      it('writes', async () => {
        cid1 = await io.write(ipfs, 'dag-cbor', data, { pin: true })
        assert.strictEqual(cid1, 'zdpuAwHevBbd7V9QXeP8zC1pdb3HmugJ7zgzKnyiWxJG3p2Y4')
      })

      it('writes timeout', async () => {
        err = await io.write(ipfs, 'dag-cbor', data, { timeout: -1 }).catch(e => e)
        assert.strictEqual(err.code, timeoutCode)
      })

      it('reads', async () => {
        const obj = await io.read(ipfs, cid1, {})
        assert.deepStrictEqual(obj, data)
      })

      it('reads timeout', async () => {
        err = await io.read(ipfs, cid1, { timeout: -1 }).catch(e => e)
        assert.strictEqual(err.code, timeoutCode)
      })

      it('writes with links', async () => {
        data[cid1] = cid1
        cid2 = await io.write(ipfs, 'dag-cbor', data, { links: [cid1] })
        assert.strictEqual(cid2, 'zdpuAqeyAtvp1ACxnWZLPW9qMEN5rJCD9N3vjUbMs4AAodTdz')
      })

      it('reads from links', async () => {
        const obj = await io.read(ipfs, cid2, { links: [cid1] })
        data[cid1] = cid1
        assert.deepStrictEqual(obj, data)
      })
    })

    describe('dag-pb', () => {
      let cid, err
      const data = { test: 'object' }

      it('writes', async () => {
        cid = await io.write(ipfs, 'dag-pb', data, { pin: true })
        assert.strictEqual(cid, 'QmaPXy3wcj4ds9baLreBGWf94zzwAUM41AiNG1eN51C9uM')
      })

      it('writes timeout', async () => {
        err = await io.write(ipfs, 'raw', data, { timeout: -1 }).catch(e => e)
        assert.strictEqual(err.code, timeoutCode)
      })

      it('reads', async () => {
        const obj = await io.read(ipfs, cid, {})
        assert.deepStrictEqual(obj, data)
      })

      it('reads timeout', async () => {
        err = await io.read(ipfs, cid, { timeout: -1 }).catch(e => e)
        assert.strictEqual(err.code, timeoutCode)
      })
    })

    describe('raw', () => {
      let cid, err
      const data = { test: 'object' }

      it('writes', async () => {
        cid = await io.write(ipfs, 'raw', data, { pin: true })
        assert.strictEqual(cid, 'zdpuAwHevBbd7V9QXeP8zC1pdb3HmugJ7zgzKnyiWxJG3p2Y4')
      })

      it('writes timeout', async () => {
        err = await io.write(ipfs, 'raw', data, { timeout: -1 }).catch(e => e)
        assert.strictEqual(err.code, timeoutCode)
      })

      it('writes formatted as dag-pb', async () => {
        cid = await io.write(ipfs, 'raw', data, { format: 'dag-pb' })
        assert.strictEqual(cid, 'QmaPXy3wcj4ds9baLreBGWf94zzwAUM41AiNG1eN51C9uM')
      })

      it('reads', async () => {
        const obj = await io.read(ipfs, cid, {})
        assert.deepStrictEqual(obj, data)
      })

      it('reads timeout', async () => {
        err = await io.read(ipfs, cid, { timeout: -1 }).catch(e => e)
        assert.strictEqual(err.code, timeoutCode)
      })
    })
  })
})
