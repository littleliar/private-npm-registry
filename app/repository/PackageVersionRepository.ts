import { AccessLevel, Inject, SingletonProto } from '@eggjs/tegg';

import type { PaddingSemVer } from '../core/entity/PaddingSemVer.js';
import type { Package as PackageModel } from './model/Package.js';
import { PackageVersion } from '../core/entity/PackageVersion.js';
import type { PackageTag } from './model/PackageTag.js';
import { ModelConvertor } from './util/ModelConvertor.js';
import type { PackageVersion as PackageVersionModel } from './model/PackageVersion.js';
import type { SqlRange } from '../core/entity/SqlRange.js';

@SingletonProto({
  accessLevel: AccessLevel.PUBLIC,
})
export class PackageVersionRepository {
  @Inject()
  private readonly Package: typeof PackageModel;

  @Inject()
  private readonly PackageVersion: typeof PackageVersionModel;

  @Inject()
  private readonly PackageTag: typeof PackageTag;

  async findHaveNotPaddingVersion(id?: number): Promise<PackageVersion[]> {
    if (!id) {
      id = (await this.PackageVersion.minimum('id').where(
        'paddingVersion is null'
      )) as number;
    }
    if (!id) return [];
    const versions = await this.PackageVersion.find({
      id: { $gte: id },
    } as object).limit(1000);
    const versionModels = versions.map(t =>
      ModelConvertor.convertModelToEntity(t, PackageVersion)
    );
    // oxlint-disable-next-line typescript-eslint/no-explicit-any
    return (versionModels as any).toObject();
  }

  async fixPaddingVersion(
    pkgVersionId: string,
    paddingSemver: PaddingSemVer
  ): Promise<void> {
    await this.PackageVersion.update(
      { packageVersionId: pkgVersionId },
      {
        paddingVersion: paddingSemver.paddingVersion,
        isPreRelease: paddingSemver.isPreRelease,
      }
    );
  }

  async findVersionByTag(
    scope: string,
    name: string,
    tag: string
  ): Promise<string | undefined> {
    const tags = (await this.PackageTag.select('version')
      .join(this.Package, 'packageTags.packageId = packages.packageId')
      .where({
        scope,
        name,
        tag,
      } as object)) as { version: string }[];
    const tagModel = tags && tags[0];
    return tagModel?.version;
  }

  /**
   * if sql version not contains prerelease, find the max version
   */
  async findMaxSatisfyVersion(
    scope: string,
    name: string,
    sqlRange: SqlRange
  ): Promise<string | undefined> {
    const versions = (await this.PackageVersion.select(
      'packageVersions.version'
    )
      .join(this.Package, 'packageVersions.packageId = packages.packageId')
      .where({
        'packages.scope': scope,
        'packages.name': name,
        ...sqlRange.condition,
      } as object)
      .order('packageVersions.paddingVersion', 'desc')) as {
      version: string;
    }[];
    return versions?.[0]?.version;
  }

  async findSatisfyVersionsWithPrerelease(
    scope: string,
    name: string,
    sqlRange: SqlRange
  ): Promise<string[]> {
    const versions = await this.PackageVersion.select('version')
      .join(this.Package, 'packageVersions.packageId = packages.packageId')
      .where({
        scope,
        name,
        ...sqlRange.condition,
      } as object);
    // oxlint-disable-next-line typescript-eslint/no-explicit-any
    return (versions as any)
      .toObject()
      .map((t: { version: string }) => t.version);
  }
}
