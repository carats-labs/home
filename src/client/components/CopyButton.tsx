interface CopyProps {
  readonly data: string;
  readonly label: string;
  readonly copied: string;
}
/**
 * The copy control.
 *
 * The label is carried in a `data-` attribute rather than baked into the click
 * handler, so the same component works in all three locales: one implementation,
 * three strings, and switching language cannot leave a stale label behind.
 */
export default function CopyButton({ data, label, copied }: CopyProps) {
  return (
    <button type="button" class="copy" data-copy={data} data-label={label} data-copied-label={copied}>
      {label}
    </button>
  );
}
