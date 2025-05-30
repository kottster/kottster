# Contributing to Kottster

Thank you for your interest in [Kottster](https://kottster.app/) and for taking the time to contribute to this project. 

Kottster is a project by developers for developers and there are a lot of ways you can contribute. If you don't know where to start contributing, ask us on our [Discord channel](https://discord.com/invite/Qce9uUqK98).

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Git Workflow

Kottster follows these Git management practices:

### Conventional Commits

We use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages to provide a consistent format:

```
<type>: <description>
```

Types include:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Changes to the build process, tooling, etc.

Examples:
```
feat: Add mongodb adapter
fix: Resolve token validation issue
docs: Update API documentation
```

### Branching Strategy

We follow Trunk-Based Development:
- `main` is the primary branch and source of truth
- Create short-lived feature branches for development
- Branch names should be descriptive and include issue numbers when applicable
- Example: `feature/mongodb-adapter`, `fix/token-validation` or `docs/api-docs`

### Versioning

Each package in our monorepo follows independent versioning. Version numbers follow semantic versioning (MAJOR.MINOR.PATCH).

### Tagging

We use package-specific tags in the format:
```
package-name@vX.Y.Z
```

Example: `@kottster/server@v1.2.3`

Tags are applied to the `main` branch after changes are merged.

## How Can I Contribute?

### Development Workflow

1. Fork the repository
2. Create a feature branch from `main` 
   ```bash
   git checkout -b feature/your-feature main
   ```
3. Make changes to any needed packages
4. Commit using conventional commit format
   ```bash
   git commit -m "feat: Implement new feature"
   ```
5. Push your branch and create a Pull Request
   ```bash
   git push origin feature/your-feature
   ```
6. After review and approval, your PR will be merged to `main`
7. Once in `main`, package versioning and tagging will be handled by the project maintainers

### 🐛 Reporting Bugs

Before submitting a bug report:

- Check the issue tracker to see if the bug has already been reported
- Ensure you're using the latest version of the software

To report a bug, create an issue using the [bug report](https://github.com/kottster/kottster/issues/new?template=bug_report.md) template and include:
- A clear title and description
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

### 🛠 Suggesting Features

Feature suggestions are tracked as GitHub issues. Create an issue using the [feature request](https://github.com/kottster/kottster/issues/new?template=feature_request.md) template and provide:
- A clear title and description
- Justification for the feature
- Possible implementation details (optional)

### 📖 Improving Documentation

Documentation is crucial for any project. If you find any typos, unclear instructions, or missing information, please submit a pull request with your changes.
You can also help by:
- Reviewing [existing documentation](https://kottster.app/docs/) for clarity
- Adding examples or use cases
- Creating tutorials or guides

## License

By contributing, you agree that your contributions will be licensed under the project's license.