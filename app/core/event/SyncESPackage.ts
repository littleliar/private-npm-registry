// TODO sync event
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { EggAppConfig } from 'egg';
import { Event, Inject } from '@eggjs/tegg';
import {
  PACKAGE_BLOCKED,
  PACKAGE_MAINTAINER_CHANGED,
  PACKAGE_MAINTAINER_REMOVED,
  PACKAGE_META_CHANGED,
  PACKAGE_TAG_ADDED,
  PACKAGE_TAG_CHANGED,
  PACKAGE_TAG_REMOVED,
  PACKAGE_UNBLOCKED,
  PACKAGE_UNPUBLISHED,
  PACKAGE_VERSION_ADDED,
  PACKAGE_VERSION_REMOVED,
} from './index.js';
import type { PackageSearchService } from '../service/PackageSearchService.js';

class SyncESPackage {
  @Inject()
  protected readonly packageSearchService: PackageSearchService;

  @Inject()
  protected readonly config: EggAppConfig;

  protected async syncPackage(fullname: string) {
    if (!this.config.cnpmcore.enableElasticsearch) return;
    await this.packageSearchService.syncPackage(fullname, true);
  }
}

@Event(PACKAGE_UNPUBLISHED)
@Event(PACKAGE_BLOCKED)
export class PackageUnpublishedSyncESEvent extends SyncESPackage {
  async handle(fullname: string) {
    if (!this.config.cnpmcore.enableElasticsearch) return;
    await this.packageSearchService.removePackage(fullname);
  }
}

@Event(PACKAGE_VERSION_ADDED)
@Event(PACKAGE_META_CHANGED)
@Event(PACKAGE_VERSION_REMOVED)
@Event(PACKAGE_TAG_ADDED)
@Event(PACKAGE_TAG_CHANGED)
@Event(PACKAGE_TAG_REMOVED)
@Event(PACKAGE_MAINTAINER_CHANGED)
@Event(PACKAGE_MAINTAINER_REMOVED)
@Event(PACKAGE_UNBLOCKED)
export class PackageVersionAddedSyncESEvent extends SyncESPackage {
  async handle(fullname: string) {
    await this.syncPackage(fullname);
  }
}
