import { Attribute, Model } from '@eggjs/tegg/orm';

import { Bone, DataTypes } from '../util/leoric.js';

@Model()
export class Binary extends Bone {
  @Attribute(DataTypes.BIGINT, {
    primary: true,
    autoIncrement: true,
  })
  id: bigint;

  @Attribute(DataTypes.DATE, { name: 'gmt_create' })
  createdAt: Date;

  @Attribute(DataTypes.DATE, { name: 'gmt_modified' })
  updatedAt: Date;

  @Attribute(DataTypes.STRING(24), {
    unique: true,
  })
  binaryId: string;

  @Attribute(DataTypes.STRING(50))
  category: string;

  @Attribute(DataTypes.STRING(700))
  parent: string;

  @Attribute(DataTypes.STRING(200))
  name: string;

  @Attribute(DataTypes.BOOLEAN)
  isDir: boolean;

  @Attribute(DataTypes.INTEGER(11).UNSIGNED)
  size: number;

  @Attribute(DataTypes.STRING(100))
  date: string;
}
