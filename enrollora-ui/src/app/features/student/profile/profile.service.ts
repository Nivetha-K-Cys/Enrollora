
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface StudentProfile {
  studentId: number;
  name: string;
  email: string;
  department: string;
  age: number;
  cgpa: number;
  status: number;
  registeredAt: string;
  reviewedAt: string | null;
}

export interface UpdateProfileRequest {
  name: string;
  department: string;
  age: number;
  cgpa: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/students/me`;

  getProfile(): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(this.apiUrl);
  }

  updateProfile(
    data: UpdateProfileRequest
  ): Observable<StudentProfile> {
    return this.http.put<StudentProfile>(
      this.apiUrl,
      data
    );
  }
}
