// src/app/real-time-data.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RealTimeDataService {
  private dataSubject: Subject<number> = new Subject<number>();
  data$: Observable<number> = this.dataSubject.asObservable();

  constructor() {}

  updateRealTimeData(newValue: number): void {
    this.dataSubject.next(newValue);
  }
}
