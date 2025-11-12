import React, { useMemo, useState, useEffect } from "react";
import ContentHeader from "../../components/ContentHeader";
import { Container, Content, Filters } from "./styled";
import { IContentHeaderProps } from "../../components/ContentHeader";
import SelectInput, { ISelectInputProps } from "../../components/Olds/SelectInput";
import HistoryFinanceCard from "../../components/HistoryAlertsCard";
import { IHistoryAlertsCard } from "../../components/HistoryAlertsCard";
import { SelectWrapper } from "../../components/Olds/SelectInput/style";
import { useParams } from "react-router-dom";
import formatCurrency from "../../utils/formatCurrency";
import formatDate from "../../utils/formatDate";
import listmonths from "../../utils/months";

interface IRouteParams {
  math?: {
    params: {
      type: string;
    };
  };
}
interface IData {
  id: string;
  description: string;
  amountFormatted: string;
  frenquency: string;
  dataFormatted: string;
  tagColor?: string;
}

type ExpenseType = {
  description: string;
  amount: string;
  date: string;
  type: string;
  frequency: string;
};

const List: React.FC<
  ISelectInputProps & IContentHeaderProps & IRouteParams & IHistoryAlertsCard
> = ({ children, controllers }) => {
  const [data, setData] = useState<IData[]>([]);

  const [monthSelected, setMonthSelected] = useState<number>(
    new Date().getMonth() + 1
  );

  const [yearSelected, setYearSelected] = useState<number>(
    new Date().getFullYear()
  );

  const [selectedFrequency, SetSelectedFrequency] = useState<string[]>([]);

  const [gains, setGains] = useState<ExpenseType[]>([]);
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);

  const { type } = useParams<{ type: string }>();

  const title = useMemo(() => {
    return type === "entry-balance" ? "Entradas" : "Saídas";
  }, [type]);

  const lineColor = useMemo(() => {
    return type === "entry-balance" ? "#F7931B" : "#E44C4E";
  }, [type]);

  const listData = useMemo(() => {
  if (type === "entry-balance") return gains;
  if (type === "exit-balance") return expenses;
  return []; // fallback se o tipo for indefinido ou inválido
}, [type, gains, expenses]);



  const months = useMemo(() => {
    return listmonths.map((month, index) => {
      return {
        value: String(index + 1),
        label: String(month),
      };
    });
  }, []);

  const years = useMemo(() => {
  let uniqueYears: number[] = [];

  if (!Array.isArray(listData)) return [];

  listData.forEach((i) => {
    const date = new Date(i.date);
    const year = date.getFullYear();

    if (!uniqueYears.includes(year)) {
      uniqueYears.push(year);
    }
  });

  return uniqueYears.map((year) => ({
    value: String(year),
    label: String(year),
  }));
}, [listData]);


  const handleFrequencyClick = (frequency: string) => {
    const alreadySelected = selectedFrequency.findIndex(
      (item) => item === frequency
    );
    if (alreadySelected >= 0) {
      console.log("Já Está Selecionado");
      const filtered = selectedFrequency.filter((item) => item !== frequency);
      SetSelectedFrequency(filtered);
    } else {
      console.log("Frequência selecionada Agora");
      SetSelectedFrequency((prev) => [...prev, frequency]);
    }
  };

  const handleMonthSelected = (month: string) => {
    try {
      const parseMonth = Number(month);
      setMonthSelected(parseMonth);
    } catch (e) {
      throw new Error(`Invalid Month Value ${e}`);
    }
  };

  const handleYearSelected = (year: string) => {
    try {
      const parseYear = Number(year);
      setYearSelected(parseYear);
    } catch (e) {
      throw new Error(`Invalid Month Value ${e}`);
    }
  };
  
  useEffect(() => {
  const fetchData = async () => {
    try {
      const gainsResponse = await fetch("http://localhost:3000/data/gains");
      const gainsData = await gainsResponse.json();
      setGains(gainsData);

      const expensesResponse = await fetch("http://localhost:3000/data/expenses");
      const expensesData = await expensesResponse.json();
      setExpenses(expensesData);
    } catch (error) {
      console.error("Erro ao buscar dados do backend:", error);
    }
  };

  fetchData();
}, []);


  useEffect(() => {
  if (listData.length === 0 || selectedFrequency.length === 0) return;

  const filteredData = listData.filter((item) => {
    const date = new Date(item.date);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return (
      month === monthSelected &&
      year === yearSelected &&
      selectedFrequency.includes(item.frequency)
    );
  });

  const response = filteredData.map((item) => ({
    id: String(new Date().getTime()) + item.amount,
    description: item.description,
    amountFormatted: formatCurrency(Number(item.amount)),
    frenquency: item.frequency,
    dataFormatted: formatDate(item.date),
    tagColor: item.frequency === "recorrente" ? "#4E41F0" : "#E44C4E",
  }));

  setData(response);
}, [listData, monthSelected, yearSelected, selectedFrequency]);


  return (
    <Container>
      <ContentHeader
        title={title}
        lineColor={lineColor}
        controllers={controllers}
        children
      ></ContentHeader>
      <SelectWrapper>
        <SelectInput
          options={months}
          children={children}
          onChange={(e) => handleMonthSelected(e.target.value)}
          defaultValue={monthSelected}
        />
        <SelectInput
          options={years}
          children={children}
          onChange={(e) => handleYearSelected(e.target.value)}
          defaultValue={yearSelected}
        />
      </SelectWrapper>
      <Filters>
        <button
          type="button"
          className="tag-filter-recurrent"
          onClick={() => handleFrequencyClick("recorrente")}
        >
          Recorrentes
        </button>
        <button
          type="button"
          className="tag-filter-eventuals"
          onClick={() => handleFrequencyClick("eventual")}
        >
          Eventuais
        </button>
      </Filters>

      <Content>
        {data.map((item) => (
          <HistoryFinanceCard
            key={item.id}
            tagColor={item.tagColor ?? "#E44C4E"}
            title={item.description}
            subtitle={item.dataFormatted}
            amount={item.amountFormatted}
            children={children}
          />
        ))}
      </Content>
    </Container>
  );
};

export default List;
