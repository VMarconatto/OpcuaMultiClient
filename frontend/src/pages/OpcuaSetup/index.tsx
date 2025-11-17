/**
** =======================================================
@SECTION  : OPC UA — Client Setup & Control
@FILE     : src/pages/OpcuaSetup/index.tsx
@PURPOSE  : Formulário para configurar o client OPC UA (endpoint, namespace,
            políticas de segurança, memória mapeada), salvar no backend,
            alternar (start/stop) a coleta e navegar por nós via Browse.
@LAST_EDIT : 2025-10-27
** =======================================================
*/

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Container,
  FormGrid,
  FormGroup,
  Label,
  Input,
  AddButton,
  ChipList,
  Chip,
  ChipRemove,
  ActionsRow,
  SubmitButton,
  ToggleButton,
  StatusDot,
  // Modal (msgbox) reutilizado pelo Confirm e pelo Browser
  MsgboxOverlay,
  MsgboxCard,
  MsgboxTitle,
  MsgboxText,
  MsgboxActions,
  MsgboxButton,
  MsgboxCancelButton,
} from "./styled";
import { useDevice } from "../../components/DeviceContext/DeviceContext";
import { Save, Plus, X, Power } from "lucide-react";

/**
 * Estrutura de configuração do client OPC UA (mantida).
 * - `mapMemory` armazena os NodeIds que serão gravados no MongoDB.
 */
type OpcuaClientConfig = {
  applicationName: string;
  endpoint: string;
  initialDelay: number;
  maxRetry: number;
  maxDelay: number;
  securityMode: number;
  securityPolicy: number;
  mapMemory: string[];
  namespace: number;
};

/**
 * Referência de itens retornados pelo Browse.
 */
export type BrowseRef = {
  /** NodeId completo do item (ex.: ns=3;i=1008) */
  nodeId: string;
  /** Nome de navegação (BrowseName) */
  browseName: string;
  /** Nome de exibição (DisplayName) */
  displayName: string;
  /** Classe do nó (ex.: Object, Variable, Method) */
  nodeClass: string;
};

/** Campos que devem ser tratados como numéricos no change handler. */
const numericFields = new Set([
  "initialDelay",
  "maxRetry",
  "maxDelay",
  "securityMode",
  "securityPolicy",
  "namespace",
]);

/** Definições opcionais de ambiente (Vite) para a base de API. */
export interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
export interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Instância Axios centralizada.
 * @remarks
 * - Usa `VITE_API_URL` quando disponível; caso contrário, `http://localhost:3000`.
 * - Timeout padrão de 15s.
 */
export const API = axios.create({
  baseURL:
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env &&
      (import.meta as any).env.VITE_API_URL) ||
    "http://localhost:3000",
  timeout: 15000,
});

/** Variações visuais para o modal de confirmação. */
type ConfirmVariant = "default" | "danger";

/** Opções para abrir o modal de confirmação. */
type ConfirmOptions = {
  /** Título do modal */
  title: string;
  /** Texto/descrição do modal */
  text: string;
  /** Rótulo do botão confirmar (default: "Confirmar") */
  confirmLabel?: string;
  /** Variante visual (default/danger) */
  variant?: ConfirmVariant;
  /** Ação de confirmação (pode ser assíncrona) */
  onConfirm: () => void | Promise<void>;
};

/**
 * Página de configuração e controle do Client OPC UA.
 *
 * ### Responsabilidades
 * - Carregar/salvar configuração do client atual (ligado ao `deviceId` do contexto).
 * - Listar/gerenciar `mapMemory` (chips), inclusive adicionando por navegação (Browse).
 * - Alternar estado de coleta (start/stop) com confirmação e feedback visual.
 * - Exibir modal de navegação por nós (`Browse`) com breadcrumbs simples.
 *
 * ### Acessibilidade
 * - Usa `aria-label`, `role="dialog"`, `aria-modal` nos modais.
 * - Botões com `title`/`aria-label` para ações.
 */
