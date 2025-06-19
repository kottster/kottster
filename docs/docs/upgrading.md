# Upgrading

This page explains how to check your current Kottster versions and upgrade to the latest or a specific version. Your app consists of multiple core packages (`@kottster/common`, `@kottster/cli`, `@kottster/server`, and `@kottster/react`). You can upgrade all of them at once or choose to upgrade only specific packages.

## Check your current version

To see what versions you currently use, run the following command in your terminal:

```bash
npm list @kottster/common @kottster/cli @kottster/server @kottster/react
```

Example output:

```bash
@kottster/common@1.2.3
@kottster/cli@1.2.3
@kottster/server@1.2.3
@kottster/react@1.2.3
```

## Upgrade to the latest version

Run the following command in your project root:

```bash
npm install @kottster/common@latest @kottster/cli@latest @kottster/server@latest @kottster/react@latest --save
```

This will install the latest stable versions of all core packages.

## Upgrade to a specific version

If you want to lock to a specific version (for example, `1.2.3`):

```bash
npm install @kottster/common@1.2.3 @kottster/cli@1.2.3 @kottster/server@1.2.3 @kottster/react@1.2.3 --save
```

You can also upgrade just a single package:

```bash
npm install @kottster/react@latest --save
```
