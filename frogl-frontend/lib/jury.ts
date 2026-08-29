export const JURY_SLUGS = [
  "tecnico",
  "tiktok",
  "recien-llegado",
  "actitud",
] as const;

export type JurySlug = (typeof JURY_SLUGS)[number];

export type JurySeat = {
  slug: JurySlug;
  name: string;
  role: string;
  color: string;
  cssVar: string;
  policy: string;
};

export const JURY: Record<JurySlug, JurySeat> = {
  tecnico: {
    slug: "tecnico",
    name: "Dra. Elena Vargas",
    role: "Técnica",
    color: "#38bdf8",
    cssVar: "--jury-tecnico",
    policy: "escuchó todo",
  },
  tiktok: {
    slug: "tiktok",
    name: "Kevin",
    role: "Atención corta",
    color: "#ff8fab",
    cssVar: "--jury-tiktok",
    policy: "ventana de 20s",
  },
  "recien-llegado": {
    slug: "recien-llegado",
    name: "Marco Ibáñez",
    role: "Llegó tarde",
    color: "#fbbf24",
    cssVar: "--jury-late",
    policy: "entró al 1:30",
  },
  actitud: {
    slug: "actitud",
    name: "Rosa Puentes",
    role: "Actitud",
    color: "#2dd4a8",
    cssVar: "--jury-actitud",
    policy: "escuchó todo",
  },
};

export const JURY_LIST = JURY_SLUGS.map((slug) => JURY[slug]);
