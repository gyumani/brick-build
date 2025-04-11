import React from 'react';
import GameBoard from './components/GameBoard';
import styled from 'styled-components';

const AppContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #1a1a1a;
`;

function App() {
  return (
    <AppContainer>
      <GameBoard />
    </AppContainer>
  );
}

export default App;
