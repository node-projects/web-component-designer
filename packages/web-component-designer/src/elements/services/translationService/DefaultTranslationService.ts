import type { ITranslationService } from './ITranslationService.js';

/** Uses the supplied English text when a host has not registered a translator. */
export class DefaultTranslationService implements ITranslationService {
  translate(text: string, params?: Readonly<Record<string, string>>): string {
    return text.replace(/\{(\w+)\}/g, (placeholder, name) =>
      params && Object.hasOwn(params, name) ? params[name] : placeholder);
  }
}
