import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PasswordResetService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/forgot-password`,
      { email }
    );
  }

  resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/reset-password`,
      { token, newPassword, confirmPassword }
    );
  }
}
