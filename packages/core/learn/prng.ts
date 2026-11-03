export interface SeededRng {
  nextFloat(): number;
  nextInt(min: number, max: number): number;
  shuffle<T>(array: T[]): T[];
}

export class Mulberry32 implements SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  nextFloat(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min)) + min;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      const temp = result[i];
      result[i] = result[j]!;
      result[j] = temp!;
    }
    return result;
  }
}
