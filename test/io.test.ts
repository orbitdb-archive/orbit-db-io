// @ts-ignore
import {config, testAPIs, startIpfs, stopIpfs} from 'orbit-db-test-utils';
import {IPFS} from 'ipfs-core'
import * as io from '../src/index'

Object.keys(testAPIs).forEach((IPFS) => {
  describe(`IO tests (${IPFS})`, function () {
    let ipfs: IPFS,
      ipfsd: any;

    beforeAll( async () => {
      ipfsd = await startIpfs(IPFS, config)
      ipfs = ipfsd.api
    });

    afterAll( async () => {
      await stopIpfs(ipfsd)
    });

    describe('dag-cbor', () => {
      let cid1: string, cid2: string;
      const data = { test: 'object'}

      it('writes', async () => {
        cid1 = await io.write(ipfs, 'dag-cbor', data, { pin: true })
        expect(cid1)
          .toBe('zdpuAwHevBbd7V9QXeP8zC1pdb3HmugJ7zgzKnyiWxJG3p2Y4')
      })

      it('reads', async () => {
        const obj = await io.read(ipfs, cid1, {})
        expect(obj).toEqual(data)
      })

      it('writes with links', async () => {
        const linkedData = {
          ...data,
          [cid1]: cid1
        }
        cid2 = await io.write(ipfs, 'dag-cbor', linkedData, { links: [cid1] })
        expect(cid2)
          .toBe('zdpuAqeyAtvp1ACxnWZLPW9qMEN5rJCD9N3vjUbMs4AAodTdz');
      })

      it('reads from links', async () => {
        const linkedData = {
          ...data,
          [cid1]: cid1
        }
        const obj = await io.read(ipfs, cid2, { links: [cid1] });
        expect(obj).toEqual(linkedData)
      })
    })

    describe('dag-pb', () => {
      let cid: string;
      const data = { test: 'object' }

      it('writes', async () => {
        cid = await io.write(ipfs, 'dag-pb', data, { pin: true })
        expect(cid)
          .toBe('QmaPXy3wcj4ds9baLreBGWf94zzwAUM41AiNG1eN51C9uM')
      })

      it('reads', async () => {
        const obj = await io.read(ipfs, cid, {})
        expect(obj)
          .toEqual(data)
      })
    })

    describe('raw', () => {
      let cid: string;
      const data = { test: 'object' }

      it('writes', async () => {
        cid = await io.write(ipfs, 'raw', data, { pin: true })
        expect(cid).toBe('zdpuAwHevBbd7V9QXeP8zC1pdb3HmugJ7zgzKnyiWxJG3p2Y4')
      })

      it('writes formatted as dag-pb', async () => {
        cid = await io.write(ipfs, 'raw', data, { format: 'dag-pb' })
        expect(cid).toBe('QmaPXy3wcj4ds9baLreBGWf94zzwAUM41AiNG1eN51C9uM')
      })

      it('reads', async () => {
        const obj = await io.read(ipfs, cid, {})
        expect(obj).toEqual(data)
      })
    })

  })
})
