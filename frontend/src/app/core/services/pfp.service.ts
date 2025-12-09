import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';
import { switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private baseUrl = `${environment.AWS_BASE_URL}/user`;

  constructor(private http: HttpClient, private authStore: AuthStore) {}

  // uploads profile picture (converts to base64 and sends the image to S3 via calling a lambda function),imageurl is saved in DynamoDb
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

  //function that does the conversion
  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
}
