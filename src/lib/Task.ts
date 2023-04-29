import { Neocities } from "src/neocities.js";

export class Task {
	name: string;
	description: string;
	usage: string;

	constructor(readonly neocities: Neocities) {}

	async validateArguments(args: string[]): Promise<void | string> {
		if (args.length === 0) {
			return;
		}
		return "Too many arguments.";
	}

	async run(args: string[]) {}
}
