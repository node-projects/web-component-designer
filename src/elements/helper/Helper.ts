export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function exportData(blob: Blob, fileName: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.style.display = 'none';
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  await sleep(300);
}

export function dataURItoBlob(dataURI) {
  var mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
  var binary = atob(dataURI.split(',')[1]);
  var array = [];
  for (var i = 0; i < binary.length; i++) {
     array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {type: mime});
}

