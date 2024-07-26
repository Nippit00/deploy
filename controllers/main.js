const db = require("../db.js");
const moment = require('moment'); // Use for date calculations


const queryAsync = (query, values = []) => {
    return new Promise((resolve, reject) => {
      db.query(query, values, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  };
  

// Display the Welcome Page
exports.getWelcomePage = (req, res, next) => {
    res.render("welcome", { req, pageTitle: "Welcome", path: "/welcome" });
};

// Display the Main Page
exports.getMainPage = async (req, res, next) => {
  try {
    const queryCities = "SELECT citydata.cityID, city_home.cityName, citydata.province, citydata.date FROM `city_home` JOIN citydata ON city_home.cityID = citydata.cityID ORDER BY citydata.cityID ASC;";
    const queryAvgProgress = "SELECT cityID, AVG(Progress) AS AvgProgress FROM solution GROUP BY cityID";
    const queryCompletedSolutionsPercentage = `
      SELECT cityID, 
             COUNT(*) AS TotalSolutions, 
             SUM(CASE WHEN Progress = 100 AND status = 3 THEN 1 ELSE 0 END) AS CompletedSolutions,
             ROUND((SUM(CASE WHEN Progress = 100 AND status = 3 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 0) AS PercentageCompleted
      FROM solution
      GROUP BY cityID;
    `;

    // Use queryAsync to perform the queries
    const citiesData = await queryAsync(queryCities);
    const completionData = await queryAsync(queryCompletedSolutionsPercentage);
    const progressData = await queryAsync(queryAvgProgress);

    const updatedCitiesData = citiesData.map(city => {
      const announcementDate = moment(city.date);
      const currentDate = moment();
      const duration = moment.duration(currentDate.diff(announcementDate));
      const cityCompletionInfo = completionData.find(p => p.cityID === city.cityID) || { TotalSolutions: 0, CompletedSolutions: 0, PercentageCompleted: 0 };
      const cityProgress = progressData.find(p => p.cityID === city.cityID);

      return {
        ...city,
        years: duration.years(),
        months: duration.months(),
        days: duration.days(),
        averageProgress: cityProgress ? cityProgress.AvgProgress : "N/A", // Format average progress to 0 decimal places
        completionPercentage: cityCompletionInfo.PercentageCompleted
      };
    });

    res.render("main", {
      req,
      pageTitle: "City Overview",
      cityName: "ยินดีต้อนรับ",
      path: "/home",
      fetchData: updatedCitiesData,
    });
  } catch (error) {
    res.status(500).json({ error: "queryError", message: error.message });
  }
};
