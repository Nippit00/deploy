const db = require('../db.js');
const moment = require('moment'); // For date manipulation

// Display the Welcome Page
exports.getWelcomePage = (req, res, next) => {
  res.render("welcome", { req, pageTitle: "Welcome", path: "/welcome" });
};

// Display the Main Page
exports.getMainPage = async (req, res, next) => {
  const queryCities = `
    SELECT citydata.cityID, city_home.cityName, citydata.province, citydata.date 
    FROM city_home 
    JOIN citydata ON city_home.cityID = citydata.cityID 
    ORDER BY citydata.cityID ASC;
  `;
  const queryAvgProgress = "SELECT cityID, AVG(Progress) AS AvgProgress FROM solution GROUP BY cityID";
  const queryCompletedSolutionsPercentage = `
    SELECT cityID, 
           COUNT(*) AS TotalSolutions, 
           SUM(CASE WHEN Progress = 100 AND status = 3 THEN 1 ELSE 0 END) AS CompletedSolutions,
           ROUND((SUM(CASE WHEN Progress = 100 AND status = 3 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 0) AS PercentageCompleted
    FROM solution
    GROUP BY cityID;
  `;

  try {
    const [citiesData] = await db.query(queryCities);
    const [completionData] = await db.query(queryCompletedSolutionsPercentage);
    const [progressData] = await db.query(queryAvgProgress);

    const updatedCitiesData = citiesData.map(city => {
      const announcementDate = moment(city.date);
      const currentDate = moment();
      const duration = moment.duration(currentDate.diff(announcementDate));
      const cityCompletionInfo = completionData.find(p => p.cityID === city.cityID) || { TotalSolutions: 0, CompletedSolutions: 0, PercentageCompleted: 0 };
      const cityProgress = progressData.find(p => p.cityID === city.cityID);

      let averageProgress = "N/A";
      if (cityProgress && cityProgress.AvgProgress !== null && cityProgress.AvgProgress !== undefined) {
        averageProgress = parseFloat(cityProgress.AvgProgress).toFixed(0);
      }

      return {
        ...city,
        years: duration.years(),
        months: duration.months(),
        days: duration.days(),
        averageProgress,
        completionPercentage: cityCompletionInfo.PercentageCompleted
      };
    });

    res.render("main", {
      req,
      pageTitle: "City Overview",
      cityName: "City Overview",
      path: "/home",
      fetchData: updatedCitiesData,
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: "queryError", message: error.message });
  }
};
