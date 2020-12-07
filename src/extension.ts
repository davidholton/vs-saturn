// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Pomodoro, PomodoroStates } from "./pomodoro";

interface ITask {
	label: string,
	completed: boolean,
}

interface IStatusBarConfig {
	alignment: vscode.StatusBarAlignment,
	priority: number,
	text: string,
	tooltip?: string,
	command?: string,
}

interface ITask {
	label: string,
	completed: boolean,
}

class TaskList {
	tasks: Array<ITask>;

	constructor() {
		this.tasks = [];
	}

	/**
	 * Adds a new [task](#ITask) to the task list.
	 * @param name A string of the new task name.
	 * @returns Returns true if task was added.
	 */
	addTask(name: string): Boolean {
		// Make sure the task name does not already exist
		var index: number = this.tasks.findIndex(x => x.label === name);

		if (index === -1) {
			// Task does not exist so we proceed
			const newTask: ITask = {label: name, completed: false};
			this.tasks.push(newTask);

			return true;
		}

		return false;
	}

	/**
	 * Removes a [task](#ITask) from the task list.
	 * @param name The name of the existing task to be deleted.
	 * @return Returns true if task was found in the list and removed.
	 */
	removeTask(name: string): Boolean {
		// Gets index of task
		var index: number = this.tasks.findIndex(x => x.label === name);

		if (index > -1) {
			// Task name was valid so we can now remove it
			this.tasks.splice(index, 1);

			return true;
		}

		return false;
	}

	/**
	 * Marks a [task](#ITask) as completed in the task list. If the task is already completed it is inverted.
	 * @param name The name of the existing task to be marked as complete.
	 * @return Boolean if task was found in the list and marked.
	 */
	markTask(name: string): Boolean {
		// Gets index of task
		var index: number = this.tasks.findIndex(x => x.label === name);

		if (index > -1) {
			// Task name was valid so we can now remove it
			this.tasks[index].completed = !this.tasks[index].completed;

			return true;
		}

		return false;
	}

	/**
	 * Returns a a string representation of the task list.
	 * @return String representation of the task list.
	 */
	toString(): string {
		var str: string = "";

		for (var task of this.tasks) {
			str += ` - ${task.label}: ${task.completed ? "completed" : "uncompleted"}\n`;
		}

		return str;
	};
}

/**
 * Creates a status bar item.
 * @param config A [param list](#IStatsBarConfig) to create a status bar item.
 * @return A new status bar item.
 */
function newStatusBarItem(config: IStatusBarConfig): vscode.StatusBarItem {
	const statusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(config.alignment, config.priority);
	statusBarItem.text = config.text;
	if (config.tooltip) {
		statusBarItem.tooltip = config.tooltip;
	}
	if (config.command) {
		statusBarItem.command = config.command;
	}

	return statusBarItem;
}

/**
 * Creates a string of Codicon checkmarks.
 * @param completed Number of filled checkmarks.
 * @param total Total number of checkmarks.
 * @return A string of Codicon checkmarks.
 */
function generateCheckmarks(completed: number, total: number): string {
	return "$(circle-filled)".repeat(completed) + "$(circle-outline)".repeat(total - completed);
}

/**
 * Creates a quick pick item from a [task item](#ITask).
 * @param taskItem The task item to create the quick pick item from.
 * @param picked Whether the quick pick item will be preemptively picked. Default true.
 * @return A new QuickPickItem that represents the taskItem.
 */
function newQuickPickItem(taskItem: ITask, picked: boolean = true): vscode.QuickPickItem {
	const quickPickItem: vscode.QuickPickItem = {label: taskItem.label};

	if (taskItem.completed === true) {
		quickPickItem.description = "$(check) Completed";
		quickPickItem.picked = picked && true;
	}

	return quickPickItem;
}

