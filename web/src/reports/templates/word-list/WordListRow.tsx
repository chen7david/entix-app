import { IpaBracketed } from "@web/src/features/vocabulary/components/IpaBracketed";
import type { VocabularyItemDTO } from "@web/src/features/vocabulary/hooks/useVocabulary";

interface WordListRowProps {
    word: VocabularyItemDTO;
    index: number;
}

export function WordListRow({ word, index }: WordListRowProps) {
    return (
        <tr className="doc-table-row">
            <td style={{ width: "6%", color: "#888", textAlign: "center" }}>{index + 1}</td>
            <td style={{ width: "20%", fontWeight: 600 }}>{word.text}</td>
            {/* Single-font IPA cell: a fallback chain caused glyph-metric mismatch
             * between the visible text and the browser's hit-test layer, which
             * made selection land in apparently empty space. */}
            <td style={{ width: "18%", fontFamily: "Arial, sans-serif", color: "#444" }}>
                <IpaBracketed value={word.ipaUs} />
            </td>
            <td style={{ width: "38%", color: "#222" }}>{word.definitionSimple ?? ""}</td>
            <td style={{ width: "18%" }}>{word.zhTranslation ?? ""}</td>
        </tr>
    );
}
