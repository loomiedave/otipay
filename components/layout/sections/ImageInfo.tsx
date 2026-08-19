import Image from "next/image";

interface Moment {
  image: string;
  location: string;
}

const moments: Moment[] = [
  {
    image: "/twoladies.jpg",
    location: "Accra - Lome",
  },
  {
    image: "/blackguy.jpg",
    location: "Lagos - Cotonou",
  },
  {
    image: "/vam.jpg",
    location: "Accra - Lagos ",
  },
];

export default function ImageInfoSection () {
  return (
    <section id="info" className="container py-24 sm:py-32">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-lg text-primary mb-2 tracking-wider">
          Reliable Transactions
        </h2>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Every Transfer Reaches Someone
        </h2>
        <p className="text-xl text-muted-foreground">
          Hundreds of families and businesses across West Africa trust
          OTPay to get money where it needs to go.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {moments.map((m) => (
          <div
            key={m.location}
            className="group relative overflow-hidden rounded-2xl"
          >
            <Image
              src={m.image}
              alt={`receiving a transfer in ${m.location}`}
              width={600}
              height={750}
              className="h-[420px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/80 via-brand-ink/10 to-transparent" />

            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-brand-ink/70 px-3 py-1.5 backdrop-blur-sm">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-coral opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-brand-coral" />
              </span>
            </div>

            <div className="absolute bottom-4 left-4">
              {/* <p className="font-semibold text-white">{m.name}</p> */}
              <p className="text-sm text-white/70">{m.location}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
