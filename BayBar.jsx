// Ten painted bays. Filled bays are taken. Reads like the lot itself, not a progress bar.
export default function BayBar({ occ, level, size = 'sm' }) {
  const taken = Math.round(occ * 10);
  return (
    <div className={`bays bays-${size} lvl-${level}`} role="img" aria-label={`About ${Math.round(occ * 100)}% occupied`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={i < taken ? 'bay taken' : 'bay'} />
      ))}
    </div>
  );
}
