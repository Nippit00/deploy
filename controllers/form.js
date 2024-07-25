const db = require("../db.js");
const axios = require("axios");

exports.getformSmart = (req, res, next) => {
  const solutionid = req.params.solutionID;
  const cityID = req.session.userID;
  const round = req.params.round
  // console.log("Round is:"+round)
  const q1 =
    "SELECT * FROM solution JOIN smart ON solution.smartKey = smart.smartKey JOIN city_home ON city_home.cityID = solution.cityID WHERE solution.cityID = ? AND solution.solutionID = ? ";
  const q2 = "SELECT * FROM anssolution WHERE solutionID = ? ";
  const q3 = "SELECT * FROM `question` WHERE 1";
  const q4 = `
    SELECT kpi.*, anskpi.*
    FROM kpi
    JOIN anskpi ON kpi.kpiID = anskpi.kpiID
    JOIN (
        SELECT kpiID, MAX(Round) AS maxRound
        FROM anskpi
        GROUP BY kpiID
    ) AS latest ON anskpi.kpiID = latest.kpiID AND anskpi.Round = latest.maxRound
    WHERE kpi.solutionID = ?;
`;

  try {
    db.query(q1, [cityID, solutionid], (err, data) => {
      if (err) return res.status(500).json(err);
      db.query(q2, [solutionid], (err, dataOld) => {
        // console.log(dataOld)
        if (err) return res.status(500).json(err);
        db.query(q3, (err, question) => {
          if (err) return res.status(500).json(err);
          db.query(q4, [solutionid], (err, kpi) => {
            // console.log("length: "+ kpi)
            if (err) return res.status(500).json(err);
            if (kpi.length > 0) {
              res.render("form-smart", {
                kpiQ: kpi,
                formdata: data,
                dataOld: dataOld || [],
                csrfToken: req.csrfToken(),
                question: question,
                round: round,
              });
            } else {
              const q5 = "SELECT * FROM `kpi` WHERE solutionID = ?";
              db.query(q5, [solutionid], (err, kpi) => {
                if (err) return res.status(500).json(err);
                res.render("form-smart", {
                  kpiQ: kpi,
                  formdata: data,
                  dataOld: dataOld || [],
                  csrfToken: req.csrfToken(),
                  question: question,
                  round: round,
                });
              });
            }
          });
        });
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

//Get formcdpPart1
exports.getformCdp1 = (req, res, next) => {
  const solutionid = req.params.solutionID;
  const cityID = req.session.userID;
  const round = req.params.round;
  
  const q1 = "SELECT * FROM solution JOIN smart ON solution.smartKey = smart.smartKey JOIN city_home ON city_home.cityID = solution.cityID WHERE solution.cityID = ? AND solution.solutionID = ? ";
  const q2 = "SELECT * FROM anssolution WHERE solutionID = ? ";
  const q3 = "SELECT * FROM `question` WHERE 1";
  const q4 = "SELECT * FROM `kpi` JOIN anskpi ON kpi.kpiID = anskpi.kpiID WHERE kpi.solutionID = ? ";
  
  try {
      db.query(q1, [cityID, solutionid], (err, data) => {
          if (err) return res.status(500).json(err);
          db.query(q2, [solutionid], (err, dataOld) => {
              if (err) return res.status(500).json(err);
              db.query(q3, (err, question) => {
                  if (err) return res.status(500).json(err);
                  db.query(q4, [solutionid], (err, kpi) => {
                      if (err) return res.status(500).json(err);
                      if (kpi.length > 0) {
                          res.render("form-cdpPart1", {
                              kpiQ: kpi,
                              formdata: data,
                              dataOld: dataOld || [],
                              csrfToken: req.csrfToken(),
                              question: question,
                              round: round,
                          });
                      } else {
                          const q5 = "SELECT * FROM `kpi` WHERE solutionID = ?";
                          db.query(q5, [solutionid], (err, kpi) => {
                              if (err) return res.status(500).json(err);
                              res.render("form-cdpPart1", {
                                  kpiQ: kpi,
                                  formdata: data,
                                  dataOld: dataOld || [],
                                  csrfToken: req.csrfToken(),
                                  question: question,
                                  round: round,
                              });
                          });
                      }
                  });
              });
          });
      });
  } catch (err) {
      console.log(err);
      res.status(500).json(err);
  }
};

exports.saveAnsObj = (req, res, next) => {
  const data = req.body;
  const progress = req.body.A2;
  const solutionID = req.params.solutionID;
  const timestamp = new Date();
  const round = req.params.round;
  const qUpdate = "UPDATE solution SET status = ? WHERE solutionID = ?";
  const updateProgress = "UPDATE `solution` SET `Progress`=? WHERE solutionID=?";
  console.log("req.body :",req.body)
  // console.log("req.params :",req.params)
  if (solutionID.length > 255) {
    return res.status(400).json({ error: 'solutionID exceeds the maximum length allowed' });
  }

  let queries = [];
  let kpiQueries = [];

  for (const key in data) {
    if (key.startsWith('Q')) {
      const questionID = key.substring(1);
      const answerKey = `A${questionID}`;
      const answer = data[answerKey];
      if (answer !== undefined) {
        queries.push([
          solutionID,
          timestamp,
          questionID,
          round,
          answer
        ]);
      }
    } else if (key.startsWith(solutionID)) {  // Assuming KPI keys are like '6201ENV01-01'
      const kpiID = key;
      const answer = data[key];
      if (answer !== undefined) {
        kpiQueries.push([
          solutionID,
          kpiID,
          timestamp,
          answer,
          round
        ]);
      }
    }
  }

  const checkQuery = 'SELECT * FROM anssolution WHERE solutionID = ? AND Round=? AND questionID!=3';

  db.query(updateProgress, [progress, solutionID], (updateProgressErr) => {
    if (updateProgressErr) {
      console.error('Error updating progress:', updateProgressErr);
      return res.status(500).json({ error: 'Failed to update progress' });
    }

    db.query(checkQuery, [solutionID,round], (checkErr, checkResult) => {
      if (checkErr) {
        console.error('Error checking existing data:', checkErr);
        return res.status(500).json({ error: 'Failed to check existing data' });
      }
      console.log(checkResult.length)
      if (checkResult.length > 0) {
        handleUpdates();
      } else {
        handleInserts();
      }
    });
  });

  function handleUpdates() {
    let completedUpdates = 0;
    const totalUpdates = queries.length + kpiQueries.length;

    const checkCompletion = () => {
      completedUpdates++;
      if (completedUpdates === totalUpdates) {
        updateStatusAndRedirect();
      }
    };

    // Update existing records in anssolution table
    queries.forEach(query => {
      const updateQuery = `
        UPDATE anssolution 
        SET timestamp = ?, Round = ?, ans = ?
        WHERE solutionID = ? AND questionID = ? AND Round=?
      `;
      db.query(updateQuery, [query[1], query[3], query[4], query[0], query[2], query[3]], (updateErr) => {
        if (updateErr) {
          console.error('Error updating data:', updateErr);
          return res.status(500).json({ error: 'Failed to update answers' });
        }
        checkCompletion();
      });
    });

    // Update existing records in anskpi table
    kpiQueries.forEach(query => {
      const updateKpiQuery = `
        UPDATE anskpi 
        SET timestamp = ?, ans = ?, Round = ?
        WHERE solutionID = ? AND kpiID = ? AND Round=?
      `;
      db.query(updateKpiQuery, [query[2], query[3], query[4], query[0], query[1], query[4]], (updateErr) => {
        if (updateErr) {
          console.error('Error updating KPI data:', updateErr);
          return res.status(500).json({ error: 'Failed to update KPI data' });
        }
        checkCompletion();
      });
    });

    if (totalUpdates === 0) {
      updateStatusAndRedirect();
    }
  }

  function handleInserts() {
    const insertQuery = `
      INSERT INTO anssolution (solutionID, timestamp, questionID, Round, ans) 
      VALUES ?
    `;
    db.query(insertQuery, [queries], (insertErr) => {
      if (insertErr) {
        console.error('Error inserting data:', insertErr);
        return res.status(500).json({ error: 'Failed to save answers' });
      }

      if (kpiQueries.length > 0) {
        const insertKpiQuery = `
          INSERT INTO anskpi (solutionID, kpiID, timestamp, ans, Round) 
          VALUES ?
        `;
        db.query(insertKpiQuery, [kpiQueries], (insertKpiErr) => {
          if (insertKpiErr) {
            console.error('Error inserting KPI data:', insertKpiErr);
            return res.status(500).json({ error: 'Failed to save KPI data' });
          }
          updateStatusAndRedirect();
        });
      } else {
        updateStatusAndRedirect();
      }
    });

  }

  function updateStatusAndRedirect() {
    const updateStatus='UPDATE `solution` SET `status`=1 WHERE solutionID=?'
    db.query(updateStatus, [solutionID], (err, selectData) => {
      if (err) {
        console.error('Error selecting status:', err);
        return res.status(500).json({ error: 'Failed to select status' });
      }
        console.log("Status updated successfully");
        if (solutionID.includes("CDP01")) {
          console.log("TRUE")
          res.redirect(`/formcdp1/${solutionID}/${round}?success=true`);
        } else {
          res.redirect(`/formsmart/${solutionID}/${round}?success=true`);
        }
      ;
    });
  }
};

exports.saveAnsObjEdit = (req, res, next) => {
   const data = req.body.dataChecks;
   const progress = req.body.dataChecks.A2;
   const solutionID = req.params.solutionID;
   const timestamp = new Date();
   const round = req.params.round;
   const qselectQuery = "SELECT status FROM solution WHERE solutionID = ?";
   const qUpdate = "UPDATE solution SET status = ? WHERE solutionID = ?";
   const updateProgress = "UPDATE `solution` SET `Progress`=? WHERE solutionID=?";
 
   if (solutionID.length > 255) {
     return res.status(400).json({ error: 'solutionID exceeds the maximum length allowed' });
   }
 
   let queries = [];
   let kpiQueries = [];
 
   for (const key in data) {
     if (key.startsWith('Q')) {
       const questionID = key.substring(1);
       const answerKey = `A${questionID}`;
       const answer = data[answerKey];
       if (answer !== undefined) {
         queries.push([
           solutionID,
           timestamp,
           questionID,
           round,
           answer
         ]);
       }
     } else if (key.startsWith(solutionID)) {  // Assuming KPI keys are like '6201ENV01-01'
       const kpiID = key;
       const answer = data[key];
       if (answer !== undefined) {
         kpiQueries.push([
           solutionID,
           kpiID,
           timestamp,
           answer,
           round
         ]);
       }
     }
   }
 
   const checkQuery = 'SELECT * FROM anssolution WHERE solutionID = ? AND Round=? AND questionID!=3';
 
   db.query(updateProgress, [progress, solutionID], (updateProgressErr) => {
     if (updateProgressErr) {
       console.error('Error updating progress:', updateProgressErr);
       return res.status(500).json({ error: 'Failed to update progress' });
     }
 
     db.query(checkQuery, [solutionID,round], (checkErr, checkResult) => {
       if (checkErr) {
         console.error('Error checking existing data:', checkErr);
         return res.status(500).json({ error: 'Failed to check existing data' });
       }
 
       if (checkResult.length > 0) {
         handleUpdates();
       } else {
         handleInserts();
       }
     });
   });
 
   function handleUpdates() {
     let completedUpdates = 0;
     const totalUpdates = queries.length + kpiQueries.length;
 
     const checkCompletion = () => {
       completedUpdates++;
       if (completedUpdates === totalUpdates) {
         updateStatusAndRedirect();
       }
     };
 
     // Update existing records in anssolution table
     queries.forEach(query => {
       const updateQuery = `
         UPDATE anssolution 
         SET timestamp = ?, Round = ?, ans = ?
         WHERE solutionID = ? AND questionID = ? AND Round=?
       `;
       db.query(updateQuery, [query[1], query[3], query[4], query[0], query[2],query[3]], (updateErr) => {
         if (updateErr) {
           console.error('Error updating data:', updateErr);
           return res.status(500).json({ error: 'Failed to update answers' });
         }
         checkCompletion();
       });
     });
 
     // Update existing records in anskpi table
     kpiQueries.forEach(query => {
       const updateKpiQuery = `
         UPDATE anskpi 
         SET timestamp = ?, ans = ?, Round = ?
         WHERE solutionID = ? AND kpiID = ? AND Round=?
       `;
       db.query(updateKpiQuery, [query[2], query[3], query[4], query[0], query[1],query[4]], (updateErr) => {
         if (updateErr) {
           console.error('Error updating KPI data:', updateErr);
           return res.status(500).json({ error: 'Failed to update KPI data' });
         }
         checkCompletion();
       });
     });
 
     if (totalUpdates === 0) {
       updateStatusAndRedirect();
     }
   }
 
   function handleInserts() {
     const insertQuery = `
       INSERT INTO anssolution (solutionID, timestamp, questionID, Round, ans) 
       VALUES ?
     `;
     db.query(insertQuery, [queries], (insertErr) => {
       if (insertErr) {
         console.error('Error inserting data:', insertErr);
         return res.status(500).json({ error: 'Failed to save answers' });
       }
 
       if (kpiQueries.length > 0) {
         const insertKpiQuery = `
           INSERT INTO anskpi (solutionID, kpiID, timestamp, ans, Round) 
           VALUES ?
         `;
         db.query(insertKpiQuery, [kpiQueries], (insertKpiErr) => {
           if (insertKpiErr) {
             console.error('Error inserting KPI data:', insertKpiErr);
             return res.status(500).json({ error: 'Failed to save KPI data' });
           }
           updateStatusAndRedirect();
         });
       } else {
         updateStatusAndRedirect();
       }
     });
   }
 
   function updateStatusAndRedirect() {
     db.query(qselectQuery, [solutionID], (err, selectData) => {
       if (err) {
         console.error('Error selecting status:', err);
         return res.status(500).json({ error: 'Failed to select status' });
       }
 
       
 
       db.query(qUpdate, [1, solutionID], (err) => {
         if (err) {
           console.error("Error updating status:", err);
           return res.status(500).json({ error: "Internal Server Error" });
         }
         console.log("Status updated successfully");
         if (solutionID.includes("CDP01")) {
          console.log("TRUE")
          res.redirect(`/formcdp1/${solutionID}/${round}?succ`);
        } else {
          res.redirect(`/formsmart/${solutionID}/${round}?success=true`);
        }
       });
     });
   }
};

//SaveformCdpPart1
exports.saveAnsObjcdp1 = (req, res, next) => {
  const dataArray = [];
  const kpiArray = [];
  const solutionID = req.params.solutionID;
  const qUpdate = "UPDATE solution SET status = 1 WHERE solutionID = ?";

  // Loop through request body to extract question-answer pairs
  for (const key in req.body) {
    if (key.startsWith('Q')) {
      const qKey = key;
      const aKey = 'A' + key.substring(1);
      const questionObj = {};
      questionObj['Question'] = req.body[qKey];
      questionObj['Answer'] = req.body[aKey];
      dataArray.push(questionObj);
    }
    // Extract KPI data
    if (key.startsWith(solutionID)) {
      const kpiKey = key.substring(solutionID.length + 1); // Extract KPI ID
      const kpiAnswer = req.body[key];
      const kpiID = kpiKey.split('-')[0]; // Extract the part before the dash
      kpiArray.push({ kpiID, kpiAnswer });
    }
  }

  // Check if the solutionID exists in the database
  const checkQuery = "SELECT * FROM `anssolution` WHERE `solutionID` = ?";
  db.query(checkQuery, [solutionID], (err, rows) => {
    if (err) {
      console.error("Error checking existing data:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // If solutionID exists, update the row; otherwise, insert a new row
    if (rows.length > 0) {
      const updateQuery = "UPDATE `anssolution` SET `timestamp` = ?, `ans` = ? WHERE `solutionID` = ?";
      db.query(updateQuery, [new Date(), JSON.stringify(dataArray), solutionID], (err, result) => {
        if (err) {
          console.error("Error updating data:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }
        console.log("Data updated successfully");
        // Update the status of the solution to 1 (indicating completion)
        db.query(qUpdate, [solutionID], (err, result) => {
          if (err) {
            console.error("Error updating status:", err);
            return res.status(500).json({ error: "Internal Server Error" });
          }
          console.log("Status updated successfully");
          return res.redirect(`/formcdp1/${req.params.solutionID}?success=true`);
        });
      });
    } else {
      const insertQuery = "INSERT INTO `anssolution`(`solutionID`, `timestamp`,`Round`, `ans`) VALUES (?,?,'1',?)";
      db.query(insertQuery, [solutionID, new Date(), JSON.stringify(dataArray)], (err, result) => {
        if (err) {
          console.error("Error inserting data:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }
        console.log("Data inserted successfully");
        // Update the status of the solution to 1 (indicating completion)
        db.query(qUpdate, [solutionID], (err, result) => {
          if (err) {
            console.error("Error updating status:", err);
            return res.status(500).json({ error: "Internal Server Error" });
          }
          console.log("Status updated successfully");
          return res.redirect(`/formcdp1/${req.params.solutionID}?success=true`);
        });
      });
    }
  });
};

exports.comfirmFormcheck = (req, res, next) => {
  // console.log(req.body);
  const data = req.body.dataChecks;
  const progress = data.A2; // Ensure this is correctly assigned
  const solutionID = req.params.solutionID;
  const timestamp = new Date();
  const round = req.params.round;
  const qselectQuery = "SELECT status FROM solution WHERE solutionID = ?";
  const qUpdate = "UPDATE solution SET status = ? WHERE solutionID = ?";
  const updateProgress = "UPDATE `solution` SET `Progress`=? WHERE solutionID=?";

  if (solutionID.length > 255) {
    return res.status(400).json({ error: 'solutionID exceeds the maximum length allowed' });
  }

  if (progress === undefined || progress === null) {
    return res.status(400).json({ error: 'Progress value is missing or invalid' });
  }
  // console.log("Active function")
  // send notification
  if (req.body.dataChecks.A1 === "ยกเลิก" || req.body.dataChecks.A1 === "ปรับแผน") {
    solutionID;
    // console.log("Active condition");
    const q = "SELECT citydata.province, solution.solutionName FROM `solution` JOIN citydata ON solution.cityID = citydata.cityID WHERE solution.solutionID = ?";
    
    try {
        db.query(q, [solutionID], (err, data) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).json(err);
            }

            const LINE_NOTIFY_TOKEN = "npl7B2crirxxrRoFmq3KFSNaR2xjGH4Ixn9G0KOUNDf";
            const message = "จังหวัด " + data[0].province + "โครงการ " +solutionID+" "+data[0].solutionName + "ขอ " + req.body.dataChecks.A1;
            const LINE_NOTIFY_API_URL = "https://notify-api.line.me/api/notify";

            axios.post(LINE_NOTIFY_API_URL, `message=${encodeURIComponent(message)}`, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`,
                },
            })
            .then(response => {
                console.log("Notification sent:", response.data);
                res.status(200).json({ message: "Notification sent successfully" });
            })
            .catch(error => {
                console.error("Error sending notification:", error);
                if (!res.headersSent) {
                    res.status(500).json({ error: "Failed to send notification" });
                }
            });
        });
    } catch (err) {
        console.error("Error during the request handling:", err);
        if (!res.headersSent) {
            res.status(500).json(err);
        }
    }
}

  let queries = [];
  let kpiQueries = [];

  for (const key in data) {
    if (key.startsWith('Q')) {
      const questionID = key.substring(1);
      const answerKey = `A${questionID}`;
      const answer = data[answerKey];
      if (answer !== undefined) {
        queries.push([
          solutionID,
          timestamp,
          questionID,
          round,
          answer
        ]);
      }
    } else if (key.startsWith(solutionID)) {  // Assuming KPI keys are like '6201ENV01-01'
      const kpiID = key;
      const answer = data[key];
      if (answer !== undefined) {
        kpiQueries.push([
          solutionID,
          kpiID,
          timestamp,
          answer,
          round
        ]);
      }
    }
  }

  const checkQuery = 'SELECT * FROM anssolution WHERE solutionID = ? AND Round=? AND questionID!=3';

  db.query(updateProgress, [progress, solutionID], (updateProgressErr) => {
    if (updateProgressErr) {
      console.error('Error updating progress:', updateProgressErr);
      return res.status(500).json({ error: 'Failed to update progress' });
    }

    db.query(checkQuery, [solutionID, round], (checkErr, checkResult) => {
      if (checkErr) {
        console.error('Error checking existing data:', checkErr);
        return res.status(500).json({ error: 'Failed to check existing data' });
      }

      if (checkResult.length > 0) {
        handleUpdates();
      } else {
        handleInserts();
      }
    });
  });

  function handleUpdates() {
    let completedUpdates = 0;
    const totalUpdates = queries.length + kpiQueries.length;

    const checkCompletion = () => {
      completedUpdates++;
      if (completedUpdates === totalUpdates) {
        updateStatusAndRedirect();
      }
    };

    // Update existing records in anssolution table
    queries.forEach(query => {
      const updateQuery = `
        UPDATE anssolution 
        SET timestamp = ?, Round = ?, ans = ?
        WHERE solutionID = ? AND questionID = ? AND Round=?
      `;
      db.query(updateQuery, [query[1], query[3], query[4], query[0], query[2], query[3]], (updateErr) => {
        if (updateErr) {
          console.error('Error updating data:', updateErr);
          return res.status(500).json({ error: 'Failed to update answers' });
        }
        checkCompletion();
      });
    });

    // Update existing records in anskpi table
    kpiQueries.forEach(query => {
      const updateKpiQuery = `
        UPDATE anskpi 
        SET timestamp = ?, ans = ?, Round = ?
        WHERE solutionID = ? AND kpiID = ? AND Round=?
      `;
      db.query(updateKpiQuery, [query[2], query[3], query[4], query[0], query[1], query[4]], (updateErr) => {
        if (updateErr) {
          console.error('Error updating KPI data:', updateErr);
          return res.status(500).json({ error: 'Failed to update KPI data' });
        }
        checkCompletion();
      });
    });

    if (totalUpdates === 0) {
      updateStatusAndRedirect();
    }
  }

  function handleInserts() {
    const insertQuery = `
      INSERT INTO anssolution (solutionID, timestamp, questionID, Round, ans) 
      VALUES ?
    `;
    db.query(insertQuery, [queries], (insertErr) => {
      if (insertErr) {
        console.error('Error inserting data:', insertErr);
        return res.status(500).json({ error: 'Failed to save answers' });
      }

      if (kpiQueries.length > 0) {
        const insertKpiQuery = `
          INSERT INTO anskpi (solutionID, kpiID, timestamp, ans, Round) 
          VALUES ?
        `;
        db.query(insertKpiQuery, [kpiQueries], (insertKpiErr) => {
          if (insertKpiErr) {
            console.error('Error inserting KPI data:', insertKpiErr);
            return res.status(500).json({ error: 'Failed to save KPI data' });
          }
          updateStatusAndRedirect();
        });
      } else {
        updateStatusAndRedirect();
      }
    });
  }

  function updateStatusAndRedirect() {
    db.query(qselectQuery, [solutionID], (err, selectData) => {
      if (err) {
        console.error('Error selecting status:', err);
        return res.status(500).json({ error: 'Failed to select status' });
      }

      db.query(qUpdate, [2, solutionID], (err) => {
        if (err) {
          console.error("Error updating status:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }
        console.log("Status updated successfully");
        if (solutionID.includes("CDP01")) {
          console.log("TRUE")
          res.redirect(`/formcdp1/${solutionID}/${round}?success=true`);
        } else {
          res.redirect(`/formsmart/${solutionID}/${round}?success=true`);
        }
      });
    });
  }
  
};

exports.postFormcheck = (req, res, next) => {
  const dataForm = req.body;
  const solutionid = req.params.solutionID;
  const round = req.params.round
  try {
    const q = "SELECT solution.*, city_home.* FROM solution JOIN city_home ON city_home.cityID = solution.cityID WHERE solution.solutionID = ?";
    const qKpi = "SELECT kpiID,	kpiName FROM kpi WHERE solutionID = ?"
    db.query(q, [solutionid], (err, data) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      db.query(qKpi,[solutionid],(err,datakpi)=>{
        if (err) return res.status(500).json({ error: "Internal Server Error KPI" });
        return res.render("formcheck", {
          data: data[0],
          dataCheck: dataForm,
          dataKpi:datakpi,
          round:round,
        });
      })
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};










