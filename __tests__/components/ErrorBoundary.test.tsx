import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';


function NormalChild() {
  return <Text>Conteúdo normal</Text>;
}

function CrashingChild(): React.ReactElement {
  throw new Error('Falha simulada');
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <NormalChild />
      </ErrorBoundary>,
    );

    expect(getByText('Conteúdo normal')).toBeTruthy();
  });

  it('shows the fallback UI when a child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <CrashingChild />
      </ErrorBoundary>,
    );

    expect(getByText('Algo deu errado')).toBeTruthy();
    expect(getByText('Tentar novamente')).toBeTruthy();
  });

  it('displays the thrown error message in the fallback UI', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <CrashingChild />
      </ErrorBoundary>,
    );

    expect(getByText('Falha simulada')).toBeTruthy();
  });

  it('calls console.error with the error details (componentDidCatch)', () => {
    render(
      <ErrorBoundary>
        <CrashingChild />
      </ErrorBoundary>,
    );

    expect(console.error).toHaveBeenCalledWith(
      '[ErrorBoundary]',
      'Falha simulada',
      expect.any(String),
    );
  });

  it('recovers and renders children after "Tentar novamente" is pressed', () => {
    let shouldThrow = true;

    function TogglableChild() {
      if (shouldThrow) throw new Error('Falha simulada');
      return <Text>Recuperado</Text>;
    }

    const { getByText } = render(
      <ErrorBoundary>
        <TogglableChild />
      </ErrorBoundary>,
    );

    expect(getByText('Algo deu errado')).toBeTruthy();

    shouldThrow = false;
    fireEvent.press(getByText('Tentar novamente'));

    expect(getByText('Recuperado')).toBeTruthy();
  });
});
