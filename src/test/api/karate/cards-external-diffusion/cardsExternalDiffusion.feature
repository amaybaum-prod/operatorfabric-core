Feature: Cards external diffusion


  Background:

    * def signIn = callonce read('../common/getToken.feature') { username: 'operator1_fr'}
    * def authTokenAsTSO = signIn.authToken
    * def signInAdmin = callonce read('../common/getToken.feature') { username: 'admin'}
    * def authTokenAdmin = signInAdmin.authToken

  Scenario: Post card

    * def card =
"""
{
	"publisher" : "operator1_fr",
	"processVersion" : "1",
	"process"  :"api_test",
	"processInstanceId" : "process1",
	"state": "mailState",
	"groupRecipients": ["Dispatcher"],
	"severity" : "INFORMATION",
	"startDate" : 1553186770681,
	"summary" : {"key" : "defaultProcess.summary"},
	"title" : {"key" : "defaultProcess.title"},
	"data" : {"message":"a message"}
}
"""

    * def perimeter =
"""
{
  "id" : "perimeter",
  "process" : "api_test",
  "stateRights" : [
      {
        "state" : "mailState",
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

* def userSettings =
"""
{
  "login" : "operator1_fr",
  "sendCardsByEmail": true,
  "email" : "operator1_fr@opfab.com",
  "processesStatesNotifiedByEmail": {"api_test": ["mailState"]}
}
"""


#Create new perimeter
    Given url opfabUrl + 'users/perimeters'
    And header Authorization = 'Bearer ' + authTokenAdmin
    And request perimeter
    When method post
    Then status 201

#Attach perimeter to group
    Given url opfabUrl + 'users/groups/ReadOnly/perimeters'
    And header Authorization = 'Bearer ' + authTokenAdmin
    And request perimeterArray
    When method patch
    Then status 200



    Given url opfabUrl + 'users/users/operator1_fr/settings'
    And header Authorization = 'Bearer ' + authTokenAsTSO
    And request userSettings
    When method put
    Then status 200


# Push card
    Given url opfabPublishCardUrl + 'cards'
	And header Authorization = 'Bearer ' + authTokenAsTSO
    And request card
    When method post
    Then status 201
    And match response == {"id":'#notnull', uid: '#notnull'}


Scenario: healthcheck API 

    # Call healthcheck API without authentication
    Given url 'http://localhost:2106/healthcheck'
    When method get
    Then status 200

Scenario: Start/Stop/Status API 

    # Call API as non admin user should fail
    Given url 'http://localhost:2106/status'
	And header Authorization = 'Bearer ' + authTokenAsTSO
    When method get
    Then status 403

    Given url 'http://localhost:2106/stop'
	And header Authorization = 'Bearer ' + authTokenAsTSO
    When method get
    Then status 403

    Given url 'http://localhost:2106/start'
	And header Authorization = 'Bearer ' + authTokenAsTSO
    When method get
    Then status 403

    # Call API as admin user
    Given url 'http://localhost:2106/status'
	And header Authorization = 'Bearer ' + authTokenAdmin
    When method get
    Then status 200
    And match karate.toString(response) == 'true'

    Given url 'http://localhost:2106/stop'
    And header Authorization = 'Bearer ' + authTokenAdmin
    When method get
    Then status 200
    And  match karate.toString(response) == 'Stop service'

    Given url 'http://localhost:2106/status'
	And header Authorization = 'Bearer ' + authTokenAdmin
    When method get
    Then status 200
    And match karate.toString(response) ==  'false'

    # Call API as admin user
    Given url 'http://localhost:2106/start'
    And header Authorization = 'Bearer ' + authTokenAdmin
    When method get
    Then status 200
    And match karate.toString(response) ==  'Start service'

    Given url 'http://localhost:2106/status'
	And header Authorization = 'Bearer ' + authTokenAdmin
    When method get
    Then status 200
    And  match karate.toString(response) ==  'true'

  Scenario: Check mail is sent

    * def updateConfig =
    """
    {
        "checkPeriodInSeconds" : 5, 
        "secondsAfterPublicationToConsiderCardAsNotRead": 1
    }
    """

    # Post configuration change with non admin user should fail
    Given url 'http://localhost:2106/config'
	And header Authorization = 'Bearer ' + authTokenAsTSO
    And request updateConfig
    When method post
    Then status 403

    # Post configuration change with  admin user
    Given url 'http://localhost:2106/config'
	And header Authorization = 'Bearer ' + authTokenAdmin
    And request updateConfig
    When method post
    Then status 200

    


* configure retry = { count: 15, interval: 1000 }
    Given url 'http://localhost:8025/api/v2/messages'
	And header Authorization = 'Bearer ' + authTokenAsTSO
    And retry until responseStatus == 200  && response.count == 1
    When method get
    Then status 200
    And match response.items[0].To[0].Mailbox == 'operator1_fr'
    And match response.items[0].To[0].Domain == 'opfab.com'
    And match response.items[0].Content.Headers.Subject[0].indexOf('Opfab card received  - card Title - card summary') == 0
    And match response.items[0].Content.Body contains 'A MESSAGE'
    And match response.items[0].Content.Body contains '/api_test.process1'



Scenario: Restore

    * def defaultConfig =
    """
    {
        "checkPeriodInSeconds" : 30, 
        "secondsAfterPublicationToConsiderCardAsNotRead": 120
    }
    """
# restore default configuration
Given url 'http://localhost:2106/config'
And header Authorization = 'Bearer ' + authTokenAdmin
And request defaultConfig
When method post
Then status 200

# delete perimeter created previously
  Given url opfabUrl + 'users/perimeters/perimeter'
  And header Authorization = 'Bearer ' + authTokenAdmin
  When method delete
  Then status 200

