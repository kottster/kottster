# Changelog

## [3.4.1] - 2025-10-27

- Added icon selector for sidebar items.
- Improved visual page builder: changes now apply instantly without restarting the server.
- Added post-upgrade migration script that runs automatically when starting the project in development mode.
- Fixed sorting for table page's form settings.
- Fixed issue with nested table keys using __p__ instead of __c__; both are now supported for backward compatibility.
- Fixed double foreign key issue. (Fixes #109)

## [3.3.2] - 2025-10-21

- Added table views support. Using views, developers can create different perspectives on the same table data, each with its own set of filters. (#106)
- Added pnpm configuration with onlyBuiltDependencies to package.json file when creating new projects with pnpm as package manager. (#94)
- Deprecated roleIds-like properties in favor of roleNames-like properties. They roleIds-like properties will be removed in v4 major release.
- Added additional checking to to `initApp` action to prevent reinitialization of an already initialized app.

## [3.3.1] - 2025-10-18

- Added basePath support
- Added upgrade-kottster CLI command
- Added DEV_API_SERVER_URL environment variable support
- Added visible loader when server is restarting
- Updated CLI messages for better clarity

## [3.3.0] - 2025-10-13

- Added support for exporting data in CSV, JSON, and XLSX formats.
- Added support for filtering data by related records' attributes.
- Fixed passing context object to defineCustomController's procedures.
- Fixed bugs related to data visualization rendering.
- Fixed bug with getting single table records from mssql database.
- Fixed broken links in "More customization" tab.