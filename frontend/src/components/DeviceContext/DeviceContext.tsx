/**
** =======================================================
@SECTION  : React Context — Device Selector
@FILE     : src/contexts/DeviceContext.tsx
@PURPOSE  : Fornecer contexto global para identificação e troca do device
            ativo (deviceId) no frontend.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React, { createContext, useState, useContext } from "react";

/**
 * Estrutura do contexto para seleção de dispositivo.
 *
 * @property deviceId - Identificador do device atualmente selecionado.
 * @property setDeviceId - Função para atualizar o `deviceId` global.
 *
 * @remarks
 * - O `deviceId` é usado por componentes que precisam filtrar dados por
 *   dispositivo no dashboard (consultas, gráficos, KPIs, etc.).
 * - Use `useDevice()` dentro de componentes filhos de `DeviceProvider`
 *   para acessar/alterar o valor.
 */
type DeviceContextType = {
  deviceId: string;
  setDeviceId: (id: string) => void;
};

/**
 * Contexto do Device.
 *
 * @info
 * O contexto é inicializado como `undefined` para permitir validação
 * em `useDevice()` e emitir um erro claro quando usado fora do provider.
 */
const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

/**
 * Provedor do contexto de Device.
 *
 * @param props - Propriedades do componente.
 * @param props.children - Árvore de elementos que terá acesso ao contexto.
 * @returns JSX.Element que envolve os filhos com `DeviceContext.Provider`.
 *
 * @note
 * O valor inicial do `deviceId` é `"device01"`. Ajuste para refletir o
 * padrão da sua aplicação (ex.: pegar do storage, rota, querystring).
 */
export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceId, setDeviceId] = useState<string>("device01"); // valor inicial

  return (
    <DeviceContext.Provider value={{ deviceId, setDeviceId }}>
      {children}
    </DeviceContext.Provider>
  );
};

/**
 * Hook de acesso ao contexto de Device.
 *
 * @returns Objeto com `deviceId` e `setDeviceId`.
 *
 * @throws Error se utilizado fora de um `<DeviceProvider>`.
 *
 * @remarks
 * Garanta que o componente que chama `useDevice()` esteja dentro
 * da árvore de `<DeviceProvider>`, tipicamente no topo da aplicação
 * ou em um layout de página.
 */
export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice deve ser usado dentro de DeviceProvider");
  }
  return context;
};
