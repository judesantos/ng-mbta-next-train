import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';

export interface Stop {
  id: string,             // id
  type: string,           // attributes.vehicle_type
  name: string,           // attributes.name
  street: string,         // attributes.on_street
  municipality: string,   // attributes.municipality 
};

const serviceURL = 'https://api-v3.mbta.com/';
const serviceKey = 'ec9e33143106466395a2fddc0fc82695'

@Injectable({
  providedIn: 'root'
})
export class TrainStopsService {
  private headers: HttpHeaders;

  constructor(
    private http: HttpClient
  ) {
    this.headers = new HttpHeaders({
        'accept': 'application/vnd.api+json',
        'x-api-key': serviceKey
    })
  }

  /**
   * Get all railway stops. 
   * Limit search to light, heavy, and commuter rails only.
   * 
   * @returns 
   */
  getStops(): Observable<any> {
    /* TODO: optimize - caching */
    const reqURL = `${serviceURL}/stops?filter[route_type]=0,1,2`;
    return this.http.get(reqURL, {headers: this.headers}).pipe(
      map((res: any) => {
        const stops: Stop[] = [];
        res.data.forEach((e: any) => {
          stops.push({
            id: e.id,
            type: e.attributes.vehicle_type,
            name: e.attributes.name,
            street: e.attributes.on_street ? e.attributes.on_street : e.attributes.platform_name,
            municipality: e.attributes.municipality
          })
        });
        return stops || [];
      }),
      catchError(this.handleError)
    )
  }

  getNextArrivalTime(
    stop: string,
    destination: string
  ): Observable<any> {
    const reqURL = `${serviceURL}/stops`;
    return of(this.http.get(reqURL))
  }

  async notifyOnNextArrivalTime(): Promise<any> {
    return {}
  }

  private handleError(err: HttpErrorResponse) {
    const error = err.error;
    let message = '';
    if (error instanceof ErrorEvent) {
      message = error.message;
    } else {
      message = `Error Code: ${err.status}\nMessage: ${err.message}`;
    }
    console.error(message);
    return throwError(() => {
      return message;
    });
  }

}
