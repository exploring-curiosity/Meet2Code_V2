import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CodeEditor } from '../CodeEditor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Mock the monaco editor
jest.mock('@monaco-editor/react', () => {
  return {
    __esModule: true,
    default: ({ onMount }: { onMount: any }) => {
      // Simulate monaco editor mounting
      const mockEditor = {
        getModel: () => ({
          getValue: () => '',
          setValue: jest.fn(),
          onDidChangeContent: jest.fn(),
        }),
        updateOptions: jest.fn(),
      };
      const mockMonaco = {
        languages: {
          typescript: {
            javascriptDefaults: {
              setDiagnosticsOptions: jest.fn(),
              setCompilerOptions: jest.fn(),
              TypeScriptDefaults: {
                setDiagnosticsOptions: jest.fn(),
                setCompilerOptions: jest.fn(),
              },
            },
            ScriptTarget: { ESNext: 1, Latest: 1 },
            ModuleResolutionKind: { NodeJs: 1 },
            ModuleKind: { CommonJS: 1 },
            JsxEmit: { React: 1 },
          },
        },
        editor: {
          setModelLanguage: jest.fn(),
        },
      };
      onMount(mockEditor, mockMonaco);
      return <div data-testid="monaco-editor" />;
    },
  };
});

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark' }),
}));

// Mock Awareness and WebSocket provider
class MockAwareness {
  doc = new Y.Doc();
  states = new Map();
  meta = new Map();
  _checkInterval = 0;
  connected = true;
  clientID = 1;
  setLocalStateField = jest.fn();
  on = jest.fn();
  off = jest.fn();
  getStates = () => new Map();
  setLocalState = jest.fn();
  getLocalState = () => ({});
  destroy = jest.fn();
}

class MockWebsocketProvider {
  awareness = new MockAwareness();
  destroy = jest.fn();
}

jest.mock('y-websocket', () => ({
  WebsocketProvider: MockWebsocketProvider,
}));

describe('CodeEditor', () => {
  let doc: Y.Doc;
  let provider: WebsocketProvider;

  beforeEach(() => {
    doc = new Y.Doc();
    provider = new WebsocketProvider('ws://localhost:1234', 'test-room', doc);
    (provider as any).awareness = new MockAwareness();
  });

  afterEach(() => {
    doc.destroy();
    provider.destroy();
    jest.clearAllMocks();
  });

  it('renders the editor with correct initial props', () => {
    render(<CodeEditor doc={doc} provider={provider} />);
    
    expect(screen.getByText('Code workspace')).toBeInTheDocument();
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('supports language switching', () => {
    render(<CodeEditor doc={doc} provider={provider} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('javascript');
    
    act(() => {
      // Create a mock change event
      const event = new Event('change');
      Object.defineProperty(event, 'target', { value: { value: 'python' } });
      select.dispatchEvent(event);
    });
  });

  it('respects readOnly prop', () => {
    const { rerender } = render(
      <CodeEditor doc={doc} provider={provider} readOnly={true} />
    );

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeInTheDocument();

    rerender(<CodeEditor doc={doc} provider={provider} readOnly={false} />);
    expect(editor).toBeInTheDocument();
  });
});