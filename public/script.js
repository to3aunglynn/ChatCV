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
    const resume = document.getElementById("resume").value.trim();
    const jobDesc = document.getElementById("job").value.trim();

    // Show modal if either is empty
    if (!resume || !jobDesc) {
      modal.classList.remove("hidden");
      return;
    }

    // Check for nonsense (basic heuristic: very short, repeated characters, or gibberish)
    const isNonsense = (text) => {
      return (
        text.length < 30 ||                                // too short
        /^(.)\1+$/.test(text) ||                           // aaa, 1111, zzzz
        !/\b[a-z]{3,}\b/i.test(text)                       // no real words
      );
    };

    if (isNonsense(resume) || isNonsense(jobDesc)) {
      output.textContent = "Please provide the relevant details so that I can assist you in rewriting the resume effectively to match the job description.";
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
        let rawOutput = data.tailoredResume;

        // Remove AI-style intros and extra notes
        rawOutput = rawOutput.replace(/^([\s\S]{0,500}?)?(This rewritten resume|This tailored CV|This all-inclusive resume|Note:|Make sure|Insert your|Be sure to|Rewrite the resume|Summary:|Profile:).*?(\n{2,}|$)/gi, '');
        rawOutput = rawOutput.replace(/(?:Note|Make sure|Insert your|Be sure to|Feel free to).*$/gi, '');
        rawOutput = rawOutput.replace(/(\*\*|\-{2,}|__|==|##+)\s*$/gm, '');
        rawOutput = rawOutput.trim().replace(/\n{3,}/g, '\n\n');

        output.textContent = rawOutput.trim();
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

    let text = output.textContent.trim();

    // Also strip any trailing junk from PDF output
    text = text.replace(/(\*\*|\-{2,}|__|==|##+)\s*$/gm, '').trim();


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
