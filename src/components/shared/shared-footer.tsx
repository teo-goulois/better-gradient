import { Link } from "@tanstack/react-router";

export const SharedFooter = () => {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
      <div className="container max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="flex-shrink-0">
              <h3 className="font-nohemi font-semibold text-neutral-900 mb-4">
                Better Gradient
              </h3>
            </Link>
            <p className="text-sm text-neutral-600">
              Free mesh gradient generator for modern web design
            </p>
          </div>
          <div>
            <h4 className="font-nohemi font-semibold text-neutral-900 mb-4">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/editor"
                  className="text-sm text-neutral-600 hover:text-neutral-900"
                >
                  Gradient Editor
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery"
                  className="text-sm text-neutral-600 hover:text-neutral-900"
                >
                  Gallery
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-nohemi font-semibold text-neutral-900 mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/guide"
                  className="text-sm text-neutral-600 hover:text-neutral-900"
                >
                  Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-sm text-neutral-600 hover:text-neutral-900"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/resources"
                  className="text-sm text-neutral-600 hover:text-neutral-900"
                >
                  Resources
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-nohemi font-semibold text-neutral-900 mb-4">
              Connect
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
                  href="https://x.com/teo_goulois"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                  >
                    <title>Twitter/X</title>
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                  </svg>
                  Twitter/X
                </a>
              </li>
              <li>
                <a
                  className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
                  href="https://github.com/teo-goulois/better-gradient"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                  >
                    <title>GitHub</title>
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
                  </svg>
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-200 pt-8 text-center text-sm text-neutral-600">
          <p>© 2025 Better Gradient. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
