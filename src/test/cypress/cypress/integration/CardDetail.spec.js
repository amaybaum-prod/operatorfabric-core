/* Copyright (c) 2021-2022, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

/* This test file focuses on some state-type specific behaviour in card details header. As the Cypress test suite grows,
it might make sense to merge it with other tests.
* */
describe('Card detail', function () {


    const process = "cypress";


    before('Set up configuration', function () {

        // This can stay in a `before` block rather than `beforeEach` as long as the test does not change configuration
        cy.resetUIConfigurationFiles();
        cy.loadTestConf();
        cy.deleteAllCards();
        cy.deleteAllArchivedCards();
        cy.sendCard('cypress/cardDetail/cardDetail.json');
       
    });

    describe('Check card detail', function () {

        it(`Check card detail`, function () {
            
            cy.loginOpFab('operator1_fr', 'test');

            // Click on the card
            cy.get('of-light-card').eq(0).click();

            // Check  user context values 
            cy.get("#userContext-login").contains(/^operator1_fr$/); // use ^ and $ to have a contains exactly 
            cy.get("#userContext-token").contains('eyJhb');
            cy.get("#userContext-firstName").contains(/^John$/);
            cy.get("#userContext-lastName").contains(/^Doe$/);
            cy.get("#userContext-groups").contains(/^ReadOnly,Dispatcher$/);
            cy.get("#userContext-entities").contains(/^ENTITY_FR,ENTITY1_FR$/);

            // Check templateGateway calls
            cy.get("#templateGateway-getEntityName").contains("Control Center FR North");
            cy.get("#templateGateway-getEntityName-unknownEntity").contains("unknownEntity");
            cy.get("#templateGateway-isUserAllowedToRespond").contains("true");
            cy.get("#templateGateway-isUserMemberOfAnEntityRequiredToRespond").contains("true");
            cy.get("#templateGateway-getEntityUsedForUserResponse").contains(/^ENTITY1_FR$/);
            cy.get("#templateGateway-getDisplayContext").contains(/^realtime$/);
            cy.get("#templateGateway-getAllEntities").contains("entity[0]:id=ENTITY1_FR,name=Control Center FR North,description=Control Center FR North,entityAllowedToSendCard=true,parents=ENTITY_FR,labels=FR1 label");
            cy.get("#templateGateway-getAllEntities").contains("entity[1]:id=ENTITY2_FR,name=Control Center FR South,description=Control Center FR South,entityAllowedToSendCard=true,parents=ENTITY_FR,labels=undefined");
            cy.get("#templateGateway-getAllEntities").contains("entity[2]:id=ENTITY3_FR,name=Control Center FR East,description=Control Center FR East,entityAllowedToSendCard=true,parents=ENTITY_FR,labels=undefined");
            cy.get("#templateGateway-getAllEntities").contains("entity[3]:id=ENTITY4_FR,name=Control Center FR West,description=Control Center FR West,entityAllowedToSendCard=true,parents=ENTITY_FR,labels=undefined");
            cy.get("#templateGateway-getAllEntities").contains("entity[4]:id=ENTITY_FR,name=French Control Centers,description=French Control Centers,entityAllowedToSendCard=false,parents=undefined,labels=undefined");
            cy.get("#templateGateway-getAllEntities").contains("entity[5]:id=IT_SUPERVISOR_ENTITY,name=IT SUPERVISION CENTER,description=IT SUPERVISION CENTER,entityAllowedToSendCard=true,parents=undefined,labels=undefined");
            cy.get("#templateGateway-getEntity-ENTITY1_FR").contains(/^ENTITY1_FR,Control Center FR North,Control Center FR North,true,ENTITY_FR,FR1 label$/);
            cy.get("#screenSize").contains("md");
            cy.get("#templateGateway-onTemplateRenderingComplete").contains("ok");

            // see card in full screen 
            cy.get("#opfab-card-detail-fullscreen-button").click();
            cy.get("#screenSize").contains("lg");
            // go back in standard screen
            cy.get("#opfab-card-detail-fullscreen-button").click();
            cy.get("#screenSize").contains("md");


            // handlebars templating 
            cy.get("#handlebars-simpleData").contains(/^test$/);
            cy.get("#handlebars-if").contains(/^ok$/);
            cy.get("#handlebars-each").contains(/^123$/);

            // Check card detail footer contains card reception date and time and not contains 'Addressed to' (because operator1_fr is member of only one entity)
            cy.get('.opfab-card-received-footer').contains(/Received : \d{2}\/\d{2}\/\d{4} at ((1[0-2]|0?[1-9]):([0-5][0-9]) ([AP]M))/);
            cy.get('.opfab-card-received-footer').contains('Addressed to :').should('not.exist');
        });

        it(`Check card footer for operator4_fr (member of several entities)`, function () {

            cy.loginOpFab('operator4_fr', 'test');

            // Click on the card
            cy.get('of-light-card').eq(0).click();

            // Check card detail footer contains card reception date and time and contains 'Addressed to' with user entities to which the card was sent
            cy.get('.opfab-card-received-footer').contains(/Received : \d{2}\/\d{2}\/\d{4} at ((1[0-2]|0?[1-9]):([0-5][0-9]) ([AP]M))/);
            cy.get('.opfab-card-received-footer').contains('Addressed to : Control Center FR South, Control Center FR North');
        });

        it(`Check card detail spinner when simulating card processed `, function () {
            cy.loginOpFab('operator1_fr', 'test');

            // Click on the card
            cy.get('of-light-card').eq(0).click();
            
            cy.get("#templateGateway-display-spinner-button").click();
            cy.checkLoadingSpinnerIsDisplayed();

            cy.checkLoadingSpinnerIsNotDisplayed();

        });

        it(`Check card detail in archives`, function () {
            
            cy.loginOpFab('operator1_fr', 'test');

            // We move to archives screen
            cy.get('#opfab-navbar-menu-archives').click();

            // We click the search button
            cy.get('#opfab-archives-logging-btn-search').click();

            // Click on the card
            cy.waitDefaultTime();
            cy.get('#opfab-archives-cards-list').find('.opfab-archive-sev-information').first().click();

            // Check the spinner appears when clicking on the button
            cy.get("#templateGateway-display-spinner-button").click();
            cy.checkLoadingSpinnerIsDisplayed();
            cy.checkLoadingSpinnerIsNotDisplayed();
         

            // Check  user context values 
            cy.get("#userContext-login").contains(/^operator1_fr$/); // use ^ and $ to have a contains exactly 
            cy.get("#userContext-token").contains('eyJhb');
            cy.get("#userContext-firstName").contains(/^John$/);
            cy.get("#userContext-lastName").contains(/^Doe$/);
            cy.get("#userContext-groups").contains(/^ReadOnly,Dispatcher$/);
            cy.get("#userContext-entities").contains(/^ENTITY_FR,ENTITY1_FR$/);

            // Check templateGateway calls
            cy.get("#templateGateway-getEntityName").contains("Control Center FR North");
            cy.get("#templateGateway-getEntityName-unknownEntity").contains("unknownEntity");

            // in archives is isUserAllowedToRespond always return false 
            cy.get("#templateGateway-isUserAllowedToRespond").contains("false");
           
            cy.get("#templateGateway-isUserMemberOfAnEntityRequiredToRespond").contains("true");
            cy.get("#templateGateway-getDisplayContext").contains(/^archive$/);
            cy.get("#screenSize").contains("lg");
            cy.get("#templateGateway-onTemplateRenderingComplete").contains("ok");

            // handlebars templating 
            cy.get("#handlebars-simpleData").contains(/^test$/);
            cy.get("#handlebars-if").contains(/^ok$/);
            cy.get("#handlebars-each").contains(/^123$/);

            // Check card detail footer contains card reception date and time and not contains 'Addressed to'
            cy.get('.opfab-card-received-footer').contains(/Received : \d{2}\/\d{2}\/\d{4} at ((1[0-2]|0?[1-9]):([0-5][0-9]) ([AP]M))/);
            cy.get('.opfab-card-received-footer').contains('Addressed to :').should('not.exist');

        });

        it(`Check card detail footer for archives for operator4_fr (member of several entities)`, function () {

            cy.loginOpFab('operator4_fr', 'test');

            // We move to archives screen
            cy.get('#opfab-navbar-menu-archives').click();

            // We click the search button
            cy.get('#opfab-archives-logging-btn-search').click();

            // Click on the card
            cy.waitDefaultTime();
            cy.get('#opfab-archives-cards-list').find('.opfab-archive-sev-information').first().click();

            // Check the spinner appears when clicking on the button
            cy.get("#templateGateway-display-spinner-button").click();
            cy.checkLoadingSpinnerIsDisplayed();
            cy.checkLoadingSpinnerIsNotDisplayed();

            // Check card detail footer contains card reception date and time and not contains 'Addressed to'
            cy.get('.opfab-card-received-footer').contains(/Received : \d{2}\/\d{2}\/\d{4} at ((1[0-2]|0?[1-9]):([0-5][0-9]) ([AP]M))/);
            cy.get('.opfab-card-received-footer').contains('Addressed to :').should('not.exist');
        });

        it(`Check card detail where response not required `, function () {
            cy.sendCard('cypress/cardDetail/cardDetailResponseNotRequired.json');
            cy.loginOpFab('operator1_fr', 'test');

            // Click on the card
            cy.get('of-light-card').eq(0).click();

            cy.get("#templateGateway-isUserAllowedToRespond").contains("true");
            cy.get("#templateGateway-isUserMemberOfAnEntityRequiredToRespond").contains("false");

        });

        it(`Check card detail where response is not possible `, function () {
            cy.sendCard('cypress/cardDetail/cardDetailResponseNotPossible.json');
            cy.loginOpFab('operator1_fr', 'test');

            // Click on the card
            cy.get('of-light-card').eq(0).click();
            
            cy.get("#templateGateway-isUserAllowedToRespond").contains("false");
            cy.get("#templateGateway-isUserMemberOfAnEntityRequiredToRespond").contains("false");

        });


    it(`Check that a spinner is displayed when the card takes time to load `, function () {
        cy.sendCard('cypress/cardDetail/cardDetailResponseNotPossible.json');
        cy.delayRequestResponse('/cards/cards/**')
        cy.loginOpFab('operator1_fr', 'test');

        // Click on the card
        cy.get('of-light-card').eq(0).click();
        
        cy.checkLoadingSpinnerIsDisplayed();
        cy.checkLoadingSpinnerIsNotDisplayed();

    });


    });

})
