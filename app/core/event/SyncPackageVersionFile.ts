import { Event, Inject } from '@eggjs/tegg';
import type { EggAppConfig, EggLogger } from 'egg';
import { ForbiddenError } from 'egg-errors';
import {
  PACKAGE_TAG_ADDED,
  PACKAGE_TAG_CHANGED,
  PACKAGE_VERSION_ADDED,
} from './index.js';
import { getScopeAndName } from '../../common/PackageUtil.js';
import type { PackageManagerService } from '../service/PackageManagerService.js';
import type { PackageVersionFileService } from '../service/PackageVersionFileService.js';

class SyncPackageVersionFileEvent {
  @Inject()
  protected readonly config: EggAppConfig;
  @Inject()
  protected readonly logger: EggLogger;
  @Inject()
  private readonly packageManagerService: PackageManagerService;
  @Inject()
  private readonly packageVersionFileService: PackageVersionFileService;

  protected async syncPackageVersionFile(fullname: string, version: string) {
    // must set enableUnpkg and enableSyncUnpkgFiles = true both
    if (!this.config.cnpmcore.enableUnpkg) return;
    if (!this.config.cnpmcore.enableSyncUnpkgFiles) return;
    // ignore sync on unittest
    if (
      this.config.env === 'unittest' &&
      fullname !== '@cnpm/unittest-unpkg-demo'
    )
      return;
    const [scope, name] = getScopeAndName(fullname);
    const { packageVersion } =
      await this.packageManagerService.showPackageVersionByVersionOrTag(
        scope,
        name,
        version
      );
    if (!packageVersion) return;
    try {
      await this.packageVersionFileService.syncPackageVersionFiles(
        packageVersion
      );
    } catch (err) {
      if (err instanceof ForbiddenError) {
        this.logger.info(
          '[SyncPackageVersionFileEvent.syncPackageVersionFile] ignore sync files, cause: %s',
          err.message
        );
        return;
      }
      throw err;
    }
  }

  protected async syncPackageReadmeToLatestVersion(fullname: string) {
    const [scope, name] = getScopeAndName(fullname);
    const { pkg, packageVersion } =
      await this.packageManagerService.showPackageVersionByVersionOrTag(
        scope,
        name,
        'latest'
      );
    if (!pkg || !packageVersion) return;
    await this.packageVersionFileService.syncPackageReadme(pkg, packageVersion);
  }
}

@Event(PACKAGE_VERSION_ADDED)
export class PackageVersionAddedSyncPackageVersionFileEvent extends SyncPackageVersionFileEvent {
  async handle(fullname: string, version: string) {
    await this.syncPackageVersionFile(fullname, version);
  }
}

@Event(PACKAGE_TAG_ADDED)
export class PackageTagAddedSyncPackageVersionFileEvent extends SyncPackageVersionFileEvent {
  async handle(fullname: string, tag: string) {
    if (tag !== 'latest') return;
    await this.syncPackageReadmeToLatestVersion(fullname);
  }
}

@Event(PACKAGE_TAG_CHANGED)
export class PackageTagChangedSyncPackageVersionFileEvent extends SyncPackageVersionFileEvent {
  async handle(fullname: string, tag: string) {
    if (tag !== 'latest') return;
    await this.syncPackageReadmeToLatestVersion(fullname);
  }
}
