import { TestBed } from '@angular/core/testing';

import { CsiDataAdapterService } from './csi-data-adapter.service';

describe('CsiDataAdapterService', () => {
  let service: CsiDataAdapterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsiDataAdapterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
