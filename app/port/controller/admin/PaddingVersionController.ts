import {
  type EggContext,
  Context,
  HTTPController,
  HTTPMethod,
  HTTPMethodEnum,
  HTTPQuery,
  Inject,
} from '@eggjs/tegg';

import { AbstractController } from '../AbstractController.js';
import type { FixNoPaddingVersionService } from '../../../core/service/FixNoPaddingVersionService.js';

@HTTPController()
export class PaddingVersionController extends AbstractController {
  @Inject()
  private readonly fixNoPaddingVersionService: FixNoPaddingVersionService;

  @HTTPMethod({
    method: HTTPMethodEnum.PUT,
    path: '/-/admin/npm/fixPaddingVersion',
  })
  async fixNoPaddingVersion(
    @Context() ctx: EggContext,
    @HTTPQuery() id: string
  ) {
    const isAdmin = await this.userRoleManager.isAdmin(ctx);
    if (!isAdmin) {
      return {
        ok: false,
        error: 'only admin can do this',
      };
    }
    let idNum: number | undefined;
    if (id) {
      idNum = Number.parseInt(id);
      if (Number.isNaN(idNum)) {
        return {
          ok: false,
          error: `id is not a number ${id}`,
        };
      }
    }
    await this.fixNoPaddingVersionService.fixPaddingVersion(idNum);
    return {
      ok: true,
    };
  }
}
