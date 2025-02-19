/* Copyright (c) 2018-2024, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {LightCard} from '@ofModel/light-card.model';
import {delay, map, takeUntil} from 'rxjs/operators';
import {FilteredLightCardsStore} from 'app/business/store/lightcards/lightcards-feed-filter-store';
import {ConfigService} from 'app/services/config/ConfigService';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {SelectedCardStore} from 'app/business/store/selectedCard.store';
import {OpfabStore} from 'app/business/store/opfabStore';
import {TimeLineComponent} from './components/time-line/time-line.component';
import {NgIf, AsyncPipe} from '@angular/common';
import {PinnedCardsComponent} from './components/pinned-cards/pinned-cards.component';
import {CardListComponent} from './components/card-list/card-list.component';

@Component({
    selector: 'of-cards',
    templateUrl: './feed.component.html',
    styleUrls: ['./feed.component.scss'],
    standalone: true,
    imports: [TimeLineComponent, NgIf, PinnedCardsComponent, CardListComponent, RouterOutlet, AsyncPipe]
})
export class FeedComponent implements OnInit, OnDestroy {
    processFilter: string;
    stateFilter: string;

    lightCards$: Observable<LightCard[]>;
    selection$: Observable<string>;
    hallwayModeSelectedCardUid: string;
    totalNumberOfLightsCards = 0;
    maxNbOfCardsToDisplay = 100;
    private readonly ngUnsubscribe$ = new Subject<void>();
    private readonly hallwayMode: boolean;
    filtersVisible = false;
    private readonly filteredLightCardStore: FilteredLightCardsStore;

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) {
        this.route.queryParams.pipe(takeUntil(this.ngUnsubscribe$)).subscribe((params) => {
            this.processFilter = params.processFilter;
            this.stateFilter = params.stateFilter;
        });
        this.filteredLightCardStore = OpfabStore.getFilteredLightCardStore();
        this.maxNbOfCardsToDisplay = ConfigService.getConfigValue('feed.card.maxNbOfCardsToDisplay', 100);
        this.hallwayMode = ConfigService.getConfigValue('settings.hallwayMode');
    }

    ngOnInit() {
        this.selection$ = SelectedCardStore.getSelectCardIdChanges();

        this.lightCards$ = this.filteredLightCardStore.getFilteredAndSortedLightCards().pipe(
            delay(0), // Solve error: 'Expression has changed after it was checked' --> See https://blog.angular-university.io/angular-debugging/
            map((cards) => {
                this.totalNumberOfLightsCards = cards.length;
                // hallway feature
                if (this.hallwayMode) {
                    if (cards.length > 0) {
                        if (this.hallwayModeSelectedCardUid !== cards[0].uid) {
                            this.router.navigate(['/feed', 'cards', cards[0].id]);
                            this.hallwayModeSelectedCardUid = cards[0].uid;
                        }
                    } else this.router.navigate(['/feed']);
                }
                return cards.slice(0, this.maxNbOfCardsToDisplay);
            })
        );
    }

    public enoughSpaceForTimeLine() {
        return window.innerWidth > 1000 && window.innerHeight > 700;
    }

    public enoughSpaceForCardDetail() {
        return window.innerWidth > 1000;
    }

    showFilters(visible: boolean) {
        this.filtersVisible = visible;
    }

    ngOnDestroy() {
        this.ngUnsubscribe$.next();
        this.ngUnsubscribe$.complete();
    }
}
