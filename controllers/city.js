const db = require("../db.js");
const moment = require('moment'); //à¹ƒà¸Šà¹‰à¹ƒà¸™à¸à¸²à¸£à¸„à¸³à¸™à¸§à¸“à¸§à¸±à¸™à¸—à¸µà¹ˆ

exports.GetCity = (req, res) => {
  const cityID = req.session.userID;
  const qCityData =
    "SELECT * FROM citydata JOIN city_home ON citydata.cityID = city_home.cityID WHERE citydata.cityID = ?";
  const qSolution =
    "SELECT `smartKey`,`solutionID` FROM `solution` WHERE cityID=? ";
  const qCityFile =
    "SELECT * FROM cityfile WHERE cityfile.cityID = ?";
  const qProvince="SELECT city_home.cityName FROM `citydata`JOIN `city_home` ON `citydata`.`cityID` = `city_home`.`cityID`WHERE `citydata`.`province` = ? AND `citydata`.`cityID` != ?;"
  const qRound = `
  SELECT *
  FROM round
  JOIN citydata ON round.Date = citydata.date
  WHERE citydata.cityID = ?
  ORDER BY round.round DESC;
  `
  try {
    db.query(qCityData, [cityID], (err, cityData) => {
      if (err) return res.status(500).json(err);
      const announcementDate = moment(cityData[0].date);
      const currentDate = moment();
      const duration = moment.duration(currentDate.diff(announcementDate));
      const years = duration.years();
      const months = duration.months();
      const days = duration.days();
      const totalDays = currentDate.diff(announcementDate, 'days'); //à¸™à¸±à¸šà¸§à¸±à¸™à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”
      const twoYearsLater = announcementDate.clone().add(2, 'years'); //à¸™à¸±à¸šà¸ˆà¸²à¸à¸§à¸±à¸™à¸—à¸µà¹ˆà¸›à¸£à¸°à¸à¸²à¸¨à¹„à¸›2à¸›à¸µ
      const twoYearsLaterFormatted = twoYearsLater.format('DD/MM/YYYY');


      
      const anvYear = moment(twoYearsLater);
      currentDate.hours(0).minutes(0).seconds(0).milliseconds(0);
      anvYear.hours(23).minutes(59).seconds(59).milliseconds(999);
      const durationAnv = moment.duration(anvYear.diff(currentDate));
      const anvYears = durationAnv.years();
      const anvMonths = durationAnv.months();
      const anvDays = durationAnv.days();
      const twoYearsLaterFormatThai = twoYearsLater.locale('th').add(543, 'years').format('DD MMMM YYYY'); // format in Thai months and Buddhist calendar year
      db.query(qSolution, [cityID], (err, solutionData) => {
        if (err) return res.status(500).json(err);

        const smartKeyCounts =  { 'ENE': 0, 'ENV': 0, 'GOV': 0, 'ECO': 0, 'LIV': 0, 'MOB': 0, 'CDP': 0,'PEO':0  };
        solutionData.forEach(row => {
          if (smartKeyCounts[row.smartKey]) {
            smartKeyCounts[row.smartKey]++;
          } else {
            smartKeyCounts[row.smartKey] = 1;
          }
        });

        db.query(qCityFile, [cityID], (err, cityFileData) => {
          if (err) return res.status(500).json(err);

          db.query(qProvince,[cityData[0].province,cityData[0].cityID],(err,province)=>{
          if (err) return res.status(500).json(err);
            db.query(qRound,[cityID],(err,dataRound)=>{
              if (err) return res.status(500).json(err);

              const openFormatNormal = moment(dataRound[0].open);
              const closeFormatNormal = moment(dataRound[0].close);
              const current = moment();
              openFormatNormal.hours(0).minutes(0).seconds(0).milliseconds(0);
              closeFormatNormal.hours(23).minutes(59).seconds(59).milliseconds(999);
              if (current >= openFormatNormal && current < closeFormatNormal) {
                req.session.isTime = true;
              } else {
                req.session.isTime = false;
              }

              //à¹€à¹€à¸›à¸¥à¸‡à¸§à¸±à¸™à¸ªà¸±à¸™à¹€à¸”à¸·à¸­à¸™à¸›à¸µ à¸žà¸¨.à¹„à¸—à¸¢
              const Open = moment(dataRound[0].open);
              const Close = moment(dataRound[0].close);
              const dateOpen = Open.locale('th').add(543, 'years').format('DD MMMM YYYY');
              const dateClose = Close.locale('th').add(543, 'years').format('DD MMMM YYYY');

              //à¹€à¸­à¸²à¸¡à¸²à¹€à¹€à¸¢à¸à¸„à¹ˆà¸²à¹€à¸›à¹‡à¸™ à¸§à¸±à¸™ à¹€à¸”à¸·à¸­à¸™ à¸›à¸µ
              const formStartDay = Open.date();
              const formStartMonth = Open.month() + 1; // month is zero-indexed
              const formStartMonthThai = Open.locale('th').format('MMMM');
              const formEndMonthThai = Close.locale('th').format('MMMM');
              const formStartYear = Open.year();
              const formEndDay = Close.date();
              const formEndMonth = Close.month() + 1; // month is zero-indexed
              const formEndYear = Close.year();


              //à¸„à¸³à¸™à¸§à¸“à¸§à¸±à¸™à¸—à¸µà¹ˆà¹€à¸«à¸¥à¸·à¸­à¹€à¸§à¸¥à¸²à¹ƒà¸™à¸à¸²à¸£à¸à¸£à¸­à¸à¸Ÿà¸­à¸£à¹Œà¸¡
              const formEndDate = moment([formEndYear-543, formEndMonth-1, formEndDay]);
              const currentDate = moment();
              formEndDate.hours(23).minutes(59).seconds(59).milliseconds(999);
              const durationEndForm = moment.duration(formEndDate.diff(currentDate));
              const remainingYears = durationEndForm.years();
              const remainingMonths = durationEndForm.months();
              const remainingDays = durationEndForm.days();
              //à¸„à¸³à¸™à¸§à¸“à¸§à¸±à¸™à¸—à¸µà¹ˆà¹€à¸«à¸¥à¸·à¸­à¹ƒà¸™à¸à¸²à¸£à¹€à¸›à¸´à¸”à¹ƒà¸«à¹‰à¸à¸£à¸­à¸à¸Ÿà¸­à¸£à¹Œà¸¡
              const formStartDate = moment([formStartYear-543, formStartMonth-1, formStartDay]);
              currentDate.hours(0).minutes(0).seconds(0).milliseconds(0);
              formStartDate.hours(23).minutes(59).seconds(59).milliseconds(999);
              const durationStartForm = moment.duration(formStartDate.diff(currentDate));
              const remainingYearStart = durationStartForm.years();
              const remainingMonthStart = durationStartForm.months();
              const remainingDayStart = durationStartForm.days();
              res.render("city/city", {
                req,
                cityName: cityData[0].province,
                pageTitle: cityData[0].cityname,
                path: "/city",
                cityInfo: cityData[0],
                citysolution: solutionData,
                smartKeyCounts: smartKeyCounts,// à¸ªà¹ˆà¸‡à¸ˆà¸³à¸™à¸§à¸™ smart key à¹à¸•à¹ˆà¸¥à¸°à¸•à¸±à¸§à¹ƒà¸™à¸­à¸­à¸šà¹€à¸ˆà¸à¸•à¹Œà¹„à¸›à¸¢à¸±à¸‡ view
                datafile: cityFileData,
                announcementDuration: { years, months, days, totalDays, twoYearsLaterFormatted,twoYearsLaterFormatThai,dateOpen,dateClose,anvDays,anvMonths,anvYears},
                province:province,
                dataRound:JSON.stringify(dataRound[0]),
                formDates: {
                  formStartDay,//à¸§à¸±à¸™à¸—à¸µà¹ˆà¹€à¸›à¸´à¸”à¸Ÿà¸­à¸£à¹Œà¸¡à¹€à¹€à¸šà¸šà¹€à¹€à¸¢à¸ à¸§à¸±à¸™ à¹€à¸”à¸·à¸­à¸™ à¸›à¸µ
                  formStartMonth,
                  formStartYear,
                  formEndDay,
                  formEndMonth,
                  formEndYear,
                  formStartMonthThai,//à¹€à¸”à¸·à¸­à¸™à¹„à¸—à¸¢
                  formEndMonthThai,
                  remainingDays,//à¸§à¸±à¸™à¸—à¸µà¹ˆà¹€à¸«à¸¥à¸·à¸­à¹€à¸§à¸¥à¸²à¸à¸£à¸­à¸à¸Ÿà¸­à¸£à¹Œà¸¡
                  remainingMonths,
                  remainingYears,
                  remainingDayStart,//à¸§à¸±à¸™à¸—à¸µà¹ˆà¹€à¸«à¸¥à¸·à¸­à¸—à¸µà¹ˆà¸Ÿà¸­à¸£à¹Œà¸¡à¸ˆà¸°à¹€à¸›à¸´à¸”
                  remainingMonthStart,
                  remainingYearStart,
                }
              });
            })
          })
              


        });
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.getCityDashboard = (req, res, next) => {
  const cityID = req.session.userID;
  const q = `SELECT solution.solutionID, MAX(smart.smart) AS smart, smart.smartKey, solution.solutionName, solution.Progress FROM solution JOIN smart ON solution.smartKey = smart.smartKey JOIN citydata ON citydata.cityID = solution.cityID JOIN city_home ON city_home.cityID = solution.cityID WHERE solution.cityID = ? GROUP BY solution.solutionID, smart.smartKey, solution.solutionName, solution.Progress;`;
  const qGetvalue = `SELECT * FROM anssolution JOIN solution ON anssolution.solutionID = solution.solutionID WHERE solution.cityID = ?;`;
  const qGetprogress = `SELECT * FROM solution JOIN anssolution ON solution.solutionID = anssolution.solutionID WHERE solution.cityID = ?;`;
  const qSmartKey = `SELECT smartKey,solutionName FROM solution  WHERE cityID=? `;
  const qRound = `SELECT * FROM round JOIN citydata ON round.Date = citydata.date WHERE citydata.cityID = ? ORDER BY round.round DESC;`;

  try {
    db.query(q, [cityID], (err, data) => {
      if (err) return res.status(500).json(err);

      const dataUpdate = data.map((row) => {
        let parsedStatus;
        try {
          parsedStatus = row.status ? JSON.parse(row.status) : {};
        } catch (err) {
          console.error(`Failed to parse status for solutionID ${row.solutionID}:`, err);
          parsedStatus = {}; // or some default value
        }
      
        return {
          ...row,
          status: parsedStatus,
        };
      });
      

      db.query(qGetvalue, [cityID], (err, value) => {
        if (err) return res.status(500).json(err);

        db.query(qGetprogress, [cityID], (err, dataProgress) => {
          if (err) return res.status(500).json(err);

          db.query(qRound, [cityID], (err, dataRound) => {
            if (err) return res.status(500).json(err);

            const announcementDate = moment(dataRound[0].date);
            const twoYearsLaterFormatted = announcementDate.clone().add(2, 'years');
            const twoYearsLaterDate = twoYearsLaterFormatted.toDate();

            db.query(qSmartKey, [cityID], (err, dataSmartkey) => {
              if (err) return res.status(500).json(err);

              if (dataProgress.length === 0) {
                const rounded = {};
                const smartKeyCounts = {};
                const problemPercentages = [];
                const successfulProjectsData = Array(10).fill(0);
                let unsuccessfulProjectsData = [];

                const averageProgressPerSmartKey = {};

                dataSmartkey.forEach((row) => {
                  if (smartKeyCounts[row.smartKey]) {
                    smartKeyCounts[row.smartKey]++;
                  } else {
                    smartKeyCounts[row.smartKey] = 1;
                  }
                });
                const count = Object.values(smartKeyCounts).reduce(
                  (acc, value) => acc + value,
                  0
                );

                unsuccessfulProjectsData = Object.values(smartKeyCounts);

                rounded["1"] = {
                  count: count,
                  complete: [],
                  progress: 0,
                  success: successfulProjectsData,
                  unsuccess: unsuccessfulProjectsData,
                  problem: problemPercentages,
                  smartkeycount: smartKeyCounts,
                  averageProgressPerSmart: averageProgressPerSmartKey,
                };

                res.render("city/dashboard", {
                  req,
                  pageTitle: "Dashboard",
                  cityName: data[0].province,
                  path: "/city",
                  solutionInfo: JSON.stringify(dataUpdate),
                  data: data,
                  valueInfo: value,
                  rounded: JSON.stringify(rounded),
                  dataRound: JSON.stringify(dataRound[0]),
                  twoYearsLaterDate: twoYearsLaterDate,
                });
                return;
              }

              const maxRound = Math.max(...dataProgress.map((row) => row.Round));
              const rounded = {};

              for (let round = 1; round <= maxRound; round++) {
                const roundData = dataProgress.filter((row) => row.Round == round);
                const smartKeyCounts = {};
                const projectSuccess = [];
                const successfulProjectsData = Array(10).fill(0);
                let unsuccessfulProjectsData = Array(10).fill(0);

                const validProblems = dataProgress.filter(
                  (row) => row.questionID == 5 && row.ans !== "null" && row.Round == round && row.ans !== "à¹„à¸¡à¹ˆà¸¡à¸µà¸›à¸±à¸à¸«à¸²/à¸­à¸¸à¸›à¸ªà¸£à¸£à¸„" && row.ans !== "à¸­à¸·à¹ˆà¸™ à¹†"
                );
                const totalProblems = validProblems.length;
                const problemCounts = {};

                validProblems.forEach((row) => {
                  if (problemCounts[row.ans]) {
                    problemCounts[row.ans]++;
                  } else {
                    problemCounts[row.ans] = 1;
                  }
                });

                const problemPercentages = Object.keys(problemCounts).map((key) => {
                  return {
                    problem: key,
                    percentage: ((problemCounts[key] / totalProblems) * 100).toFixed(2),
                  };
                });

                dataSmartkey.forEach((row) => {
                  if (smartKeyCounts[row.smartKey]) {
                    smartKeyCounts[row.smartKey]++;
                  } else {
                    smartKeyCounts[row.smartKey] = 1;
                  }
                });

                const count = Object.values(smartKeyCounts).reduce(
                  (acc, value) => acc + value,
                  0
                );

                const smartKeyProgress = {};
                const smartKeyCountsForAverage = {};
                let totalSum = 0;
                let totalCount = 0;

                roundData.forEach((item) => {
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

                    if (item.ans == 100) {
                      projectSuccess.push(item.solutionName);
                      successfulProjectsData[
                        Object.keys(smartKeyCounts).indexOf(item.smartKey)
                      ]++;
                    }
                  }
                });

                const smartKeyCountsValues = Object.values(smartKeyCounts);
                unsuccessfulProjectsData = smartKeyCountsValues.map(
                  (value, index) => value - successfulProjectsData[index]
                );

                const averageProgressPerSmartKey = {};

                Object.keys(smartKeyProgress).forEach((key) => {
                  if (key !== 'CDP') {
                    averageProgressPerSmartKey[key] = (
                      smartKeyProgress[key] / smartKeyCounts[key]
                    ).toFixed(2);
                  }
                });

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
                };
              }
              res.render("city/dashboard", {
                req,
                pageTitle: "Dashboard",
                cityName: data[0].province,
                path: "/city",
                solutionInfo: JSON.stringify(dataUpdate),
                data: data,
                valueInfo: value,
                rounded: JSON.stringify(rounded),
                dataRound: JSON.stringify(dataRound[0]),
                twoYearsLaterDate: twoYearsLaterDate,
              });
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



exports.getCityFollow = (req, res, next) => {
  const cityID = req.session.userID;
  const q = "SELECT solution.solutionID,solution.solutionName,solution.smartKey,solution.cityID,solution.status,solution.status_solution,smart.smart,city_home.cityName FROM solution JOIN smart ON solution.smartKey = smart.smartKey JOIN city_home ON city_home.cityID = solution.cityID WHERE solution.cityID = ? AND solution.status_solution=1 GROUP BY solution.solutionID, solution.solutionName,solution.smartKey,solution.cityID,solution.status_solution,smart.smart,city_home.cityName ORDER BY solution.solutionID ASC;";
  const qRound = "SELECT * FROM citydata JOIN round ON citydata.date = round.Date WHERE citydata.cityID = ? ORDER BY round.round DESC"
  try {
    db.query(q, [cityID], (err, data) => {
      if (err) return res.status(500).json(err);
      // console.log("Check follow data :",data)
      const currenttime = new Date();
      
      const followdata = data.map(row => {
        return {
          ...row,
          status: JSON.parse(row.status)
        };
      });
      
      db.query(qRound,[cityID],(err,dataRound)=>{
        // console.log(dataRound)
        const openForm = moment(dataRound[0].open);
        const closeForm = moment(dataRound[0].close);
        openForm.hours(0).minutes(0).seconds(0).milliseconds(0);
        closeForm.hours(23).minutes(59).seconds(59).milliseconds(999);
        
        if (err) return res.status(500).json(err);
        res.render("city/follow", {
          pageTitle: "Follow",
          path: "/city",
          cityName: dataRound[0].province,
          followdata: followdata || [],
          dataRound:dataRound[0],
          dateForm:{
            openForm: openForm.toISOString(),
            closeForm: closeForm.toISOString(),
          }
        });
      })
    });

  } catch (err) {
    console.log(err);
    res.status(500).json(err)
  }
};










exports.getCityUpload = (req, res, next) => {
  const cityid = req.session.userID
  const q="SELECT `province` FROM `citydata` WHERE cityID=? "
  db.query(q,[cityid],(err,province)=>{
    if (err) return res.status(500).json(err);
    res.render("city/upload", {
      pageTitle: "Upload",
      path: "/city",
      cityName: province[0].province,
      cityid:cityid,
    });
  })
  
};

exports.getHistory = (req, res, next) => {
  q = "SELECT * FROM `login_log` WHERE cityID = ?";
  // console.log(req.session.cityID)
  db.query(q, [req.session.userID], (err, data) => {
    if (err) return res.status(500).json(err);
    res.render("city/history-log", {
      pageTitle: "History",
      path: "/",
      data: data,
    });
  });
}
