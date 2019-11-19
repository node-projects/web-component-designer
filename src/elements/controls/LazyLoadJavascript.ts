export class LazyLoadJavascript {
    static Load(file: string): Promise<boolean> {
        let checkName = '_$lazyLoad-' + file + '-loaded';
        if (window[checkName]) {
            return Promise.resolve(false)
        }

        return new Promise((resolve, reject) => {
            let el = document.createElement('script');
            el.src = file;
            el.onload = (e) => {
                window[checkName] = true;
                resolve(true);
            };
            window.document.head.appendChild(el);
        });
    }
}