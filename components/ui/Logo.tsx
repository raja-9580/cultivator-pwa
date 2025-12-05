export default function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/akaththi.png"
      alt="Akaththi Farms"
      className={className}
      decoding="async"
    />
  );
}
