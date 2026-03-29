import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

describe("ForgotPasswordForm UI Smoke Test", () => {
    it("should successfully import dependencies and render the form", async () => {
        const mockSubmit = vi.fn();

        render(
            <MemoryRouter>
                <ForgotPasswordForm onSubmit={mockSubmit} isLoading={false} />
            </MemoryRouter>
        );

        // This assertion confirms that the component successfully imported
        // @shared/AppRoutes and and-design components without throwing.
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
        expect(screen.getByText(/remember your password\?/i)).toBeInTheDocument();
    });
});
