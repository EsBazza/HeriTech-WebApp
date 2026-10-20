"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button, Dialog, Input } from "@/components/ui";
import { apiJson } from "@/lib/api";

interface EditProfileModalProps {
  onClose: () => void;
}

/** Edit your own name, country, avatar and role details (workshop or office). */
export function EditProfileModal({ onClose }: EditProfileModalProps) {
  const { user, refreshProfile } = useAuth();
  const { translateSync } = useTranslation();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [workshop, setWorkshop] = useState(user?.workshopName ?? "");
  const [station, setStation] = useState(user?.stationName ?? "");
  const [workshopLocation, setWorkshopLocation] = useState<{ lat: number; lng: number } | null>(
    user?.workshopLat != null && user?.workshopLng != null ? { lat: user.workshopLat, lng: user.workshopLng } : null,
  );
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  const role = user.role;

  const pinWorkshop = () => {
    if (!navigator.geolocation) {
      setError("This browser can't share its location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setWorkshopLocation({ lat: parseFloat(p.coords.latitude.toFixed(5)), lng: parseFloat(p.coords.longitude.toFixed(5)) });
        setLocating(false);
      },
      (e) => {
        setError(`Couldn't get your location (${e.message}).`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await apiJson("/api/user/profile/update", {
      method: "POST",
      body: JSON.stringify({
        fullName,
        country,
        avatarUrl,
        workshopName: workshop,
        stationName: station,
        ...(role === "artisan" ? { workshopLocation } : {}),
      }),
    });
    if (result.success) {
      await refreshProfile();
      onClose();
    } else {
      setError(result.error ?? "Couldn't save your profile.");
    }
    setSaving(false);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      dismissible={!saving}
      closeLabel={translateSync("Close")}
      title={translateSync("Edit profile")}
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            {translateSync("Cancel")}
          </Button>
          <Button type="submit" form="edit-profile-form" className="flex-1" loading={saving}>
            {translateSync(saving ? "Saving…" : "Save changes")}
          </Button>
        </div>
      }
    >
      <form id="edit-profile-form" onSubmit={save} className="space-y-4">
        <Input label={translateSync("Full name")} required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label={translateSync("Country")} required value={country} onChange={(e) => setCountry(e.target.value)} />
        <Input
          label={translateSync("Profile photo link (optional)")}
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://"
        />

        {(role === "artisan" || role === "admin") && (
          <Input label={translateSync("Workshop name")} value={workshop} onChange={(e) => setWorkshop(e.target.value)} />
        )}

        {role === "artisan" && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-ink">{translateSync("Workshop location")}</p>
            <p className="text-sm text-ink-3">
              {translateSync("Optional. Shown on your product pages so buyers can follow the material from the collection point to your workshop.")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={pinWorkshop} loading={locating}>
                {translateSync(locating ? "Locating…" : workshopLocation ? "Update to my current location" : "Use my current location")}
              </Button>
              {workshopLocation && (
                <>
                  <span className="text-sm text-ink-2 tabular">
                    {workshopLocation.lat.toFixed(4)}°, {workshopLocation.lng.toFixed(4)}°
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setWorkshopLocation(null)}>
                    {translateSync("Remove")}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {(role === "lgu" || role === "admin") && (
          <Input label={translateSync("Local government office")} value={station} onChange={(e) => setStation(e.target.value)} />
        )}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {translateSync(error)}
          </p>
        )}
      </form>
    </Dialog>
  );
}
