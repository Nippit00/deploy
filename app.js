const path = require("path");
const express = require("express");
const multer = require('multer');
const https = require("https");
const morgan = require("morgan");
const session = require('express-session');
const csrf = require('csurf');
const fs = require("fs");
require('dotenv').config();

const app = express();
const csrfProtection = csrf();
app.use(express.json({ limit: '500mb' }));
app.set("view engine", "ejs");
app.set("views", "views");

const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: 'my secret for depa',
  resave: false,
  saveUninitialized: false,
}))

app.use(csrfProtection);


app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.user = req.session.user;
  next();
})

const authRoute = require("./routes/auth");
const mainRoute = require("./routes/main");
const adminRoute = require("./routes/admin.js");
const cityRoute = require("./routes/city");
const formRoute = require("./routes/form.js");
const fileUplaod = require("./routes/file.js")
const uploadroutes = require("./routes/uploadRoutes.js");
const notification = require("./routes/notification.js")
const notificationCon = require("./controllers/notification.js")

app.use(authRoute, csrfProtection);
app.use(mainRoute);
app.use(formRoute);
app.use(fileUplaod)
app.use("/admin", adminRoute);
app.use("/city", cityRoute);
app.use("/upload", uploadroutes);
app.use("/notification", notification)

// Debug logging for file paths
const keyPath = path.join(__dirname, "./key.pem");
const certPath = path.join(__dirname, "./cert.pem");

console.log(`Key Path: ${keyPath}`);
console.log(`Cert Path: ${certPath}`);

try {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
    // Uncomment the following line if your key file requires a passphrase
    // passphrase: 'your_passphrase_here'
  };

  const server = https.createServer(options, app);
  
  server.listen(process.env.PORT, () => {
    console.log(`Server listening on https://localhost:${process.env.PORT}`);
  });
} catch (error) {
  console.error('Error setting up HTTPS server:', error);
}
