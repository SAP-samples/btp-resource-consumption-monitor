# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).
The format is based on [Keep a Changelog](http://keepachangelog.com/).


## Version 2.1.x - Future
### Fixed
- Fixed empty dropdown in copy/paste of tags

### Changed
- Improved performance of forecast calculations during data refresh

## Version 2.1.0 - 2024-11-15
### Added
- Support for Kyma deployment
- Support from CDS 8.4
- Enabled lower level 'instances' breakdown for select services

### Changed
- Removed dependency on Application Logging service to minimize footprint
- Increased UI timeout from 60s to 120s which could be required for multi-GlobalAccount setups
- Work Zone spaces are now explicitely sorted, leveraging a new Work Zone configuration feature
- Improved handling of account structure to allow for changes in sub account naming and hierarchies
- Extended the sync job of the previous month from 1st of the month till 5th of the month to ensure receiving its non-estimated/final data. This will create a new job. The old job can be removed manually via the BTP Cockpit.

### Fixed
- Fixed faulty filter dropdown in configuring Alerts

## Version 2.0.2 - 2024-07-03
### Added
- New Data Management menu button to remove all account structure items and managed/custom tags
- New Help button in the Credit Expenditure application

### Changed
- Improved error handling during data retrieval and calculations
- Increased default memory allocation for service application to 512MB
- Increased UI timeout to 60 seconds to allow correct multi-global account data retrieval
- Changed SAC content to be compatible with SAC version 2024.08

### Fixed
- Corrected data model for multiple contract phase updates on the same day
- Corrected aggregation methods in SAC CV for multi global account configurations
- Allowed downloads (export to Excel) for embedded apps


## Version 2.0.1 - 2024-06-24
### Added
- Credit projection dashboard (SAC) in Credit Expenditure

### Changed
- Disabled default managed tags in settings.ts

### Fixed
- Corrected app embedding link for sites that do not use an alias
- Corrected Credit Expenditure chart where the contract end is more than 3 years in the future
- Corrected deployment order of the database before the application
- Corrected data inconsistency when identical services with different names are active at the same time


## Version 2.0.0 - 2024-06-20
- New major version. Not backward compatible, deploy as new installation.


## Version 1.1.0 - 2024-05-27
### Added
- Enabled previous-day delta calculations on measures and forecasts

### Changed
- Delayed the initial load job to make sure the application is running steadily before the jobs run


## Version 1.0.2 - 2024-03-26
### Fixed
- Corrected destination service key reference


## Version 1.0.1 - 2024-03-21
### Added
- 2 new cards for Work Zone

### Fixed
- Corrected destination name used in Job Scheduling service to connect to the application
- Corrected ui5 configuration for loading the applications from the html5 repo host. Requires pre-deployment code change. See README.md


## Version 1.0.0 - 2024-03-11
Initial