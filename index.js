require("dotenv").config();
const express = require("express");
const app = express();
const connectDb = require("./db/connectDb");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const errorHandler = require("./utils/errorHandler");
const morgan = require("morgan");

app.use(fileUpload());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);
app.use(express.static("public"));
app.use(morgan("dev"));

connectDb();

// importing the api routes
const userRoutes = require("./routes/user");
const projectRoutes = require("./routes/project");
const esewaRoutes = require("./routes/esewa");

app.use("/api/user", userRoutes);
app.use("/api/project", projectRoutes);
app.use("/api", esewaRoutes);

// Global error handler middleware
app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

module.exports = app;
