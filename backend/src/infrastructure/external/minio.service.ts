import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

/**
 * MinioService
 * Service for managing file storage using MinIO (S3-compatible object storage)
 * Handles file uploads, deletions, and URL generation for events
 */
@Injectable()
export class MinioService {
  private readonly client: Minio.Client;
  private readonly logger = new Logger(MinioService.name);
  private readonly bucketName = 'events';

  constructor() {
    // Initialize MinIO client with configuration
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    });

    // Initialize bucket if it doesn't exist
    this.initializeBucket();
  }

  /**
   * Initializes the bucket for events
   * Creates the bucket if it doesn't exist
   */
  private async initializeBucket(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket '${this.bucketName}' created successfully`);

        // Set bucket policy to allow public reads
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        await this.client.setBucketPolicy(
          this.bucketName,
          JSON.stringify(policy),
        );
      } else {
        this.logger.log(`Bucket '${this.bucketName}' already exists`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize bucket', error);
    }
  }

  /**
   * Uploads a file to MinIO
   * @param file - The file to upload
   * @param folder - The folder path in the bucket (e.g., 'event-images')
   * @returns The URL of the uploaded file
   * @throws Error if upload fails
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'event-images',
  ): Promise<string> {
    try {
      // Generate unique filename
      const filename = `${uuidv4()}-${Date.now()}-${file.originalname}`;
      const objectPath = `${folder}/${filename}`;

      // Upload file
      await this.client.putObject(
        this.bucketName,
        objectPath,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      this.logger.log(`File uploaded successfully: ${objectPath}`);

      // Generate and return presigned URL
      return this.generateFileUrl(objectPath);
    } catch (error) {
      this.logger.error('Error uploading file to MinIO', error);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Generates a public URL for a file in MinIO
   * @param objectPath - The path of the object in the bucket
   * @returns The URL to access the file
   */
  private generateFileUrl(objectPath: string): string {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    return `${protocol}://${endpoint}:${port}/${this.bucketName}/${objectPath}`;
  }

  /**
   * Deletes a file from MinIO
   * @param objectPath - The path of the object to delete
   * @throws Error if deletion fails
   */
  async deleteFile(objectPath: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucketName, objectPath);
      this.logger.log(`File deleted successfully: ${objectPath}`);
    } catch (error) {
      this.logger.error('Error deleting file from MinIO', error);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Extracts the object path from a MinIO URL
   * Used to delete files when updating events
   * @param fileUrl - The full URL of the file
   * @returns The object path in the bucket
   */
  extractObjectPath(fileUrl: string): string {
    const bucketUrl = `/${this.bucketName}/`;
    const startIndex = fileUrl.indexOf(bucketUrl);
    if (startIndex !== -1) {
      return fileUrl.substring(startIndex + bucketUrl.length);
    }
    return '';
  }
}
