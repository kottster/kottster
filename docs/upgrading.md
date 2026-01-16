---
description: "Upgrade Kottster packages to the latest or a specific version. Learn how to check your current versions and perform upgrades."
---

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

## Upgrade

### Recommended: use the upgrade script

Run the upgrade script and select the version you want to upgrade to:

```bash
npm run dev:upgrade-kottster
```

This is the safest way to upgrade because it upgrades all core packages (`@kottster/common`, `@kottster/cli`, `@kottster/server`, and `@kottster/react`) to the same selected version, ensuring they stay compatible.

### Manual upgrade (advanced)

If you prefer to upgrade manually, make sure all core packages end up on the same version.

Upgrade to the latest version:

```bash
npm install @kottster/common@latest @kottster/cli@latest @kottster/server@latest @kottster/react@latest --save
```

Upgrade to a specific version (example: `1.2.3`):

```bash
npm install @kottster/common@1.2.3 @kottster/cli@1.2.3 @kottster/server@1.2.3 @kottster/react@1.2.3 --save
```

Upgrade just a single package:

```bash
npm install @kottster/react@latest --save
```
