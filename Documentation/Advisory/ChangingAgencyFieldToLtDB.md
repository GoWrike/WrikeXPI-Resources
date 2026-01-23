# Changing Agency* from Dropdown list to Linked to Database field

## Background

Wrike introduced Datahub feature, which enables us to create database table with records.

This feature essentially make it possible to maintain Master Data with in Wrike natively.

Prior to this, Master Data is only being maintained as names in Dropdown list of a custom field.

Agency* CF is one of such example.

![Agency* Custom Field](AgencyCFDefinition.png)

This is a perfect candidate to be enhanced to make use of Datahub.

Example of Agency with Linked to Database Custom Field.

![Agency* LtDB Custom Field](AgencyLtDBCFDefinition.png)

The Linked Database looks like this:

![Datahub Database](DatahubDatabase.png)

The User experience is the same (or very little difference) from end user point of view.

![Sample for LtDB CF Field](SampleLtDBCFField.png)

## Impacted Changes

### User Experience

#### Dropdown List

![UX for Dropdown List on CF](UXforDropdownlist.png)

#### Linked to Database

![UX for Linked to Database](UXforLtDB.png)

### API integration

#### Read Operation

https://app-eu.wrike.com/api/v4/tasks/MAAAAAEDmqEl

Response Snippet (CF)

``` json
{
    "kind": "tasks",
    "data": [
        {
            "id": "MAAAAAEDmqEl",
            "accountId": "IEAC7PRT",
            "title": "Sample Task with LtDB CF Field",
            "customFields": [
                {
                    "id": "IEAC7PRTJUAB43DB",
                    "value": "EssenceMediacom"
                },
                {
                    "id": "IEAC7PRTJUAKMO4U",
                    "value": "[\"RE281474983375797\"]"
                }
            ]
        }
    ]
}
```

#### Read Operation (Transition option), lookupAsSelect option

https://app-eu.wrike.com/api/v4/tasks/MAAAAAEDmqEl?lookupAsSelect

Response Snippet (CF)

``` json
{
    "kind": "tasks",
    "data": [
        {
            "id": "MAAAAAEDmqEl",
            "accountId": "IEAC7PRT",
            "title": "Sample Task with LtDB CF Field",
            "description": "",
            "briefDescription": "",
            "parentIds": [
                "MQAAAAEDmqD3"
            ],
            "customFields": [
                {
                    "id": "IEAC7PRTJUAB43DB",
                    "value": "EssenceMediacom"
                },
                {
                    "id": "IEAC7PRTJUAKMO4U",
                    "value": "EssenceMediacom"
                }
            ]
        }
    ]
}
```

#### Write/Update Operation, existing Dropdown List CF

https://app-eu.wrike.com/api/v4/tasks/MAAAAAEDmqEl?customFields=[{"id":"IEAC7PRTJUAB43DB","value":"Eightbar"}]

#### Write/Update Operation, future Linked to Database CF

https://app-eu.wrike.com/api/v4/tasks/MAAAAAEDmqEl?customFields=[{"id":"IEAC7PRTJUAKMO4U","value":"[\"RE281474983375798\"]"}]

Note that the update to the CF requires the Record Id of the corresponding Database record.

To know find out the Record Id, there are a few steps to it:

Get the Database Id from the Custom Field definition

Using the Custom Field Id "IEAC7PRTJUAKMO4U", get the Database Id via:

https://app-eu.wrike.com/api/v4/customfields/IEAC7PRTJUAKMO4U

Response Snippet

``` json
{
    "kind": "customfields",
    "data": [
        {
            "id": "IEAC7PRTJUAKMO4U",
            "accountId": "IEAC7PRT",
            "title": "Agency* LtDB",
            "type": "LinkToDatabase",
            "spaceId": "IEAC7PRTI5HB2NPK",
            "sharedIds": [],
            "sharing": {},
            "settings": {
                "inheritanceType": "All",
                "applicableEntityTypes": [
                    "WorkItem"
                ],
                "readOnly": false,
                "allowTime": false,
                "linkToDatabaseInfo": {
                    "dataHubDatabaseId": "DB281474977096236",
                    "allowMultipleEntries": false,
                    "mirrorFields": [
                        {
                            "dataHubFieldId": "FI281474976815763",
                            "customFieldId": "IEAC7PRTJUAKMO5G"
                        }
                    ]
                }
            },
            "description": ""
        }
    ]
}
```

The dataHubDatabaseId is the Id of the Database.

Get the Record Id using Database Id via Datahub API

https://app-eu.wrike.com/app/wrike_v2_web/public/api/v1/databases/DB281474977096236/records

Response Snippet

``` json
{
    "data": [
        {
            "id": "RE281474983375797",
            "title": "EssenceMediacom",
            "deleted": false,
            "fieldValues": {
                "FIid": "RE281474983375797",
                "FIname": "EssenceMediacom",
                "FIcreatedOn": "2026-01-22T16:29:14.561Z",
                "FIupdatedOn": "2026-01-22T16:49:32.824Z",
                "FIisRecycled": false,
                "FI281474976815763": "Sample data 2"
            }
        },
        {
            "id": "RE281474983375798",
            "title": "Eightbar",
            "deleted": false,
            "fieldValues": {
                "FIid": "RE281474983375798",
                "FIname": "Eightbar",
                "FIcreatedOn": "2026-01-22T16:29:19.864Z",
                "FIupdatedOn": "2026-01-22T16:49:25.235Z",
                "FIisRecycled": false,
                "FI281474976815763": "Just sample data"
            }
        }
    ],
    "total": 3
}
```

The Record Id for Eightbar is "RE281474983375798".


