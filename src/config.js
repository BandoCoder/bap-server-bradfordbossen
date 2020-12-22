module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://bfart@localhost/bap",
  JWT_SECRET: process.env.JWT_SECRET || "change-this.secret",
  CLIENT_ORIGIN: "https://bap-capstone1-bradfordbosen.bandocoder.vercel.app",
};
