// **************
// **  Models  **
// **************
const db = require("../db.js");
const bcrypt = require("bcrypt");
const axios = require("axios");
const moment = require('moment');
exports.getAdPage = (req, res, next) => {
  const q = "SELECT r.* FROM `round` r INNER JOIN (SELECT `date`, MAX(`round`) as max_round FROM `round` GROUP BY `date` ) sub ON r.`date` = sub.`date` AND r.`round` = sub.`max_round` ORDER BY r.`date` ASC;";
  const q1 = "SELECT citydata.cityID, citydata.province, citydata.date, city_home.cityName FROM `citydata` JOIN city_home ON citydata.cityID=city_home.cityID WHERE 1 ORDER BY citydata.cityID ASC;";
  const qStatus = "SELECT city_home.cityID, COUNT(CASE WHEN solution.status = 0 THEN 1 END) AS status0_count, COUNT(CASE WHEN solution.status = 1 THEN 1 END) AS status1_count, COUNT(CASE WHEN solution.status = 2 THEN 1 END) AS status2_count FROM solution JOIN city_home ON city_home.cityID = solution.cityID GROUP BY city_home.cityID;";
  
  db.query(q, (err, date) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    db.query(q1, (err, city) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }
      db.query(qStatus, (err, dataStatus) => {
        if (err) {
          console.error(err);
          return res.status(500).json(err);
        }
        
        // Calculate the sum of each status count
        const totalStatusCounts = dataStatus.reduce((acc, row) => {
          acc.status0_count += row.status0_count;
          acc.status1_count += row.status1_count;
          acc.status2_count += row.status2_count;
          return acc;
        }, { status0_count: 0, status1_count: 0, status2_count: 0 });
        
        // console.log(dataStatus);
        
        res.render("admin/ad-main", {
          pageTitle: "Main",
          path: "/",
          date: date,
          city: city,
          dataStatus: dataStatus,
          totalStatusCounts:JSON.stringify(totalStatusCounts) , // Pass the summed values to the template
        });
      });
    });
  });
};

