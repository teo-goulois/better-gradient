export function DottedBackground() {
  return (
    <div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage: `radial-gradient(circle, #e5e5e5 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    />
  );
}
