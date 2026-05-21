/** Visible footer line; page numbers come from @page rules in print.css. */
export function DocumentFooter() {
    return (
        <footer
            style={{
                borderTop: "0.5pt solid #ccc",
                marginTop: "20pt",
                paddingTop: "6pt",
                fontSize: "8pt",
                color: "#888",
                display: "flex",
                justifyContent: "space-between",
            }}
        >
            <span>Confidential — For internal use only</span>
        </footer>
    );
}
