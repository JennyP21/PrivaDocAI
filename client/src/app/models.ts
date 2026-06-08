export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UserResponse {
  id: string;
  email: string;
  isSystemAdmin: boolean;
}

export interface AuthResponse {
  accessToken: string;
  email: string;
}

export interface GroupResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface GroupMemberResponse {
  userId: string;
  userEmail: string;
  groupId: string;
  groupName: string;
  groupDescription: string;
  groupRole: 'OWNER' | 'MEMBER';
}

export interface DocumentResponse {
  id: string;
  originalFileName: string;
  mimeType: string;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  uploadedAt: string;
  uploadedByEmail: string;
}

export interface ReferenceChunk {
  fileName: string;
  content: string;
}

export interface ChatResponse {
  answer: string;
  references: ReferenceChunk[];
}

export interface DocumentStatusResponse {
  id: string;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface ChatMessageHistoryResponse {
  sender: 'user' | 'ai';
  text: string;
}

export interface ChatSessionResponse {
  id: string;
  groupId: string;
  title: string;
  createdAt: string;
}

export interface ChatSessionRequest {
  groupId: string;
  title: string;
}

