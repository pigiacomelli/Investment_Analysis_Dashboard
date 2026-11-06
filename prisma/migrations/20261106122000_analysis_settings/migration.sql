CREATE TABLE "AnalysisSettings" (
    "investmentId" TEXT NOT NULL PRIMARY KEY,
    "durationMonths" REAL NOT NULL DEFAULT 6,
    "benchmarkAnnualRatePercent" REAL NOT NULL DEFAULT 10.75,
    CONSTRAINT "AnalysisSettings_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
