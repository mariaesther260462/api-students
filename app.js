const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a la base de datos
const db = new sqlite3.Database('todos.db', (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

// Crear tabla si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Rutas
// GET - Obtener todas las tareas
app.get('/api/todos', (req, res) => {
  db.all('SELECT * FROM todos ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET - Obtener una tarea por ID
app.get('/api/todos/:id', (req, res) => {
  db.get('SELECT * FROM todos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }
    res.json(row);
  });
});

// POST - Crear nueva tarea
app.post('/api/todos', (req, res) => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: 'El título es requerido' });
    return;
  }

  db.run('INSERT INTO todos (title) VALUES (?)', [title], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({
      id: this.lastID,
      title,
      completed: false
    });
  });
});

// PUT - Actualizar una tarea
app.put('/api/todos/:id', (req, res) => {
  const { title, completed } = req.body;
  
  db.run(
    'UPDATE todos SET title = ?, completed = ? WHERE id = ?',
    [title, completed ? 1 : 0, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Tarea no encontrada' });
        return;
      }
      res.json({ id: req.params.id, title, completed });
    }
  );
});

// DELETE - Eliminar una tarea
app.delete('/api/todos/:id', (req, res) => {
  db.run('DELETE FROM todos WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }
    res.status(204).send();
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

// Manejar el cierre de la aplicación
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err);
    } else {
      console.log('Conexión a la base de datos cerrada');
    }
    process.exit(0);
  });
});