function getSettings(): Map<string, number> {
	const config = vscode.workspace.getConfiguration();
	
	let settings: Map<string, number> = new Map([
		["saturn.cycle.cycles", 4],
		["saturn.timers.workCycleTime", 25],
		["saturn.timers.shortBreakTime", 5],
		["saturn.timers.longBreakTime", 10],
		["saturn.timers.snoozeTime", 5]
	]);

	for (let [setting, value] of settings) {
		// It is under my impression that typecasting an unknown like this is
		let customValue = config.get(setting) as number;
		if (typeof customValue !== "number") {
			customValue = value;
		}

		if (setting.startsWith("saturn.timers")) {
			// Converts any setting inside "saturn.timers" to seconds
			customValue *= 60;
		}

		settings.set(setting, customValue);
	}

	return settings;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log("Congratulations, your extension 'vs-saturn' is now active!");

	const workTaskList: TaskList = new TaskList();
	const breakTaskList: TaskList = new TaskList();
	const tasklists: Array<TaskList> = [workTaskList, breakTaskList];

	// Decrement the variable so our StatusBarItems below are arranged in order
	let statusBarPriority: number = 0;

	const saturnTimerButton: vscode.StatusBarItem = newStatusBarItem({
		alignment: vscode.StatusBarAlignment.Left,
		priority: --statusBarPriority,
		text: "00:00",
		tooltip: "Time left in current cycle",
	});

	const saturnCheckmarks: vscode.StatusBarItem = newStatusBarItem({
		alignment: vscode.StatusBarAlignment.Left,
		priority: --statusBarPriority,
		text: "",
		tooltip: "Current progress of cycle"
	});

	const saturnStartButton: vscode.StatusBarItem = newStatusBarItem({
		alignment: vscode.StatusBarAlignment.Left,
		priority: --statusBarPriority,
		text: "$(play)",
		tooltip: "Pause/Resume timer",
		command: "vs-saturn.start",
	});

	const saturnTaskButton: vscode.StatusBarItem = newStatusBarItem({
		alignment: vscode.StatusBarAlignment.Left,
		priority: --statusBarPriority,
		text: "$(checklist)",
		tooltip: "View and mark tasks as completed",
		command: "vs-saturn.tasklist",
	});

	const saturnAddTaskButton: vscode.StatusBarItem = newStatusBarItem({
		alignment: vscode.StatusBarAlignment.Left,
		priority: --statusBarPriority,
		text: "$(add)",
		tooltip: "Add a task to the task list",
		command: "vs-saturn.addtask",
	});

	const buttons: Array<vscode.StatusBarItem> = [
		saturnTimerButton,
		saturnCheckmarks,
		saturnStartButton,
		saturnTaskButton,
		saturnAddTaskButton
	];

	// Show and push the buttons to VS Code interface
	for (var button of buttons) {
		button.show();
		context.subscriptions.push(button);
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	const settings: Map<string, number> = getSettings();
	const args: number[] = [
		settings.get("saturn.cycle.cycles") as number,
		settings.get("saturn.timers.workCycleTime") as number,
		settings.get("saturn.timers.shortBreakTime") as number,
		settings.get("saturn.timers.longBreakTime") as number,
		settings.get("saturn.timers.snoozeTime") as number
	];

	saturnCheckmarks.text = generateCheckmarks(0, args[0]);
	let pomodoro = new Pomodoro(args[0], args[1], args[2], args[3], args[4]);
	
	pomodoro.onCompletedCycle = (completed: number, total: number) => {
		saturnCheckmarks.text = generateCheckmarks(completed, total);
	};

	pomodoro.snoozePrompt = (): void => {
		// let result = await vscode.window.showWarningMessage(`Saturn: Take a break?`, "Snooze");
		// console.log(typeof result);
		// if (typeof result === "string") {
		// 	console.log("string");
		// 	Promise.resolve(true);
		// }
		// return Promise.resolve(false);
		let prevState: PomodoroStates = pomodoro.state;
		let prevCycles: number = pomodoro.cycles;

		vscode.window.showInformationMessage(`Saturn: Snooze the current ${prevState === PomodoroStates.BREAK ? "break": "work"} cycle?`, "Snooze").then((result) => {
			if (result === "Snooze") {
				pomodoro.snooze(prevState, prevCycles);
			}
		});

		return;
	};

	pomodoro.onTick = () => {
		saturnTimerButton.text = pomodoro.timer.toString();
	};

	context.subscriptions.push(vscode.commands.registerCommand("vs-saturn.reset", () => {
		console.log("vs-saturn.reset");

		const settings: Map<string, number> = getSettings();
		const args: number[] = [
			settings.get("saturn.cycle.cycles") as number,
			settings.get("saturn.timers.workCycleTime") as number,
			settings.get("saturn.timers.shortBreakTime") as number,
			settings.get("saturn.timers.longBreakTime") as number,
			settings.get("saturn.timers.snoozeTime") as number
		];
		
		saturnTimerButton.text = "00:00";
		saturnStartButton.text = "$(play)";
		saturnCheckmarks.text = generateCheckmarks(0, args[0]);

		pomodoro.maxCycles = args[0];
		pomodoro.workTime = args[1];
		pomodoro.shortBreakTime = args[2];
		pomodoro.longBreakTime = args[3];
		pomodoro.snoozeTime = args[4];

		pomodoro.reset();

	}));

	context.subscriptions.push(vscode.commands.registerCommand("vs-saturn.start", () => {
		console.log("vs-saturn.start");

		if (pomodoro.resume()) {
			saturnStartButton.text = "$(debug-pause)";
		} else if (pomodoro.pause()) {
			saturnStartButton.text = "$(play)";
		}

	}));

	context.subscriptions.push(vscode.commands.registerCommand("vs-saturn.tasklist", async () => {
		console.log("vs-saturn.tasklist");

		const items: Array<vscode.QuickPickItem> = tasklists[pomodoro.stickyState].tasks.map((x: ITask) => newQuickPickItem(x));
		// For some reason if you declare and define the options with canPickMany
		// you wont be able to use a for loop on the result of showQuickPick intuitively?
		const options: vscode.QuickPickOptions = {
			placeHolder: "Search for a task",
			canPickMany: true,
		};

		// There is also an issue with createQuickPick where I cannot have the selected field of the
		// QuickPickItems display when the QuickPick is shown. Which means we can not use the events
		// that createQuickPick lets us use. Sad.
		const result = await vscode.window.showQuickPick(items, {
			placeHolder: "Search for a task",
			canPickMany: true,
			ignoreFocusOut: true,
		});

		if (result) {
			// Creates an array of each picked item's label string
			const completedTasks: Array<string> = [];
			result.map((x: any) => {
				completedTasks.push(x.label);
			});

			// Saves the new completed state in the task list
			tasklists[pomodoro.stickyState].tasks.map((task: ITask) => {
				task.completed = completedTasks.includes(task.label);
			});
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand("vs-saturn.addtask", async () => {
		console.log("vs-saturn.addtask");

		const options: vscode.InputBoxOptions = {
			prompt: "Type a new task to add",
			placeHolder: "New Task", // TODO: Maybe suggest a new random task to give user idea?
		};

		const result = await vscode.window.showInputBox(options);

		if (result) {
			// TODO: validate that this task doesnt already exist
			tasklists[pomodoro.stickyState].addTask(result);
			console.log("" + tasklists[pomodoro.stickyState]);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand("vs-saturn.removetask", async () => {
		console.log("vs-saturn.removetask");

		const items: Array<vscode.QuickPickItem> = tasklists[pomodoro.stickyState].tasks.map((x: ITask) => newQuickPickItem(x, false));

		const result = await vscode.window.showQuickPick(items, {
			placeHolder: "Search for a task to remove",
			canPickMany: true,
			ignoreFocusOut: true,
		});
		
		if (result) {
			result.map((x: any) => {
				tasklists[pomodoro.stickyState].removeTask(x.label);
			});
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand("vs-saturn.cleartasks", async () => {
		console.log("vs-saturn.cleartasks");

		// TODO: Prompt the user if they actually want to clear the entire task list
		tasklists[pomodoro.stickyState].tasks = [];

	}));

	// Just add some temporary tasks into the list for show
	workTaskList.addTask("Sample Work Task 1");
	workTaskList.addTask("Sample Work Task 2");
	workTaskList.addTask("Sample Work Task 3");
	breakTaskList.addTask("Sample Break Task 1");
	breakTaskList.addTask("Sample Break Task 2");
}

// this method is called when your extension is deactivated
export function deactivate() { }