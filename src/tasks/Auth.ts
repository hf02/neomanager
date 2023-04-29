import { Task } from "../lib/Task.js";

export class AuthTask extends Task {
	override name = "auth";
	override description = "Logs into Neocities.";
	override usage = "";

	override async validateArguments(args: string[]) {
		if (args.length !== 0) return "Too many arguments.";
	}

	override async run(args: string[]) {
		const asked = await this.neocities.auth();
		if (!asked) {
			console.log(
				`Logged in as ${await this.neocities.domain()}\nGive an empty username to log out.`,
			);
			await this.neocities.auth(true);
		}
		if (!this.neocities.authorization) {
			console.log("Now logged out.");
			return;
		}
		console.log(`Now logged in as ${await this.neocities.domain()}`);
	}
}
