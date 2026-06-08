import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, switchMap, map } from 'rxjs';
import { ApiResponse, AuthResponse, UserResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:8080/api';

  currentUser = signal<UserResponse | null>(null);

  constructor() {
    this.restoreUserSession();
  }

  restoreUserSession() {
    const cachedUser = localStorage.getItem('user_details');
    if (cachedUser) {
      this.currentUser.set(JSON.parse(cachedUser));
    }
  }

  login(authData: any): Observable<UserResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, authData).pipe(
      tap(res => {
        if (res.success && res.data) {
          localStorage.setItem('token', res.data.accessToken);
          localStorage.setItem('email', res.data.email);
        }
      }),
      switchMap(res => {
        // Fetch full user details from the database by email
        return this.http.get<ApiResponse<UserResponse>>(`${this.apiUrl}/user/email/${res.data.email}`).pipe(
          map(userRes => {
            if (userRes.success && userRes.data) {
              const userDetails = userRes.data;
              localStorage.setItem('user_details', JSON.stringify(userDetails));
              this.currentUser.set(userDetails);
              return userDetails;
            }
            throw new Error('Failed to retrieve user details.');
          })
        );
      })
    );
  }

  register(userData: any): Observable<ApiResponse<UserResponse>> {
    // In UserController registration takes a UserRequestDTO (email, password, isSystemAdmin)
    return this.http.post<ApiResponse<UserResponse>>(`${this.apiUrl}/user/register`, {
      email: userData.email,
      password: userData.password,
      isSystemAdmin: false // Default to regular user
    });
  }

  logout(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
        next: () => this.clearSession(),
        error: () => this.clearSession()
      });
    } else {
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('user_details');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
      map(res => {
        if (res.success && res.data) {
          localStorage.setItem('token', res.data.accessToken);
          localStorage.setItem('email', res.data.email);
          return res.data;
        }
        throw new Error('Refresh failed');
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
