import styled from "styled-components";
import Switch, { ReactSwitchProps } from 'react-switch'


export const Container = styled.div`
display:flex;
align-items:center;
`;

export const ToggleLabel = styled.span`
color:${props=>props.theme.textPrimary};

`

export const ToggleSelector = styled(Switch).attrs((props) => ({
    uncheckedIcon: props.uncheckedIcon,
    checkedIcon: props.checkedIcon,
    onColor: props.theme.accent2,
    offColor: props.theme.danger,
})) <ReactSwitchProps>``;



// export const ToggleSelector = styled(Switch).attrs<ReactSwitchProps>(

//     ({theme}) => ({
//         onColor: theme.colors.info,
//         offColor: theme.colors.warning,

//     }))<ReactSwitchProps>