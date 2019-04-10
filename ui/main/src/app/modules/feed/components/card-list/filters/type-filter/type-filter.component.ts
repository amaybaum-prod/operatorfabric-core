/* Copyright (c) 2018, RTE (http://www.rte-france.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {Component, OnInit} from '@angular/core';
import {Observable, timer} from "rxjs";
import {Filter} from "@ofModel/feed-filter.model";
import {Store} from "@ngrx/store";
import {AppState} from "@ofStore/index";
import {buildFilterSelector} from "@ofSelectors/feed.selectors";
import {FormControl, FormGroup} from "@angular/forms";
import {TYPE_FILTER} from "@ofServices/filter.service";
import {debounce, distinctUntilChanged} from "rxjs/operators";
import {ApplyFilter} from "@ofActions/feed.actions";
import * as _ from 'lodash';


@Component({
    selector: 'of-type-filter',
    templateUrl: './type-filter.component.html',
    styleUrls: ['./type-filter.component.scss']
})
export class TypeFilterComponent implements OnInit {
    typeFilterForm: FormGroup;

    private filter$: Observable<Filter>;

    constructor(private store: Store<AppState>) {
        this.typeFilterForm = this.createFormGroup();
        this.typeFilterForm
            .valueChanges
            .pipe(
                distinctUntilChanged((formA, formB)=>{
                    return _.isEqual(formA,formB);
                }),
                debounce(() => timer(500)))
            .subscribe(form => store.dispatch(
                new ApplyFilter({
                    name: TYPE_FILTER,
                    active: !(form.alarm && form.action && form.question && form.notification),
                    status: form
                }))
            )
    }

    private createFormGroup() {
        return new FormGroup({
            alarm: new FormControl(),
            action: new FormControl(),
            question: new FormControl(),
            notification: new FormControl()
        },{updateOn: 'change'});
    }

    ngOnInit() {
        this.filter$ = this.store.select(buildFilterSelector(TYPE_FILTER));
        this.filter$.subscribe((next: Filter) => {
            if (next) {
                this.typeFilterForm.get('alarm').setValue(!next.active || next.status.alarm);
                this.typeFilterForm.get('action').setValue(!next.active || next.status.action);
                this.typeFilterForm.get('question').setValue(!next.active || next.status.question);
                this.typeFilterForm.get('notification').setValue(!next.active || next.status.notification);
            } else {
                this.typeFilterForm.get('alarm').setValue(true);
                this.typeFilterForm.get('action').setValue(true);
                this.typeFilterForm.get('question').setValue(true);
                this.typeFilterForm.get('notification').setValue(true);
            }
        })
    }


}
