import {CACHE_POOL_FOLDER_PATH, PRIMARY_CACHE_FOLDER_PATH, PrimaryCacheUpdater} from "./primary-cache-updater";
import fs from "fs/promises";

interface CacheData {
  path: string;
  expires: Date;
}

const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

export class CachePool {
  private static filePrefix = 'cache-';
  public static cachePools: CacheData[] = [];
  public static usingCaches: Set<string> = new Set<string>();

  public constructor(private readonly primaryCacheUpdater: PrimaryCacheUpdater) {
  }

  public async getCache(): Promise<string> {
    return await this.getAvailableCache();
  }

  public blockCache(cachePath: string): void {
    CachePool.usingCaches.add(cachePath);
  }

  public unblockCache(cachePath: string): void {
    CachePool.usingCaches.delete(cachePath);
  }

  private async getAvailableCache(): Promise<string> {
    let availableCache = CachePool.cachePools.find((cachePath) => !CachePool.usingCaches.has(cachePath.path));
    if (!availableCache) {
      availableCache = await this.createCache()
    }
    this.blockCache(availableCache.path);

    if (Date.now() > availableCache.expires.getTime()) {
      await this.updateCache(availableCache.path);
    }

    return availableCache.path;
  }

  private async createCache(): Promise<CacheData> {
    const fileName = `${CachePool.filePrefix}${Math.round(Math.random() * 10000)}.txt`;
    const cachePath = `${CACHE_POOL_FOLDER_PATH}/${fileName}`;
    return await this.copyCache(cachePath);
  }

  private async updateCache(cachePath: string): Promise<void> {
    await this.copyCache(cachePath);
  }

  private async copyCache(destinationPath: string): Promise<CacheData> {
    await this.primaryCacheUpdater.updateCacheIfExpired()
    const primaryCacheBuffer = await fs.readFile(PRIMARY_CACHE_FOLDER_PATH)
    await fs.writeFile(destinationPath, primaryCacheBuffer);

    const expires = new Date(Date.now() + ONE_HOUR); // Cache expires in 1 hour
    const data = {path: destinationPath, expires};

    const existingCacheIndex = CachePool.cachePools.findIndex((cache) => cache.path === destinationPath);
    if (existingCacheIndex !== -1) {
      Object.assign(CachePool.cachePools[existingCacheIndex], data);
    } else {
      CachePool.cachePools.push(data);
    }

    return data;
  }
}
