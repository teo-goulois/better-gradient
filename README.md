# Better Gradient

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](./CONTRIBUTING.md)

🎨 **Better Gradient** — Design elegant blurred-shape mesh gradients with a clear, focused editor. Perfect for backgrounds, UI elements, and creative projects.

👉 **[Live Demo](https://better-gradient.com)**

> **Note:** This project started as a personal side project to solve my own needs. While it's functional and useful, there's plenty of room for improvement — code structure, conventions, optimizations, and more. Contributions to help polish it are very welcome!

---

## ✨ Features

- 🌀 Create **blurred-shape mesh gradients**
- 🎯 Simple, focused, distraction-free editor
- 🎨 Perfect for backgrounds, UI elements, and creative projects
- 💾 Export your gradients for use in any project

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

- [Node.js](https://nodejs.org/) 22.12 or newer
- pnpm 10.33.0 (the version pinned in `package.json`)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/teo-goulois/better-gradient.git
cd better-gradient
pnpm i
```

### Development

Start the local dev server:

```bash
pnpm dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000).

### Build

To create a production build:

```bash
pnpm build
```

### Cloudflare deployment

The Cloudflare deployment keeps the Node server and sharp in a Container. Static
assets are served by Workers, except for the large demonstration video, which
streams from the Container.

Pushes to `main` run tests, build the Linux server, check its runtime, and deploy
through GitHub Actions. Other branches do not deploy.

See [Cloudflare setup and rollback](docs/cloudflare.md) for secrets, the first
deployment, domain migration, and local Docker builds.

---

## 🛠️ Tech Stack

- **[TanStack Start](https://tanstack.com/start)** - Full-stack React framework
- **[React](https://react.dev/)** - UI library
- **[React Aria Components](https://react-spectrum.adobe.com/react-aria/)** - Accessible UI primitives
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Biome](https://biomejs.dev/)** - Linting & formatting
- **[Vitest](https://vitest.dev/)** - Testing
- **[Drizzle ORM](https://orm.drizzle.team/)** - Database toolkit

---

## 🤝 Contributing

We welcome contributions of all kinds — bug fixes, features, documentation, or feedback.

See our [Contributing Guide](./CONTRIBUTING.md) for setup and contribution workflow.

Please follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 📜 License

This project is licensed under the MIT License.

---

💜 Made with love for the creative community.
