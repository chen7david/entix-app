import type { VocabularyItemDTO } from "@web/src/features/vocabulary/hooks/useVocabulary";
import { WordListRow } from "./WordListRow";

interface WordListTableProps {
    words: VocabularyItemDTO[];
}

export function WordListTable({ words }: WordListTableProps) {
    return (
        <table className="doc-table" style={{ marginTop: "10pt" }}>
            <thead>
                <tr>
                    <th style={{ width: "6%" }}>#</th>
                    <th style={{ width: "20%" }}>English</th>
                    <th style={{ width: "18%" }}>Phonetic (IPA)</th>
                    <th style={{ width: "38%" }}>Definition</th>
                    <th style={{ width: "18%" }}>Chinese</th>
                </tr>
            </thead>
            <tbody>
                {words.map((word, i) => (
                    <WordListRow key={word.id} word={word} index={i} />
                ))}
            </tbody>
        </table>
    );
}
