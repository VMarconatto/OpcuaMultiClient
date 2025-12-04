import styled from "styled-components";

export const Container = styled.div``;

export const Content = styled.main`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 20px;
`;

export const Filters = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 30px;
  gap: 10px;

  select {
    padding: 5px 10px;
    border-radius: 4px;
    border: 1px solid #ccc;
  }

  button {
    font-size: 16px;
    background: none;
    border: none;
    padding: 6px 10px;
    opacity: 0.4;
    cursor: pointer;
    transition: opacity 0.3s;
    border-bottom: 3px solid transparent;

    &:hover {
      opacity: 1;
    }
  }

  .tag-filter-above {
    color: #4e41f0;
  }

  .tag-filter-below {
    color: #e44c4e;
  }

  .tag-filter-all {
    color: #ccc;
  }

  .tag-filter-above.active {
    opacity: 1;
    border-bottom-color: #4e41f0;
    font-weight: bold;
  }

  .tag-filter-below.active {
    opacity: 1;
    border-bottom-color: #e44c4e;
    font-weight: bold;
  }

  .tag-filter-all.active {
    opacity: 1;
    border-bottom-color: #ccc;
    font-weight: bold;
  }
`;

export const Pagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  gap: 8px;

  button {
    background-color: #f0f0f0;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #e0e0e0;
    }

    &.active {
      background-color: #f7931b;
      color: white;
      font-weight: bold;
    }
  }
`;
