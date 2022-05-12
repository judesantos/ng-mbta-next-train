import { TestBed } from '@angular/core/testing';

import { TrainStopsService } from './train-stops.service';

describe('TrainStopsService', () => {
  let service: TrainStopsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrainStopsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
