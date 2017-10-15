var express = require('express');
var mysql = require('mysql');
var session = require('express-session');

var app = express();
var server = app.listen(8081, function () {});

var con = mysql.createConnection({
	host: 'ediss-hw1-db.cg4gso8l3psc.us-east-2.rds.amazonaws.com',
	port: '3306',
	user: 'root',
	password: process.env.DB_PASSWORD,
	database: 'edisshw2'
})

con.connect();

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    rolling: true,
    saveUninitialized: true,
    cookie: {
    	expires: 900 * 1000
    }
}));

app.use(function(req, res, next) {
	if (req.session && req.session.user) {
		con.query('SELECT * FROM users WHERE username = ?', [req.query.username],
			function(err, result, fields) {
				if (result.length > 0) {
					req.user = result[0];
					delete req.user.password;
					req.session.user = result[0];
					res.locals.user = result[0];
				} next();
			})
	} else {
		next();
	}
});

function requireLogin(req, res, next) {
	if (!req.session.user) {
		res.json({ message: "You are not currently logged in"});
	} else {
		next();
	}
};

function requireAdminLogin(req, res, next) {
	// require login and that the user is an admin
	if (!req.session.user) {
		res.json({ message: "You are not currently logged in"});
	} else {
		if (req.session.user.role !== "admin") {
			res.json({ message: "You must be an admin to perform this action"})
		} else {
			next();
		}
	}
};

// POST /registerUser
app.post('/registerUser', function(req,res) {
	var fname = req.query.fname;
	var lname = req.query.lname;
	var address = req.query.address;
	var city = req.query.city;
	var state = req.query.state;
	var zip = req.query.zip;
	var email = req.query.email;
	var role = 'customer';
	var username = req.query.username;
	var password = req.query.password;
	const new_user = { fname: fname, lname: lname,
		address: address, city: city, state: state,
		zip: zip, email: email, role: role,
		username: username, password: password
	}
	con.query("INSERT INTO users SET ?", new_user, function(err, result, fields) {
		if (err) {
			res.json({ message: "The input you provided is not valid"})
		} else {
			res.json({ message: fname + " was registered successfully"})
		}
	})
});

// POST /login
app.post('/login', function(req,res) {
	var username = req.query.username;
	var password = req.query.password;
	con.query('SELECT * FROM users WHERE username = ?', [username],
		function(err, result, fields) {
			if (err) {
				res.json({ message: "There seems to be an issue with the username/password combination that you entered"});
			} else {
				console.log(result);
				if (result.length === 0) {
					res.json({ message: "There seems to be an issue with the username/password combination that you entered"});
				}
				if (result.length > 0) {
					if (result[0].password === password) {
						req.session.user = result[0];
						res.json({ message: "Welcome, " + result[0].fname});
					}
				}
			}
		})
});

// POST /logout
app.post('/logout', requireLogin, function(req,res) {
	req.session.destroy();
	res.json({ message: "You have been successfully logged out"})
});

// POST /updateInfo
app.post('/updateInfo', requireLogin, function(req,res) {
	var fname = req.query.fname;
	var lname = req.query.lname;
	var address = req.query.address;
	var city = req.query.city;
	var state = req.query.state;
	var zip = req.query.zip;
	var email = req.query.email;
	var username = req.query.username;
	var password = req.query.password;
	var updated_user = {}

	//username cannot be changed
	if (fname !== undefined) product.fname = fname;
	if (lname !== undefined) product.lname = lname;
	if (address !== undefined) product.address = address;
	if (city !== undefined) product.city = city;
	if (state !== undefined) product.state = state;
	if (zip !== undefined) product.zip = zip;
	if (email !== undefined) product.email = email;
	if (password !== undefined) product.password = password;

	con.query("UPDATE users SET ? WHERE username = ?"), [updated_user, username], function(err, result, fields) {
		if (err) {
			res.json({ message: "The input you provided is not valid"})
		} else {
			res.json({ message: fname + " your information was successfully udpated"})
		}
	}
});

