import bytes from "bytes";

export class Loading {
	init() {
		console.log("");
		console.log("");
		console.log("");
		console.log("");
		console.log("");
		this.update();

		if (this.graphics) {
			this._interval = setInterval(() => {
				this.intermediateStart++;
				this.update();
			}, 50);
		}
	}

	private _interval: NodeJS.Timer | null = null;

	graphics = true;
	terminalWidth = 30;

	private _logs = ["", "", "", "", "", ""];

	current = 0;
	total = 0;
	title = "Loading";
	setTitle(title: string) {
		this.title = title;
		this.update();
	}

	detail = "";
	setDetail(detail: string) {
		this.detail = detail;
		this.update();
	}

	byteFormat = false;

	intermediateStart = 0;

	static readonly barFull = "█";
	static readonly barEmpty = " ";

	static generateValueProgressBar(
		current: number,
		max: number,
		width: number,
	) {
		let lines = "";

		const lineSegments = width - 7;

		for (let i = 0; i < lineSegments; i++) {
			if (i / lineSegments >= current / max || current === 0) {
				lines += this.barEmpty;
			} else {
				lines += this.barFull;
			}
		}

		const percent = `${~~((current / max) * 100)}`.padStart(3).slice(0, 3);

		return `▐${lines}▌ ${percent}%`;
	}

	static generateIntermediateProgressBar(start: number, width: number) {
		// 7 = account for percentage and []
		const lineSegments = width - 7;
		const lines: string[] = [];
		for (let i = 0; i < lineSegments; i++) {
			lines.push(this.barEmpty);
		}

		const intermediateWidth = 5;

		for (let i = 0; i < intermediateWidth; i++) {
			lines[(start + i) % lineSegments] = this.barFull;
		}

		return `▐${lines.join("")}▌     `;
	}

	generateProgressBar() {
		if (this.current === 0 && this.total === 0) {
			return Loading.generateIntermediateProgressBar(
				this.intermediateStart,
				this.terminalWidth,
			);
		} else {
			return Loading.generateValueProgressBar(
				this.current,
				this.total,
				this.terminalWidth,
			);
		}
	}

	static formatBytes(number: number) {
		return bytes(number, {
			fixedDecimals: true,
		});
	}

	generateNumbers() {
		if (this.current === 0 && this.total === 0) return "";

		return this.byteFormat
			? `${Loading.formatBytes(this.current)}/${Loading.formatBytes(
					this.total,
			  )}`
			: `${this.current}/${this.total}`;
	}

	progressCallback(current: number, max: number) {
		this.current = current;
		this.total = max;
	}

	logLines(lines: string[]) {
		this.terminalWidth = this.graphics
			? process.stdout.getWindowSize()[0]
			: this.terminalWidth;
		const newLogs = lines;
		if (!this.graphics) {
			console.log(newLogs.join("\n"));
			return;
		}
		process.stdout.cursorTo(0);
		process.stdout.moveCursor(0, -5);
		const oldLogs = [...this._logs];
		this._logs = newLogs;
		const toPrint = [...newLogs];
		for (let i = 0; i < toPrint.length; i++) {
			toPrint[i] = toPrint[i]
				.padEnd(oldLogs[i].length)
				.slice(0, this.terminalWidth);
		}
		process.stdout.write(`${toPrint.join("\n")}`);
	}

	update() {
		this.logLines([
			//
			this.title,
			this.generateProgressBar(),
			this.generateNumbers(),
			this.detail,
			"",
			"",
		]);
	}

	stop() {
		this.logLines(["", "", "", "", "", ""]);
		if (this._interval) clearInterval(this._interval);
		process.stdout.moveCursor(0, -5);
	}
}
