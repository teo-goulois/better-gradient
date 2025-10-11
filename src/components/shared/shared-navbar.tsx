import { Logo } from "@/components/shared/logo";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../ui/button";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Gallery", href: "/gallery" },
  { name: "Guide", href: "/guide" },
  { name: "Resources", href: "/resources" },
  { name: "Blog", href: "/blog" },
];

export const SharedNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-all duration-200"
                activeProps={{
                  className:
                    "px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100",
                }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA Button */}
          <Link
            to="/editor"
            className="hidden md:flex flex-shrink-0 px-4 py-2 relative text-sm font-medium text-white hover:scale-[1.01] transition-all duration-200"
          >
            <img
              src="/gradients/gradient-1.webp"
              alt="Gradient background example"
              className="h-full w-full object-cover -z-10 absolute top-0 left-0"
              loading="eager"
            />
            Create Gradient
          </Link>

          {/* Mobile Menu Button */}
          <Button
            intent="plain"
            size="sq-md"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            className="md:hidden"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Toggle menu</title>
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded transition-all duration-200"
                  activeProps={{
                    className:
                      "px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100 rounded",
                  }}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/editor"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-2 px-4 py-2 relative text-sm font-medium text-white hover:scale-[1.01] transition-all duration-200 text-center"
              >
                <img
                  src="/gradients/gradient-1.webp"
                  alt="Gradient background example"
                  className="h-full w-full object-cover -z-10 absolute top-0 left-0 rounded"
                  loading="eager"
                />
                Create Gradient
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
