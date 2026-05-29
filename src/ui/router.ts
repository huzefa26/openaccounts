export interface PageResult {
  html: string;
  mount?: (container: HTMLElement) => void;
}

export type PageHandler = () => Promise<PageResult>;

export class Router {
  private container: HTMLElement;
  private routes: Map<string, PageHandler>;
  private defaultRoute: string;
  private currentHash = '';

  constructor(
    container: HTMLElement,
    routes: Record<string, PageHandler>,
    defaultRoute = 'home',
  ) {
    this.container = container;
    this.routes = new Map(Object.entries(routes));
    this.defaultRoute = defaultRoute;
  }

  start(): void {
    window.addEventListener('hashchange', () => this.render());
    this.render();
  }

  navigate(hash: string): void {
    window.location.hash = hash;
  }

  private async render(): Promise<void> {
    const hash = window.location.hash.slice(1) || this.defaultRoute;
    if (hash === this.currentHash) return;
    this.currentHash = hash;

    const navLinks = document.querySelectorAll<HTMLLinkElement>(
      'a[data-nav]',
    );
    navLinks.forEach((link) => {
      link.classList.toggle(
        'active',
        link.getAttribute('href') === `#${hash}`,
      );
    });

    const handler = this.routes.get(hash);
    if (!handler) {
      this.container.innerHTML = '<p>Page not found</p>';
      return;
    }

    const result = await handler();
    this.container.innerHTML = result.html;
    result.mount?.(this.container);
  }
}
