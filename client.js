const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('open', (event) => {
    console.log('Connected to server.');
});

socket.addEventListener('message', (event) => {
    const itemList = document.getElementById('itemList');
    const items = JSON.parse(event.data);

    // Clear the item list
    itemList.innerHTML = '';

    // Display the updated list of items
    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${item.name} `;
        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update';
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';

        updateButton.addEventListener('click', () => {
            const newItem = prompt('Update item:', item.name);
            if (newItem !== null) {
                socket.send(JSON.stringify({ action: 'update', id: item.id, item: newItem }));
            }
        });

        deleteButton.addEventListener('click', () => {
            socket.send(JSON.stringify({ action: 'delete', id: item.id }));
        });

        li.appendChild(updateButton);
        li.appendChild(deleteButton);
        itemList.appendChild(li);
    });
});

socket.addEventListener('close', (event) => {
    console.log('Connection closed.');
});

const createButton = document.getElementById('createButton');
createButton.addEventListener('click', () => {
    const itemInput = document.getElementById('itemInput');
    const newItem = itemInput.value.trim();
    if (newItem !== '') {
        socket.send(JSON.stringify({ action: 'create', item: newItem }));
        itemInput.value = '';
    }
})