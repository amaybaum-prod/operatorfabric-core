Feature: CardsUserAcknowledgement


  Background:

    * def signIn = callonce read('../common/getToken.feature') { username: 'operator1_fr'}
    * def authToken = signIn.authToken
    * def signIn2 = callonce read('../common/getToken.feature') { username: 'operator2_fr'}
    * def authToken2 = signIn2.authToken
    * def signInAdmin = callonce read('../common/getToken.feature') { username: 'admin'}
    * def authTokenAdmin = signInAdmin.authToken
    * def signInAsREADONLY = callonce read('../common/getToken.feature') { username: 'operator1_crisisroom'}
    * def authTokenAsREADONLY = signInAsREADONLY.authToken
    * def perimeter =
"""
{
  "id" : "perimeter",
  "process" : "api_test",
  "stateRights" : [
      {
        "state" : "messageState",
        "right" : "ReceiveAndWrite"
      }
    ]
}
"""

    * def perimeterArray =
"""
[   "perimeter"
]
"""

Scenario: CardsUserAcknowledgement

    * def card =
"""
{
	"publisher" : "operator1_fr",
	"processVersion" : "1",
	"process"  :"api_test",
	"processInstanceId" : "process1",
	"state": "messageState",
    "groupRecipients": ["Maintainer"],
	"severity" : "INFORMATION",
	"startDate" : 1553186770681,
	"summary" : {"key" : "defaultProcess.summary"},
	"title" : {"key" : "defaultProcess.title"},
	"data" : {"message":"a message"}
}
"""

      * def entity1Array =
"""
[   "ENTITY1_FR"
]
"""

      * def entity1entity2Array =
"""
[   "ENTITY1_FR", "ENTITY2_FR"
]
"""

      * def entity2Array =
"""
[   "ENTITY2_FR"
]
"""

#Create new perimeter
* callonce read('../common/createPerimeter.feature') {perimeter: '#(perimeter)', token: '#(authTokenAdmin)'}

#Attach perimeter to group
    Given url opfabUrl + 'users/groups/Maintainer/perimeters'
    And header Authorization = 'Bearer ' + authTokenAdmin
    And request perimeterArray
    When method patch
    Then status 200


# Push card
    Given url opfabPublishCardUrl + 'cards'
    And header Authorization = 'Bearer ' + authToken
    And request card
    When method post
    Then status 201

#get card with user operator1_fr and check not containing userAcks items
    Given url opfabUrl + 'cards-consultation/cards/api_test.process1'
    And header Authorization = 'Bearer ' + authToken
    When method get
    Then status 200
    And match response.card.hasBeenAcknowledged == false
    And match response.card.entitiesAcks == '#notpresent'
    And def uid = response.card.uid

#make an acknowledgement to the card with operator1_fr with entities for which the user is not a member
    Given url opfabUrl + 'cards-publication/cards/userAcknowledgement/' + uid
    And header Authorization = 'Bearer ' + authToken
    And request entity1entity2Array
    When method post
    Then status 403

#make an entity acknowledgement to the card with READONLY operator1_crisisroom with allowed entities 
    Given url opfabUrl + 'cards-publication/cards/userAcknowledgement/' + uid
    And header Authorization = 'Bearer ' + authTokenAsREADONLY
    And request entity1Array
    When method post
    Then status 403


#make an acknowledgement to the card with operator1_fr
    Given url opfabUrl + 'cards-publication/cards/userAcknowledgement/' + uid
    And header Authorization = 'Bearer ' + authToken
    And request entity1Array
    When method post
    Then status 201

#get card with user operator1_fr and check containing his ack
    Given url opfabUrl + 'cards-consultation/cards/api_test.process1'
    And header Authorization = 'Bearer ' + authToken
    When method get
    Then status 200
    And match response.card.hasBeenAcknowledged == true
    And match response.card.entitiesAcks ==  ["ENTITY1_FR"]
    And match response.card.uid == uid

#get card with user operator2_fr and check containing no ack for him
    Given url opfabUrl + 'cards-consultation/cards/api_test.process1'
    And header Authorization = 'Bearer ' + authToken2
    When method get
    Then status 200
    And match response.card.hasBeenAcknowledged == false
    And match response.card.uid == uid


#make a second acknowledgement to the card with operator2_fr
    Given url opfabUrl + 'cards-publication/cards/userAcknowledgement/' + uid
    And header Authorization = 'Bearer ' + authToken2
    And request entity2Array
    When method post
    Then status 201

#get card with user operator1_fr and check containing his ack
    Given url opfabUrl + 'cards-consultation/cards/api_test.process1'
    And header Authorization = 'Bearer ' + authToken
    When method get
    Then status 200
    And match response.card.hasBeenAcknowledged == true
    And match response.card.entitiesAcks ==  ["ENTITY1_FR","ENTITY2_FR"]
    And match response.card.uid == uid

#get card with user operator2_fr and check containing his ack
    Given url opfabUrl + 'cards-consultation/cards/api_test.process1'
    And header Authorization = 'Bearer ' + authToken2
    When method get
    Then status 200
    And match response.card.hasBeenAcknowledged == true
    And match response.card.entitiesAcks ==  ["ENTITY1_FR","ENTITY2_FR"]
    And match response.card.uid == uid



    Given url opfabUrl + 'cards-publication/cards/userAcknowledgement/unexisting_card_uid'
    And header Authorization = 'Bearer ' + authToken
    And request entity1Array
    When method post
    Then status 404

#cancel acknowledgement to the card with operator1_fr with entities for which the user is not a member
    Given url opfabUrl + 'cards-publication/cards/cancelUserAcknowledgement/' + uid
    And header Authorization = 'Bearer ' + authToken
    And request entity1entity2Array
    When method post
    Then status 403

    Given url opfabUrl + 'cards-publication/cards/cancelUserAcknowledgement/' + uid
    And header Authorization = 'Bearer ' + authToken
    And request entity1Array
    When method post
    Then status 200

    Given url opfabUrl + 'cards-consultation/cards/api_test.process1'
    And header Authorization = 'Bearer ' + authToken
    When method get
    Then status 200
    # card is unacknowledged also at the entity level
    And match response.card.entitiesAcks ==  ["ENTITY2_FR"]
    And match response.card.hasBeenAcknowledged == false
    And match response.card.uid == uid

    # Unacknowledge a card that is not acknowledged
    Given url opfabUrl + 'cards-publication/cards/cancelUserAcknowledgement/' + uid
    And header Authorization = 'Bearer ' + authToken
    And request entity1Array
    When method post
    Then status 200

    # Unacknowledge an unexisting card 
    Given url opfabUrl + 'cards-publication/cards/cancelUserAcknowledgement/unexisting_card____uid'
    And header Authorization = 'Bearer ' + authToken
    And request entity1Array
    When method post
    Then status 404
    
  Scenario: Delete the test card

    delete card
    Given url opfabPublishCardUrl + 'cards/api_test.process1'
    And header Authorization = 'Bearer ' + authToken
    When method delete
    Then status 200

  #delete perimeter created previously
    * callonce read('../common/deletePerimeter.feature') {perimeterId: '#(perimeter.id)', token: '#(authTokenAdmin)'}