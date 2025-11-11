import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';
import { switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private baseUrl = environment.AWS_USER_URL;

  constructor(private http: HttpClient, private authStore: AuthStore) {}

  uploadProfilePicture(file: File): Observable<any> {
    const token = this.authStore.getToken();

    return from(this.convertFileToBase64(file)).pipe(
      switchMap((base64: string) => {
        const body = {
          fileName: file.name,
          fileType: file.type,
          fileContentBase64: base64,
        };
        return this.http.post(`${this.baseUrl}s/profile-picture/upload`, body, {
          headers: {
            Authorization: `${token}`,
          },
        });
      })
    );
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
}
