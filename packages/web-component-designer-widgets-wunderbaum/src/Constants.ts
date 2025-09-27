let imporUrl = new URL((import.meta.url));
export var assetsPath = imporUrl.origin + imporUrl.pathname.split('/').slice(0, -1).join('/') + '/../assets/';