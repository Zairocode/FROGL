"use client";

import { useId } from "react";
import type { JuryExpression, JurySlug } from "@/lib/transcript-types";

/**
 * SVG original: public/avatars/avatar-boy-male-5.svg (SVG Repo).
 * Mismas paths — solo se sustituyen fills por jurado.
 */

type Props = {
  slug: JurySlug;
  /** Color del perfil, para jueces que no tienen paleta dibujada a mano. */
  accent?: string;
  expression?: JuryExpression;
  size?: number;
};

type Colors = {
  shirt: string;
  collar: string;
  pocket: string;
  skin: string;
  skinShade: string;
  hair: string;
  iris: string;
  pupil: string;
};

const COLORS: Record<string, Colors> = {
  tiktok: {
    shirt: "#ff8fab",
    collar: "#a3a3a2",
    pocket: "#a3a3a2",
    skin: "#ffc8b4",
    skinShade: "#f4ab90",
    hair: "#5d1c16",
    iris: "#ac7d14",
    pupil: "#342607",
  },
  tecnico: {
    shirt: "#38bdf8",
    collar: "#a3a3a2",
    pocket: "#a3a3a2",
    skin: "#ffc8b4",
    skinShade: "#f4ab90",
    hair: "#5d1c16",
    iris: "#ac7d14",
    pupil: "#342607",
  },
  "recien-llegado": {
    shirt: "#6b7280",
    collar: "#a3a3a2",
    pocket: "#fbbf24",
    skin: "#ffc8b4",
    skinShade: "#f4ab90",
    hair: "#5d1c16",
    iris: "#ac7d14",
    pupil: "#342607",
  },
  actitud: {
    shirt: "#2dd4a8",
    collar: "#a3a3a2",
    pocket: "#a3a3a2",
    skin: "#ffc8b4",
    skinShade: "#f4ab90",
    hair: "#5d1c16",
    iris: "#ac7d14",
    pupil: "#342607",
  },
};

export function JuryBust({ slug, size = 160, accent }: Props) {
  const uid = useId().replace(/:/g, "");
  // Los jueces nuevos (comercial, usuario…) no tienen paleta propia:
  // heredan la del tecnico con la camisa del color de su perfil.
  const base = COLORS[slug] ?? COLORS.tecnico;
  const c = COLORS[slug] ? base : { ...base, shirt: accent ?? base.shirt };
  const clipId = `clip-Chr_5-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <clipPath id={clipId}>
          <rect height="512" width="512" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {/* sin rect blanco de fondo — transparente */}
        <g>
          {/* 8. Back Hair */}
          <circle
            cx="127"
            cy="127"
            fill={c.hair}
            r="127"
            transform="translate(129 24)"
          />

          {/* 7. Arm L */}
          <g>
            <circle
              cx="60"
              cy="60"
              fill={c.shirt}
              r="60"
              transform="translate(80 341)"
            />
            <rect
              fill={c.shirt}
              height="111"
              transform="translate(80 401)"
              width="68"
            />
          </g>

          {/* 6. Arm R */}
          <g>
            <circle
              cx="60"
              cy="60"
              fill={c.shirt}
              r="60"
              transform="translate(313 341)"
            />
            <rect
              fill={c.shirt}
              height="111"
              transform="translate(363 401)"
              width="70"
            />
          </g>

          {/* 5. Main Body */}
          <g>
            <rect
              fill={c.shirt}
              height="171"
              transform="translate(140 341)"
              width="233"
            />
            <path
              d="M40,20.849c20,0,40-2.941,40,19.151v6A40,40,0,0,1,0,46V40C0,17.909,20,20.849,40,20.849Z"
              fill={c.collar}
              transform="translate(217 319)"
            />
            <path
              d="M0,0H85L80.373,58.127,43.417,77.885,5.623,58.7Z"
              fill={c.pocket}
              transform="translate(288 434)"
            />
          </g>

          {/* 4. Face Body */}
          <g>
            <rect
              fill={c.skinShade}
              height="147"
              rx="27"
              transform="translate(229 245)"
              width="54"
            />
            <rect
              fill={c.skinShade}
              height="76"
              rx="16.5"
              transform="translate(140 164)"
              width="33"
            />
            <rect
              fill={c.skinShade}
              height="76"
              rx="16.5"
              transform="translate(340 166)"
              width="33"
            />
            <rect
              fill={c.skin}
              height="258"
              rx="100"
              transform="translate(156 61)"
              width="200"
            />
            <rect
              fill={c.skinShade}
              height="91"
              rx="16.5"
              transform="translate(240 151)"
              width="33"
            />
            <path
              d="M33.5,19.924C59.806,19.6,69,7.387,69,16.5S53.054,39.464,34,39.464,0,25.613,0,16.5,7.189,20.245,33.5,19.924Z"
              fill="#ffffff"
              transform="matrix(0.951, -0.309, 0.309, 0.951, 241.114, 257.861)"
            />
          </g>

          {/* 3. Eye L */}
          <g>
            <ellipse
              cx="18.861"
              cy="18.861"
              fill={c.iris}
              rx="18.861"
              ry="18.861"
              transform="translate(185 151)"
            />
            <path
              d="M12.825,0c3.372,0,1.6,5.93,4.232,8.385,2.18,2.014,8.593.728,8.593,4.44A12.825,12.825,0,1,1,12.825,0Z"
              fill={c.pupil}
              transform="translate(191.036 157.035)"
            />
          </g>

          {/* 2. Eye R */}
          <g transform="translate(-2)">
            <path
              d="M18.861,0A18.861,18.861,0,1,1,0,18.861,18.861,18.861,0,0,1,18.861,0Z"
              fill={c.iris}
              transform="translate(291.79 151)"
            />
            <path
              d="M12.825,0c3.372,0,1.6,5.93,4.232,8.385,2.18,2.014,8.593.728,8.593,4.44A12.825,12.825,0,1,1,12.825,0Z"
              fill={c.pupil}
              transform="translate(297.826 157.035)"
            />
          </g>

          {/* 1. Front Hair */}
          <path
            d="M131.953,0C102.845,0,73.815,9.125,51.412,25.7c-31.2,23.087-32.371,57.11-53.161,83.022s-32.033,14.834-30,20.626c.718,2.044,39.262,18.383,83.159,18.425,53.424.052,100.656-17.912,113.133-25.753,22.507-16.85,25.014-32.5,25.014-32.5s-.757,27.035,8.233,44.8,30.806,37.47,46.1,36.226S258.5,144.312,258.5,133.421c0-22.075-4.975-46.927-14.611-65.231-1.579-3-3.272-5.929-5.227-9.024A126.223,126.223,0,0,0,131.953,0Z"
            fill={c.hair}
            transform="translate(125)"
          />
        </g>
      </g>
    </svg>
  );
}
