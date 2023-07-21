import { Task } from "../lib/Task.js";
import { NeocitiesErrorType, NeocitiesRequestError } from "../neocities.js";

export class InfoTask extends Task {
	override name = "info";
	override description = "Gets info about a website.";
	override usage = "[site]";

	override async validateArguments(args: string[]) {
		if (args.length > 1) return "Too many arguments.";
	}

	formatDateString(date: string) {
		const time = new Date(date).toLocaleTimeString();
		const formattedDate = new Date(date).toLocaleDateString();
		return `${formattedDate} ${time}`;
	}

	formatNumber(number: number) {
		return number.toLocaleString();
	}

	override async run(args: string[]) {
		const givenSite = args[0];
		if (!args[0]) {
			await this.neocities.auth();
		}
		try {
			const info = await this.neocities.info(givenSite || undefined);

			// we're intentionally missing latest_ipfs_hash, as it doesn't seem to do anything.
			// if it does, then i have no idea what it returns.

			const domain = info.domain ?? `${info.sitename}.neocities.org`;
			console.log("");
			console.log(`${info.sitename} - ${domain}`);
			console.log(`  Views: ${this.formatNumber(info.views)}`);
			console.log(`   Hits: ${this.formatNumber(info.hits)}`);
			console.log(`   Tags: ${info.tags.join(", ")}`);
			console.log(`Created: ${this.formatDateString(info.created_at)}`);

			if (info.last_updated) {
				console.log(
					`Updated: ${this.formatDateString(info.last_updated)}`,
				);
			} else {
				console.log("Updated: Never");
			}
		} catch (e) {
			const error = NeocitiesRequestError.resolveError(e);
			if (error === NeocitiesErrorType.SiteNotFound) {
				console.error(`Couldn't find site ${givenSite}`);
				process.exit(1);
			}
			throw error;
		}
	}
}
