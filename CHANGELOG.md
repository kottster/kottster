# Changelog

## [3.5.1] - 2026-01-12

- Removed Enterprise Hub support.
- Added Professional Plan license check.

## [3.4.8] - 2026-01-05

- Fixed a critical privilege escalation vulnerability allowing users to modify restricted fields when updating their own profile. A security advisory and CVE will be published shortly.
- Replaced `yarn` with `pnpm` in all core packages.
- Exposed data source table configurations to the client.

## [3.4.7] - 2025-12-05

- Changed the way how data source connected. Improved UI and added TLS preference field for connection settings.
- Fixed an issue with values from custom columns not being passed to hooks during record creation and update.

## [3.4.6] - 2025-11-18

- Add proxy for API dev server through Vite dev server. **Now Kottster app doesn't require to have two ports exposed in development mode.**
- Added method to configure express app.
- Added enviroment variables to configure express trust proxy and body parser limit.
- Fixed compatibility issue with Windows.

## [3.4.3] - 2025-11-05

- Added support for dark mode.
- Added `useTheme` hook to `@kottster/react` package.
- Fixed including all TypeScript path mappings during server build (#118)

## [3.4.2] - 2025-11-01

- Added `useUser`, `useApp`, `useModal`, `useTable` hooks to `@kottster/react` package.
- Added `Modal` compoenent to `@kottster/react` package.
- Added API references to the documentation for all core packages.
- Fixed the issue with backwards compatibility of nested table keys in `nested` prop of `TablePage` component (Fixes #113).
- Added ability to set custom `width` and `maxWidth` for the table page's form modal (Fixes #112).

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