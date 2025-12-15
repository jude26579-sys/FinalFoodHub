import { format } from "date-fns";
 
/**
 * Generate a professional PDF report from report data
 * Uses html2canvas and jsPDF to create a nicely formatted PDF
 * @param {Object} reportData - The report data from backend
 */
export const generatePDF = async (reportData) => {
  try {
    // Dynamically import to avoid bloating the main bundle
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;
 
    // Create a temporary container for rendering
    const container = document.createElement("div");
    container.id = "pdf-content";
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "1000px";
    container.style.padding = "40px";
    container.style.backgroundColor = "white";
    container.style.fontFamily = "Arial, sans-serif";
 
    // Build HTML content
    const htmlContent = buildReportHTML(reportData);
    container.innerHTML = htmlContent;
    document.body.appendChild(container);
 
    // Generate canvas from HTML
    const canvas = await html2canvas(container, {
      scale: 2,
      logging: false,
      backgroundColor: "#ffffff",
      letterRendering: true,
    });
 
    // Create PDF
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgWidth = pageWidth - 20; // Account for margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
 
    const pdf = new jsPDF("p", "mm", "a4");
    let heightLeft = imgHeight;
    let position = 10; // Top margin
 
    // Add image to PDF, creating new pages as needed
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;
 
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
 
    // Download PDF
    const fileName = `sales_report_${format(new Date(), "yyyy-MM-dd_HHmmss")}.pdf`;
    pdf.save(fileName);
 
    // Clean up
    document.body.removeChild(container);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
 
/**
 * Build HTML content for the PDF report
 * @param {Object} reportData - The report data
 * @returns {string} HTML content
 */
const buildReportHTML = (reportData) => {
  const duration = reportData.duration || {};
  const startDate = duration.startDate || reportData.startDate || new Date();
  const endDate = duration.endDate || reportData.endDate || new Date();
 
  const totalSales = reportData.totalSales || 0;
  const totalOrders = reportData.orderCount || 0;
  const restaurantCount = reportData.restaurantCount || 0;
  const generatedDate = reportData.reportGeneratedAt
    ? format(new Date(reportData.reportGeneratedAt), "MMM dd, yyyy HH:mm:ss")
    : format(new Date(), "MMM dd, yyyy HH:mm:ss");
 
  const startDateFormatted = format(new Date(startDate), "MMM dd, yyyy");
  const endDateFormatted = format(new Date(endDate), "MMM dd, yyyy");
 
  // Calculate average order value
  const avgOrderValue = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0;
 
  let restaurantRowsHTML = "";
 
  if (reportData.restaurants && Array.isArray(reportData.restaurants)) {
    reportData.restaurants.forEach((restaurant, idx) => {
      const restaurantSales = restaurant.orders
        ? restaurant.orders.reduce(
            (sum, order) => sum + (order.orderSalesAmt || 0),
            0
          )
        : 0;
 
      const restaurantName =
        restaurant.restaurantName || `Restaurant ${restaurant.restaurantId}`;
 
      restaurantRowsHTML += `
        <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div>
              <h3 style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold;">
                ${restaurantName}
              </h3>
              <p style="margin: 0; font-size: 12px; color: #666;">
                Restaurant ID: ${restaurant.restaurantId}
              </p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">
                ₹${restaurantSales.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p style="margin: 0; font-size: 12px; color: #666;">
                ${restaurant.restaurantOrderCount} order(s)
              </p>
            </div>
          </div>
 
          ${
            restaurant.orders && restaurant.orders.length > 0
              ? `
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Order ID</th>
                  <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Amount (₹)</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                ${restaurant.orders
                  .map(
                    (order) => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">#${order.orderId}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">
                      ₹${order.orderSalesAmt.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: #666;">
                      ${format(new Date(order.createdAt), "MMM dd, yyyy HH:mm")}
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : `
            <p style="font-size: 12px; color: #999; text-align: center; padding: 10px;">
              No orders in this period
            </p>
          `
          }
        </div>
      `;
    });
  }
 
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <!-- Header -->
      <div style="border-bottom: 3px solid #ff6b35; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0; font-size: 24px; color: #ff6b35;">
          FoodHub - Order Details Report
        </h1>
        <p style="margin: 0; font-size: 12px; color: #666;">
          Report ID: ${reportData.reportId || "N/A"}
        </p>
        <p style="margin: 5px 0 0 0; font-size: 11px; color: #999;">
          ${startDateFormatted} to ${endDateFormatted} | Generated: ${generatedDate}
        </p>
      </div>
 
      <!-- Detailed Report Section -->
      <div>
        <h2 style="margin: 0 0 20px 0; font-size: 16px; font-weight: bold;">
          Order Details by Restaurant
        </h2>
        ${restaurantRowsHTML}
      </div>
 
      <!-- Footer -->
      <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 30px; text-align: center; font-size: 10px; color: #999;">
        <p style="margin: 0;">
          This is an auto-generated report. For official records, please verify with your administrator.
        </p>
        <p style="margin: 5px 0 0 0;">
          Generated on ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm:ss")}
        </p>
      </div>
    </div>
  `;
};