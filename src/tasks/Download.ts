import { ReadStream } from "fs";
import fs from "fs-extra";
import fsSync from "fs";
import path from "path";
import { Loading } from "../loading.js";
import { Neocities, NeocitiesFile } from "../neocities.js";
import { FileTask } from "../lib/FileTask.js";

import crypto from "crypto";
import FormData from "form-data";
import https from "https";

export class DownloadTask extends FileTask {
	override name = "download";
	override description = "Downloads your website.";
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
		const destinationPath = args[0];

		await this.neocities.auth();
		const domain = await this.neocities.domain();

		const loading = new Loading();
		loading.init();

		loading.setDetail("Getting site files");

		const files = (await this.neocities.list()).filter(
			(v) => !v.is_directory,
		) as NeocitiesFile[];

		const toDownload: NeocitiesFile[] = [];

		let skipped = 0;
		loading.setDetail("Checking files");

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			loading.progressCallback(i, files.length - 1);
			try {
				if (await this.neocities.compareHashes(destinationPath, file)) {
					skipped++;
					continue;
				}
			} catch (e) {}
			toDownload.push(file);
		}

		if (toDownload.length === 0) {
			loading.update();
			console.log("Already up to date.");
			process.exit(1);
		}

		loading.setTitle(`Downloading (${skipped} skipped)`);
		loading.setDetail("");

		loading.total = 0;
		loading.current = 0;
		loading.byteFormat = true;

		for (let i = 0; i < toDownload.length; i++) {
			const element = toDownload[i];
			loading.total += element.size;
		}

		function download(url: string, to: string) {
			return new Promise<void>((resolve) => {
				const request = https.request(
					url,
					{
						method: "get",
					},
					async (res) => {
						if (res.statusCode === 200) {
							let chunks: Buffer[] = [];

							res.on("data", (data) => {
								chunks.push(data);
								loading.current += data.byteLength;
							});
							res.on("end", async () => {
								const buffer = Buffer.concat(chunks);
								await fs.ensureFile(to);
								await fs.writeFile(to, buffer);
								resolve();
							});
						} else if (res.statusCode === 301) {
							// handle cleaner links
							await download(res.headers.location ?? "", to);
							resolve();
						} else {
							console.error(
								`${res.statusCode} ${res.statusMessage}`,
							);
							process.exit(1);
						}
					},
				);
				request.end();
			});
		}

		for (let i = 0; i < toDownload.length; i++) {
			loading.setDetail(`${i + 1}/${toDownload.length}`);
			const element = toDownload[i];
			const myDir = path.resolve(destinationPath, element.path);

			await download("https://" + domain + `/${element.path}`, myDir);
		}

		loading.update();
		console.log("Done.");
		process.exit(0);
	}
}
