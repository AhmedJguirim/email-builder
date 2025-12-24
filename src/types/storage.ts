export interface StorageProvider {
  upload(file: File, path?: string): Promise<UploadResult>;
  delete(path: string): Promise<void>;
  list(prefix?: string): Promise<StorageObject[]>;
  getUrl(path: string): string;
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;
}

export interface UploadResult {
  url: string;
  path: string;
  key: string;
  size: number;
  contentType: string;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

export interface S3Config {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  pathPrefix?: string;
  forcePathStyle?: boolean;
  publicUrl?: string;
}

export interface MinioConfig {
  endpoint: string;
  port?: number;
  useSSL?: boolean;
  bucket: string;
  accessKey: string;
  secretKey: string;
  pathPrefix?: string;
  publicUrl?: string;
}

export interface AssetLibrary {
  id: string;
  name: string;
  folders: AssetFolder[];
}

export interface AssetFolder {
  id: string;
  name: string;
  parentId?: string;
  assets: Asset[];
}

export interface Asset {
  id: string;
  name: string;
  url: string;
  path: string;
  type: 'image' | 'video' | 'document' | 'other';
  size: number;
  width?: number;
  height?: number;
  contentType: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, string>;
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
