import { inject, TestBed } from '@angular/core/testing';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { Stop, TrainStopsService } from './train-stops.service';
import { Observable, of } from 'rxjs';

describe('TrainStopsService', () => {
  let service: TrainStopsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule]
    });
    service = TestBed.inject(TrainStopsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it ('should get stops', inject([HttpClient], (client: HttpClient) => {
    let stops: Stop[] = [];
    spyOn(client, 'get').and.returnValue(of(stops));
    service.getStops().subscribe(res => {
      expect(res).toEqual(stops);
      expect(res).toBeGreaterThan(0);
    })
  }));


});
