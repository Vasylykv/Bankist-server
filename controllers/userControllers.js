const fs = require('fs');

const userdb = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));

function isLoginAuthenticated({ email, password }) {
  return (
    userdb.users.findIndex(
      (user) => user.email === email && user.password === password
    ) !== -1
  );
}

function isRegisterAuthenticated({ email }) {
  return userdb.users.findIndex((user) => user.email === email) !== -1;
}

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!isLoginAuthenticated({ email, password })) {
    const status = 401;
    const message = 'Incorrect Email or Password';
    res.status(status).json({ status, message });
    return;
  }

  const user = userdb.users.find((user) => user.email === email);

  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid email or password!',
    });
  }

  const userData = {
    id: user.id,
    owner: user.owner,
    email: user.email,
    balance: user.movements.reduce((acc, curr) => acc + curr, 0),
    movements: user.movements,
    interestRate: user.interestRate,
    movementsDates: user.movementsDates,
    currency: user.currency,
    locale: user.locale,
  };

  res.status(200).json(userData);
};

exports.transfer = (req, res) => {
  const { amount, senderId } = req.body;
  const { email } = req.params;
  console.log(senderId);
  console.log(amount);
  console.log(email);

  const senderIndex = userdb.users.findIndex((user) => user.id === senderId);
  const recieverIndex = userdb.users.findIndex((user) => user.email === email);

  if (senderIndex === -1 || recieverIndex === -1) {
    return res.status(403).json({
      status: 'failure',
      message: 'Invalid reciever id',
    });
  }

  const movementDate = new Date().toISOString();

  userdb.users[senderIndex].movements.push(-amount);
  userdb.users[senderIndex].movementsDates.push(movementDate);

  userdb.users[recieverIndex].movements.push(amount);
  userdb.users[recieverIndex].movementsDates.push(movementDate);

  fs.writeFile('./users.json', JSON.stringify(userdb), (err) => {
    if (err) {
      return res.status(500).json({
        status: 'fail',
      });
    }

    res.status(200).json({
      status: 'success',
      user: userdb.users[senderIndex],
    });
  });
};

exports.register = (req, res) => {
  const { email, password } = req.body;
  if (isRegisterAuthenticated({ email })) {
    const status = 401;
    const message = 'Email already exist';
    res.status(status).json({ status, message });
    return;
  }

  fs.readFile('./users.json', (err, data) => {
    if (err) {
      const status = 401;
      const message = err;
      res.status(status).json({ status, message });
      return;
    }
    data = JSON.parse(data.toString());

    let last_item_id = data.users[data.users.length - 1].id;

    data.users.push({ id: last_item_id + 1, email: email, password: password });
    let writeData = fs.writeFile(
      './users.json',
      JSON.stringify(data),
      (err, result) => {
        if (err) {
          const status = 401;
          const message = err;
          res.status(status).json({ status, message });
          return;
        }
      }
    );
  });
  const accessToken = createToken({ email, password });
  res.status(200).json({ accessToken });
};

exports.deleteUser = (req, res) => {
  const { email, password } = req.body;
  const { id } = req.params;

  if (!isLoginAuthenticated({ email, password })) {
    const status = 401;
    const message = 'Incorrect Email or Password';
    res.status(status).json({ status, message });
    return;
  }

  const userIndex = userdb.users.findIndex((user) => user.email === email);

  if (userdb.users[userIndex].id !== id) {
    const status = 401;
    const message = 'Incorrect Email or Password';
    res.status(status).json({ status, message });
    return;
  }

  userdb.users.splice(userIndex, 1);

  fs.writeFile('./users.json', JSON.stringify(userdb), (err) => {
    if (err) {
      return res.status(500).json({
        status: 'fail',
        message: 'Internal server error',
      });
    }

    res.status(200).json({
      status: 'success',
    });
  });
};
