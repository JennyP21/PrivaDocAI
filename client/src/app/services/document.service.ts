import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, DocumentResponse, DocumentStatusResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  // Get all documents for a group
  getDocumentsByGroup(groupId: string): Observable<DocumentResponse[]> {
    return this.http.get<ApiResponse<DocumentResponse[]>>(`${this.apiUrl}/document/group/${groupId}`).pipe(
      map(res => res.data)
    );
  }

  // Get lightweight statuses for polling
  getDocumentStatuses(groupId: string): Observable<DocumentStatusResponse[]> {
    return this.http.get<ApiResponse<DocumentStatusResponse[]>>(`${this.apiUrl}/document/group/${groupId}/statuses`).pipe(
      map(res => res.data)
    );
  }

  // Get a single document details
  getDocumentById(documentId: string): Observable<DocumentResponse> {
    return this.http.get<ApiResponse<DocumentResponse>>(`${this.apiUrl}/document/${documentId}`).pipe(
      map(res => res.data)
    );
  }

  // Upload files to a group
  uploadDocuments(files: File[], groupId: string): Observable<DocumentResponse[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('groupId', groupId);

    return this.http.post<ApiResponse<DocumentResponse[]>>(`${this.apiUrl}/document/upload`, formData).pipe(
      map(res => res.data)
    );
  }

  // Delete a document
  deleteDocument(documentId: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/document/delete/${documentId}`).pipe(
      map(res => res.success)
    );
  }

  // Trigger ingestion for group documents
  triggerIngestion(groupId: string): Observable<boolean> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/document/ingest/${groupId}`, {}).pipe(
      map(res => res.success)
    );
  }
}
