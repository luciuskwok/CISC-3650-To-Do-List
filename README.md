# "Tasks" Website Project
This is my project for my CISC 3650 Human-Computer Interface course. It is a simple tasks or "to do" list app. The main features are:

- Created using HTML and Bootstrap 5.3
- Add, check off, or delete tasks
- Undo support for adding and deleting tasks
- Completed tab which shows checked-off tasks
- Due date can be associated with a task
- Color coding can be set on a task
- Shows crossing-off animation when checking off a task
- Subtasks are supported

## Design considerations
- To have a good UX on both desktop and mobile devices, and be tested on
different browsers. For example, the buttons are responsive and have separate
layouts designed for various sizes of screens.
- To avoid “Are you sure?” type of modal dialogs, and instead allow the user to
experiment and undo any mistakes, such as accidentally checking off or deleting
an item.
- Accessibility for people using screen readers or other assistive technologies was a
consideration.

## Keyboard shortcuts
- ‘A’ for Add Subtask, if a task is selected.
- ‘N’ for New Task.
- ‘Enter’ key for Edit Task.
- ‘Delete’ or ‘Backspace’ key for deleting a task.
- ‘Tab’ and ‘Shift-Tab’ to change the indentation of a task, which
changes a task into a subtask and vice-versa.
