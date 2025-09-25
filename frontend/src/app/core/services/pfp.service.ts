import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private baseUrl = environment.AWS_USER_URL;

  constructor(private http: HttpClient) {}

  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.baseUrl}/users/profile-picture/upload`,
      formData
    );
  }
}
