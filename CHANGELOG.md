# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).
The format is based on [Keep a Changelog](http://keepachangelog.com/).


## Version 2.0.x - Future
### Added
- New Data Management menu button to remove all account structure items and managed/custom tags
- New Help button in the Credit Expenditure application

### Changed
- Improved error handling during data retrieval and calculations
- Increased default memory allocation for service application to 512MB
- Increased UI timeout to 60 seconds to allow correct multi-global account data retrieval

### Fixed
- Corrected data model for multiple contract phase updates on the same day
- Corrected aggregation methods in SAC CV for multi global account configurations


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