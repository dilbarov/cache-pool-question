import * as fs from 'fs/promises';
import { CachePool } from './cache-pool';
import { PRIMARY_CACHE_FOLDER_PATH, PrimaryCacheUpdater } from './primary-cache-updater';
import { Operation } from './operation';

jest.mock('fs/promises');

describe('CachePool', () => {
  let cachePool: CachePool;
  let primaryCacheUpdater: PrimaryCacheUpdater;

  beforeEach(() => {
    jest.clearAllMocks();
    primaryCacheUpdater = new PrimaryCacheUpdater();
    cachePool = new CachePool(primaryCacheUpdater);
    CachePool.cachePools = [];
    CachePool.usingCaches.clear();
  });

  test('Operation gets dedicated cache copy and releases it after execution', async () => {
    // Mock the primary cache
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('mock cache data'));

    // Create an operation instance
    const operation = new Operation();

    // Execute the operation
    await operation.execute();

    // Ensure the cache pool allocated a new cache copy and unblocked it after execution
    expect(CachePool.cachePools.length).toBe(1);  // One cache created
    expect(CachePool.usingCaches.size).toBe(0);  // Cache was unblocked after use
  });

  test('Cache copy is refreshed when expired', async () => {
    // Create an expired cache in the pool
    CachePool.cachePools.push({
      path: 'mock/cache/path',
      expires: new Date(Date.now() - 2 * 60 * 60 * 1000),  // Expired cache (2 hours ago)
    });

    // Mock primary cache read and write
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('updated cache data'));
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    // Request the cache, which should trigger an update since it's expired
    const cachePath = await cachePool.getCache();

    expect(fs.writeFile).toHaveBeenCalledWith(cachePath, expect.any(Buffer));  // Cache was updated
    expect(CachePool.cachePools[0].expires.getTime()).toBeGreaterThan(Date.now());  // New expiration time set
  });

  test('Primary cache is downloaded only when needed', async () => {
    // Mock the primary cache updater
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('primary cache data'));
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    // First time: primary cache is expired, so it should be downloaded
    await primaryCacheUpdater.updateCacheIfExpired();
    expect(fs.writeFile).toHaveBeenCalledWith(PRIMARY_CACHE_FOLDER_PATH, 'Cache data');  // Downloaded

    // Second time: should not trigger download if cache is still valid
    await primaryCacheUpdater.updateCacheIfExpired();
    expect(fs.writeFile).toHaveBeenCalledTimes(1);  // Not called again
  });

  test('Multiple operations wait for a single cache download', async () => {
    // Mock primary cache read and write
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('primary cache data'));
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    // Simulate two concurrent operations trying to refresh the primary cache
    const updatePromises = [
      primaryCacheUpdater.updateCacheIfExpired(),
      primaryCacheUpdater.updateCacheIfExpired(),
    ];

    await Promise.all(updatePromises);

    expect(fs.writeFile).toHaveBeenCalledTimes(1);  // Only one download was triggered
  });

  test('Multiple concurrent operations get their own cache copies', async () => {
    // Mock the primary cache
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('mock cache data'));
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    // Run two concurrent operations
    const operation1 = new Operation();
    const operation2 = new Operation();

    await Promise.all([operation1.execute(), operation2.execute()]);

    // Ensure two distinct cache copies were created and used
    expect(CachePool.cachePools.length).toBe(2);
    expect(CachePool.usingCaches.size).toBe(0);  // Both caches were unblocked after use
  });
});
