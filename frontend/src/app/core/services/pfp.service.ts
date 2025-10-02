import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private baseUrl = environment.AWS_USER_URL;

  constructor(private http: HttpClient, private authStore: AuthStore) {}

  uploadProfilePicture(file: File): Observable<any> {
    const token = this.authStore.getToken();
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.baseUrl}/profile-picture/upload`,
      {
        formData,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
  }
}
