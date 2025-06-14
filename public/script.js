// Dark mode toggle
document.getElementById("toggle-dark").addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
});

// Main logic after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generate");
  const downloadBtn = document.getElementById("download-pdf");
  const output = document.getElementById("output");

  generateBtn.addEventListener("click", async () => {
    const resume = document.getElementById("resume").value;
    const jobDesc = document.getElementById("job").value;

    if (!resume || !jobDesc) {
      alert("Please enter both resume and job description");
      return;
    }

    output.textContent = "Generating tailored resume...";

    try {
      const response = await fetch("/tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ resume, jobDesc })
      });

      const data = await response.json();

      if (data.tailoredResume) {
        output.textContent = data.tailoredResume;
      } else {
        output.textContent = "No tailored resume received.";
      }
    } catch (error) {
      output.textContent = "Error: " + error.message;
    }
  });

  // PDF download logic
  downloadBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const text = output.textContent.trim() || "No tailored resume to download.";

    const margin = 10;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - margin * 2;

    const lines = doc.splitTextToSize(text, maxLineWidth);
    let y = 20;

    lines.forEach(line => {
      if (y + 10 > pageHeight) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 10;
    });

    doc.save("tailored_resume.pdf");
  });
});
