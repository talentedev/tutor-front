import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { User } from '../../../models';
import { AdminUserService } from "../../services/admin-user.service";
import {AlertService} from '../../../services/alerts'
import { Router } from '@angular/router';

@Component({
    selector: 'learnt-credits-grant',
    templateUrl: './credits-grant.component.html',
    styleUrls: ['./credits-grant.component.scss']
})
export class CreditsGrantComponent implements OnInit {
  
    user: User;
    noMessage: boolean;

    grantCreditsForm = this.formBuilder.group({
        amount: ['', Validators.required],
        reason: '',
        notes: ''
    });

    constructor(private dialog: MatDialogRef<CreditsGrantComponent>,
                private formBuilder: FormBuilder,
                private userService: AdminUserService,
                private alerts: AlertService,
                private router: Router,) {
    }

    ngOnInit() {
        this.noMessage = true;
    }
    
    init(user: User) {
        this.user = user;
    }

    close() {
        this.dialog.close();
    }

    grantCredits(user, event) {

        event.stopPropagation();
        const raw = this.grantCreditsForm.getRawValue();

        const alertOpts = {lifetime: 0, buttons: [{label: 'Yes', result: true}, {label: 'No', result: false}]};
        const alertMessage = 'Are you sure?';
        const alert = this.alerts.alert('Grant $' + raw.amount +' credits to ' + user.profile.first_name, alertMessage, alertOpts);

        alert.result.subscribe(res => {
            alert.dispose();
            if (res === true) {
                this.userService.grantCredits(user._id, raw).subscribe(() => {
                    this.close();

                    const currentUrl = this.router.url;
                    if(currentUrl.includes(user._id)) {
                        this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
                            this.router.navigate([currentUrl]);
                        });
                    }     
                },
                () => { 
                    this.alerts.alert('Failed to grant credits. Please try again.');
                })    
            } 
        });
        

        
    }
}