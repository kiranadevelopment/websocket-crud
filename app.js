// app.js
const WebSocket = require('ws');
const mysql = require('mysql2');
const uuid = require('uuid');
require('dotenv').config();

const server = new WebSocket.Server({ port: 8080 });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

let items = [];

function fetchItems() {
    db.query('SELECT * FROM items', (err, results) => {
        if (err) {
            console.error('Error fetching items from database:', err);
            return;
        }
        items = results.map((row) => ({ id: row.id, name: row.name }));
        broadcastItems();
    });
}

function broadcastItems() {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(items));
        }
    });
}

server.on('connection', (socket) => {
    console.log('Client connected.');

    socket.send(JSON.stringify(items));

    socket.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.action === 'create') {
            // Create a new item with a unique ID
            const newItem = { id: uuid.v4(), name: data.item };
            items.push(newItem);

            // Insert the new item into the database
            db.query('INSERT INTO items (id, name) VALUES (?, ?)', [newItem.id, newItem.name], (err) => {
                if (err) {
                    console.error('Error inserting item into database:', err);
                }
            });
        } else if (data.action === 'update') {
            // Update an existing item by ID
            const id = data.id;
            const updatedItemName = data.item;
            const itemToUpdate = items.find((item) => item.id === id);

            if (itemToUpdate) {
                itemToUpdate.name = updatedItemName;

                // Update the item in the database
                db.query('UPDATE items SET name = ? WHERE id = ?', [updatedItemName, id], (err) => {
                    if (err) {
                        console.error('Error updating item in database:', err);
                    }
                });
            }
        } else if (data.action === 'delete') {
            // Delete an item by ID
            const id = data.id;
            const index = items.findIndex((item) => item.id === id);

            if (index !== -1) {
                items.splice(index, 1)[0];

                // Delete the item from the database
                db.query('DELETE FROM items WHERE id = ?', [id], (err) => {
                    if (err) {
                        console.error('Error deleting item from database:', err);
                    }
                });
            }
        }

        broadcastItems();
    });

    socket.on('close', () => {
        console.log('Client disconnected.');
    });

    // Fetch initial items from the database when a new client connects
    fetchItems();
});
