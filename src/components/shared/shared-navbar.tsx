import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { authClient } from "@/lib/auth-client";
import { getViewerQueryOptions } from "@/lib/actions/actions.auth";
import { FAVORITES_DASHBOARD_HREF } from "@/lib/dashboard";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface NavItem {
  name: string;
  href: string;
}

interface NavDropdown {
  name: string;
  items: NavItem[];
}

type NavEntry = NavItem | NavDropdown;

function isDropdown(entry: NavEntry): entry is NavDropdown {
  return "items" in entry;
}

const navEntries: NavEntry[] = [
  { name: "Home", href: "/" },
  {
    name: "Tools",
    items: [
      { name: "Random Gradient", href: "/random-gradient" },
      { name: "Text Gradient", href: "/text-gradient" },
      { name: "Tailwind Gradient", href: "/tailwind-gradient" },
    ],
  },
  {
    name: "Learn",
    items: [
      { name: "Gallery", href: "/gallery" },
      { name: "Guide", href: "/guide" },
      { name: "Developers", href: "/developers" },
    ],
  },
  { name: "Resources", href: "/resources" },
  { name: "Leaderboard", href: "/leaderboard" },
];

const toolDescriptions: Record<string, string> = {
  "/random-gradient": "Generate beautiful random gradients instantly",
  "/text-gradient": "Apply stunning gradients to your text",
  "/tailwind-gradient": "Generate Tailwind CSS gradient classes",
  "/gallery": "Browse curated gradient collections",
  "/guide": "Learn how to create perfect gradients",
  "/developers": "API docs and integration guides",
};

const toolIcons: Record<string, string> = {
  "/random-gradient":
    "M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3",
  "/text-gradient":
    "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z",
  "/tailwind-gradient":
    "M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5",
  "/gallery":
    "M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z",
  "/guide":
    "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25",
  "/developers":
    "M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function UserAvatar({
  viewer,
}: {
  viewer: { name: string; image: string | null };
}) {
  const [imgError, setImgError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Catch errors that fired before React hydration attached the onError handler
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setImgError(true);
    }
  }, []);

  if (!viewer.image || imgError) {
    return (
      <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-900 text-xs font-semibold text-white">
        {initials(viewer.name)}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={viewer.image}
      alt={viewer.name}
      referrerPolicy="no-referrer"
      className="size-8 rounded-lg object-cover"
      loading="lazy"
      onError={() => setImgError(true)}
    />
  );
}

const EASE_OUT_QUART = "cubic-bezier(0.165, 0.84, 0.44, 1)";
const EASE_OUT_QUINT = "cubic-bezier(0.23, 1, 0.32, 1)";

// Extract dropdown entries with their original indices
const dropdownEntries = navEntries
  .map((entry, i) => ({ entry, index: i }))
  .filter((e): e is { entry: NavDropdown; index: number } =>
    isDropdown(e.entry),
  );

