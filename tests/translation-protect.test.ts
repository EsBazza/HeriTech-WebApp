import { describe, expect, it } from "vitest";
import { protectForHtml, unprotectFromHtml } from "@/lib/translation/protect";

describe("translation brand protection", () => {
  it("wraps brand names and serials so Google leaves them alone", () => {
    expect(protectForHtml("Add to Google Wallet")).toBe('Add to <span translate="no">Google Wallet</span>');
    expect(protectForHtml("Pass HT-D3M0-0001")).toBe('Pass <span translate="no">HT-D3M0-0001</span>');
  });

  it("escapes markup in plain text and restores it on the way back", () => {
    const text = 'Tea & cake <3 "HeriTech"';
    expect(unprotectFromHtml(protectForHtml(text))).toBe(text);
  });

  it("restores a translated answer to plain text", () => {
    expect(unprotectFromHtml('<span translate="no">Google Wallet</span>に追加 &amp; 保存')).toBe("Google Walletに追加 & 保存");
  });

  it("keeps {placeholders} for values filled in after translation", () => {
    expect(protectForHtml("Only {count} left")).toBe('Only <span translate="no">{count}</span> left');
    expect(unprotectFromHtml('残り<span translate="no">{count}</span>点')).toBe("残り{count}点");
  });

  it("leaves text without names untouched", () => {
    expect(unprotectFromHtml(protectForHtml("Browse crafts"))).toBe("Browse crafts");
  });
});
