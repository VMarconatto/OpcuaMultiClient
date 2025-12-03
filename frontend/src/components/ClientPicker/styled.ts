
import styled from "styled-components";

export const Wrapper = styled.div`
  position: relative;
  display: inline-block;
  overflow: visible; /* garante que nada corte o dropdown */
`;

export const ToggleButton = styled.button`
  background-color: #1e1e1e;
  color: #ccc;
  padding: 10px 16px;
  border-radius: 20px;
  border: 1px solid #333;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: #2a2a2a;
  }
`;


export const Dropdown = styled.div`
  position: absolute;
  top: 110%;
  right: 0;
  background: #1b1b1b;
  border: 1px solid #333;
  padding: 1rem;
  border-radius: 12px;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0,0,0,.6);
`;


export const SelectRow = styled.div`
  display: flex;
  gap: 1rem;
`;

export const StyledSelect = styled.select`
  padding: 0.5rem;
  background: #121212;
  color: #eee;
  border: 1px solid #444;
  border-radius: 8px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #f7931b;
  }
`;
