# Cache Pool Management and Optimization

## Current State
- We maintain a **primary cache** on the file system, storing the latest version of the data. This cache expires one hour after its last refresh (download).
- **Multiple concurrent operations** rely on this cache. However, file locking on the primary cache creates **performance bottlenecks** as each operation tries to access it simultaneously.

---

## Part 1: Using a Cache Pool to Improve Concurrency
1. **Create a Cache Pool**: Implement a pool of cache replicas to enable concurrent access.
2. **Assign Dedicated Cache Copies**: Each operation should receive its own dedicated cache copy from the pool, ensuring it can access the data without interference.
3. **Release Cache Copies for Reuse**: Once an operation finishes, its dedicated cache copy should be released back into the pool so another operation can reuse it.

---

## Part 2: Updating the Local and Primary Caches
1. **Check Cache Expiration**: Before an operation starts using its cache copy, check if the copy has expired.
2. **Refresh Expired Cache Copies**: If the cache copy is expired, it should be refreshed using the latest data from the primary cache.
3. **Refresh the Primary Cache**: Before refreshing an expired cache copy, first verify whether the primary cache itself is expired. If the primary cache has also expired, download a fresh copy.
4. **Download the Primary Cache Only as Needed**: Ensure the primary cache is downloaded only when an operation requires a fresh copy. This means if no operations have requested the cache in a while, the primary cache should remain as-is without refreshing.

---

## Part 3 (Bonus): Ensuring a Single Download of the Primary Cache
1. **Synchronized Cache Download**: If multiple operations simultaneously need the cache and find that both the primary cache and all cache copies in the pool are expired, ensure only one of the operations refreshes the primary cache.
2. **Wait for Cache Refresh**: The remaining operations should wait for the cache to be refreshed and then proceed to use the newly updated primary cache or a refreshed cache copy from the pool.
