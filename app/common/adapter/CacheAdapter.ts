import { AccessLevel, Inject, SingletonProto } from '@eggjs/tegg';
// FIXME: @eggjs/redis should use ioredis v5
// https://github.com/eggjs/redis/issues/35
import type { Redis } from 'ioredis';

const ONE_DAY = 3600 * 24;

@SingletonProto({
  accessLevel: AccessLevel.PUBLIC,
})
export class CacheAdapter {
  @Inject()
  private readonly redis: Redis; // 由 redis 插件引入

  async setBytes(key: string, bytes: Buffer) {
    await this.redis.setex(key, ONE_DAY, bytes);
  }

  async getBytes(key: string) {
    return await this.redis.getBuffer(key);
  }

  async set(key: string, text: string) {
    await this.redis.setex(key, ONE_DAY, text);
  }

  async get(key: string) {
    return await this.redis.get(key);
  }

  async delete(key: string) {
    await this.redis.del(key);
  }

  async lock(key: string, seconds: number) {
    const lockName = this.getLockName(key);
    const existsTimestamp = await this.redis.get(lockName);
    if (existsTimestamp) {
      if (Date.now() - Number.parseInt(existsTimestamp) < seconds * 1000) {
        return null;
      }
      // lock timeout, delete it
      await this.redis.del(lockName);
    }
    const timestamp = `${Date.now() + seconds * 1000}`;
    const code = await this.redis.setnx(lockName, timestamp);
    // setnx fail, lock fail
    if (code === 0) return null;
    // expire
    await this.redis.expire(lockName, seconds);
    return timestamp;
  }

  async unlock(key: string, lockTimestamp: string) {
    const lockName = this.getLockName(key);
    const existsTimestamp = await this.redis.get(lockName);
    if (!existsTimestamp || lockTimestamp !== existsTimestamp) return;
    await this.redis.del(lockName);
  }

  async usingLock(key: string, seconds: number, func: () => Promise<void>) {
    const lockTimestamp = await this.lock(key, seconds);
    if (!lockTimestamp) return false;
    try {
      await func();
    } finally {
      await this.unlock(key, lockTimestamp);
    }
    return true;
  }

  private getLockName(key: string) {
    return `CNPMCORE_L_${key}`;
  }
}