const OpcuaClientForm: React.FC = () => {
  /** Estado de configuração completa do client OPC UA. */
  const [config, setConfig] = useState<OpcuaClientConfig>({
    applicationName: "",
    endpoint: "",
    initialDelay: 0,
    maxRetry: 0,
    maxDelay: 0,
    securityMode: 0,
    securityPolicy: 0,
    mapMemory: [],
    namespace: 3,
  });

  /** Campo temporário para inserir manualmente um NodeId. */
  const [newMemory, setNewMemory] = useState("");
  /** Flag de carregamento inicial da página. */
  const [loading, setLoading] = useState(true);
  /** Flag de salvamento (desabilita ações durante POST). */
  const [saving, setSaving] = useState(false);

  /** Estado atual do client (conectado à coleta). */
  const [connected, setConnected] = useState<boolean>(false);
  /** Flag enquanto alterna start/stop. */
  const [toggling, setToggling] = useState<boolean>(false);

  // ======== Modal de confirmação (genérico) ========
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [confirmLabel, setConfirmLabel] = useState("Confirmar");
  const [confirmVariant, setConfirmVariant] =
    useState<ConfirmVariant>("default");
  /** Guarda a função a ser executada quando o usuário confirma. */
  const confirmActionRef = useRef<() => void | Promise<void>>(() => {});

  // ======== Modal de Browse (navegação de nós) ========
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseStack, setBrowseStack] = useState<
    Array<{ nodeId: string; label: string }>
  >([{ nodeId: "RootFolder", label: "RootFolder" }]);
  const [browseItems, setBrowseItems] = useState<BrowseRef[]>([]);
  const [browseError, setBrowseError] = useState<string | null>(null);
  /** Nó atual do breadcrumb (último da pilha). */
  const currentNode = browseStack[browseStack.length - 1];

  /** Client selecionado no contexto (ex.: Client01). */
  const { deviceId } = useDevice();

  // ========= Wrappers de API: Browse =========

  /**
   * Busca os filhos de um nó via backend (rota `/opcuaclient/browse/:id`).
   * @param id     Client atual (ex.: "Client01")
   * @param nodeId Nó de referência (default: "RootFolder")
   * @returns Lista de referências de navegação (`BrowseRef[]`)
   */
  async function fetchBrowse(
    id: string,
    nodeId: string = "RootFolder"
  ): Promise<BrowseRef[]> {
    try {
      const { data } = await API.get<BrowseRef[]>(
        `/opcuaclient/browse/${encodeURIComponent(id)}`,
        { params: nodeId ? { nodeId } : undefined }
      );
      const items = Array.isArray(data) ? data : [];
      setBrowseItems(items);
      setBrowseError(null);
      return items;
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Falha desconhecida no browse.";
      console.error("Falha no browse:", err);
      setBrowseItems([]);
      setBrowseError(msg);
      return [];
    }
  }

  // ======= Abertura/fechamento e navegação do modal de Browse =======

  /** Abre o modal de navegação; inicia em RootFolder e tenta ObjectsFolder se vazio. */
  const openBrowse = async () => {
    if (!deviceId) return alert("Nenhum client selecionado.");
    setBrowseOpen(true);
    setBrowseStack([{ nodeId: "RootFolder", label: "RootFolder" }]);
    const items = await fetchBrowse(deviceId, "RootFolder");
    if (items.length === 0) {
      setBrowseStack([{ nodeId: "ObjectsFolder", label: "ObjectsFolder" }]);
      await fetchBrowse(deviceId, "ObjectsFolder");
    }
  };

  /** Fecha o modal de navegação e reseta estado. */
  const closeBrowse = () => {
    setBrowseOpen(false);
    setBrowseItems([]);
    setBrowseStack([{ nodeId: "RootFolder", label: "RootFolder" }]);
  };

  /** Aprofunda a navegação para o `ref` selecionado. */
  const goDeeper = async (ref: BrowseRef) => {
    if (!deviceId) return;
    setBrowseStack((st) => [
      ...st,
      { nodeId: ref.nodeId, label: ref.displayName || ref.browseName },
    ]);
    await fetchBrowse(deviceId, ref.nodeId);
  };

  /**
   * Volta a um nível específico do breadcrumb.
   * @param idx Índice do item na pilha de navegação
   */
  const goBackTo = async (idx: number) => {
    if (!deviceId) return;
    const newStack = browseStack.slice(0, idx + 1);
    setBrowseStack(newStack);
    await fetchBrowse(deviceId, newStack[newStack.length - 1].nodeId);
  };

  /**
   * Adiciona o `nodeId` do item escolhido na lista `mapMemory`.
   * 
   */
  const addFromBrowse = (ref: BrowseRef) => {
    if (!ref?.nodeId) return;
    setConfig((prev) => {
      if (prev.mapMemory.includes(ref.nodeId)) return prev;
      return { ...prev, mapMemory: [...prev.mapMemory, ref.nodeId] };
    });
  };

  // ====================== Ciclo de vida ======================

  /**
   * Efeito: carrega a configuração do client atual e o status de conexão.
   * - GET `/opcuaclientsetup/:deviceId`
   * - GET `/opcuaclient/status/:deviceId`
   */
  useEffect(() => {
    if (!deviceId) return;

    API.get(`/opcuaclientsetup/${encodeURIComponent(deviceId)}`)
      .then((res) => {
        setConfig((prev) => ({
          ...prev,
          ...res.data,
          mapMemory: res.data.mapMemory || [],
          namespace: Number.isFinite(res.data?.namespace)
            ? res.data.namespace
            : 3,
        }));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar configuração OPC UA:", err);
        setLoading(false);
      });

    fetchStatus(deviceId);
  }, [deviceId]);

  /**
   * Consulta de status de conexão (conectado vs. desconectado).
   * @param id Client atual (ex.: "Client01")
   */
  const fetchStatus = (id: string) => {
    API.get<{ connected: boolean }>(
      `/opcuaclient/status/${encodeURIComponent(id)}`
    )
      .then((res) => setConnected(!!res.data.connected))
      .catch(() => setConnected(false));
  };

  /**
   * Efeito: atalhos do teclado dentro do modal de confirmação
   * (Escape para fechar, Enter para confirmar).
   */
  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeConfirm();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmOpen]);

  /** Abre o modal de confirmação com as opções informadas. */
  const openConfirm = (opts: ConfirmOptions) => {
    setConfirmTitle(opts.title);
    setConfirmText(opts.text);
    setConfirmLabel(opts.confirmLabel || "Confirmar");
    setConfirmVariant(opts.variant || "default");
    confirmActionRef.current = opts.onConfirm;
    setConfirmOpen(true);
  };

  /** Fecha o modal de confirmação. */
  const closeConfirm = () => setConfirmOpen(false);

  /** Dispara a ação de confirmação atualmente registrada. */
  const handleConfirm = async () => {
    const fn = confirmActionRef.current;
    closeConfirm();
    try {
      await fn?.();
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Handler genérico de inputs:
   * - Converte valores de campos listados em `numericFields` para número.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: numericFields.has(name as any)
        ? value === ""
          ? 0
          : parseInt(value, 10)
        : value,
    }));
  };

  /** Adiciona manualmente um NodeId em `mapMemory` (modo legado). */
  const handleAddMemory = () => {
    const v = newMemory.trim();
    if (!v) return;
    setConfig((prev) => ({ ...prev, mapMemory: [...prev.mapMemory, v] }));
    setNewMemory("");
  };

  /**
   * Abre confirmação de remoção de um item de `mapMemory` e efetiva a remoção.
   * @param index Índice do chip
   * @param item  NodeId exibido no chip
   */
  const confirmRemoveMemory = (index: number, item: string) => {
    openConfirm({
      title: "Confirmar remoção",
      text: "Deseja remover este item da gravação no banco de dados MongoDB?",
      confirmLabel: "Remover",
      variant: "danger",
      onConfirm: () => {
        setConfig((prev) => ({
          ...prev,
          mapMemory: prev.mapMemory.filter((_, i) => i !== index),
        }));
      },
    });
  };

  /**
   * Submit do formulário: salva a configuração no backend e recarrega os dados
   * para garantir que o estado local reflita a versão persistida.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId) {
      alert("Nenhum client selecionado.");
      return;
    }
    openConfirm({
      title: "Salvar configurações",
      text: `Deseja Salvar os dados de conexão do client correspondente? (ID: ${deviceId})`,
      confirmLabel: "Salvar",
      variant: "default",
      onConfirm: async () => {
        setSaving(true);
        try {
          await API.post("/opcuaclientsetup", { deviceId, ...config });
          const { data: fresh } = await API.get(
            `/opcuaclientsetup/${encodeURIComponent(deviceId)}`
          );
          setConfig((prev) => ({
            ...prev,
            ...fresh,
            mapMemory: fresh.mapMemory || [],
          }));
          alert("Configurações salvas com sucesso!");
        } catch (err) {
          console.error("Erro ao salvar configuração OPC UA:", err);
          alert("Erro ao salvar configurações.");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  /**
   * Alterna o estado da coleta de dados (start/stop) do client atual.
   * - Reconsulta o status após a operação para refletir o estado real.
   */
  const handleToggle = async () => {
    if (!deviceId) {
      alert("Nenhum client selecionado.");
      return;
    }

    const isStopping = connected;
    openConfirm({
      title: isStopping ? "Desativar coleta" : "Ativar coleta",
      text: isStopping
        ? "Deseja Desativar a coleta de dados?"
        : "Deseja Ativar a coleta de dados?",
      confirmLabel: isStopping ? "Desativar" : "Ativar",
      variant: isStopping ? "danger" : "default",
      onConfirm: async () => {
        setToggling(true);
        try {
          if (isStopping) {
            await API.post(`/opcuaclient/${encodeURIComponent(deviceId)}/stop`);
          } else {
            await API.post(
              `/opcuaclient/${encodeURIComponent(deviceId)}/start`
            );
          }
          fetchStatus(deviceId);
        } catch (err) {
          console.error("Erro ao alternar comunicação OPC UA:", err);
          alert("Não foi possível alterar o estado da comunicação.");
        } finally {
          setToggling(false);
        }
      },
    });
  };

  if (loading) return <p>Carregando configuração...</p>;

  return (
    <Container>
      <h1>OPCUA Client Configuration</h1>

      <form
        onSubmit={handleSubmit}
        aria-label="OPC UA configuration form"
      >
        <FormGrid>
          {/* Campos principais */}
          <FormGroup>
            <Label htmlFor="applicationName">Application Name</Label>
            <Input
              id="applicationName"
              name="applicationName"
              value={config.applicationName}
              onChange={handleChange}
              placeholder="Application Name"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="endpoint">Endpoint</Label>
            <Input
              id="endpoint"
              name="endpoint"
              value={config.endpoint}
              onChange={handleChange}
              placeholder="opc.tcp://host:porta"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="initialDelay">Initial Delay (ms)</Label>
            <Input
              id="initialDelay"
              name="initialDelay"
              type="number"
              value={config.initialDelay}
              onChange={handleChange}
              placeholder="0"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="maxRetry">Max Retry</Label>
            <Input
              id="maxRetry"
              name="maxRetry"
              type="number"
              value={config.maxRetry}
              onChange={handleChange}
              placeholder="0"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="maxDelay">Max Delay (ms)</Label>
            <Input
              id="maxDelay"
              name="maxDelay"
              type="number"
              value={config.maxDelay}
              onChange={handleChange}
              placeholder="0"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="securityMode">Security Mode</Label>
            <Input
              id="securityMode"
              name="securityMode"
              type="number"
              value={config.securityMode}
              onChange={handleChange}
              placeholder="0"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="securityPolicy">Security Policy</Label>
            <Input
              id="securityPolicy"
              name="securityPolicy"
              type="number"
              value={config.securityPolicy}
              onChange={handleChange}
              placeholder="0"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="namespace">Namespace</Label>
            <Input
              id="namespace"
              name="namespace"
              type="number"
              value={config.namespace}
              onChange={handleChange}
              placeholder="3"
            />
          </FormGroup>

          {/* Map Memory + Browse */}
          <FormGroup style={{ gridColumn: "1 / -1" }}>
            <Label htmlFor="mapMemory">Map Memory</Label>

            {/* Botão para abrir o browser (navegação OPC UA) */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <AddButton
                type="button"
                onClick={openBrowse}
                aria-label="Browse by name"
              >
                <Plus size={16} />
                Browse by name (Browse)
              </AddButton>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Input
                id="mapMemory"
                type="text"
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMemory();
                  }
                }}
                placeholder="(Legacy) Manually add a NodeId and press Enter."
                aria-describedby="mapMemoryHelp"
              />
              <AddButton
                type="button"
                onClick={handleAddMemory}
                aria-label="Add memory"
              >
                <Plus size={16} />
                Add
              </AddButton>
            </div>

            <ChipList role="list" aria-label="Add memories">
              {config.mapMemory.map((item, index) => (
                <Chip key={`${item}-${index}`} role="listitem" title={item}>
                  {item}
                  <ChipRemove
                    type="button"
                    onClick={() => confirmRemoveMemory(index, item)}
                    aria-label={`Remove ${item}`}
                    title="Remove"
                  >
                    <X size={14} />
                  </ChipRemove>
                </Chip>
              ))}
            </ChipList>
          </FormGroup>
        </FormGrid>

        <ActionsRow>
          <SubmitButton type="submit" disabled={saving}>
            <Save size={16} />
            {saving ? "Saving..." : "Save"}
          </SubmitButton>

          <ToggleButton
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            active={connected}
            data-variant={connected ? "danger" : "default"}
            title={connected ? "Deactivate collector" : "Activate collector"}
          >
            <StatusDot
              active={connected}
              data-status={connected ? "on" : "off"}
            />
            <Power size={16} />
            {toggling ? "Process.." : connected ? "Deactivate" : "Activate"}
          </ToggleButton>
        </ActionsRow>
      </form>

      {/* ===== Modal genérico de confirmação ===== */}
      {confirmOpen && (
        <MsgboxOverlay
          role="dialog"
          aria-modal="true"
          aria-labelledby="msgbox-title"
          onClick={closeConfirm}
        >
          <MsgboxCard onClick={(e) => e.stopPropagation()}>
            <MsgboxTitle id="msgbox-title">{confirmTitle}</MsgboxTitle>
            <MsgboxText>{confirmText}</MsgboxText>
            <MsgboxActions>
              <MsgboxCancelButton type="button" onClick={closeConfirm}>
                Cancel
              </MsgboxCancelButton>
              <MsgboxButton
                type="button"
                data-variant={confirmVariant}
                onClick={handleConfirm}
                autoFocus
              >
                {confirmLabel}
              </MsgboxButton>
            </MsgboxActions>
          </MsgboxCard>
        </MsgboxOverlay>
      )}

      {/* ===== Modal de Browse (navegação de nós OPC UA) ===== */}
      {browseError && (
        <MsgboxText style={{ color: "#ffb4a9", marginBottom: 8 }}>
          {browseError.includes("indisponível") ||
          browseError.includes("não conectado")
            ? `Não foi possível navegar: o client pode não estar conectado. Ative a coleta do client "${deviceId}" e tente novamente.`
            : `Erro: ${browseError}`}
        </MsgboxText>
      )}

      {browseOpen && (
        <MsgboxOverlay
          role="dialog"
          aria-modal="true"
          aria-labelledby="browse-title"
          onClick={closeBrowse}
        >
          <MsgboxCard onClick={(e) => e.stopPropagation()}>
            <MsgboxTitle id="browse-title">
              Browse by name (Browse)
            </MsgboxTitle>

            {/* Breadcrumb */}
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              {browseStack.map((b, i) => (
                <button
                  key={b.nodeId + i}
                  onClick={() => goBackTo(i)}
                  type="button"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                  title={b.nodeId}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {browseError && (
              <MsgboxText style={{ color: "#ffb4a9", marginBottom: 8 }}>
                {browseError.includes("indisponível") ||
                browseError.includes("não conectado")
                  ? `Não foi possível navegar: o client pode não estar conectado. Ative a coleta do client "${deviceId}" e tente novamente.`
                  : `Erro: ${browseError}`}
              </MsgboxText>
            )}

            {/* Lista de filhos do nó atual */}
            <div style={{ maxHeight: 360, overflow: "auto", paddingRight: 6 }}>
              {browseItems.length === 0 ? (
                <MsgboxText>Nenhum item neste nível.</MsgboxText>
              ) : (
                browseItems.map((ref) => (
                  <div
                    key={ref.nodeId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                    title={ref.nodeId}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong>{ref.displayName || ref.browseName}</strong>
                      <small style={{ opacity: 0.7 }}>
                        {ref.nodeClass} — {ref.browseName}
                      </small>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <MsgboxButton
                        type="button"
                        onClick={() => goDeeper(ref)}
                        title="Abrir"
                      >
                        Open
                      </MsgboxButton>
                      <MsgboxButton
                        type="button"
                        data-variant="danger"
                        onClick={() => addFromBrowse(ref)}
                        title="Adicionar ao Map Memory"
                      >
                        Add
                      </MsgboxButton>
                    </div>
                  </div>
                ))
              )}
            </div>

            <MsgboxActions>
              <MsgboxCancelButton type="button" onClick={closeBrowse}>
                Close
              </MsgboxCancelButton>
            </MsgboxActions>
          </MsgboxCard>
        </MsgboxOverlay>
      )}
    </Container>
  );
};

export default OpcuaClientForm;
