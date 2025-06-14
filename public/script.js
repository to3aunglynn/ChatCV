document.getElementById("dark-toggle").addEventListener("change", (e) => {
  if (e.target.checked) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const darkToggle = document.getElementById("dark-toggle");
  darkToggle.checked = document.documentElement.classList.contains("dark");
});

document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generate");
  const downloadBtn = document.getElementById("download-pdf");
  const output = document.getElementById("output");
  const modal = document.getElementById("alert-modal");
  const closeModalBtn = document.getElementById("close-modal");

  generateBtn.addEventListener("click", async () => {
    const resume = document.getElementById("resume").value;
    const jobDesc = document.getElementById("job").value;

    if (!resume || !jobDesc) {
      // Show modal instead of alert
      modal.classList.remove("hidden");
      return;
    }

    output.textContent = "Generating tailored resume...";

    try {
      const response = await fetch("/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDesc }),
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

  downloadBtn.addEventListener("click", () => {
    const resume = document.getElementById("resume").value.trim();
    const jobDesc = document.getElementById("job").value.trim();

    if (!resume || !jobDesc) {
      // Show modal instead of alert
      modal.classList.remove("hidden");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const text = output.textContent.trim() || "No tailored resume to download.";

    const margin = 10;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - margin * 2;

    const lines = doc.splitTextToSize(text, maxLineWidth);
    let y = 20;

    lines.forEach((line) => {
      if (y + 10 > pageHeight) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 10;
    });

    doc.save("tailored_resume.pdf");
  });

  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
});
