import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterBar } from "../FilterBar";

describe("FilterBar", () => {
    it("updates search value through onChange", async () => {
        const onChange = vi.fn();

        render(
            <FilterBar
                filters={[
                    {
                        type: "search",
                        key: "search",
                        placeholder: "Search...",
                    },
                ]}
                values={{ search: "" }}
                initialValues={{ search: "" }}
                onChange={onChange}
            />
        );

        fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "hello" } });
        expect(onChange).toHaveBeenCalledWith({ search: "hello" });
    });

    it("supports custom render escape hatch", () => {
        render(
            <FilterBar
                filters={[
                    {
                        type: "select",
                        key: "mode",
                        customRender: () => <div data-testid="custom-filter">Custom filter</div>,
                    },
                ]}
                values={{}}
                onChange={() => {}}
            />
        );

        expect(screen.getByTestId("custom-filter")).toBeInTheDocument();
    });

    it("shows disabled reset button until filters differ from defaults", () => {
        render(
            <FilterBar
                filters={[
                    {
                        type: "select",
                        key: "status",
                        options: [{ label: "All", value: "all" }],
                    },
                ]}
                values={{ status: "all" }}
                initialValues={{ status: "all" }}
                onChange={() => {}}
                onReset={() => {}}
            />
        );

        expect(screen.getByRole("button", { name: /Reset/i })).toBeDisabled();
    });

    it("enables reset button when filters differ from defaults", () => {
        render(
            <FilterBar
                filters={[
                    {
                        type: "select",
                        key: "status",
                        options: [{ label: "All", value: "all" }],
                    },
                ]}
                values={{ status: "pending" }}
                initialValues={{ status: "all" }}
                onChange={() => {}}
                onReset={() => {}}
            />
        );

        expect(screen.getByRole("button", { name: /Reset/i })).toBeEnabled();
    });
});
