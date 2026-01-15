# WrikeXPI - <span style="color: red;">makes Wrike better!</span>

Please bookmark this page for easy access, as all the links and references in this site may be updated frequently.

[https://gowrike.github.io/WrikeXPI-Resources/](https://gowrike.github.io/WrikeXPI-Resources/)


## Overview

Wrike supports integration via API (Wrike Native API), which allows 3rd party application to make API calls to access and modify content in Wrike.

On top of that, WrikeXPI had been developed by WPP ET Wrike Team with the goal to complement Wrike's existing offering, level it up and make more integration possible. Here are a few key features:

> 1. Streamline API by translating IDs to readable attribute names. (e.g. Custom Field IDs)
> 2. Abtraction of business logic by modeling entities (e.g. Campaigns, Channels, Tasks)

The following section will provide more context and guidance for the usage of Wrike Native API and WrikeXPI.

> [Integration via API](#integration-via-api)
> [Integration via PowerAutomate](#integration-via-powerautomate)

The recommendation is to utilize WrikeXPI as much as possible if your use case fits within its supported usage, to make your integration more striaght forward and future proof from underlying Wrike product or business logic changes.

## Requesting Access for API Integration

For any integration, you need to register for an App Id, please submit your business use case via the following request form:
https://app-eu.wrike.com/workspace.htm?acc=3128883#/forms?formid=964069

After submitted the form, integration team will review and advice the next step to follow to get your App Id and secret.

<br/>
<br/>
<br/>
<br/>

# Integration via API

## Wrike Native API

Wrike Native API is Wrike Product's Native API, fully own and supported by Wrike.

It is fully documented at [https://developers.wrike.com/overview/](https://developers.wrike.com/overview/)

You may follow the guide to develop your solutions, and technical support are offered directly thru Wrike support.

Using the Native API would requires developer to fully understand how Wrike works, its structures, technical features and behaviours.

## WrikeXPI

WrikeXPI is integration layer that built on top of Wrike Native API, to make your API development much more efficient.

## API Specification

*  **[Documentation](Documentation/README.md)** on Wrike XPI's specification and swagger style API testing utility. 

## Integration Showcase

Working examples of the WrikeXPI, showcasing the capabilities of the XPI.
*  **[Showcase Portal](Samples/README.md)**: A mock system demonstrating the power of XPI. 

<br/>
<br/>
<br/>
<br/>


# Integration via PowerAutomate

## POA Connectors (PowerAutomate Online)

*   **[Connector Documentation](PAO-Connectors/README.md)**: Instructions for setting up the Power Automate custom connector for Wrike API

We are still working to create the connector for WrikeXPI, do reach out if you need that.


<hr/>



