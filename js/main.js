// main.js

// Whole-script strict mode
"use strict";

// Task class
class Task {
	static taskIdentifier = 1;
	constructor(title, dueDate, color) {
		this.title = title;
		this.dueDate = dueDate;
		this.color = color;
		this.checkedOff = false;
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
		checkboxInput.className = "form-check-input"
		checkboxInput.id = rowIdentifier+"_checkbox";
		checkboxInput.checked = this.checkedOff;
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
		contentDiv.addEventListener('click', (event) => {
			// Deselect
			// TODO: allow multiple selection with shift, ctrl, or command keys
			//if (event.shiftKey) ...
			deselect();
	
			// Select this element
			selectedTasks.add(this);
	
			// Visually indicate selection
			updateSelection();
			
			// Prevent event propagation so that body event handler does not deselect rows.
			event.stopPropagation();
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
			//console.log("Checkbox: "+event.target.checked);
			this.checkedOff = event.target.checked;
			this.checkedDidChange();
		});
		
		return rowDiv;
	}
	
	// Returns the className for a row div associated with this task,
	// which includes the background color for selection and color coding
	rowClassName(selected) {
		let result = "row my-1 mx-1 gx-0 rounded ";
		
		if (this.color === "4") {
			result = result+"bg-success text-white"; // Green
		} else if (this.color === "3") {
			result = result+"bg-warning"; // Yellow
		} else if (this.color === "2") {
			result = result+"bg-danger text-white"; // Red
		} else {
			result = result+"bg-white";
		}
		
		result = result + " border border-2";
		if (selected) {
			result = result + " border-primary";
		} else {
			result = result + " border-white";
		}
		
		return result;
	}
	
	// Call this when a task's checked state is changed.
	// This triggers an animation and then moves the task to the
	// correct list for its state
	checkedDidChange() {
		let finalDelay = 400; // ms
		if (this.checkedOff) {
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
			
			// Extend the final delay to show last frame of animation longer
			finalDelay = 650;
		}
		
		// Pause 0.5 seconds, then move task to other list
		setTimeout(() => {
			this.deleteFromAllLists();
			if (this.checkedOff) {
				completedTasks.splice(0, 0, this);
			} else {
				mainTasks.splice(0, 0, this);
			}
			updateAllTaskLists();
		}, finalDelay);
	}

	// Delete a task from all lists
	deleteFromAllLists() {
		// Filter out task in each list
		mainTasks = mainTasks.filter(x => (x !== this));
		completedTasks = completedTasks.filter(x => (x !== this));
	}
}

// Globals
var mainTasks = new Array();
var completedTasks = new Array();
var deletedTasks = new Array();
var selectedTasks = new Set();
var taskBeingEdited = null;

// Frequently accessed elements
const mainTasksContainer = document.getElementById('main-tasks-container');
const completedTasksContainer = document.getElementById('completed-tasks-container');

/* ! - == Selection == */ 

// Deselect all tasks
function deselect() {
	selectedTasks.clear();
}

// Updates the selected state of all rows
function updateSelection() {
	updateSelectionWithContainer(mainTasks);
	updateSelectionWithContainer(completedTasks);
}

// Updates the background color of rows to indicate selection state
function updateSelectionWithContainer(taskList) {
	// For each task in the list, find the matching row div and change the class name.
	for (const task of taskList) {
		let rowId = "task_"+task.identifier+"_row";
		let div = document.getElementById(rowId);
		if (div) {
			let taskIsSelected = selectedTasks.has(task);
			div.className = task.rowClassName(taskIsSelected);
		}
	}
}

/* !- == Updating Rows == */

function updateAllTaskLists() {
	updateMainTaskList();
	updateCompletedTaskList();
}

function updateMainTaskList() {
	// If there are no tasks in the main list, show the placeholder, otherwise show each task.
	// Note: this will result in a visible flicker if updating the entire list, so try not to use it when inserting or removing just one element.
	
	// Remove any non-placeholder rows from main tasks container
	removeNonPlaceholderRows(mainTasksContainer);
	
	const mainTasksPlaceholder = document.getElementById('main-tasks-placeholder');
	if (mainTasks.length == 0) {
		mainTasksPlaceholder.hidden = false;
	} else {
		mainTasksPlaceholder.hidden = true;
		let index = 0;
		for (const task of mainTasks) {
			mainTasksContainer.appendChild(task.rowDiv());
			index++;
		}
	}
}

