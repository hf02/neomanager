import { ReadStream } from "fs";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { Loading } from "../loading.js";
import {
	NeocitiesErrorType,
	NeocitiesFile,
	NeocitiesRequestError,
} from "../neocities.js";
import { FileTask } from "../lib/FileTask.js";
import FormData from "form-data";

export class UploadTask extends FileTask {
	override name = "upload";
	override description = "Uploads a directory.";
	override usage = "<path>";

	override async validateArguments(args: string[]) {
		if (args.length === 1) {
			try {
				const stats = await fs.stat(args[0]);
				return stats.isDirectory() ? undefined : "Not a directory.";
			} catch {
				return "Invalid path.";
			}
		}
		return args.length === 0
			? "No file path given."
			: "Too many arguments.";
	}

	override async run(args: string[]) {
		const neocities = this.neocities;

		await neocities.auth();

		const destinationPath = args[0];

		const loading = new Loading();
		loading.init();
		loading.setDetail("Getting site files");
		const neocitiesFiles = await neocities.list();
		/**
		 * paths on the website mapped to a NeocitiesFile.
		 */
		const neocitiesFilePaths = new Map<string, NeocitiesFile>();

		loading.progressCallback(0, 0);
		loading.setDetail("Sorting site files");
		for (let i = 0; i < neocitiesFiles.length; i++) {
			const element = neocitiesFiles[i];
			if (!element.is_directory) {
				neocitiesFilePaths.set("/" + element.path, element);
			}
		}

		loading.setDetail("Reading directory");

		interface CrawledFile {
			diskPath: string;
			sitePath: string;
			size: number;
		}

		let files: CrawledFile[] = [];

		// simply loops over a directory.
		async function traverseDirectory(dir: string, sitePath = "/") {
			const paths = await fs.readdir(dir);
			for (let i = 0; i < paths.length; i++) {
				const filePah = paths[i];
				const location = path.join(dir, filePah);
				const siteLocation = path.posix.join(sitePath, filePah);
				try {
					const buffer = await fs.readFile(location);
					files.push({
						diskPath: location,
						sitePath: siteLocation,
						size: buffer.byteLength,
					});
				} catch (e) {
					if (e.code !== "EISDIR") {
						console.error(e);
					} else {
						await traverseDirectory(location, siteLocation);
					}
				}
			}
		}

		await traverseDirectory(destinationPath ?? ".");

		loading.setDetail("Checking files");

		const ignore = await this.ignoreResolver(destinationPath);
		files = files.filter((file) => !ignore(file.sitePath));

		const toUpload: [string, ReadStream][] = [];
		let toUploadCount = 0;

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			loading.progressCallback(i, files.length - 1);
			const maybeNeocitiesUpload = neocitiesFilePaths.get(file.sitePath);

			if (
				maybeNeocitiesUpload &&
				(await this.neocities.compareHashes(
					destinationPath,
					maybeNeocitiesUpload,
				))
			) {
				continue;
			}

			toUpload.push([
				file.sitePath,
				fsSync.createReadStream(file.diskPath),
			]);
			toUploadCount++;
		}

		if (toUploadCount === 0) {
			loading.update();
			console.log("Already up to date.");
			process.exit(1);
		}

		const formDatas: FormData[] = [];
		const formDataLengths: number[] = [];

		const batchAmount = 20;
		for (let i = 0; true; i += batchAmount) {
			const formData = new FormData();
			formDatas.push(formData);
			let fullBreak = false;
			for (let j = 0; j < batchAmount; j++) {
				const file = toUpload[i + j];

				if (file == null) {
					fullBreak = true;
					// remove the last formData, as it'll just be empty
					if (j === 0) {
						formDatas.pop();
					}
					break;
				}

				formData.append(file[0], file[1]);
			}

			if (fullBreak) break;
		}

		loading.progressCallback(0, 0);
		for (let i = 0; i < formDatas.length; i++) {
			const element = formDatas[i];
			const length = await new Promise<number>((resolve) => {
				element.getLength((err, length) => {
					resolve(length);
				});
			});
			formDataLengths.push(length);
			loading.total += length;
		}

		loading.setTitle(
			`${toUploadCount} uploading (${
				files.length - toUploadCount
			} skipped)`,
		);

		loading.byteFormat = true;

		for (let i = 0; i < formDatas.length; i++) {
			const element = formDatas[i];
			const elementLength = formDataLengths[i];

			loading.setDetail(`Batch ${i + 1}/${formDatas.length}`);

			const currentStart = loading.current;

			try {
				await neocities.upload(element, (current) => {
					loading.current = currentStart + current;
					if (current === elementLength) {
						loading.setDetail(
							`Batch ${i + 1}/${formDatas.length} (finishing up)`,
						);
					}
				});
			} catch (e) {
				const resolve = NeocitiesRequestError.resolveError(e);
				if (resolve === NeocitiesErrorType.InvalidFileType) {
					console.error(
						'You seem to have supporter-only file types while not being a supporter!\nYou can ignore these by placing "#*supporter" in your .neomanager-ignore.',
					);
					process.exit(1);
				}
			}
		}

		loading.setDetail("");
		console.log("Done.");
		process.exit(0);
	}
}
