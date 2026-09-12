import { Circle, Line, Path, Rect, Svg } from "react-native-svg";
import { useCores } from "@/lib/tema";

/**
 * Ícones do app.
 *
 * Desenhos do projeto Lucide (https://lucide.dev), licença ISC, embutidos
 * aqui como dados para evitar mais uma dependência nativa.
 */
const FORMAS: Record<string, { tag: string; props: Record<string, string> }[]> = {
  "arrow-left": [
    { tag: "Path", props: { d: "m12 19-7-7 7-7" } },
    { tag: "Path", props: { d: "M19 12H5" } }
  ],
  "book-open": [
    { tag: "Path", props: { d: "M12 5v16" } },
    { tag: "Path", props: { d: "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" } }
  ],
  "bookmark": [
    { tag: "Path", props: { d: "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z" } }
  ],
  "calendar-check": [
    { tag: "Path", props: { d: "M8 2v3" } },
    { tag: "Path", props: { d: "M16 2v3" } },
    { tag: "Rect", props: { x: "3", y: "3", width: "18", height: "18", rx: "2" } },
    { tag: "Path", props: { d: "M3 9h18" } },
    { tag: "Path", props: { d: "m9 15 2 2 4-4" } }
  ],
  "calendar-days": [
    { tag: "Path", props: { d: "M8 2v3" } },
    { tag: "Path", props: { d: "M16 2v3" } },
    { tag: "Rect", props: { x: "3", y: "3", width: "18", height: "18", rx: "2" } },
    { tag: "Path", props: { d: "M3 9h18" } },
    { tag: "Path", props: { d: "M8 13h.01" } },
    { tag: "Path", props: { d: "M12 13h.01" } },
    { tag: "Path", props: { d: "M16 13h.01" } },
    { tag: "Path", props: { d: "M8 17h.01" } },
    { tag: "Path", props: { d: "M12 17h.01" } },
    { tag: "Path", props: { d: "M16 17h.01" } }
  ],
  "check": [
    { tag: "Path", props: { d: "M20 6 9 17l-5-5" } }
  ],
  "chevron-left": [
    { tag: "Path", props: { d: "m15 18-6-6 6-6" } }
  ],
  "chevron-right": [
    { tag: "Path", props: { d: "m9 18 6-6-6-6" } }
  ],
  "church": [
    { tag: "Path", props: { d: "M10 9h4" } },
    { tag: "Path", props: { d: "M12 7v5" } },
    { tag: "Path", props: { d: "M14 21v-3a2 2 0 0 0-4 0v3" } },
    { tag: "Path", props: { d: "m18 9 3.52 2.147a1 1 0 0 1 .48.854V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.999a1 1 0 0 1 .48-.854L6 9" } },
    { tag: "Path", props: { d: "M6 21V7a1 1 0 0 1 .376-.782l5-3.999a1 1 0 0 1 1.249.001l5 4A1 1 0 0 1 18 7v14" } }
  ],
  "circle-alert": [
    { tag: "Circle", props: { cx: "12", cy: "12", r: "10" } },
    { tag: "Line", props: { x1: "12", x2: "12", y1: "8", y2: "12" } },
    { tag: "Line", props: { x1: "12", x2: "12.01", y1: "16", y2: "16" } }
  ],
  "clipboard-list": [
    { tag: "Rect", props: { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" } },
    { tag: "Path", props: { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" } },
    { tag: "Path", props: { d: "M12 11h4" } },
    { tag: "Path", props: { d: "M12 16h4" } },
    { tag: "Path", props: { d: "M8 11h.01" } },
    { tag: "Path", props: { d: "M8 16h.01" } }
  ],
  "ellipsis": [
    { tag: "Circle", props: { cx: "12", cy: "12", r: "1" } },
    { tag: "Circle", props: { cx: "19", cy: "12", r: "1" } },
    { tag: "Circle", props: { cx: "5", cy: "12", r: "1" } }
  ],
  "hand-heart": [
    { tag: "Path", props: { d: "M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" } },
    { tag: "Path", props: { d: "m14.45 13.39 5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95" } },
    { tag: "Path", props: { d: "m2 15 6 6" } },
    { tag: "Path", props: { d: "m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91" } }
  ],
  "highlighter": [
    { tag: "Path", props: { d: "m9 11-6 6v3h9l3-3" } },
    { tag: "Path", props: { d: "m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" } }
  ],
  "layout-dashboard": [
    { tag: "Rect", props: { width: "7", height: "9", x: "3", y: "3", rx: "1" } },
    { tag: "Rect", props: { width: "7", height: "5", x: "14", y: "3", rx: "1" } },
    { tag: "Rect", props: { width: "7", height: "9", x: "14", y: "12", rx: "1" } },
    { tag: "Rect", props: { width: "7", height: "5", x: "3", y: "16", rx: "1" } }
  ],
  "log-out": [
    { tag: "Path", props: { d: "m16 17 5-5-5-5" } },
    { tag: "Path", props: { d: "M21 12H9" } },
    { tag: "Path", props: { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" } }
  ],
  "moon": [
    { tag: "Path", props: { d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" } }
  ],
  "notebook-pen": [
    { tag: "Path", props: { d: "M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" } },
    { tag: "Path", props: { d: "M2 6h4" } },
    { tag: "Path", props: { d: "M2 10h4" } },
    { tag: "Path", props: { d: "M2 14h4" } },
    { tag: "Path", props: { d: "M2 18h4" } },
    { tag: "Path", props: { d: "M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" } }
  ],
  "pencil": [
    { tag: "Path", props: { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" } },
    { tag: "Path", props: { d: "m15 5 4 4" } }
  ],
  "plus": [
    { tag: "Path", props: { d: "M5 12h14" } },
    { tag: "Path", props: { d: "M12 5v14" } }
  ],
  "search": [
    { tag: "Path", props: { d: "m21 21-4.34-4.34" } },
    { tag: "Circle", props: { cx: "11", cy: "11", r: "8" } }
  ],
  "send": [
    { tag: "Path", props: { d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" } },
    { tag: "Path", props: { d: "m21.854 2.147-10.94 10.939" } }
  ],
  "settings": [
    { tag: "Path", props: { d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" } },
    { tag: "Circle", props: { cx: "12", cy: "12", r: "3" } }
  ],
  "share-2": [
    { tag: "Circle", props: { cx: "18", cy: "5", r: "3" } },
    { tag: "Circle", props: { cx: "6", cy: "12", r: "3" } },
    { tag: "Circle", props: { cx: "18", cy: "19", r: "3" } },
    { tag: "Line", props: { x1: "8.59", x2: "15.42", y1: "13.51", y2: "17.49" } },
    { tag: "Line", props: { x1: "15.41", x2: "8.59", y1: "6.51", y2: "10.49" } }
  ],
  "sun": [
    { tag: "Circle", props: { cx: "12", cy: "12", r: "4" } },
    { tag: "Path", props: { d: "M12 2v2" } },
    { tag: "Path", props: { d: "M12 20v2" } },
    { tag: "Path", props: { d: "m4.93 4.93 1.41 1.41" } },
    { tag: "Path", props: { d: "m17.66 17.66 1.41 1.41" } },
    { tag: "Path", props: { d: "M2 12h2" } },
    { tag: "Path", props: { d: "M20 12h2" } },
    { tag: "Path", props: { d: "m6.34 17.66-1.41 1.41" } },
    { tag: "Path", props: { d: "m19.07 4.93-1.41 1.41" } }
  ],
  "trash": [
    { tag: "Path", props: { d: "M10 11v6" } },
    { tag: "Path", props: { d: "M14 11v6" } },
    { tag: "Path", props: { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" } },
    { tag: "Path", props: { d: "M3 6h18" } },
    { tag: "Path", props: { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" } }
  ],
  "user": [
    { tag: "Path", props: { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" } },
    { tag: "Circle", props: { cx: "12", cy: "7", r: "4" } }
  ],
  "users": [
    { tag: "Path", props: { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" } },
    { tag: "Path", props: { d: "M16 3.128a4 4 0 0 1 0 7.744" } },
    { tag: "Path", props: { d: "M22 21v-2a4 4 0 0 0-3-3.87" } },
    { tag: "Circle", props: { cx: "9", cy: "7", r: "4" } }
  ],
  "x": [
    { tag: "Path", props: { d: "M18 6 6 18" } },
    { tag: "Path", props: { d: "m6 6 12 12" } }
  ],
};

export type NomeIcone = keyof typeof FORMAS;

const ELEMENTOS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  Circle: Circle,
  Line: Line,
  Path: Path,
  Rect: Rect,
};

export function Icone({
  nome,
  tamanho = 22,
  cor,
  espessura = 2,
}: {
  nome: NomeIcone;
  tamanho?: number;
  cor?: string;
  espessura?: number;
}) {
  const cores = useCores();
  const tinta = cor ?? cores.texto;
  const formas = FORMAS[nome] ?? [];

  return (
    <Svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke={tinta}
      strokeWidth={espessura}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {formas.map((forma, indice) => {
        const Elemento = ELEMENTOS[forma.tag];
        return Elemento ? <Elemento key={indice} {...forma.props} /> : null;
      })}
    </Svg>
  );
}
