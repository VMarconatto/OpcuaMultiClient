/**
** =======================================================
@SECTION  : UI — Message Box Provider
@FILE     : src/components/MsgBoxProvider/MsgBoxProvider.tsx
@PURPOSE  : Fornecer contexto global para modais de mensagem (alert/confirm),
            com fila, animações (Framer Motion), suporte a ESC/ENTER e
            auto-close. Renderiza via portal no <body>.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Overlay,
  Card,
  Title,
  Text,
  Actions,
  ConfirmBtn,
  CancelBtn,
  CloseX,
} from "./styled";

// --------------------------------------------------------
// Tipos
// --------------------------------------------------------

/**
 * Variação visual aplicada ao modal (define sombra/realce).
 * @remarks Correspondente aos estilos em `styled.ts`.
 */
export type Variant = "default" | "danger" | "success" | "warning";

/** Tipo do modal: confirmação (boolean) ou alerta (sem retorno). */
export type Kind = "confirm" | "alert";

/**
 * Opções base de conteúdo.
 * @property title   Título opcional da caixa de mensagem.
 * @property text    Corpo do texto; aceita JSX.
 * @property variant Variante visual (default/danger/success/warning).
 */
export type BaseOpts = {
  title?: string;
  text: React.ReactNode;
  variant?: Variant;
};

/**
 * Opções de confirmação (Retorna boolean).
 * @property confirmLabel Rótulo do botão confirmar.
 * @property cancelLabel  Rótulo do botão cancelar.
 */
export type ConfirmOpts = BaseOpts & {
  confirmLabel?: string;
  cancelLabel?: string;
};

/**
 * Opções de alerta (sem retorno).
 * @property okLabel     Rótulo do botão OK (se não for auto-close).
 * @property autoCloseMs Tempo em ms para fechamento automático.
 */
export type AlertOpts = BaseOpts & {
  okLabel?: string; // se não quiser auto-close
  autoCloseMs?: number; // se definir, fecha sozinho
};

/**
 * Item de fila para modal de confirmação.
 * @property id      Identificador único interno.
 * @property kind    "confirm".
 * @property opts    Opções de conteúdo/rotulagem.
 * @property resolve Resolve a Promise<boolean> com true/false.
 */
export type MsgConfirm = {
  id: number;
  kind: "confirm";
  opts: ConfirmOpts;
  resolve: (value: boolean) => void;
};

/**
 * Item de fila para modal de alerta.
 * @property id      Identificador único interno.
 * @property kind    "alert".
 * @property opts    Opções de conteúdo/rotulagem.
 * @property resolve Resolve a Promise<void> (sem valor).
 */
export type MsgAlert = {
  id: number;
  kind: "alert";
  opts: AlertOpts;
  resolve: () => void; // <- sem argumentos no alerta
};

/** União discriminada de mensagens suportadas. */
export type Msg = MsgConfirm | MsgAlert;

/**
 * Interface pública do contexto.
 * @property confirm Abre modal de confirmação (Promise<boolean>).
 * @property alert   Abre modal de alerta (Promise<void>).
 */
export type MsgBoxCtx = {
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
  alert: (opts: AlertOpts) => Promise<void>;
};

const MsgBoxContext = createContext<MsgBoxCtx | null>(null);

// --------------------------------------------------------
// Provider
// --------------------------------------------------------

/**
 * Provider global do MsgBox.
 * @param children Árvore React a ser envolvida pelo Provider.
 * @returns JSX do provider com portal do modal injetado no <body>.
 * @remarks
 * - Mantém uma fila (queue) e exibe somente o primeiro elemento (top).
 * - Fecha com ESC e confirma com ENTER.
 * - Suporta auto-close para Alert via `autoCloseMs`.
 */
