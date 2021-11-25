import { Component, Input, OnInit } from '@angular/core';
import { NoteType, UserNote } from "../../models";

@Component({
    selector: 'learnt-user-notes',
    templateUrl: './user-notes.component.html',
    styleUrls: ['./user-notes.component.scss']
})
export class UserNotesComponent implements OnInit {
    @Input() notes: UserNote[];
    noteTypes = NoteType;
    constructor() {
    }

    ngOnInit(): void{
    }

}
