import { version } from "../index.js";
import { Task } from "../lib/Task.js";

export class HelpTask extends Task {
	override name = "help";
	override description = "Shows this list or gets help on a task.";
	override usage = "[task]";

	override async validateArguments(args: string[]) {
		if (args.length === 0) return;
		if (args.length > 1) return "Too many arguments.";

		return this.getTask(args[0]) ? undefined : `Invalid task "${args[0]}"`;
	}

	tasks: Task[] = [];

	getTask(name: string) {
		for (let i = 0; i < this.tasks.length; i++) {
			const element = this.tasks[i];
			if (element.name === name) return element;
		}
		return null;
	}

	override async run(args: string[]) {
		console.log(`Neomanager v${version}`);
		if (args.length === 0) {
			console.log("Valid tasks:");

			for (let i = 0; i < this.tasks.length; i++) {
				const element = this.tasks[i];
				console.log(`${element.name}: ${element.description}`);
			}
			return;
		}

		const task = this.getTask(args[0])!;

		console.log(`${task.name}`);
		console.log(`${task.description}`);
		console.log(`\nUsage: ${task.name} ${task.usage}`);
	}
}
