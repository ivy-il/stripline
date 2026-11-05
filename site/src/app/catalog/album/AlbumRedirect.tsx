"use client";

import { useEffect } from "react";

export default function AlbumRedirect() {
  useEffect(() => window.location.replace(`/catalog/${window.location.search}`), []);
  return null;
}
