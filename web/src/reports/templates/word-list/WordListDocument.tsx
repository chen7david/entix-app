import { DocumentLayout } from "../../shared/DocumentLayout";
import { DocumentSection } from "../../shared/DocumentSection";
import { WordListTable } from "./WordListTable";
import { isPrintableVocabulary, type WordListDocumentData } from "./word-list.types";

interface WordListDocumentProps {
    data: WordListDocumentData;
}

function WordListHeaderBlock({ data }: WordListDocumentProps) {
    if (data.kind === "session") {
        return (
            <>
                <div style={{ fontSize: "12pt", fontWeight: 700 }}>{data.sessionName}</div>
                <div style={{ fontSize: "10pt", color: "#555" }}>Lesson: {data.lessonName}</div>
            </>
        );
    }
    return (
        <>
            <div style={{ fontSize: "12pt", fontWeight: 700 }}>{data.lessonTitle}</div>
            {(data.subtitleLines ?? []).map((line, idx) => (
                <div key={idx} style={{ fontSize: "10pt", color: "#555" }}>
                    {line}
                </div>
            ))}
        </>
    );
}

export function WordListDocument({ data }: WordListDocumentProps) {
    const printableWords = data.words.filter(isPrintableVocabulary);

    return (
        <DocumentLayout meta={data.meta}>
            <DocumentSection>
                <div style={{ marginBottom: "12pt" }}>
                    <WordListHeaderBlock data={data} />
                    <div style={{ fontSize: "9pt", color: "#888", marginTop: "3pt" }}>
                        {printableWords.length} word{printableWords.length !== 1 ? "s" : ""}
                    </div>
                </div>
                <WordListTable words={printableWords} />
            </DocumentSection>
        </DocumentLayout>
    );
}
