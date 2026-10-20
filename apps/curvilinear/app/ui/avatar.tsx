/** The reference app's deterministic avatar colour: a hue hashed from the name. */
function hueFor(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index++) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % 360;
}

function initialsFor(name: string): string {
  let initials = (name.match(/\b(\w)/g) ?? []).join("").slice(0, 2).toUpperCase();
  return initials.length === 1 ? initials + name.slice(1, 2).toLowerCase() : initials;
}

export function Avatar({ name }: { name: string }) {
  return (
    <span
      title={name}
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: `hsl(${hueFor(name)}, 52%, 38%)` }}
    >
      {initialsFor(name)}
    </span>
  );
}
