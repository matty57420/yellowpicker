import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { FastifyRequest } from 'fastify';

import { HttpProblem } from './problem.ts';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface MultipartForm {
  fields: Record<string, string>;
  file: Buffer | null;
}

/** Lit un formulaire multipart contenant au plus un fichier. */
export async function readMultipart(request: FastifyRequest): Promise<MultipartForm> {
  const fields: Record<string, string> = {};
  let file: Buffer | null = null;
  for await (const part of request.parts({ limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } })) {
    if (part.type === 'file') {
      file = await part.toBuffer();
    } else if (typeof part.value === 'string') {
      fields[part.fieldname] = part.value;
    }
  }
  return { fields, file };
}

/** Détecte le format réel via les magic bytes (on ne fait pas confiance au Content-Type). */
function detectImageExtension(buffer: Buffer): string | null {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return 'jpg';
  }
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png';
  }
  if (
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

export class ImageStore {
  constructor(private readonly dir: string) {}

  /** Enregistre l'image et renvoie son nom de fichier. */
  async save(buffer: Buffer): Promise<string> {
    const ext = detectImageExtension(buffer);
    if (!ext) {
      throw new HttpProblem(415, 'Format non supporté', 'Image JPEG, PNG ou WebP attendue.');
    }
    await mkdir(this.dir, { recursive: true });
    const fileName = `${randomUUID()}.${ext}`;
    await writeFile(path.join(this.dir, fileName), buffer);
    return fileName;
  }

  async remove(fileName: string | null): Promise<void> {
    if (fileName) {
      await rm(path.join(this.dir, path.basename(fileName)), { force: true });
    }
  }
}

export function uploadUrl(fileName: string): string {
  return `/uploads/${fileName}`;
}
