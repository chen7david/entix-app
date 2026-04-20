import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntityAvatar } from "../EntityAvatar";

describe("EntityAvatar", () => {
    it("renders image when imageUrl is provided", () => {
        render(<EntityAvatar imageUrl="https://example.com/a.png" alt="Org logo" />);

        expect(screen.getByAltText("Org logo")).toBeInTheDocument();
    });

    it("renders icon when no imageUrl is provided", () => {
        render(<EntityAvatar icon={<span data-testid="avatar-icon">I</span>} text="ignored" />);

        expect(screen.getByTestId("avatar-icon")).toBeInTheDocument();
    });

    it("renders uppercase first letter from text fallback", () => {
        render(<EntityAvatar text="alpha" />);

        expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("renders question mark when no image, icon, or text", () => {
        render(<EntityAvatar />);

        expect(screen.getByText("?")).toBeInTheDocument();
    });
});
