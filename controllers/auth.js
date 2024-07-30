const db = require("../db.js");
const bcrypt = require('bcrypt');

// Helper function to execute a query
const executeQuery = (query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// ****************
// **  getLogin  **
// ****************
exports.getLogin = async (req, res, next) => {
  try {
    // Render the login view with CSRF token and additional details
    res.render("auth/login", {
      pageTitle: "Login - Authentication",
      path: "/login",
      cityName: "à¸¢à¸´à¸™à¸”à¸µà¸•à¹‰à¸­à¸™à¸£à¸±à¸š",
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    // Handle errors that may occur during rendering
    console.error("Error rendering login page:", error);
    next(error); // Pass errors to Express error handling middleware
  }
};

// *****************
// **  postLogin  **
// *****************
exports.postLogin = async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    // Check if user exists
    const q = "SELECT * FROM citydata WHERE username = ?";
    const data = await executeQuery(q, [username]);

    if (!data || data.length === 0) {
      console.log("Not Found user");
      // Check for admin
      const AdminC = "SELECT * FROM `admininfo` WHERE adminusername = ?";
      const adminData = await executeQuery(AdminC, [username]);

      if (!adminData || adminData.length === 0) {
        return res.status(404).redirect("/login");
      }
      
      console.log("Found Admin");
      const adminInfo = adminData[0];
      
      if (adminInfo.AdminPassword === password) {
        console.log("Admin complete check password");
        req.session.isAdmin = true;
        req.session.userID = adminInfo.AdminUsername;
        // Log admin login
        const timestamp = new Date().toLocaleString('th-TH', {
          timeZone: 'Asia/Bangkok',
          hour12: false,
        });
        const logQuery = "INSERT INTO `login_log` (`cityID`, `login_time`) VALUES (?, ?)";
        const log = await executeQuery(logQuery, [adminInfo.AdminUsername, timestamp]);
        req.session.loginID = log.insertId;
        console.log("Admin login successful");
        return res.redirect("/admin");
      } else {
        return res.redirect("/login");
      }
    } else {
      console.log("Found user");
      const cityData = data[0];
      const result = await bcrypt.compare(password, cityData.password);
      
      if (!result) {
        return res.redirect("/login");
      }
      
      req.session.isLoggedIn = true;
      req.session.userID = cityData.cityID;
      // Log user login
      const timestamp = new Date().toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour12: false,
      });
      const logQuery = "INSERT INTO `login_log` (`cityID`, `login_time`) VALUES (?, ?)";
      const log = await executeQuery(logQuery, [cityData.cityID, timestamp]);
      req.session.loginID = log.insertId;
      console.log("User login successful");
      res.redirect("/city");
    }
  } catch (err) {
    console.error(err);
    res.redirect("/login");
  }
};

// ******************
// **  postLogout  **
// ******************
exports.postLogout = async (req, res) => {
  const loginID = req.session.loginID;

  try {
    // Destroy the session (as logout)
    await new Promise((resolve, reject) => {
      req.session.destroy(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Update the logout time in the Login_log table
    const logoutTime = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour12: false,
    });

    await executeQuery("UPDATE `login_log` SET `logout_time`=? WHERE `Login_ID`=?", [logoutTime, loginID]);

    // Redirect to home page after updating logout time
    res.redirect("/");
  } catch (err) {
    console.log("Error during logout:", err);
    res.redirect("/");
  }
};
