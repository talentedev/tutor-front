import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'learnt-legal',
  templateUrl: './legal.component.html',
  styleUrls: ['./legal.component.scss']
})
export class LegalComponent implements OnInit {

  public section: string;

  constructor(private route: ActivatedRoute) {
    this.section = this.route.routeConfig.data.section;
  }


  ngOnInit() {
  }

}
