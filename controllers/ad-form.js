const db = require("../db.js");

exports.getformSmart = (req, res, next) => {
    const solutionid = req.params.solutionID;

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
        db.query(q1, [solutionid.slice(0, 4), solutionid], (err, data) => {
            if (err) return res.status(500).json(err);
            db.query(q2, [solutionid], (err, dataOld) => {
                // console.log(dataOld)
                if (err) return res.status(500).json(err);
                db.query(q3, (err, question) => {
                    if (err) return res.status(500).json(err);
                    db.query(q4, [solutionid], (err, kpi) => {
                        // console.log("length: "+JSON.stringify(kpi[0].Round))
                        if (err) return res.status(500).json(err);
                        if (kpi.length > 0) {
                            res.render("admin/ad-form/ad-form-smart", {
                                kpiQ: kpi,
                                formdata: data,
                                dataOld: dataOld || [],
                                csrfToken: req.csrfToken(),
                                question: question,
                                round: JSON.stringify(kpi[0].Round),
                            });
                        } else {
                            const q5 = "SELECT * FROM `kpi` WHERE solutionID = ?";
                            db.query(q5, [solutionid], (err, kpi) => {
                                if (err) return res.status(500).json(err);
                                res.render("admin/ad-form/ad-form-smart", {
                                    kpiQ: kpi,
                                    formdata: data,
                                    dataOld: dataOld || [],
                                    csrfToken: req.csrfToken(),
                                    question: question,
                                    round: 1,
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

// //Get formcdpPart1
exports.getformCdp1 = (req, res, next) => {
    const solutionid = req.params.solutionID;

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
        db.query(q1, [solutionid.slice(0, 4), solutionid], (err, data) => {
            if (err) return res.status(500).json(err);
            db.query(q2, [solutionid], (err, dataOld) => {
                // console.log(dataOld)
                if (err) return res.status(500).json(err);
                db.query(q3, (err, question) => {
                    if (err) return res.status(500).json(err);
                    db.query(q4, [solutionid], (err, kpi) => {
                        // console.log("length: "+JSON.stringify(kpi[0].Round))
                        if (err) return res.status(500).json(err);
                        if (kpi.length > 0) {
                            res.render("admin/ad-form/ad-form-cdpPart1", {
                                kpiQ: kpi,
                                formdata: data,
                                dataOld: dataOld || [],
                                csrfToken: req.csrfToken(),
                                question: question,
                                round: JSON.stringify(kpi[0].Round),
                            });
                        } else {
                            const q5 = "SELECT * FROM `kpi` WHERE solutionID = ?";
                            db.query(q5, [solutionid], (err, kpi) => {
                                if (err) return res.status(500).json(err);
                                res.render("admin/ad-form/ad-form-cdpPart1", {
                                    kpiQ: kpi,
                                    formdata: data,
                                    dataOld: dataOld || [],
                                    csrfToken: req.csrfToken(),
                                    question: question,
                                    round: 1,
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
    //   console.log("req.body :",req.body)
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

        db.query(checkQuery, [solutionID, round], (checkErr, checkResult) => {
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
        const updateStatus = 'UPDATE `solution` SET `status`=1 WHERE solutionID=?'
        db.query(updateStatus, [solutionID], (err, selectData) => {
            if (err) {
                console.error('Error selecting status:', err);
                return res.status(500).json({ error: 'Failed to select status' });
            }
            console.log("Status updated successfully");
            if (solutionID.includes("CDP01")) {
                console.log("TRUE")
                res.redirect(`/formcdp1/${solutionID}?success=true`);
            } else {
                res.redirect(`/ad_formsmart/${solutionID}?success=true`);
            }
            ;
        });
    }
};

exports.Approve = (req, res, next) => {

    const data = req.body;
    const progress = req.body.A2;
    const solutionID = req.params.solutionID;
    const timestamp = new Date();
    const round = req.params.round;
    const qUpdate = "UPDATE solution SET status = ? WHERE solutionID = ?";
    const updateProgress = "UPDATE `solution` SET `Progress`=? WHERE solutionID=?";
    //   console.log("req.body :",req.body)
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

        db.query(checkQuery, [solutionID, round], (checkErr, checkResult) => {
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
        const updateStatus = 'UPDATE `solution` SET `status`=3 WHERE solutionID=?'
        db.query(updateStatus, [solutionID], (err, selectData) => {
            if (err) {
                console.error('Error selecting status:', err);
                return res.status(500).json({ error: 'Failed to select status' });
            }
            console.log("Status updated successfully");
            if (solutionID.includes("CDP01")) {
                console.log("TRUE")
                res.redirect(`/ad_formcdp1/${solutionID}?updatesuccess=true`);
            } else {
                res.redirect(`/ad_formsmart/${solutionID}?updatesuccess=true`);
            }
            ;
        });
    }
   
}
exports.CancleApprove = (req, res, next) => {

    const data = req.body;
    const progress = req.body.A2;
    const solutionID = req.params.solutionID;
    const timestamp = new Date();
    const round = req.params.round;
    const qUpdate = "UPDATE solution SET status = ? WHERE solutionID = ?";
    const updateProgress = "UPDATE `solution` SET `Progress`=? WHERE solutionID=?";
    //   console.log("req.body :",req.body)
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

        db.query(checkQuery, [solutionID, round], (checkErr, checkResult) => {
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
        const updateStatus = 'UPDATE `solution` SET `status`=2 WHERE solutionID=?'
        db.query(updateStatus, [solutionID], (err, selectData) => {
            if (err) {
                console.error('Error selecting status:', err);
                return res.status(500).json({ error: 'Failed to select status' });
            }
            console.log("Status updated successfully");
            if (solutionID.includes("CDP01")) {
                console.log("TRUE")
                res.redirect(`/ad_formcdp1/${solutionID}?canclesuccess=true`);
            } else {
                res.redirect(`/ad_formsmart/${solutionID}?canclesuccess=true`);
            }
            ;
        });
    }
   
}







