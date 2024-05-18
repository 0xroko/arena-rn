import { useState } from "react";

export const useRandomSeed = () => {
  const [seed, setSeed] = useState<number>(
    Math.round(Math.random() * 10000000)
  );
  return [seed, () => setSeed(Math.round(Math.random() * 10000000))] as const;
};
