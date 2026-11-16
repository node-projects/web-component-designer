import type { IService } from '../IService.js';

/** Translates designer-owned text. Parameter values are user content and must remain unchanged. */
export interface ITranslationService extends IService {
  translate(text: string, params?: Readonly<Record<string, string>>): string;
  readonly languageChanged?: { on(listener: () => void): { dispose(): void } };
}
