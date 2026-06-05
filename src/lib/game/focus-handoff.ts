import type { MutableRefObject } from "react";

// 1. Este archivo resuelve el handoff entre la UI HTML y Phaser:
//    si la UI tiene foco, las flechas controlan la UI;
//    si el canvas recupera foco, las flechas vuelven al jugador.
interface FocusHandoffParams {
  sceneRef: MutableRefObject<Phaser.Scene | null>;
  isInputFocusedRef: MutableRefObject<boolean>;
  gameContainerId?: string;
}

// 2. Consideramos "UI interactiva" no solo inputs, sino tambien
//    botones, items de menu, dialogs y triggers de dropdown.
const isInteractiveUiElement = (target: HTMLElement | null) => {
  if (!target) return false;

  return Boolean(
    target.closest(
      [
        "input",
        "textarea",
        "select",
        "button",
        "a[href]",
        "[contenteditable='true']",
        "[role='button']",
        "[role='menuitem']",
        "[role='tab']",
        "[data-slot='dropdown-menu-trigger']",
        "[data-slot='dropdown-menu-content']",
        "[data-slot='dialog-content']",
        "[tabindex]:not([tabindex='-1'])",
      ].join(", ")
    )
  );
};

export const setupGameFocusHandoff = ({
  sceneRef,
  isInputFocusedRef,
  gameContainerId = "game-container",
}: FocusHandoffParams) => {
  // 3. Este toggle es el puente real hacia Phaser.
  //    Solo habilita/deshabilita el manager de teclado de la escena.
  const togglePhaserKeyboard = (enabled: boolean) => {
    if (sceneRef.current?.input?.keyboard) {
      sceneRef.current.input.keyboard.manager.enabled = enabled;
    }
  };

  const syncKeyboardFocus = () => {
    // 4. Leemos el foco real del DOM y alineamos el flag/ref local.
    const activeElement = document.activeElement as HTMLElement | null;
    const uiFocused = isInteractiveUiElement(activeElement);

    isInputFocusedRef.current = uiFocused;
    togglePhaserKeyboard(!uiFocused);
  };

  const blurActiveUiElement = () => {
    // 5. Cuando el usuario vuelve al canvas, quitamos el foco
    //    del control HTML activo para devolver las flechas a Phaser.
    const activeElement = document.activeElement as HTMLElement | null;
    if (!isInteractiveUiElement(activeElement)) return;

    activeElement?.blur();
    isInputFocusedRef.current = false;
    togglePhaserKeyboard(true);
  };

  const handleFocusIn = (event: FocusEvent) => {
    // 6. Si la UI toma el foco, Phaser deja de escuchar teclado.
    if (isInteractiveUiElement(event.target as HTMLElement)) {
      isInputFocusedRef.current = true;
      togglePhaserKeyboard(false);
    }
  };

  const handleFocusOut = () => {
    // 7. Usamos un micro-delay porque el activeElement todavía
    //    puede no haberse actualizado cuando dispara focusout.
    setTimeout(() => {
      syncKeyboardFocus();
    }, 10);
  };

  const handleGamePointerDown = (event: PointerEvent) => {
    // 8. Click directo en canvas: devolvemos foco al juego.
    const target = event.target as HTMLElement | null;
    if (target?.closest("canvas")) {
      blurActiveUiElement();
    }
  };

  const handleWindowPointerDown = (event: PointerEvent) => {
    // 9. Fallback global por si el evento llega desde overlays
    //    o capas alrededor del contenedor del juego.
    const target = event.target as HTMLElement | null;
    const gameContainer = document.getElementById(gameContainerId);

    if (gameContainer?.contains(target) && target?.closest("canvas")) {
      blurActiveUiElement();
    }
  };

  syncKeyboardFocus();

  // 10. Este setup devuelve una función de cleanup para que Game
  //     pueda montar/desmontar los listeners con su ciclo de vida.
  const gameContainer = document.getElementById(gameContainerId);
  document.addEventListener("focusin", handleFocusIn, true);
  document.addEventListener("focusout", handleFocusOut, true);
  gameContainer?.addEventListener("pointerdown", handleGamePointerDown);
  window.addEventListener("pointerdown", handleWindowPointerDown, true);

  return () => {
    document.removeEventListener("focusin", handleFocusIn, true);
    document.removeEventListener("focusout", handleFocusOut, true);
    gameContainer?.removeEventListener("pointerdown", handleGamePointerDown);
    window.removeEventListener("pointerdown", handleWindowPointerDown, true);
  };
};
