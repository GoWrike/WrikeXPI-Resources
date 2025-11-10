# XPI OAuth Mechanism

---

## Table of Contents

- [Overview](#overview)
- [OAuth Flow Steps](#oauth-flow-steps)
  - [Step 1: App Initiates OAuth](#step-1-app-initiates-oauth)
  - [Step 2: Redirect to Wrike OAuth](#step-2-redirect-to-wrike-oauth)
  - [Step 3: XPI Token Service Callback](#step-3-xpi-token-service-callback)
  - [Step 4: App Exchanges Code for Token](#step-4-app-exchanges-code-for-token)
- [Parameters Reference](#parameters-reference)
- [Example Requests & Responses](#example-requests--responses)

---

## Overview

The XPI OAuth mechanism is similar to standard OAuth, with a few simplifications:

- Only `client_id` is required (no `client_secret` for now).

- The user experiences two redirects: first from Wrike to the XPI landing page, then to the app's callback URL.

---

## OAuth Flow Steps

### Step 1: App Initiates OAuth

The app redirects the user to the XPI OAuth page:

``` url
https://api.wrikexpi.groupm.com/?accountId=3128883&redirect_uri=https://gowrike.github.io/WrikeXPI-Resources/Samples/WrikeXPI-Campaign.html&client_id=123JJ2Z
```

| Parameter    | Remark                                              |
|:------------ |:---------------------------------------------------|
| accountId    | Id of the Wrike instance                           |
| redirect_uri | URL to redirect to after user authentication       |
| client_id    | App's client id                                    |

### Step 2: Redirect to Wrike OAuth

User is redirected to Wrike's OAuth page:

``` url
https://login.wrike.com/oauth2/authorize/v4?client_id=9B0xiXqV_eu&response_type=code&state=&redirect_uri=https://api.wrikexpi.groupm.com/api/v1/wrikexpi/token/callback&accountId=3128883
```

- XPI token service retrieves and stores Wrike tokens securely.
- An authorization code is generated and mapped to the client_id.

### Step 3: XPI Token Service Callback

User is redirected to the original `redirect_uri` with the authorization code:

``` url
https://gowrike.github.io/WrikeXPI-Resources/Samples/WrikeXPI-Campaign.html?code=1Jqehg333igk
```

- The code is used by the app to exchange for the actual token.

### Step 4: App Exchanges Code for Token

The app calls the XPI token endpoint:

``` bash
GET https://api.wrikexpi.groupm.com/[token-endpoint]
  client_id=<client_id>
  grant_type=authorization_code
  code=<authorization_code>
```

---

## Parameters Reference

| Parameter    | Description                                  |
|:------------ |:---------------------------------------------|
| client_id    | App's client id                              |
| grant_type   | Must be `authorization_code`                 |
| code         | Authorization code received in previous step |

---

## Example Requests & Responses

``` json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.....z-Hyxb_LJQpKnk",
        "credentials": {
            "username": "IEAC7PRT-username@wppmedia.com",
            "password": "|}UyoQD-S^CmwVoSwS#x}Lni6.6#>)ZRi=Km9$^aEg^)LSH}",
            "message": "IMPORTANT: Save these credentials. They will only be shown once."
        }
    }
}
```

---
