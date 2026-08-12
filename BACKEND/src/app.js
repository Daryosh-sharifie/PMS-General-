const express= require('express');
const globalErrorHundler= require('./Controllers/globalErrorHundler');
const cookieParser=require('cookie-parser')
const dotenv= require('dotenv');
const morgan=require('morgan')
const cors=require('cors')
const appSettingRouter = require('./Routes/appSettingRouter');
const patientRouter = require('./Routes/patientRouter');
const authRouter = require('./Routes/authRouter');
const userRouter = require('./Routes/userRouter');
const prescriptionRouter = require('./Routes/prescriptionRouter');
const medicineRouter = require('./Routes/medicineRouter');
const activityRouter = require('./Routes/activityRouter');
const backupRouter = require('./Routes/backupRouter');
const labTestsRouter = require('./Routes/labTestRouter');
const labOrdersRouter = require('./Routes/labOrderRouter');
const labOrderItemRouter = require("./routes/labOrderItemRouter");
const medicineCategoryRouter = require('./Routes/medicineCategoryRouter');
const medicineFrequencyRouter = require('./Routes/medicineFrequencyRouter');
const medicineMealTimingRouter = require('./Routes/medicineMealTimingRouter');

dotenv.config();
 
const app= express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('dev'));


const allowedOrigins = [
  'http://localhost:5173',
  'https://4dk6jdrq-5173.euw.devtunnels.ms',
  'http://192.168.0.195:5173',
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:5173$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((entry) =>
      entry instanceof RegExp ? entry.test(origin) : entry === origin
    );
    if (allowed) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));


app.use('/uploads', express.static('uploads'));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/app-setting', appSettingRouter);
app.use('/api/v1/app-settings', appSettingRouter);
app.use('/api/v1/patients', patientRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/prescriptions', prescriptionRouter);
app.use('/api/v1/medicines', medicineRouter);
app.use('/api/v1/medicine-categories', medicineCategoryRouter);
app.use('/api/v1/medicine-frequencies', medicineFrequencyRouter);
app.use('/api/v1/medicine-meal-timings', medicineMealTimingRouter);
app.use('/api/v1/activity', activityRouter);
app.use('/api/v1/backup', backupRouter);
app.use('/api/v1/lab', labTestsRouter);
app.use('/api/v1/lab-orders', labOrdersRouter);
app.use("/api/v1/lab-order-items", labOrderItemRouter);




app.use(globalErrorHundler);
module.exports= app;