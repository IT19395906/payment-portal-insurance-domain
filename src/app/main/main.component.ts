import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PaymentSearchDto } from '../model/payment-search-dto';
import { LinkService } from '../link.service';
import { SharedService } from '../shared.service';

@Component({
  selector: 'app-main',
  standalone: false,
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent implements OnInit, AfterViewInit {

  customerDetailsForm!: FormGroup;
  customerData!: any;
  loading = false;
  searched = false;
  isNeedToSendSMS: boolean = false;
  isValidPolicy!: boolean;
  isValidVehicle!: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private link: LinkService,
    public router: Router,
    public sharedService: SharedService
  ) { }

  ngOnInit(): void {
    this.customerDetailsForm = this.formBuilder.group({
      policyType: [''],
      policyNo: ['', [Validators.required]],
      name: [''],
      email: [''],
      contactNo: [''],
    })
  }

  ngAfterViewInit(): void {
    // Replace the current history state back button will refresh 
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = function () {
        window.history.go(0);
      };
    }
    var bootstrap: any;
    const triggerEl = document.querySelector('[data-bs-toggle="popover"]');
    if (triggerEl) {
      new bootstrap.Popover(triggerEl, {
        html: true,
        container: 'body',
        trigger: 'focus',
        placement: 'bottom'
      });
    }
  }

  searchForPolicy(Event: any) {
    let inputValue = this.customerDetailsForm.controls['policyNo'].value.trim();

    const paymentSearchDto: PaymentSearchDto = {
      policyNo : this.isValidPolicy ? inputValue : null,
      vehicleNo : this.isValidVehicle ? inputValue : null
    };

    if (inputValue == null || inputValue == '') { this.toastr.error('Please enter Policy Number or Vehicle Number', 'Error'); return }
    if (!this.customerDetailsForm.valid) { this.toastr.error('Customer Form Is Invalid', 'Error'); return; }

    this.loading = true;
    this.link.getPolicyDetails(paymentSearchDto).subscribe((res) => {

      if (res.message == 'Contact Details Not Found') {
        this.loading = false;
        this.searched = false;
        Swal.fire('Error', 'The contact details for this policy are currently unavailable', 'error');

      } else if (res.data.contractStatus == 'Cancelled') {
        this.loading = false;
        this.searched = false;
        Swal.fire({
          title: "Processing payment for the canceled policy. Once completed, please contact the call center or the relevant marketing officer for reinstatement. Additional charges apply",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Yes",
          cancelButtonText: 'No'
        }).then((result) => {

          if (result.isConfirmed) {
            this.customerData = res.data;
            this.searched = true;
            this.loading = false;
            this.sharedService.updateContactNumber(this.customerData.phone);
            this.sharedService.updatePolicyData(this.customerData);
            this.patchValueToCustomerDetailsForm();
          }

        });
      }
      else {
        this.customerData = res.data;
        this.searched = true;
        this.loading = false;
        this.sharedService.updateContactNumber(this.customerData.phone);
        this.sharedService.updatePolicyData(this.customerData);
        this.patchValueToCustomerDetailsForm();
      }
    }, (error) => {
      if (error.error.message == '') {
        Swal.fire('Error', 'Phone Number Is Not Provided', 'error');
      } else {
        Swal.fire('Error', 'Invalid Policy No or Vehicle No', 'error');
      }

      this.searched = false;
      this.loading = false;
    });
  }

  onBlur(event: any) {
    const value = event.target.value.trim();
    if (!value) {
      return;
    }

    this.isValidPolicy = false;
    this.isValidVehicle = false;
    this.customerDetailsForm.get('policyNo')?.setErrors(null);

    const policyPattern = /^LP/;
    const policyLengthIsValid = value.length >= 8 && value.length <= 12;
    const nonNumeric = /^[0-9]+$/.test(value.slice(2));
    const vehiclePattern = [
      /^[A-Z]{2}\s[A-Z]{3}-\d{4}$/, // province added example WP TTT-1234
      /^[A-Z]{2}\s[a-zA-Z0-9]{2}-\d{4}$/, // province added example WP TT-1234
      /^[A-Z]{2}\s\d{2}-\d{4}$/, // province added example WP 00-0000
      /^[A-Z]{2}-\d{4}$/,   // unregistered UR-0000
      /^[A-Z]{1}\d{2}-\d{4}$/ // W00-0000
    ];

    if (policyPattern.test(value) && policyLengthIsValid && nonNumeric) {
      this.isValidPolicy = true;
      return;
    }

    if (vehiclePattern.some(pattern => pattern.test(value))) {
      this.isValidVehicle = true;
      return;
    }

    this.customerDetailsForm.get('policyNo')?.setErrors({ invalidPolicyOrVehicle: true });
  }

  requestLink() {
    if (this.customerDetailsForm.valid && this.customerData != null) {
      this.searched = true;
      this.loading = true;
      this.link.getLink(this.customerData, this.isNeedToSendSMS).subscribe((response) => {
        if (response.message === 'payment link generated and sent to mobile') {
          Swal.fire('Success', 'Payment Link Sent to Mobile', 'success');
        }
        this.customerDetailsForm.reset();
        this.searched = false;
        this.loading = false;
      }, (error) => {
        Swal.fire('Error', 'Payment Link Request Failed', 'error');
        this.searched = false;
        this.loading = false;
      });
    } else {
      this.toastr.error('Please Search Using Policy Number', 'Error');
    }
  }

  otp() {
    if (this.customerDetailsForm.valid && this.customerData != null) {
      this.router.navigateByUrl('/otp');
    } else {
      this.toastr.error('Please Search Using Policy Number', 'Error');
    }
  }

  patchValueToCustomerDetailsForm() {
    this.customerDetailsForm.controls['policyType'].patchValue(this.customerData.policyType);
    this.customerDetailsForm.controls['name'].patchValue(this.customerData.firstName + ' ' + this.customerData.lastName);
    this.customerDetailsForm.controls['contactNo'].patchValue(this.customerData.phone);
    this.customerDetailsForm.controls['email'].patchValue(this.customerData.email);
  }
}
