const bcrypt = require('bcryptjs');
bcrypt.hash('123admin', 12).then(hash => console.log(hash));
