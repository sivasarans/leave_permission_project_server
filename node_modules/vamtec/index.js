const { exec } = require("child_process");
const XLSX = require('xlsx');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { img } = require("./imgUploadModule"); // Import the image upload setup


// Function to check if a package is installed
function isPackageInstalled(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch (e) {
    return false;
  }
}

// Function to install dependencies
function installDependencies(packageName, callback) {
  if (isPackageInstalled(packageName)) {
    console.log(`${packageName} is already installed.`);
    callback(); // Proceed if already installed
  } else {
    console.log(`${packageName} is not installed. Installing now...`);
    exec(`npm install ${packageName}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(stdout);
      console.log(`${packageName} has been installed successfully!`);
      callback(); // Proceed after installation
    });
  }
}

// Function to generate Excel file
const generateExcel = (data, res) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Leave Requests');
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename=default.xlsx'
  }).send(XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));
};

// Function to generate CSV file
const generateCSV = (data, res) => {
  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(data);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=default.csv');
  res.send(csv);
};

// Function to generate PDF file
const generatePDF = (data, res, title = 'Report') => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename=default.pdf'
  });

  doc.pipe(res);

  // Title - Using the title parameter
  doc.fontSize(16).text(title, { align: 'center' }).moveDown(1.5);

  // Table Setup
  const headers = Object.keys(data[0] || {});
  const pageWidth = doc.page.width - doc.options.margin * 2;
  const columnWidths = headers.map(() => pageWidth / headers.length);
  const cellPadding = 10;

  let y = doc.y;

  // Function to Calculate Row Height
  const calculateRowHeight = (row) => {
    return Math.max(
      ...headers.map(header => {
        const cellText = row[header] ? String(row[header]) : 'N/A';
        const cellWidth = columnWidths[headers.indexOf(header)] - cellPadding * 2;
        const textHeight = doc.heightOfString(cellText, { width: cellWidth });
        return textHeight + cellPadding * 2;
      })
    );
  };

  // Draw Table Headers
  const headerHeight = calculateRowHeight(headers.reduce((obj, header) => ({ ...obj, [header]: header }), {}));
  headers.forEach((header, i) => {
    const x = doc.options.margin + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);

    // Draw header border
    doc.rect(x, y, columnWidths[i], headerHeight).stroke();

    // Draw header text
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(header.toUpperCase(), x + cellPadding, y + cellPadding, {
        width: columnWidths[i] - cellPadding * 2,
        align: 'center'
      });
  });

  y += headerHeight;

  // Draw Table Rows
  data.forEach(row => {
    const rowHeight = calculateRowHeight(row);

    headers.forEach((header, i) => {
      const cellText = row[header] ? String(row[header]) : 'N/A';
      const x = doc.options.margin + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);

      // Draw cell border
      doc.rect(x, y, columnWidths[i], rowHeight).stroke();

      // Draw cell text
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(cellText, x + cellPadding, y + cellPadding, {
          width: columnWidths[i] - cellPadding * 2,
          align: 'left'
        });
    });

    y += rowHeight;

    // Check if a new page is needed
    if (y > doc.page.height - doc.options.margin - rowHeight) {
      doc.addPage();
      y = doc.options.margin;
    }
  });

  // Footer (if needed)
  const footerText = ''; // You can add your footer text here
  doc
    .fontSize(12)
    .text(footerText, doc.page.width / 2 - doc.widthOfString(footerText) / 2, doc.page.height - 30, { align: 'center' });

  doc.end();
};



// Main function to handle package installation and start server setup
function main() {
  installDependencies("xlsx", () => {
    installDependencies("json2csv", () => {
      installDependencies("pdfkit", () => {
        console.log("Modules loaded successfully!");
        console.log("yes"); // After package installation, print "yes"
      });
    });
  });
}

// Export the main function along with the generate functions
module.exports = {
  main,
  generateExcel,
  generateCSV,
  generatePDF,
  img,
};

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}