export const MsgBoxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Msg[]>([]);
  const idRef = useRef(1);

  /**
   * Empilha uma nova mensagem na fila, gerando id interno.
   * @param m Objeto Msg (sem id) a ser inserido (alert/confirm).
   * @returns Número do id atribuído ao item inserido.
   */
  const push = useCallback((m: Omit<MsgConfirm, "id"> | Omit<MsgAlert, "id">) => {
    const id = idRef.current++;
    setQueue((q) => [...q, { ...(m as any), id } as Msg]);
    return id;
  }, []);

  /**
   * Remove uma mensagem da fila por id.
   * @param id Identificador do item que será removido.
   */
  const pop = useCallback((id: number) => {
    setQueue((q) => q.filter((m) => m.id !== id));
  }, []);

  /**
   * Abre uma confirmação modal e aguarda resposta do usuário.
   * @param opts Opções de rótulos/conteúdo/variante.
   * @returns Promise<boolean> resolvida com `true`(confirmar) ou `false`(cancelar).
   */
  const confirm = useCallback((opts: ConfirmOpts) => {
    return new Promise<boolean>((resolve) => {
      push({ kind: "confirm", opts, resolve });
    });
  }, [push]);

  /**
   * Abre um alerta modal e aguarda a interação (ou auto-close).
   * @param opts Opções de rótulos/conteúdo/variante; `autoCloseMs` opcional.
   * @returns Promise<void> resolvida no fechamento.
   */
  const alert = useCallback((opts: AlertOpts) => {
    return new Promise<void>((resolve) => {
      push({ kind: "alert", opts, resolve });
    });
  }, [push]);

  // Fecha no ESC / confirma no ENTER
  useEffect(() => {
    if (!queue.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (!queue.length) return;
      const top = queue[0];
      if (e.key === "Escape") {
        e.preventDefault();
        if (top.kind === "confirm") top.resolve(false);
        else top.resolve();
        pop(top.id);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (top.kind === "confirm") top.resolve(true);
        else top.resolve();
        pop(top.id);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [queue, pop]);

  // Auto-close para alertas com timeout
  useEffect(() => {
    const top = queue[0];
    if (!top || top.kind !== "alert") return;
    const ms = top.opts.autoCloseMs;
    if (typeof ms !== "number") return;

    const t = setTimeout(() => {
      // se ainda é o mesmo topo, fecha
      const current = queue[0];
      if (current && current.id === top.id && current.kind === "alert") {
        current.resolve();
        pop(current.id);
      }
    }, ms);
    return () => clearTimeout(t);
  }, [queue, pop]);

  /** Valor de contexto: expõe as factories confirm/alert. */
  const value = useMemo<MsgBoxCtx>(() => ({ confirm, alert }), [confirm, alert]);

  // ------------------------------------------------------
  // Render
  // ------------------------------------------------------
  const top = queue[0];

  return (
    <MsgBoxContext.Provider value={value}>
      {children}
      {createPortal(
        <AnimatePresence>
          {!!top && (
            <motion.div
              key="msgbox-root"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* mostra apenas o primeiro da fila (modal) */}
              <Overlay
                onClick={() => {
                  if (top.kind === "confirm") top.resolve(false);
                  else top.resolve();
                  pop(top.id);
                }}
              >
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Card data-variant={(top.opts.variant ?? "default") as Variant}>
                    <CloseX
                      onClick={() => {
                        if (top.kind === "confirm") top.resolve(false);
                        else top.resolve();
                        pop(top.id);
                      }}
                      aria-label="Fechar"
                    >
                      ×
                    </CloseX>

                    {!!top.opts.title && <Title>{top.opts.title}</Title>}
                    <Text>{top.opts.text}</Text>

                    <Actions>
                      {top.kind === "confirm" ? (
                        <>
                          <CancelBtn
                            onClick={() => {
                              top.resolve(false);
                              pop(top.id);
                            }}
                          >
                            {top.opts.cancelLabel ?? "Cancelar"}
                          </CancelBtn>
                          <ConfirmBtn
                            data-variant={(top.opts.variant ?? "default") as Variant}
                            autoFocus
                            onClick={() => {
                              top.resolve(true);
                              pop(top.id);
                            }}
                          >
                            {top.opts.confirmLabel ?? "Confirmar"}
                          </ConfirmBtn>
                        </>
                      ) : (
                        <>
                          {typeof top.opts.autoCloseMs === "number" ? (
                            <ConfirmBtn
                              data-variant={(top.opts.variant ?? "success") as Variant}
                              onClick={() => {
                                top.resolve();
                                pop(top.id);
                              }}
                            >
                              OK
                            </ConfirmBtn>
                          ) : (
                            <CancelBtn
                              onClick={() => {
                                top.resolve();
                                pop(top.id);
                              }}
                            >
                              {top.opts.okLabel ?? "OK"}
                            </CancelBtn>
                          )}
                        </>
                      )}
                    </Actions>
                  </Card>
                </motion.div>
              </Overlay>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </MsgBoxContext.Provider>
  );
};

// --------------------------------------------------------
// Hook
// --------------------------------------------------------

/**
 * Hook para consumir o contexto do MsgBox.
 * @returns Objeto com métodos `confirm` e `alert`.
 * @throws Error se usado fora de `<MsgBoxProvider>`.
 * @note Garante fail-fast ao ser utilizado indevidamente.
 */
export const useMsgBox = () => {
  const ctx = useContext(MsgBoxContext);
  if (!ctx) throw new Error("useMsgBox deve ser usado dentro de <MsgBoxProvider>");
  return ctx;
};
