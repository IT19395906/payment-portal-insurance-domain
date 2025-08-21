import { Component, HostListener, Inject, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedService } from '../shared.service';
import { LinkService } from '../link.service';
import { ToastrService } from 'ngx-toastr';
import { DOCUMENT } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-otp',
  standalone: false,
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.scss'
})
export class OtpComponent {

  otpForm!: FormGroup;
  otp: string[] = ['', '', '', '', '', ''];
  otpSubmitted: boolean = false;
  otpRequested: boolean = false;
  otpSuccess!: boolean;

  customerDetailsForm!: FormGroup;
  contactNumber: any;
  isContactNumber: boolean = false;
  policyData: any;
  countdown: number = 120;
  endTime: number = 0;
  countdownInterval: any;
  isCountingDown: boolean = false;
  loading = false;
  isNeedToSendSMS!: boolean;

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    $event.returnValue = 'Are you sure you want to reload? Your session may be lost!';
  }

  constructor(
    private route: ActivatedRoute,
    public sharedService: SharedService,
    private fb: FormBuilder,
    private link: LinkService,
    private toastr: ToastrService,
    public router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document

  ) { }

  ngOnInit(): void {
    this.initCustomerDetailForm();
    this.patchValueToContactNumber();
    this.initOtpForm();
  }

  ngAfterViewInit(): void {
    // Replace the current history state so back button will disabled
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = function () {
        window.history.go(1);
      };
    }
  }

  handlePageReload() {
    // Redirect to the main page instead of reloading
    window.location.replace(window.location.origin);
  }

  initCustomerDetailForm() {
    this.customerDetailsForm = this.fb.group({
      contactNo: [''],
    })
  }

  patchValueToContactNumber() {
    this.sharedService.contactNumber$.subscribe(data => this.contactNumber = data)
    if (this.contactNumber == '' || this.contactNumber == null) {
      this.isContactNumber = false;
      this.router.navigateByUrl('');
    } else {
      this.isContactNumber = true;
    }
    this.customerDetailsForm.controls['contactNo'].patchValue(this.contactNumber);
  }

  initOtpForm() {
    this.otpForm = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern('^[0-9]{1}$')]],
      digit2: ['', [Validators.required, Validators.pattern('^[0-9]{1}$')]],
      digit3: ['', [Validators.required, Validators.pattern('^[0-9]{1}$')]],
      digit4: ['', [Validators.required, Validators.pattern('^[0-9]{1}$')]],
      digit5: ['', [Validators.required, Validators.pattern('^[0-9]{1}$')]],
      digit6: ['', [Validators.required, Validators.pattern('^[0-9]{1}$')]],
    });
  }

  verifyOtp() {
    if (this.otpForm.valid) {
      const digit1 = this.otpForm.controls['digit1'].value;
      const digit2 = this.otpForm.controls['digit2'].value;
      const digit3 = this.otpForm.controls['digit3'].value;
      const digit4 = this.otpForm.controls['digit4'].value;
      const digit5 = this.otpForm.controls['digit5'].value;
      const digit6 = this.otpForm.controls['digit6'].value;
      const otpValue = digit1 + digit2 + digit3 + digit4 + digit5 + digit6;
      this.otpSubmitted = true;
      this.link.sendOTP(this.policyData.policyNo, otpValue).subscribe((response) => {
        if (response.message == 'OTP not matched please retry') {
          Swal.fire('Error', 'OTP is Invalid Please Retry', 'error');
          this.otpSuccess = false;
        } else if (response.message == 'you have exceeded the maximum number of verification attempts') {
          Swal.fire('Error', 'Exceeded Maximum Number of Verification Attempts', 'error');
          this.otpSuccess = false;
        }
        else if (response.message == 'OTP expired') {
          Swal.fire('Error', 'OTP Expired', 'error');
          this.otpSuccess = false;
        } else {
          Swal.fire('Success', 'OTP Verified', 'success');
          this.otpSuccess = true;
          Swal.fire({
            title: `OTP Verified <br/> Do You Want Payment Link To Be Sent To Mobile or Continue With Browser To Process the payment ?`,

            icon: "success",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Send To Mobile",
            cancelButtonText: 'Continue With Browser',
            allowOutsideClick: false
          }).then((result) => {
            if (result.isConfirmed) {
              this.isNeedToSendSMS = true;
              this.requestLink();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              this.isNeedToSendSMS = false;
              this.requestLink();
            }
          });
          // this.requestLink();
        }
      }, (error) => {
        this.otpSuccess = false;
        Swal.fire('Error', 'OTP is invalid', 'error');
      });
    } else {
      this.toastr.error('Please Fill 6 Digits to Verify', 'Error');
      this.otpSubmitted = false;
    }
  }

  getOtp() {
    this.loading = true;
    this.sharedService.policyData$.subscribe(data => this.policyData = data)
    this.link.getOTP(this.policyData.policyNo).subscribe((response) => {
      this.otpRequested = true;
      this.loading = false;
      this.startCountdown();
    }, (error) => {
      Swal.fire('Error', 'OTP Request Failed', 'error');
      this.otpRequested = false;
      this.loading = false;
    });
  }

  requestLink() {
    if (this.customerDetailsForm.valid && this.policyData != null) {
      this.loading = true;
      this.link.getLink(this.policyData, this.isNeedToSendSMS).subscribe((response) => {

        if (!this.isNeedToSendSMS) {
          const url = response.data.paymentLink;

          if (response.message === 'payment link generated') {
            Swal.fire('Success', 'Payment Link Generated', 'success').then((result) => {
              if (result.isConfirmed) {
                const link = this.renderer.createElement('a');
                this.renderer.setAttribute(link, 'href', url);
                this.renderer.setAttribute(link, 'target', '_blank');
                this.renderer.setStyle(link, 'display', 'none');
                this.renderer.appendChild(this.document.body, link);
                link.click();
                this.router.navigateByUrl('');
              }
            });
          }
        } else {
          if (response.message === 'payment link generated') {
            Swal.fire('Success', 'Payment Link Sent to Mobile', 'success');
          }
          this.router.navigateByUrl('');
        }
        this.loading = false;
      }, (error) => {
        Swal.fire('Error', 'Payment Link Request Failed', 'error');
        this.loading = false;
      });
    } else {
      this.toastr.error('Contact No and Policy Data not Found', 'Error');
    }
  }

  onOtpChange(event: any, currentIndex: number) {
    const value = event.target.value;

    // Move to next input if a digit is entered
    if (value.length === 1) {
      const nextIndex = currentIndex + 1;
      const nextInput = document.querySelector(`.otp-input:nth-of-type(${nextIndex + 1})`) as HTMLInputElement;

      // Focus on the next input if available
      if (nextInput) {
        nextInput.focus();
      }
    }

    //Handle backspace for going to previous input (if needed)
    if (value.length === 0) {
      const prevIndex = currentIndex - 1;
      const prevInput = document.querySelector(`.otp-input:nth-of-type(${prevIndex + 1})`) as HTMLInputElement;

      // Focus on the previous input if available
      if (prevInput) {
        prevInput.focus();
      }
    }
  }


  startCountdown() {
    this.isCountingDown = true;  // disable request OTP button
    const countdownSeconds = 120;
    this.endTime = Date.now() + countdownSeconds * 1000;
    this.countdownInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((this.endTime - now) / 1000));
      this.countdown = remaining;
      if (remaining === 0) {
        clearInterval(this.countdownInterval);
        this.isCountingDown = false;  // renable request otp button
      }
    }, 1000);
  }

  resendOtp() {
    this.loading = true;
    this.link.getOTP(this.policyData.policyNo).subscribe((response) => {
      this.otpRequested = true;
      this.loading = false;
      this.startCountdown();
    }, (error) => {
      Swal.fire('Error', 'OTP Request Failed', 'error');
      this.otpRequested = false;
      this.loading = false;
    });
    this.otpForm.reset();
    this.otpSubmitted = false;
  }

}
