// main.js

// Whole-script strict mode
"use strict";

// ! - Globals
var taskList = new Array();
var selectedTasks = new Set();
var taskBeingEdited = null;
var editTaskMode = null;

// Frequently accessed elements
const mainTasksContainer = document.getElementById('main-tasks-container');
const completedTasksContainer = document.getElementById('completed-tasks-container');

// Task class
class Task {
	static taskIdentifier = 1;
	constructor(title, dueDate, color, indent) {
		this.title = title;
		this.dueDate = dueDate;
		this.color = color;
		this.isComplete = false;
		this.isAnimating = false;
		this.indent = indent;
		this.identifier = Task.taskIdentifier;
		Task.taskIdentifier++;
	}
	
	// Create a <div> for the task, to be inserted into the DOM
	rowDiv() {
		const rowIdentifier = "task_"+this.identifier;
		
		// Add a new row for the task
		const rowDiv = document.createElement("div");
		rowDiv.className = this.rowClassName(false);
		rowDiv.id = rowIdentifier+"_row";
		
		const checkboxColDiv = document.createElement("div");
		checkboxColDiv.className = "col-auto ms-2 me-0"; // bg-secondary
		rowDiv.appendChild(checkboxColDiv);
		
		const checkboxFormDiv = document.createElement("div");
		checkboxFormDiv.className = "form-check my-1 mx-1";
		checkboxColDiv.appendChild(checkboxFormDiv);
		
		const checkboxInput = document.createElement("input");
		checkboxInput.type = "checkbox";
		checkboxInput.className = "form-check-input border border-primary"
		checkboxInput.id = rowIdentifier+"_checkbox";
		checkboxInput.checked = this.isComplete;
		checkboxFormDiv.appendChild(checkboxInput);
		
		// Title
		const contentDiv = document.createElement("div");
		contentDiv.className = "col mx-0 px-1 py-1 user-select-none";
		contentDiv.id = rowIdentifier+"_content";
		rowDiv.appendChild(contentDiv);
		
		// Due Date
		// Because of the float-end, put due date before title text
		if (this.dueDate != null) {
			let dateDiv = document.createElement("span");
			dateDiv.className = "badge rounded-pill bg-light text-dark my-1 mx-1 float-end";
			dateDiv.appendChild(document.createTextNode(this.dueDate));
			contentDiv.appendChild(dateDiv);
		}
		
		// Finish adding title
		const titleSpan = document.createElement("span");
		titleSpan.id = rowIdentifier+"_title";
		titleSpan.appendChild(document.createTextNode(this.title));
		contentDiv.appendChild(titleSpan);
			
		// Add event handler so that clicking on a row makes it selected
		contentDiv.addEventListener('mousedown', (event) => {
			event.preventDefault();
			return this.mouseDown(event);
		});
		
		// Add event handler for double-click to edit task
		contentDiv.addEventListener('dblclick', (event) => {
			showEditTaskModal(this);
			
			// Prevent event propagation so that body event handler does not deselect rows.
			event.stopPropagation();
		});
		
		// Add event handlers for when task is checked off, show an animation and 
		// move the task to the completed list if it was on the main list, or vice-versa.
		checkboxInput.addEventListener('click', (event) => {
			this.checkedDidChange(event.target.checked);
		});

		return rowDiv;
	}

	// Returns the className for a row div associated with this task,
	// which includes the background color for selection and color coding
	rowClassName(selected) {
		let marginStart = 3 * (this.isComplete? 0 : this.indent) + 1;
		let result = "row my-1 ms-"+marginStart+" me-1 gx-0 rounded ";
		
		if (this.color === "4") {
			result = result+"bg-success-subtle "; // Green
		} else if (this.color === "3") {
			result = result+"bg-warning-subtle"; // Yellow
		} else if (this.color === "2") {
			result = result+"bg-danger-subtle "; // Red
		} else {
			result = result+"bg-white";
		}
		
		result = result + " border border-2";
		if (selected) {
			result = result + " border-primary"; // border-primary
		} else {
			result = result + " border-light";
		}
		
		return result;
	}
	
	// Handles mouse down event
	mouseDown(event) {
		// Deselect
		// TODO: allow multiple selection with shift, ctrl, or command keys
		//if (event.shiftKey) ...
		deselect();
		addTaskToSelection(this);
		updateSelection(); // Visually indicate selection
		
		// Prevent event propagation so that body event handler does not deselect rows.
		event.stopPropagation();
		return false;
	}
	
