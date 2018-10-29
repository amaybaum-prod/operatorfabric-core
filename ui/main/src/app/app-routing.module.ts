/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ArchivesComponent} from './components/archives/archives.component';
import {LightCardsComponent} from './components/light-cards/light-cards.component';

const routes: Routes = [
  {path: 'feed', component:
    // CardOperationsComponent
    LightCardsComponent
  },
  {path: 'archives', component: ArchivesComponent},
  {path: '**', redirectTo: '/feed'}
  ];
// TODO manage visible path more gently
export const navigationRoutes: Routes = routes.slice(0, 2);

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
