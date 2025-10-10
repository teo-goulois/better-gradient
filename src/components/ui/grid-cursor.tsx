export function GridCursor() {
  return (
    <>
      {/* Top-left cursor */}
      <svg
        className="absolute top-0 left-0 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50"
        viewBox="0 0 10 10"
        fill="none"
      >
        <title>Top-left cursor</title>
        <circle cx="5" cy="5" r="1.5" fill="#737373" />
        <path
          d="M5 0 L5 3 M5 7 L5 10 M0 5 L3 5 M7 5 L10 5"
          stroke="#737373"
          strokeWidth="1"
        />
      </svg>

      {/* Top-right cursor */}
      <svg
        className="absolute top-0 right-0 w-2.5 h-2.5 translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50"
        viewBox="0 0 10 10"
        fill="none"
      >
        <title>Top-right cursor</title>
        <circle cx="5" cy="5" r="1.5" fill="#737373" />
        <path
          d="M5 0 L5 3 M5 7 L5 10 M0 5 L3 5 M7 5 L10 5"
          stroke="#737373"
          strokeWidth="1"
        />
      </svg>

      {/* Bottom-left cursor */}
      <svg
        className="absolute bottom-0 left-0 w-2.5 h-2.5 -translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50"
        viewBox="0 0 10 10"
        fill="none"
      >
        <title>Bottom-left cursor</title>
        <circle cx="5" cy="5" r="1.5" fill="#737373" />
        <path
          d="M5 0 L5 3 M5 7 L5 10 M0 5 L3 5 M7 5 L10 5"
          stroke="#737373"
          strokeWidth="1"
        />
      </svg>

      {/* Bottom-right cursor */}
      <svg
        className="absolute bottom-0 right-0 w-2.5 h-2.5 translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50"
        viewBox="0 0 10 10"
        fill="none"
      >
        <title>Bottom-right cursor</title>
        <circle cx="5" cy="5" r="1.5" fill="#737373" />
        <path
          d="M5 0 L5 3 M5 7 L5 10 M0 5 L3 5 M7 5 L10 5"
          stroke="#737373"
          strokeWidth="1"
        />
      </svg>
    </>
  );
}
