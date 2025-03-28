import { basename } from 'node:path';
import { SingletonProto } from '@eggjs/tegg';
import binaries, { type BinaryName } from '../../../../config/binaries.js';
import { BinaryType } from '../../enum/Binary.js';
import {
  AbstractBinary,
  BinaryAdapter,
  type BinaryItem,
  type FetchResult,
} from './AbstractBinary.js';

@SingletonProto()
@BinaryAdapter(BinaryType.Node)
export class NodeBinary extends AbstractBinary {
  async initFetch() {
    // do nothing
    return;
  }

  async fetch(
    dir: string,
    binaryName: BinaryName
  ): Promise<FetchResult | undefined> {
    const binaryConfig = binaries[binaryName];
    const url = `${binaryConfig.distUrl}${dir}`;
    const html = await this.requestXml(url);
    // <a href="v9.8.0/">v9.8.0/</a>                                            08-Mar-2018 01:55                   -
    // <a href="v9.9.0/">v9.9.0/</a>                                            21-Mar-2018 15:47                   -
    // <a href="index.json">index.json</a>                                         17-Dec-2021 23:16              219862
    // <a href="index.tab">index.tab</a>                                          17-Dec-2021 23:16              136319
    // <a href="node-0.0.1.tar.gz">node-0.0.1.tar.gz</a>                                  26-Aug-2011 16:22             2846972
    // <a href="node-v14.0.0-nightly20200119b318926634-linux-armv7l.tar.xz">node-v14.0.0-nightly20200119b318926634-linux-ar..&gt;</a> 19-Jan-2020 06:07            18565976

    // new html format
    //     <a href="docs/">docs/</a>                                                             -                   -
    // <a href="win-x64/">win-x64/</a>                                                          -                   -
    // <a href="win-x86/">win-x86/</a>                                                          -                   -
    // <a href="/dist/v18.15.0/SHASUMS256.txt.asc">SHASUMS256.txt.asc</a>                                 04-Nov-2024 17:29               3.7 KB
    // <a href="/dist/v18.15.0/SHASUMS256.txt.sig">SHASUMS256.txt.sig</a>                                 04-Nov-2024 17:29                310 B
    // <a href="/dist/v18.15.0/SHASUMS256.txt">SHASUMS256.txt</a>                                     04-Nov-2024 17:29               3.2 KB
    const re =
      /<a href="([^"]+?)"[^>]*?>[^<]+?<\/a>\s+?((?:[\w-]+? \w{2}:\d{2})|-)\s+?([\d.\-\s\w]+)/gi;
    const matchs = html.matchAll(re);
    const items: BinaryItem[] = [];
    for (const m of matchs) {
      let name = m[1];
      const isDir = name.endsWith('/');
      if (!isDir) {
        // /dist/v18.15.0/SHASUMS256.txt => SHASUMS256.txt
        name = basename(name);
      }
      const fileUrl = isDir ? '' : `${url}${name}`;
      const date = m[2];
      const size = m[3].trim();
      if (size === '0') continue;
      if (binaryConfig.ignoreFiles?.includes(`${dir}${name}`)) continue;

      const item = {
        name,
        isDir,
        url: fileUrl,
        size,
        date,
        ignoreDownloadStatuses: binaryConfig.options?.ignoreDownloadStatuses,
      };
      items.push(item);
    }
    return { items, nextParams: null };
  }
}
