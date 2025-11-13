import styled from "styled-components";

export const Container = styled.div`
margin-bottom:-1000px;

`
export const Content = styled.div`

`
export const Filters = styled.div`
width:100%;
display:flex;
justify-content:center;
margin-bottom:30px;


.tag-filter-recurrent{
    font-size:18px;
    font-weight:500;
    background:none;
    color:${props => props.theme.textPrimary};

    margin:0 10px;
    transition:opacity .7s;

    &:hover{
        opacity:.10;
    }
    &:after{
        content:'';
        display:block;
        margin:0 auto;
        border-bottom:10px solid ${props => props.theme.accent};
    }

}
.tag-filter-eventuals{
    font-size:18px;
    font-weight:500;
    background:none;
    color:${props => props.theme.textPrimary};

    margin:0 10px;
    transition:opacity .7s;

    &:hover{
        opacity:.10;
    }
    &:after{
        content:'';
        display:block;
        margin:0 auto;
        border-bottom:10px solid ${props => props.theme.danger};
    }
 .tag-actived{
    opacity:1   
 }
}
`
