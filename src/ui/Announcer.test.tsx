import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { Announcer } from './Announcer';

// Contrato assumido de Announcer (o dev implementa; decisão registrada no retorno do RED):
//   <Announcer announcement={Announcement | null} />   // Announcement vem de model/reducer
// Renderiza uma única região role="status" (aria-live="polite") e, dentro dela, um único
// elemento filho com key={announcement.id} contendo o texto; com null a região fica vazia.

afterEach(cleanup);

describe('Announcer', () => {
  it('CA-005-31: é uma única região role=status educada', () => {
    render(<Announcer announcement={null} />);
    const regions = screen.getAllByRole('status');
    expect(regions).toHaveLength(1);
    expect(regions[0]?.getAttribute('aria-live')).toBe('polite');
  });

  it('CA-005-31: com announcement null a região fica vazia', () => {
    render(<Announcer announcement={null} />);
    expect(screen.getByRole('status').textContent).toBe('');
    expect(screen.getByRole('status').childElementCount).toBe(0);
  });

  it('CA-005-31: mostra o texto do anúncio', () => {
    render(<Announcer announcement={{ id: 1, text: 'Linha 1, coluna 3, 4' }} />);
    expect(screen.getByRole('status').textContent).toBe('Linha 1, coluna 3, 4');
  });

  it('CA-005-31: dois anúncios seguidos deixam só o texto do último (substitui, não enfileira)', () => {
    const { rerender } = render(<Announcer announcement={{ id: 1, text: 'primeiro' }} />);
    rerender(<Announcer announcement={{ id: 2, text: 'segundo' }} />);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('segundo');
    expect(status.childElementCount).toBe(1);
  });

  it('CA-005-31: mesmo texto com id novo remonta o nó filho (referência muda, texto igual)', () => {
    const texto = 'pista, não pode ser alterada';
    const { rerender } = render(<Announcer announcement={{ id: 1, text: texto }} />);
    const antes = screen.getByRole('status').firstElementChild;
    expect(antes).not.toBeNull();
    rerender(<Announcer announcement={{ id: 2, text: texto }} />);
    const depois = screen.getByRole('status').firstElementChild;
    expect(depois).not.toBeNull();
    expect(depois).not.toBe(antes);
    expect(depois?.textContent).toBe(texto);
    expect(screen.getByRole('status').childElementCount).toBe(1);
  });

  it('CA-005-31: mesmo id mantém o nó (não relê sem anúncio novo)', () => {
    const { rerender } = render(<Announcer announcement={{ id: 1, text: 'igual' }} />);
    const antes = screen.getByRole('status').firstElementChild;
    rerender(<Announcer announcement={{ id: 1, text: 'igual' }} />);
    expect(screen.getByRole('status').firstElementChild).toBe(antes);
  });

  it('CA-005-31: passar a null esvazia a região sem anúncio novo', () => {
    const { rerender } = render(<Announcer announcement={{ id: 1, text: 'algo' }} />);
    rerender(<Announcer announcement={null} />);
    expect(screen.getByRole('status').textContent).toBe('');
    expect(screen.getByRole('status').childElementCount).toBe(0);
  });
});
