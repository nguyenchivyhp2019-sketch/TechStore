// Hạt lửa bay lên nền trang (server component, vị trí ngẫu nhiên giả theo chỉ số)
const EMBERS = Array.from({ length: 24 }, (_, i) => {
  const r = (n) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    left: `${(r(1) * 100).toFixed(2)}%`,
    size: `${(r(2) * 4 + 2).toFixed(1)}px`,
    duration: `${(r(3) * 5 + 6).toFixed(1)}s`,
    delay: `${(r(4) * 6).toFixed(1)}s`,
  };
});

export default function HellEmbers() {
  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden motion-reduce:hidden">
      {EMBERS.map((e, i) => (
        <div
          key={i}
          className="absolute bottom-[-10px] bg-orange-500 rounded-full blur-[1px] opacity-0 animate-ember"
          style={{
            left: e.left,
            width: e.size,
            height: e.size,
            animationDuration: e.duration,
            animationDelay: e.delay,
            boxShadow: "0 0 10px 2px rgba(239, 68, 68, 0.8)",
          }}
        />
      ))}
    </div>
  );
}
