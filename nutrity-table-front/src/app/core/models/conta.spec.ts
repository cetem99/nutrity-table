import { TestBed } from '@angular/core/testing';

import { Conta } from './conta';

describe('Conta', () => {
  let service: Conta;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Conta);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
