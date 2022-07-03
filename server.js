const bodyParser = require('body-parser');
const jsonServer = require('json-server');

const {
  login,
  transfer,
  register,
  deleteUser,
} = require('./controllers/userControllers');

const server = jsonServer.create();
// const userdb = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(jsonServer.defaults());

server.post('/api/auth/register', register);
server.post('/api/auth/login', login);
server.patch('/api/transfer/:email', transfer);

server.delete('/users/:id', deleteUser);

const port = 5000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
