import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { POSInput } from "../POSInput";

describe("POSInput", () => {
    it("applies custom prefix in placeholder", () => {
        render(<POSInput prefix="€" />);

        expect(screen.getByPlaceholderText("€0.00")).toBeInTheDocument();
    });

    it("supports POS-style digit entry and backspace", () => {
        const onChange = vi.fn();
        render(<POSInput onChange={onChange} />);

        const input = screen.getByRole("textbox");
        fireEvent.keyDown(input, { key: "1" });
        fireEvent.keyDown(input, { key: "Backspace" });

        expect(onChange).toHaveBeenNthCalledWith(1, 0.01);
        expect(onChange).toHaveBeenNthCalledWith(2, 0);
    });

    it("parses pasted digits into cents", () => {
        const onChange = vi.fn();
        render(<POSInput onChange={onChange} />);

        const input = screen.getByRole("textbox");
        fireEvent.paste(input, {
            clipboardData: {
                getData: () => "$12.34",
            },
        });

        expect(onChange).toHaveBeenCalledWith(12.34);
    });
});
