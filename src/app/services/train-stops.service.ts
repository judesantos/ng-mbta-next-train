import { Injectable, NgZone } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, map, Observable, Observer, throwError } from 'rxjs';

import { environment as ENV } from 'src/environments/environment';

export interface Stop {
  id: string,             // id
  type: string,           // attributes.vehicle_type
  name: string,           // attributes.name
  street: string,         // attributes.on_street
  municipality: string,   // attributes.municipality 
};

export enum StopEventType {
  RESET = 'reset',
  ADD = 'add',
  UPDATE = 'update',
  REMOVE = 'remove'
}

export interface StopEvent {
  eventId: string,
  vehicle: {
    id: string,
    type: string
  },
  eta: number,          // In unit: minutes
  arrivalTime: Date,
  departureTime: Date,
  routeId: string,
  stopId: string
}

export type StopEvents = {
  type: StopEventType,
  events: StopEvent[]
}

const serviceURL = ENV.serviceHost;
const serviceKey = ENV.apiKey;

@Injectable({
  providedIn: 'root'
})
export class TrainStopsService {
  headers: HttpHeaders;
  eventSrc: EventSource | undefined;

  constructor(
    private zone: NgZone,
    private http: HttpClient
  ) {
    this.eventSrc = undefined;
    this.headers = new HttpHeaders({
      'x-api-key': serviceKey,
      'Accept': 'application/vnd.api+json'
    })
  }

  /**
   * Get all railway stops. 
   * Limit search to light, heavy, and commuter rails only.
   * 
   * @returns 
   */
  getStops(): Observable<Stop[]> {
    /* TODO: optimize - caching */
    const reqURL = `${serviceURL}/stops?filter[route_type]=0,1,2&sort=name`;
    return this.http.get(reqURL, {headers: this.headers}).pipe(
      map((res: any) => {
        return this.handleResponse(res)
      }),
      catchError(this.handleError)
    )
  }

  /**
   * Event Stream updates.
   * listen to new arrivals and change in schedule for the specified stop.
   * 
   * @param stopId 
   */
  monitorArrivals(stopId: string) {

    // Reset connection
    if (this.eventSrc) {
      this.eventSrc.close();
      this.eventSrc = undefined;
    }

    const reqURL = `${serviceURL}/predictions?api_key=${serviceKey}&filter[stop]=${stopId}&sort=name&sort=arrival_time  `
    
    return new Observable((obs: Observer<any>) => {
      const eventSrc = this.eventSrc = new EventSource(reqURL);
      // Handle new message
      const onmessage = (event: any) => {
        this.zone.run(() => {
          obs.next(
            this.handleStreamEvent(event)
          );
          obs.complete = () => {
            eventSrc.close()
          }
        });
      };
      // Handle general errors
      this.eventSrc.onerror = (error: any) => {
        const _this = this;
        this.zone.run(() => {
          obs.error(error);
          eventSrc.close();
        })
      };
      
      // Connection is open
      eventSrc.onopen = event => {
        // Register handler for MBTA defined events
        event.target?.addEventListener('update', onmessage)
        event.target?.addEventListener('add', onmessage)
        event.target?.addEventListener('remove', onmessage)
        event.target?.addEventListener('reset', onmessage)
      }
    })
  }

  /**
   * Handle Event. Check if event is valid, convert to local types.
   * 
   * @param event 
   * @returns 
   */
  private handleStreamEvent(event: MessageEvent): StopEvents | undefined {

    let stopEvents: StopEvents;

    const data = JSON.parse(event.data);
    
    if (event.type === StopEventType.RESET) {

      const events: StopEvent[] = [];
      
      data.forEach((e: any) => {

        const arrives = new Date(e?.attributes?.arrival_time);
        const departs = new Date(e?.attributes?.departure_time);
        const etaMins = Math.abs(arrives.getMinutes() - new Date().getMinutes());

        events.push({
          eventId: e?.id,
          vehicle: {
            id: e?.relationships?.vehicle?.data?.id,
            type: e?.relationships?.vehicle?.data?.type
          },
          eta: etaMins,
          arrivalTime: arrives,
          departureTime: departs,
          routeId: e?.relationships?.route?.data?.id,
          stopId: e?.relationships?.stop?.data?.id
        })

      });

      stopEvents = {
        type: StopEventType.RESET,          
        events
      }

    } else {

      const type: StopEventType | undefined  = event.type === StopEventType.ADD ? 
        StopEventType.ADD : (
          event.type === StopEventType.REMOVE ? StopEventType.REMOVE : (
            event.type === StopEventType.UPDATE ? StopEventType.UPDATE : undefined
          )
        );

      if (!type) {
        return type;
      }

      const arrives = new Date(data?.attributes?.arrival_time);
      const departs = new Date(data?.attributes?.departure_time);
      const etaMins = arrives.getMinutes() - new Date().getMinutes();

      stopEvents = {
        type,
        events: [{
          eventId: data?.id,
          vehicle: {
            id: data?.relationships?.vehicle?.data?.id,
            type: data?.relationships?.vehicle?.data?.type
          },
          eta: etaMins,
          arrivalTime: arrives,
          departureTime: departs,
          routeId: data?.relationships?.route?.data?.id,
          stopId: data?.relationships?.stop?.data?.id
        }]
      };

    }

    return stopEvents;
  }

  private handleResponse(res: any): Stop[] {

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
  }

  private handleError(err: HttpErrorResponse) {

    const error = err.error;
    let message = '';
    if (error instanceof ErrorEvent) {
      message = error.message;
    } else {
      message = `Error Code: ${err.status}\nMessage: ${err.message}`;
    }

    return throwError(() => {
      return message;
    });
  }

}
