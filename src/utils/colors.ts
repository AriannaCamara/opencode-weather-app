export interface Palette {
  reset: string;
  bold: string;
  dim: string;
  cyan: string;
  yellow: string;
  green: string;
  red: string;
}

const ANSI_PALETTE: Palette = {
  reset: "\u001B[0m",
  bold: "\u001B[1m",
  dim: "\u001B[2m",
  cyan: "\u001B[36m",
  yellow: "\u001B[33m",
  green: "\u001B[32m",
  red: "\u001B[31m",
};

const PLAIN_PALETTE: Palette = {
  reset: "",
  bold: "",
  dim: "",
  cyan: "",
  yellow: "",
  green: "",
  red: "",
};

export function createPalette(enabled: boolean): Palette {
  return enabled ? ANSI_PALETTE : PLAIN_PALETTE;
}

// Spec de no-color.org + convención de FORCE_COLOR: la salida sin TTY o
// redirigida a un archivo no lleva códigos ANSI.
export function shouldUseColor(): boolean {
  if (process.env.NO_COLOR) return false;

  const force = process.env.FORCE_COLOR;
  if (force !== undefined) return force !== "0" && force !== "false";

  if (process.env.TERM === "dumb") return false;
  return process.stdout.isTTY === true;
}

export const colors = createPalette(shouldUseColor());

export type Style = Exclude<keyof Palette, "reset">;

// Varios estilos se abren juntos y se cierran con un solo reset.
export function paint(text: string, ...styles: Style[]): string {
  const codes = styles.map((style) => colors[style]).filter((code) => code !== "");
  return codes.length === 0 ? text : `${codes.join("")}${text}${colors.reset}`;
}
