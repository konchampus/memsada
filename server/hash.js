const bcrypt = require('bcrypt');

bcrypt.hash('admin@a', 10, (err, hash) => {
    if (err) console.error(err);
    console.log(hash);
});