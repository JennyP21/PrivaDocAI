import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, ChatResponse, ChatMessageHistoryResponse, ChatSessionResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  askQuestion(sessionId: string, question: string): Observable<ChatResponse> {
    return this.http.post<ApiResponse<ChatResponse>>(`${this.apiUrl}/chat/ask`, {
      sessionId,
      question
    }).pipe(
      map(res => res.data)
    );
  }

  getChatHistory(sessionId: string): Observable<ChatMessageHistoryResponse[]> {
    return this.http.get<ApiResponse<ChatMessageHistoryResponse[]>>(`${this.apiUrl}/chat/history/${sessionId}`).pipe(
      map(res => res.data)
    );
  }

  getChatSessions(groupId: string): Observable<ChatSessionResponse[]> {
    return this.http.get<ApiResponse<ChatSessionResponse[]>>(`${this.apiUrl}/chat/sessions/${groupId}`).pipe(
      map(res => res.data)
    );
  }

  createChatSession(groupId: string, title: string): Observable<ChatSessionResponse> {
    return this.http.post<ApiResponse<ChatSessionResponse>>(`${this.apiUrl}/chat/session`, { groupId, title }).pipe(
      map(res => res.data)
    );
  }

  deleteChatSession(sessionId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/chat/session/${sessionId}`).pipe(
      map(res => res.data)
    );
  }

  updateChatSession(sessionId: string, title: string): Observable<ChatSessionResponse> {
    return this.http.put<ApiResponse<ChatSessionResponse>>(`${this.apiUrl}/chat/session/${sessionId}`, { title }).pipe(
      map(res => res.data)
    );
  }
}
