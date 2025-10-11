export function GridCursor({ offset = 0.5 }: { offset?: number }) {
  return (
    <>
      {/* Top-left cursor - offset by 0 to center on gap */}
      <svg
        className="absolute w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
        style={{
          top: `-${offset}px`,
          left: `-${offset}px`,
          transform: "translate(-50%, -50%)",
        }}
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

      {/* Top-right cursor - offset by 0 to center on gap */}
      <svg
        className="absolute w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
        style={{
          top: `-${offset}px`,
          right: `-${offset}px`,
          transform: "translate(50%, -50%)",
        }}
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

      {/* Bottom-left cursor - offset by 0 to center on gap */}
      <svg
        className="absolute w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
        style={{
          bottom: `-${offset}px`,
          left: `-${offset}px`,
          transform: "translate(-50%, 50%)",
        }}
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

      {/* Bottom-right cursor - offset by 0 to center on gap */}
      <svg
        className="absolute w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
        style={{
          bottom: `-${offset}px`,
          right: `-${offset}px`,
          transform: "translate(50%, 50%)",
        }}
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
