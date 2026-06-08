import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, GroupResponse, GroupMemberResponse, UserResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  // Check if a group name is available
  isGroupNameAvailable(name: string): Observable<boolean> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/group/isAvailable`, name).pipe(
      map(res => res.data)
    );
  }

  // Create new group
  createGroup(group: { name: string; description: string }): Observable<GroupResponse> {
    return this.http.post<ApiResponse<GroupResponse>>(`${this.apiUrl}/group/create`, group).pipe(
      map(res => res.data)
    );
  }

  // Delete a group
  deleteGroup(groupId: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/group/delete/${groupId}`).pipe(
      map(res => res.success)
    );
  }

  // Get all groups in the system (Admin only)
  getAllGroups(): Observable<GroupResponse[]> {
    return this.http.get<ApiResponse<GroupResponse[]>>(`${this.apiUrl}/group/all`).pipe(
      map(res => res.data)
    );
  }

  // Get groups of a specific member
  getGroupsByMember(userId: string): Observable<GroupMemberResponse[]> {
    return this.http.get<ApiResponse<GroupMemberResponse[]>>(`${this.apiUrl}/group/member/getgroups/${userId}`).pipe(
      map(res => res.data)
    );
  }

  // Get members of a specific group
  getMembersByGroup(groupId: string): Observable<GroupMemberResponse[]> {
    return this.http.get<ApiResponse<GroupMemberResponse[]>>(`${this.apiUrl}/group/member/getmembers/${groupId}`).pipe(
      map(res => res.data)
    );
  }

  // Find user by email (for adding members)
  findUserByEmail(email: string): Observable<UserResponse> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.apiUrl}/user/email/${email}`).pipe(
      map(res => {
        if (res.success && res.data) {
          return res.data;
        }
        throw new Error('User not found');
      })
    );
  }

  // Add member to group
  addMember(groupId: string, userId: string, role: 'OWNER' | 'MEMBER'): Observable<GroupMemberResponse> {
    return this.http.post<ApiResponse<GroupMemberResponse>>(`${this.apiUrl}/group/member/add`, {
      groupId,
      userId,
      groupRole: role
    }).pipe(
      map(res => res.data)
    );
  }

  // Remove member from group
  removeMember(groupId: string, userId: string): Observable<boolean> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/group/member/remove`, {
      groupId,
      userId
    }).pipe(
      map(res => res.success)
    );
  }

  // Change member role
  changeMemberRole(groupId: string, userId: string, role: 'OWNER' | 'MEMBER'): Observable<GroupMemberResponse> {
    return this.http.post<ApiResponse<GroupMemberResponse>>(`${this.apiUrl}/group/member/changeRole`, {
      groupId,
      userId,
      groupRole: role
    }).pipe(
      map(res => res.data)
    );
  }
}
