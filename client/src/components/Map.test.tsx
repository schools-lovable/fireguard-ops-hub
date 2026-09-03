// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapView } from "./Map";

afterEach(() => { cleanup(); (window as unknown as { google?: unknown }).google = undefined; vi.restoreAllMocks(); });

describe("MapView", () => {
  it("initializes the supported Google Maps wrapper and exposes the map for marker and fly-to clients", async () => {
    const map = { panTo: vi.fn(), setZoom: vi.fn() };
    const MapConstructor = vi.fn(() => map);
    (window as unknown as { google?: unknown }).google = { maps: { Map: MapConstructor } };
    const onMapReady = vi.fn();
    render(<MapView initialCenter={{ lat: -1.9441, lng: 30.0619 }} initialZoom={14} onMapReady={onMapReady} />);
    await vi.waitFor(() => expect(onMapReady).toHaveBeenCalledWith(map));
    expect(MapConstructor).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.objectContaining({ center: { lat: -1.9441, lng: 30.0619 }, zoom: 14 }));
  });

  it("notifies its caller when the map provider script cannot load so the workspace can keep location controls available", async () => {
    const onMapError = vi.fn();
    const append = vi.spyOn(document.head, "appendChild").mockImplementation(node => { window.setTimeout(() => (node as HTMLScriptElement).onerror?.(new Event("error")), 0); return node; });
    render(<MapView onMapError={onMapError} />);
    await vi.waitFor(() => expect(onMapError).toHaveBeenCalledTimes(1));
    expect(append).toHaveBeenCalled();
  });
});
