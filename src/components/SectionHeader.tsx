export default function SectionHeader({ id, title, text }: { id?: string; title: string; text: string }) {
  return (
    <div className="max-w-[60ch]">
      <h2 id={id} className="font-geist text-heading font-medium">{title}</h2>
      <p className="mt-3 text-subheading text-fg2">{text}</p>
    </div>
  );
}
