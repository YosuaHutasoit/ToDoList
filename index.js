const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const todolistModel = require('./models').todolist

// get config vars
dotenv.config();

const app = express();
app.use(bodyParser.json());
const PORT = 3000;

const usersStatic = [
  {
    id: 1,
    username: "josh",
    hobby: "Basket",
    type_data : "Premium"
  },
  {
    id: 2,
    username: "sarah",
    hobby: "Sleep",
    type_data : "Premium"
  },
  {
    id: 3,
    username: "drian",
    hobby: "Renang",
    type_data : "Premium"
  },
  {
    id: 4,
    username: "ahmad",
    hobby: "Cooking",
    type_data : "Premium"
  },
  {
    id: 5,
    username: "dapid",
    hobby: "Futsal",
    type_data : "Premium"
  }
];

const dataUsers = [
  {
      "user_id": 11,
      "email": "josh@gmail.com",
      "password": "12345678"
  },
  {
      "user_id": 12,
      "email": "sarah@gmail.com",
      "password": "abcdefg"
  },
  {
      "user_id": 13,
      "email": "drian@gmail.com",
      "password": "131fadas"
  }
]

let checkData = (req,res, next) => {
  // console.log(`Saya Mengecek Data Ini : ${req.body}`)
  next()
}

let checkUser = (req, res, next) => {
  let response = {}
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) {
      response = {
          status: "ERROR",
          message: "Authorization Failed"
      }
      res.status(401).json(response)
      return
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (error, user) => {
      console.log(error)
      if (error) {
          response = {
              status: "ERROR",
              message: error
          }
          res.status(401).json(response)
          return
      }
      req.user = user
      next()
})
}

// Simpan data user pada array (sementara)
let users = [];

// Endpoint untuk membuat user baru
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Periksa apakah username sudah digunakan
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Buat user baru
  const newUser = { username, password };
  users.push(newUser);

  res.status(201).json({ message: 'User created successfully' });
});

// Endpoint untuk login
app.post("/login", (req, res) => {
  let email = req.body.email
  let password = req.body.password

  let response = {}
  let foundUser = {}

  for(let i=0;i < dataUsers.length; i++) {
      if(dataUsers[i].email == email) {
          foundUser = dataUsers[i]
      }
  }

  if(Object.keys(foundUser).length == 0) {
      response = {
          status: "ERROR",
          message: "User not Found"
      }
      res.status(401).json(response)
      return
  }

  if(foundUser.password != password) {
      response = {
          status: "ERROR",
          message: "Combination Email and Password not Match"
      }
      res.status(401).json(response)
      return
  }

  let jwt_payload = {
      user_id: foundUser.user_id
  }

  let access_token = jwt.sign(jwt_payload, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
  response = {
      status: "SUCCESS",
      access_token: access_token
  }
  res.json(response)
})

app.use(checkUser)

// Get a todo
app.get("/todolist/:id", async (req, res) => {

  const todolist = await todolistModel.findAll();
  const response = {
      status: "SUCCESS",
      message: "Get User",
      meta: {
          total: todolist.length
      },
      data: todolist
  }

  res.status(200).json(response)
  return
})

app.post("/todolist", async (req, res) => {
  let response = {}
  let code = 200
  const newTodolist = await todolistModel.create({
          name: req.body.name,
          password: req.body.password,
          email: req.body.email,
          jenis_id: req.body.jenis_id
      });
  
      response = {
          status: "SUCCESS",
          message: "Create Users",
          data: newTodolist
      }
  res.status(code).json(response)
  return
})

// Update a todo
app.put("/todolist/:id", async (req, res) => {
  const todoId = req.params.id;
  const { name, password, email, jenis_id } = req.body;

  try {
    // Find the todo by its ID
    const todo = await todolistModel.findByPk(todoId);

    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    // Update the todo with the new values
    todo.name = name;
    todo.password = password;
    todo.email = email;
    todo.jenis_id = jenis_id;

    // Save the updated todo
    await todo.save();

    // Return the updated todo as the response
    res.json({
      status: "SUCCESS",
      message: "Update Todo",
      data: todo
    });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ error: "An error occurred while updating the todo" });
  }
});

// Delete a todo
app.delete("/todolist/:id", async (req, res) => {
  const todoId = req.params.id;

  try {
    // Find the todo by its ID
    const todo = await todolistModel.findByPk(todoId);

    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    // Delete the todo
    await todo.destroy();

    res.json({
      status: "SUCCESS",
      message: "Delete Todo",
      data: null
    });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "An error occurred while deleting the todo" });
  }
});

// Delete all todos
app.delete("/todolist/:id", async (req, res) => {
  try {
    // Delete all todos
    await todolistModel.destroy({ truncate: true });

    res.json({
      status: "SUCCESS",
      message: "Delete All Todos",
      data: null
    });
  } catch (error) {
    console.error("Error deleting todos:", error);
    res.status(500).json({ error: "An error occurred while deleting all todos" });
  }
});

app.use(checkData)

// Endpoint untuk mendapatkan semua user
app.get("/users", (req, res) => {
  res.json(usersStatic);
});

// Endpoint untuk mendapatkan user tertentu berdasarkan ID
app.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const user = usersStatic.find(user => user.id === userId);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// Endpoint untuk membuat user baru
app.post("/users", (req, res) => {
  const newUser = {
    id: usersStatic.length + 1,
    username: req.body.username,
    hobby: req.body.hobby,
    type_data: req.body.type_data
  };

  usersStatic.push(newUser);
  res.status(201).json(newUser);
});

// Endpoint untuk memperbarui user yang ada
app.put("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = usersStatic.findIndex(user => user.id === userId);

  if (userIndex !== -1) {
    usersStatic[userIndex] = {
      id: userId,
      username: req.body.username,
      hobby: req.body.hobby,
      type_data: req.body.type_data
    };

    res.json(usersStatic[userIndex]);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// Endpoint untuk menghapus user
app.delete("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = usersStatic.findIndex(user => user.id === userId);

  if (userIndex !== -1) {
    usersStatic.splice(userIndex, 1);
    res.sendStatus(204);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});


// Menambahkan route untuk tampilan selamat datang di web
app.get('/', (req, res) => {
  res.send('<h1>Halo, Selamat Datang!</h1>');
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
