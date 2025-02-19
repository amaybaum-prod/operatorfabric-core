Feature: postCardWithRRuleRecurrence

  Background:

    * def signIn = callonce read('../common/getToken.feature') { username: 'operator1_fr'}
    * def authToken = signIn.authToken
    * def signInAdmin = callonce read('../common/getToken.feature') { username: 'admin'}
    * def authTokenAdmin = signInAdmin.authToken
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

  Scenario: postCardWithRRuleRecurrence

    * def cardWithRRuleObject =
"""
{
	"publisher" : "operator1_fr",
	"processVersion" : "1",
	"process"  :"api_test",
	"processInstanceId" : "process_cardWithRRuleObject",
	"state": "messageState",
	"groupRecipients": ["Dispatcher"],
	"severity" : "ALARM",
	"startDate" : 1583943924000,
	"endDate" : 1584943924000,
	"summary" : {"key" : "defaultProcess.summary"},
	"title" : {"key" : "defaultProcess.title"},
	"data" : {"message" : "a message with RRule recurrence object"},
	"rRule": {
		"freq" : "WEEKLY",
		"count" : 10,
		"byweekday" : ["TU", "FR"],
		"byminute" : [10, 30],
		"byhour" : [14, 16],
		"bymonth" : [1, 12],
        "durationInMinutes" : 120
    }
}
"""


    * def cardWithRRuleObjectAndTimezone =
"""
{
	"publisher" : "operator1_fr",
	"processVersion" : "1",
	"process"  :"api_test",
	"processInstanceId" : "process_cardWithRRuleObjectAndTimezone",
	"state": "messageState",
	"groupRecipients": ["Dispatcher"],
	"severity" : "ALARM",
	"startDate" : 1583943924000,
	"endDate" : 1584943924000,
	"summary" : {"key" : "defaultProcess.summary"},
	"title" : {"key" : "defaultProcess.title"},
	"data" : {"message" : "a message with RRule recurrence object and timezone field"},
	"rRule": {
		"freq" : "WEEKLY",
		"count" : 10,
		"interval" : 2,
		"byweekday" : ["TU", "FR"],
		"byminute" : [10, 30],
		"byhour" : [14, 16],
		"bymonth" : [1, 12],
		"tzid" : "Europe/London",
        "durationInMinutes" : 90
    }
}
"""


      * def cardWithRRuleObjectButDurationInMinutesNegative =
