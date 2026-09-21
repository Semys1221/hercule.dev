/**
 * Rive asset contract for the sticker-man scene.
 *
 * Drop a custom `sticker-man.riv` in `public/rive/` (built in the Rive editor)
 * with a state machine named `StickerMan` and optional triggers:
 *   - fall, type, lookCamera
 *
 * Until then, `chatbot.riv` is used (Lip Sync / isTalking).
 */
export const STICKER_RIVE = {
  /** Prefer custom scene; falls back to community chatbot avatar */
  src: "/rive/sticker-man.riv",
  fallbackSrc: "/rive/chatbot.riv",
  stateMachine: "StickerMan",
  fallbackStateMachine: "Lip Sync",
  triggers: {
    fall: "fall",
    type: "type",
    lookCamera: "lookCamera",
  },
  booleans: {
    typing: "isTyping",
    talking: "isTalking",
  },
} as const;

export type StickerRivePhase = "fall" | "typing" | "look" | "idle";
