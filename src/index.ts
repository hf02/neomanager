import { Neocities } from "./neocities.js";

import { UploadTask } from "./tasks/Upload.js";
import { Task } from "./lib/Task.js";
import { HelpTask } from "./tasks/Help.js";
import { AuthTask } from "./tasks/Auth.js";
import { DownloadTask } from "./tasks/Download.js";
import { ensureConfig } from "./storage.js";

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const { version } = require("../package.json");

(async () => {
	try {
		const args = process.argv.slice(2);

		if (version) {
			console.log(`Neomanager v${version}`);
		} else {
			console.log(`Neomanager`);
		}
		console.log("");

		await ensureConfig();

		const neocities = new Neocities();

		const helpTask = new HelpTask(neocities);
		const tasks = [
			helpTask,
			new AuthTask(neocities),
			new UploadTask(neocities),
			new DownloadTask(neocities),
		];

		helpTask.tasks = tasks;

		let task: Task | null = null;
		if (args.length > 0) {
			for (let i = 0; i < tasks.length; i++) {
				const element = tasks[i];
				if (element.name === args[0]) {
					task = element;
					break;
				}
			}
		}

		if (task) {
			const taskArgs = args.slice(1);
			const validate = await task.validateArguments(taskArgs);
			if (validate != null) {
				console.log(`Error: ${validate}\n`);
				await helpTask.run([task.name]);
				return;
			}

			await task.run(taskArgs);
		} else {
			await helpTask.run([]);
		}
		process.exit(0);
	} catch (e) {
		console.error(e);

		const errorString = `    ${e}`.split("\n").join("\n    ");
		console.log(`\n\nAn error has occurred.\n${errorString}\n`);
		process.exit(1);
	}
})();
