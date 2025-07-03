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
  let lastRawCVText = '';

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

        lastRawCVText = rawOutput.trim();
        // Format for on-screen display
        output.innerHTML = formatCVTextToHTML(rawOutput.trim());
        output.style.fontFamily = 'inherit';
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
    const pdfText = lastRawCVText || text;

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

    // --- Modern Compact CV PDF Layout ---
    // Parse the CV into sections and fields
    const lines = pdfText.split(/\r?\n/);
    let name = '';
    let title = '';
    let contact = [];
    let sections = {};
    let currentSection = null;
    let firstNonEmpty = 0;
    // Helper to clean headings and lines
    function cleanHeading(line) {
      return line.replace(/^[#*\s]+/, '').replace(/[:#*\s]+$/, '').trim();
    }
    // Parse name, title, contact
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;
      if (firstNonEmpty === 0) { name = trimmed; firstNonEmpty++; continue; }
      if (firstNonEmpty === 1) { title = trimmed; firstNonEmpty++; continue; }
      if (firstNonEmpty < 4) { contact.push(trimmed); firstNonEmpty++; continue; }
      break;
    }
    // Parse sections (robust to markdown/asterisks)
    const sectionOrder = [
      'Personal Statement', 'Personal Profile', 'Professional Overview',
      'Work experience', 'Experience', 'Employment',
      'Education', 'Skills', 'Additional Information'
    ];
    const sectionRegex = new RegExp(`^(${sectionOrder.join('|')})$`, 'i');
    let sec = null;
    for (let i = firstNonEmpty; i < lines.length; i++) {
      let cleaned = cleanHeading(lines[i]);
      if (!cleaned) continue;
      if (sectionRegex.test(cleaned)) {
        sec = cleaned;
        if (!sections[sec]) sections[sec] = [];
        continue;
      }
      if (sec) sections[sec].push(lines[i].replace(/^[#*\s]+/, '').replace(/[#*\s]+$/, '').trim());
    }
    // PDF layout settings
    const nameFontSize = 19;
    const titleFontSize = 13;
    const headingFontSize = 14;
    const subheadingFontSize = 12;
    const baseFontSize = 11;
    const contactFontSize = 10;
    const margin = 18;
    const lineSpacing = baseFontSize * 1.15;
    let y = 28;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - margin * 2;
    doc.setFont('helvetica');
    // Name (large, bold, left)
    doc.setFontSize(nameFontSize);
    doc.setFont(undefined, 'bold');
    doc.text(name || 'Your Name', margin, y, { align: 'left' });
    // Contact info (top right, gray)
    if (contact.length) {
      doc.setFontSize(contactFontSize);
      doc.setTextColor(120, 120, 120);
      let cy = margin;
      contact.forEach((c) => {
        doc.text(c, pageWidth - margin, cy, { align: 'right' });
        cy += contactFontSize + 1;
      });
      doc.setTextColor(0, 0, 0);
    }
    // Title (smaller, gray, left)
    if (title) {
      y += nameFontSize * 0.7;
      doc.setFontSize(titleFontSize);
      doc.setTextColor(120, 120, 120);
      doc.setFont(undefined, 'normal');
      doc.text(title, margin, y, { align: 'left' });
      doc.setTextColor(0, 0, 0);
      y += lineSpacing;
    } else {
      y += nameFontSize * 0.7;
    }
    // Section rendering
    Object.keys(sections).forEach((section) => {
      // Section heading (bold, line)
      y += lineSpacing;
      if (y > pageHeight - 20) { doc.addPage(); y = 28; }
      doc.setFontSize(headingFontSize);
      doc.setFont(undefined, 'bold');
      doc.text(section, margin, y, { align: 'left' });
      // Draw a thin line
      y += 2;
      doc.setDrawColor(180);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += lineSpacing;
      doc.setFont(undefined, 'normal');
      // Section content
      doc.setFontSize(baseFontSize);
      if (section.toLowerCase().includes('education')) {
        // Improved Education block rendering
        let i = 0;
        const ed = sections[section];
        while (i < ed.length) {
          // Try to group degree, institution, date
          const degree = ed[i] || '';
          const institution = (i + 1 < ed.length && !/(\d{4}\s*-\s*\d{4}|\d{4}\s*-\s*Present|\d{4})$/.test(ed[i+1])) ? ed[i+1] : '';
          const date = (i + 2 < ed.length && /(\d{4}\s*-\s*\d{4}|\d{4}\s*-\s*Present|\d{4})$/.test(ed[i+2])) ? ed[i+2] : ((i + 1 < ed.length && /(\d{4}\s*-\s*\d{4}|\d{4}\s*-\s*Present|\d{4})$/.test(ed[i+1])) ? ed[i+1] : '');
          // Render degree (bold), institution (normal), date (right)
          let entryLine = degree;
          doc.setFont(undefined, 'bold');
          doc.text(entryLine, margin, y, { align: 'left' });
          doc.setFont(undefined, 'normal');
          if (institution) {
            doc.text(institution, margin, y + lineSpacing, { align: 'left' });
          }
          if (date) {
            doc.setTextColor(120, 120, 120);
            doc.text(date, pageWidth - margin, institution ? y + lineSpacing : y, { align: 'right' });
            doc.setTextColor(0, 0, 0);
          }
          y += institution ? (lineSpacing * 2) : lineSpacing;
          i += 1 + (institution ? 1 : 0) + (date ? 1 : 0);
        }
      } else {
        sections[section].forEach((item) => {
          // Subheading (job title, degree, etc.)
          if (/^[A-Z][a-zA-Z\s]+\s\-\s[A-Z][a-zA-Z\s]+$/.test(item) || /^[A-Z][a-zA-Z\s]+$/.test(item)) {
            y += lineSpacing;
            if (y > pageHeight - 20) { doc.addPage(); y = 28; }
            doc.setFontSize(subheadingFontSize);
            doc.setFont(undefined, 'bold');
            doc.text(item, margin, y, { align: 'left' });
            doc.setFont(undefined, 'normal');
            doc.setFontSize(baseFontSize);
            y += lineSpacing;
            return;
          }
          // Dates right-aligned (if found)
          const dateMatch = item.match(/(\d{4}\s*-\s*\d{4}|\d{4}\s*-\s*Present|\d{4})$/);
          if (dateMatch) {
            const main = item.replace(dateMatch[0], '').trim();
            const date = dateMatch[0];
            y += lineSpacing;
            if (y > pageHeight - 20) { doc.addPage(); y = 28; }
            doc.setFont(undefined, 'bold');
            doc.text(main, margin, y, { align: 'left' });
            doc.setFont(undefined, 'normal');
            doc.setFontSize(baseFontSize);
            doc.setTextColor(120, 120, 120);
            doc.text(date, pageWidth - margin, y, { align: 'right' });
            doc.setTextColor(0, 0, 0);
            y += lineSpacing;
            return;
          }
          // Bullets
          if (/^[-•\u2022]/.test(item)) {
            const bulletText = doc.splitTextToSize('• ' + item.replace(/^[-•\u2022]\s*/, ''), maxLineWidth - 8);
            bulletText.forEach((bt) => {
              if (y > pageHeight - 20) { doc.addPage(); y = 28; }
              doc.text(bt, margin + 8, y, { maxWidth: maxLineWidth - 8, align: 'justify' });
              y += lineSpacing;
            });
            return;
          }
          // Normal paragraph
          const paraLines = doc.splitTextToSize(item, maxLineWidth);
          paraLines.forEach((pl) => {
            if (y > pageHeight - 20) { doc.addPage(); y = 28; }
            doc.text(pl, margin, y, { maxWidth: maxLineWidth, align: 'justify' });
            y += lineSpacing;
          });
        });
      }
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

function formatCVTextToHTML(cvText) {
  // Split into lines
  const lines = cvText.split(/\r?\n/);
  let html = '';
  let inList = false;
  const headingRegex = /^(Name and contact details|Personal Profile|Professional Overview|Education|Experience|Employment|Skills|Additional Information)[:]?$/i;
  const nameRegex = /^([A-Z][a-z]+\s+[A-Z][a-z]+.*)$/; // crude name line

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += '<div style="height: 0.7em"></div>';
      return;
    }
    if (headingRegex.test(trimmed)) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += `<div style="font-weight: bold; font-size: 1.1em; margin-top: 1em; margin-bottom: 0.3em;">${trimmed.replace(/:$/, '')}</div>`;
      return;
    }
    if (nameRegex.test(trimmed) && idx === 0) {
      html += `<div style="font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em;">${trimmed}</div>`;
      return;
    }
    // Bullet points
    if (/^[-•\u2022]/.test(trimmed)) {
      if (!inList) {
        html += '<ul style="margin-left: 1.2em; margin-bottom: 0.3em;">';
        inList = true;
      }
      html += `<li>${trimmed.replace(/^[-•\u2022]\s*/, '')}</li>`;
      return;
    }
    // If line looks like a list item (e.g. starts with a year or job title)
    if (/^\d{4}/.test(trimmed) || /^\s*\*/.test(trimmed)) {
      if (!inList) {
        html += '<ul style="margin-left: 1.2em; margin-bottom: 0.3em;">';
        inList = true;
      }
      html += `<li>${trimmed}</li>`;
      return;
    }
    // Normal paragraph
    html += `<div>${trimmed}</div>`;
  });
  if (inList) html += '</ul>';
  return html;
}
