import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider, UploadResult, StorageObject, S3Config } from '../types/storage';
import { generateId } from '../utils/id';

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private config: S3Config;

  constructor(config: S3Config) {
    this.config = config;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? false,
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
      ACL: 'public-read',
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

    if (this.config.endpoint) {
      return `${this.config.endpoint}/${this.config.bucket}/${path}`;
    }

    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${path}`;
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
