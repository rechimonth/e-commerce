import { type ReactNode } from 'react';

export interface FooterProps {
  readonly brand?: string;
  readonly columns?: ReadonlyArray<{
    readonly title: string;
    readonly links: ReadonlyArray<{
      readonly label: string;
      readonly href: string;
    }>;
  }>;
  readonly copyright?: string;
  readonly socialLinks?: ReadonlyArray<ReactNode>;
}

export function Footer({ brand, columns, copyright, socialLinks }: FooterProps) {
  const year = new Date().getFullYear();
  const defaultCopyright = `© ${year} ${brand ?? 'E-Commerce'}. Todos los derechos reservados.`;

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 sm:gap-12 md:grid-cols-4">
          {brand && <div className="text-lg font-bold text-neutral-900">{brand}</div>}
          {columns?.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {socialLinks && <div className="mt-6 flex gap-4">{socialLinks}</div>}
        <p className="mt-8 border-t border-neutral-200 pt-4 text-center text-sm text-neutral-500">
          {copyright ?? defaultCopyright}
        </p>
      </div>
    </footer>
  );
}

export default Footer;
