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
