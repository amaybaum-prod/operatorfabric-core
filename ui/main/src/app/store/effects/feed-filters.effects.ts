/* Copyright (c) 2018, RTE (http://www.rte-france.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Observable} from 'rxjs';
import {filter, map, tap, withLatestFrom} from 'rxjs/operators';
import {AuthenticationActionTypes} from '@ofActions/authentication.actions';
import {Action, Store} from "@ngrx/store";
import {AppState} from "@ofStore/index";
import {FilterService, FilterType} from "@ofServices/filter.service";
import {ApplyFilter, InitFilters} from "@ofActions/feed.actions";
import {LoadSettingsSuccess, SettingsActionTypes} from "@ofActions/settings.actions";
import {buildConfigSelector} from "@ofSelectors/config.selectors";

@Injectable()
export class FeedFiltersEffects {

    /* istanbul ignore next */
    constructor(private store: Store<AppState>,
                private actions$: Actions,
                private service: FilterService) {
    }

    @Effect()
    loadFeedFilterOnAuthenticationSuccess: Observable<Action> = this.actions$
        .pipe(
            // loads card operations only after authentication of a default user ok.
            tap(v=>console.log("loadFeedFilterOnAuthenticationSuccess: action start", v)),
            ofType(AuthenticationActionTypes.AcceptLogIn),
            map((action) => {
                return new InitFilters({filters:this.service.defaultFilters()});
            }));

    @Effect()
    initTagFilterOnLoadedSettings: Observable<Action> = this.actions$
        .pipe(
            tap(v=>console.log("initTagFilterOnLoadedSettings: action start", v)),
            ofType<LoadSettingsSuccess>(SettingsActionTypes.LoadSettingsSuccess),
            withLatestFrom(this.store.select(buildConfigSelector('settings.defaultTags'))),
            tap(v=>console.log("initTagFilterOnLoadedSettings: latest config", v)),
            map(([action,configTags])=>{
                if(action.payload.settings.defaultTags && action.payload.settings.defaultTags.length>0)
                    return action.payload.settings.defaultTags;
                else if (configTags && configTags.length > 0)
                    return configTags;
                return null;
            }),
            tap(v=>console.log("initTagFilterOnLoadedSettings: mapped tag array", v)),
            filter(v=>!!v),
            tap(v=>console.log("initTagFilterOnLoadedSettings: filtered empty array", v)),
            map(v=>new ApplyFilter({name:FilterType.TAG_FILTER,active:true,status:{tags:v}})),
            // tap(v=>console.log("initTagFilterOnLoadedSettings: mapped action", v))
        );
}
