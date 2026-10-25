import { useState } from 'react';
import { shorten } from '../data';

const COPIED_MS = 1400;

function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = (text: string): void => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPIED_MS);
    });
  };
  return [copied, copy];
}

interface AddressProps {
  address: string;
  full?: boolean;
}

/** An address that copies itself on click; shortened unless `full` is set. */
export function Address({ address, full = false }: AddressProps) {
  const [copied, copy] = useCopy();
  return (
    <button
      type="button"
      className={`address${copied ? ' is-copied' : ''}`}
      onClick={() => copy(address)}
      title={`Copy ${address}`}
      aria-label={`Copy address ${address}`}
    >
      <span className="address-text">{full ? address : shorten(address)}</span>
      <span className="address-hint" aria-live="polite">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

interface CodeBlockProps {
  code: string;
  caption?: string;
}

export function CodeBlock({ code, caption }: CodeBlockProps) {
  const [copied, copy] = useCopy();
  return (
    <figure className="code">
      <div className="code-bar">
        <figcaption>{caption}</figcaption>
        <button type="button" className="code-copy" onClick={() => copy(code)}>
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
