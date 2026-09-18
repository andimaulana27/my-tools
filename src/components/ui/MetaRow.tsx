export type MetaItem = {
  label: string;
  value: string;
};

export function MetaRow({ items }: { items: MetaItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-text-faint">{item.label}</dt>
          <dd className="mt-1.5 text-sm text-text">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
