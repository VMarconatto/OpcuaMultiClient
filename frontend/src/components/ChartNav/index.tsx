/**
** =======================================================
@SECTION  : Charts — Chart Navigation Controls
@FILE     : src/components/ChartNav/index.tsx
@PURPOSE  : Renderizar botões de navegação SVG (← e →) diretamente
            dentro do gráfico Recharts, permitindo paginação/scroll
            entre janelas de dados.
@LAST_EDIT : 2025-11-11
** =======================================================
*/


/**
 * Componente de navegação (botões anteriores/próximos)
 * desenhado diretamente no SVG de um gráfico Recharts.
 *
 * - Recharts injeta dimensões e margens (`chartWidth`, `chartHeight`, `offset`)
 * - Este componente usa essas medidas para posicionar os botões.
 *
 * @param {object} props               Propriedades de controle e eventos.
 * @param {boolean} props.canPrev      Habilita/desabilita botão esquerdo.
 * @param {boolean} props.canNext      Habilita/desabilita botão direito.
 * @param {() => void} props.onPrev    Callback disparado ao clicar no botão esquerdo.
 * @param {() => void} props.onNext    Callback disparado ao clicar no botão direito.
 * @returns {JSX.Element | null}       Grupo `<g>` SVG com os botões, ou `null` se sem dimensões.
 */
const ChartNav: React.FC<{
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}> = (userProps) => {
  // Recharts injeta dimensões/margens aqui:
  // (v3: chartWidth/chartHeight/offset)  (v2: width/height/margin)
  // usamos todos com fallback seguro:
  
  const p: any = userProps;
  const W = p.chartWidth ?? p.width ?? p.viewBox?.width ?? 0;
  const H = p.chartHeight ?? p.height ?? p.viewBox?.height ?? 0;
  const M = p.offset ?? p.margin ?? { top: 0, right: 0, bottom: 0, left: 0 };

  if (!W || !H) return null; 

  const pad = 8;
  const r = 14;
  const xRight = W - ((M?.right ?? 0) + r + pad);
  const yTop   = (M?.top ?? 0) + r + pad;
  const gap    = r * 2 + 10;
  const xLeft  = xRight - gap;

  /**
   * Botão individual renderizado dentro do SVG.
   *
   * @param {object} params                 Parâmetros do botão.
   * @param {number} params.x               Posição X do centro.
   * @param {number} params.y               Posição Y do centro.
   * @param {boolean} params.enabled        Define se o botão está ativo.
   * @param {() => void} params.onClick     Função disparada ao clicar.
   * @param {"left" | "right"} params.dir   Direção da seta (esquerda/direita).
   * @returns {JSX.Element} Elemento `<g>` com círculo e polilinha SVG.
   */
  const Btn = (
    { x, y, enabled, onClick, dir }:
    { x: number; y: number; enabled: boolean; onClick: () => void; dir: "left" | "right" }
  ) => (
    <g
      transform={`translate(${x},${y})`}
      onClick={() => enabled && onClick()}
      style={{ cursor: enabled ? "pointer" : "not-allowed", pointerEvents: "all" }}
      opacity={enabled ? 1 : 0.4}
    >
      <circle r={r} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)" />
      {/* Chevron */}
      {dir === "left" ? (
        <polyline
          points="3,-6 -3,0 3,6"
          fill="none"
          stroke="#e6e6e6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <polyline
          points="-3,-6 3,0 -3,6"
          fill="none"
          stroke="#e6e6e6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </g>
  );

  return (
    <g>
      <Btn x={xLeft}  y={yTop} enabled={p.canPrev} onClick={p.onPrev} dir="left" />
      <Btn x={xRight} y={yTop} enabled={p.canNext} onClick={p.onNext} dir="right" />
    </g>
  );
};

export default ChartNav;
