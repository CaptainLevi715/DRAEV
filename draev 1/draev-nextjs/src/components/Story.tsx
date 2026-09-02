import Image from "next/image";

export default function Story() {
  return (
    <section
      id="story"
      className="px-5 md:px-8 py-20 md:py-24 max-w-7xl mx-auto border-t border-line"
    >
      <div className="grid md:grid-cols-2 gap-14 items-center">
        <div className="order-2 md:order-1">
          <h2 className="font-display text-4xl md:text-5xl uppercase leading-[0.95]">
            Started with pocket money and a dream.
          </h2>
          <p className="text-cream/80 mt-6 leading-relaxed">
            Draev began with a 15-year-old, a paintbrush, and no budget — no investors,
            no corporate backing, no factory line. Just a bedroom studio and the refusal
            to make anything that already exists.
          </p>
          <p className="text-cream/80 mt-4 leading-relaxed">
            Every shirt is painted once. Not printed, not repeated, not restocked. When
            it&rsquo;s gone, that exact piece is gone forever — because it was never
            meant for anyone but the one person who wears it.
          </p>
        </div>
        <div className="order-1 md:order-2 relative">
          <div className="paper-card p-3">
            <Image
              src="/images/no-future-tee-back.jpg"
              alt="Draev No Future hand-painted tee"
              width={800}
              height={800}
              className="w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
