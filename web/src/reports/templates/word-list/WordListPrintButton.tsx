import { PrinterOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { buildPrintFileName } from "../../core/buildPrintFileName";
import { usePrintDocument } from "../../core/usePrintDocument";
import { WordListDocument } from "./WordListDocument";
import type { WordListDocumentData } from "./word-list.types";

/** Extra delay before window.print() so fonts/IPA layout settle (no drawer close needed). */
const DEFAULT_WORD_LIST_PRINT_DELAY_MS = 200;

interface WordListPrintButtonProps {
    data: WordListDocumentData;
    /** Overrides delay before print dialog (default 200ms). */
    printDelayMs?: number;
    /** When true, the print action is blocked (e.g. vocabulary rows still loading). */
    disabled?: boolean;
}

function wordListPrintFileName(data: WordListDocumentData): string {
    if (data.kind === "session") {
        return buildPrintFileName(data.sessionName, data.lessonName);
    }
    return buildPrintFileName(data.lessonTitle, "Vocabulary");
}

export function WordListPrintButton({
    data,
    printDelayMs = DEFAULT_WORD_LIST_PRINT_DELAY_MS,
    disabled = false,
}: WordListPrintButtonProps) {
    const { print } = usePrintDocument();

    const handlePrint = () => {
        const fileName = wordListPrintFileName(data);
        print(<WordListDocument data={data} />, printDelayMs, fileName);
    };

    return (
        <Button size="small" icon={<PrinterOutlined />} onClick={handlePrint} disabled={disabled}>
            Print Word List
        </Button>
    );
}
