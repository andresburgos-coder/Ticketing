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
   * Generates a presigned URL that's accessible from the browser
   * @param objectPath - The path of the object in the bucket
   * @param expiresIn - Expiration time in seconds (default: 24 hours)
   * @returns The presigned URL to access the file
   */
  async getPresignedUrl(objectPath: string, expiresIn: number = 86400): Promise<string> {
    try {
      const presignedUrl = await this.client.presignedGetObject(
        this.bucketName,
        objectPath,
        expiresIn,
      );
      
      // Replace internal endpoint with external endpoint for browser access
      // Convert from: http://minio:9000/... to http://127.0.0.1:9001/...
      let url = presignedUrl;
      
      const internalEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
      const internalPort = process.env.MINIO_PORT || '9000';
      const externalUrl = process.env.MINIO_EXTERNAL_URL || `http://127.0.0.1:9001`;
      
      // Replace the internal URL with the external URL
      url = url.replace(
        `http://${internalEndpoint}:${internalPort}`,
        externalUrl
      );
      
      this.logger.log(`Presigned URL generated for: ${objectPath}`);
      return url;
    } catch (error) {
      this.logger.error(`Error generating presigned URL for ${objectPath}`, error);
      throw error;
    }
  }

  /**
   * Generates a public URL for a file in MinIO
   * This returns a URL that points to the backend's file serving endpoint
   * instead of directly to MinIO, which avoids CORS issues
   * @param objectPath - The path of the object in the bucket
   * @returns The URL to access the file through the backend
   */
  private generateFileUrl(objectPath: string): string {
    // Extract just the filename from the path (event-images/uuid-timestamp-name.jpg)
    const filename = objectPath.split('/').pop() || objectPath;
    
    // Return a URL that goes through the backend's file endpoint
    // This will be served from http://127.0.0.1:3000/events/file/:filename
    // The frontend should construct the full URL using the API base URL
    return filename;
  }

  /**
   * Gets a file stream from MinIO
   * @param objectPath - The path of the object in the bucket
   * @returns A readable stream of the file
   */
  async getFileStream(objectPath: string): Promise<any> {
    try {
      const stream = await this.client.getObject(this.bucketName, objectPath);
      return stream;
    } catch (error) {
      this.logger.error(`Error getting file stream from MinIO: ${objectPath}`, error);
      throw new Error(`Failed to get file: ${error}`);
    }
  }

  /**
   * Gets file metadata from MinIO
   * @param objectPath - The path of the object in the bucket
   * @returns File metadata including content type and size
   */
  async getFileMetadata(objectPath: string): Promise<any> {
    try {
      const stat = await this.client.statObject(this.bucketName, objectPath);
      return stat;
    } catch (error) {
      this.logger.error(`Error getting file metadata from MinIO: ${objectPath}`, error);
      throw new Error(`Failed to get file metadata: ${error}`);
    }
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
