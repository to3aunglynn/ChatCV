// Dark mode toggle
const darkToggle = document.getElementById("dark-toggle");
darkToggle.addEventListener("change", (e) => {
  if (e.target.checked) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  // Update overlay color if present
  const overlay = document.getElementById("resume-overlay");
  if (overlay) {
    const isDark = document.documentElement.classList.contains("dark");
    overlay.style.backgroundColor = isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.7)";
    overlay.style.color = isDark ? "#60a5fa" : "#2563EB";
    overlay.style.border = isDark ? "1.5px solid #334155" : "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const darkToggle = document.getElementById("dark-toggle");
  darkToggle.checked = document.documentElement.classList.contains("dark");
});

function showModal(message) {
  const modal = document.getElementById("alert-modal");
  const messageEl = document.getElementById("modal-message");
  if (messageEl) messageEl.textContent = message;
  modal.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generate");
  const downloadBtn = document.getElementById("download-pdf");
  const output = document.getElementById("output");
  const modal = document.getElementById("alert-modal");
  const closeModalBtn = document.getElementById("close-modal");

  let isTailored = false;

  generateBtn.addEventListener("click", async () => {
    const resume = document.getElementById("resume").value.trim();
    const jobDesc = document.getElementById("job").value.trim();

    if (!resume || !jobDesc) {
      showModal("Please enter both your Resume and Job Description before generating.");
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
      output.textContent =
        "Please provide the relevant details so that I can assist you in rewriting the resume effectively to match the job description.";
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

        rawOutput = rawOutput.replace(
          /^([\s\S]{0,500}?)?(This rewritten resume|This tailored CV|This all-inclusive resume|Note:|Make sure|Insert your|Be sure to|Rewrite the resume|Summary:|Profile:).*?(\n{2,}|$)/gi,
          ""
        );
        rawOutput = rawOutput.replace(/(?:Note|Make sure|Insert your|Be sure to|Feel free to).*$/gi, "");
        rawOutput = rawOutput.replace(/(\*\*|\-{2,}|__|==|##+)\s*$/gm, "");
        rawOutput = rawOutput.trim().replace(/\n{3,}/g, "\n\n");

        output.textContent = rawOutput.trim();
        isTailored = true;
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
      showModal("Please enter both your Resume and Job Description before downloading.");
      return;
    }

    if (!isTailored || !text || text === "Generating tailored resume...") {
      showModal("Please tailor your resume first by clicking the Generate button before downloading.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const cleanText = text.replace(/(\*\*|\-{2,}|__|==|##+)\s*$/gm, "").trim();
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

// PDF Upload & Extraction + Blur + Overlay handling
document.getElementById("resume-upload").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file || file.type !== "application/pdf") {
    showModal("Please upload a valid PDF file.");
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

    text = text.trim();

    const isNonsense = (t) => {
      return (
        t.length < 30 ||
        /^(.)\1+$/.test(t) ||
        !/\b[a-z]{3,}\b/i.test(t)
      );
    };

    if (isNonsense(text)) {
      showModal("The uploaded PDF does not appear to contain a valid resume. Please upload a proper resume PDF.");
      return;
    }

    const resumeTextarea = document.getElementById("resume");
    // The wrapper div is the parent of the textarea
    const wrapper = resumeTextarea.parentElement;

    // Put extracted text in textarea
    resumeTextarea.value = text;

    // Apply blur and disable editing
    resumeTextarea.classList.add("blurred");
    resumeTextarea.disabled = true;

    // Create or show overlay with success message
    let overlay = document.getElementById("resume-overlay");
    wrapper.style.position = "relative";

    // Determine background and text color based on dark mode
    const isDark = document.documentElement.classList.contains("dark");
    const overlayBg = isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.7)"; // darker slate-800 for dark
    const overlayColor = isDark ? "#60a5fa" : "#2563EB"; // blue-400 for dark, blue-600 for light
    const overlayBorder = isDark ? "1.5px solid #334155" : "none";

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "resume-overlay";
      Object.assign(overlay.style, {
        position: "absolute",
        top: resumeTextarea.offsetTop + "px",
        left: resumeTextarea.offsetLeft + "px",
        width: resumeTextarea.offsetWidth + "px",
        height: resumeTextarea.offsetHeight + "px",
        backgroundColor: overlayBg,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "1.5rem",
        fontWeight: "600",
        color: overlayColor,
        pointerEvents: "none",
        borderRadius: "0.5rem",
        zIndex: "10",
        userSelect: "none",
        transition: "background-color 0.3s, color 0.3s",
      });
      overlay.textContent = "PDF uploaded successfully";
      wrapper.appendChild(overlay);
    } else {
      overlay.style.display = "flex";
      // Update overlay size/position and color in case of resize or mode change
      overlay.style.top = resumeTextarea.offsetTop + "px";
      overlay.style.left = resumeTextarea.offsetLeft + "px";
      overlay.style.width = resumeTextarea.offsetWidth + "px";
      overlay.style.height = resumeTextarea.offsetHeight + "px";
      overlay.style.backgroundColor = overlayBg;
      overlay.style.color = overlayColor;
    }
  };
  reader.readAsArrayBuffer(file);
});

document.getElementById("clear-upload").addEventListener("click", () => {
  const fileInput = document.getElementById("resume-upload");
  const resumeTextarea = document.getElementById("resume");
  const overlay = document.getElementById("resume-overlay");

  // Clear file input
  fileInput.value = "";

  // Clear resume textarea
  resumeTextarea.value = "";

  // Remove or hide overlay and blur effect
  if (overlay) {
    overlay.style.display = "none";
  }

  // Remove blur effect and enable editing
  resumeTextarea.classList.remove("blurred");
  resumeTextarea.disabled = false;
});
