import { Loading } from "../loading.js";
import { Task } from "../lib/Task.js";
import { timeoutPromise } from "../lib/timeoutPromise.js";

export class PizzaTask extends Task {
	override name = "pizza";
	override description = "Orders a free pizza.";
	override usage = "[toppings...]";

	override async validateArguments(args: string[]) {
		// all toppings are welcome here :)
		return;
	}

	override async run(args: string[]) {
		const loading = new Loading();
		loading.init();
		loading.setDetail("Ordering pizza");
		await timeoutPromise(1000 * 30);
		console.log("No one came to the counter.");
		process.exit(0);
	}
}
