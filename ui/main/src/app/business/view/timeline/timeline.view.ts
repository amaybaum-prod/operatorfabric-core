/* Copyright (c) 2018-2024, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import {Circle, Circles} from './circles';
import {XAxis} from './xaxis';
import {FilteredLightCardsStore} from 'app/business/store/lightcards/lightcards-feed-filter-store';
import {Observable, Subject, takeUntil} from 'rxjs';
import {OpfabStore} from 'app/business/store/opfabStore';
import {I18nService} from 'app/business/services/translation/i18n.service';
import {format} from 'date-fns';

export class TimelineView {
    private circles: Circles;
    private xAxis: XAxis;
    private domainId: string;
    private title: string;
    private gridTimeDomain: any;
    private cardsTimeDomain: any;
    private ngUnsubscribe$ = new Subject<void>();

    private circlesSubject = new Subject<Circle[]>();
    private filteredLightCardStore: FilteredLightCardsStore;

    constructor() {
        this.filteredLightCardStore = OpfabStore.getFilteredLightCardStore();
        this.circles = new Circles();
        this.xAxis = new XAxis();
        this.initDataPipe();
    }

    private initDataPipe(): void {
        this.filteredLightCardStore
            .getFilteredLightCardsForTimeLine()
            .pipe(takeUntil(this.ngUnsubscribe$))
            .subscribe((value) => {
                this.circles.setCardsToDrawOnTimeLine(value);
                this.circlesSubject.next(this.circles.circles);
            });
    }

    public getCircles(): Observable<Circle[]> {
        return this.circlesSubject.asObservable();
    }

    public setDomain(domainId: string, cardsTimeDomain: any): void {
        this.domainId = domainId;
        this.cardsTimeDomain = cardsTimeDomain;
        this.setDomainForTimeLineGridDisplay();
        this.xAxis.setupAxis(this.domainId, this.gridTimeDomain);
        this.circles.setDomain(cardsTimeDomain, this.gridTimeDomain, this.xAxis.getTicks());
        this.circlesSubject.next(this.circles.circles);
        this.setTitle();
    }

    private setDomainForTimeLineGridDisplay() {
        this.gridTimeDomain = [
            this.cardsTimeDomain.startDate + this.cardsTimeDomain.overlap,
            this.cardsTimeDomain.endDate
        ];
    }

    private setTitle() {
        const localeOption = I18nService.getDateFnsLocaleOption();
        switch (this.domainId) {
            case 'TR':
            case 'J':
                this.title = format(this.gridTimeDomain[0], 'dd MMMM yyyy', localeOption);
                break;
            case 'M':
                this.title = format(this.gridTimeDomain[0], 'MMMM yyyy', localeOption).toLocaleUpperCase();
                break;
            case 'Y':
                this.title = format(this.gridTimeDomain[0], 'yyyy', localeOption).toLocaleUpperCase();
                break;
            case '7D':
            case 'W':
                this.title =
                    format(this.gridTimeDomain[0], 'dd/MM/yyyy', localeOption).toLocaleUpperCase() +
                    ' - ' +
                    format(this.gridTimeDomain[1], 'dd/MM/yyyy', localeOption);
                break;
            default:
        }
    }

    public getTitle(): string {
        return this.title;
    }

    public getTimeGridDomain(): Array<any> {
        return this.gridTimeDomain;
    }

    public checkInsideDomain(date): boolean {
        const domain = this.gridTimeDomain;
        return date >= domain[0] && date <= domain[1];
    }

    public getDayRectangles(): Array<any> {
        return this.xAxis.getDayRectangles();
    }

    public getXTicks(): Array<any> {
        return this.xAxis.getTicks();
    }

    public getXTickLabel = (value): string => {
        return this.xAxis.getTickLabel(value);
    };

    public destroy() {
        this.ngUnsubscribe$.next();
        this.ngUnsubscribe$.complete();
    }
}
