// main.js

// Whole-script strict mode
"use strict";

// Globals
var numMainTasks = 0;
var numCompletedTasks = 0;

// Frequently accessed elements
const mainTasksContainer = document.getElementById('main-tasks-container');
const mainTasksPlaceholder = document.getElementById('main-tasks-placeholder');
const completedTasksContainer = document.getElementById('completed-tasks-container');
const completedTasksPlaceholder = document.getElementById('completed-tasks-placeholder');
const newTaskDueDateField = document.getElementById('newTaskDueDateField');

// Convenience functions
function clearNewTaskFields() {
	// Clear title
	document.getElementById('newTaskTitleField').value = "";
	// Reset due date to None
	document.getElementById('newTaskDueDateRadio1').checked = true;
	newTaskDueDateField.disabled = true;
	// Reset color selection (future)	
}

function addNewTask(title, dueDate, color) {
	numMainTasks++;
	
	// Add a new row for the task
	let rowDiv = document.createElement("div");
	rowDiv.className = "row bg-white m-1";
	rowDiv.innerHTML = "<div class='checkbox m-1'><label><input type='checkbox'> "+title+"</label></div>";
	mainTasksContainer.appendChild(rowDiv);
	
	// Hide placeholder
	mainTasksPlaceholder.hidden = true;
}

// ---- Main Script ----

// -- Add event listeners --

// New Task: Due Date radio group
document.getElementById('newTaskDueDateRadioGroup').addEventListener('click', ({target}) => {
	// Handler fires on root container click;
	// Enable or disable the date picker input based on which radio button
	// is selected.
	if (target.getAttribute('name') === 'dueDate') {
		if (target.value === 'none') {
			newTaskDueDateField.disabled = true;
		} else {
			newTaskDueDateField.disabled = false;
		}
	}
});

// New Task: Cancel button
document.getElementById('newTaskCancel').addEventListener('click', ({target}) => {
	// Clear all fields
	clearNewTaskFields();
});

// New Task: OK button ("New Task")
document.getElementById('newTaskOK').addEventListener('click', ({target}) => {
	// Get title from newTaskTitleField
	let taskTitle = document.getElementById('newTaskTitleField').value;

	// TODO: Future: support due date and color

	// Add a new row for the task
	addNewTask(taskTitle);
	
	// Dismiss and clear modal
	bootstrap.Modal.getInstance(document.getElementById('newTaskModal')).hide();
	clearNewTaskFields();	
});


