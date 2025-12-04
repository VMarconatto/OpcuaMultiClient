import styled from "styled-components";

const italianRed = "#950202ff";
const italianWhite = "rgba(106, 88, 88, 0.99)";
const italianGreen = "#036113ff";


//Container BackGround Colors

const BackgroundColorLeft = "#444445ff";
const BackgroundColorMiddle = "#444445ff";
const BackgroundColorRight = "#444445ff";

export const Container = styled.div`
  /* CSS vars derivadas do tema para facilitar fine-tuning */
  --bg: ${({ theme }) => theme.content};
  --ink: ${({ theme }) => theme.textPrimary};
  --muted: ${({ theme }) => (theme as any).textSecondary || "rgba(255,255,255,.72)"};
  --card-bg: ${({ theme }) => theme.content}; /* sem azul: superfície em preto/grafite */
  --card-border: ${({ theme }) => theme.accent2};

  /* cores de severidade (fallbacks elegantes) */
  --chip-hh: rgba(224, 49, 49, 0.18);  /* vermelho  */
  --chip-h:  rgba(250, 176, 5,  0.18); /* âmbar    */
  --chip-l:  rgba(18, 184, 134, 0.18); /* teal/verde */
  --chip-ll: rgba(34, 139, 230, 0.18); /* azul frio */

  --chip-hh-bd: rgba(224, 49, 49, 0.50);
  --chip-h-bd:  rgba(250, 176, 5,  0.50);
  --chip-l-bd:  rgba(18, 184, 134, 0.50);
  --chip-ll-bd: rgba(34, 139, 230, 0.50);

  padding: 1rem;
  border-radius: 14px;
  background:
    /* vinheta/contraste — focalizada à direita (onde ficam os ícones) */
    radial-gradient(10% 220% at 78% 50%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,0.32) 78%,
      rgba(0,0,0,0.48) 100%),
    /* degradê principal Itália */
    linear-gradient(135deg, ${BackgroundColorLeft},${BackgroundColorMiddle},${BackgroundColorRight});
  background-blend-mode: overlay, normal;
  color: var(--ink);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.22);
  max-height: 1200px;
  overflow-y: auto;

  /* scrollbar dark elegante */
  &::-webkit-scrollbar { width: 10px; }
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.05));
    border: 2px solid transparent;
    background-clip: padding-box;
    border-radius: 999px;
  }
  &::-webkit-scrollbar-track { background: transparent; }
`;

export const Header = styled.h2`
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: .25px;
  margin: 0 0 .9rem 0;
  color: var(--ink);
  position: relative;

  &:after {
    content: "";
    display: block;
    height: 2px;
    width: 64px;
    margin-top: .4rem;
    background: ${({ theme }) => theme.accent2};
    opacity: .6;
    border-radius: 2px;
  }
`;

export const AlertCard = styled.div`
  background:
    /* vinheta/contraste — focalizada à direita (onde ficam os ícones) */
    radial-gradient(0% 220% at 78% 50%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,0.32) 78%,
      rgba(0,0,0,0.48) 100%),
    /* degradê principal Itália */
    linear-gradient(135deg, ${italianGreen},${italianWhite},${italianRed});
  background-blend-mode: overlay, normal;              /* 👈 sai o azul do accent, entra a base escura */
  border: 1px solid var(--card-border);
  padding: 0.9rem 1rem;
  margin-bottom: 0.9rem;
  border-radius: 12px;
  /* box-shadow: 0 6px 18px rgba(203, 2, 2, 0.94); */
  transition: border-color .12s ease, transform .08s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(255,255,255,.2);
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: .75rem;
  margin-bottom: .4rem;
`;

export const TagName = styled.div`
  font-weight: 800;
  font-size: 1rem;
  line-height: 1.2;
  max-width: 70%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

export const Value = styled.div`
  font-size: .95rem;
  opacity: .95;

  strong { font-weight: 800; }
`;

export const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  margin: .25rem 0 .55rem 0;
`;

export const Badge = styled.span`
  display: inline-block;
  border-radius: 999px;
  padding: .22rem .65rem;
  font-size: .8rem;
  background: rgba(255,255,255, .035);
  border: 1px solid rgba(255,255,255, .14);
  color: var(--ink);

  /* cores por severidade via data-attribute */
  &[data-level="HH"] {
    background: var(--chip-hh);
    border-color: var(--chip-hh-bd);
  }
  &[data-level="H"] {
    background: var(--chip-h);
    border-color: var(--chip-h-bd);
  }
  &[data-level="L"] {
    background: var(--chip-l);
    border-color: var(--chip-l-bd);
  }
  &[data-level="LL"] {
    background: var(--chip-ll);
    border-color: var(--chip-ll-bd);
  }
`;

export const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  font-size: .86rem;
  color: var(--muted);
  margin: .1rem 0 .55rem 0;

  span { white-space: nowrap; }
`;

export const Timestamp = styled.p`
  font-weight: 700;
  margin: .2rem 0 .2rem 0;
  color: var(--ink);
`;

export const Recipients = styled.p`
  font-style: italic;
  font-size: 0.9rem;
  margin: 0;
  opacity: .9;
  color: var(--muted);
`;

export const EmptyState = styled.div`
  padding: 1.25rem;
  border: 1px dashed var(--card-border);
  border-radius: 12px;
  text-align: center;
  color: var(--muted);
`;

export const ErrorBox = styled.div`
  padding: .95rem 1rem;
  border-radius: 12px;
  background: rgba(255, 72, 72, .1);
  border: 1px solid rgba(255, 72, 72, .35);
  color: var(--ink);
  margin-bottom: .8rem;
`;

export const Loading = styled.div`
  padding: .6rem 0;
  opacity: .85;
`;
