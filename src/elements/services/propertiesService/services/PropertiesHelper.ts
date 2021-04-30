export class PropertiesHelper {
  public static isTypescriptEnum(value: any) {
    if (value && typeof value === 'object' && value.constructor == Object) {
      for (let k in value) {
        const tp = typeof value[k];
        if (tp !== 'string' && tp !== 'number')
          return false;
      }
      return true;
    }
    return false;
  }

  public static getTypescriptEnumEntries(value: any): [name: string, value: string | number][] {
    let ret: [name: string, value: string | number][] = [];
    for (let k in value) {
      if (isNaN(<any>k))
        ret.push([k, value[k]]);
    }
    return ret;
  }

  public static camelToDashCase(text: string) {
    return text.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
  }

  public static dashToCamelCase(text: string) {
    return text.replace(/-([a-z])/i, (i) => i[1].toUpperCase());
  }
}