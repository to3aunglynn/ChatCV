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

  let isTailored = false; // 🧠 NEW FLAG

  generateBtn.addEventListener("click", async () => {
    const resume = document.getElementById("resume").value.trim();
    const jobDesc = document.getElementById("job").value.trim();

    if (!resume || !jobDesc) {
      modal.classList.remove("hidden");
      return;
    }

    const isNonsense = (text) => {
      return (
        text.length < 30 ||
        /^(.)\1+$/.test(text) ||
        !/\b[a-z]{3,}\b/i.test(text)
      );
    };

    if (isNonsense(resume) || isNonsense(jobDesc)) {
      output.textContent = "Please provide the relevant details so that I can assist you in rewriting the resume effectively to match the job description.";
      isTailored = false;
      return;
    }

    output.textContent = "Generating tailored resume...";
    isTailored = false;

    try {
      const response = await fetch("/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDesc }),
      });

      const data = await response.json();

      if (data.tailoredResume) {
        let rawOutput = data.tailoredResume;

        rawOutput = rawOutput.replace(/^([\s\S]{0,500}?)?(This rewritten resume|This tailored CV|This all-inclusive resume|Note:|Make sure|Insert your|Be sure to|Rewrite the resume|Summary:|Profile:).*?(\n{2,}|$)/gi, '');
        rawOutput = rawOutput.replace(/(?:Note|Make sure|Insert your|Be sure to|Feel free to).*$/gi, '');
        rawOutput = rawOutput.replace(/(\*\*|\-{2,}|__|==|##+)\s*$/gm, '');
        rawOutput = rawOutput.trim().replace(/\n{3,}/g, '\n\n');

        output.textContent = rawOutput.trim();
        isTailored = true; // ✅ Mark as tailored
      } else {
        output.textContent = "No tailored resume received.";
        isTailored = false;
      }
    } catch (error) {
      output.textContent = "Error: " + error.message;
      isTailored = false;
    }
  });

  downloadBtn.addEventListener("click", () => {
    const resume = document.getElementById("resume").value.trim();
    const jobDesc = document.getElementById("job").value.trim();
    const text = output.textContent.trim();

    if (!resume || !jobDesc) {
      modal.classList.remove("hidden");
      return;
    }

    if (!isTailored || !text || text === "Generating tailored resume...") {
      output.textContent = "Please tailor your resume first by clicking the Generate button before downloading.";
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const cleanText = text.replace(/(\*\*|\-{2,}|__|==|##+)\s*$/gm, '').trim();
    const margin = 10;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - margin * 2;

    const lines = doc.splitTextToSize(cleanText, maxLineWidth);
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

document.getElementById("resume-upload").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file || file.type !== "application/pdf") {
    alert("Please upload a valid PDF file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function () {
    const typedArray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      text += pageText + "\n";
    }

    document.getElementById("resume").value = text.trim();
  };
  reader.readAsArrayBuffer(file);
});
