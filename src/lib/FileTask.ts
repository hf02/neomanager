import parser from "gitignore-parser";
import fs from "fs-extra";
import path from "path";
import { Task } from "./Task.js";
import { config } from "../storage.js";

export class FileTask extends Task {
	async ignoreResolver(rootPath: string) {
		try {
			const read = await fs.readFile(
				path.join(rootPath, ".neomanager-ignore"),
				"utf-8",
			);
			const compiled = parser.compile(read);
			const readLines = read.replaceAll("\r", "").split("\n");
			const ignoreInvalid = readLines.includes("#!supporter");
			return (filePath: string) => {
				const fileExtension = path.extname(filePath).toLowerCase();
				const validFreeFile = config.fileTypes.includes(
					fileExtension.slice(1),
				);

				return (
					compiled.denies(filePath) ||
					(ignoreInvalid && !validFreeFile)
				);
			};
		} catch (e) {
			if (e.code !== "ENOENT") throw e;
		}
		return (_: string) => false;
	}
}