function updateCompletedTaskList() {
	removeNonPlaceholderRows(completedTasksContainer);
	
	const completedTasksPlaceholder = document.getElementById('completed-tasks-placeholder');
	if (completedTasks.length == 0) {
		completedTasksPlaceholder.hidden = false;
	} else {
		completedTasksPlaceholder.hidden = true;
		let index = 0;
		for (const task of completedTasks) {
			completedTasksContainer.appendChild(task.rowDiv());
			index++;
		}
	}
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

/* !- == New Task == */


// Show "New Task" modal
function showNewTaskModal() {
	taskBeingEdited = null;
	
	// Create and show the modal
	let newModal = new bootstrap.Modal(document.getElementById('newTaskModal'));
	clearNewTaskFields();
	newModal.show();
	document.getElementById('newTaskTitleField').focus();
}

// Clear all the input fields in the "New Task" modal
function clearNewTaskFields() {
	// Title
	document.getElementById('newTaskTitleField').value = "";
	// Due Date
	document.getElementById('newTaskDueDatePicker').value = null;
	document.getElementById('newTaskDueDateClearButton').hidden = true;
	document.getElementById('newTaskDueDateNone').hidden = false;
	// Color
	document.getElementById('newTaskColor1').checked = true;
}

function addNewTask(title, dueDate, color) {
	// Add task to top of list
	let task = new Task(title, dueDate, color);
	mainTasks.splice(0, 0, task);
	
	updateMainTaskList();
}

// Call this when OK button or Enter key is pressed from New Task modal
function newTaskModalOK() {
	// Get title from newTaskTitleField
	let taskTitle = document.getElementById('newTaskTitleField').value;
	
	// Due date
	let dueDate = document.getElementById('newTaskDueDatePicker').value;
	//console.log("Date: "+dueDate);
	
	// Color
	let selectedColor = document.querySelector("[name=newTaskColor]:checked").id;
	let color = null;
	if (selectedColor.length > 1) {
		color = selectedColor.charAt(selectedColor.length-1);
	}
	//console.log("Color: "+color);

	// Add a new row for the task
	addNewTask(taskTitle, dueDate, color);
	
	// Dismiss and clear modal
	bootstrap.Modal.getInstance(document.getElementById('newTaskModal')).hide();
}

/* ! __ New Task event listeners */

// New Task button that opens modal
document.getElementById('showNewTaskButton').addEventListener('click', ({target}) => {
	showNewTaskModal();
});

// New Task: Date picker
document.getElementById('newTaskDueDatePicker').addEventListener('change', event => {
	updateDueDateAccessories("newTask");
});

// New Task: Clear date button
document.getElementById('newTaskDueDateClearButton').addEventListener('click', event => {
	document.getElementById('newTaskDueDatePicker').value = null;
	updateDueDateAccessories("newTask");
});

// New Task: Cancel button
document.getElementById('newTaskCancel').addEventListener('click', ({target}) => {
	// Prevent event propagation so that body event handler does not deselect rows.
	event.stopPropagation();
});

// New Task: Change Title input field behavior so Enter key OK's the modal
document.getElementById('newTaskTitleField').addEventListener('keydown', event => {
	if (event.key == "Return" || event.key == "Enter") {
		newTaskModalOK();
		event.stopPropagation();
	}
});

// New Task: listen for return key event even if textarea is not in focus
document.getElementById('newTaskModal').addEventListener('keydown', event => {
	if (event.key == "Return" || event.key == "Enter") {
		newTaskModalOK();
		event.stopPropagation();
	}
});

// New Task: OK button ("New Task")
document.getElementById('newTaskOK').addEventListener('click', ({target}) => {
	newTaskModalOK();
});

/* !- == Edit Task == */

// Show "Edit Task" modal
function showEditTaskModal(task) {
	taskBeingEdited = task;
	
	// Title
	let titleField = document.getElementById('editTaskTitleField');
	titleField.value = task.title;
	
	// Due Date
	let dueCheckbox = document.getElementById('editTaskDueCheckbox');
	let dueDatePicker = document.getElementById('editTaskDueDatePicker');
	let hasDueDate = false;
	if (task.dueDate != null) {
		if (task.dueDate.length > 0) {
			hasDueDate = true;
		}
	}
	if (hasDueDate) {
		dueCheckbox.checked = true;
		dueDatePicker.disabled = false;
		dueDatePicker.value = task.dueDate;
	} else {
		dueCheckbox.checked = false;
		dueDatePicker.disabled = true;
		dueDatePicker.value = null;
	}
	
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
	
	// Create and show the modal
	let editModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
	editModal.show();

	document.getElementById('editTaskTitleField').focus();
}

// Delete selected tasks
function deleteSelectedTasks() {
	for (const task of selectedTasks) {
		task.deleteFromAllLists();
	}
	deselect();
	updateMainTaskList();
	updateCompletedTaskList();
}

function editTaskModalOK() {
	// Title
	taskBeingEdited.title = document.getElementById('editTaskTitleField').value;

	// Due Date
	const checkbox = document.getElementById('editTaskDueCheckbox');
	const datePicker = document.getElementById('editTaskDueDatePicker');
	taskBeingEdited.dueDate = null;
	if (checkbox.checked) {
		if (datePicker.value) {
			if (datePicker.value.length > 0) {
				taskBeingEdited.dueDate = datePicker.value;
			}
		}
	}
	
	// Color
	let selectedColor = document.querySelector("[name=editTaskColor]:checked").id;
	taskBeingEdited.color = null;
	if (selectedColor.length > 1) {
		taskBeingEdited.color = selectedColor.charAt(selectedColor.length-1);
	}

	// Deselect and update
	updateAllTaskLists();
	
	// Dismiss modal
	bootstrap.Modal.getInstance(document.getElementById('editTaskModal')).hide();
}

/* ! __ Edit Task event listeners */

// Edit Task: Delete button
document.getElementById('editTaskDelete').addEventListener('click', ({target}) => {
	taskBeingEdited.deleteFromAllLists();
	taskBeingEdited = null;
	
	updateAllTaskLists();
	// Allow event propagation so that body event handler deselects rows.
});

// Edit Task: Cancel button
document.getElementById('editTaskCancel').addEventListener('click', ({target}) => {
	// Prevent event propagation so that body event handler does not deselect rows.
	//event.stopPropagation();
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

function updateDueDateAccessories(modalPrefix) {
	const datePicker = document.getElementById(modalPrefix+'DueDatePicker');
	const clearBtn = document.getElementById(modalPrefix+'DueDateClearButton');
	const noneTxt = document.getElementById(modalPrefix+'DueDateNone');
	let valid = false;
	if (datePicker.value) {
		valid = (datePicker.value.length > 0);
	}
	clearBtn.hidden = !valid;
	noneTxt.hidden = valid;
}

/* !- Body event listeners */
// Add click event listener so that clicks here deselect rows
document.addEventListener('click', event => {
	if (!modalIsOpen()) {
		deselect();
		updateSelection();
	}
});

// Add keydown event listener for key shortcuts
document.addEventListener('keydown', event => {
	if (!modalIsOpen()) {
		switch (event.key) {
			case "Delete": case "Backspace":
				// Delete Task
				event.preventDefault();
				event.stopPropagation();		
				deleteSelectedTasks();
				break;
			case "N": case "n":
				// New Task
				event.preventDefault();
				event.stopPropagation();
				showNewTaskModal();
				break;
			case "Return": case "Enter":
				// Edit Task
				event.preventDefault();
				event.stopPropagation();
				if (selectedTasks.size > 0) {
					showEditTaskModal(selectedTasks.values().next().value);
				}
				break;
			case " ":
				// Toggle checkmark on task
				//console.log("Spacebar pressed");
				break;
		}
	}
});

function modalIsOpen() {
	return isElementVisible('editTaskModal') || isElementVisible('newTaskModal');
}

function isElementVisible(elementId) {
	let display = document.getElementById(elementId).style.display;
	return display != null && display !== "" &&display !== "none";
}

/* !- Main script */

// Assignment says to "Add a list of tasks", so this adds a list of sample tasks.
mainTasks.push(new Task("Welcome to your to-do list!", null, null));
mainTasks.push(new Task("These are sample tasks to show you how this task list works", null, null));
mainTasks.push(new Task("Click on the checkbox next to a task to complete it", null, null));
mainTasks.push(new Task("Double click on the task to edit it", null, null));
mainTasks.push(new Task("Press \"New Task\" to add your own tasks", "2023-10-15", "3"));
updateMainTaskList();

// Check the Due Date radio group button for None
