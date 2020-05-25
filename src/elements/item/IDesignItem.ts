import { ServiceContainer } from "../services/ServiceContainer";
import { InstanceServiceContainer } from '../services/InstanceServiceContainer';

export interface IDesignItem {

  readonly name: string

  readonly hasAttributes: boolean;
  readonly attributes: Map<string, string>

  readonly hasStyles: boolean;
  readonly styles: Map<string, string>

  readonly hasChildren: boolean;
  children(): IterableIterator<IDesignItem>

  readonly hasContent: boolean;
  content: string

  element: Element;
  serviceContainer: ServiceContainer;
  instanceServiceContainer: InstanceServiceContainer;

  setStyle(name: keyof CSSStyleDeclaration, value?: string | null);
  removeStyle(name: keyof CSSStyleDeclaration);

  setAttribute(name: string, value?: string | null);
  removeAttribute(name: string);
}