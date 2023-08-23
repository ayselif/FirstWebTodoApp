// SELECTORS
const container = document.querySelector(".container")
const doneButtons = document.querySelectorAll(".task-check")

const todoList = document.querySelector("#todo-list")
const placeholderTodo = document.querySelector("#placeholder-todo")
const todoText = document.querySelectorAll("#task-name")
const deleteAllButton = document.querySelector("#delete-all");
const addTodoInput = document.querySelector("#todo-input")
const addTodoButton = document.querySelector("#todo-add")

const todotext = document.querySelector("span")

// DB INSTANCE
let db;
const todoTableName = "todos"

const TodoModel = {
    id: '',       // Benzersiz bir kimlik
    text: '',     // Todo metni
    completed: false   // Tamamlandı durumu
};

// Event Listeners
deleteAllButton.addEventListener("click", deleteAll)
document.addEventListener("DOMContentLoaded", didPageLoaded)
addTodoButton.addEventListener("click", didEnterNewTask)

// UI Events
function didPageLoaded() {
    startDBConnection()
}

function didEnterNewTask() {
    let enteredTodo = addTodoInput.value
    if (enteredTodo.trim() !== "" && enteredTodo.length > 3) {
        // Create New Todo Model
        const newTodo = {
            id: generateUUID(),
            text: addTodoInput.value,
            completed: false
        }; 

        addTodoItem(newTodo);
        addItemToUI(newTodo)
      
    } else {
        alert("Please enter valid input.");
    }
}

function didClickTaskRadioButton(event) {
    const todoId = event.target.getAttribute("todo-id"); // Tıklanan butonun todo ID'si
   
    updateTodoCompletion(todoId);
}


function deleteAll(event) {
    const transaction = db.transaction([todoTableName], 'readwrite');
    const objectStore = transaction.objectStore(todoTableName);
    const clearRequest = objectStore.clear();
    todoList.innerHTML = null;
}

/// ###########################################################

/// Helper Methods
function addItemToUI(newTodo) {
    addTodoInput.value = ""
    const todo = placeholderTodo.cloneNode(true)
    todo.querySelector("span").innerHTML = newTodo.text
    const todoRadioButton = todo.querySelector("input")
    
    todoRadioButton.addEventListener("click", didClickTaskRadioButton)
    todoRadioButton.setAttribute('todo-id', newTodo.id); 
    todo.id = "todo"+newTodo.id
    todo.style.display = null

    todoList.appendChild(todo);
    applyTodoCompletedStateOnUI(newTodo)
    
}

function applyTodoCompletedStateOnUI(todo){
    const selectorName = "#todo"+todo.id
    const todoContainer = document.querySelector(selectorName)
    const currentDoneRadioButton = todoContainer.querySelector("input")

    if(todo.completed) {
        todoContainer.style.textDecoration = "line-through"
        todoContainer.style.color = "#ccc" 
        currentDoneRadioButton.checked = true
    } else {
        todoContainer.style.textDecoration = "none"
        todoContainer.style.color = "#000" 
        currentDoneRadioButton.checked = false
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    })
}
/// #####################

/// Database Opeartions
function addTodoItem(todo) {
    const transaction = db.transaction([todoTableName], 'readwrite');
    const objectStore = transaction.objectStore(todoTableName);
    const request = objectStore.add(todo);
}

// Fetch all todo items from DB
function fetchTodoItems() {
    const transaction = db.transaction([todoTableName], 'readonly');
    const objectStore = transaction.objectStore(todoTableName);
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
        const todos = event.target.result;
        // Render TODO Row
        todos.forEach(todo => {
            addItemToUI(todo)
        });
    };
}

// 
function updateTodoCompletion(todoId) {
    const transaction = db.transaction([todoTableName], 'readwrite');
    const objectStore = transaction.objectStore(todoTableName);
    const keyRange = IDBKeyRange.only(todoId);
    const getRequest = objectStore.index('idIndex').openCursor(keyRange);

    getRequest.onsuccess = function(event) {
        const cursor = event.target.result;

        if (cursor) {
            const todo = cursor.value;
            todo.completed = !todo.completed;

            // Update todo data with cursor indicated
            const updateRequest = cursor.update(todo);
            updateRequest.onsuccess = (event) => {
                applyTodoCompletedStateOnUI(todo);
            };
        }
    };
}

// Database Oluştur ya da aç
function startDBConnection() {
    const request = indexedDB.open('todosDB', 2);

    request.onsuccess = (event) => {
        db = event.target.result;
        fetchTodoItems();
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const objectStore = db.createObjectStore(todoTableName, { autoIncrement: true });
        objectStore.createIndex('idIndex', 'id', { unique: true });
    };
}
