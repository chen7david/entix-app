import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";

export function usePrintDocument() {
    const rootRef = useRef<Root | null>(null);
    const printTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /** Holds the title we overwrote so we can put it back when the print
     * dialog closes (afterprint fires whether the user prints or cancels). */
    const previousTitleRef = useRef<string | null>(null);
    const restoreTitleHandlerRef = useRef<(() => void) | null>(null);

    const cancelPendingPrint = useCallback(() => {
        if (printTimeoutRef.current !== null) {
            clearTimeout(printTimeoutRef.current);
            printTimeoutRef.current = null;
        }
    }, []);

    const restoreTitle = useCallback(() => {
        if (previousTitleRef.current !== null) {
            document.title = previousTitleRef.current;
            previousTitleRef.current = null;
        }
        if (restoreTitleHandlerRef.current) {
            window.removeEventListener("afterprint", restoreTitleHandlerRef.current);
            restoreTitleHandlerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            cancelPendingPrint();
            restoreTitle();
            const root = rootRef.current;
            rootRef.current = null;
            if (root) {
                setTimeout(() => root.unmount(), 0);
            }
        };
    }, [cancelPendingPrint, restoreTitle]);

    const print = useCallback(
        (documentNode: ReactNode, delayMs = 0, fileName?: string) => {
            const container = document.getElementById("print-root");
            if (!container) {
                console.error("[usePrintDocument] #print-root element not found in index.html");
                return;
            }

            cancelPendingPrint();

            if (rootRef.current) {
                rootRef.current.unmount();
                rootRef.current = null;
            }

            rootRef.current = createRoot(container);
            rootRef.current.render(documentNode);

            printTimeoutRef.current = setTimeout(() => {
                printTimeoutRef.current = null;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (fileName) {
                            /** Browsers seed the "Save as PDF" filename from
                             * document.title; swap it for the duration of the
                             * print dialog and restore on afterprint. */
                            if (previousTitleRef.current === null) {
                                previousTitleRef.current = document.title;
                            }
                            document.title = fileName;
                            if (!restoreTitleHandlerRef.current) {
                                restoreTitleHandlerRef.current = restoreTitle;
                                window.addEventListener(
                                    "afterprint",
                                    restoreTitleHandlerRef.current
                                );
                            }
                        }
                        window.print();
                    });
                });
            }, delayMs);
        },
        [cancelPendingPrint, restoreTitle]
    );

    return { print, cancelPendingPrint };
}
