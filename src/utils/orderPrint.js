function appendAutoPrintBehavior(html) {
  const printScript = `
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          window.focus();
          window.print();
        }, 150);
      });
      window.addEventListener('afterprint', () => {
        window.close();
      });
    </script>
  `;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${printScript}</body>`);
  }

  return `${html}${printScript}`;
}

export function openOrderPrintWindow(html) {
  if (!html) {
    throw new Error("Printable order sheet was not returned");
  }

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    throw new Error("Popup blocked. Allow popups and try again.");
  }

  printWindow.document.open();
  printWindow.document.write(appendAutoPrintBehavior(html));
  printWindow.document.close();
}
