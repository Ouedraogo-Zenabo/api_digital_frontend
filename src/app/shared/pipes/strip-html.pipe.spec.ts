import { StripHtmlPipe, stripHtml } from './strip-html.pipe';

describe('stripHtml', () => {
  it('renvoie une chaîne vide pour null / undefined / vide', () => {
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(undefined)).toBe('');
    expect(stripHtml('')).toBe('');
  });

  it('retire les balises HTML', () => {
    expect(stripHtml('<p>Bonjour <b>le</b> monde</p>')).toBe('Bonjour le monde');
  });

  it('décode les entités et normalise les espaces (dont &nbsp;)', () => {
    expect(stripHtml('a&nbsp;&nbsp;b&#39;c &amp; d')).toBe("a b'c & d");
  });

  it('laisse le texte brut intact', () => {
    expect(stripHtml('Texte simple')).toBe('Texte simple');
  });
});

describe('StripHtmlPipe', () => {
  it('délègue à la fonction stripHtml', () => {
    const pipe = new StripHtmlPipe();
    expect(pipe.transform('<span>x</span>')).toBe('x');
    expect(pipe.transform(null)).toBe('');
  });
});
