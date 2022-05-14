import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { TrainStopsService } from './train-stops.service';

describe('TrainStopsService', () => {
  let service: TrainStopsService;
  let spy = undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule]
    })
    service = TestBed.inject(TrainStopsService);
  });

  afterEach(() => {
    spy = undefined;
  })

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /* TODO: Mock HttpClient.get() */
  it ('should return stops', (done) => {
    service.getStops().subscribe(res => {
      expect(res).toBeDefined();
      expect(res.length).toBeGreaterThan(0);
      done();
    })
  });

});