	// Call this when a task's checked state is changed.
	// This triggers an animation and then moves the task to the
	// correct list for its state
	checkedDidChange(newState) {
		// Extend the final delay to show last frame of animation longer
		let finalDelay = newState? 650:400; // ms
		
		if (newState) {
			this.animateCrossingOff();
			
			// Also check off any subtasks
			let index = taskList.findIndex( x => (x == this) );
			if (index >= 0) {
				index++;
				while (index < taskList.length) {
					let subtask = taskList[index];
					if (subtask.indent > 0) {
						const checkbox = document.getElementById("task_"+subtask.identifier+"_checkbox");
						checkbox.checked = true;
						subtask.checkedDidChange(true);
						subtask.animateCrossingOff();
					} else {
						break;
					}
					index++;
				}
			}
		}
		
		// Pause, then move task to other list
		setTimeout(() => {
			this.isAnimating = false;
			this.isComplete = newState;
			updateTaskContainers();
		}, finalDelay);
	}
	
	animateCrossingOff() {
		this.isAnimating = true;
		
		// Show animation crossing off the item
		const titleSpan = document.getElementById("task_"+this.identifier+"_title");
		
		// Create an array of chars from the original text
		let original = titleSpan.innerText.split('');
		
		// Create versions of string with different portion
		let versions = new Array();
		
		const frames = 8;
		for (let i=1; i<=frames; i++) {
			let n = original.length * i / frames;
			
			let s = new Array();
			for (let j=0; j<original.length; j++) {
				s.push(original[j]);
				if (j < n) {
					s.push('\u0336');
				}
			}
			versions.push(s.join(''));
		}
		
		// Put up the first frame of the animation
		titleSpan.innerText = versions[0];
		
		for (let i=1; i<frames; i++) {
			setTimeout(() => {
				titleSpan.innerText = versions[i];
			}, 500*i/frames);
		}
	}

	// Delete a task from all lists
	deleteFromAllLists() {
		taskList = taskList.filter(x => (x !== this));
	}
	
	// Increase or decrease the indentation level.
	// Possible indentation values are 0 and 1.
	shiftIndentation(direction) {
		let x = this.indent + direction;
		x = x<0? 0 : x; // Limit to zero or higher
		x = x>1? 1 : x; // Limit to one or lower
		if (this.indent != x) {
			this.indent = x;
			return true;
		}
		return false;
	}
}

/* ! - == Selection == */ 

// Deselect all tasks
function deselect() {
	selectedTasks.clear();
}

function addTaskToSelection(task) {
	selectedTasks.add(task);
}

// Updates the background color of rows to indicate selection state
function updateSelection() {
	// For each task in the list, find the matching row div and change the class name.
	for (const task of taskList) {
		let rowId = "task_"+task.identifier+"_row";
		let div = document.getElementById(rowId);
		if (div) {
			let taskIsSelected = selectedTasks.has(task);
			div.className = task.rowClassName(taskIsSelected);
		}
	}
	
	// Update the state of the Add Subtask button
	const addSubtaskButton = document.getElementById('addSubtaskButton');
	const selectedTask = anySelectedTask();
	let enableAddSubtaskButton = false;
	if (selectedTask) {
		enableAddSubtaskButton = !selectedTask.isComplete;
	}
	if (enableAddSubtaskButton) {
		addSubtaskButton.disabled = false;
		addSubtaskButton.classList.remove('btn-outline-secondary');
		addSubtaskButton.classList.add('btn-outline-primary');
	} else {
		addSubtaskButton.disabled = true;
		addSubtaskButton.classList.remove('btn-outline-primary');
		addSubtaskButton.classList.add('btn-outline-secondary');
	}
}

/* !- == Updating Rows == */

function updateTaskContainers() {
	// HTML elements
	const mainTasksContainer = document.getElementById('main-tasks-container');
	const completedTasksContainer = document.getElementById('completed-tasks-container');
	const mainTasksPlaceholder = document.getElementById('main-tasks-placeholder');
	const completedTasksPlaceholder = document.getElementById('completed-tasks-placeholder');

	// Remove tasks
	removeNonPlaceholderRows(mainTasksContainer);
	removeNonPlaceholderRows(completedTasksContainer);

	// Get both task lists
	const mainTasksList = taskList.filter(x => (!x.isComplete));
	const completedTasksList = taskList.filter(x => (x.isComplete));
	
	// Populate main task list
	if (mainTasksList.length == 0) {
		mainTasksPlaceholder.hidden = false;
	} else {
		mainTasksPlaceholder.hidden = true;
		for (const task of mainTasksList) {
			mainTasksContainer.appendChild(task.rowDiv());
		}
	}	

	// Populate completed task list
	if (completedTasksList.length == 0) {
		completedTasksPlaceholder.hidden = false;
	} else {
		completedTasksPlaceholder.hidden = true;
		for (const task of completedTasksList) {
			completedTasksContainer.appendChild(task.rowDiv());
		}
	}	

	updateSelection();
}

