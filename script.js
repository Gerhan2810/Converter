const filesInput = document.getElementById('files');
const mode = document.getElementById('mode');
const targetSize = document.getElementById('targetSize');
const renameToggle = document.getElementById('renameToggle');
const renameBase = document.getElementById('renameBase');
const resizeToggle = document.getElementById('resizeToggle');
const maxDim = document.getElementById('maxDim');
const startBtn = document.getElementById('start');
const progress = document.getElementById('progress');
const preview = document.getElementById('preview');
const downloadZip = document.getElementById('downloadZip');

renameToggle.onchange = () => renameBase.disabled = !renameToggle.checked;
resizeToggle.onchange = () => maxDim.disabled = !resizeToggle.checked;

filesInput.onchange = () => {
  preview.innerHTML = '';
  [...filesInput.files].forEach(f => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(f);
    preview.appendChild(img);
  });
};

startBtn.onclick = async () => {
  const zip = new JSZip();
  const files = [...filesInput.files];
  progress.value = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    let { width, height } = img;

    if (resizeToggle.checked && maxDim.value) {
      const scale = Math.min(1, maxDim.value / Math.max(width, height));
      width *= scale;
      height *= scale;
    }

    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);

    const format = mode.value === 'compress'
      ? file.type
      : `image/${mode.value}`;

    const blob = await compressToTarget(canvas, format, targetSize.value * 1024 * 1024);

    const ext = format.split('/')[1];
    const name = renameToggle.checked
      ? `${renameBase.value}_${String(i+1).padStart(2,'0')}.${ext}`
      : file.name.replace(/\.\w+$/, `.${ext}`);

    zip.file(name, blob);
    progress.value = ((i+1)/files.length)*100;
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadZip.href = URL.createObjectURL(zipBlob);
  downloadZip.download = 'images.zip';
  downloadZip.style.display = 'block';
};

function loadImage(file) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => res(img);
    img.src = URL.createObjectURL(file);
  });
}

async function compressToTarget(canvas, type, target) {
  let q = 0.9, blob;
  do {
    blob = await new Promise(r => canvas.toBlob(r, type, q));
    q -= 0.05;
  } while (blob.size > target && q > 0.1);
  return blob;
}