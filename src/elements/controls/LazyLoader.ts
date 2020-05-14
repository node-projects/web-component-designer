export class LazyLoader {
  static LoadJavascript(file: string): Promise<boolean> {
    const checkName = '_' + file + '-loaded';
    if (LazyLoader[checkName]) {
      return Promise.resolve(false);
    }

    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = file;
      el.onload = e => {
        window[checkName] = true;
        resolve(true);
      };
      el.onerror = err => {
        reject(err);
      };
      window.document.head.appendChild(el);
    });
  }

  static LoadJavascripts(...files: string[]): Promise<boolean[]> {
    let p: Promise<boolean>[] = [];
    for (let f of files) {
      p.push(LazyLoader.LoadJavascript(f))
    }
    return Promise.all(p);
  }

  static LoadText(url: string) {
    return new Promise<string>(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.overrideMimeType('text/plain; charset=x-user-defined');
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
          });
        }
      };
      xhr.onerror = () => {
        reject({
          status: xhr.status,
          statusText: xhr.statusText,
        });
      };
      xhr.send();
    });
  }
}
