import * as path from "node:path";
import { createFsFileStorage } from "remix/file-storage/fs";

export const uploadsStorage = createFsFileStorage(path.resolve("tmp/uploads"));

/** Stores an uploaded file and returns the URL the uploads route serves it from. */
export async function saveUpload(fieldName: string, file: File): Promise<string> {
  let ext = file.name.split(".").pop() || "jpg";
  let key = `${fieldName}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  await uploadsStorage.set(key, file);

  return `/uploads/${key}`;
}
