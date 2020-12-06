/* eslint-disable @typescript-eslint/naming-convention */
export const enum TimerStates {
	RUNNING,
	PAUSED
}

// Amount of time in milliseconds between each tick
const INTERVAL_TIME_OUT: number = 1000;

export class Timer {
	public timeLeft: number;
	public defaultTime: number;

	private state: TimerStates;
	private interval: NodeJS.Timeout | undefined;

	public onTick: undefined | {(): void};
	public onCompleted: undefined | {(): void};

	/**
	 * Constructor for the [Timer](#Timer) class.
	 * @param defaultTime The starting time in seconds for the timer.
	 */
	constructor(defaultTime: number) {
		console.assert(defaultTime >= 0, `Timer(${defaultTime}), default time was not greater than or equal to zero.`);

		this.defaultTime = defaultTime;
		this.timeLeft = defaultTime;
		this.state = TimerStates.PAUSED;

		// this.resumeTimer();
		// this.pauseTimer();
	}

	/**
	 * Resume the timer. 
	 * @returns If the function was able to resume the timer.
	 */
	resume(): boolean {
		if (this.state === TimerStates.RUNNING) {
			// Already running
			return false;
		}

		// Important! "() => {this.tick();}" works, but this.tick does not.
		this.interval = setInterval(() => {this.tick();}, INTERVAL_TIME_OUT);
		this.state = TimerStates.RUNNING;

		return true;
	}

	/**
	 * Pause the timer.
	 * @returns If the function was able to pause the timer.
	 */
	pause(): boolean {
		if (this.state === TimerStates.PAUSED || this.interval === undefined) {
			// Already paused
			return false;
		}

		clearInterval(this.interval);
		this.state = TimerStates.PAUSED;

		return true;
	}

	/**
	 * Called on each interval of the Timer to subtract the time. Will call the [onCompleted()](#onCompleted) and [onTick()](#onTick) functions if applicable.
	 */
	tick(): void {
		if (this.onTick !== undefined) {
			this.onTick();
		}

		if (this.timeLeft <= 0) {
			this.pause();

			if (this.onCompleted !== undefined) {
				this.onCompleted();
			}
		}

		this.timeLeft -= INTERVAL_TIME_OUT / 1000;
		
		return;
	}

	/**
	 * Adds time to a timer.
	 * @param time Seconds added to the timer in as an integer.
	 */
	addTime(time: number): void {
		console.assert(time >= 0, `addTime(${time}), time was not greater than or equal to zero.`);

		this.timeLeft += time;

		return;
	}

	/**
	 * Reset and pause the timer.
	 * @param time Time to reset the timer to, defaults to the defaultTime.
	 */
	reset(time: number = this.defaultTime): void {
		this.pause();
		this.timeLeft = time;

		return;
	}

	/**
	 * Converts the timer into a string.
	 * @returns A string in the format MM:SS, or HH:MM:SS if applicable.
	 */
	toString(): string {
		// If the t is less than 10 we make sure to append a leading 0 infront of it
		function appendLeadZero(t: number): string {
			return `${t < 10 ? "0" + t : t}`;
		}

		let hr:  number = Math.floor(this.timeLeft / 3600);
		let min: number = Math.floor((this.timeLeft % 3600) / 60);
		let sec: number = Math.floor(this.timeLeft % 60);

		let str = "";
		if (hr > 0) {
			str += appendLeadZero(hr) + ":";
		}
		str += appendLeadZero(min) + ":";
		str += appendLeadZero(sec);

		return str;
	}
}