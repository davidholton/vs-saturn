/* eslint-disable @typescript-eslint/naming-convention */
import {Timer} from "./timer";

const enum PomodoroStates {
	WORKING,
	BREAK,
	PAUSED,
}

export class Pomodoro {
	public timer: Timer;
	
	public state: PomodoroStates;
	cycles: number;
	maxCycles: number;

	workTime: number;
	shortBreakTime: number;
	longBreakTime: number;
	snoozeTime: number; 

	public onCompletedCycle: undefined | {(completed: number, total: number): void};
	public snoozePrompt: undefined | {(): Promise<string | undefined>};
	public onTick: undefined | {(): void};

	constructor(maxCycles: number, workTime: number, shortBreakTime: number, longBreakTime: number, snoozeTime: number) { 
		this.maxCycles = maxCycles;
		this.workTime = workTime;
		this.shortBreakTime = shortBreakTime;
		this.longBreakTime = longBreakTime;
		this.snoozeTime = snoozeTime;
		
		this.timer = new Timer(workTime);
		this.timer.onCompleted = () => {this.onCompleted();};
		this.timer.onTick = () => {
			if (this.onTick) {
				this.onTick();
			}
		};

		this.state = PomodoroStates.PAUSED;
		this.cycles = 0;

		return;
	}

	onCompleted(): void {
		if (this.promptToSnooze()) {
			return;
		}

		if (this.state === PomodoroStates.WORKING) {
			this.cycles = (this.cycles + 1) % (this.maxCycles + 1);

			if (this.onCompletedCycle) {
				this.onCompletedCycle(this.cycles, this.maxCycles);
			}
			
			if (this.cycles === this.maxCycles) {
				this.timer.reset(this.longBreakTime);
			} else {
				this.timer.reset(this.shortBreakTime);
			}
			this.timer.resume();

			this.state = PomodoroStates.BREAK;

		} else if (this.state === PomodoroStates.BREAK) {
			if (this.cycles === this.maxCycles) {
				this.cycles = 0;

				if (this.onCompletedCycle) {
					this.onCompletedCycle(this.cycles, this.maxCycles);
				}
			}

			this.timer.reset(this.workTime);
			this.timer.resume();

			this.state = PomodoroStates.WORKING;
		}

		return;
	}

	// The most vulgar code I've ever written. I have learned nothing about Promises.
	private async promptToSnooze(): Promise<boolean> {
		if (this.snoozePrompt) {
			// Return true or false from a prompt to add snooze time
			await this.snoozePrompt().then((result: any) => {
				if (result === "Snooze") {
					this.timer.addTime(this.snoozeTime);
					this.timer.resume();

					return true;
				}

				return false;
			});
		}

		return false;
	}

	resume(): boolean {
		if (this.state !== PomodoroStates.PAUSED) {
			return false;
		}

		if (!this.timer.resume()) {
			return false;
		}

		this.state = PomodoroStates.WORKING;

		return true;
	}

	pause(): boolean {
		if (this.state !== PomodoroStates.WORKING) {
			return false;
		}

		if (!this.timer.pause()) {
			return false;
		}

		this.state = PomodoroStates.PAUSED;

		return true;
	}

	reset(): void {
		this.timer.reset();
		this.state = PomodoroStates.PAUSED;

		return;
	}
}