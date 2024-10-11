import fs from "fs/promises";

import {PrimaryCacheUpdater} from "./primary-cache-updater";
import {asyncSetTimeout} from "./utils";
import {CachePool} from "./cache-pool";

export class Operation {
  private static primaryCacheUpdater = new PrimaryCacheUpdater();
  private static cachePool = new CachePool(Operation.primaryCacheUpdater); // Assuming CachePool is implemented elsewhere
  private static numOperations: number = 0;
  private logger = {
    log: (message: string) => {
      console.log(`Process[${this.id}]: ${message}`)
    }
  };

  private readonly id: number;
  public constructor() {
    Operation.numOperations += 1;
    this.id = Operation.numOperations;
  }

  public async execute(): Promise<void> {
    this.logger.log("execute: start");
    const path = await Operation.cachePool.getCache();
    await this.executeInternal(path);
    Operation.cachePool.unblockCache(path);
    this.logger.log("execute: done");
  }

  private async executeInternal(cachePath: string): Promise<void> {
    this.logger.log("executeInternal: start");
    await fs.readFile(cachePath);
    //Simulating a delay in running the process which uses the cache
    await asyncSetTimeout(2000);
    this.logger.log("executeInternal: done");
  }
}
