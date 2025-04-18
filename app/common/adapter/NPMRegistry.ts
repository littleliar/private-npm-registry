import { setTimeout } from 'node:timers/promises';
import { AccessLevel, ContextProto, Inject } from '@eggjs/tegg';
import type {
  EggAppConfig,
  EggContextHttpClient,
  EggLogger,
  HttpClientRequestOptions,
  HttpClientResponse,
} from 'egg';
import type { PackageManifestType } from '../../repository/PackageRepository.js';
import { isTimeoutError } from '../ErrorUtil.js';

type HttpMethod = HttpClientRequestOptions['method'];

const INSTANCE_NAME = 'npmRegistry';

export type RegistryResponse = { method: HttpMethod } & HttpClientResponse;

@ContextProto({
  name: INSTANCE_NAME,
  accessLevel: AccessLevel.PUBLIC,
})
export class NPMRegistry {
  @Inject()
  private readonly logger: EggLogger;
  @Inject()
  private readonly httpclient: EggContextHttpClient;
  @Inject()
  private config: EggAppConfig;
  private timeout = 10_000;
  public registryHost: string;

  get registry(): string {
    return this.registryHost || this.config.cnpmcore.sourceRegistry;
  }

  public setRegistryHost(registryHost = '') {
    this.registryHost = registryHost;
  }

  public async getFullManifests(
    fullname: string,
    optionalConfig?: { retries?: number; remoteAuthToken?: string }
  ): Promise<{ method: HttpMethod } & HttpClientResponse<PackageManifestType>> {
    let retries = optionalConfig?.retries || 3;
    // set query t=timestamp, make sure CDN cache disable
    // cache=0 is sync worker request flag
    const url = `${this.registry}/${encodeURIComponent(fullname)}?t=${Date.now()}&cache=0`;
    let lastError: Error | undefined;
    while (retries > 0) {
      try {
        // large package: https://r.cnpmjs.org/%40procore%2Fcore-icons
        // https://r.cnpmjs.org/intraactive-sdk-ui 44s
        const authorization = this.genAuthorizationHeader(
          optionalConfig?.remoteAuthToken
        );
        return await this.request('GET', url, undefined, {
          timeout: 120_000,
          headers: { authorization },
        });
      } catch (err) {
        if (isTimeoutError(err)) {
          throw err;
        }
        lastError = err;
      }
      retries--;
      if (retries > 0) {
        // sleep 1s ~ 4s in random
        const delay =
          process.env.NODE_ENV === 'test' ? 1 : 1000 + Math.random() * 4000;
        await setTimeout(delay);
      }
    }
    // oxlint-disable-next-line no-throw-literal
    throw lastError;
  }

  // app.put('/:name/sync', sync.sync);
  public async createSyncTask(
    fullname: string,
    optionalConfig?: { remoteAuthToken?: string }
  ): Promise<RegistryResponse> {
    const authorization = this.genAuthorizationHeader(
      optionalConfig?.remoteAuthToken
    );
    const url = `${this.registry}/${encodeURIComponent(fullname)}/sync?sync_upstream=true&nodeps=true`;
    // {
    //   ok: true,
    //   logId: logId
    // };
    return await this.request('PUT', url, undefined, { authorization });
  }

  // app.get('/:name/sync/log/:id', sync.getSyncLog);
  public async getSyncTask(
    fullname: string,
    id: string,
    offset: number,
    optionalConfig?: { remoteAuthToken?: string }
  ): Promise<RegistryResponse> {
    const authorization = this.genAuthorizationHeader(
      optionalConfig?.remoteAuthToken
    );
    const url = `${this.registry}/${encodeURIComponent(fullname)}/sync/log/${id}?offset=${offset}`;
    // { ok: true, syncDone: syncDone, log: log }
    return await this.request('GET', url, undefined, { authorization });
  }

  public async getDownloadRanges(
    registry: string,
    fullname: string,
    start: string,
    end: string,
    optionalConfig?: { remoteAuthToken?: string }
  ): Promise<RegistryResponse> {
    const authorization = this.genAuthorizationHeader(
      optionalConfig?.remoteAuthToken
    );
    const url = `${registry}/downloads/range/${start}:${end}/${encodeURIComponent(fullname)}`;
    return await this.request('GET', url, undefined, { authorization });
  }

  private async request(
    method: HttpMethod,
    url: string,
    params?: object,
    options?: object
  ): Promise<RegistryResponse> {
    const res = (await this.httpclient.request(url, {
      method,
      data: params,
      dataType: 'json',
      timing: true,
      retry: 3,
      timeout: this.timeout,
      followRedirect: true,
      gzip: true,
      ...options,
    })) as HttpClientResponse;
    this.logger.info(
      '[NPMRegistry:request] %s %s, status: %s',
      method,
      url,
      res.status
    );
    return {
      method,
      ...res,
    };
  }

  public genAuthorizationHeader(remoteAuthToken?: string) {
    return remoteAuthToken ? `Bearer ${remoteAuthToken}` : '';
  }
}
