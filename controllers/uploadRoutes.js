const db = require("../db.js");
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Directory paths for uploads
const uploadDir = path.join(__dirname, '../public/uploads');
const uploadCdp = path.join(__dirname, '../public/uploadCdp');
const uploadReport = path.join(__dirname, '../public/uploadReport');

// Create directories if they don't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(uploadCdp)) {
    fs.mkdirSync(uploadCdp, { recursive: true });
}
if (!fs.existsSync(uploadReport)) {
    fs.mkdirSync(uploadReport, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.jpg') {
            const existingFilePath = path.join(uploadDir, req.params.solutionID + '.jpg');
            if (fs.existsSync(existingFilePath)) {
                // If it exists, delete the existing file
                fs.unlinkSync(existingFilePath);
            }
            cb(null, req.params.solutionID + '.jpg');
        } else {
            // Reject uploads of file types other than JPG
            const error = new Error('Only JPG files are allowed');
            error.code = 'LIMIT_FILE_TYPE';
            cb(error);
        }
    }
});


const storageCdp = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadCdp);
    },
    filename: function (req, file, cb) {
        if (file.originalname.startsWith(req.params.solutionID)) {
            const filePath = path.join(uploadCdp, file.originalname);
            fs.unlinkSync(filePath);
            cb(null, file.originalname);
        } else {
            cb(null, req.params.solutionID + path.extname(file.originalname));
        }
    }
});

const storageReport = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadReport);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, req.params.cityid + ext); // Save file with cityid as filename
    }
});


const upload = multer({ storage: storage });
const uploadCdp2 = multer({ storage: storageCdp });
const uploadReportTwoyear = multer({ storage: storageReport });


exports.uploadFile = upload.single('fileUpload');
exports.uploadFileCdp2 = uploadCdp2.single('fileUpload');
exports.uploadReport = uploadReportTwoyear.single('fileToUpload');

exports.handleUpload = (req, res) => {
    try {
        const solutionParam = req.params;
        // Ensure filename ends with .jpg
        console.log(path.extname(req.file.filename))
        const newFilename = path.basename(req.file.filename, path.extname(req.file.filename)) + '.jpg';
        const file_path = path.join('/public/uploads/', newFilename);

        const qInsert = "INSERT INTO `anssolution`(`solutionID`, `timestamp`, `questionID`, `ans`, `Round`) VALUES (?,'2024-06-30 00:00:00.001','3',?,?)";
        const qFetchData = "SELECT * FROM anssolution WHERE solutionID = ? AND round=? AND questionID='3'";
        const qUpdate = "UPDATE anssolution SET ans=? WHERE solutionID=? AND round=? AND questionID='3';";

        db.query(qFetchData, [solutionParam.solutionID, req.body.round], (err, fetchData) => {
            if (err) return res.status(500).json({ error: "FetchDataError", message: err });

            if (fetchData && fetchData.length > 0) {
                db.query(qUpdate, [file_path, solutionParam.solutionID, req.body.round], (err, updateData) => {
                    if (err) return res.status(500).json({ error: "UpdateError", message: err });
                    res.status(200).json({ message: 'File uploaded successfully' });
                });
            } else {
                db.query(qInsert, [solutionParam.solutionID, file_path, req.body.round], (err, insertData) => {
                    if (err) return res.status(500).json({ error: "InsertDataError", message: err });
                    res.status(200).json({ message: 'File uploaded successfully' });
                });
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "CatchError", message: err });
    }
};


exports.handleUploadReport = (req,res)=>{
    try{
        res.status(200).json({"status":"ok"})

    }catch(err){
        res.status(500).jsonO(err)
        console.log(err)
    }

}
