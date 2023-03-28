document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("data-form");
  const dataInput = document.getElementById("data-input");
  const fileNameInput = document.getElementById("file-name");
  const result = document.getElementById("result");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const dataInputValue = document.getElementById("data-input").value;
    const dataPoints = dataInputValue
      .split(/,|\s/)
      .map((point) => parseFloat(point.trim()))
      .filter((point) => !isNaN(point));

    const interpolatedData = interpolateData(dataPoints, 80);
    const fileName =
      document.getElementById("file-name-input").value || "interpolated_data";

    createCSVDownload(interpolatedData, fileName);
    createTrendlineSVG(interpolatedData, fileName);
  });
});

function interpolateData(data, targetLength) {
  if (data.length < 2) {
    return [];
  }

  const step = (data.length - 1) / (targetLength - 1);
  const interpolatedData = [];

  for (let i = 0; i < targetLength; i++) {
    const index = i * step;
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);

    if (upperIndex >= data.length) {
      interpolatedData.push(data[lowerIndex]);
    } else if (lowerIndex === upperIndex) {
      interpolatedData.push(data[lowerIndex]);
    } else {
      const weight = index - lowerIndex;
      const value = lerp(data[lowerIndex], data[upperIndex], weight);
      interpolatedData.push(value);
    }
  }

  interpolatedData[targetLength - 1] = data[data.length - 1];
  return interpolatedData;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function createCSVDownload(data, fileName) {
  const csvData = data
    .map((value, index) => `${index + 1},${value}`)
    .join("\n");
  const csvHeader = "Index,Data\n";
  const csvContent = csvHeader + csvData;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  createDownloadLink(
    url,
    fileName + ".csv",
    "text/csv;charset=utf-8;",
    "csv-link",
    "Download CSV"
  );
}

function createTrendlineSVG(data, fileName) {
  const svgWidth = 800;
  const svgHeight = 400;
  const padding = 40;

  const maxValue = Math.max(...data) || 1;
  const xScale = (index) =>
    (index / (data.length - 1)) * (svgWidth - 2 * padding) + padding;
  const yScale = (value) =>
    svgHeight - padding - (value / maxValue) * (svgHeight - 2 * padding);

  const pathPoints = data
    .map((value, index) => `${xScale(index)},${yScale(value)}`)
    .join(" L ");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", svgWidth);
  svg.setAttribute("height", svgHeight);

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const gradient = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "linearGradient"
  );

  const y1 = 100 * (padding / svgHeight);
  const y2 = 100 * ((svgHeight - padding) / svgHeight);

  gradient.setAttribute("id", "gradient");
  gradient.setAttribute("x1", "0%");
  gradient.setAttribute("y1", `${y1}%`);
  gradient.setAttribute("x2", "0%");
  gradient.setAttribute("y2", `${y2}%`);

  const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", "#272A32");
  stop1.setAttribute("stop-opacity", "0.6");

  const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop2.setAttribute("offset", "100%");
  stop2.setAttribute("stop-color", "#272A32");
  stop2.setAttribute("stop-opacity", "0");

  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  defs.appendChild(gradient);
  svg.appendChild(defs);

  const fillPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  fillPath.setAttribute("d", `M ${padding},${svgHeight - padding} L ${pathPoints} L ${svgWidth - padding},${svgHeight - padding} Z`);
  fillPath.setAttribute("fill", "url(#gradient)");
  fillPath.setAttribute("stroke", "none");

  const strokePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  strokePath.setAttribute("d", `M ${pathPoints}`);
  strokePath.setAttribute("fill", "none");
  strokePath.setAttribute("stroke", "#272A32");
  strokePath.setAttribute("stroke-width", 3);
  strokePath.setAttribute("stroke-linejoin", "round");
  strokePath.setAttribute("stroke-linecap", "round");

  svg.appendChild(fillPath);
  svg.appendChild(strokePath);

  const existingSVG = document.getElementById("trendline-svg");
  if (existingSVG) {
    existingSVG.remove();
  }

  svg.id = "trendline-svg";
  result.appendChild(svg);

  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const svgFileName = fileName + ".svg";
  createDownloadLink(
    svgUrl,
    svgFileName,
    "image/svg+xml;charset=utf-8",
    "svg-link",
    "Download SVG"
  );

  createCopyButton("Copy SVG", () => {
    navigator.clipboard.writeText(svgData).then(
      () => {
        console.log("SVG copied to clipboard");
      },
      (err) => {
        console.error("Could not copy SVG to clipboard", err);
      }
    );
  });
}

function createCopyButton(buttonText, onClick) {
  const button = document.createElement("button");
  button.textContent = buttonText;
  button.addEventListener("click", onClick);

  const existingButton = document.getElementById("copy-button");
  if (existingButton) {
    existingButton.remove();
  }

  button.id = "copy-button";
  result.appendChild(button);
}



function createDownloadLink(fileData, fileName, mimeType, linkId, linkText) {
  const downloadLink = document.createElement("a");
  downloadLink.href = fileData;
  downloadLink.download = fileName;
  downloadLink.textContent = linkText;

  if (mimeType === "image/svg+xml;charset=utf-8") {
    downloadLink.addEventListener("click", (event) => {
      setTimeout(() => {
        URL.revokeObjectURL(fileData);
      }, 1000);
    });
  }

  const existingLink = document.getElementById(linkId);
  if (existingLink) {
    existingLink.remove();
  }

  downloadLink.id = linkId;
  result.appendChild(downloadLink);
}
