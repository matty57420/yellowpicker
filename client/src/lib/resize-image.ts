/**
 * Redimensionne une photo côté navigateur et la ré-encode en JPEG.
 * Allège l'upload depuis un téléphone et convertit les formats exotiques (HEIC…)
 * que le navigateur sait décoder mais que le serveur refuse.
 */
export async function resizeImage(file: File, maxSize = 1024, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', quality);
  });
}
