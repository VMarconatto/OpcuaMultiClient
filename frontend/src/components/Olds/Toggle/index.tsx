import { useTheme } from "../../../hooks/theme";
import { Container, ToggleLabel, ToggleSelector } from "./styled";

const Toggle: React.FC = () => {
  const { toggleTheme, theme } = useTheme();

  const isDark = theme.title === "dark";

  return (
    <Container>
      <ToggleLabel>Light</ToggleLabel>
      <ToggleSelector
        checked={isDark}
        uncheckedIcon={false}
        checkedIcon={false}
        onChange={toggleTheme}
      />
      <ToggleLabel>Dark</ToggleLabel>
    </Container>
  );
};

export default Toggle;