// POST /addProduct
app.post('/addProduct', requireAdminLogin, function(req,res) {
	var asin = req.query.asin;
	var name = req.query.productName;
	var description = req.query.productDescription;
	var group = req.query.group;
	const product = { asin: asin, name: name, description: description, groups: group}
	con.query("INSERT INTO products SET ?", product, function(err, result, fields) {
		if (err) {
			res.json({ message: "The input you provided is not valid"})
		} else {
			res.json({ message: name + " was successfully added to the system"})
		}
	})
});

// POST /modifyProduct
app.post('/modifyProduct', requireAdminLogin, function(req,res) {
	var asin = req.query.asin;
	var name = req.query.productName;
	var description = req.query.productDescription;
	var group = req.query.group;
	var product = {}

	if (name !== undefined) product.name = name;
	if (description !== undefined) product.description = description;
	if (group !== undefined) product.groups = group;

	con.query("UPDATE products SET ? WHERE asin = ?", [product, asin], function(err, result, fields) {
		if (err) {
			res.json({ message: "The input you provided is not valid"})
		} else {
			res.json({ message: name + " was successfully updated"})
		}
	})
});

// // POST /viewUsers
app.post('/viewUsers', requireAdminLogin, function(req,res) {
	var fName = req.query.fName;
	var lName = req.query.lName;

	if (fName === undefined && lName === undefined) {
		// return all users
		con.query("SELECT * FROM users", function(err, result, fields) {
			if (err) {
				res.json({ message: "There are no users that match that criteria"})
			} else {
				res.json(result)
			}
		})
	} else if (fName === undefined) {
		// return all users with last name like provided
		con.query("SELECT * FROM users WHERE lname LIKE \'%" + lName + "%\'", function(err, result, fields) {
			if (err) {
				res.json({ message: "There are no users that match that criteria"})
			} else {
				res.json({message: "The action was successful", user: result})
			}
		})
	} else if (lName === undefined) {
		// return all users with first name like provided
		con.query("SELECT * FROM users WHERE fname LIKE \'%" + fName + "%\'", function(err, result, fields) {
			if (err) {
				res.json({ message: "There are no users that match that criteria"})
			} else {
				res.json({message: "The action was successful", user: result})
			}
		})
	} else {
		// return all users with both first and last name like provided
		con.query("SELECT * FROM users WHERE fname LIKE \'%" + fName + "%\' AND lname LIKE \'%" + lName + "%\'", function(err, result, fields) {
			if (err) {
				res.json({ message: "There are no users that match that criteria"})
			} else {
				res.json({message: "The action was successful", user: result})
			}
		})
	}

});

// POST /viewProducts
app.post('/viewProducts', function(req,res) {
	var asin = req.query.asin;
	var keyword = req.query.keyword;
	var group = req.query.group;

	if (asin === undefined  && keyword === undefined && group === undefined) {
		con.query("SELECT * from products", function(err, result, fields){
			if (err || result.length === 0) {
				res.json({ message: "There are no products that match that criteria"})
			} else {
				res.json({ message: "The action was successful", product: result})
			}
		})
	} else if (asin !== undefined) {
		con.query("SELECT * from products WHERE asin = ?", asin, function(err, result, fields){
			if (err || result.length === 0) {
				res.json({ message: "There are no products that match that criteria"})
			} else {
				res.json({ message: "The action was successful", product: result})
			}
		})
	} else if (keyword !== undefined) {
		con.query("SELECT * FROM products WHERE name LIKE \'%" + keyword + "%\' OR description LIKE  \'%" + keyword + "%\'", function(err, result, fields) {
			if (err || result.length === 0) {
				console.log(err)
				res.json({ message: "There are no products that match that criteria"})
			} else {
				res.json({message: "The action was successful", user: result})
			}
		})
	} else if (group !== undefined) {
		con.query("select * from products where groups like \'%" + group + "%\'", function(err, result, fields) {
			if (err) {
				res.json({ message: "There are no products that match that criteria"})
			} else {
				res.json({message: "The action was successful", user: result})
			}
		})
	}
});
