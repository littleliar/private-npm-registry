import assert from 'node:assert/strict';

import { app } from '@eggjs/mock/bootstrap';

import { PlaywrightBinary } from '../../../../app/common/adapter/binary/PlaywrightBinary.js';
import { TestUtil } from '../../../../test/TestUtil.js';

describe('test/common/adapter/binary/PlaywrightBinary.test.ts', () => {
  let binary: PlaywrightBinary;
  beforeEach(async () => {
    binary = await app.getEggObject(PlaywrightBinary);
  });

  describe('fetch()', () => {
    it('should fetch root: / work', async () => {
      app.mockHttpclient('https://registry.npmjs.com/playwright-core', 'GET', {
        data: await TestUtil.readFixturesFile(
          'registry.npmjs.com/playwright-core.json'
        ),
        persist: false,
      });
      app
        .mockAgent()
        .get('https://unpkg.com')
        .intercept({
          method: 'GET',
          path: /browsers\.json/,
        })
        .reply(
          200,
          await TestUtil.readFixturesFile(
            'unpkg.com/playwright-core-browsers.json'
          )
        )
        .persist();
      const result = await binary.fetch('/');
      assert(result);
      assert(result.items.length > 0);
      let matchDir1 = false;
      for (const item of result.items) {
        if (item.name === 'builds/') {
          assert(item.date);
          assert.equal(item.isDir, true);
          assert(item.size === '-');
          matchDir1 = true;
        }
      }
      assert(matchDir1);
    });

    it('should fetch subdir: /builds/, /builds/chromium/ work', async () => {
      app.mockHttpclient('https://registry.npmjs.com/playwright-core', 'GET', {
        data: await TestUtil.readFixturesFile(
          'registry.npmjs.com/playwright-core.json'
        ),
        persist: false,
      });
      app
        .mockAgent()
        .get('https://unpkg.com')
        .intercept({
          method: 'GET',
          path: /browsers\.json/,
        })
        .reply(
          200,
          await TestUtil.readFixturesFile(
            'unpkg.com/playwright-core-browsers.json'
          )
        )
        .persist();
      let result = await binary.fetch('/builds/');
      assert(result);
      assert.equal(result.items.length, 8, JSON.stringify(result, null, 2));
      assert.equal(result.items[0].name, 'chromium/');
      assert.equal(result.items[1].name, 'chromium-tip-of-tree/');
      assert.equal(result.items[2].name, 'firefox/');
      assert.equal(result.items[3].name, 'firefox-beta/');
      assert.equal(result.items[4].name, 'webkit/');
      assert.equal(result.items[5].name, 'ffmpeg/');
      assert.equal(result.items[6].name, 'winldd/');
      assert.equal(result.items[7].name, 'android/');
      assert.equal(result.items[0].isDir, true);

      const names = [
        'chromium',
        'chromium-tip-of-tree',
        'firefox',
        'firefox-beta',
        'webkit',
        'ffmpeg',
        'winldd',
        'android',
      ];
      for (const dirname of names) {
        result = await binary.fetch(`/builds/${dirname}/`);
        assert(result);
        // console.log(dirname, result.items);
        assert(result.items.length > 0, JSON.stringify(result, null, 2));
        for (const item of result.items) {
          assert(item.isDir);
        }
        result = await binary.fetch(
          `/builds/${dirname}/${result.items[0].name}`
        );
        assert(result);
        // console.log(result.items);
        assert(result.items.length > 0);
        let shouldIncludeChromiumHeadlessShell = false;
        // chromium-tip-of-tree-headless-shell
        let shouldIncludeChromiumTipOfTreeHeadlessShell = false;
        for (const item of result.items) {
          // {
          //   name: 'chromium-linux.zip',
          //   isDir: false,
          //   url: 'https://playwright.azureedge.net/builds/chromium/1000/chromium-linux.zip',
          //   size: '-',
          //   date: '2022-04-18T20:51:53.788Z'
          // },
          assert(item.isDir === false);
          assert(item.name);
          assert(item.size === '-');
          assert(item.url);
          assert(item.date);
          if (
            dirname === 'chromium' &&
            item.name.startsWith('chromium-headless-shell')
          ) {
            // chromium should include chromium-headless-shell
            assert.match(
              item.url,
              /https:\/\/playwright\.azureedge\.net\/builds\/chromium\/\d+\/chromium-headless-shell/
            );
            shouldIncludeChromiumHeadlessShell = true;
          }
          if (
            dirname === 'chromium-tip-of-tree' &&
            item.name.startsWith('chromium-tip-of-tree-headless-shell')
          ) {
            assert.match(
              item.url,
              /https:\/\/playwright\.azureedge\.net\/builds\/chromium-tip-of-tree\/\d+\/chromium-tip-of-tree-headless-shell/
            );
            shouldIncludeChromiumTipOfTreeHeadlessShell = true;
          }
        }
        if (dirname === 'chromium') {
          assert(shouldIncludeChromiumHeadlessShell);
          // console.log(result);
        }
        if (dirname === 'chromium-tip-of-tree') {
          assert(shouldIncludeChromiumTipOfTreeHeadlessShell);
        }
        // if (dirname === 'winldd') {
        //   console.log(result);
        // }
      }
    });
  });
});
