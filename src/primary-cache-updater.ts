import fs from "fs/promises";
import {asyncSetTimeout} from "./utils";

export const CACHE_FOLDER_PATH = "../cache-dir";
export const CACHE_POOL_FOLDER_PATH = `${CACHE_FOLDER_PATH}/cache-pool`;
export const PRIMARY_CACHE_FOLDER_PATH = `${CACHE_FOLDER_PATH}/primary-cache/cache.txt`;
const EXPIRATION_TIME_IN_MINUTES = 60;

export class PrimaryCacheUpdater {
  private refreshPromise: Promise<void> | null = null;

  private lastUpdated: Date | null = null;

  private logger = {
    log: (message: string) => {
      console.log(`PrimaryCacheUpdater: ${message}`)
    }
  };

  public async updateCacheIfExpired(): Promise<void> {
    if (this.isCacheExpired() && !this.refreshPromise) {
      this.refreshPromise = this.downloadCache();
    }

    if (this.refreshPromise) {
      await this.refreshPromise;
      this.refreshPromise = null;
    }
  }

  private isCacheExpired(): boolean {
    if (!this.lastUpdated) {
      return true;
    }
    const currentTime = new Date();
    const timeDifference = Math.abs(currentTime.getTime() - this.lastUpdated.getTime());
    const minutesDifference = Math.floor(timeDifference / 60000);
    return minutesDifference >= EXPIRATION_TIME_IN_MINUTES
  }

  private async downloadCache(): Promise<void> {
    this.logger.log("Beginning cache download")
    //Simulating a delay in downloading cache
    await asyncSetTimeout(2000);
    await fs.writeFile(PRIMARY_CACHE_FOLDER_PATH, "Cache data");
    this.lastUpdated = new Date();
    this.logger.log("Completed cache download")
  }
}
