export * from './S3Provider';
export * from './MinioProvider';

import type { StorageProvider, S3Config, MinioConfig } from '../types/storage';
import { S3StorageProvider } from './S3Provider';
import { MinioStorageProvider } from './MinioProvider';

export type StorageType = 's3' | 'minio';

export interface StorageFactoryConfig {
  type: StorageType;
  s3?: S3Config;
  minio?: MinioConfig;
}

export function createStorageProvider(config: StorageFactoryConfig): StorageProvider {
  switch (config.type) {
    case 's3':
      if (!config.s3) {
        throw new Error('S3 configuration is required when type is "s3"');
      }
      return new S3StorageProvider(config.s3);

    case 'minio':
      if (!config.minio) {
        throw new Error('Minio configuration is required when type is "minio"');
      }
      return new MinioStorageProvider(config.minio);

    default:
      throw new Error(`Unknown storage type: ${config.type}`);
  }
}
