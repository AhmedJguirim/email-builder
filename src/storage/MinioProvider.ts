import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider, UploadResult, StorageObject, MinioConfig } from '../types/storage';
import { generateId } from '../utils/id';

export class MinioStorageProvider implements StorageProvider {
  private client: S3Client;
  private config: MinioConfig;

  constructor(config: MinioConfig) {
    this.config = config;
    
    const protocol = config.useSSL !== false ? 'https' : 'http';
    const port = config.port || (config.useSSL !== false ? 443 : 9000);
    const endpoint = `${protocol}://${config.endpoint}:${port}`;

    this.client = new S3Client({
      region: 'us-east-1',
      endpoint,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true,
    });
  }

  private getFullPath(path: string): string {
    const prefix = this.config.pathPrefix ? `${this.config.pathPrefix}/` : '';
    return `${prefix}${path}`.replace(/\/+/g, '/');
  }

  async upload(file: File, customPath?: string): Promise<UploadResult> {
    const ext = file.name.split('.').pop() || '';
    const fileName = customPath || `${generateId()}.${ext}`;
    const key = this.getFullPath(fileName);

    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: body,
      ContentType: file.type,
    });

    await this.client.send(command);

    const url = this.getUrl(key);

    return {
      url,
      path: fileName,
      key,
      size: file.size,
      contentType: file.type,
    };
  }

  async delete(path: string): Promise<void> {
    const key = this.getFullPath(path);

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async list(prefix?: string): Promise<StorageObject[]> {
    const fullPrefix = prefix ? this.getFullPath(prefix) : this.config.pathPrefix || '';

    const command = new ListObjectsV2Command({
      Bucket: this.config.bucket,
      Prefix: fullPrefix,
    });

    const response = await this.client.send(command);

    return (response.Contents || []).map((item) => ({
      key: item.Key || '',
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
    }));
  }

  getUrl(path: string): string {
    if (this.config.publicUrl) {
      return `${this.config.publicUrl}/${path}`;
    }

    const protocol = this.config.useSSL !== false ? 'https' : 'http';
    const port = this.config.port || (this.config.useSSL !== false ? 443 : 9000);
    
    return `${protocol}://${this.config.endpoint}:${port}/${this.config.bucket}/${path}`;
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const key = this.getFullPath(path);

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }
}
