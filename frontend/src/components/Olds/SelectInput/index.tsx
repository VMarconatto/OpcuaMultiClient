import React from "react";

import { Container} from "./style";
export interface ISelectInputProps {
  options: Array<{ label: string; value: string }>;
  children?: React.ReactNode;
  fruts?: Array<{ label: string; value: string }>;
  onChange(event:React.ChangeEvent<HTMLSelectElement>):void|undefined;
  defaultValue?:string|number;
  
}

const SelectInput: React.FC<ISelectInputProps> = ({
  options,
  children,
  onChange,
  defaultValue
}: ISelectInputProps) => {
  return (
    <Container isActive={true}>
      <select onChange={onChange} defaultValue={defaultValue}>
        {options.map((option) => (
          <option 
          key={option.value}
          value={option.value}>{option.label}</option>
        ))}
        {children}
      </select>
    </Container>
  );
};

export default SelectInput;
