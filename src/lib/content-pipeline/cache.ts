import { promises as fs } from 'fs';
import { join, dirname } from 'path';

export interface CacheOptions {
  ttlMs?: number;
  namespace?: string;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  invalidate(key: string): Promise<void>;
  clear?(namespace?: string): Promise<void>;
}

interface FileCacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

export class FileCache implements CacheProvider {
  private baseDir: string;

  constructor(baseDir: string = '.cache/content-pipeline') {
    this.baseDir = baseDir;
  }

  async get<T>(key: string): Promise<T | null> {
    const filePath = this.resolvePath(key);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const entry = JSON.parse(data) as FileCacheEntry<T>;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.invalidate(key);
        return null;
      }
      return entry.value;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      console.warn(`[FileCache] Failed to read cache for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const filePath = this.resolvePath(key);
    const expiresAt = options.ttlMs ? Date.now() + options.ttlMs : null;
    const entry: FileCacheEntry<T> = { value, expiresAt };
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(entry), 'utf-8');
  }

  async invalidate(key: string): Promise<void> {
    const filePath = this.resolvePath(key);
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn(`[FileCache] Failed to invalidate cache for key ${key}:`, error);
      }
    }
  }

  async clear(namespace?: string): Promise<void> {
    const targetDir = namespace ? join(this.baseDir, namespace) : this.baseDir;
    try {
      await fs.rm(targetDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('[FileCache] Failed to clear cache directory:', error);
    }
  }

  private resolvePath(key: string, namespace?: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
    const namespaceDir = namespace ? join(this.baseDir, namespace) : this.baseDir;
    return join(namespaceDir, `${safeKey}.json`);
  }
}
