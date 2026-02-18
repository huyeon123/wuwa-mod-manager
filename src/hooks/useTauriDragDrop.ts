import { useEffect } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

interface UseTauriDragDropParams {
  enabled: boolean;
  onDraggingChange: (dragging: boolean) => void;
  onDropPaths: (paths: string[]) => void;
}

export function useTauriDragDrop({
  enabled,
  onDraggingChange,
  onDropPaths,
}: UseTauriDragDropParams) {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    try {
      getCurrentWebview()
        .onDragDropEvent((event) => {
          if (event.payload.type === "enter" || event.payload.type === "over") {
            onDraggingChange(true);
            return;
          }

          if (event.payload.type === "leave") {
            onDraggingChange(false);
            return;
          }

          if (event.payload.type === "drop") {
            onDraggingChange(false);
            if (enabled) {
              onDropPaths(event.payload.paths);
            }
          }
        })
        .then((fn) => {
          unlisten = fn;
        })
        .catch((err) => {
          console.error("Failed to register drag-drop listener:", err);
        });
    } catch (err) {
      console.error("Failed to get webview:", err);
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, [enabled, onDraggingChange, onDropPaths]);
}
