import { Neocities } from "src/neocities.js";

/**
 * Basically just a subcommand.
 */
export class Task {
	/**
	 * The name. Used in the CLI like so: `neomanager task-name-here`
	 */
	name: string;
	/**
	 * The description, used in help. Example: `"Orders a free pizza."`
	 */
	description: string;
	/**
	 * The arguments used in help. Don't include the name or `neomanager` bit at the start, so a task with no arguments should just be `""`
	 */
	usage: string;

	constructor(readonly neocities: Neocities) {}

	/**
	 * Validates arguments to ensure that they're correct before running the task.
	 * @param args The parsed arguments.
	 * @returns `void` if fine, `string` if invalid.
	 */
	async validateArguments(args: string[]): Promise<void | string> {
		if (args.length === 0) {
			return;
		}
		return "Too many arguments.";
	}

	/**
	 * Runs the task.
	 * @param args The arguments.
	 */
	async run(args: string[]) {}
}
