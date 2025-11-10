# Wrike Custom Connector for Power Automate

This document provides instructions on how to set up and use the custom connector for the Wrike API within Microsoft Power Automate. This connector acts as a wrapper around the Wrike REST API, allowing you to integrate Wrike's capabilities into your automated workflows. [5, 10]

## Introduction

Wrike is a powerful work management platform that helps teams organize, track, and collaborate on projects. This custom Power Automate connector enables you to interact with your Wrike account to perform actions such as creating tasks, retrieving project data, and more, directly from your Power Automate flows.

## Prerequisites

Before you begin, ensure you have the following:

*   A Wrike account (a free trial or a paid plan). [14]
*   A Microsoft Power Automate subscription. [8]
*   Permissions to create a custom connector in your Power Automate environment.
*   The files provided in this folder.

## Files in This Folder

This repository contains the necessary files to create the custom connector. [2]

1.  `apiDefinition.swagger.json`: This is the OpenAPI 2.0 (formerly Swagger) definition file that describes the Wrike API endpoints, operations, and data structures. [9, 11] Power Automate uses this file to generate the connector's interface.
2.  `script.csx`: A C# script file that can be used to add custom logic to transform API requests and responses. [3, 10] This is useful for handling complex data transformations that are not easily managed by standard Power Automate expressions.
3.  `icon.png`: The icon file that will be used to represent the custom connector in the Power Automate UI. [2]

## Setup and Installation

Follow these steps to create and configure the Wrike custom connector.

### Step 1: Create an API App in Wrike

To authenticate with the Wrike API, you need to create an API application in your Wrike account to get a `Client ID` and `Client Secret`.

1.  Log in to your Wrike account and navigate to the **Apps & Integrations** section. [14]
2.  Go to the Wrike Developers Portal and create a new app. [13]
3.  Give your application a name (e.g., "Power Automate Connector").
4.  You will need to provide a **Redirect URI** later. For now, you can use a placeholder like `https://global.consent.azure-apim.net/redirect`. You will update this later.
5.  Once the app is created, take note of the **Client ID** and **Client Secret**. You will need these in the next steps. [13, 14]

### Step 2: Create the Custom Connector in Power Automate

1.  Navigate to Power Automate.
2.  In the left-hand navigation pane, go to **Data > Custom Connectors**. [4]
3.  In the top-right corner, click **New custom connector** and select **Import an OpenAPI file**. [4]
4.  Enter a name for your connector, such as "Wrike Custom Connector".
5.  Click the **Import** button and upload the `apiDefinition.swagger.json` file from this folder.
6.  Click **Continue**.

### Step 3: Configure General Information

1.  On the **General** tab, you can upload the `icon.png` file by clicking the upload icon.
2.  Set the **Icon background color** to a color of your choice (e.g., Wrike's brand color).
3.  The **Scheme** should be `HTTPS`, and the **Host** should be pre-filled from the swagger file (e.g., `www.wrike.com`).
4.  Click **Security**.

### Step 4: Configure Security

1.  On the **Security** tab, select **OAuth 2.0** as the authentication type. [15]
2.  Under **OAuth 2.0**, configure the following settings:
    *   **Identity Provider**: `Generic Oauth 2`
    *   **Client id**: Paste the `Client ID` you obtained from your Wrike app.
    *   **Client secret**: Paste the `Client Secret` you obtained from your Wrike app.
    *   **Authorization URL**: `https://login.wrike.com/oauth2/authorize/v4`
    *   **Token URL**: `https://login.wrike.com/oauth2/token`
    *   **Refresh URL**: `https://login.wrike.com/oauth2/token`
    *   **Scope**: Leave this blank for now, or add scopes as needed based on the Wrike API documentation.
3.  After filling in these details, the **Redirect URL** will be generated. Copy this URL.
4.  Go back to your Wrike app configuration and update the **Redirect URI** with the URL you just copied.
5.  Click **Definition**.

### Step 5: Review the Definition

The **Definition** tab shows all the actions and triggers defined in the `apiDefinition.swagger.json` file. You can review them to ensure they are correctly configured. You can also add or modify actions here if needed.

### Step 6: (Optional) Add Custom Code

If your connector requires custom data transformations, you can use the `script.csx` file.

1.  Go to the **Code** tab. [3]
2.  If it's not already enabled, toggle the **Code Enabled** switch to on.
3.  Copy the contents of the `script.csx` file and paste them into the code editor.
4.  Click **Create connector**.

### Step 7: Test the Connector

1.  Go to the **Test** tab.
2.  Click **New connection**.
3.  A pop-up window will appear asking you to authorize the connector to access your Wrike account. Sign in and grant access.
4.  Once the connection is created, you can select an operation from the list, provide the required parameters, and click **Test operation** to verify that the connector is working correctly.

## How to Use the Connector

Once the custom connector is created and tested, you can use it in any of your Power Automate flows.

1.  Create a new flow or edit an existing one.
2.  Add a new step and search for your custom connector by the name you provided (e.g., "Wrike Custom Connector").
3.  You will see a list of actions defined in your connector. Select the action you want to use.
4.  If you haven't already, you will be prompted to create a connection by signing in to your Wrike account.
5.  Fill in the required parameters for the action and continue building your flow.

## Disclaimer

This is an unofficial connector for the Wrike API and is not supported by Wrike or Microsoft. Use it at your own risk. For any issues or questions, please refer to the Wrike API documentation or open an issue in this repository.