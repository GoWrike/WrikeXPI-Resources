# WrikeXPI API Specification

This directory contains detailed documentation for the WrikeXPI project. The documents herein cover API specifications, authentication mechanisms, and other relevant integration guides.

## WrikeXPI Overview

WrikeXPI had been developed with the goal to complement Wrike's existing offering, level it up and make more integration possible. Here are a few key features:

### Authentication

| API | Auth Method |
|:--  |:--          |
| Wrike API | Permenant Token, OAuth with Expiry |
| Wrike XPI | Permenant Token, OAuth with Expiry <br/> Permenant OAuth Token, Basic Authentication |

### Campaign API (based Campaign Activation Blueprint)

### Master Data API
- OData style to Master Data
- Unified API supporting Custom Fields, Datahub

### Forms API
- Submit Request Form thru API

### Transparent Proxy
- Proxy to Wrike API
- Ability to add additional API endpoints
- Ability to swap specific API endpoints

## Available Documents

Below is a list of available documentation:

*   **[How to use OAuth](OAuth.md)**: A comprehensive guide to understanding and implementing the OAuth 2.0 flow for the WrikeXPI API. This document outlines the step-by-step process for authenticating users and obtaining access tokens. 

*   **[API Specification](xpi-openapi3.yaml)**: WrikeXPI API specification in OpenAPI 3.0 format.

*   **[Web-based API Playground](APIPlayground.html)**: For easy validation and evaluation of XPI. 

Please use the following to get your XPI Token to be used in the API Playground:

*  **[XPI Token Service (xpi-spi.gowrike.space)](https://xpi-api.gowrike.space/?accountId=3128883)**

*  **[XPI Token Service (api.wrikexpi.groupm.com)](https://api.wrikexpi.groupm.com/?accountId=3128883)**

_note: We are still cleaning up the API specification document, you may see some internal codenames at the moment, you may safely ignore them for now!_

Please refer to these documents to gain a deeper understanding of the WrikeXPI project's technical components and to assist with your development and integration efforts.