function removeNonPlaceholderRows(container) {
	// Remove any non-placeholder rows from container
	let childrenToRemove = new Array();
	for (const child of container.children) {
		if (!child.id.endsWith("placeholder")) {
			childrenToRemove.push(child);
		}
	}
	for (const child of childrenToRemove) {
		container.removeChild(child);
	}
}

/* ! __ Button event listeners */

// New Task button that opens modal
document.getElementById('newTaskButton').addEventListener('click', ({target}) => {
	showEditTaskModal(null, false);
});

// Add Subtask button that opens modal
document.getElementById('addSubtaskButton').addEventListener('click', ({target}) => {
	showEditTaskModal(anySelectedTask(), true);
});

document.getElementById('addSubtaskButton').addEventListener('mousedown', (event) => {
	event.stopPropagation();
	event.preventDefault();
	return false;
});

/* !- == Edit Task == */

// Show modal used for "New Task", "Add Subtask", and "Edit Task"
// Pass in the task to edit when editing an existing task;
// Pass in the parent task when adding a subtask;
// Pass in null when creating a new task.
function showEditTaskModal(task, isAddingSubtask) {
	// Elements to modify
	let modalTitle = document.getElementById('editTaskModalTitle');
	let deleteButton = document.getElementById('editTaskDelete');
	let titleField = document.getElementById('editTaskTitleField');
	let dueDatePicker = document.getElementById('editTaskDueDatePicker');
	
	// Update globals
	taskBeingEdited = task;
	
	if (task != null && !isAddingSubtask) {
		editTaskMode = "editTask";
		
		// == Set up modal for Edit Task ==
		modalTitle.innerText = "Edit Task";
		deleteButton.hidden = false;
		
		// Text of the task
		titleField.value = task.title;
		
		// Due Date
		let hasDueDate = false;
		if (task.dueDate != null) hasDueDate = (task.dueDate.length > 0);
		dueDatePicker.value = hasDueDate ? task.dueDate : null;
		
		// Color
		const colorButtonPrefix = "editTaskColor";
		// Preselect the default "None" color
		document.getElementById(colorButtonPrefix+"1").checked = true;
		if (task.color != null) {
			if (task.color.length > 0) {
				let radioButton = document.getElementById(colorButtonPrefix+task.color);
				if (radioButton) {
					radioButton.checked = true;
				}
			}
		}	
	} else {
		// Setup that is common to New Task and Add Subtask
		deleteButton.hidden = true;
		
		// Clear fields and set color to none
		titleField.value = "";
		dueDatePicker.value = null;
		document.getElementById('editTaskColor1').checked = true;
		
		if (isAddingSubtask) {
			editTaskMode = "addSubtask";
			modalTitle.innerText = "Add Subtask";
		} else {
			editTaskMode = "newTask";
			modalTitle.innerText = "New Task";
		}
	}
	updateDueDateAccessories();
	
	// Create and show the modal
	let editModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
	editModal.show();

	document.getElementById('editTaskTitleField').focus();
}

function editTaskModalDelete() {
	if (editTaskMode !== "editTask") {
		console.log("Cannot delete because no task is being edited.")
		return;
	}

	taskBeingEdited.deleteFromAllLists();
	taskBeingEdited = null;
	
	updateTaskContainers();
}

function editTaskModalOK() {
	let task = null;
	let insertionIndex = 0;
	
	if (editTaskMode === "editTask") {
		task = taskBeingEdited;
	} else {
		task = new Task();
		if (editTaskMode === "addSubtask") {
			task.indent = 1;
			
			// Find the index of the last selected task, which will be the parent
			const parentTask = taskBeingEdited;
			insertionIndex = taskList.findIndex( x => (x == parentTask) ) + 1;
		} else {
			task.indent = 0;
			
			// Switch to main Tasks list in tab view
			const mainTabButton = document.getElementById('main-tab');
			mainTabButton.click();
		}
	}
	
	// Title
	task.title = document.getElementById('editTaskTitleField').value;

	// Due Date
	const datePicker = document.getElementById('editTaskDueDatePicker');
	task.dueDate = null;
	if (datePicker.value) {
		if (datePicker.value.length > 0) {
			task.dueDate = datePicker.value;
		}
	}
	
	// Color
	const selectedColor = document.querySelector("[name=editTaskColor]:checked").id;
	task.color = null;
	if (selectedColor.length > 1) {
		task.color = selectedColor.charAt(selectedColor.length-1);
	}
	
	// Insert the new task or subtask
	if (editTaskMode === "newTask" || editTaskMode === "addSubtask") {
		taskList.splice(insertionIndex, 0, task);
	}

	// Deselect and update
	deselect();
	addTaskToSelection(task);
	updateTaskContainers();
	
	// Reset globals
	taskBeingEdited = null;
	editTaskMode = null;
	
	// Dismiss modal
	bootstrap.Modal.getInstance(document.getElementById('editTaskModal')).hide();
}

