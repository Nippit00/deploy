const axios = require("axios");
const cron = require("node-cron");
const db = require("../db.js");
const moment = require('moment');

// Function to send notification
const sendNotification = () => {
  const CityID = '6201ECO01';
  const q = "SELECT citydata.province, solution.solutionName FROM `solution` JOIN citydata ON solution.cityID = citydata.cityID WHERE solution.solutionID = ?";

  db.query(q, [CityID], (err, data) => {
    if (err) {
      console.error("Database query error:", err);
      return;
    }

    const LINE_NOTIFY_TOKEN = "npl7B2crirxxrRoFmq3KFSNaR2xjGH4Ixn9G0KOUNDf";
    const message = "จังหวัด" + data[0].province + data[0].solutionName + "เทส";
    const LINE_NOTIFY_API_URL = "https://notify-api.line.me/api/notify";

    axios.post(LINE_NOTIFY_API_URL, `message=${message}`, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`,
      },
    })
    .then((response) => {
      console.log("Notification sent:", response.data);
    })
    .catch((error) => {
      console.error("Error sending notification:", error);
    });
  });
};

// Express route handler for manual trigger
exports.notification = (req, res, next) => {
  sendNotification();
  res.status(200).json({ message: "Notification sent successfully" });
};


cron.schedule('0 9 * * *', () => {
  const qDate = "SELECT Date,open,close FROM round";
db.query(qDate, (err, dataDate) => {
    if (err) return res.status(500).json(err);

    const q = `
    SELECT citydata.province, 
    city_home.cityName, 
    COUNT(*) AS total, 
    SUM(CASE WHEN solution.status = 0 THEN 1 ELSE 0 END) AS status_zero_count, 
    citydata.date FROM solution 
    JOIN citydata ON citydata.cityID = solution.cityID 
    JOIN city_home ON city_home.cityID = citydata.cityID 
    GROUP BY city_home.cityName;
    `;

    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);
  
      const currentDate = new Date();
      const result = data.map(row => {
          const percentage = (row.status_zero_count / row.total) * 100;
          return {
              cityName: row.cityName,
              province: row.province,
              percentage: Math.round(percentage) + '%',
              date: new Date(row.date) // แปลง date ให้เป็น Date object
          };
      });
  
      const finalResults = [];
  
      dataDate.some(cityDate => {
          const closeForm = new Date(cityDate.close);
          const fifteenDaysBeforeClose = new Date(closeForm);
          const DayClose = new Date(closeForm);
          const fifteenDaysAfterClose = new Date(closeForm);
  
          fifteenDaysBeforeClose.setDate(closeForm.getDate() - 15);
          fifteenDaysAfterClose.setDate(closeForm.getDate() + 15);
  
          if (
              currentDate.toDateString() === fifteenDaysBeforeClose.toDateString() || 
              currentDate.toDateString() === DayClose.toDateString() || 
              currentDate.toDateString() === fifteenDaysAfterClose.toDateString()
          ) {
              finalResults.push(...result);
  
              const messageHeader = `แจ้งเตือน: การกรอกแบบฟอร์มที่ยังไม่เสร็จ\n`;
              const messageBody = finalResults.map((solution, i) => {
                  const province = solution.province || 'ไม่ทราบจังหวัด';
                  return `${i + 1} ชื่อเมือง: ${solution.cityName} \nจังหวัด: ${province}  \nยังไม่ได้กรอก: ${solution.percentage}\n`;
              });
  
              let messageFooter;
              if (currentDate.toDateString() === fifteenDaysBeforeClose.toDateString()) {
                  messageFooter = `\nต้องดำเนินการภายใน 15 วันก่อนถึงวันที่ ${closeForm.toLocaleDateString('th-TH')}.`;
              } else if (currentDate.toDateString() === DayClose.toDateString()) {
                  messageFooter = `\nต้องดำเนินการภายในวันนี้ ${closeForm.toLocaleDateString('th-TH')}.`;
              } else {
                  messageFooter = `\nหมดช่วงเวลากรอกฟอร์มมาแล้ว 15 วัน ตั้งแต่วันที่ ${closeForm.toLocaleDateString('th-TH')}.`;
              }
  
              const fullMessages = [`${messageHeader}`, ...messageBody, `${messageFooter}`];
  
              const LINE_NOTIFY_TOKEN = "npl7B2crirxxrRoFmq3KFSNaR2xjGH4Ixn9G0KOUNDf";
              const LINE_NOTIFY_API_URL = "https://notify-api.line.me/api/notify";
  
              // Function to send message via LINE Notify
              function sendLineNotification(message) {
                  return axios.post(LINE_NOTIFY_API_URL, `message=${encodeURIComponent(message)}`, {
                      headers: {
                          "Content-Type": "application/x-www-form-urlencoded",
                          Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`,
                      },
                  });
              }
  
              // Function to chunk messages without breaking sentences
              function chunkMessages(messages, chunkSize) {
                  const chunks = [];
                  let currentChunk = '';
  
                  messages.forEach(message => {
                      if ((currentChunk.length + message.length) <= chunkSize) {
                          // If adding the next message won't exceed the chunk size, add it to the current chunk
                          currentChunk += `${message}\n`;
                      } else {
                          // Otherwise, push the current chunk to chunks and start a new chunk
                          chunks.push(currentChunk.trim());
                          currentChunk = `${message}\n`;
                      }
                  });
  
                  // Push any remaining text in the current chunk to chunks
                  if (currentChunk.length > 0) {
                      chunks.push(currentChunk.trim());
                  }
  
                  return chunks;
              }
  
              // Split the full message into chunks of up to 1000 characters each
              const maxLength = 1000; // LINE Notify message length limit
              const messageChunks = chunkMessages(fullMessages, maxLength);
  
              // Send each chunk sequentially
              messageChunks.reduce((promise, chunk) => {
                  return promise.then(() => sendLineNotification(chunk));
              }, Promise.resolve())
              .then(() => {
                  console.log("All notifications sent successfully.");
              })
              .catch(error => {
                  console.error("Error sending notification:", error.response ? error.response.data : error.message);
              });
  
              return true; // Stop the loop when the condition is met
          }
          return false;
      });
  });
  
});




});


// Initialize your express app and routes here
const express = require('express');
const app = express();

