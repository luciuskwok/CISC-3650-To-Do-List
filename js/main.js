// main.js

// Add event listeners
const newTaskDueDateField = document.getElementById('newTaskDueDateField');

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
	//   Clear title
	document.getElementById('newTaskTitleField').value = "";
	//   Reset due date to None
	document.getElementById('newTaskDueDateRadio1').checked = true;
	newTaskDueDateField.disabled = true;
	//   Reset color selection (future)
});

// New Task: OK button ("New Task")
document.getElementById('newTaskOK').addEventListener('click', ({target}) => {
	alert('OK');
});

// Set up Tasks list

// Testing: adding fake tasks via JS

// Hide the placeholder if there are any items in the list
const mainTasksPlaceholder = document.getElementById('main-tasks-placeholder');
//mainTasksPlaceholder.hidden = true;

// Get the container for the main tasks
const mainTasksContainer = document.getElementById('main-tasks-container');

// Add tasks;
// If we were using localStorage, this is where we would read tasks from it and set up the task lists.
{
	var taskTitle = "This is a test title";
	var rowDiv = document.createElement("div");
	rowDiv.className = "row bg-white m-1";
	rowDiv.innerHTML = "<div class='checkbox m-1'><label><input type='checkbox'> "+taskTitle+"</label></div>";
	mainTasksContainer.appendChild(rowDiv);
}

