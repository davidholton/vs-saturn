// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { assert } from 'console';
import * as vscode from 'vscode';

// returns string of filled and outlined circles to represent the check marks 
function generateCheckMarks(completed: number, total: number) {
	return "$(circle-filled)".repeat(completed) + "$(circle-outline)".repeat(total - completed);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vs-saturn" is now active!');

	let statusPriority = 0;

	const saturnTimerText = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, --statusPriority);
	saturnTimerText.text = "13:42";
	saturnTimerText.tooltip = "Time left in current cycle";
	saturnTimerText.show();

	const saturnCheckMarks = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, --statusPriority);
	saturnCheckMarks.text = generateCheckMarks(2, 4);
	saturnCheckMarks.tooltip = "";
	saturnCheckMarks.show();

	const saturnActionButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, --statusPriority);
	saturnActionButton.text = "$(play)";
	saturnActionButton.tooltip = "Pause/Resume timer";
	saturnActionButton.command = "vs-saturn.start";
	saturnActionButton.show();

	const saturnNotesButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, --statusPriority);
	saturnNotesButton.text = "$(checklist)";
	saturnNotesButton.tooltip = "Saturn Notes";
	saturnNotesButton.command = "vs-saturn.notes";
	saturnNotesButton.show();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.commands.registerCommand('vs-saturn.start', () => {
		// console.log("vs-saturn.start");
		saturnActionButton.text = saturnActionButton.text === "$(play)" ? "$(debug-pause)": "$(play)";
	}));

	context.subscriptions.push(vscode.commands.registerCommand('vs-saturn.notes', () => {
		// console.log("vs-saturn.notes");
	}));

	context.subscriptions.push(saturnTimerText);
	context.subscriptions.push(saturnCheckMarks);
	context.subscriptions.push(saturnActionButton);
	context.subscriptions.push(saturnNotesButton);
}

// this method is called when your extension is deactivated
export function deactivate() {}
