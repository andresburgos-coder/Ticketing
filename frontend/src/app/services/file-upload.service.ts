import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UploadResponse {
  success: boolean;
  file?: {
    filename: string;
    originalname: string;
    size: number;
    mimetype: string;
    url: string;
    path: string;
  };
  error?: string;
}

export interface FileListResponse {
  files: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  private apiUrl = `${environment.fileServerUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Subir un archivo de imagen
   * @param file Archivo a subir
   * @param category Categoría de la imagen (events, users, tickets, general)
   */
  uploadImage(file: File, category: string = 'general'): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Obtener lista de archivos en una categoría
   * @param category Categoría de la imagen
   */
  getFiles(category: string = 'general'): Observable<FileListResponse> {
    return this.http.get<FileListResponse>(`${this.apiUrl}/files/${category}`);
  }

  /**
   * Eliminar un archivo
   * @param category Categoría de la imagen
   * @param filename Nombre del archivo
   */
  deleteFile(category: string, filename: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/files/${category}/${filename}`);
  }

  /**
   * Generar URL completa de una imagen
   * @param category Categoría de la imagen
   * @param filename Nombre del archivo
   */
  getImageUrl(category: string, filename: string): string {
    return `${environment.fileServerUrl}/api/files/${category}/${filename}`;
  }

  /**
   * Validar que el archivo es una imagen válida
   * @param file Archivo a validar
   */
  isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  /**
   * Obtener mensaje de error para validación
   * @param file Archivo a validar
   */
  getValidationError(file: File): string | null {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(file.type)) {
      return 'Solo se permiten imágenes en formato JPEG, PNG, GIF o WebP';
    }

    if (file.size > maxSize) {
      return 'El archivo es demasiado grande. Máximo: 50MB';
    }

    return null;
  }
}
