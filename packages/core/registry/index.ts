import type { AnswerChecker } from '../checking/types.js';
import { textChecker } from '../checking/text-checker.js';
import { mathChecker } from '../checking/math-checker.js';

export interface RegisterOptions {
  overwrite?: boolean;
}

export interface CardTypeDef {
  id: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

export interface CheckerDef {
  id: string;
  name?: string;
  description?: string;
  check?: (given: unknown, spec: unknown, options?: unknown) => unknown;
  [key: string]: unknown;
}

export interface ImporterDef {
  id: string;
  name?: string;
  detect?: (input: string) => boolean;
  parse?: (input: string, options?: unknown) => unknown;
  [key: string]: unknown;
}

export interface ExporterDef {
  id: string;
  name?: string;
  export?: (data: unknown, options?: unknown) => unknown;
  [key: string]: unknown;
}

export interface StudyModeDef {
  id: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

export interface RegistryCategoryMap {
  cardTypes: CardTypeDef;
  checkers: CheckerDef;
  importers: ImporterDef;
  exporters: ExporterDef;
  studyModes: StudyModeDef;
}

export type RegistryCategory = keyof RegistryCategoryMap;

export class Registry {
  private categories: {
    [C in RegistryCategory]: Map<string, RegistryCategoryMap[C]>;
  };

  constructor() {
    this.categories = {
      cardTypes: new Map<string, CardTypeDef>(),
      checkers: new Map<string, CheckerDef>(),
      importers: new Map<string, ImporterDef>(),
      exporters: new Map<string, ExporterDef>(),
      studyModes: new Map<string, StudyModeDef>(),
    };
  }

  public register<C extends RegistryCategory>(
    category: C,
    id: string,
    item: RegistryCategoryMap[C],
    options?: RegisterOptions
  ): void {
    const categoryMap = this.categories[category];
    if (!categoryMap) {
      throw new Error(`Unknown registry category: "${category}".`);
    }

    if (categoryMap.has(id) && !options?.overwrite) {
      throw new Error(
        `Item with id "${id}" is already registered in category "${category}". Pass { overwrite: true } to replace it.`
      );
    }

    categoryMap.set(id, item);
  }

  public get<C extends RegistryCategory>(category: C, id: string): RegistryCategoryMap[C] {
    const categoryMap = this.categories[category];
    if (!categoryMap) {
      throw new Error(`Unknown registry category: "${category}".`);
    }

    const item = categoryMap.get(id);
    if (!item) {
      throw new Error(`Item with id "${id}" not found in category "${category}".`);
    }

    return item;
  }

  public has<C extends RegistryCategory>(category: C, id: string): boolean {
    const categoryMap = this.categories[category];
    if (!categoryMap) {
      return false;
    }
    return categoryMap.has(id);
  }

  public list<C extends RegistryCategory>(category: C): RegistryCategoryMap[C][] {
    const categoryMap = this.categories[category];
    if (!categoryMap) {
      throw new Error(`Unknown registry category: "${category}".`);
    }
    return Array.from(categoryMap.values());
  }

  public unregister<C extends RegistryCategory>(category: C, id: string): boolean {
    const categoryMap = this.categories[category];
    if (!categoryMap) {
      return false;
    }
    return categoryMap.delete(id);
  }

  public registerChecker(checker: AnswerChecker, options?: RegisterOptions): void {
    this.register('checkers', checker.id, checker, options);
  }

  public getChecker(id: string): AnswerChecker | undefined {
    return this.has('checkers', id) ? (this.get('checkers', id) as unknown as AnswerChecker) : undefined;
  }
}

export const registry = new Registry();

// Register built-in checkers
registry.registerChecker(textChecker);
registry.registerChecker(mathChecker);