/* ! __ Edit Task event listeners */

// Edit Task: Date picker
document.getElementById('editTaskDueDatePicker').addEventListener('change', event => {
	updateDueDateAccessories();
});

// Edit Task: Clear date button
document.getElementById('editTaskDueDateClearButton').addEventListener('click', event => {
	document.getElementById('editTaskDueDatePicker').value = null;
	updateDueDateAccessories();
});

// Edit Task: Delete button
document.getElementById('editTaskDelete').addEventListener('click', ({target}) => {
	editTaskModalDelete();
});


// Edit Task: Change Title input field behavior so Enter key OK's the modal
document.getElementById('editTaskTitleField').addEventListener('keydown', event => {
	if (event.key == "Return" || event.key == "Enter") {
		editTaskModalOK();
		event.stopPropagation();
	}
});

// Edit Task: listen for return key event even if textarea is not in focus
document.getElementById('editTaskModal').addEventListener('keydown', event => {
	if (event.key == "Return" || event.key == "Enter") {
		editTaskModalOK();
		event.stopPropagation();
	}
});

// Edit Task: OK button
document.getElementById('editTaskOK').addEventListener('click', ({target}) => {
	editTaskModalOK();
});

/* !- Common modal functions */

function updateDueDateAccessories() {
	const prefix = "editTaskDueDate";
	const datePicker = document.getElementById(prefix+'Picker');
	const clearBtn = document.getElementById(prefix+'ClearButton');
	const noneTxt = document.getElementById(prefix+'None');
	let valid = false;
	if (datePicker.value) {
		valid = (datePicker.value.length > 0);
	}
	clearBtn.hidden = !valid;
	noneTxt.hidden = valid;
}

/* !- Body event listeners */
// Add click event listener so that clicks here deselect rows
document.addEventListener('mousedown', event => {
	if (!modalIsOpen()) {
		deselect();
		updateSelection();
	}
});

function handleKeyDown(event) {
	if (!modalIsOpen()) {
		const selectedTask = anySelectedTask();
		switch (event.key) {
			case "A": case "a":
				// Add subtask
				if (selectedTask) {
					showEditTaskModal(selectedTask, true);
				}
				event.preventDefault();
				return false;
			case "N": case "n":
				// New Task
				showEditTaskModal(null, false);
				event.preventDefault();
				return false;
			case "Delete": case "Backspace":
				// Delete Task
				deleteSelectedTasks();
				event.preventDefault();
				return false;
			case "Return": case "Enter":
				// Edit Task
				if (selectedTask) {
					showEditTaskModal(selectedTask, false);
				}
				event.preventDefault();
				return false;
			case "Tab":
				// Indent Task
				if (selectedTask) {
					let changed = false;
					if (!selectedTask.isComplete) {
						if (event.shiftKey) {
							// Remove indent
							changed = selectedTask.shiftIndentation(-1);
						} else {
							// Add indent
							changed = selectedTask.shiftIndentation(1);
						}
						if (changed) {
							updateTaskContainers();
						}
					}
				}
				event.preventDefault();
				return false;
			case " ":
				// Toggle checkmark on task
				//console.log("Spacebar pressed");
				break;
		}
	}
}

// Add keydown event listener for key shortcuts
document.addEventListener('keydown', handleKeyDown);

function modalIsOpen() {
	return isElementVisible('editTaskModal');
}

function isElementVisible(elementId) {
	let display = document.getElementById(elementId).style.display;
	return display != null && display !== "" &&display !== "none";
}

function anySelectedTask() {
	return selectedTasks.values().next().value;
}

// Delete selected tasks
function deleteSelectedTasks() {
	for (const task of selectedTasks) {
		task.deleteFromAllLists();
	}
	deselect();
	updateTaskContainers();
}

/* !- Main script */

// Assignment says to "Add a list of tasks", so this adds a list of sample tasks.
taskList.push(new Task("Welcome to your to-do list!", null, null, 0));
taskList.push(new Task("These are sample tasks to show you how this task list works", null, null, 1));
taskList.push(new Task("Click on the checkbox next to a task to complete it", null, null, 0));
taskList.push(new Task("Double click on the task to edit it", null, "4", 0));
taskList.push(new Task("Press \"New Task\" to add your own tasks", "2023-10-15", "3", 0));
updateTaskContainers();

// Check the Due Date radio group button for None