"""
{
	"publisher" : "operator1_fr",
	"processVersion" : "1",
	"process"  :"api_test",
	"processInstanceId" : "process_cardWithRRuleObject",
	"state": "messageState",
	"groupRecipients": ["Dispatcher"],
	"severity" : "ALARM",
	"startDate" : 1583943924000,
	"endDate" : 1584943924000,
	"summary" : {"key" : "defaultProcess.summary"},
	"title" : {"key" : "defaultProcess.title"},
	"data" : {"message" : "a message with RRule recurrence object"},
	"rRule": {
		"freq" : "WEEKLY",
		"count" : 10,
		"byweekday" : ["TU", "FR"],
		"byminute" : [10, 30],
		"byhour" : [14, 16],
		"bymonth" : [1, 12],
        "durationInMinutes" : -120
    }
}
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
    And request cardWithRRuleObject
    When method post
    Then status 201

#get card with user operator1_fr
    Given url opfabUrl + 'cards-consultation/cards/api_test.process_cardWithRRuleObject'
    And header Authorization = 'Bearer ' + authToken
    When method get
    Then status 200
    And match response.card.data.message == 'a message with RRule recurrence object'
    And match response.card.rRule.freq == 'WEEKLY'
    And match response.card.rRule.count == 10
    And match response.card.rRule.interval == 1
    And match response.card.rRule.wkst == 'MO'
    And match response.card.rRule.byweekday[0] == 'TU'
    And match response.card.rRule.byweekday[1] == 'FR'
    And match response.card.rRule.bymonth[0] == 1
    And match response.card.rRule.bymonth[1] == 12
    And match response.card.rRule.byhour[0] == 14
    And match response.card.rRule.byhour[1] == 16
    And match response.card.rRule.byminute[0] == 10
    And match response.card.rRule.byminute[1] == 30
    And match response.card.rRule.tzid == 'Europe/Paris'
    And match response.card.rRule.durationInMinutes == 120
    And def cardUid = response.card.uid


#get card form archives with user operator1_fr

    Given url opfabUrl + 'cards-consultation/archives/' + cardUid
    And header Authorization = 'Bearer ' + authToken
    When method get
    Then status 200
    And match response.card.data.message == 'a message with RRule recurrence object'
    And match response.card.rRule.freq == 'WEEKLY'
    And match response.card.rRule.count == 10
    And match response.card.rRule.interval == 1
    And match response.card.rRule.wkst == 'MO'
    And match response.card.rRule.byweekday[0] == 'TU'
    And match response.card.rRule.byweekday[1] == 'FR'
    And match response.card.rRule.bymonth[0] == 1
    And match response.card.rRule.bymonth[1] == 12
    And match response.card.rRule.byhour[0] == 14
    And match response.card.rRule.byhour[1] == 16
    And match response.card.rRule.byminute[0] == 10
    And match response.card.rRule.byminute[1] == 30
    And match response.card.rRule.tzid == 'Europe/Paris'
    And match response.card.rRule.durationInMinutes == 120
    And def cardUid = response.card.uid

# Push card
    Given url opfabPublishCardUrl + 'cards'
    And header Authorization = 'Bearer ' + authToken
    And request cardWithRRuleObjectAndTimezone
    When method post
    Then status 201
    And def cardUid = response.uid


#get card with user operator1_fr
    Given url opfabUrl + 'cards-consultation/cards/api_test.process_cardWithRRuleObjectAndTimezone'
    And header Authorization = 'Bearer ' + authToken
    When method get
    Then status 200
    And match response.card.data.message == 'a message with RRule recurrence object and timezone field'
    And match response.card.rRule.freq == 'WEEKLY'
    And match response.card.rRule.count == 10
    And match response.card.rRule.interval == 2
    And match response.card.rRule.wkst == 'MO'
    And match response.card.rRule.byweekday[0] == 'TU'
    And match response.card.rRule.byweekday[1] == 'FR'
    And match response.card.rRule.bymonth[0] == 1
    And match response.card.rRule.bymonth[1] == 12
    And match response.card.rRule.byhour[0] == 14
    And match response.card.rRule.byhour[1] == 16
    And match response.card.rRule.byminute[0] == 10
    And match response.card.rRule.byminute[1] == 30
    And match response.card.rRule.tzid == 'Europe/London'
    And match response.card.rRule.durationInMinutes == 90
    And def cardUid = response.card.uid

#get card form archives with user operator1_fr

    Given url opfabUrl + 'cards-consultation/archives/' + cardUid
    And header Authorization = 'Bearer ' + authToken
    When method get
    Then status 200
    And match response.card.data.message == 'a message with RRule recurrence object and timezone field'
    And match response.card.rRule.freq == 'WEEKLY'
    And match response.card.rRule.count == 10
    And match response.card.rRule.interval == 2
    And match response.card.rRule.wkst == 'MO'
    And match response.card.rRule.byweekday[0] == 'TU'
    And match response.card.rRule.byweekday[1] == 'FR'
    And match response.card.rRule.bymonth[0] == 1
    And match response.card.rRule.bymonth[1] == 12
    And match response.card.rRule.byhour[0] == 14
    And match response.card.rRule.byhour[1] == 16
    And match response.card.rRule.byminute[0] == 10
    And match response.card.rRule.byminute[1] == 30
    And match response.card.rRule.tzid == 'Europe/London'
    And match response.card.rRule.durationInMinutes == 90
    And def cardUid = response.card.uid

# Push card to test BAD REQUEST in case of durationInMinutes negative
    Given url opfabPublishCardUrl + 'cards'
    And header Authorization = 'Bearer ' + authToken
    And request cardWithRRuleObjectButDurationInMinutesNegative
    When method post
    Then status 400
    And match response.message == 'Constraint violation in the request'
    And match response.errors[0] == 'constraint violation : RRule.durationInMinutes: must be greater than or equal to 0'

#delete perimeter created previously
    * callonce read('../common/deletePerimeter.feature') {perimeterId: '#(perimeter.id)', token: '#(authTokenAdmin)'}