import axios, { AxiosError, AxiosRequestConfig } from "axios";
import FormData from "form-data";
import https from "https";
import Progress from "progress-stream";
import { timeoutPromise } from "./lib/timeoutPromise.js";
import { Loading } from "./loading.js";
import { config, ensureConfig, saveConfig } from "./storage.js";
import readline from "readline/promises";
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import { IncomingMessage } from "http";

export type ProgressCallback = (current: number, max: number) => void;

export interface NeocitiesFile {
	path: string;
	is_directory: false;
	size: number;
	updated_at: string;
	sha1_hash: string;
}
export interface NeocitiesDirectory {
	path: string;
	is_directory: true;
	updated_at: string;
}

export interface NeocitiesInfo {
	sitename: string;
	hits: number;
	created_at: string;
	last_updated: string;
	domain: string | null;
	tags: string[];
}

export class Neocities {
	constructor() {}

	authorization: string | null;

	async getToken(username: string, password: string) {
		this.authorization = `Basic ${btoa(username + ":" + password)}`;
		return (await this.request("get", "key")).api_key;
	}

	async auth(force = false) {
		const loading = new Loading();
		await ensureConfig();
		let askedToLogIn = false;
		if (!config.token || force) {
			askedToLogIn = true;
			console.log("Note: Your token will be saved in plain-text.");
			console.log("");
			const rl = readline.createInterface(process.stdin, process.stdout);

			const username = await rl.question("  Username: ");
			if (username === "") {
				config.token = undefined;
				await saveConfig();
				this.authorization = null;
				return true;
			}
			const password = await rl.question("  Password: ");
			if (loading.graphics) {
				process.stdout.moveCursor(0, -1);
				process.stdout.clearLine(0);
				console.log("  Password: ******");
			}
			rl.close();

			loading.init();
			loading.setTitle("Fetching credentials");
			const key = await this.getToken(username, password);

			config.token = key;
			await saveConfig();
		} else {
			loading.init();
		}
		this.authorization = `Bearer ${config.token}`;
		loading.setTitle("Getting credentials");
		loading.stop();
		return askedToLogIn;
	}

	request(
		method: string,
		url: string,
		progCall?: ProgressCallback,
		formData?: FormData,
	) {
		return new Promise<any>((resolve, reject) => {
			const request = https.request(
				this.host + `/api/${url}`,
				{
					method: method,
					headers: {
						Authorization: this.authorization ?? "",
						...this.headers,
						...formData?.getHeaders(),
					},
				},
				(res) => {
					var body = "";

					res.on("data", function (chunk) {
						body += chunk;
					});

					res.on("end", function () {
						let resObj: any = null;
						let message = "...";
						try {
							resObj = JSON.parse(body);
							message = resObj.message;
						} catch (e) {
							message = "[error parsing data]";
							resObj = null;
						}

						if (resObj == null) {
							console.error(
								`Failed to parse Neocities's JSON response! Something might have gone terribly wrong. \nStatus code: ${res.statusCode}\nRaw data:\n`,
								body,
							);
							process.exit(1);
						}
						if (res.statusCode !== 200) {
							reject(new NeocitiesRequestError(res, message));
						}

						resolve(resObj);
					});
				},
			);

			if (formData) {
				const progress = Progress({ time: 50 });
				progress.on("progress", (p) => {
					progCall?.(p.transferred, p.remaining);
				});

				formData.pipe(progress).pipe(request);
			} else {
				request.end();
			}
		});
	}

	readonly host = `https://neocities.org`;
	readonly headers = {};

	async info(): Promise<NeocitiesInfo> {
		const request = await this.request("get", "info");
		return request.info;
	}

	async domain() {
		const info = await this.info();
		return info.domain ?? `${info.sitename}.neocities.org`;
	}

	async list(
		progress?: ProgressCallback,
	): Promise<(NeocitiesFile | NeocitiesDirectory)[]> {
		const request = await this.request("get", "list");
		return request.files;
	}

	async upload(files: FormData, progCall?: ProgressCallback) {
		await this.request("post", "upload", progCall, files);
	}

	async compareHashes(rootPath: string, neoFile: NeocitiesFile) {
		const localPath = path.resolve(rootPath, neoFile.path);
		const buffer = await fs.readFile(localPath);

		const shasum = crypto.createHash("sha1");
		shasum.update(buffer);
		const hash = shasum.digest("hex");

		return hash === neoFile.sha1_hash;
	}
}

export enum NeocitiesErrorTypes {
	InvalidFileType,
	Auth,
}

export class NeocitiesRequestError {
	constructor(readonly response: IncomingMessage, readonly message: string) {}

	toString() {
		return `${this.response.statusCode} ${this.response.statusMessage}: ${this.message}`;
	}

	static resolveError(err: unknown) {
		if (err instanceof NeocitiesRequestError) {
			if (err.message.includes("is not a valid file type")) {
				return NeocitiesErrorTypes.InvalidFileType;
			}
			throw err;
		} else {
			throw err;
		}
	}
}