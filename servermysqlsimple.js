const express = require("express"); //imports the express module
const crypto = require("crypto"); //built in module, used to hash passwords
const session = require("express-session"); //remembers who is logged in between pages
const app = express(); //creates the express application object
app.use(express.urlencoded({ extended: true })); //lets us read form fields from req.body

//gives each browser a cookie so we know who they are on the next request
//without SESSION_SECRET set, a new secret is made on every start, which logs everyone out
app.use(session({
	secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
	resave: false,
	saveUninitialized: false, //no cookie until someone actually logs in
	cookie: { httpOnly: true, sameSite: "lax" } //page scripts cannot read the cookie
}));

//pages you have to be logged in to see
const protectedPages = ["/index.html", "/appointments.html"];
//pages that only make sense when you are logged out
const guestPages = ["/register.html", "/login.html"];

//the landing page: new visitors start at register, logged in users go home
app.get("/", function(req, res)
{
	res.redirect(req.session.username ? "/index.html" : "/register.html");
});

//runs before the static files so a locked page is never sent to a logged out visitor
app.use(function(req, res, next)
{
	let loggedIn = Boolean(req.session.username);
	if(protectedPages.includes(req.path))
	{
		if(!loggedIn)
			return res.redirect("/login.html");
		//stops the back button showing a cached copy after logging out
		res.set("Cache-Control", "no-store");
	}
	if(guestPages.includes(req.path) && loggedIn)
		return res.redirect("/index.html"); //already logged in, nothing to do here
	next();
});

//index: false so "/" uses the redirect above instead of serving index.html directly
app.use(express.static("public", { index: false }));//register public as the directory for static files

const mysql = require("mysql2"); //uses new mysql package
//set ROOTPASS if your root user has a password, otherwise it stays blank
const conn = mysql.createConnection(
{host:"localhost",user:"root",password:process.env.ROOTPASS || "",database:"pantherwell",port:3306});

//settings for pbkdf2, the seed data in database/pantherwell.sql uses the same ones
const hashRounds = 100000;
const hashLength = 64; //64 bytes, which is 128 hex characters

conn.connect(function(err)
{
	if(err)
		console.log("Couldnt connect to MySQL",err);
	else
		console.log("Database connection established");
});

//turns a plain password and a salt into the hex hash we store
function hashPassword(plainPass, salt)
{
	return crypto.pbkdf2Sync(plainPass, salt, hashRounds, hashLength, "sha512").toString("hex");
}

//stops anything the user typed from being run as html when we echo it back
function escapeHtml(text)
{
	return String(text).replace(/[&<>"']/g, function(c)
	{
		return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
	});
}

//how long the success pages wait before moving on by themselves
const redirectSeconds = 3;

//wraps a short message in a page that uses the site styles and theme button
//pass autoRedirect = true to send the user to linkHref after a few seconds
function messagePage(title, message, linkHref, linkText, autoRedirect)
{
	//meta refresh does the redirect without needing any javascript
	let refresh = autoRedirect ? `<meta http-equiv="refresh" content="${redirectSeconds};url=${linkHref}">` : "";
	let countdown = autoRedirect ? `<p class="muted">Taking you there in ${redirectSeconds} seconds...</p>` : "";
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${refresh}
  <title>${title} | PantherWell</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="index.html">PantherWell</a>
    <button id="theme_toggler" class="toggle-btn" type="button" aria-pressed="false">Switch to dark theme</button>
  </header>
  <main class="auth">
    <section class="panel">
      <h1>${title}</h1>
      <p>${message}</p>
      ${countdown}
      <a class="primary-btn" href="${linkHref}">${linkText}</a>
    </section>
  </main>
  <script src="script.js"></script>
</body>
</html>`;
}

//register.html posts here
app.post("/register", function(req, res)
{
	//trim so " bob" and "bob" count as the same name
	let username = (req.body.username || "").trim();
	let email = (req.body.email || "").trim();
	let plainPass = req.body.password || ""; //never trimmed, spaces can be part of a password

	//the form has required on every field, but someone could skip the form
	if(!username || !email || !plainPass)
		return res.status(400).send(messagePage("Registration failed",
			"Please fill in your username, e-mail and password.", "register.html", "Back to register"));

	//every user gets their own random salt so matching passwords get different hashes
	let salt = crypto.randomBytes(16).toString("hex");
	let hashedPass = hashPassword(plainPass, salt);

	//the ? placeholders keep user input out of the sql itself
	let sql = "INSERT INTO users (username, email, password, salt) VALUES (?, ?, ?, ?)";
	conn.query(sql, [username, email, hashedPass, salt], function(err, result)
	{
		if(err)
		{
			//ER_DUP_ENTRY means the username or e-mail is already in the table
			if(err.code === "ER_DUP_ENTRY")
				return res.status(409).send(messagePage("Registration failed",
					"That username or e-mail is already registered.", "register.html", "Try again"));
			console.log("There was an error registering a user", err);
			return res.status(500).send(messagePage("Registration failed",
				"Something went wrong on our end. Please try again.", "register.html", "Try again"));
		}
		//it worked, send them to the login page next
		res.send(messagePage("Registered",
			"You have successfully registered, " + escapeHtml(username) + ".", "login.html", "Log in here", true));
	});
});

//remembers the user in their session, called by /login once the password checks out
function logIn(req, username, done)
{
	//get a fresh session id first so an old one cannot be reused
	req.session.regenerate(function(err)
	{
		if(err)
		{
			console.log("Could not start a session", err);
			return done(err);
		}
		req.session.username = username;
		done(null);
	});
}

//login.html posts here
app.post("/login", function(req, res)
{
	let username = (req.body.username || "").trim();
	let plainPass = req.body.password || "";
	//same message for a bad name or a bad password, so nobody can guess which usernames exist
	let failed = messagePage("Login failed",
		"The login credentials were incorrect.", "login.html", "Back to login");

	//look the user up by name first, then check the password against their own salt
	let sql = "SELECT password, salt FROM users WHERE username = ?";
	conn.query(sql, [username], function(err, rows)
	{
		if(err)
		{
			console.log("There was an error logging in", err);
			return res.status(500).send(messagePage("Login failed",
				"Something went wrong on our end. Please try again.", "login.html", "Back to login"));
		}
		if(rows.length === 0) //no user with that name
			return res.status(401).send(failed);

		//hash what they typed with their salt and see if it matches what we saved
		let stored = Buffer.from(rows[0].password, "hex");
		let attempt = Buffer.from(hashPassword(plainPass, rows[0].salt), "hex");
		//timingSafeEqual takes the same time no matter where the hashes differ
		if(stored.length !== attempt.length || !crypto.timingSafeEqual(stored, attempt))
			return res.status(401).send(failed);

		//password matched, remember them and send them home
		logIn(req, username, function(err)
		{
			if(err)
				return res.status(500).send(messagePage("Login failed",
					"Something went wrong on our end. Please try again.", "login.html", "Back to login"));
			res.send(messagePage("Welcome back",
				"You have logged in successfully, " + escapeHtml(username) + ".", "index.html", "Go to home page", true));
		});
	});
});

//script.js calls this on every page to decide what the nav should show
app.get("/me", function(req, res)
{
	res.json({ username: req.session.username || null });
});

//forget the user and send them back to log in
app.get("/logout", function(req, res)
{
	req.session.destroy(function()
	{
		res.clearCookie("connect.sid"); //connect.sid is the cookie name express-session uses
		res.redirect("/login.html");
	});
});

app.listen(process.env.PORT || 3000); //uses port 3000 unless PORT is set
