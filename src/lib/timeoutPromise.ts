/**
 * Like setTimeout, but a Promise.
 */
export function timeoutPromise(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => resolve(), ms);
	});
}
