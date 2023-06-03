import envPaths from "env-paths";
import fs from "fs-extra";
import path from "path";

const paths = envPaths("neomanager");
export const configFilePath = path.join(paths.config, "config.json");

export interface VNNConfig {
	token?: string;
	fileTypes: string[];
	/**
	 * any unknown
	 */
	corruptData?: string[];
}

export let config: VNNConfig = {
	fileTypes:
		"asc atom bin css csv dae eot epub geojson gif gltf gpg htm html ico jpeg jpg js json key kml knowl less manifest map markdown md mf mid midi mtl obj opml otf pdf pgp png rdf rss sass scss svg text tsv ttf txt webapp webmanifest webp woff woff2 xcf xml".split(
			" ",
		),
};

/**
 * makes sure the config file is there and that the one in memory is up to date
 */
export async function ensureConfig() {
	await fs.ensureFile(configFilePath);
	const read = await fs.readFile(configFilePath, "utf-8");
	try {
		config = { ...config, ...JSON.parse(read) };
	} catch {
		if (read) {
			config.corruptData ??= [];
			config.corruptData.push(read);
		}
		await saveConfig();
	}
}

/**
 * saves the config to disk
 */
export async function saveConfig() {
	await fs.writeFile(configFilePath, JSON.stringify(config));
}
