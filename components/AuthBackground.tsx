export default function AuthBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-white">
      <div className="absolute left-1/4 top-[-6rem] h-72 w-72 animate-blob rounded-full bg-accent-200/50 blur-3xl" />
      <div className="absolute right-1/4 top-1/3 h-72 w-72 animate-blob rounded-full bg-fuchsia-200/40 blur-3xl [animation-delay:4s]" />
      <div className="absolute bottom-[-6rem] left-1/2 h-72 w-72 animate-blob rounded-full bg-sky-200/40 blur-3xl [animation-delay:8s]" />
      <div className="absolute inset-0 bg-grid-pattern bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]" />
    </div>
  );
}