exports.notification = (req, res, next) => {
  // ส่วนของ Token ที่ได้จากการสร้างของแอปไลน์ Notify
  // const CityID = req.params.CityID;
  const CityID = '6201ECO01'

  const q = "SELECT citydata.province,solution.solutionName FROM `solution` JOIN citydata ON solution.cityID=citydata.cityID WHERE solution.solutionID=?";
  try {
    db.query(q, [CityID], (err, data) => {
      // console.log(data)
      if (err) return res.status(500).json(err);
      const LINE_NOTIFY_TOKEN = "npl7B2crirxxrRoFmq3KFSNaR2xjGH4Ixn9G0KOUNDf";

      // ส่วนของข้อความที่ต้องการส่ง
      const message = "จังหวัด" + data[0].province + data[0].solutionName + "ส่งฟรอมแล้วนะขอรับท่านพี่เค้ก";

      // URL ของ API สำหรับการส่งข้อความผ่าน Line Notify
      const LINE_NOTIFY_API_URL = "https://notify-api.line.me/api/notify";

      // ส่งข้อความผ่าน Line Notify API
      axios
        .post(LINE_NOTIFY_API_URL, `message=${message}`, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`,
          },
        })
        .then((response) => {
          // console.log("Notification sent:", response.data);
          res.status(200).json({ message: "Notification sent successfully" });
        })
        .catch((error) => {
          console.error("Error sending notification:", error);
          res.status(500).json({ error: "Failed to send notification" });
        });
    });
  }
  catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.getHistoryPage = (req, res, next) => {
  q = "SELECT * FROM `login_log` ORDER BY `Login_ID` DESC;"
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    // console.log(data);
    res.render("admin/ad-city/ad-History", {
      pageTitle: "History",
      path: "/",
      data: data,
    });
  });
};
//get city ad-city
exports.getAdCityP = (req, res, next) => {
  const q =
    "SELECT `cityID`, `province`, `date`, `developer`,  `government_investment`, `private_investment`,`LAT`, `LNG` FROM `citydata` WHERE 1";
  try {
    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);
      // console.log(data);
      res.render("admin/ad-city/ad-city", {
        req,
        pageTitle: "Dashboard",
        path: "/city",
        cityData: data,
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.getAdCityDataP =  (req, res, next) => {
  try {
    const q = "SELECT * FROM citydata JOIN city_home ON citydata.cityID = city_home.cityID WHERE citydata.cityID = ?;";
    const q2 = "SELECT * FROM `solution` JOIN smart ON solution.smartKey=smart.smartKey WHERE solution.cityID=? AND solution.status_solution=1 ORDER BY `solution`.`smartKey` ASC";
    const q3 = "SELECT `smartKey`,`solutionName` FROM `solution` WHERE cityID=? ";
    const q4 = "SELECT * FROM `anssolution` JOIN `solution` ON anssolution.solutionID = solution.solutionID WHERE solution.cityID = ?;";

    db.query(q, [req.params.cityID], (err, data) => {
      if (err) return res.status(500).json(err);

      db.query(q2, [req.params.cityID], (errer, solution) => {
        if (errer) return res.status(500).json(errer);

        db.query(q3, [req.params.cityID], (err, countsmart) => {
          if (err) return res.status(500).json(err);

          db.query(q4, [req.params.cityID], (err, result) => {
            if (err) return res.status(500).json(err);

            // ตรวจสอบว่ามีข้อมูลใน result หรือไม่
            if (result.length === 0) {
             
              const rounded = {};
              const smartKeyCounts = {};
              const problemPercentages = [];
              const successfulProjectsData = Array(10).fill(0);
              let unsuccessfulProjectsData = [];

              const averageProgressPerSmartKey = { };

              countsmart.forEach(row => {
                if (smartKeyCounts[row.smartKey]) {
                  smartKeyCounts[row.smartKey]++;
                } else {
                  smartKeyCounts[row.smartKey] = 1;
                }
              });
              const count = Object.values(smartKeyCounts).reduce((acc, value) => acc + value, 0);

              // เอาค่า value จาก smartKeyCounts ใส่ใน unsuccessfulProjectsData
              unsuccessfulProjectsData = Object.values(smartKeyCounts);

              rounded['1'] = {
                count: count,
                complete: [],
                progress: 0,
                success: successfulProjectsData,
                unsuccess: unsuccessfulProjectsData,
                problem: problemPercentages,
                smartkeycount: smartKeyCounts,
                averageProgressPerSmart: averageProgressPerSmartKey
              };

              res.render("admin/ad-city/ad-citydata", {
                req,
                pageTitle: "Dashboard",
                path: "/city",
                cityData: data[0],
                solution: solution,
                rounded: JSON.stringify(rounded) // ส่งค่า rounded ไปยัง template
              });
              return;
            }
            // ค้นหา round สูงสุด
            const maxRound = Math.max(...result.map(row => row.Round));
            // คำนวณความคืบหน้าและความสำเร็จ
            const rounded = {};
            for (let round = 1; round <= maxRound; round++) {
              const roundData = result.filter(row => row.Round == round);
              const smartKeyCounts = {};
              const projectSuccess = [];
              const successfulProjectsData = Array(10).fill(0);
              let unsuccessfulProjectsData = Array(10).fill(0);


              const validProblems = result.filter(
                (row) => row.questionID == 5 && row.ans !== "null" && row.Round == round && row.ans !== "ไม่มีปัญหา/อุปสรรค" && row.ans !== "อื่น ๆ"
              );
              const totalProblems = validProblems.length;
              const problemCounts = {};

              validProblems.forEach(row => {
                if (problemCounts[row.ans]) {
                  problemCounts[row.ans]++;
                } else {
                  problemCounts[row.ans] = 1;
                }
              });
              const problemPercentages = Object.keys(problemCounts).map(key => {
                return {
                  problem: key,
                  percentage: ((problemCounts[key] / totalProblems) * 100).toFixed(2)
                };
              });

              countsmart.forEach(row => {
                if (smartKeyCounts[row.smartKey]) {
                  smartKeyCounts[row.smartKey]++;
                } else {
                  smartKeyCounts[row.smartKey] = 1;
                }
              });
              const count = Object.values(smartKeyCounts).reduce((acc, value) => acc + value, 0);

              // คำนวณค่าเฉลี่ยของความคืบหน้าสำหรับแต่ละ smartKey
              const smartKeyProgress = {};
              const smartKeyCountsForAverage = {};
              let totalSum = 0;  // ผลรวมทั้งหมด
              let totalCount = 0;  // จำนวนทั้งหมด
              
              roundData.forEach(item => {
                // console.log(item)
                if (item.questionID == 2) {
                  item.ans = parseInt(item.ans, 10);
                  totalSum += item.ans;
                  totalCount += 1;

                  if (smartKeyProgress[item.smartKey]) {
                    smartKeyProgress[item.smartKey] += item.ans;
                    smartKeyCountsForAverage[item.smartKey] += 1;
                  } else {
                    smartKeyProgress[item.smartKey] = item.ans;
                    smartKeyCountsForAverage[item.smartKey] = 1;
                  }
                  // นับโครงการที่สำเร็จและไม่สำเร็จ
                  if (item.ans == 100) {
                   
                    projectSuccess.push({solutionName:item.solutionName,solutionID:item.solutionID});
                    successfulProjectsData[Object.keys(smartKeyCounts).indexOf(item.smartKey)]++;


                    }
                  }
                }
              );

              const smartKeyCountsValues = Object.values(smartKeyCounts);
              unsuccessfulProjectsData = smartKeyCountsValues.map((value, index) => value - successfulProjectsData[index]);

              // หาค่าเฉลี่ยของแต่ละ smartKey
              const averageProgressPerSmartKey = {  };
              Object.keys(smartKeyProgress).forEach(key => {
                averageProgressPerSmartKey[key] = (smartKeyProgress[key] / smartKeyCountsForAverage[key]).toFixed(2);
              });
              let funds=0
             
              // หาค่าเฉลี่ยของทั้งหมด
              const totalAverage = (totalSum / count).toFixed(2);
              rounded[round] = {
                count: count,
                complete: projectSuccess,
                progress: totalAverage,
                success: successfulProjectsData,
                unsuccess: unsuccessfulProjectsData,
                problem: problemPercentages,
                smartkeycount: smartKeyCounts,
                averageProgressPerSmart: averageProgressPerSmartKey,
                funds:funds
              };
            }
            // console.log(rounded)
            res.render("admin/ad-city/ad-citydata", {
              req,
              pageTitle: "Dashboard",
              path: "/city",
              cityData: data[0],
              solution: solution,
              rounded: JSON.stringify(rounded) // ส่งค่า rounded ไปยัง template
            });

          });
        });
      });
    });

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.getAddCity = (req, res, next) => {
  res.render("admin/ad-city/ad-addCity", {
    pageTitle: "add",
    path: "/",
    success: false,
  });
};

exports.postAddCity = async (req, res, next) => {
  const {
      cityID,
      province,
      cityName,
      date,
      developer,
   
      government_investment,
      private_investment,
      username,
      password,
      password2,
      LAT,
      LNG,
      region,
  } = req.body;

  if (password !== password2) {
      return res.status(400).send("Passwords do not match");
  }

  try {
      const adminUsernameExists = await queryDatabase("SELECT * FROM admininfo WHERE AdminUsername = ?", [username]);
      if (adminUsernameExists.length > 0) {
          return res.status(400).send("Admin username already exists");
      }

      const usernameExists = await queryDatabase("SELECT * FROM citydata WHERE username = ?", [username]);
      if (usernameExists.length > 0) {
          return res.status(400).send("Username already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const cityData = {
          cityID,
          province,
          date,
          developer,
          
          government_investment,
          private_investment,
          username,
          password: hashedPassword,
          LAT,
          LNG,
          region,
      };

      await queryDatabase("INSERT INTO citydata SET ?", cityData);

      const cityHomeData = {
          cityID,
          cityName,
      };

      await queryDatabase("INSERT INTO city_home SET ?", cityHomeData);

      const roundExists = await queryDatabase("SELECT * FROM `round` WHERE Date=?", [date]);
      if (roundExists.length === 0) {
          await queryDatabase("INSERT INTO `round` (`Date`, `open`, `close`, `round`) VALUES (?, '2020-06-20', '2020-06-20', 1)", [date]);
      }

      res.render("admin/ad-city/ad-addCity", {
          pageTitle: "add",
          path: "/",
          success: true,
      });
  } catch (error) {
      console.error("Database operation failed:", error);
      return res.status(500).send("Internal Server Error");
  }
};

function queryDatabase(query, params) {
  return new Promise((resolve, reject) => {
      db.query(query, params, (error, results) => {
          if (error) {
              reject(error);
          } else {
              resolve(results);
          }
      });
  });
}

exports.getEditProvince = (req, res, next) => {
  // console.log(req.params);
  const q =
    "SELECT citydata.cityID, citydata.province, citydata.date, citydata.developer, citydata.government_investment, citydata.private_investment, citydata.LAT, citydata.LNG FROM citydata JOIN city_home ON citydata.cityID = city_home.cityID WHERE citydata.cityID = ?;";
  try {
    db.query(q, [req.params.cityID], (err, data) => {
      if (err) return res.status(500).json(err);
      // console.log("Data is:", data);
      res.render("admin/ad-city/ad-editCity", {
        req,
        pageTitle: "Dashboard",
        path: "/city",
        cityData: data[0],
        success: false,
        cityID: req.params.cityID,
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.postUpdateProvince = (req, res, next) => {
  const cityID = req.params.cityID;
  const newData = req.body;
  delete newData._csrf;
  console.log(req.body);

  const querydate = "SELECT round.round, round.open, round.close FROM `round` JOIN citydata ON round.Date = citydata.date WHERE citydata.cityID = ?";
  const insertdateround = "INSERT INTO `round`(`Date`, `open`, `close`, `round`) VALUES (?, ?, ?, ?)";
  const query = "UPDATE citydata SET ? WHERE cityID = ?";

  db.query(querydate, [cityID], (err, oldRound) => {
    if (err) {
      console.error("Error fetching round data:", err);
      return res.status(500).json({ error: "An error occurred while fetching round data" });
    }

    if (oldRound.length === 0) {
      return res.status(404).json({ error: "No round data found for the specified cityID" });
    }

    const oldRoundData = oldRound[0];

    db.query(insertdateround, [req.body.date, oldRoundData.open, oldRoundData.close, oldRoundData.round], (err, insertround) => {
      if (err) {
        console.error("Error inserting new round data:", err);
        return res.status(500).json({ error: "An error occurred while inserting new round data" });
      }

      db.query(query, [newData, cityID], (err, result) => {
        if (err) {
          console.error("Error updating city data:", err);
          return res.status(500).json({ error: "An error occurred while updating city data" });
        }

        console.log("Data updated successfully");
        res.redirect(`/admin/city/edit/${cityID}?success=true`);
      });
    });
  });
};

exports.getAddSolutionPage = (req, res, next) => {
  // console.log(req.params);
  res.render("admin/ad-city/ad-addsolution", {
    pageTitle: "add",
    path: "/",
    success: true,
    cityID: req.params.cityID,
  });
};

exports.postAddSolution = (req, res, next) => {
  const {
    cityID,
    solutionName,
    smart,
    sourceFunds,
    funds,
    startYear,
    endYear,
    status,
  } = req.body;

  let smartKey;
  switch (smart) {
    case "Environment":
      smartKey = "ENV";
      break;
    case "Energy":
      smartKey = "ENE";
      break;
    case "Economy":
      smartKey = "ECO";
      break;
    case "Governance":
      smartKey = "GOV";
      break;
    case "Living":
      smartKey = "LIV";
      break;
    case "Mobility":
      smartKey = "MOB";
      break;
    case "People":
      smartKey = "PEO";
      break;
    case "City Data Platform":
      smartKey = "CDP";
      break;
    case "โครงสร้างพื้นฐานด้านดิจิทัล":
      smartKey = "DIF";
      break;
    case "โครงสร้างพื้นฐานด้านกายภาพ":
      smartKey = "PIF";
      break;
    default:
      smartKey = "OTH";
      break;
  }

  // Query to find the latest solutionID for the specific smartKey
  const query = "SELECT MAX(solutionID) as maxSolutionID FROM solution WHERE smartKey = ? AND cityID = ?";
  db.query(query, [smartKey, cityID], (err, result) => {
    if (err) {
      console.error("Error retrieving max solutionID:", err);
      return res.status(500).json({ error: "Error retrieving max solutionID" });
    }

    let newSolutionID;
    if (result.length > 0 && result[0].maxSolutionID) {
      const maxSolutionID = result[0].maxSolutionID;
      const numericPart = maxSolutionID.slice(7);
      const newNumericPart = parseInt(numericPart, 10) + 1;
      const formattedNumericPart = newNumericPart.toString().padStart(2, '0'); // Ensure two digits
      newSolutionID = cityID + smartKey + formattedNumericPart;
    } else {
      newSolutionID = `${cityID}${smartKey}01`; // Starting solutionID if no previous solutions exist
    }

    const insertQuery = "INSERT INTO `solution`(`cityID`, `smartKey`, `solutionID`, `solutionName`, `Source_funds`, `funds`, `start_year`, `end_year`, `status`, `Progress`, `status_solution`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '1')";
    db.query(insertQuery, [cityID, smartKey, newSolutionID, solutionName, sourceFunds, funds, startYear, endYear, '0', '0'], (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error adding solution:", insertErr);
        return res.status(500).json({ error: "Error adding solution" });
      }
      res.redirect(`/admin/solution/add/${cityID}?success=true`);
    });
  });
};

exports.getEditSolution = (req, res, next) => {
  // console.log(req.params);
  const q = "SELECT * FROM `solution` WHERE solutionID=?";
  try {
    db.query(q, [req.params.solutionID], (err, data) => {
      if (err) return res.status(500).json(err);
      console.log("Data is:", data);
      res.render("admin/ad-city/ad-editSolution", {
        req,
        pageTitle: "Edit_Solution",
        path: "/Edit_Solution",
        cityData: data[0],
        solutionID: req.params.solutionID,
        success: false,
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.getQuestion = (req, res, next) => {
  const q = "SELECT * FROM `question` WHERE 1";
  try {
    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);
      // console.log("data:", data);
      res.render("admin/ad-question/ad-question.ejs", {
        req,
        pageTitle: "Question",
        path: "/Question",
        data: data,
        success: false,
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.getAddQuestion = (req, res, next) => {
  const q = "INSERT INTO `question`(`question`, `Description`) VALUES (?,?)";
  const newQuestion = req.body.New_Question;
  const newDescription = req.body.New_Description;

  try {
    db.query(q, [newQuestion,newDescription], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      const q1 = "SELECT * FROM `question` WHERE 1";
      db.query(q1, (err, data) => {
        if (err) return res.status(500).json(err);
        res.redirect(`/admin/question`);

      });

    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};
exports.postDeleteQuestion = (req, res, next) => {
  q = "DELETE FROM `question` WHERE questionID=?";
  db.query(q, [req.params.QID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    const q = "SELECT * FROM `question` WHERE 1";
    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);
      // console.log("data:", data);
      res.redirect(`/admin/question`);
    });
  });
};

exports.getkpi = (req, res, next) => {
  const solutionID = req.params.solutionID
  const q1 = "SELECT * FROM `kpi` WHERE solutionID=?"
  db.query(q1, [solutionID], (err, kpi) => {
    if (err) return res.status(500).json(err);
    // console.log(kpi)
    res.render("admin/ad-city/ad-kpi.ejs", {
      req,
      solutionID: solutionID,
      kpi: kpi,
      pageTitle: "KPI",
      path: "/KPI",

    });
  })

}
//ค่อยเทสยังไม่เทส
exports.postkpi = (req, res, next) => {
  const data = req.body;
  const solutionID = req.params.solutionID;

  console.log("req.body", data);
  if (!data || !solutionID) {
    return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
  }

  const deleteKpiQuery = "DELETE FROM kpi WHERE solutionID=?";
  const insertKpiQuery = "INSERT INTO kpi (solutionID, kpiID, kpiName, goal, unit) VALUES (?, ?, ?, ?, ?)";

  // Delete all existing KPIs for the given solutionID
  db.query(deleteKpiQuery, [solutionID], (err, deleteResult) => {
    if (err) {
      console.error("Error deleting KPIs:", err);
      return res.status(500).json({ error: "Error deleting KPIs" });
    }

    let kpiIndex = 1;

    // Insert new KPIs
    Object.keys(data).forEach((key) => {
      if (key.startsWith('type')) {
        const kpiSuffix = String(kpiIndex).padStart(2, '0');
        const kpiID = `${solutionID}-${kpiSuffix}`;
        const kpiName = data[`name_${key.replace('type_', '')}`];
        const unit = data[`unit_${key.replace('type_', '')}`];
        const goal = data[`goal_${key.replace('type_', '')}`] || 0;

        // Insert the new KPI
        db.query(insertKpiQuery, [solutionID, kpiID, kpiName, goal, unit], (err, insertResult) => {
          if (err) {
            console.error(`Error adding KPI ${kpiID}:`, err);
          } else {
            console.log(`Inserted KPI ${kpiID} for solutionID ${solutionID}`);
          }
        });

        kpiIndex++;
      }
    });

    res.redirect(`/admin/city`);
  });
};

exports.deleteSolution = (req, res, next) => {
  // console.log(req.params);

  try {
    const q3 = "UPDATE `solution` SET `status_solution`='0' WHERE solutionID=? ORDER BY `solution`.`smartKey` ASC"
    db.query(q3, [req.params.solutionID], (err, deletedata) => {
      if (err) return res.status(500).json(err);
      res.redirect(`/admin/city/${req.params.cityID}`);
    })
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.updateSolution = (req, res, next) => {
  // console.log(req.body);

  const { cityID, solutionName, sourceFunds, funds, startYear, endYear, _csrf } = req.body;
  const solutionID = req.params.solutionID; // Assumes you have solutionID in the params

  

  const q3 = "UPDATE `solution` SET  `solutionName`=?, `Source_funds`=?, `funds`=?, `start_year`=?, `end_year`=?, `status_solution`='1' WHERE `solutionID`=?";
  const q = "SELECT * FROM citydata JOIN city_home ON citydata.cityID = city_home.cityID WHERE citydata.cityID = ?;";
  const q2 = "SELECT * FROM `solution` JOIN smart ON solution.smartKey=smart.smartKey WHERE cityID=? AND status_solution=1 ORDER BY `solution`.`smartKey` ASC";

  try {
    db.query(q3, [ solutionName, sourceFunds, funds, startYear, endYear, solutionID], (err, result) => {
      if (err) return res.status(500).json(err);

      db.query(q, [cityID], (err, data) => {
        if (err) return res.status(500).json(err);

        db.query(q2, [cityID], (errer, solution) => {
          if (errer) return res.status(500).json(errer);
          // console.log(solution)
          res.redirect(`/admin/city/${solutionID.slice(0, 4)}`);
        });
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.getRoundPage = (req, res, next) => {
  const q1 = "SELECT DISTINCT `date` FROM `citydata` ORDER BY `date` ASC;";
  const q2 = "SELECT * FROM `round` WHERE 1 ORDER BY `date` ASC;";

  db.query(q1, (err, dates) => {
    if (err) return res.status(500).json(err);

    const now = moment(); // Use moment to get the current date
    // Transform dates to the desired format and calculate age
    const formattedDates = dates.map(item => {
      const date = moment(item.date);
      const ageInDays = now.diff(date, 'days'); // Calculate age in days
      return {
        original: item.date,
        formatted: date.locale('th').format('LL'), // Format date in Thai
        age: ageInDays
      };
    });

    db.query(q2, (err, all) => {
      if (err) return res.status(500).json(err);

      // Format the 'all' data
      const formattedAllData = all.map(item => ({
        ...item,
        Date: moment(item.Date).locale('th').format('LL'), // Format the 'Date' field
        open: moment(item.open).locale('th').format('LL'), // Format the 'open' field
        close: moment(item.close).locale('th').format('LL') // Format the 'close' field
      }));

      res.render("admin/ad-city/ad-round", {
        req,
        pageTitle: "round",
        path: "/round",
        dates: formattedDates,
        alldate: formattedAllData
      });
    });
  });
};

exports.postRound = (req, res, next) => {
  console.log(req.body)
  const { open, close, _csrf, ...dates } = req.body;

  const processDateRound = (date, round, open, close, callback) => {
    const formattedDate = moment(date).toDate(); // ใช้ moment เพื่อจัดการวันที่
    
    const selectSql = "SELECT COUNT(*) as count FROM `round` WHERE `Date` = ? AND `round` = ?";
    db.query(selectSql, [formattedDate, round], (selectErr, selectResult) => {
      if (selectErr) {
        console.error(selectErr);
        return callback(selectErr);
      }

      const count = selectResult[0].count;
      if (count > 0) {
        // If date and round exist, update the record
        const updateSql = "UPDATE `round` SET `open` = ?, `close` = ? WHERE `Date` = ? AND `round` = ?";
        const updateValues = [open, close, formattedDate, round];
        db.query(updateSql, updateValues, (updateErr, updateResult) => {
          if (updateErr) {
            console.error(updateErr);
            return callback(updateErr);
          }
          console.log(`Updated round for date: ${formattedDate}, round: ${round}`);
          callback(null);
        });
      } else {
        // If date and round do not exist, insert a new record
        const insertSql = "INSERT INTO `round` (`Date`, `open`, `close`, `round`) VALUES (?, ?, ?, ?)";
        const insertValues = [formattedDate, open, close, round];
        db.query(insertSql, insertValues, (insertErr, insertResult) => {
          if (insertErr) {
            console.error(insertErr);
            return callback(insertErr);
          }
          console.log(`Inserted round for date: ${formattedDate}, round: ${round}`);
          callback(null);
        });
      }
    });
  };

  const tasks = Object.entries(dates).map(([date, round]) => {
    return (callback) => processDateRound(date, round, open, close, callback);
  });

  const async = require('async');
  async.series(tasks, (err, results) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/admin/city');
  });
};

