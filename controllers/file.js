const db = require('../db.js'); // เชื่อมต่อกับฐานข้อมูลของคุณ

exports.SaveFile = (req, res, next) => {
  try {
    // รับข้อมูลที่ส่งมาจากไคลเอนต์
    // const { base64File } = req.body;
    const cityID = req.session.userID;
    const timestamp = new Date();
    console.log(req.body.file)
    base64File=req.body.file
    // บันทึกข้อมูลลงในฐานข้อมูล
    const q = "INSERT INTO `2yearfileupload`( `cityID`, `timestamp`, `summitfile`) VALUES ( ?, ?, ?)";
    db.query(q, [cityID, timestamp, base64File], (err, result) => {
      if (err) {
          console.error("Error saving file:", err);
          return res.status(500).json({ error: "Failed to save file" });
      }
      console.log("File saved successfully");
      // ส่งข้อมูลการบันทึกกลับไปยังไคลเอนต์
      res.status(200);
  });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "An error occurred" });
  }
};

