import { Platform } from './../../services/platform';
import { Observable } from 'rxjs/Observable';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { Backend } from 'app/lib/core/auth';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {map, startWith} from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

const MAX_LINKS = 18;

interface Subject {
  _id: string;
  name: string;
}

interface Location {
  name: string;
  lat: number
  lon: number
}

@Component({
  selector: 'learnt-admin-footer-links',
  templateUrl: './admin-footer-links.component.html',
  styleUrls: ['./admin-footer-links.component.scss']
})
export class AdminFooterLinksComponent implements OnInit {

  @ViewChild('subjectInput') subjectInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  locationFormGroup: FormGroup;

  locations = [];
  subjects: Subject[] = [];
  subjectsAll: Subject[] = [];
  filteredSubjects: Observable<any>;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  subjectControl = new FormControl();
  visible = true;
  selectable = true;
  removable = true;

  constructor(private platform: Platform, private backend: Backend, formBuilder: FormBuilder) {
    this.locationFormGroup = formBuilder.group({
      'name': [],
      'lat': [],
      'lon': [],
    });

    this.fetchLinks();
  }

  fetchLinks() {

    let footerLinks: any;

    try {
      footerLinks = JSON.parse(
        this.platform.setting('footer_links')
      );
    } catch (e) {
      return
    }

    if (footerLinks.subjects) {
      this.subjects = footerLinks.subjects;
    }

    if (footerLinks.locations) {
      this.locations = footerLinks.locations;
    }
  }

  ngOnInit() {
    this.fetch();
  }

  removeSubject(subject: Subject): void {
    const index = this.subjects.indexOf(subject);

    if (index >= 0) {
      this.subjects.splice(index, 1);
    }
    this.save();
  }

  removeLocation(location) {
    this.locations.splice(
      this.locations.indexOf(location),
      1
    );
    this.save();
  }

  addLocation() {

    const loc = this.locationFormGroup.value;

    if (this.locations.length < MAX_LINKS) {

      if (this.locations.filter(l => l.name === loc.name).length) {
        alert('Location with name already exists');
        return;
      }

      this.locations.push(loc);
      this.locationFormGroup.reset();
    }

    this.save();
  }

  dropLocation(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.locations, event.previousIndex, event.currentIndex);
    this.save();
  }

  dropSubject(event: CdkDragDrop<Subject[]>) {
    moveItemInArray(this.subjects, event.previousIndex, event.currentIndex);
    this.save();
  }

  onSubjectSelected(event: MatAutocompleteSelectedEvent): void {

    if (this.subjects.length >= MAX_LINKS) {
      return;
    }

    this.subjects.push(event.option.value);
    this.subjectInput.nativeElement.value = '';
    this.subjectControl.setValue(null);
    const index = this.subjectsAll.indexOf(event.option.value);
    if (index !== -1) {
      this.subjectsAll.splice(index, 1);
    }

    this.save();
  }

  private _filterSubject(v: Subject | string): Subject[] {
    const value = typeof(v) === 'string' ? v : v.name;
    const filterValue = value.toLowerCase();
    return this.subjectsAll.filter(subject => subject.name.toLowerCase().indexOf(filterValue) === 0);
  }

  get subjectsCount(): string {
    return `( ${this.subjects.length} / ${MAX_LINKS} )`;
  }

  get locationsCount(): string {
    return `( ${this.locations.length} / ${MAX_LINKS} )`;
  }

  private get unselected(): Subject[] {
    const ids = this.subjects.map(s => s._id);
    return this.subjectsAll.filter(s => ids.indexOf(s._id) === -1)
  }

  async fetch() {
    const subjects = this.backend.getSubjects().subscribe(subjects => {
      this.subjectsAll = subjects;
      this.filteredSubjects = this.subjectControl.valueChanges.pipe(
        startWith(null),
        map((s: string) => s ? this._filterSubject(s) : this.unselected.slice())
      );
    })
  }

  save() {

    const payload = {
      subjects: this.subjects,
      locations: this.locations,
    };

    this.backend.setFooterLinks(payload).subscribe();
  }
}
