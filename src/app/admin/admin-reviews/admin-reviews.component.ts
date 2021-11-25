import { Component, Input, OnInit } from '@angular/core';
import { Backend, ReviewsResponse } from "../../lib/core/auth";
import { OverallReview, Review } from "../../models";

@Component({
    selector: '.learnt-admin-reviews',
    templateUrl: './admin-reviews.component.html',
    styleUrls: ['./admin-reviews.component.scss']
})
export class AdminReviewsComponent implements OnInit {
    @Input() userId: string;
    reviewsData: ReviewsResponse;
    columnsToDisplay: string[] = ['reviewer', 'title', 'public_review', 'rating', 'approved'];
    overall: OverallReview | {} = {};

    constructor(
        private backend: Backend
    ) {
    }

    get reviews(): Review[] {
        if (this.reviewsData) {
            return this.reviewsData.reviews;
        }
        return [];
    }

    ngOnInit() {
        this.backend.getReviews(this.userId, 100, 0).subscribe(d => {
            this.reviewsData = d;
            this.overall = new OverallReview(d.average);
        });
    }
}
