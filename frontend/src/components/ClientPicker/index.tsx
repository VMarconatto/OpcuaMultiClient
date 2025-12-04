/**
** =======================================================
@SECTION  : UI — Client Picker (OPC UA)
@FILE     : src/components/ClientPicker/index.tsx
@PURPOSE  : Componente de seleção de Client (ex.: "Client01") obtido do backend.
            Abre dropdown, carrega lista via HTTP e notifica o pai por onChange.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Wrapper,
  ToggleButton,
  Dropdown,
  SelectRow,
  StyledSelect,
} from "./styled";

/**
 * Modelo de um Client retornado pelo backend.
 */
type Client = {
  id: string;
  applicationName: string;
  endpoint: string;
};

/**
 * Propriedades do componente ClientPicker.
 */
interface ClientPickerProps {
  /**
   * Valor controlado opcional (id do client selecionado).
   * Quando definido, o componente se mantém sincronizado com esse valor.
   */
  selectedClientId?: string;
  /**
   * Callback disparado ao selecionar um client.
   * @param {string} clientId ID do client escolhido (ex.: "Client01")
   * @returns {void}
   */
  onChange?: (clientId: string) => void;
  /**
   * Endpoint para carregar a lista de clients.
   * @default "http://localhost:3000/opcuaclientsetup"
   */
  apiUrl?: string;
  /**
   * Texto exibido quando nada está selecionado.
   * @default "Select client"
   */
  placeholder?: string;
}

/**
 * Seletor de Client (lista vinda do backend).
 *
 * ### Fluxo
 * 1) Busca a lista em `apiUrl` ao montar.
 * 2) Mantém estado controlado/semicontrolado (selectedId).
 * 3) Fecha o dropdown ao clicar fora.
 *
 * @param {ClientPickerProps} props Propriedades de controle do seletor.
 * @returns {JSX.Element} Toggle + dropdown com `<select>` para escolher Client.
 */
const ClientPicker: React.FC<ClientPickerProps> = ({
  selectedClientId,
  onChange,
  apiUrl = "http://localhost:3000/opcuaclientsetup",
  placeholder = "Select client",
}) => {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedClientId);
  const ref = useRef<HTMLDivElement>(null);

  /**
   * Sincroniza o valor controlado pelo pai, quando fornecido.
   */
  useEffect(() => {
    setSelectedId(selectedClientId);
  }, [selectedClientId]);

  /**
   * Carrega a lista de clients do backend.
   * @returns {Promise<void>} Promessa resolvida após atualizar `clients`.
   */
  useEffect(() => {
    const fetchConnections = async (): Promise<void> => {
      try {
        const res = await axios.get(apiUrl);
        const data = res?.data ?? {};
        const parsed: Client[] = Object.entries(data.clients || {}).map(
          ([id, config]: [string, any]) => ({
            id,
            applicationName: config?.applicationName ?? id,
            endpoint: config?.endpoint ?? "",
          })
        );
        setClients(parsed);
      } catch (err) {
        console.error("Erro ao carregar clients:", err);
        setClients([]);
      }
    };
    fetchConnections();
  }, [apiUrl]);

  /**
   * Fecha o dropdown ao clicar fora da área do componente.
   * @param {MouseEvent} e Evento de mouse do documento.
   * @returns {void}
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** Client atualmente selecionado (objeto completo). */
  const current = clients.find((c) => c.id === selectedId);
  /** Rótulo exibido no botão. */
  const label = current ? current.applicationName : placeholder;

  /**
   * Seleciona um client e notifica o pai via `onChange`.
   * @param {string} id ID do client escolhido.
   * @returns {void}
   */
  const handleSelect = (id: string): void => {
    setSelectedId(id);
    onChange?.(id);
    setOpen(false);
  };

  return (
    <Wrapper ref={ref}>
      <ToggleButton onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {label}
        <span>▼</span>
      </ToggleButton>

      {open && (
        <Dropdown>
          <SelectRow>
            <StyledSelect
              value={selectedId ?? ""}
              onChange={(e) => handleSelect(e.target.value)}
            >
              {!selectedId && <option value="">{placeholder}</option>}
              {clients.map((c) => (
                <option key={c.id} value={c.id} title={c.endpoint}>
                  {c.applicationName}
                </option>
              ))}
            </StyledSelect>
          </SelectRow>
        </Dropdown>
      )}
    </Wrapper>
  );
};

export default ClientPicker;
