/* Copyright (c) 2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import {Component, OnInit, Output, ViewChild} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {AuthenticationService} from '@ofServices/authentication/authentication.service';
import {CardService} from '@ofServices/card.service';
import {ConfigService} from '@ofServices/config.service';
import {EntitiesService} from '@ofServices/entities.service';
import {GroupsService} from '@ofServices/groups.service';
import {I18nService} from '@ofServices/i18n.service';
import {LogOption, OpfabLoggerService} from '@ofServices/logs/opfab-logger.service';
import {ProcessesService} from '@ofServices/processes.service';
import {ReminderService} from '@ofServices/reminder/reminder.service';
import {UserService} from '@ofServices/user.service';
import {AppState} from '@ofStore/index';
import {LoadConfigSuccessAction} from '@ofStore/actions/config.actions';
import {selectIdentifier} from '@ofStore/selectors/authentication.selectors';
import {Utilities} from 'app/common/utilities';
import {catchError, Subject} from 'rxjs';
import {ActivityAreaChoiceAfterLoginComponent} from './activityarea-choice-after-login/activityarea-choice-after-login.component';
import {AccountAlreadyUsedComponent} from './account-already-used/account-already-used.component';
import {AppLoadedInAnotherTabComponent} from './app-loaded-in-another-tab/app-loaded-in-another-tab.component';

@Component({
    selector: 'of-application-loading',
    styleUrls: ['./application-loading.component.scss'],
    templateUrl: './application-loading.component.html'
})
export class ApplicationLoadingComponent implements OnInit {
    @Output() applicationLoadedDone: Subject<boolean> = new Subject();

    @ViewChild('activityAreaChoiceAfterLogin')
    activityAreaChoiceAfterLoginComponent: ActivityAreaChoiceAfterLoginComponent;
    @ViewChild('accountAlreadyUsed') accountAlreadyUsedComponent: AccountAlreadyUsedComponent;
    @ViewChild('appLoadedInAnotherTab') appLoadedInAnotherTabComponent: AppLoadedInAnotherTabComponent;

    public isDisconnected = false;
    public userLogin: string;
    public showLoginScreen = false;
    public loadingInProgress = true;
    public lastLoadingInProgress = new Date();
    public applicationLoaded = false;

    /**
     * NB: I18nService is injected to trigger its constructor at application startup
     */
    constructor(
        private store: Store<AppState>,
        private titleService: Title,
        private authenticationService: AuthenticationService,
        private configService: ConfigService,
        private translateService: TranslateService,
        private i18nService: I18nService,
        private cardService: CardService,
        private userService: UserService,
        private entitiesService: EntitiesService,
        private groupsService: GroupsService,
        private processesService: ProcessesService,
        private reminderService: ReminderService,
        private logger: OpfabLoggerService
    ) {}

    ngOnInit() {
        this.loadUIConfiguration();
    }

    private loadUIConfiguration() {
        this.configService.loadWebUIConfiguration().subscribe({
            //This configuration needs to be loaded first as it defines the authentication mode
            next: (config) => {
                console.log(new Date().toISOString(), `Configuration loaded (web-ui.json)`);
                this.store.dispatch(new LoadConfigSuccessAction({config: config}));
                this.setTitleInBrowser();
                this.loadTranslation(config);
            },
            error: catchError((err, caught) => {
                console.error('Impossible to load configuration file web-ui.json', err);
                return caught;
            })
        });
    }

    private setTitleInBrowser() {
        const title = this.configService.getConfigValue('title', 'OperatorFabric');
        this.titleService.setTitle(title);
    }

    private loadTranslation(config) {
        if (!!config.i18n.supported.locales) {
            this.i18nService.loadGlobalTranslations(config.i18n.supported.locales).subscribe(() => {
                this.logger.info(
                    'opfab translation loaded for locales: ' + this.translateService.getLangs(),
                    LogOption.LOCAL_AND_REMOTE
                );
                this.i18nService.loadTranslationForMenu();
                this.i18nService.setTranslationForMultiSelectUsedInTemplates();

                if (this.isUrlCheckActivated()) {
                    this.checkIfAppLoadedInAnotherTab();
                } else {
                    this.launchAuthenticationProcess();
                }
            });
        } else this.logger.error('No locales define (value i18.supported.locales not present in web-ui.json)');
    }

    private isUrlCheckActivated(): boolean {
        return this.configService.getConfigValue('checkIfUrlIsLocked', true);
    }

    private checkIfAppLoadedInAnotherTab(): void {
        this.setLoadingInProgress(false);
        this.appLoadedInAnotherTabComponent.execute();
        this.appLoadedInAnotherTabComponent.isFinishedWithoutError().subscribe(() => {
            this.launchAuthenticationProcess();
        });
        this.appLoadedInAnotherTabComponent.isFinishedWithErrors().subscribe(() => (this.isDisconnected = true));
    }

    private launchAuthenticationProcess(): void {
        this.setLoadingInProgress(true);
        this.logger.info(`Launch authentication process`);
        this.waitForEndOfAuthentication();
        this.authenticationService.initializeAuthentication();
        if (!this.authenticationService.isAuthModeCodeOrImplicitFlow() && !this.authenticationService.isAuthModeNone())
            this.waitForEmptyTokenInStorageToShowLoginForm();
    }

    // Hack : in password mode when the token is not anymore in the storage
    // it means we need to show the login form
    // To have a cleaner code , we need to refactor the code
    // regarding authentication
    private waitForEmptyTokenInStorageToShowLoginForm() {
        if (!window.localStorage.getItem('token')) {
            this.showLoginScreen = true;
            this.setLoadingInProgress(false);
        } else if (!this.applicationLoaded) setTimeout(() => this.waitForEmptyTokenInStorageToShowLoginForm(), 100);
    }

    private waitForEndOfAuthentication(): void {
        this.store.select(selectIdentifier).subscribe((identifier) => {
            if (identifier) {
                this.logger.info(`User ${identifier} logged`);
                this.showLoginScreen = false;
                this.userLogin = identifier;
                this.checkIfAccountIsAlreadyUsed();
            }
        });
    }

    private checkIfAccountIsAlreadyUsed(): void {
        this.setLoadingInProgress(false);
        this.accountAlreadyUsedComponent.execute();
        this.accountAlreadyUsedComponent.isFinishedWithoutError().subscribe(() => {
            this.setLoadingInProgress(true);
            this.loadAllConfigurations();
        });
    }

    private loadAllConfigurations(): void {
        const requestsToLaunch$ = [
            this.configService.loadCoreMenuConfigurations(),
            this.userService.loadUserWithPerimetersData(),
            this.entitiesService.loadAllEntitiesData(),
            this.groupsService.loadAllGroupsData(),
            this.processesService.loadAllProcesses(),
            this.processesService.loadProcessGroups(),
            this.processesService.loadMonitoringConfig()
        ];
        Utilities.subscribeAndWaitForAllObservablesToEmitAnEvent(requestsToLaunch$).subscribe({
            next: () => {
                this.setLoadingInProgress(false);
                this.chooseActivityArea();
            },
            error: catchError((err, caught) => {
                console.error('Error in application initialization', err);
                return caught;
            })
        });
    }

    private chooseActivityArea(): void {
        this.activityAreaChoiceAfterLoginComponent.execute();
        this.activityAreaChoiceAfterLoginComponent.isFinishedWithoutError().subscribe(() => this.openSubscription());
    }

    private openSubscription(): void {
        this.setLoadingInProgress(true);
        this.cardService.initCardSubscription();
        this.cardService.initSubscription.subscribe(() => {
            this.applicationLoadedDone.next(true);
            this.applicationLoadedDone.complete();
            this.setLoadingInProgress(false);
            this.applicationLoaded = true;
        });
        this.reminderService.startService(this.userLogin);
    }

    private setLoadingInProgress(loadingInProgress: boolean): void {
        if (loadingInProgress) {
            this.loadingInProgress = true;
            this.lastLoadingInProgress = new Date();
        } else this.loadingInProgress = false;
    }
    public isSpinnerVisible(): boolean {
        if (this.loadingInProgress) {
            return this.showSpinnerAfter500ms();
        }
        return false;
    }

    private showSpinnerAfter500ms(): boolean {
        if (new Date().valueOf() - this.lastLoadingInProgress.valueOf() > 500) return true;
        return false;
    }
}
