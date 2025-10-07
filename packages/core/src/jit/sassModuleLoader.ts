import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface SassModuleLoader {
	loadDir(path: string): Promise<string[]>
	isDir(path: string): Promise<boolean>
	loadFile(path: string): Promise<string>
}

export class FsModuleLoader implements SassModuleLoader {
	private fs = fs;
	private dirname = path.dirname(fileURLToPath(import.meta.url));

	async loadDir(path: string): Promise<string[]> {
		return this.fs.readdir(path).catch(() => []);
	}

	async isDir(path: string): Promise<boolean> {
		return this.fs.stat(path).then((stat) => stat.isDirectory());
	}

	async loadFile(path: string): Promise<string> {
		return this.fs.readFile(path, 'utf8');
	}
}
