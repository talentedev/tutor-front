import { User } from '../../models';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MessengerFrontService } from '../../services/messenger';
import { FormBuilder } from '@angular/forms';

@Component({
    selector: 'learnt-send-message',
    templateUrl: './send-message.component.html',
    styleUrls: ['./send-message.component.scss']
})
export class SendMessageComponent implements OnInit {
  
    me: User;
    tutor: User;
    noMessage: boolean;

    sendForm = this.formBuilder.group({
        message: ''
    });

    constructor(private dialog: MatDialogRef<SendMessageComponent>,
                private messengerService: MessengerFrontService,
                private formBuilder: FormBuilder) {
    }

    ngOnInit() {
        this.noMessage = true;
    }
    
    init(me: User, tutor: User) {
        this.me = me;
        this.tutor = tutor;
    }

    close() {
        this.dialog.close();
    }

    onChangeMessage() {
        const raw = this.sendForm.getRawValue();
        if(raw.message !== '') {
            this.noMessage = false;
        }
        else {
            this.noMessage = true;
        }     
    }

    sendMessage(event) {
        event.stopPropagation();
        const raw = this.sendForm.getRawValue();

        this.messengerService.createConversationWithTutor(this.me, this.tutor, raw.message);
        this.close();
    }
}