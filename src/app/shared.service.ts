import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  private contactNumberSubject = new BehaviorSubject<string>('');
  contactNumber$ = this.contactNumberSubject.asObservable();

  private policyDataSubject = new BehaviorSubject<any>(1);
  policyData$ = this.policyDataSubject.asObservable();

  updateContactNumber(newData: string): void {
    this.contactNumberSubject.next(newData);
  }
  updatePolicyData(newData: any): void {
    this.policyDataSubject.next(newData);
  }
}
