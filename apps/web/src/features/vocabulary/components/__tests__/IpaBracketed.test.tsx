import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IpaBracketed } from "../IpaBracketed";

describe("IpaBracketed", () => {
    it("strips slashes from stored value before wrapping", () => {
        const { container } = render(<IpaBracketed value="/ˈθʌndər/" />);
        expect(container.textContent).toBe("/ˈθʌndər/");
    });

    it("handles bare value correctly", () => {
        const { container } = render(<IpaBracketed value="ˈθʌndər" />);
        expect(container.textContent).toBe("/ˈθʌndər/");
    });
});
