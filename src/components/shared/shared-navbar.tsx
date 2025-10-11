import { Logo } from "@/components/shared/logo";
import { Link } from "@tanstack/react-router";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Gallery", href: "/gallery" },
  { name: "Guide", href: "/guide" },
  { name: "Resources", href: "/resources" },
  { name: "Blog", href: "/blog" },
];

export const SharedNavbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="container mx-auto max-w-5xl ">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo />
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50  transition-all duration-200"
                activeProps={{
                  className:
                    "px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100 ",
                }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <Link
            to="/editor"
            className="flex-shrink-0 px-4 py-2 relative text-sm font-medium text-white hover:scale-[1.01] transition-all duration-200"
          >
            <img
              src="/gradients/gradient-1.webp"
              alt="Gradient background example"
              className="h-full w-full object-cover -z-10 absolute top-0 left-0"
              loading="eager"
            />
            Create Gradient
          </Link>
        </div>
      </div>
    </nav>
  );
};
