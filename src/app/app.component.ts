import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import {
  TrainStopsService,
  Stop,
  StopEvent,
  StopEventType,
  StopEvents
} from './services/train-stops.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'MBTA - Train Schedule';

  today: Date;
  arriving: StopEvent[];
  serverError: boolean
  submitted: boolean;
  frmStops: FormGroup;
  stops: Stop[];

  constructor(
    private fb: FormBuilder,
    private stopsSvc: TrainStopsService
  ) {
    this.today = new Date();
    this.arriving = [];
    this.stops = [];
    this.serverError = false;
    this.submitted = false;
    this.frmStops = this.fb.group({
      stop: [null, Validators.required]
    })
  }

  ngOnInit() {
    // Get list of railway stops: [light, heavy, commuter]
    const obs: Observable<Stop[]> = this.stopsSvc.getStops();
    of(obs.subscribe({
        next: (stops: Stop[]) => {
          // UI - stops list box options
          Object.assign(this.stops, stops);
        },
        error: (err: any) => {
          console.error({getStopsError: err})
          this.serverError = true;
        }
    }));
  }

  onSubmit(frm: FormGroup) {

    this.submitted = true;
    this.serverError = false;

    if (!this.frmStops.invalid) {
      // Register and receive events
      const obs: Observable<any> = this.stopsSvc.monitorArrivals(frm.value.stop.id);
      of(obs.subscribe({
          next: (events: StopEvents) => {
            this.handleArrivalEvents(events);
          },
          error: (err: any) => {
            console.error({stopEventError: err})
            this.serverError = true;
          },
      }));
    }
  }

  private handleArrivalEvents(event: StopEvents) {

    if (event.type === StopEventType.RESET) {

      this.arriving = event.events;

    } else {

      const _e: StopEvent | undefined = event.events.pop();
      if (_e) {
        let updated = false;
        this.arriving.every((e, idx) => {
          if (
            _e.routeId === e.routeId &&
            _e.vehicle.id === e.vehicle.id
          ) {
            if (event.type === StopEventType.UPDATE) {
              this.arriving[idx] = _e;
            } else if (event.type === StopEventType.REMOVE) {
              this.arriving.splice(idx, 1);
            }
            return !(updated = true); // break from loop
          }
          return true; // continue;
        })
        if (!updated) {
          // No entry found in list? Must be an ADD event, add.
          if (event.type === StopEventType.REMOVE) {
            this.arriving.push(_e);
          }
        }
      }
    }
  }

}
