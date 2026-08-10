# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 0.4.0 (2026-08-10)

### Features

* **oas**: support OAS 3.1 and 3.2 in getConfiguration (OAS31/OAS32 configurations)
* **amf**: bump amf-client-js from 5.10.2 to 5.11.7902 (exposes OAS31/OAS32)

## 0.3.0 (2026-04-07)

### Features

* **amf**: upgrade amf-client-js from 4.7.8 to 5.10.2
* **grpc**: add support for gRPC/Protobuf API parsing
* **api**: migrate to AMF v5 API (RAMLConfiguration, OASConfiguration, GRPCConfiguration)

### Breaking Changes

* Requires amf-client-js ^5.10.2
* API method signatures changed to use AMF v5 configuration objects

### 0.2.5 (2020-01-22)


### Bug Fixes

* Fixing generation of regular model ([a25a961](https://github.com/advanced-rest-client/api-model-generator/commit/a25a961502361e2f8f3d503ae1ffd3c795f86c8a))
