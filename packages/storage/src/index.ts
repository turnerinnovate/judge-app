import fs from 'fs';
import path from 'path';

export class LocalStorageAdapter {
  constructor(private root = process.env.LOCAL_STORAGE_ROOT || './data/storage') {}
  async put(key: string, data: Buffer) {
    const filePath = path.join(this.root, key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, data);
    return { key, uri: `local://${key}` };
  }
}
