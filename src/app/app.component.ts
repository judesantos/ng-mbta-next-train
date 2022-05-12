import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { TrainStopsService, Stop } from './services/train-stops.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'MBTA - Search Train Stop';
  submitted: boolean;
  frmStops: FormGroup;
  stops: Stop[];

  constructor(
    private fb: FormBuilder,
    private stopsSvc: TrainStopsService
  ) {
    this.stops = [];
    this.submitted = false;
    this.frmStops = this.fb.group({
      stop: [null, Validators.required]
    })
  }

  ngOnInit() {
    this.stopsSvc.getStops().subscribe(stops => {
      Object.assign(this.stops, stops);
    });
  }

  onSubmit(frm: FormGroup) {
    this.submitted = true;
    if (!this.frmStops.invalid) {
      console.log('submitted')
    }
    
  }

}
