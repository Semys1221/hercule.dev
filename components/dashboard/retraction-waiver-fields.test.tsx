import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RetractionWaiverFields } from "./retraction-waiver-fields";

describe("RetractionWaiverFields", () => {
  it("defaults unchecked and toggles waiver", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <RetractionWaiverFields checked={false} onCheckedChange={onCheckedChange} />,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("uses custom cvgHref when provided", () => {
    render(
      <RetractionWaiverFields
        checked={false}
        onCheckedChange={() => {}}
        cvgHref="/cvg/comptable"
      />,
    );

    expect(screen.getByRole("link", { name: "Voir les CGV §8" })).toHaveAttribute(
      "href",
      "/cvg/comptable",
    );
  });
});
