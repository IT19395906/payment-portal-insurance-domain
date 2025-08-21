import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './environment';
import { PaymentSearchDto } from './model/payment-search-dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LinkService {

  constructor(private http: HttpClient) { }

  private apiUrl = `${environment.apiUrl}test`;

  getPolicyDetails(paymentSearchDto: PaymentSearchDto): Observable<any> {
    const queryParams = new HttpParams().set('policyNo', paymentSearchDto.policyNo).set('vehicleNo', paymentSearchDto.vehicleNo);
    const url = `${this.apiUrl}/test?${queryParams.toString()}`;

    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', }), };

    return this.http.get<any>(url, httpOptions);
  }

  getLink(data: any, sample: boolean): Observable<any> {
    const queryParams = new HttpParams().set('test', sample);
    const url = `${this.apiUrl}/test?${queryParams.toString()}`;

    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', }), };

    return this.http.post<any>(url, data, httpOptions);
  }

  sendOTP(policyNo: any, otp: any): Observable<any> {
    const queryParams = new HttpParams().set('policyNo', policyNo).set('otp', otp);
    const url = `${this.apiUrl}/test?${queryParams.toString()}`;

    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', }), };

    return this.http.post<any>(url, {}, httpOptions);
  }

  getOTP(policyNo: any): Observable<any> {
    const queryParams = new HttpParams().set('policyNo', policyNo);
    const url = `${this.apiUrl}/test?${queryParams.toString()}`;

    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', }), };

    return this.http.post<any>(url, policyNo, httpOptions);
  }

}
