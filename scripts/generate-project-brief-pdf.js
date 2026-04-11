const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "docs", "project-brief.md");
const outputPath = path.join(projectRoot, "docs", "project-brief.pdf");

const raw = fs.readFileSync(sourcePath, "utf8");
const lines = raw.split(/\r?\n/);

const doc = new PDFDocument({
  size: "A4",
  margin: 56,
  info: {
    Title: "Portal Deportivo - Brief",
    Author: "Codex",
    Subject: "Resumen funcional y estrategico del proyecto"
  }
});

doc.pipe(fs.createWriteStream(outputPath));
doc.font("Helvetica");

for (const line of lines) {
  if (!line.trim()) {
    doc.moveDown(0.55);
    continue;
  }

  if (line.startsWith("# ")) {
    doc.font("Helvetica-Bold").fontSize(21).fillColor("#0f1724").text(line.replace(/^# /, ""), { paragraphGap: 8 });
    doc.font("Helvetica").fillColor("#1f2937");
    continue;
  }

  if (line.startsWith("## ")) {
    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").fontSize(15).fillColor("#10243b").text(line.replace(/^## /, ""), { paragraphGap: 5 });
    doc.font("Helvetica").fontSize(10.5).fillColor("#1f2937");
    continue;
  }

  if (line.startsWith("### ")) {
    doc.moveDown(0.2);
    doc.font("Helvetica-Bold").fontSize(12.5).fillColor("#17344f").text(line.replace(/^### /, ""), { paragraphGap: 4 });
    doc.font("Helvetica").fontSize(10.5).fillColor("#1f2937");
    continue;
  }

  if (line.startsWith("- ")) {
    doc.font("Helvetica").fontSize(10.5).fillColor("#1f2937").text(`• ${line.slice(2)}`, { indent: 12, paragraphGap: 2 });
    continue;
  }

  if (/^\d+\./.test(line.trim())) {
    doc.font("Helvetica").fontSize(10.5).fillColor("#1f2937").text(line.trim(), { indent: 8, paragraphGap: 2 });
    continue;
  }

  doc.font("Helvetica").fontSize(10.5).fillColor("#1f2937").text(line, { lineGap: 2, paragraphGap: 4 });
}

doc.end();
console.log(outputPath);