function DropdownContent({
  dropdown,
  direction,
  isTransitioning,
}: {
  dropdown: NavDropdown;
  direction: "left" | "right" | "none";
  isTransitioning: boolean;
}) {
  return (
    <div className="p-2">
      {dropdown.items.map((item, itemIndex) => (
        <Link
          key={item.href}
          to={item.href}
          className="nav-dropdown-item flex items-start gap-3 px-3 py-2.5 rounded-lg text-neutral-600 group"
          activeProps={{
            className:
              "nav-dropdown-item flex items-start gap-3 px-3 py-2.5 rounded-lg bg-neutral-50 text-neutral-900 group",
          }}
          style={
            isTransitioning && direction !== "none"
              ? {
                  animation: `nav-slide-${direction} 220ms ${EASE_OUT_QUINT} both`,
                  animationDelay: `${itemIndex * 40}ms`,
                }
              : undefined
          }
        >
          <div className="nav-icon-box mt-0.5 p-1.5 rounded-md bg-neutral-100 text-neutral-500">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={toolIcons[item.href] ?? "M12 6v12m6-6H6"}
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">{item.name}</p>
            {toolDescriptions[item.href] && (
              <p className="text-xs text-neutral-400 mt-0.5">
                {toolDescriptions[item.href]}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export const SharedNavbar = () => {
  const viewerQuery = useQuery(getViewerQueryOptions());
  const viewer = viewerQuery.data?.user ?? null;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState<
    string | null
  >(null);

  // Shared popover state
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [prevDropdown, setPrevDropdown] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navBarRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const contentRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  // Measure trigger position and content size, update popover style
  const updatePopoverPosition = useCallback((index: number) => {
    const trigger = triggerRefs.current.get(index);
    const content = contentRefs.current.get(index);
    const navBar = navBarRef.current;
    if (!trigger || !navBar) return;

    const triggerRect = trigger.getBoundingClientRect();
    const navRect = navBar.getBoundingClientRect();

    const left = triggerRect.left - navRect.left - 12; // -12 for padding offset

    const style: React.CSSProperties = {
      left: `${left}px`,
      minWidth: "320px",
    };

    if (content) {
      const w = Math.max(content.scrollWidth, 320);
      style.width = `${w}px`;
      style.height = `${content.scrollHeight}px`;
    }

    setPopoverStyle(style);
  }, []);

  const handleMouseEnter = useCallback(
    (index: number) => {
      clearCloseTimeout();
      if (activeDropdown !== null && activeDropdown !== index) {
        setPrevDropdown(activeDropdown);
        setIsTransitioning(true);
        setActiveDropdown(index);
        updatePopoverPosition(index);
        setTimeout(() => setIsTransitioning(false), 260);
      } else {
        setActiveDropdown(index);
        updatePopoverPosition(index);
      }
    },
    [activeDropdown, clearCloseTimeout, updatePopoverPosition],
  );

  const handleMouseLeave = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setPrevDropdown(null);
      setIsTransitioning(false);
    }, 200);
  }, [clearCloseTimeout]);

  useEffect(() => {
    return () => clearCloseTimeout();
  }, [clearCloseTimeout]);

  // Recalculate position when activeDropdown changes
  useLayoutEffect(() => {
    if (activeDropdown !== null) {
      updatePopoverPosition(activeDropdown);
    }
  }, [activeDropdown, updatePopoverPosition]);

  const getSlideDirection = (): "left" | "right" | "none" => {
    if (activeDropdown === null || prevDropdown === null) return "none";
    return activeDropdown > prevDropdown ? "left" : "right";
  };

  const direction = getSlideDirection();
  const isOpen = activeDropdown !== null;
  const activeEntry =
    activeDropdown !== null
      ? (navEntries[activeDropdown] as NavDropdown)
      : null;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div
            ref={navBarRef}
            className="hidden md:flex items-center gap-1 relative"
            onMouseLeave={handleMouseLeave}
          >
            {navEntries.map((entry, index) =>
              isDropdown(entry) ? (
                <button
                  key={entry.name}
                  type="button"
                  ref={(el) => {
                    if (el) triggerRefs.current.set(index, el);
                  }}
                  onMouseEnter={() => handleMouseEnter(index)}
                  className="nav-trigger px-4 py-2 text-sm font-medium flex items-center gap-1"
                  data-active={activeDropdown === index || undefined}
                >
                  {entry.name}
                  <svg
                    className="nav-chevron w-3.5 h-3.5"
                    data-open={activeDropdown === index || undefined}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>
              ) : (
                <Link
                  key={entry.href}
                  to={entry.href}
                  className="nav-link px-4 py-2 text-sm font-medium text-neutral-600"
                  activeProps={{
                    className:
                      "nav-link px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100 rounded-md",
                  }}
                >
                  {entry.name}
                </Link>
              ),
            )}

            {/* Hidden measurement containers (outside popover so they size naturally) */}
            {dropdownEntries.map(({ entry, index }) => (
              <div
                key={entry.name}
                ref={(el) => {
                  if (el) contentRefs.current.set(index, el);
                }}
                className="absolute invisible pointer-events-none"
                style={{ minWidth: "320px" }}
                aria-hidden
              >
                <DropdownContent
                  dropdown={entry}
                  direction="none"
                  isTransitioning={false}
                />
              </div>
            ))}

            {/* ── Shared floating popover ──────────────────── */}
            <div
              className="nav-popover absolute top-full pt-3"
              data-open={isOpen || undefined}
              style={popoverStyle}
              onMouseEnter={clearCloseTimeout}
            >
              <div className="nav-popover-inner bg-white rounded-xl border border-neutral-200 shadow-lg shadow-neutral-200/50 overflow-hidden">
                {activeEntry && (
                  <DropdownContent
                    key={activeDropdown}
                    dropdown={activeEntry}
                    direction={direction}
                    isTransitioning={isTransitioning}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/editor"
              className="nav-cta shrink-0 px-4 py-2 relative text-sm font-medium text-white rounded-lg overflow-hidden bg-cover bg-center"
              style={{ backgroundImage: "url('/gradients/gradient-1.webp')" }}
            >
              Create Gradient
            </Link>
            {viewer ? (
              <Menu>
                <MenuTrigger
                  aria-label="Account menu"
                  className="account-trigger"
                >
                  <UserAvatar viewer={viewer} />
                </MenuTrigger>
                <MenuContent placement="bottom end">
                  <MenuItem href="/dashboard">Dashboard</MenuItem>
                  <MenuItem href={FAVORITES_DASHBOARD_HREF}>Favorites</MenuItem>
                  <MenuItem
                    isDanger
                    onAction={() => {
                      void authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            window.location.href = "/";
                          },
                        },
                      });
                    }}
                  >
                    Log out
                  </MenuItem>
                </MenuContent>
              </Menu>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            className="md:hidden flex size-9 items-center justify-center"
          >
            {viewer && !isMobileMenuOpen ? (
              <UserAvatar viewer={viewer} />
            ) : (
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
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="flex flex-col gap-1">
              {navEntries.map((entry) =>
                isDropdown(entry) ? (
                  <div key={entry.name}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMobileSection(
                          expandedMobileSection === entry.name
                            ? null
                            : entry.name,
                        )
                      }
                      className="nav-trigger w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-neutral-600 rounded"
                    >
                      {entry.name}
                      <svg
                        className="nav-chevron w-4 h-4"
                        data-open={
                          expandedMobileSection === entry.name || undefined
                        }
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </button>
                    <div
                      className="nav-accordion"
                      data-open={
                        expandedMobileSection === entry.name || undefined
                      }
                    >
                      <div className="min-h-0">
                        <div className="pl-4 py-1 flex flex-col gap-0.5">
                          {entry.items.map((item) => (
                            <Link
                              key={item.href}
                              to={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="nav-dropdown-item flex items-center gap-3 px-4 py-2 text-sm text-neutral-500 rounded"
                              activeProps={{
                                className:
                                  "nav-dropdown-item flex items-center gap-3 px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100 rounded",
                              }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d={toolIcons[item.href] ?? "M12 6v12m6-6H6"}
                                />
                              </svg>
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={entry.href}
                    to={entry.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="nav-link px-4 py-2 text-sm font-medium text-neutral-600 rounded"
                    activeProps={{
                      className:
                        "nav-link px-4 py-2 text-sm font-medium text-neutral-900 bg-neutral-100 rounded",
                    }}
                  >
                    {entry.name}
                  </Link>
                ),
              )}
              <Link
                to="/editor"
                onClick={() => setIsMobileMenuOpen(false)}
                className="nav-cta mt-2 px-4 py-2 relative text-sm font-medium text-white text-center rounded-lg overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: "url('/gradients/gradient-1.webp')" }}
              >
                Create Gradient
              </Link>
              {viewer ? (
                <div className="mt-2 border-t border-neutral-100 pt-2">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <UserAvatar viewer={viewer} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {viewer.name}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {viewer.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/dashboard"
                    search={{ filter: "favorites" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
                  >
                    Favorites
                  </Link>
                  <button
                    type="button"
                    className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    onClick={() => {
                      void authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            window.location.href = "/";
                          },
                        },
                      });
                    }}
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-2 block border-t border-neutral-100 px-4 pt-3 text-sm font-medium text-neutral-600"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        :root {
          --ease-out-quart: ${EASE_OUT_QUART};
          --ease-out-quint: ${EASE_OUT_QUINT};
        }

        /* ── Nav links ─────────────────────────────────────── */
        .nav-link {
          transition: background-color 150ms ease, color 150ms ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .nav-link:hover {
            background-color: rgb(250 250 250);
            color: rgb(23 23 23);
          }
        }

        /* ── Trigger buttons ───────────────────────────────── */
        .nav-trigger {
          color: rgb(82 82 82);
          transition: color 150ms ease, background-color 150ms ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .nav-trigger:hover {
            color: rgb(23 23 23);
            background-color: rgb(250 250 250);
            border-radius: 0.375rem;
          }
        }
        .nav-trigger[data-active] {
          color: rgb(23 23 23);
        }

        /* ── Chevron ───────────────────────────────────────── */
        .nav-chevron {
          transition: transform 200ms var(--ease-out-quart);
          will-change: transform;
        }
        .nav-chevron[data-open] {
          transform: rotate(180deg);
        }

        /* ── Shared popover container ──────────────────────── */
        .nav-popover {
          opacity: 0;
          transform: translateY(-6px) scale(0.96);
          transform-origin: top center;
          pointer-events: none;
          /* exit: faster (160ms) */
          transition:
            opacity 160ms var(--ease-out-quart),
            transform 160ms var(--ease-out-quart),
            left 250ms var(--ease-out-quint);
          will-change: transform, opacity, left;
          z-index: 50;
        }
        .nav-popover[data-open] {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
          /* enter: slower (220ms) */
          transition:
            opacity 220ms var(--ease-out-quart),
            transform 220ms var(--ease-out-quart),
            left 250ms var(--ease-out-quint);
        }

        /* Inner container animates width/height smoothly */
        .nav-popover-inner {
          transition:
            width 250ms var(--ease-out-quint),
            height 250ms var(--ease-out-quint);
          will-change: width, height;
          position: relative;
        }

        /* ── Dropdown items ────────────────────────────────── */
        .nav-dropdown-item {
          transition:
            background-color 150ms ease,
            color 150ms ease,
            transform 150ms var(--ease-out-quart);
          will-change: transform;
        }
        @media (hover: hover) and (pointer: fine) {
          .nav-dropdown-item:hover {
            background-color: rgb(250 250 250);
            color: rgb(23 23 23);
          }
          .nav-dropdown-item:active {
            transform: scale(0.98);
            transition-duration: 80ms;
          }
        }

        /* ── Icon box ──────────────────────────────────────── */
        .nav-icon-box {
          transition: background-color 150ms ease, color 150ms ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .nav-dropdown-item:hover .nav-icon-box {
            background-color: rgb(229 229 229);
            color: rgb(64 64 64);
          }
        }

        /* ── CTA button ────────────────────────────────────── */
        .nav-cta {
          transition: transform 200ms var(--ease-out-quart);
          will-change: transform;
        }
        @media (hover: hover) and (pointer: fine) {
          .nav-cta:hover {
            transform: scale(1.03);
          }
          .nav-cta:active {
            transform: scale(0.97);
            transition-duration: 80ms;
          }
        }

        /* ── Account button ────────────────────────────────── */
        .account-trigger {
          transition: opacity 150ms ease, transform 150ms var(--ease-out-quart);
        }
        @media (hover: hover) and (pointer: fine) {
          .account-trigger:hover {
            opacity: 0.8;
          }
          .account-trigger:active {
            transform: scale(0.93);
            transition-duration: 80ms;
          }
        }

        /* ── Mobile accordion ──────────────────────────────── */
        .nav-accordion {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition:
            grid-template-rows 250ms var(--ease-out-quart),
            opacity 200ms var(--ease-out-quart);
        }
        .nav-accordion[data-open] {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .nav-accordion > * {
          overflow: hidden;
        }

        /* ── Directional slide keyframes ───────────────────── */
        @keyframes nav-slide-left {
          from {
            opacity: 0;
            transform: translateX(16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes nav-slide-right {
          from {
            opacity: 0;
            transform: translateX(-16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* ── Accessibility ─────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .nav-link,
          .nav-trigger,
          .nav-chevron,
          .nav-popover,
          .nav-popover-inner,
          .nav-dropdown-item,
          .nav-icon-box,
          .nav-cta,
          .account-trigger,
          .nav-accordion {
            transition: none;
          }
          .nav-dropdown-item {
            animation: none;
          }
        }
      `}</style>
    </nav>
  );
};
