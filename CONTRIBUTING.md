# Contributing to Better Gradient

🎉 Thanks for your interest in contributing to **Better Gradient**!
We welcome contributions of all kinds — bug fixes, new features, improvements to documentation, or even just feedback and ideas.

> **Important:** This project started as a personal side project built for my own use case. The codebase may not follow strict conventions everywhere, and there's definitely room for improvement in structure, patterns, and organization. Don't hesitate to suggest refactors, improvements, or better practices — we're here to learn and improve together!

---

## How to Contribute

### 1. Reporting Bugs

- Check if the bug is already reported in the [issues](https://github.com/teo-goulois/better-gradient/issues).
- If not, open a new issue with:
  - A clear description of the bug
  - Steps to reproduce
  - Expected vs. actual behavior
  - Screenshots if helpful
- Please use the **Bug Report** template if available.

### 2. Suggesting Features

- Open a [feature request issue](https://github.com/teo-goulois/better-gradient/issues) and describe:
  - What problem the feature solves
  - How it might work
  - Any alternatives you've considered
- We encourage discussion before you start coding, to make sure we're aligned.

### 3. Submitting Pull Requests

1. **Fork the repo** and create your branch:

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** following our code style guidelines.

3. **Run tests and linters**:

   ```bash
   npm run test
   npm run check
   ```

4. **Commit your changes** using a clear, descriptive commit message:

   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork** and open a Pull Request:
   ```bash
   git push origin feature/amazing-feature
   ```

**Please ensure your PR:**

- Describes what it does and why
- Links to related issues (e.g., "Closes #123")
- Passes all CI checks
- Follows the existing code style

---

## Local Development Setup

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

### Setup Steps

1. **Clone the repo**:

   ```bash
   git clone https://github.com/teo-goulois/better-gradient.git
   cd better-gradient
   ```

2. **Install dependencies**:

   ```bash
   pnpm i
   ```

3. **Set up environment variables** (if needed):

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Run the dev server**:

   ```bash
   pnpm dev
   ```

5. **Open your browser** at [http://localhost:3000](http://localhost:3000)

### Available Scripts

| Command          | Description                                 |
| ---------------- | ------------------------------------------- |
| `pnpm dev`       | Start development server on port 3000       |
| `pnpm build`     | Build for production                        |
| `pnpm serve`     | Preview production build                    |
| `npm test`       | Run tests                                   |
| `pnpm lint`      | Lint code with Biome                        |
| `pnpm format`    | Format code with Biome                      |
| `pnpm check`     | Run full Biome check (lint + format)        |
| `pnpm db:push`   | Push database schema changes                |
| `pnpm db:studio` | Open Drizzle Studio for database management |

---

## Code Style

- We use **[Biome](https://biomejs.dev/)** for linting and formatting
- Please keep code clean and consistent with existing patterns
- Run `npm run check` before submitting a PR
- Follow React best practices and hooks conventions
- Use TypeScript for type safety

### Commit Message Convention

We follow conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code changes that neither fix bugs nor add features
- `docs:` - Documentation updates
- `style:` - Code style changes (formatting, etc.)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example: `feat: add gradient export functionality`

---

## Project Structure

```
better-gradient/
├── app/                 # Main application code
├── public/             # Static assets
├── components/         # Reusable React components
├── db/                 # Database schema and migrations
├── tests/              # Test files
└── ...
```

---

## Testing

- We use **Vitest** for testing
- Write tests for new features and bug fixes
- Run tests with `npm test`
- Ensure all tests pass before submitting a PR

---

## Community & Conduct

- This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md)
- By participating, you agree to uphold this code
- Be respectful, inclusive, and collaborative

---

## Questions?

- **General ideas**: Open a [discussion](https://github.com/teo-goulois/better-gradient/discussions)
- **Bugs & features**: Use [issues](https://github.com/teo-goulois/better-gradient/issues)
- **Need help?**: Feel free to ask in discussions or open an issue

---

💜 **Thank you for helping make Better Gradient awesome!**
