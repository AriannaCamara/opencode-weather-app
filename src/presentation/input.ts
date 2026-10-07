export interface Input {
  ask(question: string): Promise<string | null>;
  close(): void;
}

export function createInput(): Input {
  const reader = Bun.stdin.stream().pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  const takeLine = (): string => {
    const newline = buffer.indexOf("\n");
    const raw = newline === -1 ? buffer : buffer.slice(0, newline);
    buffer = newline === -1 ? "" : buffer.slice(newline + 1);
    return raw.replace(/\r$/, "");
  };

  return {
    async ask(question: string): Promise<string | null> {
      process.stdout.write(question);

      for (;;) {
        if (buffer.includes("\n")) return takeLine();

        const { done, value } = await reader.read();
        if (done) {
          const rest = takeLine();
          return rest.trim() === "" ? null : rest;
        }
        buffer += value;
      }
    },
    close(): void {
      void reader.cancel();
    },
  };
}

export function isAffirmative(answer: string): boolean {
  const normalized = answer.trim().toLowerCase();
  return normalized === "s" || normalized === "si" || normalized === "sí";
}
