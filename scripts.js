document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("data-form");
  const dataInput = document.getElementById("data-input");
  const fileNameInput = document.getElementById("file-name");
  const result = document.getElementById("result");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = dataInput.value.split(",").map(Number);
    const interpolatedData = interpolateData(data, 80);
    const sortedData = interpolatedData.sort((a, b) => a - b);
    const csvData = convertToCSV(sortedData);

    const fileName = `${fileNameInput.value}.csv`;
    createDownloadLink(csvData, fileName, "text/csv");
  });
});

function lerp(a, b, t) {
  return a + (b - a) * t;
}

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

  return interpolatedData;
}

function convertToCSV(data) {
  const header = "Index,Data\n";
  const rows = data.map((value, index) => `${index + 1},${value}`).join("\n");
  return header + rows;
}

function createDownloadLink(fileData, fileName, mimeType) {
  const downloadLink = document.createElement("a");
  const fileBlob = new Blob([fileData], { type: mimeType });
  const url = URL.createObjectURL(fileBlob);

  downloadLink.href = url;
  downloadLink.download = fileName;
  downloadLink.textContent = `Download ${fileName}`;

  // Remove any existing download link
  const existingLink = document.getElementById("download-link");
  if (existingLink) {
    existingLink.remove();
  }

  downloadLink.id = "download-link";
  result.appendChild(downloadLink);
}
