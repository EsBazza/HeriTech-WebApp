"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { apiJson } from "@/lib/api";
import { Button, Dialog, Input } from "@/components/ui";

const CONFIRM_WORD = "DELETE";

/** What deleting removes and what stays, shared by the profile and the public /delete-account page. */
export function DeletionTerms() {
  const { translateSync } = useTranslation();
  return (
    <ul className="list-disc pl-5 space-y-1.5 text-sm text-ink-2">
      <li>{translateSync("Deleted: your profile, your Google sign-in link to HeriTech, your messages, your HeriTech Circle progress and your booth claim.")}</li>
      <li>
        {translateSync(
          "Kept without your name: orders and Impact Passes, because each pass is a public record of where a piece came from and where the money went. Your shipping address is removed from them."
        )}
      </li>
      <li>{translateSync("Artisans: your listings leave the shop and any reservation you hold is released.")}</li>
      <li>{translateSync("This can't be undone. Signing in again later creates a new, empty account.")}</li>
    </ul>
  );
}

/** Button and confirmation for permanently deleting the signed-in user's account. */
export function DeleteAccount({ onDeleted }: { onDeleted?: () => void }) {
  const { user, signOut } = useAuth();
  const { translateTemplate, translateSync } = useTranslation();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const close = () => {
    if (busy) return;
    setOpen(false);
    setTyped("");
    setError(null);
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    const result = await apiJson("/api/user/account", { method: "DELETE" });
    if (result.success) {
      await signOut();
      setBusy(false);
      setOpen(false);
      onDeleted?.();
    } else {
      setBusy(false);
      setError(result.error ?? "Couldn't delete your account. Please try again.");
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-full text-danger hover:text-danger hover:border-danger">
        <Trash2 className="w-4 h-4" />
        {translateSync("Delete my account")}
      </Button>
      <Dialog
        open={open}
        onClose={close}
        dismissible={!busy}
        size="sm"
        closeLabel={translateSync("Close")}
        title={translateSync("Delete your HeriTech account?")}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={close} disabled={busy}>
              {translateSync("Cancel")}
            </Button>
            <Button variant="danger" className="flex-1" onClick={remove} loading={busy} disabled={typed.trim().toUpperCase() !== CONFIRM_WORD}>
              {translateSync("Delete forever")}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <DeletionTerms />
          <Input
            label={translateTemplate("Type {word} to confirm", { word: CONFIRM_WORD })}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
          {error && (
            <p className="text-sm text-danger" role="alert">
              {translateSync(error)}
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
}
